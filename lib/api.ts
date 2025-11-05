import { getClientSupabaseInstance, isSupabaseConfigured } from "./supabase"
import type { FoodItem, Table, Order, CartItem, User, Category, Courier, InventoryItem } from "./types"
import { OrderStatus, OrderType, PaymentStatus, PaymentMethod, OrderPriority } from "./types"
import {
  isDemoMode,
  simulateNetworkDelay,
  saveToLocalStorage,
  loadFromLocalStorage,
  DEMO_STORAGE_KEYS,
  generateId,
  showDemoNotification
} from "./demo-mode"
import {
  mockFoodItems,
  mockTables,
  mockOrders,
  mockUsers,
  mockCouriers,
  mockCategories,
  mockInventory,
  mockAnalytics,
  mockReservations,
  mockSuppliers,
  DEMO_USER,
  DEMO_RESTAURANT_ID,
  generateRandomOrder
} from "./mock-data"
import { getOrderWorkflow, getEstimatedPreparationTime, calculateOrderPriority, getPaymentStrategy, getPaymentRequirements, calculateMinimumPayment, getAdvancedPreparationTime, getDeliveryTimeEstimate, analyzeOrderDelay, getDynamicPricingSuggestion, getKitchenWorkflowPlan, assignKitchenStation, analyzeOrderComplexity } from "./order-workflow"

const getSupabase = () => {
  // Demo mode check
  if (isDemoMode()) {
    showDemoNotification("Çalışıyor - Demo veriler kullanılıyor")
    return null // Forces demo mode
  }

  if (!isSupabaseConfigured()) {
    console.warn(
      "Supabase is not configured. Falling back to demo mode.",
    )
    return null
  }
  return getClientSupabaseInstance()
}

// Demo data initialization
const initializeDemoData = () => {
  if (typeof window === 'undefined') return

  // Initialize demo data in localStorage if not exists
  if (!loadFromLocalStorage(DEMO_STORAGE_KEYS.PRODUCTS, null)) {
    saveToLocalStorage(DEMO_STORAGE_KEYS.PRODUCTS, mockFoodItems)
  }
  if (!loadFromLocalStorage(DEMO_STORAGE_KEYS.TABLES, null)) {
    saveToLocalStorage(DEMO_STORAGE_KEYS.TABLES, mockTables)
  }
  if (!loadFromLocalStorage(DEMO_STORAGE_KEYS.ORDERS, null)) {
    saveToLocalStorage(DEMO_STORAGE_KEYS.ORDERS, mockOrders)
  }
  if (!loadFromLocalStorage(DEMO_STORAGE_KEYS.USERS, null)) {
    saveToLocalStorage(DEMO_STORAGE_KEYS.USERS, mockUsers)
  }
  if (!loadFromLocalStorage(DEMO_STORAGE_KEYS.COURIERS, null)) {
    saveToLocalStorage(DEMO_STORAGE_KEYS.COURIERS, mockCouriers)
  }
  if (!loadFromLocalStorage(DEMO_STORAGE_KEYS.CATEGORIES, null)) {
    saveToLocalStorage(DEMO_STORAGE_KEYS.CATEGORIES, mockCategories)
  }
  if (!loadFromLocalStorage(DEMO_STORAGE_KEYS.INVENTORY, null)) {
    saveToLocalStorage(DEMO_STORAGE_KEYS.INVENTORY, mockInventory)
  }
  if (!loadFromLocalStorage(DEMO_STORAGE_KEYS.RESERVATIONS, null)) {
    saveToLocalStorage(DEMO_STORAGE_KEYS.RESERVATIONS, mockReservations)
  }
  if (!loadFromLocalStorage(DEMO_STORAGE_KEYS.SUPPLIERS, null)) {
    saveToLocalStorage(DEMO_STORAGE_KEYS.SUPPLIERS, mockSuppliers)
  }
  if (!loadFromLocalStorage(DEMO_STORAGE_KEYS.CURRENT_USER, null)) {
    saveToLocalStorage(DEMO_STORAGE_KEYS.CURRENT_USER, DEMO_USER)
  }
}

