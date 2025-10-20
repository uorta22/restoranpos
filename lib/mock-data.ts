import type { FoodItem, Table, Order, CartItem, User, Category, Courier } from "./types"

// Demo Restaurant ID
export const DEMO_RESTAURANT_ID = "demo-restaurant-001"

// Demo User
export const DEMO_USER: User = {
  id: "demo-user-001",
  name: "Demo Admin",
  email: "admin@demo.com",
  role: "Yönetici",
  avatar: "/placeholder.svg?height=40&width=40",
  restaurant_id: DEMO_RESTAURANT_ID,
}

// Mock Categories
export const mockCategories: Category[] = [
  { id: "cat-1", name: "Başlangıçlar" },
  { id: "cat-2", name: "Ana Yemekler" },
  { id: "cat-3", name: "Pizza" },
  { id: "cat-4", name: "Burger" },
  { id: "cat-5", name: "İçecekler" },
  { id: "cat-6", name: "Tatlılar" },
]

// Mock Food Items
export const mockFoodItems: FoodItem[] = [
  {
    id: "food-1",
    title: "Margherita Pizza",
    description: "Domates sosu, mozzarella, fesleğen",
    price: 45.00,
    image: "/placeholder.svg?height=160&width=320",
    category: "Pizza",
    available: true,
    type: "Vejeteryan",
    discount: 0,
    stock: 25,
  },
  {
    id: "food-2",
    title: "Chicken Burger",
    description: "Tavuk göğsü, salata, domates, turşu",
    price: 35.00,
    image: "/placeholder.svg?height=160&width=320",
    category: "Burger",
    available: true,
    type: "Et",
    discount: 5,
    stock: 15,
  },
  {
    id: "food-3",
    title: "Mercimek Çorbası",
    description: "Geleneksel kırmızı mercimek çorbası",
    price: 12.00,
    image: "/placeholder.svg?height=160&width=320",
    category: "Başlangıçlar",
    available: true,
    type: "Vejeteryan",
    discount: 0,
    stock: 50,
  },
  {
    id: "food-4",
    title: "Izgara Köfte",
    description: "El yapımı köfte, bulgur pilavı, salata",
    price: 55.00,
    image: "/placeholder.svg?height=160&width=320",
    category: "Ana Yemekler",
    available: true,
    type: "Et",
    discount: 0,
    stock: 20,
  },
  {
    id: "food-5",
    title: "Coca Cola",
    description: "330ml şişe",
    price: 8.00,
    image: "/placeholder.svg?height=160&width=320",
    category: "İçecekler",
    available: true,
    type: "Vejeteryan",
    discount: 0,
    stock: 100,
  },
  {
    id: "food-6",
    title: "Baklava",
    description: "3 dilim geleneksel baklava",
    price: 25.00,
    image: "/placeholder.svg?height=160&width=320",
    category: "Tatlılar",
    available: true,
    type: "Vejeteryan",
    discount: 10,
    stock: 30,
  },
  {
    id: "food-7",
    title: "Pepperoni Pizza",
    description: "Domates sosu, mozzarella, pepperoni",
    price: 52.00,
    image: "/placeholder.svg?height=160&width=320",
    category: "Pizza",
    available: true,
    type: "Et",
    discount: 0,
    stock: 18,
  },
  {
    id: "food-8",
    title: "Veggie Burger",
    description: "Sebze köftesi, avokado, roka",
    price: 38.00,
    image: "/placeholder.svg?height=160&width=320",
    category: "Burger",
    available: true,
    type: "Vejeteryan",
    discount: 0,
    stock: 12,
  },
]

// Mock Tables
export const mockTables: Table[] = [
  {
    id: "table-1",
    number: "1",
    capacity: 4,
    status: "Müsait",
    section: "İç Mekan",
    position: { x: 100, y: 100 }
  },
  {
    id: "table-2",
    number: "2",
    capacity: 2,
    status: "Dolu",
    section: "İç Mekan",
    customer: "Ahmet Yılmaz",
    currentOrderId: "order-1",
    position: { x: 200, y: 100 }
  },
  {
    id: "table-3",
    number: "3",
    capacity: 6,
    status: "Rezerve",
    section: "Dış Mekan",
    customer: "Ayşe Kaya",
    position: { x: 100, y: 200 }
  },
  {
    id: "table-4",
    number: "4",
    capacity: 4,
    status: "Müsait",
    section: "İç Mekan",
    position: { x: 200, y: 200 }
  },
  {
    id: "table-5",
    number: "5",
    capacity: 8,
    status: "Müsait",
    section: "Dış Mekan",
    position: { x: 300, y: 100 }
  },
]

