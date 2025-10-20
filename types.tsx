export interface FoodItem {
  id: string
  title: string
  description?: string
  price: number
  image?: string
  category: string
  available: boolean
  type: "Et" | "Vejeteryan"
  discount?: number
  stock?: number
}

export interface CartItem {
  id: string
  foodItem: FoodItem
  quantity: number
  notes?: string
}

export interface Table {
  id: string
  number: string
  capacity: number
  status: "Müsait" | "Dolu" | "Rezerve"
  customer?: string
  section?: string
  position: {
    x: number
    y: number
  }
  currentOrderId?: string
}

export interface Order {
  id: string
  items: CartItem[]
  total: number
  status: "Beklemede" | "Hazırlanıyor" | "Hazır" | "Tamamlandı" | "İptal Edildi"
  createdAt: Date
  updatedAt: Date
  tableId?: string
  tableName?: string
  customerName?: string
  paymentStatus: "Beklemede" | "Ödendi"
  paymentMethod?: "Nakit" | "Kredi Kartı" | "Online"
  notes?: string
}

export interface User {
  id: string
  name: string
  email: string
  role: "Yönetici" | "Garson" | "Şef" | "Kasiyer" | "Kurye"
  avatar?: string
}
