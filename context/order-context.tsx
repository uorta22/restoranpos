"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useToast } from "@/hooks/use-toast"
import { ordersApi } from "@/lib/api"
import type { Order, CartItem } from "@/lib/types"

interface OrderContextType {
  orders: Order[]
  isLoading: boolean
  getOrderById: (id: string) => Order | undefined
  getDeliveryOrders: () => Order[]
  createOrder: (orderData: {
    items: CartItem[]
    total: number
    tableName?: string
    customerName?: string
    notes?: string
    tableId?: string | null
    isDelivery?: boolean
    deliveryAddress?: any
  }) => Promise<Order | null>
  updateOrderStatus: (
    orderId: string,
    status: "Beklemede" | "Hazırlanıyor" | "Hazır" | "Tamamlandı" | "İptal Edildi",
  ) => Promise<boolean>
  updatePaymentStatus: (orderId: string, status: "Beklemede" | "Ödendi", method?: string) => Promise<boolean>
  updateDeliveryStatus: (orderId: string, status: "Beklemede" | "Yolda" | "Teslim Edildi") => Promise<boolean>
  refreshOrders: () => Promise<void>
}

const OrderContext = createContext<OrderContextType | undefined>(undefined)

export function OrderProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  // Load orders on mount
  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      setIsLoading(true)
      const fetchedOrders = await ordersApi.getAll()
      setOrders(fetchedOrders)
    } catch (error) {
      console.error("Failed to load orders:", error)
      toast({
        title: "Hata",
        description: "Siparişler yüklenirken bir hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getOrderById = (id: string): Order | undefined => {
    return orders.find((order) => order.id === id)
  }

  const getDeliveryOrders = (): Order[] => {
    return orders.filter((order) => order.isDelivery === true)
  }

  const createOrder = async (orderData: {
    items: CartItem[]
    total: number
    tableName?: string
    customerName?: string
    notes?: string
    tableId?: string | null
    isDelivery?: boolean
    deliveryAddress?: any
  }): Promise<Order | null> => {
    try {
      const newOrder = await ordersApi.create(orderData)
      if (newOrder) {
        setOrders((prev) => [newOrder, ...prev])
        toast({
          title: "Sipariş oluşturuldu",
          description: `Sipariş #${newOrder.id.slice(-6)} başarıyla oluşturuldu.`,
        })
        return newOrder
      }
      return null
    } catch (error) {
      console.error("Failed to create order:", error)
      toast({
        title: "Hata",
        description: "Sipariş oluşturulurken bir hata oluştu.",
        variant: "destructive",
      })
      return null
    }
  }

  const updateOrderStatus = async (
    orderId: string,
    status: "Beklemede" | "Hazırlanıyor" | "Hazır" | "Tamamlandı" | "İptal Edildi",
  ): Promise<boolean> => {
    try {
      const success = await ordersApi.updateStatus(orderId, status)
      if (success) {
        setOrders((prev) =>
          prev.map((order) =>
            order.id === orderId ? { ...order, status, updatedAt: new Date().toISOString() } : order,
          ),
        )
        return true
      }
      return false
    } catch (error) {
      console.error("Failed to update order status:", error)
      return false
    }
  }

  const updatePaymentStatus = async (
    orderId: string,
    status: "Beklemede" | "Ödendi",
    method?: string,
  ): Promise<boolean> => {
    try {
      const success = await ordersApi.updatePaymentStatus(orderId, status, method)
      if (success) {
        setOrders((prev) =>
          prev.map((order) =>
            order.id === orderId
              ? { ...order, paymentStatus: status, paymentMethod: method, updatedAt: new Date().toISOString() }
              : order,
          ),
        )
        return true
      }
      return false
    } catch (error) {
      console.error("Failed to update payment status:", error)
      return false
    }
  }

  const updateDeliveryStatus = async (
    orderId: string,
    status: "Beklemede" | "Yolda" | "Teslim Edildi",
  ): Promise<boolean> => {
    try {
      // Update in database
      const success = await ordersApi.updateDeliveryStatus(orderId, status)

      if (success) {
        // Update local state
        setOrders((prev) =>
          prev.map((order) =>
            order.id === orderId
              ? {
                  ...order,
                  deliveryStatus: status,
                  status: status === "Teslim Edildi" ? "Tamamlandı" : order.status,
                  updatedAt: new Date().toISOString(),
                }
              : order,
          ),
        )

        toast({
          title: "Teslimat Durumu Güncellendi",
          description: `Sipariş #${orderId.slice(-6)} teslimat durumu "${status}" olarak güncellendi.`,
        })

        return true
      }
      return false
    } catch (error) {
      console.error("Failed to update delivery status:", error)
      toast({
        title: "Hata",
        description: "Teslimat durumu güncellenirken bir hata oluştu.",
        variant: "destructive",
      })
      return false
    }
  }

  const refreshOrders = async () => {
    await loadOrders()
  }

  return (
    <OrderContext.Provider
      value={{
        orders,
        isLoading,
        getOrderById,
        getDeliveryOrders,
        createOrder,
        updateOrderStatus,
        updatePaymentStatus,
        updateDeliveryStatus,
        refreshOrders,
      }}
    >
      {children}
    </OrderContext.Provider>
  )
}

export function useOrderContext() {
  const context = useContext(OrderContext)
  if (context === undefined) {
    throw new Error("useOrderContext must be used within an OrderProvider")
  }
  return context
}

// Backward compatibility
export const useOrders = useOrderContext