// Mock Users
export const mockUsers: User[] = [
  DEMO_USER,
  {
    id: "user-2",
    name: "Mehmet Garson",
    email: "mehmet@demo.com",
    role: "Garson",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "user-3",
    name: "Fatma Şef",
    email: "fatma@demo.com",
    role: "Şef",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "user-4",
    name: "Ali Kasiyer",
    email: "ali@demo.com",
    role: "Kasiyer",
    avatar: "/placeholder.svg?height=40&width=40",
  },
]

// Mock Couriers
export const mockCouriers: Courier[] = [
  {
    id: "courier-1",
    name: "Emre Kurye",
    phone: "+90 555 123 4567",
    status: "Müsait",
    avatar: "/placeholder.svg?height=40&width=40",
    vehicleType: "Motorsiklet",
    vehiclePlate: "34 ABC 123",
    activeFrom: new Date("2023-01-15"),
    totalDeliveries: 156,
  },
  {
    id: "courier-2",
    name: "Zeynep Hızlı",
    phone: "+90 555 234 5678",
    status: "Siparişte",
    avatar: "/placeholder.svg?height=40&width=40",
    vehicleType: "Bisiklet",
    vehiclePlate: "",
    activeFrom: new Date("2023-03-01"),
    totalDeliveries: 89,
    currentOrderId: "order-3",
  },
  {
    id: "courier-3",
    name: "Can Sürat",
    phone: "+90 555 345 6789",
    status: "Müsait",
    avatar: "/placeholder.svg?height=40&width=40",
    vehicleType: "Araba",
    vehiclePlate: "06 XYZ 789",
    activeFrom: new Date("2023-02-10"),
    totalDeliveries: 203,
  },
]

// Sample cart items
const sampleCartItem1: CartItem = {
  id: "cart-1",
  foodItem: mockFoodItems[0], // Margherita Pizza
  quantity: 2,
  notes: "Az baharatlı lütfen"
}

const sampleCartItem2: CartItem = {
  id: "cart-2",
  foodItem: mockFoodItems[4], // Coca Cola
  quantity: 2,
}

const sampleCartItem3: CartItem = {
  id: "cart-3",
  foodItem: mockFoodItems[1], // Chicken Burger
  quantity: 1,
  notes: "Orta pişmiş"
}

// Mock Orders
export const mockOrders: Order[] = [
  {
    id: "order-1",
    items: [sampleCartItem1, sampleCartItem2],
    total: 106.00,
    status: "Hazırlanıyor",
    createdAt: new Date("2024-01-15T12:30:00"),
    updatedAt: new Date("2024-01-15T12:35:00"),
    tableId: "table-2",
    tableName: "2",
    customerName: "Ahmet Yılmaz",
    paymentStatus: "Beklemede",
    notes: "Acele sipariş",
    isDelivery: false,
  },
  {
    id: "order-2",
    items: [sampleCartItem3, sampleCartItem2],
    total: 43.00,
    status: "Tamamlandı",
    createdAt: new Date("2024-01-15T11:15:00"),
    updatedAt: new Date("2024-01-15T12:00:00"),
    customerName: "Elif Demir",
    paymentStatus: "Ödendi",
    paymentMethod: "Kredi Kartı",
    isDelivery: true,
    deliveryStatus: "Teslim Edildi",
    deliveryAddress: {
      fullAddress: "Atatürk Mahallesi, 123. Sokak No:45 Daire:3",
      district: "Çankaya",
      city: "Ankara",
      contactName: "Elif Demir",
      contactPhone: "+90 555 987 6543",
    },
  },
  {
    id: "order-3",
    items: [
      {
        id: "cart-4",
        foodItem: mockFoodItems[6], // Pepperoni Pizza
        quantity: 1,
      },
      {
        id: "cart-5",
        foodItem: mockFoodItems[5], // Baklava
        quantity: 2,
      }
    ],
    total: 97.00,
    status: "Hazır",
    createdAt: new Date("2024-01-15T13:00:00"),
    updatedAt: new Date("2024-01-15T13:25:00"),
    customerName: "Osman Kılıç",
    paymentStatus: "Ödendi",
    paymentMethod: "Nakit",
    isDelivery: true,
    deliveryStatus: "Yolda",
    courierId: "courier-2",
    deliveryAddress: {
      fullAddress: "Kızılay Mahallesi, 456. Cadde No:78",
      district: "Çankaya",
      city: "Ankara",
      contactName: "Osman Kılıç",
      contactPhone: "+90 555 456 7890",
    },
  },
  {
    id: "order-4",
    items: [sampleCartItem1],
    total: 90.00,
    status: "Beklemede",
    createdAt: new Date("2024-01-15T13:45:00"),
    updatedAt: new Date("2024-01-15T13:45:00"),
    tableId: "table-1",
    tableName: "1",
    customerName: "Selin Özkan",
    paymentStatus: "Beklemede",
    isDelivery: false,
  },
]

