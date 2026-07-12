import { getClientSupabaseInstance } from "@/lib/supabase"
import { requireRestaurantId } from "@/lib/restaurant-session"
import type {
  DeliveryStatus,
  Json,
  MemberRole,
  OrderStatus,
  OrderType as DatabaseOrderType,
  PaymentMethod,
  PaymentStatus,
  ProductKind,
  ReservationStatus,
  TableStatus,
  Tables,
  TablesUpdate,
} from "@/lib/database.types"
import {
  OrderType,
  type CartItem,
  type Category,
  type Courier,
  type DeliveryAddress,
  type FoodItem,
  type InventoryItem,
  type Order,
  type Reservation,
  type Supplier,
  type Table,
} from "@/lib/types"

const orderStatusToUi: Record<OrderStatus, Order["status"]> = {
  pending: "Beklemede",
  preparing: "Hazırlanıyor",
  ready: "Hazır",
  completed: "Tamamlandı",
  cancelled: "İptal Edildi",
}

const orderStatusToDatabase: Record<Order["status"], OrderStatus> = {
  Beklemede: "pending",
  Hazırlanıyor: "preparing",
  Hazır: "ready",
  Tamamlandı: "completed",
  "İptal Edildi": "cancelled",
}

const paymentStatusToUi: Record<PaymentStatus, Order["paymentStatus"]> = {
  pending: "Beklemede",
  partially_paid: "Kısmi Ödendi",
  paid: "Ödendi",
  refunded: "İade Edildi",
  failed: "Başarısız",
}

const deliveryStatusToUi: Record<DeliveryStatus, NonNullable<Order["deliveryStatus"]>> = {
  pending: "Beklemede",
  assigned: "Atandı",
  en_route: "Yolda",
  delivered: "Teslim Edildi",
  cancelled: "İptal Edildi",
}

const deliveryStatusToDatabase: Record<NonNullable<Order["deliveryStatus"]>, DeliveryStatus> = {
  Beklemede: "pending",
  Atandı: "assigned",
  Yolda: "en_route",
  "Teslim Edildi": "delivered",
  "İptal Edildi": "cancelled",
}

const reservationStatusToUi: Record<ReservationStatus, Reservation["status"]> = {
  pending: "Beklemede",
  confirmed: "Onaylandı",
  completed: "Tamamlandı",
  cancelled: "İptal Edildi",
  no_show: "Gelmedi",
}

const reservationStatusToDatabase: Record<Reservation["status"], ReservationStatus> = {
  Beklemede: "pending",
  Onaylandı: "confirmed",
  Tamamlandı: "completed",
  "İptal Edildi": "cancelled",
  Gelmedi: "no_show",
}

const tableStatusToUi: Record<TableStatus, Table["status"]> = {
  available: "Müsait",
  occupied: "Dolu",
  reserved: "Rezerve",
}

const tableStatusToDatabase: Record<Table["status"], TableStatus> = {
  Müsait: "available",
  Dolu: "occupied",
  Rezerve: "reserved",
}

function productKindToUi(kind: ProductKind): FoodItem["type"] {
  return kind === "vegetarian" ? "Vejeteryan" : "Et"
}

function productKindToDatabase(kind: FoodItem["type"]): ProductKind {
  return kind === "Vejeteryan" ? "vegetarian" : "meat"
}

function orderTypeToUi(type: DatabaseOrderType): OrderType {
  if (type === "delivery") return OrderType.DELIVERY
  if (type === "takeaway") return OrderType.TAKEAWAY
  return OrderType.DINE_IN
}

function paymentMethodToUi(method: PaymentMethod): string {
  if (method === "cash") return "Nakit"
  if (method === "card") return "Kredi Kartı"
  return "Online"
}

function paymentMethodToDatabase(method?: string): PaymentMethod {
  if (method === "Nakit") return "cash"
  if (method === "Kredi Kartı") return "card"
  return "online"
}

function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value)) as Json
}

function toDeliveryAddress(value: Json | null): DeliveryAddress | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined

  const text = (key: string) => {
    const candidate = value[key]
    return typeof candidate === "string" ? candidate : undefined
  }
  const rawLocation = value.location
  const location =
    rawLocation && typeof rawLocation === "object" && !Array.isArray(rawLocation)
      ? {
          lat: typeof rawLocation.lat === "number" ? rawLocation.lat : 0,
          lng: typeof rawLocation.lng === "number" ? rawLocation.lng : 0,
        }
      : undefined

  return {
    fullAddress: text("fullAddress"),
    address: text("address"),
    district: text("district"),
    city: text("city"),
    contactName: text("contactName"),
    customerName: text("customerName"),
    contactPhone: text("contactPhone"),
    phone: text("phone"),
    instructions: text("instructions"),
    location,
  }
}

async function getRestaurantId(requestedRestaurantId?: string) {
  const supabase = getClientSupabaseInstance()
  const restaurantId = await requireRestaurantId(supabase, requestedRestaurantId)
  return { supabase, restaurantId }
}

