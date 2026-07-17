import type { OrderType, PaymentMethod, ProductKind } from "@/lib/database.types"

// get_public_menu RPC'sinin döndürdüğü jsonb yapısı
export interface PublicRestaurant {
  id: string
  name: string
  slug: string
  logo_url: string | null
  address: string | null
  phone: string | null
  currency: string | null
  tax_rate: number | null
  service_modes: OrderType[] | null
}

export interface PublicDeliveryZone {
  id: string
  name: string
  delivery_fee: number | null
  min_order_amount: number | null
}

export interface PublicProduct {
  id: string
  name: string
  description: string | null
  price: number
  discount_percent: number | null
  image_url: string | null
  kind: ProductKind | null
}

export interface PublicCategory {
  id: string
  name: string
  description: string | null
  sort_order: number | null
  products: PublicProduct[] | null
}

export interface PublicMenu {
  restaurant: PublicRestaurant
  delivery_zones: PublicDeliveryZone[] | null
  categories: PublicCategory[] | null
}

// Online sipariş için desteklenen servis tipleri
export type OnlineOrderKind = Extract<OrderType, "takeaway" | "delivery">

// Kapıda ödeme seçenekleri
export type CashierPaymentMethod = Extract<PaymentMethod, "cash" | "card">

export interface CartLine {
  product: PublicProduct
  quantity: number
  notes: string
}

// place_public_order RPC'sinin döndürdüğü jsonb yapısı
export interface PlaceOrderResult {
  order_id: string
  tracking_token: string | null
  total_amount: number
}

export interface PlacedOrder {
  orderId: string
  trackingToken: string | null
  totalAmount: number
  orderKind: OnlineOrderKind
  customerName: string
  lines: CartLine[]
}
