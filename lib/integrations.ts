// 3. parti sipariş kanalı (Yemeksepeti, Getir, Trendyol GO) entegrasyon yardımcıları.
// Webhook gövdeleri normalize kontrata çevrilir ve ingest_external_order RPC'sine iletilir.

export type IntegrationProvider = "yemeksepeti" | "getir" | "trendyol"

export interface IntegrationProviderInfo {
  id: IntegrationProvider
  name: string
  description: string
}

export const PROVIDERS: readonly IntegrationProviderInfo[] = [
  {
    id: "yemeksepeti",
    name: "Yemeksepeti",
    description: "Yemeksepeti siparişlerini otomatik olarak POS panelinize aktarın.",
  },
  {
    id: "getir",
    name: "Getir Yemek",
    description: "Getir Yemek siparişlerini otomatik olarak POS panelinize aktarın.",
  },
  {
    id: "trendyol",
    name: "Trendyol GO",
    description: "Trendyol GO siparişlerini otomatik olarak POS panelinize aktarın.",
  },
]

export function isIntegrationProvider(value: string): value is IntegrationProvider {
  return PROVIDERS.some((provider) => provider.id === value)
}

export interface NormalizedOrderItem {
  product_id?: string
  sku?: string
  name: string
  quantity: number
  unit_price?: number
  notes?: string
}

export interface NormalizedWebhookPayload {
  customer: { name: string; phone: string }
  order_type: "delivery" | "takeaway"
  courier: "platform" | "restaurant"
  notes: string
  delivery_address: { text: string; location: { lat: number; lng: number } | null } | null
  items: NormalizedOrderItem[]
  payment: { method: "cash" | "card" | "online"; paid: boolean }
}

type JsonRecord = Record<string, unknown>

function asRecord(value: unknown): JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? (value as JsonRecord) : {}
}

function pickString(source: JsonRecord, keys: readonly string[]): string | undefined {
  for (const key of keys) {
    const value = source[key]
    if (typeof value === "string" && value.trim()) return value.trim()
    if (typeof value === "number") return String(value)
  }
  return undefined
}

function pickNumber(source: JsonRecord, keys: readonly string[]): number | undefined {
  for (const key of keys) {
    const value = source[key]
    if (typeof value === "number" && Number.isFinite(value)) return value
    if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value)
  }
  return undefined
}

function normalizeLocation(value: unknown): { lat: number; lng: number } | null {
  const record = asRecord(value)
  const lat = pickNumber(record, ["lat", "latitude"])
  const lng = pickNumber(record, ["lng", "lon", "longitude"])
  return lat !== undefined && lng !== undefined ? { lat, lng } : null
}

function normalizeDeliveryAddress(body: JsonRecord): NormalizedWebhookPayload["delivery_address"] {
  const raw = body.delivery_address ?? body.deliveryAddress ?? body.address
  if (typeof raw === "string" && raw.trim()) return { text: raw.trim(), location: null }

  const record = asRecord(raw)
  const text = pickString(record, ["text", "full_address", "fullAddress", "address", "description"])
  if (!text) return null
  return { text, location: normalizeLocation(record.location ?? record) }
}

function normalizeItems(body: JsonRecord): NormalizedOrderItem[] {
  const rawItems = body.items ?? body.products ?? body.lines
  if (!Array.isArray(rawItems)) return []

  const items: NormalizedOrderItem[] = []
  for (const rawItem of rawItems) {
    const record = asRecord(rawItem)
    const name = pickString(record, ["name", "title", "product_name", "productName"])
    if (!name) continue
    items.push({
      product_id: pickString(record, ["product_id", "productId"]),
      sku: pickString(record, ["sku", "barcode"]),
      name,
      quantity: pickNumber(record, ["quantity", "qty", "count"]) ?? 1,
      unit_price: pickNumber(record, ["unit_price", "unitPrice", "price"]),
      notes: pickString(record, ["notes", "note", "comment"]),
    })
  }
  return items
}

function normalizePayment(body: JsonRecord): NormalizedWebhookPayload["payment"] {
  const record = asRecord(body.payment)
  const rawMethod = (pickString(record, ["method"]) ?? pickString(body, ["payment_method", "paymentMethod"]) ?? "").toLowerCase()
  const method: NormalizedWebhookPayload["payment"]["method"] =
    rawMethod === "cash" || rawMethod === "card" ? rawMethod : "online"
  // Platform siparişlerinde ödeme genellikle platform üzerinden peşin alınır
  const paid = typeof record.paid === "boolean" ? record.paid : method === "online"
  return { method, paid }
}

// Alan bazlı toleranslı eşleme: gövde kontrata uyuyorsa değerler aynen geçer,
// uymayan alanlar için bilinen eş anlamlı anahtarlar denenir.
function normalizeGenericPayload(rawBody: unknown): NormalizedWebhookPayload {
  const body = asRecord(rawBody)
  const customer = asRecord(body.customer)
  const rawOrderType = (pickString(body, ["order_type", "orderType", "type"]) ?? "").toLowerCase()
  const rawCourier = (pickString(body, ["courier", "courier_type", "courierType"]) ?? "").toLowerCase()

  return {
    customer: {
      name: pickString(customer, ["name", "full_name", "fullName"]) ?? pickString(body, ["customer_name", "customerName"]) ?? "Platform Müşterisi",
      phone: pickString(customer, ["phone", "phone_number", "phoneNumber"]) ?? pickString(body, ["customer_phone", "customerPhone", "phone"]) ?? "",
    },
    order_type: rawOrderType === "takeaway" || rawOrderType === "pickup" ? "takeaway" : "delivery",
    courier: rawCourier === "restaurant" ? "restaurant" : "platform",
    notes: pickString(body, ["notes", "note", "comment"]) ?? "",
    delivery_address: normalizeDeliveryAddress(body),
    items: normalizeItems(body),
    payment: normalizePayment(body),
  }
}

// Gerçek API sözleşmesi partner başvurusu sonrası eklenecek
function normalizeYemeksepetiPayload(body: unknown): NormalizedWebhookPayload {
  return normalizeGenericPayload(body)
}

// Gerçek API sözleşmesi partner başvurusu sonrası eklenecek
function normalizeGetirPayload(body: unknown): NormalizedWebhookPayload {
  return normalizeGenericPayload(body)
}

// Gerçek API sözleşmesi partner başvurusu sonrası eklenecek
function normalizeTrendyolPayload(body: unknown): NormalizedWebhookPayload {
  return normalizeGenericPayload(body)
}

export function normalizeWebhookPayload(provider: IntegrationProvider, body: unknown): NormalizedWebhookPayload {
  switch (provider) {
    case "yemeksepeti":
      return normalizeYemeksepetiPayload(body)
    case "getir":
      return normalizeGetirPayload(body)
    case "trendyol":
      return normalizeTrendyolPayload(body)
  }
}

// Sağlayıcıya özel dış sipariş kimliği çıkarımı; şimdilik ortak anahtarlar deneniyor.
// Gerçek API sözleşmesi partner başvurusu sonrası eklenecek
export function extractExternalOrderId(provider: IntegrationProvider, body: unknown): string | null {
  void provider
  const record = asRecord(body)
  return pickString(record, ["orderId", "order_id", "id", "orderNumber", "order_number"]) ?? null
}