async function fetchOrders(restaurantId: string, orderId?: string): Promise<Order[]> {
  const supabase = getClientSupabaseInstance()
  let orderQuery = supabase
    .from("orders")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false })

  if (orderId) orderQuery = orderQuery.eq("id", orderId)

  const { data: orderRows, error: ordersError } = await orderQuery
  if (ordersError) throw new Error(`Siparişler okunamadı: ${ordersError.message}`)
  if (!orderRows.length) return []

  const orderIds = orderRows.map((order) => order.id)
  const [{ data: itemRows, error: itemError }, { data: tableRows, error: tableError }, deliveryResult, paymentResult] =
    await Promise.all([
      supabase.from("order_items").select("*").eq("restaurant_id", restaurantId).in("order_id", orderIds),
      supabase.from("restaurant_tables").select("*").eq("restaurant_id", restaurantId),
      supabase.from("deliveries").select("*").eq("restaurant_id", restaurantId).in("order_id", orderIds),
      supabase
        .from("payments")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .in("order_id", orderIds)
        .order("created_at", { ascending: false }),
    ])

  if (itemError) throw new Error(`Sipariş kalemleri okunamadı: ${itemError.message}`)
  if (tableError) throw new Error(`Masa bilgileri okunamadı: ${tableError.message}`)
  if (deliveryResult.error) throw new Error(`Teslimatlar okunamadı: ${deliveryResult.error.message}`)
  if (paymentResult.error) throw new Error(`Ödemeler okunamadı: ${paymentResult.error.message}`)

  const tablesById = new Map(tableRows.map((table) => [table.id, table]))
  const deliveriesByOrder = new Map(deliveryResult.data.map((delivery) => [delivery.order_id, delivery]))
  const paymentsByOrder = new Map<string, Tables<"payments">>()

  for (const payment of paymentResult.data) {
    if (!paymentsByOrder.has(payment.order_id)) paymentsByOrder.set(payment.order_id, payment)
  }

  const itemsByOrder = new Map<string, CartItem[]>()
  for (const item of itemRows) {
    const cartItem: CartItem = {
      id: item.id,
      quantity: item.quantity,
      notes: item.notes ?? undefined,
      foodItem: {
        id: item.product_id ?? item.id,
        title: item.product_name,
        price: item.unit_price,
        category: "Sipariş",
        available: false,
        type: "Et",
        discount: item.unit_price * item.quantity > 0 ? (item.discount_amount / (item.unit_price * item.quantity)) * 100 : 0,
      },
    }
    const currentItems = itemsByOrder.get(item.order_id) ?? []
    currentItems.push(cartItem)
    itemsByOrder.set(item.order_id, currentItems)
  }

  return orderRows.map((order) => {
    const table = order.table_id ? tablesById.get(order.table_id) : undefined
    const delivery = deliveriesByOrder.get(order.id)
    const payment = paymentsByOrder.get(order.id)

    return {
      id: order.id,
      restaurant_id: order.restaurant_id,
      items: itemsByOrder.get(order.id) ?? [],
      total: order.total_amount,
      subtotal: order.subtotal,
      tax: order.tax_amount,
      discount: order.discount_amount,
      type: orderTypeToUi(order.type),
      status: orderStatusToUi[order.status],
      paymentStatus: paymentStatusToUi[order.payment_status],
      paymentMethod: payment
        ? paymentMethodToUi(payment.method)
        : order.requested_payment_method
          ? paymentMethodToUi(order.requested_payment_method)
          : undefined,
      createdAt: new Date(order.created_at),
      updatedAt: new Date(order.updated_at),
      tableId: order.table_id ?? undefined,
      tableName: table?.number,
      customerName: order.customer_name ?? undefined,
      customerPhone: order.customer_phone ?? undefined,
      notes: order.notes ?? undefined,
      isDelivery: order.type === "delivery",
      deliveryStatus: delivery ? deliveryStatusToUi[delivery.status] : undefined,
      deliveryAddress: toDeliveryAddress(order.delivery_address),
      deliveryTrackingToken: delivery?.tracking_token,
      courierId: delivery?.courier_user_id ?? undefined,
      estimatedDeliveryTime: delivery?.estimated_delivery_at
        ? new Date(delivery.estimated_delivery_at)
        : undefined,
    }
  })
}

export const ordersApi = {
  async getAll(): Promise<Order[]> {
    const { restaurantId } = await getRestaurantId()
    return fetchOrders(restaurantId)
  },

  async create(orderData: {
    items: CartItem[]
    total: number
    tableName?: string
    customerName?: string
    customerPhone?: string
    notes?: string
    tableId?: string | null
    isDelivery?: boolean
    deliveryAddress?: DeliveryAddress
    paymentMethod?: string
    payNow?: boolean
  }): Promise<Order | null> {
    if (!orderData.items.length) throw new Error("Sipariş en az bir ürün içermelidir")

    const { supabase, restaurantId } = await getRestaurantId()
    const orderKind: DatabaseOrderType = orderData.isDelivery
      ? "delivery"
      : orderData.tableId
        ? "dine_in"
        : "takeaway"

    const rpcItems: Json = orderData.items.map((item) => ({
      product_id: item.foodItem.id,
      quantity: item.quantity,
      notes: item.notes ?? null,
    }))

    const { data: orderId, error } = await supabase.rpc("create_order", {
      target_restaurant_id: restaurantId,
      order_items: rpcItems,
      order_kind: orderKind,
      target_table_id: orderData.tableId ?? undefined,
      target_customer_name: orderData.customerName ?? undefined,
      target_customer_phone: orderData.customerPhone ?? orderData.deliveryAddress?.phone ?? undefined,
      order_notes: orderData.notes ?? undefined,
      target_delivery_address: orderData.deliveryAddress ? toJson(orderData.deliveryAddress) : undefined,
      requested_payment_method: orderData.paymentMethod ? paymentMethodToDatabase(orderData.paymentMethod) : undefined,
      pay_now: orderData.payNow ?? false,
    })

    if (error) throw new Error(`Sipariş oluşturulamadı: ${error.message}`)
    if (!orderId) return null

    return (await fetchOrders(restaurantId, orderId))[0] ?? null
  },

  async updateStatus(id: string, status: Order["status"]): Promise<boolean> {
    const { supabase } = await getRestaurantId()
    const { error } = await supabase.rpc("set_order_status", {
      target_order_id: id,
      next_status: orderStatusToDatabase[status],
    })
    if (error) throw new Error(`Sipariş durumu güncellenemedi: ${error.message}`)
    return true
  },

  async updatePaymentStatus(id: string, status: Order["paymentStatus"], method?: string): Promise<boolean> {
    if (status !== "Ödendi") throw new Error("Kaydedilmiş ödemeler geriye dönük silinemez")

    const { supabase } = await getRestaurantId()
    const { error } = await supabase.rpc("record_order_payment", {
      target_order_id: id,
      payment_method: paymentMethodToDatabase(method),
    })
    if (error) throw new Error(`Ödeme kaydedilemedi: ${error.message}`)
    return true
  },

  async updateDeliveryStatus(
    id: string,
    status: NonNullable<Order["deliveryStatus"]>,
    location?: { lat: number; lng: number },
  ): Promise<boolean> {
    const { supabase } = await getRestaurantId()
    const { error } = await supabase.rpc("set_delivery_status", {
      target_order_id: id,
      next_status: deliveryStatusToDatabase[status],
      current_lat: location?.lat,
      current_lng: location?.lng,
    })
    if (error) throw new Error(`Teslimat durumu güncellenemedi: ${error.message}`)
    return true
  },
}

