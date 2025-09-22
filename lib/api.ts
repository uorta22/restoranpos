import { getClientSupabaseInstance, isSupabaseConfigured } from "./supabase"
import type { FoodItem, Table, Order, CartItem } from "./types" // Added Category

const getSupabase = () => {
  if (!isSupabaseConfigured()) {
    console.warn(
      "Supabase is not configured. Make sure to set the SUPABASE_URL and SUPABASE_ANON_KEY environment variables.",
    )
    return null
  }
  return getClientSupabaseInstance()
}

// Reservation interface
interface Reservation {
  id: string
  customerName: string
  date: Date
  people: number
  tableNumber?: string
  phone: string
  notes?: string
  status: "Onaylandı" | "Beklemede" | "İptal"
}

// Analytics interface
interface Analytics {
  id: string
  date: string
  totalOrders: number
  totalRevenue: number
  avgOrderValue: number
  popularItems: any[]
  peakHours: any[]
}

// Inventory interface
interface InventoryItem {
  id: string
  productId: string
  currentStock: number
  minStock: number
  maxStock: number
  unit: string
  costPrice?: number
  supplierId?: string
  lastUpdated: string
}

// Supplier interface
interface Supplier {
  id: string
  name: string
  contact_name?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  restaurant_id: string
  created_at?: string
  updated_at?: string
}

