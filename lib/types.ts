export interface FoodItem {
  id: string
  title: string
  description?: string
  price: number
  image?: string
  category: string
  category_id?: string
  available: boolean
  type: "Et" | "Vejeteryan"
  discount?: number
  stock?: number
  restaurant_id?: string
  costPrice?: number
  trackInventory?: boolean
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
  position?: {
    x: number
    y: number
  }
  currentOrderId?: string
  restaurant_id?: string
}

export enum OrderType {
  DINE_IN = "Restoranda",
  TAKEAWAY = "Gel-Al",
  DELIVERY = "Paket Servis",
}

export interface Order {
  id: string
  items: CartItem[]
  total: number
  subtotal?: number
  tax?: number
  discount?: number
  deliveryFee?: number
  type?: OrderType
  status: "Beklemede" | "Hazırlanıyor" | "Hazır" | "Tamamlandı" | "İptal Edildi"
  createdAt: Date
  updatedAt: Date
  tableId?: string
  tableName?: string
  customerName?: string
  customerPhone?: string
  paymentStatus: "Beklemede" | "Kısmi Ödendi" | "Ödendi" | "İade Edildi" | "Başarısız"
  paymentMethod?: string
  notes?: string
  isDelivery?: boolean
  deliveryStatus?: "Beklemede" | "Atandı" | "Yolda" | "Teslim Edildi" | "İptal Edildi"
  deliveryAddress?: DeliveryAddress
  deliveryTrackingToken?: string
  courierId?: string
  estimatedDeliveryTime?: Date
  restaurant_id?: string
}

export interface User {
  id: string
  name: string
  email: string
  role: "Yönetici" | "Garson" | "Şef" | "Kasiyer" | "Kurye"
  avatar?: string
  restaurant_id?: string
}

export interface Courier {
  id: string
  name: string
  email?: string
  phone: string
  status: "Müsait" | "Siparişte" | "Teslimatta"
  avatar?: string
  vehicleType: "Motorsiklet" | "Araba" | "Bisiklet"
  vehiclePlate?: string
  activeFrom: Date
  totalDeliveries: number
  currentOrderId?: string
  location?: {
    lat: number
    lng: number
  }
}

export interface DeliveryAddress {
  fullAddress?: string
  address?: string
  district?: string
  city?: string
  contactName?: string
  customerName?: string
  contactPhone?: string
  phone?: string
  instructions?: string
  location?: {
    lat: number
    lng: number
  }
}

export interface Notification {
  id: string
  title: string
  message: string
  type: "info" | "success" | "warning" | "error"
  read: boolean
  createdAt: Date
  targetUserId?: string
  targetRole?: User["role"]
  relatedOrderId?: string
  action?: string
}

export interface Category {
  id: string
  name: string
  description?: string
  icon?: string
  sortOrder?: number
  active?: boolean
  restaurant_id?: string
}

export interface Reservation {
  id: string
  customerName: string
  date: Date
  people: number
  tableId?: string
  tableNumber?: string
  phone: string
  email?: string
  notes?: string
  status: "Onaylandı" | "Beklemede" | "Tamamlandı" | "İptal Edildi" | "Gelmedi"
}

export interface InventoryItem {
  id: string
  productId: string
  productName?: string
  currentStock: number
  minStock: number
  maxStock?: number
  unit: string
  costPrice?: number
  supplierId?: string
  lastUpdated: string
}

export interface Supplier {
  id: string
  name: string
  contact_name?: string
  phone?: string
  email?: string
  address?: string
  restaurant_id: string
  created_at?: string
  updated_at?: string
}