export interface Analytics {
  id: string
  date: string
  totalOrders: number
  totalRevenue: number
  avgOrderValue: number
  popularItems: { name: string; quantity: number }[]
  peakHours: { hour: number; orders: number }[]
}

export const analyticsApi = {
  async getDashboardStats(): Promise<Analytics | null> {
    const today = new Date().toISOString().slice(0, 10)
    return this.generateDailyAnalytics(today)
  },

  async generateDailyAnalytics(date: string): Promise<Analytics | null> {
    const { supabase, restaurantId } = await getRestaurantId()
    const { data, error } = await supabase
      .from("daily_sales")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .eq("sales_date", date)
      .maybeSingle()

    if (error) throw new Error(`Satış özeti okunamadı: ${error.message}`)
    if (!data) return null

    return {
      id: `${restaurantId}:${date}`,
      date,
      totalOrders: data.completed_orders ?? 0,
      totalRevenue: data.total_revenue ?? 0,
      avgOrderValue: data.average_order_value ?? 0,
      popularItems: [],
      peakHours: [],
    }
  },
}

async function loadInventory(requestedRestaurantId?: string): Promise<InventoryItem[]> {
  const { supabase, restaurantId } = await getRestaurantId(requestedRestaurantId)
  const [{ data: inventoryRows, error: inventoryError }, { data: productRows, error: productError }] =
    await Promise.all([
      supabase.from("inventory_items").select("*").eq("restaurant_id", restaurantId).order("updated_at", {
        ascending: false,
      }),
      supabase.from("products").select("id, name").eq("restaurant_id", restaurantId),
    ])

  if (inventoryError) throw new Error(`Stok verileri okunamadı: ${inventoryError.message}`)
  if (productError) throw new Error(`Ürün adları okunamadı: ${productError.message}`)

  const productNames = new Map(productRows.map((product) => [product.id, product.name]))
  return inventoryRows.map((item) => ({
    id: item.id,
    productId: item.product_id,
    productName: productNames.get(item.product_id),
    currentStock: item.current_stock,
    minStock: item.min_stock,
    maxStock: item.max_stock ?? undefined,
    unit: item.unit,
    costPrice: item.cost_price ?? undefined,
    supplierId: item.supplier_id ?? undefined,
    lastUpdated: item.updated_at,
  }))
}

export const inventoryApi = {
  getAll: loadInventory,

  async updateStock(productId: string, newStock: number): Promise<boolean> {
    const { supabase } = await getRestaurantId()
    const { error } = await supabase.rpc("set_inventory_stock", {
      target_product_id: productId,
      new_stock: newStock,
      change_reason: "Panel üzerinden stok düzeltmesi",
    })
    if (error) throw new Error(`Stok güncellenemedi: ${error.message}`)
    return true
  },

  async getLowStockItems(): Promise<InventoryItem[]> {
    return (await loadInventory()).filter((item) => item.currentStock <= item.minStock)
  },
}

async function resolveCategoryId(
  categoryId: string | undefined,
  categoryName: string | undefined,
  restaurantId: string,
): Promise<string | null> {
  const supabase = getClientSupabaseInstance()
  if (categoryId) return categoryId
  const normalizedName = categoryName?.trim()
  if (!normalizedName) return null

  const { data: existing, error: readError } = await supabase
    .from("categories")
    .select("id")
    .eq("restaurant_id", restaurantId)
    .ilike("name", normalizedName)
    .limit(1)
    .maybeSingle()

  if (readError) throw new Error(`Kategori aranamadı: ${readError.message}`)
  if (existing) return existing.id

  const { data: created, error: createError } = await supabase
    .from("categories")
    .insert({ restaurant_id: restaurantId, name: normalizedName })
    .select("id")
    .single()

  if (createError) throw new Error(`Kategori oluşturulamadı: ${createError.message}`)
  return created.id
}

async function loadProducts(requestedRestaurantId?: string): Promise<FoodItem[]> {
  const { supabase, restaurantId } = await getRestaurantId(requestedRestaurantId)
  const [productsResult, categoriesResult, inventoryResult] = await Promise.all([
    supabase.from("products").select("*").eq("restaurant_id", restaurantId).order("created_at", { ascending: false }),
    supabase.from("categories").select("id, name").eq("restaurant_id", restaurantId),
    supabase.from("inventory_items").select("product_id, current_stock").eq("restaurant_id", restaurantId),
  ])

  if (productsResult.error) throw new Error(`Ürünler okunamadı: ${productsResult.error.message}`)
  if (categoriesResult.error) throw new Error(`Kategoriler okunamadı: ${categoriesResult.error.message}`)
  if (inventoryResult.error) throw new Error(`Stok miktarları okunamadı: ${inventoryResult.error.message}`)

  const categoryNames = new Map(categoriesResult.data.map((category) => [category.id, category.name]))
  const stockByProduct = new Map(inventoryResult.data.map((item) => [item.product_id, item.current_stock]))

  return productsResult.data.map((product) => ({
    id: product.id,
    title: product.name,
    description: product.description ?? "",
    price: product.price,
    image: product.image_url ?? "/placeholder.svg?height=160&width=320",
    category: (product.category_id && categoryNames.get(product.category_id)) || "Diğer",
    category_id: product.category_id ?? undefined,
    available: product.is_available,
    type: productKindToUi(product.kind),
    discount: product.discount_percent,
    stock: stockByProduct.get(product.id),
    restaurant_id: product.restaurant_id,
    costPrice: product.cost_price ?? undefined,
    trackInventory: product.track_inventory,
  }))
}

interface ProductPayload {
  title: string
  description?: string
  price: number
  image?: string
  category_id?: string
  category?: string
  available: boolean
  type: FoodItem["type"]
  discount?: number
  stock?: number
  restaurant_id?: string
}