// Orders API - Database column'larına uygun
export const ordersApi = {
  async getAll(): Promise<Order[]> {
    try {
      const supabase = getSupabase()
      if (!supabase) return []

      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          tables(number, section)
        `)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Orders fetch error:", error)
        return []
      }

      return (
        data?.map((order) => ({
          id: order.id,
          items: order.items as CartItem[],
          total: order.total_amount, // Database'den total_amount alıyoruz
          status: order.status as "Beklemede" | "Hazırlanıyor" | "Hazır" | "Tamamlandı" | "İptal Edildi",
          paymentStatus: order.payment_status as "Beklemede" | "Ödendi",
          paymentMethod: order.payment_method,
          createdAt: new Date(order.created_at), // Ensure Date object
          updatedAt: new Date(order.updated_at), // Ensure Date object
          tableName: order.tables?.number,
          customerName: order.customer_name,
          notes: order.notes,
          tableId: order.table_id,
          isDelivery: order.is_delivery,
          deliveryStatus: order.delivery_status as "Beklemede" | "Yolda" | "Teslim Edildi",
          deliveryAddress: order.delivery_address,
        })) || []
      )
    } catch (error) {
      console.error("Orders fetch error:", error)
      return []
    }
  },

  async create(orderData: {
    items: CartItem[]
    total: number
    tableName?: string
    customerName?: string
    notes?: string
    tableId?: string | null
    isDelivery?: boolean
    deliveryAddress?: any
  }): Promise<Order | null> {
    try {
      const supabase = getSupabase()
      if (!supabase) return null

      // Validation
      if (!orderData.items || orderData.items.length === 0) {
        console.error("Order create error: No items provided")
        return null
      }

      if (!orderData.total || orderData.total <= 0) {
        console.error("Order create error: Invalid total amount:", orderData.total)
        return null
      }

      console.log("Creating order with validated data:", {
        ...orderData,
        total_amount: orderData.total,
      })

      const { data, error } = await supabase
        .from("orders")
        .insert({
          table_id: orderData.tableId,
          customer_name: orderData.customerName,
          items: orderData.items,
          total_amount: Number(orderData.total),
          status: "Beklemede",
          payment_status: "Beklemede",
          notes: orderData.notes,
          is_delivery: orderData.isDelivery || false,
          delivery_address: orderData.deliveryAddress,
          delivery_status: orderData.isDelivery ? "Beklemede" : null,
          // created_at and updated_at will be set by default by Supabase
        })
        .select()
        .single()

      if (error) {
        console.error("Order create error:", error)
        return null
      }

      console.log("Order created successfully:", data)

      return {
        id: data.id,
        items: data.items as CartItem[],
        total: data.total_amount,
        status: data.status,
        paymentStatus: data.payment_status,
        paymentMethod: data.payment_method,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        tableName: orderData.tableName,
        customerName: data.customer_name,
        notes: data.notes,
        tableId: data.table_id,
        isDelivery: data.is_delivery,
        deliveryStatus: data.delivery_status,
        deliveryAddress: data.delivery_address,
      }
    } catch (error) {
      console.error("Order create error:", error)
      return null
    }
  },

  async updateStatus(
    id: string,
    status: "Beklemede" | "Hazırlanıyor" | "Hazır" | "Tamamlandı" | "İptal Edildi",
  ): Promise<boolean> {
    try {
      const supabase = getSupabase()
      if (!supabase) return false

      const { error } = await supabase
        .from("orders")
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)

      if (error) {
        console.error("Order status update error:", error)
        return false
      }
      return true
    } catch (error) {
      console.error("Order status update error:", error)
      return false
    }
  },

  async updatePaymentStatus(id: string, status: "Beklemede" | "Ödendi", method?: string): Promise<boolean> {
    try {
      const supabase = getSupabase()
      if (!supabase) return false

      const { error } = await supabase
        .from("orders")
        .update({
          payment_status: status,
          payment_method: method,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)

      if (error) {
        console.error("Payment status update error:", error)
        return false
      }
      return true
    } catch (error) {
      console.error("Payment status update error:", error)
      return false
    }
  },

  async updateDeliveryStatus(id: string, status: "Beklemede" | "Yolda" | "Teslim Edildi"): Promise<boolean> {
    try {
      const supabase = getSupabase()
      if (!supabase) return false

      const { error } = await supabase
        .from("orders")
        .update({
          delivery_status: status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)

      if (error) {
        console.error("Delivery status update error:", error)
        return false
      }
      return true
    } catch (error) {
      console.error("Delivery status update error:", error)
      return false
    }
  },
}

// Analytics API
export const analyticsApi = {
  async getDashboardStats(): Promise<Analytics | null> {
    try {
      const supabase = getSupabase()
      if (!supabase) return null

      const today = new Date().toISOString().split("T")[0]

      const { data, error } = await supabase.from("analytics").select("*").eq("date", today).single()

      if (error && error.code !== "PGRST116") {
        // PGRST116 = no rows returned
        console.error("Analytics fetch error:", error)
        return null
      }

      if (!data) {
        // Generate analytics for today
        return await this.generateDailyAnalytics(today)
      }

      return {
        id: data.id,
        date: data.date,
        totalOrders: data.total_orders,
        totalRevenue: data.total_revenue,
        avgOrderValue: data.avg_order_value,
        popularItems: data.popular_items || [],
        peakHours: data.peak_hours || [],
      }
    } catch (error) {
      console.error("Analytics fetch error:", error)
      return null
    }
  },

  async generateDailyAnalytics(date: string): Promise<Analytics | null> {
    try {
      const supabase = getSupabase()
      if (!supabase) return null

      // Get orders for the date
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .gte("created_at", `${date}T00:00:00`)
        .lt("created_at", `${date}T23:59:59`)

      if (ordersError) {
        console.error("Orders fetch error for analytics:", ordersError)
        return null
      }

      const totalOrders = orders?.length || 0
      const totalRevenue = orders?.reduce((sum, order) => sum + order.total_amount, 0) || 0 // total_amount kullanıyoruz
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

      // Calculate popular items
      const itemCounts: { [key: string]: number } = {}
      orders?.forEach((order) => {
        order.items?.forEach((item: any) => {
          const itemName = item.foodItem?.title || "Unknown"
          itemCounts[itemName] = (itemCounts[itemName] || 0) + item.quantity
        })
      })

      const popularItems = Object.entries(itemCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }))

      // Calculate peak hours
      const hourCounts: { [key: number]: number } = {}
      orders?.forEach((order) => {
        const hour = new Date(order.created_at).getHours()
        hourCounts[hour] = (hourCounts[hour] || 0) + 1
      })

      const peakHours = Object.entries(hourCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([hour, count]) => ({ hour: Number.parseInt(hour), count }))

      // Save analytics
      const { data, error } = await supabase
        .from("analytics")
        .insert({
          date,
          total_orders: totalOrders,
          total_revenue: totalRevenue,
          avg_order_value: avgOrderValue,
          popular_items: popularItems,
          peak_hours: peakHours,
        })
        .select()
        .single()

      if (error) {
        console.error("Analytics save error:", error)
        return null
      }

      return {
        id: data.id,
        date: data.date,
        totalOrders: data.total_orders,
        totalRevenue: data.total_revenue,
        avgOrderValue: data.avg_order_value,
        popularItems: data.popular_items,
        peakHours: data.peak_hours,
      }
    } catch (error) {
      console.error("Analytics generation error:", error)
      return null
    }
  },
}

// Inventory API
export const inventoryApi = {
  async getAll(): Promise<InventoryItem[]> {
    try {
      const supabase = getSupabase()
      if (!supabase) return []

      const { data, error } = await supabase
        .from("inventory")
        .select(`
          *,
          products(name, category_id) 
        `) // Assuming products has category_id to join for category name
        .order("last_updated", { ascending: false })

      if (error) {
        console.error("Inventory fetch error:", error)
        return []
      }

      return (
        data?.map((item) => ({
          id: item.id,
          productId: item.product_id,
          currentStock: item.current_stock,
          minStock: item.min_stock,
          maxStock: item.max_stock,
          unit: item.unit,
          costPrice: item.cost_price,
          supplierId: item.supplier_id,
          lastUpdated: item.last_updated,
          // productName: item.products?.name, // This would require a join
          // productCategory: item.products?.categories?.name, // This would require a nested join
        })) || []
      )
    } catch (error) {
      console.error("Inventory fetch error:", error)
      return []
    }
  },

  async updateStock(productId: string, newStock: number): Promise<boolean> {
    try {
      const supabase = getSupabase()
      if (!supabase) return false

      const { error } = await supabase
        .from("inventory")
        .update({
          current_stock: newStock,
          last_updated: new Date().toISOString(),
        })
        .eq("product_id", productId)

      if (error) {
        console.error("Stock update error:", error)
        return false
      }
      return true
    } catch (error) {
      console.error("Stock update error:", error)
      return false
    }
  },

  async getLowStockItems(): Promise<InventoryItem[]> {
    try {
      const supabase = getSupabase()
      if (!supabase) return []

      const { data, error } = await supabase
        .from("inventory")
        .select(`
          *,
          products(name) 
        `) // Join with products to get name
        .filter("current_stock", "lte", "min_stock")

      if (error) {
        console.error("Low stock fetch error:", error)
        return []
      }

      return (
        data?.map((item) => ({
          id: item.id,
          productId: item.product_id,
          currentStock: item.current_stock,
          minStock: item.min_stock,
          maxStock: item.max_stock,
          unit: item.unit,
          costPrice: item.cost_price,
          supplierId: item.supplier_id,
          lastUpdated: item.last_updated,
          // productName: item.products?.name, // This would require a join
        })) || []
      )
    } catch (error) {
      console.error("Low stock fetch error:", error)
      return []
    }
  },
}

// Products API
export const productsApi = {
  async getAll(restaurant_id: string): Promise<FoodItem[]> {
    try {
      const supabase = getSupabase()
      if (!supabase) return []

      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          categories (name)
        `)
        .eq("restaurant_id", restaurant_id) // Filter by restaurant_id
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Products fetch error:", error)
        return []
      }

      return (
        data?.map((product) => ({
          id: product.id,
          title: product.name,
          description: product.description || "",
          price: product.price,
          image: product.image_url || "/placeholder.svg?height=160&width=320",
          category: product.categories?.name || "Diğer",
          category_id: product.category_id, // Ensure this column exists and is fetched
          available: product.is_available,
          type: product.type as "Et" | "Vejeteryan",
          discount: product.discount || 0,
          stock: product.stock,
          restaurant_id: product.restaurant_id, // Include restaurant_id in returned FoodItem
        })) || []
      )
    } catch (error) {
      console.error("Products fetch error:", error)
      return []
    }
  },

  async create(productPayload: {
    title: string
    description?: string
    price: number
    image?: string
    category_id: string
    available: boolean
    type: "Et" | "Vejeteryan"
    discount?: number
    stock?: number
    restaurant_id: string
  }): Promise<FoodItem | null> {
    try {
      const supabase = getSupabase()
      if (!supabase) return null

      const { data, error } = await supabase
        .from("products")
        .insert({
          name: productPayload.title,
          description: productPayload.description,
          price: productPayload.price,
          image_url: productPayload.image,
          category_id: productPayload.category_id,
          is_available: productPayload.available,
          type: productPayload.type,
          discount: productPayload.discount,
          stock: productPayload.stock,
          restaurant_id: productPayload.restaurant_id, // Include restaurant_id in insert
        })
        .select(`*, categories (name)`)
        .single()

      if (error) {
        console.error("Product create error:", error) // This is where the RLS error was caught
        return null
      }

      // Create inventory entry for new product
      await supabase.from("inventory").insert({
        product_id: data.id,
        current_stock: productPayload.stock || 0,
        min_stock: 5,
        max_stock: 100,
        unit: "adet",
        // restaurant_id: productPayload.restaurant_id, // Consider if inventory also needs restaurant_id for RLS
      })

      return {
        id: data.id,
        title: data.name,
        description: data.description || "",
        price: data.price,
        image: data.image_url || "/placeholder.svg?height=160&width=320",
        category: data.categories?.name || "Diğer",
        category_id: data.category_id,
        available: data.is_available,
        type: data.type as "Et" | "Vejeteryan",
        discount: data.discount || 0,
        stock: data.stock,
        restaurant_id: data.restaurant_id,
      }
    } catch (error) {
      console.error("Product create error (catch):", error)
      return null
    }
  },

  async update(
    productId: string,
    productPayload: Partial<{
      // Use Partial for updates, ensure restaurant_id is for filtering
      title: string
      description?: string
      price: number
      image?: string
      category_id: string
      available: boolean
      type: "Et" | "Vejeteryan"
      discount?: number
      stock?: number
    }>,
    restaurant_id: string, // Pass restaurant_id for RLS check on update
  ): Promise<FoodItem | null> {
    try {
      const supabase = getSupabase()
      if (!supabase) return null

      const updateData: { [key: string]: any } = {}
      if (productPayload.title !== undefined) updateData.name = productPayload.title
      if (productPayload.description !== undefined) updateData.description = productPayload.description
      if (productPayload.price !== undefined) updateData.price = productPayload.price
      if (productPayload.image !== undefined) updateData.image_url = productPayload.image
      if (productPayload.category_id !== undefined) updateData.category_id = productPayload.category_id
      if (productPayload.available !== undefined) updateData.is_available = productPayload.available
      if (productPayload.type !== undefined) updateData.type = productPayload.type
      if (productPayload.discount !== undefined) updateData.discount = productPayload.discount
      if (productPayload.stock !== undefined) updateData.stock = productPayload.stock

      if (Object.keys(updateData).length === 0) {
        console.warn("Product update called with no data to update for product ID:", productId)
        // Optionally fetch and return current product or error
        const currentProduct = await this.getAll(restaurant_id).then((products) =>
          products.find((p) => p.id === productId),
        )
        return currentProduct || null
      }

      const { data, error } = await supabase
        .from("products")
        .update(updateData)
        .eq("id", productId)
        .eq("restaurant_id", restaurant_id) // Ensure update is scoped to the restaurant
        .select(`*, categories (name)`)
        .single()

      if (error) {
        console.error("Product update error:", error)
        return null
      }

      if (productPayload.stock !== undefined) {
        await inventoryApi.updateStock(productId, productPayload.stock)
      }

      return {
        id: data.id,
        title: data.name,
        description: data.description || "",
        price: data.price,
        image: data.image_url || "/placeholder.svg?height=160&width=320",
        category: data.categories?.name || "Diğer",
        category_id: data.category_id,
        available: data.is_available,
        type: data.type as "Et" | "Vejeteryan",
        discount: data.discount || 0,
        stock: data.stock,
        restaurant_id: data.restaurant_id,
      }
    } catch (error) {
      console.error("Product update error (catch):", error)
      return null
    }
  },

  async delete(productId: string, restaurant_id: string): Promise<boolean> {
    try {
      const supabase = getSupabase()
      if (!supabase) return false

      await supabase.from("inventory").delete().eq("product_id", productId)

      const { error } = await supabase.from("products").delete().eq("id", productId).eq("restaurant_id", restaurant_id) // Ensure delete is scoped to the restaurant

      if (error) {
        console.error("Product delete error:", error)
        return false
      }
      return true
    } catch (error) {
      console.error("Product delete error (catch):", error)
      return false
    }
  },
}