// Initialize demo data on module load
if (typeof window !== 'undefined') {
  initializeDemoData()
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
      await simulateNetworkDelay()

      const supabase = getSupabase()
      if (!supabase) {
        // Demo mode
        const orders = loadFromLocalStorage(DEMO_STORAGE_KEYS.ORDERS, mockOrders)
        // Ensure dates are Date objects
        return orders.map((order: any) => ({
          ...order,
          createdAt: new Date(order.createdAt),
          updatedAt: new Date(order.updatedAt),
        }))
      }

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
          total: order.total_amount,
          status: order.status,
          paymentStatus: order.payment_status,
          paymentMethod: order.payment_method,
          createdAt: new Date(order.created_at),
          updatedAt: new Date(order.updated_at),
          tableName: order.tables?.number,
          customerName: order.customer_name,
          notes: order.notes,
          tableId: order.table_id,
          orderType: order.order_type,
          isDelivery: order.is_delivery,
          deliveryStatus: order.delivery_status,
          deliveryAddress: order.delivery_address,
          priority: order.priority,
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
      await simulateNetworkDelay()

      console.log("API - ordersApi.create called with:", orderData)

      // Validation
      if (!orderData.items || orderData.items.length === 0) {
        console.error("Order create error: No items provided", { orderData })
        return null
      }

      if (!orderData.total || orderData.total <= 0) {
        console.error("Order create error: Invalid total amount:", orderData.total, { orderData })
        return null
      }

      const supabase = getSupabase()
      if (!supabase) {
        // Demo mode - Create order with new workflow
        const baseOrder = {
          id: generateId('order'),
          items: orderData.items,
          total: orderData.total,
          createdAt: new Date(),
          updatedAt: new Date(),
          tableName: orderData.tableName,
          customerName: orderData.customerName,
          notes: orderData.notes,
          tableId: orderData.tableId,
          isDelivery: orderData.isDelivery || false,
          deliveryStatus: orderData.isDelivery ? "Beklemede" : undefined,
          deliveryAddress: orderData.deliveryAddress,
          // New workflow fields
          status: OrderStatus.PENDING_CONFIRMATION,
          paymentStatus: PaymentStatus.PENDING,
          orderType: orderData.isDelivery ? OrderType.DELIVERY : (orderData.tableId ? OrderType.DINE_IN : OrderType.TAKEAWAY),
          priority: OrderPriority.NORMAL,
        } as Order

        // Calculate priority and estimated time
        const newOrder: Order = {
          ...baseOrder,
          priority: calculateOrderPriority(baseOrder),
          estimatedReadyTime: new Date(Date.now() + getEstimatedPreparationTime(baseOrder) * 60000)
        }

        const orders = loadFromLocalStorage(DEMO_STORAGE_KEYS.ORDERS, mockOrders)
        const updatedOrders = [newOrder, ...orders]
        saveToLocalStorage(DEMO_STORAGE_KEYS.ORDERS, updatedOrders)

        // Update table status if it's a dine-in order
        if (orderData.tableId && !orderData.isDelivery) {
          const tables = loadFromLocalStorage(DEMO_STORAGE_KEYS.TABLES, mockTables)
          const updatedTables = tables.map((table: any) =>
            table.id === orderData.tableId
              ? { ...table, status: "Dolu", customer: orderData.customerName, currentOrderId: newOrder.id }
              : table
          )
          saveToLocalStorage(DEMO_STORAGE_KEYS.TABLES, updatedTables)
        }

        showDemoNotification(`Yeni sipariş oluşturuldu: #${newOrder.id.slice(-6)}`)
        return newOrder
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
          status: OrderStatus.PENDING_CONFIRMATION,
          payment_status: PaymentStatus.PENDING,
          order_type: orderData.isDelivery ? OrderType.DELIVERY : (orderData.tableId ? OrderType.DINE_IN : OrderType.TAKEAWAY),
          priority: OrderPriority.NORMAL,
          notes: orderData.notes,
          is_delivery: orderData.isDelivery || false,
          delivery_address: orderData.deliveryAddress,
          delivery_status: orderData.isDelivery ? "Beklemede" : null,
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
        orderType: data.order_type,
        isDelivery: data.is_delivery,
        deliveryStatus: data.delivery_status,
        deliveryAddress: data.delivery_address,
        priority: data.priority,
      }
    } catch (error) {
      console.error("Order create error:", error)
      return null
    }
  },

  async updateStatus(
    id: string,
    status: OrderStatus,
  ): Promise<Order | null> {
    try {
      await simulateNetworkDelay()

      const supabase = getSupabase()
      if (!supabase) {
        // Demo mode
        const orders = loadFromLocalStorage(DEMO_STORAGE_KEYS.ORDERS, mockOrders)
        const orderIndex = orders.findIndex((order: any) => order.id === id)

        if (orderIndex === -1) {
          throw new Error('Sipariş bulunamadı')
        }

        const currentOrder = orders[orderIndex]
        const now = new Date()

        const updatedOrder = {
          ...currentOrder,
          status,
          updatedAt: now.toISOString()
        }

        // Set timing fields based on status transitions
        switch (status) {
          case OrderStatus.CONFIRMED:
            updatedOrder.confirmedAt = now.toISOString()
            break
          case OrderStatus.PAID:
            // For PAID status (Gel-Al orders), also update payment status
            updatedOrder.paymentStatus = PaymentStatus.PAID
            updatedOrder.paymentMethod = PaymentMethod.CASH // Default to cash for takeaway
            break
          case OrderStatus.PREPARING:
            updatedOrder.preparedAt = now.toISOString()
            break
          case OrderStatus.SERVED:
            updatedOrder.servedAt = now.toISOString()
            break
          case OrderStatus.COMPLETED:
            updatedOrder.completedAt = now.toISOString()
            break
        }

        orders[orderIndex] = updatedOrder
        saveToLocalStorage(DEMO_STORAGE_KEYS.ORDERS, orders)

        // Convert dates back to Date objects for return
        return {
          ...updatedOrder,
          createdAt: new Date(updatedOrder.createdAt),
          updatedAt: new Date(updatedOrder.updatedAt),
          confirmedAt: updatedOrder.confirmedAt ? new Date(updatedOrder.confirmedAt) : undefined,
          preparedAt: updatedOrder.preparedAt ? new Date(updatedOrder.preparedAt) : undefined,
          servedAt: updatedOrder.servedAt ? new Date(updatedOrder.servedAt) : undefined,
          completedAt: updatedOrder.completedAt ? new Date(updatedOrder.completedAt) : undefined,
          estimatedReadyTime: updatedOrder.estimatedReadyTime ? new Date(updatedOrder.estimatedReadyTime) : undefined,
        } as Order
      }

      // Prepare update data based on status
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      }

      // For PAID status (Gel-Al orders), also update payment status
      if (status === OrderStatus.PAID) {
        updateData.payment_status = PaymentStatus.PAID
        updateData.payment_method = PaymentMethod.CASH
      }

      const { data, error } = await supabase
        .from("orders")
        .update(updateData)
        .eq("id", id)
        .select()
        .single()

      if (error) {
        console.error("Order status update error:", error)
        return null
      }

      return {
        id: data.id,
        items: data.items as CartItem[],
        total: data.total_amount,
        status: data.status as OrderStatus,
        paymentStatus: data.payment_status as PaymentStatus,
        paymentMethod: data.payment_method as PaymentMethod,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        tableName: data.table_name,
        customerName: data.customer_name,
        notes: data.notes,
        tableId: data.table_id,
        orderType: data.order_type as OrderType,
        priority: data.priority as OrderPriority,
        deliveryAddress: data.delivery_address,
        courierId: data.courier_id,
        confirmedAt: data.confirmed_at ? new Date(data.confirmed_at) : undefined,
        preparedAt: data.prepared_at ? new Date(data.prepared_at) : undefined,
        servedAt: data.served_at ? new Date(data.served_at) : undefined,
        completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
        estimatedReadyTime: data.estimated_ready_time ? new Date(data.estimated_ready_time) : undefined,
        estimatedDeliveryTime: data.estimated_delivery_time ? new Date(data.estimated_delivery_time) : undefined,
      }
    } catch (error) {
      console.error("Order status update error:", error)
      return null
    }
  },

  async updatePaymentStatus(id: string, status: PaymentStatus, method?: PaymentMethod): Promise<boolean> {
    try {
      await simulateNetworkDelay()

      const supabase = getSupabase()
      if (!supabase) {
        // Demo mode
        const orders = loadFromLocalStorage(DEMO_STORAGE_KEYS.ORDERS, mockOrders)
        const updatedOrders = orders.map((order: any) =>
          order.id === id
            ? { ...order, paymentStatus: status, paymentMethod: method, updatedAt: new Date().toISOString() }
            : order
        )
        saveToLocalStorage(DEMO_STORAGE_KEYS.ORDERS, updatedOrders)
        return true
      }

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
      await simulateNetworkDelay()

      const supabase = getSupabase()
      if (!supabase) {
        // Demo mode
        const orders = loadFromLocalStorage(DEMO_STORAGE_KEYS.ORDERS, mockOrders)
        const updatedOrders = orders.map((order: any) =>
          order.id === id
            ? { ...order, deliveryStatus: status, updatedAt: new Date().toISOString() }
            : order
        )
        saveToLocalStorage(DEMO_STORAGE_KEYS.ORDERS, updatedOrders)
        return true
      }

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

  // Confirm an order
  async confirm(id: string): Promise<Order | null> {
    return this.updateStatus(id, OrderStatus.CONFIRMED)
  },

  // Cancel an order with reason
  async cancel(id: string, reason?: string): Promise<Order | null> {
    try {
      await simulateNetworkDelay()

      const supabase = getSupabase()
      if (!supabase) {
        // Demo mode
        const orders = loadFromLocalStorage(DEMO_STORAGE_KEYS.ORDERS, mockOrders)
        const orderIndex = orders.findIndex((order: any) => order.id === id)

        if (orderIndex === -1) {
          throw new Error('Sipariş bulunamadı')
        }

        const currentOrder = orders[orderIndex]
        const updatedOrder = {
          ...currentOrder,
          status: OrderStatus.CANCELLED,
          updatedAt: new Date().toISOString(),
          notes: reason ? `${currentOrder.notes || ''} - İptal Sebebi: ${reason}`.trim() : currentOrder.notes
        }

        orders[orderIndex] = updatedOrder
        saveToLocalStorage(DEMO_STORAGE_KEYS.ORDERS, orders)

        return {
          ...updatedOrder,
          createdAt: new Date(updatedOrder.createdAt),
          updatedAt: new Date(updatedOrder.updatedAt),
        } as Order
      }

      const { data, error } = await supabase
        .from("orders")
        .update({
          status: OrderStatus.CANCELLED,
          updated_at: new Date().toISOString(),
          notes: reason,
        })
        .eq("id", id)
        .select()
        .single()

      if (error) {
        console.error("Order cancel error:", error)
        return null
      }

      return {
        id: data.id,
        items: data.items as CartItem[],
        total: data.total_amount,
        status: data.status as OrderStatus,
        paymentStatus: data.payment_status as PaymentStatus,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        notes: data.notes,
      } as Order
    } catch (error) {
      console.error("Order cancel error:", error)
      return null
    }
  },

  // Get order workflow info
  async getWorkflow(id: string) {
    const orders = await this.getAll()
    const order = orders.find(o => o.id === id)
    if (!order) {
      throw new Error('Sipariş bulunamadı')
    }
    return getOrderWorkflow(order)
  },

  // Get orders by status
  async getByStatus(status: OrderStatus): Promise<Order[]> {
    const orders = await this.getAll()
    return orders.filter(order => order.status === status)
  },

  // Process payment with validation based on order type
  async processPayment(
    id: string,
    amount: number,
    method: PaymentMethod,
    options?: {
      isPartialPayment?: boolean
      depositAmount?: number
    }
  ): Promise<{ success: boolean; order?: Order; error?: string }> {
    try {
      const orders = await this.getAll()
      const order = orders.find(o => o.id === id)

      if (!order) {
        return { success: false, error: 'Sipariş bulunamadı' }
      }

      // Get payment requirements and minimum amounts
      const paymentRequirements = getPaymentRequirements(order)
      const minimumPayment = calculateMinimumPayment(order)
      const paymentStrategy = getPaymentStrategy(order.orderType)

      // Validate payment method is allowed for order type
      if (!paymentStrategy.preferredMethods.includes(method)) {
        return {
          success: false,
          error: `${method} ödeme yöntemi bu sipariş tipi için uygun değil. Geçerli yöntemler: ${paymentStrategy.preferredMethods.join(', ')}`
        }
      }

      // Validate minimum amount
      if (amount < minimumPayment.minimumAmount) {
        return {
          success: false,
          error: `Minimum ödeme tutarı ${minimumPayment.minimumAmount} TL. ${minimumPayment.reason}`
        }
      }

      // Validate timing requirements
      if (paymentRequirements.mustPayNow && order.paymentStatus !== PaymentStatus.PENDING) {
        return {
          success: false,
          error: `Bu sipariş tipi için ödeme ${paymentRequirements.suggestedTiming} aşamasında alınmalı`
        }
      }

      // Process payment
      const paymentStatus = options?.isPartialPayment
        ? PaymentStatus.PARTIAL
        : (amount >= order.total ? PaymentStatus.PAID : PaymentStatus.PARTIAL)

      const success = await this.updatePaymentStatus(id, paymentStatus, method)

      if (!success) {
        return { success: false, error: 'Ödeme işlemi başarısız' }
      }

      // Update order status if needed
      let updatedOrder = order

      // For takeaway orders, move to preparing after payment
      if (order.orderType === OrderType.TAKEAWAY && paymentStatus === PaymentStatus.PAID) {
        const statusUpdateResult = await this.updateStatus(id, OrderStatus.PREPARING)
        if (statusUpdateResult) {
          updatedOrder = statusUpdateResult
        }
      }

      return {
        success: true,
        order: {
          ...updatedOrder,
          paymentStatus,
          paymentMethod: method
        }
      }
    } catch (error) {
      console.error('Payment processing error:', error)
      return { success: false, error: 'Ödeme işlemi sırasında hata oluştu' }
    }
  },

  // Get payment info for order
  async getPaymentInfo(id: string): Promise<{
    strategy: ReturnType<typeof getPaymentStrategy>
    requirements: ReturnType<typeof getPaymentRequirements>
    minimumPayment: ReturnType<typeof calculateMinimumPayment>
    currentPaymentStatus: PaymentStatus
  } | null> {
    try {
      const orders = await this.getAll()
      const order = orders.find(o => o.id === id)

      if (!order) {
        return null
      }

      return {
        strategy: getPaymentStrategy(order.orderType),
        requirements: getPaymentRequirements(order),
        minimumPayment: calculateMinimumPayment(order),
        currentPaymentStatus: order.paymentStatus
      }
    } catch (error) {
      console.error('Payment info fetch error:', error)
      return null
    }
  },

  // Get advanced timing information for order
  async getTimingInfo(
    id: string,
    options?: {
      kitchenLoad?: number
      distance?: number
    }
  ): Promise<{
    basicEstimate: number
    advancedEstimate: ReturnType<typeof getAdvancedPreparationTime>
    deliveryEstimate?: ReturnType<typeof getDeliveryTimeEstimate>
    delayAnalysis: ReturnType<typeof analyzeOrderDelay>
    dynamicPricing: ReturnType<typeof getDynamicPricingSuggestion>
  } | null> {
    try {
      const orders = await this.getAll()
      const order = orders.find(o => o.id === id)

      if (!order) {
        return null
      }

      const basicEstimate = getEstimatedPreparationTime(order)
      const advancedEstimate = getAdvancedPreparationTime(
        order,
        new Date().getHours(),
        options?.kitchenLoad || 0.5
      )

      const deliveryEstimate = order.orderType === OrderType.DELIVERY
        ? getDeliveryTimeEstimate(order, options?.distance || 5)
        : undefined

      const delayAnalysis = analyzeOrderDelay(order)
      const dynamicPricing = getDynamicPricingSuggestion(order.createdAt, order.total)

      return {
        basicEstimate,
        advancedEstimate,
        deliveryEstimate,
        delayAnalysis,
        dynamicPricing
      }
    } catch (error) {
      console.error('Timing info fetch error:', error)
      return null
    }
  },

  // Update order timing with current kitchen load
  async updateOrderTiming(
    id: string,
    kitchenLoad: number = 0.5
  ): Promise<Order | null> {
    try {
      const orders = await this.getAll()
      const order = orders.find(o => o.id === id)

      if (!order) {
        return null
      }

      const advancedTiming = getAdvancedPreparationTime(order, new Date().getHours(), kitchenLoad)

      // Update timing in demo mode
      const supabase = getSupabase()
      if (!supabase) {
        const orderIndex = orders.findIndex(o => o.id === id)
        if (orderIndex !== -1) {
          orders[orderIndex] = {
            ...orders[orderIndex],
            estimatedReadyTime: advancedTiming.readyTime
          }
          saveToLocalStorage(DEMO_STORAGE_KEYS.ORDERS, orders)
          return orders[orderIndex]
        }
      }

      // Update in database
      const { data, error } = await supabase
        .from("orders")
        .update({
          estimated_ready_time: advancedTiming.readyTime.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("id", id)
        .select()
        .single()

      if (error) {
        console.error("Order timing update error:", error)
        return null
      }

      return {
        ...order,
        estimatedReadyTime: new Date(data.estimated_ready_time),
        updatedAt: new Date(data.updated_at)
      }
    } catch (error) {
      console.error('Order timing update error:', error)
      return null
    }
  },

  // Get kitchen performance metrics
  async getKitchenMetrics(): Promise<{
    averagePreparationTime: number
    onTimePerformance: number
    currentLoad: number
    delayedOrders: number
    totalActiveOrders: number
  }> {
    try {
      const orders = await this.getAll()
      const activeOrders = orders.filter(order =>
        [OrderStatus.PREPARING, OrderStatus.CONFIRMED].includes(order.status)
      )

      const completedOrders = orders.filter(order =>
        [OrderStatus.COMPLETED, OrderStatus.SERVED].includes(order.status) &&
        order.completedAt &&
        order.createdAt
      )

      // Ortalama hazırlama süresi (tamamlanan siparişler)
      const averagePreparationTime = completedOrders.length > 0
        ? completedOrders.reduce((total, order) => {
          if (order.completedAt && order.createdAt) {
            const prepTime = (order.completedAt.getTime() - order.createdAt.getTime()) / 60000
            return total + prepTime
          }
          return total
        }, 0) / completedOrders.length
        : 0

      // Zamanında teslim performansı
      const onTimeOrders = completedOrders.filter(order => {
        if (!order.estimatedReadyTime || !order.completedAt) return false
        return order.completedAt.getTime() <= order.estimatedReadyTime.getTime() + 10 * 60000 // 10 dk tolerans
      })

      const onTimePerformance = completedOrders.length > 0
        ? (onTimeOrders.length / completedOrders.length) * 100
        : 100

      // Geciken siparişler
      const delayedOrders = activeOrders.filter(order => {
        const analysis = analyzeOrderDelay(order)
        return analysis.isDelayed
      }).length

      // Mevcut yük (aktif sipariş sayısına göre)
      const currentLoad = Math.min(activeOrders.length / 10, 1) // Maksimum 10 sipariş = %100 yük

      return {
        averagePreparationTime: Math.round(averagePreparationTime),
        onTimePerformance: Math.round(onTimePerformance),
        currentLoad,
        delayedOrders,
        totalActiveOrders: activeOrders.length
      }
    } catch (error) {
      console.error('Kitchen metrics error:', error)
      return {
        averagePreparationTime: 0,
        onTimePerformance: 100,
        currentLoad: 0.5,
        delayedOrders: 0,
        totalActiveOrders: 0
      }
    }
  },

  // Get comprehensive kitchen workflow plan
  async getKitchenWorkflow(): Promise<ReturnType<typeof getKitchenWorkflowPlan> & {
    orderComplexities: Array<{ orderId: string; complexity: ReturnType<typeof analyzeOrderComplexity> }>
    stationAssignments: Array<{ orderId: string; assignment: ReturnType<typeof assignKitchenStation> }>
  }> {
    try {
      const orders = await this.getAll()
      const workflowPlan = getKitchenWorkflowPlan(orders)

      // Sipariş karmaşıklık analizi
      const orderComplexities = orders
        .filter(order => [OrderStatus.CONFIRMED, OrderStatus.PREPARING].includes(order.status))
        .map(order => ({
          orderId: order.id,
          complexity: analyzeOrderComplexity(order)
        }))

      // İstasyon atamaları
      const stationAssignments = orders
        .filter(order => [OrderStatus.CONFIRMED, OrderStatus.PREPARING].includes(order.status))
        .map(order => ({
          orderId: order.id,
          assignment: assignKitchenStation(order)
        }))

      return {
        ...workflowPlan,
        orderComplexities,
        stationAssignments
      }
    } catch (error) {
      console.error('Kitchen workflow error:', error)
      return {
        priorityQueue: [],
        parallelGroups: [],
        estimatedThroughputTime: 0,
        staffAssignments: { grill: [], prep: [], cold: [], finisher: [] },
        bottlenecks: [],
        orderComplexities: [],
        stationAssignments: []
      }
    }
  },

  // Get order complexity analysis
  async getOrderComplexity(id: string): Promise<ReturnType<typeof analyzeOrderComplexity> | null> {
    try {
      const orders = await this.getAll()
      const order = orders.find(o => o.id === id)

      if (!order) {
        return null
      }

      return analyzeOrderComplexity(order)
    } catch (error) {
      console.error('Order complexity analysis error:', error)
      return null
    }
  },

  // Get kitchen station assignment for order
  async getKitchenAssignment(id: string): Promise<ReturnType<typeof assignKitchenStation> | null> {
    try {
      const orders = await this.getAll()
      const order = orders.find(o => o.id === id)

      if (!order) {
        return null
      }

      return assignKitchenStation(order)
    } catch (error) {
      console.error('Kitchen assignment error:', error)
      return null
    }
  },

  // Optimize kitchen workflow with smart reordering
  async optimizeKitchenQueue(): Promise<{
    originalQueue: Order[]
    optimizedQueue: Order[]
    improvements: {
      timeSaved: number
      bottlenecksReduced: number
      efficiencyGain: number
    }
    recommendations: string[]
  }> {
    try {
      const orders = await this.getAll()
      const currentWorkflow = getKitchenWorkflowPlan(orders)

      // Mevcut durum
      const originalQueue = currentWorkflow.priorityQueue

      // Optimizasyon: karmaşık siparişleri önce, basit olanları paralel işle
      const complexityAnalysis = originalQueue.map(order => ({
        order,
        complexity: analyzeOrderComplexity(order),
        stationAssignment: assignKitchenStation(order)
      }))

      // Optimized sıralama: Karmaşık siparişleri önce başlat, basit olanları paralel ekle
      const optimizedQueue = [...complexityAnalysis]
        .sort((a, b) => {
          // Önce karmaşıklığa göre sırala
          const complexityOrder = {
            'Very Complex': 4,
            'Complex': 3,
            'Medium': 2,
            'Simple': 1
          }

          const complexityDiff = complexityOrder[b.complexity.complexityLevel] - complexityOrder[a.complexity.complexityLevel]
          if (complexityDiff !== 0) return complexityDiff

          // Sonra istasyon uyumluluğuna göre
          if (a.stationAssignment.primaryStation === b.stationAssignment.primaryStation) {
            return a.order.createdAt.getTime() - b.order.createdAt.getTime()
          }

          return 0
        })
        .map(item => item.order)

      // İyileştirme metrikleri hesaplama
      const originalThroughputTime = currentWorkflow.estimatedThroughputTime
      const optimizedWorkflow = getKitchenWorkflowPlan(orders.map(o =>
        optimizedQueue.includes(o) ? o : o
      ))

      const timeSaved = Math.max(0, originalThroughputTime - optimizedWorkflow.estimatedThroughputTime)
      const bottlenecksReduced = Math.max(0, currentWorkflow.bottlenecks.length - optimizedWorkflow.bottlenecks.length)
      const efficiencyGain = originalThroughputTime > 0 ? (timeSaved / originalThroughputTime) * 100 : 0

      const recommendations = [
        'Karmaşık siparişleri önce başlatarak genel süreci hızlandırın',
        'Basit siparişleri paralel işleyerek verimlilik artırın',
        'İstasyon bazlı gruplandırma ile koordinasyonu iyileştirin'
      ]

      if (bottlenecksReduced > 0) {
        recommendations.push(`${bottlenecksReduced} darboğaz azaltıldı`)
      }

      return {
        originalQueue,
        optimizedQueue,
        improvements: {
          timeSaved: Math.round(timeSaved),
          bottlenecksReduced,
          efficiencyGain: Math.round(efficiencyGain)
        },
        recommendations
      }
    } catch (error) {
      console.error('Kitchen optimization error:', error)
      return {
        originalQueue: [],
        optimizedQueue: [],
        improvements: { timeSaved: 0, bottlenecksReduced: 0, efficiencyGain: 0 },
        recommendations: []
      }
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
  async getAll(restaurant_id?: string): Promise<FoodItem[]> {
    try {
      await simulateNetworkDelay()

      const supabase = getSupabase()
      if (!supabase) {
        // Demo mode
        const products = loadFromLocalStorage(DEMO_STORAGE_KEYS.PRODUCTS, mockFoodItems)
        return products
      }

      // Use provided restaurant_id or fallback to demo
      const actualRestaurantId = restaurant_id || DEMO_RESTAURANT_ID

      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          categories (name)
        `)
        .eq("restaurant_id", actualRestaurantId)
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
          category_id: product.category_id,
          available: product.is_available,
          type: product.type as "Et" | "Vejeteryan",
          discount: product.discount || 0,
          stock: product.stock,
          restaurant_id: product.restaurant_id,
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
    restaurant_id?: string
  }): Promise<FoodItem | null> {
    try {
      await simulateNetworkDelay()

      const supabase = getSupabase()
      if (!supabase) {
        // Demo mode
        const categories = loadFromLocalStorage(DEMO_STORAGE_KEYS.CATEGORIES, mockCategories)
        const category = categories.find(c => c.id === productPayload.category_id)

        const newProduct: FoodItem = {
          id: generateId('product'),
          title: productPayload.title,
          description: productPayload.description || "",
          price: productPayload.price,
          image: productPayload.image || "/placeholder.svg?height=160&width=320",
          category: category?.name || "Diğer",
          available: productPayload.available,
          type: productPayload.type,
          discount: productPayload.discount || 0,
          stock: productPayload.stock || 0,
        }

        const products = loadFromLocalStorage(DEMO_STORAGE_KEYS.PRODUCTS, mockFoodItems)
        const updatedProducts = [...products, newProduct]
        saveToLocalStorage(DEMO_STORAGE_KEYS.PRODUCTS, updatedProducts)

        // Also create inventory entry
        const inventory = loadFromLocalStorage(DEMO_STORAGE_KEYS.INVENTORY, mockInventory)
        const newInventoryItem = {
          id: generateId('inv'),
          productId: newProduct.id,
          productName: newProduct.title,
          currentStock: newProduct.stock || 0,
          minStock: 5,
          maxStock: 100,
          unit: "adet",
          costPrice: newProduct.price * 0.6, // Estimate cost as 60% of selling price
          lastUpdated: new Date().toISOString(),
        }
        saveToLocalStorage(DEMO_STORAGE_KEYS.INVENTORY, [...inventory, newInventoryItem])

        showDemoNotification(`Yeni ürün eklendi: ${newProduct.title}`)
        return newProduct
      }

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
          restaurant_id: productPayload.restaurant_id || DEMO_RESTAURANT_ID,
        })
        .select(`*, categories (name)`)
        .single()

      if (error) {
        console.error("Product create error:", error)
        return null
      }

      // Create inventory entry for new product
      await supabase.from("inventory").insert({
        product_id: data.id,
        current_stock: productPayload.stock || 0,
        min_stock: 5,
        max_stock: 100,
        unit: "adet",
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
  async getAll(restaurant_id?: string): Promise<string[]> {
    // Returns string array for compatibility with app/page.tsx
    try {
      await simulateNetworkDelay()

      const supabase = getSupabase()
      if (!supabase) {
        // Demo mode
        const categories = loadFromLocalStorage(DEMO_STORAGE_KEYS.CATEGORIES, mockCategories)
        return categories.map((cat: Category) => cat.name)
      }

      let query = supabase.from("categories").select("name").order("name", { ascending: true })

      if (restaurant_id) {
        query = query.eq("restaurant_id", restaurant_id)
      }

      const { data, error } = await query

      if (error) {
        console.error("Categories fetch error:", error)
        return []
      }

      const categoryNames = data?.map((category: { name: string }) => category.name).filter(Boolean) || []
      return categoryNames
    } catch (error) {
      console.error("Categories fetch error (catch):", error)
      return []
    }
  },

  async getAllFull(restaurant_id?: string): Promise<Category[]> {
    // Returns full Category objects
    try {
      await simulateNetworkDelay()

      const supabase = getSupabase()
      if (!supabase) {
        // Demo mode
        const categories = loadFromLocalStorage(DEMO_STORAGE_KEYS.CATEGORIES, mockCategories)
        return categories
      }

      let query = supabase.from("categories").select("*").order("name", { ascending: true })

      if (restaurant_id) {
        query = query.eq("restaurant_id", restaurant_id)
      }

      const { data, error } = await query

      if (error) {
        console.error("Categories fetch error:", error)
        return []
      }

      return data || []
    } catch (error) {
      console.error("Categories fetch error (catch):", error)
      return []
    }
  },

  async create(categoryData: {
    name: string
    restaurant_id?: string
  }): Promise<Category | null> {
    try {
      const supabase = getSupabase()
      if (!supabase) return null

      const { data, error } = await supabase
        .from("categories")
        .insert({
          name: categoryData.name,
          restaurant_id: categoryData.restaurant_id,
        })
        .select()
        .single()

      if (error) {
        console.error("Category create error:", error)
        return null
      }

      return data
    } catch (error) {
      console.error("Category create error (catch):", error)
      return null
    }
  },

  async update(
    categoryId: string,
    updates: Partial<{ name: string }>,
    restaurant_id?: string,
  ): Promise<Category | null> {
    try {
      const supabase = getSupabase()
      if (!supabase) return null

      let query = supabase
        .from("categories")
        .update(updates)
        .eq("id", categoryId)

      if (restaurant_id) {
        query = query.eq("restaurant_id", restaurant_id)
      }

      const { data, error } = await query.select().single()

      if (error) {
        console.error("Category update error:", error)
        return null
      }

      return data
    } catch (error) {
      console.error("Category update error (catch):", error)
      return null
    }
  },

  async delete(categoryId: string, restaurant_id?: string): Promise<boolean> {
    try {
      const supabase = getSupabase()
      if (!supabase) return false

      // Check if any products use this category
      const { data: products } = await supabase
        .from("products")
        .select("id")
        .eq("category_id", categoryId)
        .limit(1)

      if (products && products.length > 0) {
        console.error("Cannot delete category: Products are using this category")
        return false
      }

      let query = supabase.from("categories").delete().eq("id", categoryId)

      if (restaurant_id) {
        query = query.eq("restaurant_id", restaurant_id)
      }

      const { error } = await query

      if (error) {
        console.error("Category delete error:", error)
        return false
      }
      return true
    } catch (error) {
      console.error("Category delete error (catch):", error)
      return false
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

// Couriers API
export const couriersApi = {
  async getAll(restaurant_id: string): Promise<Courier[]> {
    try {
      const supabase = getSupabase()
      if (!supabase) return []

      const { data, error } = await supabase
        .from("couriers")
        .select("*")
        .eq("restaurant_id", restaurant_id)
        .order("name", { ascending: true })

      if (error) {
        console.error("Couriers fetch error:", error)
        return []
      }

      return (
        data?.map((courier) => ({
          id: courier.id,
          name: courier.name,
          phone: courier.phone,
          status: courier.status as "Müsait" | "Siparişte" | "Teslimatta",
          avatar: courier.avatar_url || "/placeholder.svg?height=40&width=40",
          vehicleType: courier.vehicle_type as "Motorsiklet" | "Araba" | "Bisiklet",
          vehiclePlate: courier.vehicle_plate,
          activeFrom: new Date(courier.active_from),
          totalDeliveries: courier.total_deliveries || 0,
          currentOrderId: courier.current_order_id,
          location: courier.location ? {
            lat: courier.location.lat,
            lng: courier.location.lng
          } : undefined,
        })) || []
      )
    } catch (error) {
      console.error("Couriers fetch error (catch):", error)
      return []
    }
  },

  async getById(courierId: string, restaurant_id: string): Promise<Courier | null> {
    try {
      const supabase = getSupabase()
      if (!supabase) return null

      const { data, error } = await supabase
        .from("couriers")
        .select("*")
        .eq("id", courierId)
        .eq("restaurant_id", restaurant_id)
        .single()

      if (error) {
        console.error("Courier fetch by ID error:", error)
        return null
      }

      return {
        id: data.id,
        name: data.name,
        phone: data.phone,
        status: data.status as "Müsait" | "Siparişte" | "Teslimatta",
        avatar: data.avatar_url || "/placeholder.svg?height=40&width=40",
        vehicleType: data.vehicle_type as "Motorsiklet" | "Araba" | "Bisiklet",
        vehiclePlate: data.vehicle_plate,
        activeFrom: new Date(data.active_from),
        totalDeliveries: data.total_deliveries || 0,
        currentOrderId: data.current_order_id,
        location: data.location ? {
          lat: data.location.lat,
          lng: data.location.lng
        } : undefined,
      }
    } catch (error) {
      console.error("Courier fetch by ID error (catch):", error)
      return null
    }
  },

  async create(courierData: {
    name: string
    phone: string
    vehicleType: "Motorsiklet" | "Araba" | "Bisiklet"
    vehiclePlate?: string
    restaurant_id: string
  }): Promise<Courier | null> {
    try {
      const supabase = getSupabase()
      if (!supabase) return null

      const { data, error } = await supabase
        .from("couriers")
        .insert({
          name: courierData.name,
          phone: courierData.phone,
          vehicle_type: courierData.vehicleType,
          vehicle_plate: courierData.vehiclePlate,
          status: "Müsait",
          active_from: new Date().toISOString(),
          total_deliveries: 0,
          restaurant_id: courierData.restaurant_id,
        })
        .select()
        .single()

      if (error) {
        console.error("Courier create error:", error)
        return null
      }

      return {
        id: data.id,
        name: data.name,
        phone: data.phone,
        status: "Müsait",
        avatar: "/placeholder.svg?height=40&width=40",
        vehicleType: data.vehicle_type as "Motorsiklet" | "Araba" | "Bisiklet",
        vehiclePlate: data.vehicle_plate,
        activeFrom: new Date(data.active_from),
        totalDeliveries: 0,
      }
    } catch (error) {
      console.error("Courier create error (catch):", error)
      return null
    }
  },

  async update(
    courierId: string,
    updates: Partial<{
      name: string
      phone: string
      status: "Müsait" | "Siparişte" | "Teslimatta"
      vehicleType: "Motorsiklet" | "Araba" | "Bisiklet"
      vehiclePlate?: string
      currentOrderId?: string
      location?: { lat: number; lng: number }
    }>,
    restaurant_id: string,
  ): Promise<Courier | null> {
    try {
      const supabase = getSupabase()
      if (!supabase) return null

      const updateData: { [key: string]: any } = {}
      if (updates.name !== undefined) updateData.name = updates.name
      if (updates.phone !== undefined) updateData.phone = updates.phone
      if (updates.status !== undefined) updateData.status = updates.status
      if (updates.vehicleType !== undefined) updateData.vehicle_type = updates.vehicleType
      if (updates.vehiclePlate !== undefined) updateData.vehicle_plate = updates.vehiclePlate
      if (updates.currentOrderId !== undefined) updateData.current_order_id = updates.currentOrderId
      if (updates.location !== undefined) updateData.location = updates.location

      const { data, error } = await supabase
        .from("couriers")
        .update(updateData)
        .eq("id", courierId)
        .eq("restaurant_id", restaurant_id)
        .select()
        .single()

      if (error) {
        console.error("Courier update error:", error)
        return null
      }

      return {
        id: data.id,
        name: data.name,
        phone: data.phone,
        status: data.status as "Müsait" | "Siparişte" | "Teslimatta",
        avatar: data.avatar_url || "/placeholder.svg?height=40&width=40",
        vehicleType: data.vehicle_type as "Motorsiklet" | "Araba" | "Bisiklet",
        vehiclePlate: data.vehicle_plate,
        activeFrom: new Date(data.active_from),
        totalDeliveries: data.total_deliveries || 0,
        currentOrderId: data.current_order_id,
        location: data.location ? {
          lat: data.location.lat,
          lng: data.location.lng
        } : undefined,
      }
    } catch (error) {
      console.error("Courier update error (catch):", error)
      return null
    }
  },

  async delete(courierId: string, restaurant_id: string): Promise<boolean> {
    try {
      const supabase = getSupabase()
      if (!supabase) return false

      // Check if courier has active orders
      const { data: activeOrders } = await supabase
        .from("orders")
        .select("id")
        .eq("courier_id", courierId)
        .in("delivery_status", ["Beklemede", "Yolda"])
        .limit(1)

      if (activeOrders && activeOrders.length > 0) {
        console.error("Cannot delete courier: Courier has active deliveries")
        return false
      }

      const { error } = await supabase
        .from("couriers")
        .delete()
        .eq("id", courierId)
        .eq("restaurant_id", restaurant_id)

      if (error) {
        console.error("Courier delete error:", error)
        return false
      }
      return true
    } catch (error) {
      console.error("Courier delete error (catch):", error)
      return false
    }
  },

  async assignOrder(courierId: string, orderId: string, restaurant_id: string): Promise<boolean> {
    try {
      const supabase = getSupabase()
      if (!supabase) return false

      // Update courier status and current order
      const { error: courierError } = await supabase
        .from("couriers")
        .update({
          status: "Siparişte",
          current_order_id: orderId,
        })
        .eq("id", courierId)
        .eq("restaurant_id", restaurant_id)

      if (courierError) {
        console.error("Courier assignment error:", courierError)
        return false
      }

      // Update order with courier info
      const { error: orderError } = await supabase
        .from("orders")
        .update({
          courier_id: courierId,
          delivery_status: "Yolda",
        })
        .eq("id", orderId)

      if (orderError) {
        console.error("Order courier assignment error:", orderError)
        return false
      }

      return true
    } catch (error) {
      console.error("Courier assignment error (catch):", error)
      return false
    }
  },

  async completeDelivery(courierId: string, orderId: string, restaurant_id: string): Promise<boolean> {
    try {
      const supabase = getSupabase()
      if (!supabase) return false

      // Update courier status
      const { error: courierError } = await supabase
        .from("couriers")
        .update({
          status: "Müsait",
          current_order_id: null,
          total_deliveries: supabase.rpc('increment_deliveries', { courier_id: courierId })
        })
        .eq("id", courierId)
        .eq("restaurant_id", restaurant_id)

      if (courierError) {
        console.error("Courier delivery completion error:", courierError)
        return false
      }

      // Update order status
      const { error: orderError } = await supabase
        .from("orders")
        .update({
          delivery_status: "Teslim Edildi",
          status: "Tamamlandı",
        })
        .eq("id", orderId)

      if (orderError) {
        console.error("Order delivery completion error:", orderError)
        return false
      }

      return true
    } catch (error) {
      console.error("Delivery completion error (catch):", error)
      return false
    }
  },
}

// Users API
export const usersApi = {
  async getAll(restaurant_id: string): Promise<User[]> {
    try {
      const supabase = getSupabase()
      if (!supabase) return []

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("restaurant_id", restaurant_id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Users fetch error:", error)
        return []
      }

      return (
        data?.map((user) => ({
          id: user.id,
          name: user.full_name || user.email.split("@")[0],
          email: user.email,
          role: user.role as User["role"],
          avatar: user.avatar_url || "/placeholder.svg?height=40&width=40",
        })) || []
      )
    } catch (error) {
      console.error("Users fetch error (catch):", error)
      return []
    }
  },

  async getById(userId: string, restaurant_id: string): Promise<User | null> {
    try {
      const supabase = getSupabase()
      if (!supabase) return null

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .eq("restaurant_id", restaurant_id)
        .single()

      if (error) {
        console.error("User fetch by ID error:", error)
        return null
      }

      return {
        id: data.id,
        name: data.full_name || data.email.split("@")[0],
        email: data.email,
        role: data.role as User["role"],
        avatar: data.avatar_url || "/placeholder.svg?height=40&width=40",
      }
    } catch (error) {
      console.error("User fetch by ID error (catch):", error)
      return null
    }
  },

  async update(
    userId: string,
    updates: Partial<{
      name: string
      email: string
      role: User["role"]
      avatar?: string
    }>,
    restaurant_id: string,
  ): Promise<User | null> {
    try {
      const supabase = getSupabase()
      if (!supabase) return null

      const updateData: { [key: string]: any } = {}
      if (updates.name !== undefined) updateData.full_name = updates.name
      if (updates.email !== undefined) updateData.email = updates.email
      if (updates.role !== undefined) updateData.role = updates.role
      if (updates.avatar !== undefined) updateData.avatar_url = updates.avatar

      const { data, error } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", userId)
        .eq("restaurant_id", restaurant_id)
        .select()
        .single()

      if (error) {
        console.error("User update error:", error)
        return null
      }

      return {
        id: data.id,
        name: data.full_name || data.email.split("@")[0],
        email: data.email,
        role: data.role as User["role"],
        avatar: data.avatar_url || "/placeholder.svg?height=40&width=40",
      }
    } catch (error) {
      console.error("User update error (catch):", error)
      return null
    }
  },

  async delete(userId: string, restaurant_id: string): Promise<boolean> {
    try {
      const supabase = getSupabase()
      if (!supabase) return false

      const { error } = await supabase
        .from("users")
        .delete()
        .eq("id", userId)
        .eq("restaurant_id", restaurant_id)

      if (error) {
        console.error("User delete error:", error)
        return false
      }
      return true
    } catch (error) {
      console.error("User delete error (catch):", error)
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