export const productsApi = {
  getAll: loadProducts,

  async create(productPayload: ProductPayload): Promise<FoodItem | null> {
    const { supabase, restaurantId } = await getRestaurantId(productPayload.restaurant_id)
    const categoryId = await resolveCategoryId(
      productPayload.category_id,
      productPayload.category,
      restaurantId,
    )

    const { data, error } = await supabase
      .from("products")
      .insert({
        restaurant_id: restaurantId,
        name: productPayload.title.trim(),
        description: productPayload.description?.trim() || null,
        price: productPayload.price,
        image_url: productPayload.image || null,
        category_id: categoryId,
        is_available: productPayload.available,
        kind: productKindToDatabase(productPayload.type),
        discount_percent: productPayload.discount ?? 0,
        track_inventory: productPayload.stock !== undefined,
      })
      .select("id")
      .single()

    if (error) throw new Error(`Ürün oluşturulamadı: ${error.message}`)

    if (productPayload.stock !== undefined) {
      const { error: inventoryError } = await supabase.from("inventory_items").insert({
        restaurant_id: restaurantId,
        product_id: data.id,
        current_stock: productPayload.stock,
        min_stock: 5,
        max_stock: 100,
        unit: "adet",
      })

      if (inventoryError) {
        await supabase.from("products").delete().eq("id", data.id).eq("restaurant_id", restaurantId)
        throw new Error(`Ürün stoğu oluşturulamadı: ${inventoryError.message}`)
      }
    }

    return (await loadProducts(restaurantId)).find((product) => product.id === data.id) ?? null
  },

  async update(
    productId: string,
    productPayload: Partial<Omit<ProductPayload, "restaurant_id">>,
    requestedRestaurantId?: string,
  ): Promise<FoodItem | null> {
    const { supabase, restaurantId } = await getRestaurantId(requestedRestaurantId)
    const updates: TablesUpdate<"products"> = {}

    if (productPayload.title !== undefined) updates.name = productPayload.title.trim()
    if (productPayload.description !== undefined) updates.description = productPayload.description.trim() || null
    if (productPayload.price !== undefined) updates.price = productPayload.price
    if (productPayload.image !== undefined) updates.image_url = productPayload.image || null
    if (productPayload.available !== undefined) updates.is_available = productPayload.available
    if (productPayload.type !== undefined) updates.kind = productKindToDatabase(productPayload.type)
    if (productPayload.discount !== undefined) updates.discount_percent = productPayload.discount
    if (productPayload.category_id !== undefined || productPayload.category !== undefined) {
      updates.category_id = await resolveCategoryId(
        productPayload.category_id,
        productPayload.category,
        restaurantId,
      )
    }
    if (productPayload.stock !== undefined) updates.track_inventory = true

    if (Object.keys(updates).length) {
      const { error } = await supabase
        .from("products")
        .update(updates)
        .eq("id", productId)
        .eq("restaurant_id", restaurantId)
      if (error) throw new Error(`Ürün güncellenemedi: ${error.message}`)
    }

    if (productPayload.stock !== undefined) {
      const { data: inventory, error: inventoryReadError } = await supabase
        .from("inventory_items")
        .select("id")
        .eq("restaurant_id", restaurantId)
        .eq("product_id", productId)
        .maybeSingle()

      if (inventoryReadError) throw new Error(`Stok kaydı okunamadı: ${inventoryReadError.message}`)
      if (inventory) {
        await inventoryApi.updateStock(productId, productPayload.stock)
      } else {
        const { error: inventoryCreateError } = await supabase.from("inventory_items").insert({
          restaurant_id: restaurantId,
          product_id: productId,
          current_stock: productPayload.stock,
          min_stock: 5,
          max_stock: 100,
          unit: "adet",
        })
        if (inventoryCreateError) throw new Error(`Stok kaydı oluşturulamadı: ${inventoryCreateError.message}`)
      }
    }

    return (await loadProducts(restaurantId)).find((product) => product.id === productId) ?? null
  },

  async delete(productId: string, requestedRestaurantId?: string): Promise<boolean> {
    const { supabase, restaurantId } = await getRestaurantId(requestedRestaurantId)
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productId)
      .eq("restaurant_id", restaurantId)
    if (error) throw new Error(`Ürün silinemedi: ${error.message}`)
    return true
  },
}

async function loadTables(requestedRestaurantId?: string): Promise<Table[]> {
  const { supabase, restaurantId } = await getRestaurantId(requestedRestaurantId)
  const [tablesResult, ordersResult] = await Promise.all([
    supabase.from("restaurant_tables").select("*").eq("restaurant_id", restaurantId).order("number"),
    supabase.from("orders").select("id, table_id, customer_name, status").eq("restaurant_id", restaurantId),
  ])

  if (tablesResult.error) throw new Error(`Masalar okunamadı: ${tablesResult.error.message}`)
  if (ordersResult.error) throw new Error(`Masa siparişleri okunamadı: ${ordersResult.error.message}`)

  const activeOrderByTable = new Map(
    ordersResult.data
      .filter((order) => order.table_id && order.status !== "completed" && order.status !== "cancelled")
      .map((order) => [order.table_id as string, order]),
  )

  return tablesResult.data.map((table) => {
    const currentOrder = activeOrderByTable.get(table.id)
    return {
      id: table.id,
      number: table.number,
      capacity: table.capacity,
      status: tableStatusToUi[table.status],
      section: table.section ?? undefined,
      customer: currentOrder?.customer_name ?? undefined,
      currentOrderId: currentOrder?.id,
      position:
        table.position_x !== null && table.position_y !== null
          ? { x: table.position_x, y: table.position_y }
          : undefined,
      restaurant_id: table.restaurant_id,
    }
  })
}