// Tables API (existing)
export const tablesApi = {
  async getAll(): Promise<Table[]> {
    try {
      const supabase = getSupabase()
      if (!supabase) return []

      const { data, error } = await supabase.from("tables").select("*").order("number")

      if (error) {
        console.error("Tables fetch error:", error)
        return []
      }

      return (
        data?.map((table) => ({
          id: table.id,
          number: table.number,
          capacity: table.capacity,
          status: table.status as "Müsait" | "Dolu" | "Rezerve",
          section: table.section,
          customer: table.customer_name,
          currentOrderId: table.current_order_id,
          position: { x: table.position_x || 100, y: table.position_y || 100 },
        })) || []
      )
    } catch (error) {
      console.error("Tables fetch error:", error)
      return []
    }
  },

  async create(table: { number: string; capacity: number; section: string }): Promise<Table | null> {
    try {
      const supabase = getSupabase()
      if (!supabase) return null

      const { data, error } = await supabase
        .from("tables")
        .insert({
          number: table.number,
          capacity: table.capacity,
          section: table.section,
          status: "Müsait",
          position_x: 100,
          position_y: 100,
        })
        .select()
        .single()

      if (error) {
        console.error("Table create error:", error)
        return null
      }

      return {
        id: data.id,
        number: data.number,
        capacity: data.capacity,
        status: "Müsait",
        section: data.section,
        position: { x: data.position_x || 100, y: data.position_y || 100 },
      }
    } catch (error) {
      console.error("Table create error:", error)
      return null
    }
  },

  async update(id: string, updates: Partial<Table>): Promise<Table | null> {
    try {
      const supabase = getSupabase()
      if (!supabase) return null

      const { data, error } = await supabase
        .from("tables")
        .update({
          number: updates.number,
          capacity: updates.capacity,
          section: updates.section,
          status: updates.status,
          customer_name: updates.customer,
          current_order_id: updates.currentOrderId,
          position_x: updates.position?.x,
          position_y: updates.position?.y,
        })
        .eq("id", id)
        .select()
        .single()

      if (error) {
        console.error("Table update error:", error)
        return null
      }

      return {
        id: data.id,
        number: data.number,
        capacity: data.capacity,
        status: data.status as "Müsait" | "Dolu" | "Rezerve",
        section: data.section,
        customer: data.customer_name,
        currentOrderId: data.current_order_id,
        position: { x: data.position_x || 100, y: data.position_y || 100 },
      }
    } catch (error) {
      console.error("Table update error:", error)
      return null
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const supabase = getSupabase()
      if (!supabase) return false

      const { error } = await supabase.from("tables").delete().eq("id", id)

      if (error) {
        console.error("Table delete error:", error)
        return false
      }
      return true
    } catch (error) {
      console.error("Table delete error:", error)
      return false
    }
  },
}

