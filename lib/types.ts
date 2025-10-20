export interface FoodItem {
  id: string
  title: string
  description?: string
  price: number
  image?: string
  category: string // This will store the category NAME
  available: boolean
  type: "Et" | "Vejeteryan"
  discount?: number
  stock?: number
  // restaurant_id?: string; // Consider adding this if not already present and needed
}

export interface CartItem {
  id: string // Or remove if cart items are not stored with IDs themselves
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
  // restaurant_id?: string;
}

export interface Order {
  id: string
  items: CartItem[]
  total: number
  status: OrderStatus
  createdAt: Date
  updatedAt: Date
  tableId?: string
  tableName?: string
  customerName?: string
  paymentStatus: PaymentStatus
  paymentMethod?: PaymentMethod
  notes?: string
  orderType: OrderType
  deliveryAddress?: DeliveryAddress
  courierId?: string
  estimatedReadyTime?: Date
  estimatedDeliveryTime?: Date
  confirmedAt?: Date
  preparedAt?: Date
  servedAt?: Date
  completedAt?: Date
  priority: OrderPriority
  // restaurant_id?: string;
}

export interface User {
  id: string
  name: string // Consider mapping to full_name from Supabase
  email: string
  role: "Yönetici" | "Garson" | "Şef" | "Kasiyer" | "Kurye" // Align with public.users.role
  avatar?: string
  // restaurant_id?: string;
}

export interface Courier {
  id: string
  name: string
  phone: string
  status: "Müsait" | "Siparişte" | "Teslimatta"
  avatar?: string
  vehicleType: "Motorsiklet" | "Araba" | "Bisiklet"
  vehiclePlate?: string
  activeFrom: Date // Ensure this is a Date object or string as appropriate
  totalDeliveries: number
  currentOrderId?: string
  location?: {
    lat: number
    lng: number
  }
  // restaurant_id?: string;
}

export interface DeliveryAddress {
  fullAddress: string
  district: string
  city: string
  contactName: string
  contactPhone: string
  instructions?: string
  location?: {
    lat: number
    lng: number
  }
}

export enum OrderType {
  DINE_IN = "Restoranda",
  TAKEAWAY = "Gel-Al",
  DELIVERY = "Paket Servis"
}

export enum OrderStatus {
  PENDING_CONFIRMATION = "Onay Bekliyor",
  CONFIRMED = "Onaylandı",
  PREPARING = "Hazırlanıyor",
  READY_FOR_PAYMENT = "Ödeme Bekliyor",
  PAID = "Ödendi",
  READY_FOR_SERVICE = "Servis Bekliyor",
  OUT_FOR_DELIVERY = "Teslimat Yolda",
  SERVED = "Servis Edildi",
  COMPLETED = "Tamamlandı",
  CANCELLED = "İptal Edildi"
}

export enum PaymentStatus {
  PENDING = "Beklemede",
  PARTIAL = "Kısmi Ödendi",
  PAID = "Ödendi",
  REFUNDED = "İade Edildi"
}

export enum PaymentMethod {
  CASH = "Nakit",
  CARD = "Kredi Kartı",
  ONLINE = "Online Ödeme",
  MEAL_CARD = "Yemek Kartı"
}

export enum OrderPriority {
  LOW = "Düşük",
  NORMAL = "Normal",
  HIGH = "Yüksek",
  URGENT = "Acil"
}

export interface OrderWorkflow {
  orderId: string
  currentStatus: OrderStatus
  nextPossibleStatuses: OrderStatus[]
  requiresPayment: boolean
  estimatedMinutes: number
  assignedStaff?: string
  paymentStrategy?: {
    requiresUpfrontPayment: boolean
    allowsCashOnDelivery: boolean
    allowsTablePayment: boolean
    preferredMethods: PaymentMethod[]
  }
  paymentRequirements?: {
    mustPayNow: boolean
    canPayLater: boolean
    suggestedTiming: 'before_preparation' | 'before_service' | 'after_service'
    reason: string
  }
}

export interface OrderStatusChange {
  orderId: string
  fromStatus: OrderStatus
  toStatus: OrderStatus
  changedBy: string
  timestamp: Date
  notes?: string
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

// Added simple Category type
export interface Category {
  id: string
  name: string
  // restaurant_id?: string; // Consider if categories are restaurant-specific
  // Add other fields like 'icon' if necessary
}