export const tablesApi = {
  getAll: loadTables,

  async create(table: { number: string; capacity: number; section: string }): Promise<Table | null> {
    const { supabase, restaurantId } = await getRestaurantId()
    const { data, error } = await supabase
      .from("restaurant_tables")
      .insert({
        restaurant_id: restaurantId,
        number: table.number.trim(),
        capacity: table.capacity,
        section: table.section.trim() || null,
        position_x: 100,
        position_y: 100,
      })
      .select("id")
      .single()

    if (error) throw new Error(`Masa oluşturulamadı: ${error.message}`)
    return (await loadTables(restaurantId)).find((item) => item.id === data.id) ?? null
  },

  async update(id: string, updates: Partial<Table>): Promise<Table | null> {
    const { supabase, restaurantId } = await getRestaurantId()
    const databaseUpdates: TablesUpdate<"restaurant_tables"> = {}
    if (updates.number !== undefined) databaseUpdates.number = updates.number.trim()
    if (updates.capacity !== undefined) databaseUpdates.capacity = updates.capacity
    if (updates.section !== undefined) databaseUpdates.section = updates.section || null
    if (updates.status !== undefined) databaseUpdates.status = tableStatusToDatabase[updates.status]
    if (updates.position !== undefined) {
      databaseUpdates.position_x = updates.position.x
      databaseUpdates.position_y = updates.position.y
    }

    const { error } = await supabase
      .from("restaurant_tables")
      .update(databaseUpdates)
      .eq("id", id)
      .eq("restaurant_id", restaurantId)
    if (error) throw new Error(`Masa güncellenemedi: ${error.message}`)
    return (await loadTables(restaurantId)).find((table) => table.id === id) ?? null
  },

  async delete(id: string): Promise<boolean> {
    const { supabase, restaurantId } = await getRestaurantId()
    const { error } = await supabase
      .from("restaurant_tables")
      .delete()
      .eq("id", id)
      .eq("restaurant_id", restaurantId)
    if (error) throw new Error(`Masa silinemedi: ${error.message}`)
    return true
  },
}

type ReservationInput = Omit<Reservation, "id"> & { time?: string }

function combineReservationDate(date: Date, time?: string) {
  const startsAt = new Date(date)
  if (time) {
    const [hours, minutes] = time.split(":").map(Number)
    if (Number.isFinite(hours) && Number.isFinite(minutes)) startsAt.setHours(hours, minutes, 0, 0)
  }
  return startsAt
}

async function findTableId(restaurantId: string, tableNumber?: string): Promise<string | null> {
  if (!tableNumber?.trim()) return null
  const supabase = getClientSupabaseInstance()
  const { data, error } = await supabase
    .from("restaurant_tables")
    .select("id")
    .eq("restaurant_id", restaurantId)
    .eq("number", tableNumber.trim())
    .maybeSingle()
  if (error) throw new Error(`Rezervasyon masası aranamadı: ${error.message}`)
  return data?.id ?? null
}

async function loadReservations(requestedRestaurantId?: string): Promise<Reservation[]> {
  const { supabase, restaurantId } = await getRestaurantId(requestedRestaurantId)
  const [reservationsResult, tablesResult] = await Promise.all([
    supabase.from("reservations").select("*").eq("restaurant_id", restaurantId).order("starts_at"),
    supabase.from("restaurant_tables").select("id, number").eq("restaurant_id", restaurantId),
  ])

  if (reservationsResult.error) throw new Error(`Rezervasyonlar okunamadı: ${reservationsResult.error.message}`)
  if (tablesResult.error) throw new Error(`Masa adları okunamadı: ${tablesResult.error.message}`)

  const tableNumbers = new Map(tablesResult.data.map((table) => [table.id, table.number]))
  return reservationsResult.data.map((reservation) => ({
    id: reservation.id,
    customerName: reservation.customer_name,
    date: new Date(reservation.starts_at),
    people: reservation.party_size,
    tableId: reservation.table_id ?? undefined,
    tableNumber: reservation.table_id ? tableNumbers.get(reservation.table_id) : undefined,
    phone: reservation.customer_phone,
    email: reservation.customer_email ?? undefined,
    notes: reservation.notes ?? undefined,
    status: reservationStatusToUi[reservation.status],
  }))
}

export const reservationsApi = {
  getAll: loadReservations,

  async create(reservation: ReservationInput): Promise<Reservation | null> {
    const { supabase, restaurantId } = await getRestaurantId()
    const tableId = reservation.tableId ?? (await findTableId(restaurantId, reservation.tableNumber))
    const { data, error } = await supabase
      .from("reservations")
      .insert({
        restaurant_id: restaurantId,
        table_id: tableId,
        customer_name: reservation.customerName.trim(),
        customer_phone: reservation.phone.trim(),
        customer_email: reservation.email?.trim() || null,
        party_size: reservation.people,
        starts_at: combineReservationDate(reservation.date, reservation.time).toISOString(),
        status: reservationStatusToDatabase[reservation.status],
        notes: reservation.notes?.trim() || null,
      })
      .select("id")
      .single()

    if (error) throw new Error(`Rezervasyon oluşturulamadı: ${error.message}`)
    return (await loadReservations(restaurantId)).find((item) => item.id === data.id) ?? null
  },

  async update(id: string, reservation: Partial<ReservationInput>): Promise<Reservation | null> {
    const { supabase, restaurantId } = await getRestaurantId()
    const { data: current, error: currentError } = await supabase
      .from("reservations")
      .select("starts_at")
      .eq("restaurant_id", restaurantId)
      .eq("id", id)
      .single()
    if (currentError) throw new Error(`Rezervasyon okunamadı: ${currentError.message}`)

    const updates: TablesUpdate<"reservations"> = {}
    if (reservation.customerName !== undefined) updates.customer_name = reservation.customerName.trim()
    if (reservation.phone !== undefined) updates.customer_phone = reservation.phone.trim()
    if (reservation.email !== undefined) updates.customer_email = reservation.email.trim() || null
    if (reservation.people !== undefined) updates.party_size = reservation.people
    if (reservation.notes !== undefined) updates.notes = reservation.notes.trim() || null
    if (reservation.status !== undefined) updates.status = reservationStatusToDatabase[reservation.status]
    if (reservation.tableId !== undefined || reservation.tableNumber !== undefined) {
      updates.table_id = reservation.tableId ?? (await findTableId(restaurantId, reservation.tableNumber))
    }
    if (reservation.date !== undefined || reservation.time !== undefined) {
      updates.starts_at = combineReservationDate(
        reservation.date ?? new Date(current.starts_at),
        reservation.time,
      ).toISOString()
    }

    const { error } = await supabase
      .from("reservations")
      .update(updates)
      .eq("id", id)
      .eq("restaurant_id", restaurantId)
    if (error) throw new Error(`Rezervasyon güncellenemedi: ${error.message}`)
    return (await loadReservations(restaurantId)).find((item) => item.id === id) ?? null
  },

  async delete(id: string): Promise<boolean> {
    const { supabase, restaurantId } = await getRestaurantId()
    const { error } = await supabase.from("reservations").delete().eq("id", id).eq("restaurant_id", restaurantId)
    if (error) throw new Error(`Rezervasyon silinemedi: ${error.message}`)
    return true
  },
}