// Mock Inventory
export const mockInventory = [
  {
    id: "inv-1",
    productId: "food-1",
    productName: "Margherita Pizza",
    currentStock: 25,
    minStock: 10,
    maxStock: 50,
    unit: "adet",
    costPrice: 20.00,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "inv-2",
    productId: "food-2",
    productName: "Chicken Burger",
    currentStock: 15,
    minStock: 15,
    maxStock: 40,
    unit: "adet",
    costPrice: 18.00,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "inv-3",
    productId: "food-3",
    productName: "Mercimek Çorbası",
    currentStock: 50,
    minStock: 20,
    maxStock: 100,
    unit: "porsiyon",
    costPrice: 5.00,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "inv-4",
    productId: "food-4",
    productName: "Izgara Köfte",
    currentStock: 20,
    minStock: 25,
    maxStock: 60,
    unit: "porsiyon",
    costPrice: 25.00,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "inv-5",
    productId: "food-5",
    productName: "Coca Cola",
    currentStock: 5,
    minStock: 50,
    maxStock: 200,
    unit: "şişe",
    costPrice: 3.50,
    lastUpdated: new Date().toISOString(),
  },
]

// Mock Analytics
export const mockAnalytics = {
  id: "analytics-1",
  date: new Date().toISOString().split("T")[0],
  totalOrders: mockOrders.length,
  totalRevenue: mockOrders.reduce((sum, order) => sum + order.total, 0),
  avgOrderValue: mockOrders.reduce((sum, order) => sum + order.total, 0) / mockOrders.length,
  popularItems: [
    { name: "Margherita Pizza", count: 3 },
    { name: "Coca Cola", count: 4 },
    { name: "Chicken Burger", count: 1 },
    { name: "Pepperoni Pizza", count: 1 },
    { name: "Baklava", count: 2 },
  ],
  peakHours: [
    { hour: 12, count: 2 },
    { hour: 13, count: 2 },
    { hour: 11, count: 1 },
  ],
}

// Reservations mock data
export const mockReservations = [
  {
    id: "res-1",
    customerName: "Ayşe Kaya",
    date: new Date("2024-01-16T19:00:00"),
    people: 4,
    tableNumber: "3",
    phone: "+90 555 111 2233",
    notes: "Doğum günü kutlaması",
    status: "Onaylandı" as const,
  },
  {
    id: "res-2",
    customerName: "Mehmet Aydın",
    date: new Date("2024-01-16T20:30:00"),
    people: 2,
    tableNumber: "1",
    phone: "+90 555 444 5566",
    status: "Beklemede" as const,
  },
  {
    id: "res-3",
    customerName: "Zehra Gül",
    date: new Date("2024-01-17T18:00:00"),
    people: 6,
    tableNumber: "5",
    phone: "+90 555 777 8899",
    notes: "İş yemeği",
    status: "Onaylandı" as const,
  },
]

// Mock suppliers
export const mockSuppliers = [
  {
    id: "sup-1",
    name: "Et Dünyası",
    contact_name: "Hasan Butcher",
    phone: "+90 312 123 4567",
    email: "hasan@etdunyasi.com",
    address: "Ostim OSB, Ankara",
    restaurant_id: DEMO_RESTAURANT_ID,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "sup-2",
    name: "Sebze Bahçesi",
    contact_name: "Ayşe Farmer",
    phone: "+90 312 234 5678",
    email: "ayse@sebzebahcesi.com",
    address: "Polatlı, Ankara",
    restaurant_id: DEMO_RESTAURANT_ID,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
]

// Helper functions for generating random data
export const generateRandomId = () => Math.random().toString(36).substring(2, 9)

export const generateRandomOrder = (): Order => {
  const items = mockFoodItems
    .sort(() => 0.5 - Math.random())
    .slice(0, Math.floor(Math.random() * 3) + 1)
    .map(food => ({
      id: generateRandomId(),
      foodItem: food,
      quantity: Math.floor(Math.random() * 3) + 1,
    }))

  const total = items.reduce((sum, item) => sum + (item.foodItem.price * item.quantity), 0)

  return {
    id: generateRandomId(),
    items,
    total,
    status: ["Beklemede", "Hazırlanıyor", "Hazır", "Tamamlandı"][Math.floor(Math.random() * 4)] as any,
    createdAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
    customerName: ["Ahmet", "Ayşe", "Mehmet", "Fatma", "Ali", "Zeynep"][Math.floor(Math.random() * 6)] + " " +
                 ["Yılmaz", "Kaya", "Demir", "Çelik", "Aydın", "Özkan"][Math.floor(Math.random() * 6)],
    paymentStatus: Math.random() > 0.5 ? "Ödendi" : "Beklemede",
    paymentMethod: Math.random() > 0.5 ? "Kredi Kartı" : "Nakit",
    isDelivery: Math.random() > 0.7,
  }
}