// Reservations API (existing)
export const reservationsApi = {
  async getAll(): Promise<Reservation[]> {
    try {
      const supabase = getSupabase()
      if (!supabase) return []

      const { data, error } = await supabase
        .from("reservations")
        .select("*")
        .order("reservation_date", { ascending: true })

      if (error) {
        console.error("Reservations fetch error:", error)
        return []
      }

      return (
        data?.map((reservation) => ({
          id: reservation.id,
          customerName: reservation.customer_name,
          date: new Date(reservation.reservation_date),
          people: reservation.people,
          tableNumber: reservation.table_number,
          phone: reservation.customer_phone,
          notes: reservation.notes,
          status: reservation.status as "Onaylandı" | "Beklemede" | "İptal",
        })) || []
      )
    } catch (error) {
      console.error("Reservations fetch error:", error)
      return []
    }
  },

  async create(reservation: Omit<Reservation, "id">): Promise<Reservation | null> {
    try {
      const supabase = getSupabase()
      if (!supabase) return null

      const { data, error } = await supabase
        .from("reservations")
        .insert({
          customer_name: reservation.customerName,
          customer_phone: reservation.phone,
          people: reservation.people,
          reservation_date: reservation.date.toISOString(),
          table_number: reservation.tableNumber,
          notes: reservation.notes,
          status: reservation.status,
        })
        .select()
        .single()

      if (error) {
        console.error("Reservation create error:", error)
        return null
      }

      return {
        id: data.id,
        customerName: data.customer_name,
        date: new Date(data.reservation_date),
        people: data.people,
        tableNumber: data.table_number,
        phone: data.customer_phone,
        notes: data.notes,
        status: data.status as "Onaylandı" | "Beklemede" | "İptal",
      }
    } catch (error) {
      console.error("Reservation create error:", error)
      return null
    }
  },

  async update(id: string, reservation: Partial<Reservation>): Promise<Reservation | null> {
    try {
      const supabase = getSupabase()
      if (!supabase) return null

      const { data, error } = await supabase
        .from("reservations")
        .update({
          customer_name: reservation.customerName,
          customer_phone: reservation.phone,
          people: reservation.people,
          reservation_date: reservation.date?.toISOString(),
          table_number: reservation.tableNumber,
          notes: reservation.notes,
          status: reservation.status,
        })
        .eq("id", id)
        .select()
        .single()

      if (error) {
        console.error("Reservation update error:", error)
        return null
      }

      return {
        id: data.id,
        customerName: data.customer_name,
        date: new Date(data.reservation_date),
        people: data.people,
        tableNumber: data.table_number,
        phone: data.customer_phone,
        notes: data.notes,
        status: data.status as "Onaylandı" | "Beklemede" | "İptal",
      }
    } catch (error) {
      console.error("Reservation update error:", error)
      return null
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const supabase = getSupabase()
      if (!supabase) return false

      const { error } = await supabase.from("reservations").delete().eq("id", id)

      if (error) {
        console.error("Reservation delete error:", error)
        return false
      }
      return true
    } catch (error) {
      console.error("Reservation delete error:", error)
      return false
    }
  },
}