export const categoriesApi = {
  async getAll(requestedRestaurantId?: string): Promise<string[]> {
    return (await this.getDetailed(requestedRestaurantId)).map((category) => category.name)
  },

  async getDetailed(requestedRestaurantId?: string): Promise<Category[]> {
    const { supabase, restaurantId } = await getRestaurantId(requestedRestaurantId)
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .eq("is_active", true)
      .order("sort_order")
    if (error) throw new Error(`Kategoriler okunamadı: ${error.message}`)
    return data.map((category) => ({
      id: category.id,
      name: category.name,
      description: category.description ?? undefined,
      icon: category.icon ?? undefined,
      sortOrder: category.sort_order,
      active: category.is_active,
      restaurant_id: category.restaurant_id,
    }))
  },
}

async function loadSuppliers(requestedRestaurantId?: string): Promise<Supplier[]> {
  const { supabase, restaurantId } = await getRestaurantId(requestedRestaurantId)
  const { data, error } = await supabase
    .from("suppliers")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("name")
  if (error) throw new Error(`Tedarikçiler okunamadı: ${error.message}`)
  return data.map((supplier) => ({
    id: supplier.id,
    name: supplier.name,
    contact_name: supplier.contact_name ?? undefined,
    phone: supplier.phone ?? undefined,
    email: supplier.email ?? undefined,
    address: supplier.address ?? undefined,
    restaurant_id: supplier.restaurant_id,
    created_at: supplier.created_at,
    updated_at: supplier.updated_at,
  }))
}

export const suppliersApi = {
  getAll: loadSuppliers,

  async getById(supplierId: string, requestedRestaurantId?: string): Promise<Supplier | null> {
    return (await loadSuppliers(requestedRestaurantId)).find((supplier) => supplier.id === supplierId) ?? null
  },

  async create(supplierData: {
    name: string
    contact_name?: string | null
    phone?: string | null
    email?: string | null
    address?: string | null
    restaurant_id?: string
  }): Promise<Supplier | null> {
    const { supabase, restaurantId } = await getRestaurantId(supplierData.restaurant_id)
    const { data, error } = await supabase
      .from("suppliers")
      .insert({
        restaurant_id: restaurantId,
        name: supplierData.name.trim(),
        contact_name: supplierData.contact_name?.trim() || null,
        phone: supplierData.phone?.trim() || null,
        email: supplierData.email?.trim() || null,
        address: supplierData.address?.trim() || null,
      })
      .select("id")
      .single()
    if (error) throw new Error(`Tedarikçi oluşturulamadı: ${error.message}`)
    return (await loadSuppliers(restaurantId)).find((supplier) => supplier.id === data.id) ?? null
  },

  async update(
    supplierId: string,
    supplierData: Partial<Pick<Supplier, "name" | "contact_name" | "phone" | "email" | "address">>,
    requestedRestaurantId?: string,
  ): Promise<Supplier | null> {
    const { supabase, restaurantId } = await getRestaurantId(requestedRestaurantId)
    const updates: TablesUpdate<"suppliers"> = {}
    if (supplierData.name !== undefined) updates.name = supplierData.name.trim()
    if (supplierData.contact_name !== undefined) updates.contact_name = supplierData.contact_name?.trim() || null
    if (supplierData.phone !== undefined) updates.phone = supplierData.phone?.trim() || null
    if (supplierData.email !== undefined) updates.email = supplierData.email?.trim() || null
    if (supplierData.address !== undefined) updates.address = supplierData.address?.trim() || null

    const { error } = await supabase
      .from("suppliers")
      .update(updates)
      .eq("id", supplierId)
      .eq("restaurant_id", restaurantId)
    if (error) throw new Error(`Tedarikçi güncellenemedi: ${error.message}`)
    return (await loadSuppliers(restaurantId)).find((supplier) => supplier.id === supplierId) ?? null
  },

  async delete(supplierId: string, requestedRestaurantId?: string): Promise<boolean> {
    const { supabase, restaurantId } = await getRestaurantId(requestedRestaurantId)
    const { error } = await supabase
      .from("suppliers")
      .delete()
      .eq("id", supplierId)
      .eq("restaurant_id", restaurantId)
    if (error) throw new Error(`Tedarikçi silinemedi: ${error.message}`)
    return true
  },
}

const memberRoleLabels: Record<MemberRole, "Yönetici" | "Garson" | "Şef" | "Kasiyer" | "Kurye"> = {
  owner: "Yönetici",
  manager: "Yönetici",
  waiter: "Garson",
  kitchen: "Şef",
  cashier: "Kasiyer",
  courier: "Kurye",
}

export interface RestaurantMember {
  id: string
  name: string
  email: string
  avatar?: string
  role: MemberRole
  roleLabel: (typeof memberRoleLabels)[MemberRole]
  joinedAt?: Date
}

export interface RestaurantInvitation {
  token: string
  email: string
  role: MemberRole
  restaurantName?: string
  expiresAt: Date
}

export const membersApi = {
  async getAll(): Promise<RestaurantMember[]> {
    const { supabase, restaurantId } = await getRestaurantId()
    const { data: members, error: membersError } = await supabase
      .from("restaurant_members")
      .select("user_id, role, joined_at")
      .eq("restaurant_id", restaurantId)
      .eq("status", "active")
      .order("created_at")

    if (membersError) throw new Error(`Ekip üyeleri okunamadı: ${membersError.message}`)
    if (!members.length) return []

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email, full_name, avatar_url")
      .in(
        "id",
        members.map((member) => member.user_id),
      )
    if (profilesError) throw new Error(`Üye profilleri okunamadı: ${profilesError.message}`)

    const profilesById = new Map(profiles.map((profile) => [profile.id, profile]))
    return members.map((member) => {
      const profile = profilesById.get(member.user_id)
      return {
        id: member.user_id,
        name: profile?.full_name || profile?.email || "Kullanıcı",
        email: profile?.email || "",
        avatar: profile?.avatar_url ?? undefined,
        role: member.role,
        roleLabel: memberRoleLabels[member.role],
        joinedAt: member.joined_at ? new Date(member.joined_at) : undefined,
      }
    })
  },

  async createInvitation(email: string, role: MemberRole): Promise<RestaurantInvitation> {
    const { supabase, restaurantId } = await getRestaurantId()
    const { data: token, error } = await supabase.rpc("create_restaurant_invitation", {
      target_restaurant_id: restaurantId,
      invite_email: email.trim().toLowerCase(),
      invite_role: role,
    })
    if (error) throw new Error(`Davet oluşturulamadı: ${error.message}`)

    const details = await this.getInvitation(token)
    if (!details) throw new Error("Davet oluşturuldu ancak ayrıntıları okunamadı")
    return details
  },

  async getInvitation(token: string): Promise<RestaurantInvitation | null> {
    const supabase = getClientSupabaseInstance()
    const { data, error } = await supabase.rpc("get_restaurant_invitation", {
      invitation_token: token,
    })
    if (error) throw new Error(`Davet okunamadı: ${error.message}`)
    const invitation = data[0]
    if (!invitation) return null

    return {
      token,
      email: invitation.email,
      role: invitation.role,
      restaurantName: invitation.restaurant_name,
      expiresAt: new Date(invitation.expires_at),
    }
  },

  async acceptInvitation(token: string): Promise<string> {
    const supabase = getClientSupabaseInstance()
    const { data, error } = await supabase.rpc("accept_restaurant_invitation", {
      invitation_token: token,
    })
    if (error) throw new Error(`Davet kabul edilemedi: ${error.message}`)
    return data
  },

  async updateRole(userId: string, role: MemberRole): Promise<boolean> {
    const { supabase, restaurantId } = await getRestaurantId()
    const { error } = await supabase.rpc("set_restaurant_member_role", {
      target_restaurant_id: restaurantId,
      target_user_id: userId,
      next_role: role,
    })
    if (error) throw new Error(`Üye rolü güncellenemedi: ${error.message}`)
    return true
  },

  async remove(userId: string): Promise<boolean> {
    const { supabase, restaurantId } = await getRestaurantId()
    const { error } = await supabase.rpc("remove_restaurant_member", {
      target_restaurant_id: restaurantId,
      target_user_id: userId,
    })
    if (error) throw new Error(`Üye kaldırılamadı: ${error.message}`)
    return true
  },
}

function toUiVehicleType(value?: string | null): Courier["vehicleType"] {
  if (value === "car") return "Araba"
  if (value === "bicycle") return "Bisiklet"
  return "Motorsiklet"
}

const vehicleTypeToDatabase: Record<Courier["vehicleType"], "motorcycle" | "car" | "bicycle"> = {
  Motorsiklet: "motorcycle",
  Araba: "car",
  Bisiklet: "bicycle",
}