// Categories API
export const categoriesApi = {
  async getAll(): Promise<string[]> {
    // Returns string array for compatibility with app/page.tsx
    try {
      const supabase = getSupabase()
      if (!supabase) return []

      // Fetch from 'categories' table
      const { data, error } = await supabase.from("categories").select("name").order("name", { ascending: true })

      if (error) {
        console.error("Categories fetch error:", error)
        return []
      }

      // Map to array of names
      const categoryNames = data?.map((category: { name: string }) => category.name).filter(Boolean) || []
      return categoryNames
    } catch (error) {
      console.error("Categories fetch error (catch):", error)
      return []
    }
  },
}

// Suppliers API
export const suppliersApi = {
  async getAll(restaurant_id: string): Promise<Supplier[]> {
    try {
      const supabase = getSupabase()
      if (!supabase) return []

      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .eq("restaurant_id", restaurant_id)
        .order("name", { ascending: true })

      if (error) {
        console.error("Suppliers fetch error:", error)
        return []
      }
      return data || []
    } catch (error) {
      console.error("Suppliers fetch error (catch):", error)
      return []
    }
  },

  async getById(supplierId: string, restaurant_id: string): Promise<Supplier | null> {
    try {
      const supabase = getSupabase()
      if (!supabase) return null

      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .eq("id", supplierId)
        .eq("restaurant_id", restaurant_id)
        .single()

      if (error) {
        console.error("Supplier fetch by ID error:", error)
        return null
      }
      return data
    } catch (error) {
      console.error("Supplier fetch by ID error (catch):", error)
      return null
    }
  },

  async create(supplierData: {
    name: string
    contact_name?: string | null
    phone?: string | null
    email?: string | null
    address?: string | null
    restaurant_id: string
  }): Promise<Supplier | null> {
    try {
      const supabase = getSupabase()
      if (!supabase) return null

      const { data, error } = await supabase
        .from("suppliers")
        .insert({
          name: supplierData.name,
          contact_name: supplierData.contact_name,
          phone: supplierData.phone,
          email: supplierData.email,
          address: supplierData.address,
          restaurant_id: supplierData.restaurant_id,
        })
        .select()
        .single()

      if (error) {
        console.error("Supplier create error:", error)
        return null
      }
      return data
    } catch (error) {
      console.error("Supplier create error (catch):", error)
      return null
    }
  },

  async update(
    supplierId: string,
    updates: Partial<{
      name: string
      contact_name?: string | null
      phone?: string | null
      email?: string | null
      address?: string | null
    }>,
    restaurant_id: string,
  ): Promise<Supplier | null> {
    try {
      const supabase = getSupabase()
      if (!supabase) return null

      const { data, error } = await supabase
        .from("suppliers")
        .update(updates)
        .eq("id", supplierId)
        .eq("restaurant_id", restaurant_id) // Ensure update is scoped
        .select()
        .single()

      if (error) {
        console.error("Supplier update error:", error)
        return null
      }
      return data
    } catch (error) {
      console.error("Supplier update error (catch):", error)
      return null
    }
  },

  async delete(supplierId: string, restaurant_id: string): Promise<boolean> {
    try {
      const supabase = getSupabase()
      if (!supabase) return false

      const { error } = await supabase
        .from("suppliers")
        .delete()
        .eq("id", supplierId)
        .eq("restaurant_id", restaurant_id) // Ensure delete is scoped

      if (error) {
        console.error("Supplier delete error:", error)
        return false
      }
      return true
    } catch (error) {
      console.error("Supplier delete error (catch):", error)
      return false
    }
  },
}