export const couriersApi = {
  async getAll(): Promise<Courier[]> {
    const { supabase, restaurantId } = await getRestaurantId()
    const [membersResult, courierProfilesResult, deliveriesResult] = await Promise.all([
      supabase
        .from("restaurant_members")
        .select("user_id, joined_at")
        .eq("restaurant_id", restaurantId)
        .eq("role", "courier")
        .eq("status", "active"),
      supabase.from("courier_profiles").select("*").eq("restaurant_id", restaurantId),
      supabase.from("deliveries").select("*").eq("restaurant_id", restaurantId),
    ])

    if (membersResult.error) throw new Error(`Kuryeler okunamadı: ${membersResult.error.message}`)
    if (courierProfilesResult.error) throw new Error(`Kurye profilleri okunamadı: ${courierProfilesResult.error.message}`)
    if (deliveriesResult.error) throw new Error(`Kurye teslimatları okunamadı: ${deliveriesResult.error.message}`)
    if (!membersResult.data.length) return []

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email, full_name, phone, avatar_url")
      .in(
        "id",
        membersResult.data.map((member) => member.user_id),
      )
    if (profilesError) throw new Error(`Kurye kullanıcıları okunamadı: ${profilesError.message}`)

    const profileById = new Map(profiles.map((profile) => [profile.id, profile]))
    const courierProfileById = new Map(courierProfilesResult.data.map((profile) => [profile.user_id, profile]))

    return membersResult.data.map((member) => {
      const profile = profileById.get(member.user_id)
      const courierProfile = courierProfileById.get(member.user_id)
      const courierDeliveries = deliveriesResult.data.filter((delivery) => delivery.courier_user_id === member.user_id)
      const activeDelivery = courierDeliveries.find((delivery) =>
        (["assigned", "en_route"] as DeliveryStatus[]).includes(delivery.status),
      )
      const status: Courier["status"] =
        activeDelivery?.status === "en_route" ? "Teslimatta" : activeDelivery ? "Siparişte" : "Müsait"

      return {
        id: member.user_id,
        name: courierProfile?.display_name || profile?.full_name || profile?.email || "Kurye",
        email: profile?.email ?? undefined,
        phone: courierProfile?.phone || profile?.phone || "",
        status,
        avatar: profile?.avatar_url ?? undefined,
        vehicleType: toUiVehicleType(courierProfile?.vehicle_type),
        vehiclePlate: courierProfile?.vehicle_plate ?? undefined,
        activeFrom: new Date(member.joined_at || courierProfile?.created_at || Date.now()),
        totalDeliveries: courierDeliveries.filter((delivery) => delivery.status === "delivered").length,
        currentOrderId: activeDelivery?.order_id,
        location:
          activeDelivery && activeDelivery.courier_lat !== null && activeDelivery.courier_lng !== null
            ? { lat: activeDelivery.courier_lat, lng: activeDelivery.courier_lng }
            : undefined,
      }
    })
  },

  async updateProfile(
    userId: string,
    updates: Partial<Pick<Courier, "name" | "phone" | "vehicleType" | "vehiclePlate">>,
  ): Promise<void> {
    const { supabase, restaurantId } = await getRestaurantId()
    const databaseUpdates: TablesUpdate<"courier_profiles"> = {}
    if (updates.name !== undefined) databaseUpdates.display_name = updates.name.trim() || null
    if (updates.phone !== undefined) databaseUpdates.phone = updates.phone.trim() || null
    if (updates.vehicleType !== undefined) databaseUpdates.vehicle_type = vehicleTypeToDatabase[updates.vehicleType]
    if (updates.vehiclePlate !== undefined) databaseUpdates.vehicle_plate = updates.vehiclePlate.trim() || null

    const { error } = await supabase
      .from("courier_profiles")
      .update(databaseUpdates)
      .eq("restaurant_id", restaurantId)
      .eq("user_id", userId)
    if (error) throw new Error(`Kurye profili güncellenemedi: ${error.message}`)
  },

  async createInvitation(
    courier: Pick<Courier, "name" | "email" | "phone" | "vehicleType" | "vehiclePlate">,
  ): Promise<string> {
    if (!courier.email) throw new Error("Kurye daveti için e-posta adresi gereklidir")
    const { supabase, restaurantId } = await getRestaurantId()
    const { data, error } = await supabase.rpc("create_courier_invitation", {
      target_restaurant_id: restaurantId,
      invite_email: courier.email.trim().toLowerCase(),
      courier_name: courier.name.trim(),
      courier_phone: courier.phone.trim(),
      courier_vehicle_type: vehicleTypeToDatabase[courier.vehicleType],
      courier_vehicle_plate: courier.vehiclePlate?.trim() || undefined,
    })
    if (error) throw new Error(`Kurye daveti oluşturulamadı: ${error.message}`)
    return data
  },

  async assignOrder(courierId: string, orderId: string): Promise<void> {
    const { supabase } = await getRestaurantId()
    const { error } = await supabase.rpc("assign_delivery_courier", {
      target_order_id: orderId,
      target_courier_user_id: courierId,
    })
    if (error) throw new Error(`Kurye atanamadı: ${error.message}`)
  },

  async updateLocation(orderId: string, lat: number, lng: number): Promise<void> {
    const { supabase } = await getRestaurantId()
    const { error } = await supabase.rpc("set_delivery_status", {
      target_order_id: orderId,
      next_status: "en_route",
      current_lat: lat,
      current_lng: lng,
    })
    if (error) throw new Error(`Kurye konumu güncellenemedi: ${error.message}`)
  },

  async completeDelivery(orderId: string): Promise<void> {
    const { supabase } = await getRestaurantId()
    const { error } = await supabase.rpc("set_delivery_status", {
      target_order_id: orderId,
      next_status: "delivered",
    })
    if (error) throw new Error(`Teslimat tamamlanamadı: ${error.message}`)
  },
}

export interface AppNotification {
  id: string
  title: string
  message: string
  type: "info" | "success" | "warning" | "error"
  read: boolean
  timestamp: Date
  relatedOrderId?: string
}

function toNotificationType(value: string): AppNotification["type"] {
  if (value === "success" || value === "warning" || value === "error") return value
  return "info"
}

export const notificationsApi = {
  async getAll(): Promise<AppNotification[]> {
    const { supabase, restaurantId } = await getRestaurantId()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) throw new Error("Bildirim kullanıcısı doğrulanamadı")

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100)
    if (error) throw new Error(`Bildirimler okunamadı: ${error.message}`)

    return data.map((notification) => ({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: toNotificationType(notification.type),
      read: Boolean(notification.read_at),
      timestamp: new Date(notification.created_at),
      relatedOrderId: notification.related_order_id ?? undefined,
    }))
  },

  async create(
    notification: Pick<AppNotification, "title" | "message" | "type"> & {
      targetUserId?: string
      relatedOrderId?: string
    },
  ): Promise<AppNotification> {
    const { supabase, restaurantId } = await getRestaurantId()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) throw new Error("Bildirim kullanıcısı doğrulanamadı")

    const { data, error } = await supabase
      .from("notifications")
      .insert({
        restaurant_id: restaurantId,
        user_id: notification.targetUserId ?? user.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        related_order_id: notification.relatedOrderId ?? null,
      })
      .select("*")
      .single()
    if (error) throw new Error(`Bildirim oluşturulamadı: ${error.message}`)

    return {
      id: data.id,
      title: data.title,
      message: data.message,
      type: toNotificationType(data.type),
      read: false,
      timestamp: new Date(data.created_at),
      relatedOrderId: data.related_order_id ?? undefined,
    }
  },

  async markAsRead(id: string): Promise<void> {
    const { supabase } = await getRestaurantId()
    const { error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id)
    if (error) throw new Error(`Bildirim güncellenemedi: ${error.message}`)
  },

  async markAllAsRead(): Promise<void> {
    const { supabase, restaurantId } = await getRestaurantId()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("Bildirim kullanıcısı doğrulanamadı")
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("restaurant_id", restaurantId)
      .eq("user_id", user.id)
      .is("read_at", null)
    if (error) throw new Error(`Bildirimler güncellenemedi: ${error.message}`)
  },

  async remove(id: string): Promise<void> {
    const { supabase } = await getRestaurantId()
    const { error } = await supabase.from("notifications").delete().eq("id", id)
    if (error) throw new Error(`Bildirim silinemedi: ${error.message}`)
  },

  async clear(): Promise<void> {
    const { supabase, restaurantId } = await getRestaurantId()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("Bildirim kullanıcısı doğrulanamadı")
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("restaurant_id", restaurantId)
      .eq("user_id", user.id)
    if (error) throw new Error(`Bildirimler silinemedi: ${error.message}`)
  },
}