// Legacy functions for backward compatibility
export const getPosts = async () => {
  if (!isSupabaseConfigured()) {
    console.warn(
      "Supabase is not configured. Make sure to set the SUPABASE_URL and SUPABASE_ANON_KEY environment variables.",
    )
    return []
  }

  const supabase = getClientSupabaseInstance()

  const { data: posts, error } = await supabase.from("posts").select("*").order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching posts:", error)
    return []
  }

  return posts || []
}

export const createPost = async (title: string, content: string) => {
  if (!isSupabaseConfigured()) {
    console.warn(
      "Supabase is not configured. Make sure to set the SUPABASE_URL and SUPABASE_ANON_KEY environment variables.",
    )
    return null
  }

  const supabase = getClientSupabaseInstance()

  const { data, error } = await supabase.from("posts").insert([{ title, content }]).select()

  if (error) {
    console.error("Error creating post:", error)
    return null
  }

  return data ? data[0] : null
}

export const updatePost = async (id: string, title: string, content: string) => {
  if (!isSupabaseConfigured()) {
    console.warn(
      "Supabase is not configured. Make sure to set the SUPABASE_URL and SUPABASE_ANON_KEY environment variables.",
    )
    return null
  }

  const supabase = getClientSupabaseInstance()

  const { data, error } = await supabase.from("posts").update({ title, content }).eq("id", id).select()

  if (error) {
    console.error("Error updating post:", error)
    return null
  }

  return data ? data[0] : null
}

export const deletePost = async (id: string) => {
  if (!isSupabaseConfigured()) {
    console.warn(
      "Supabase is not configured. Make sure to set the SUPABASE_URL and SUPABASE_ANON_KEY environment variables.",
    )
    return null
  }

  const supabase = getClientSupabaseInstance()

  const { error } = await supabase.from("posts").delete().eq("id", id)

  if (error) {
    console.error("Error deleting post:", error)
    return false
  }

  return true
}
