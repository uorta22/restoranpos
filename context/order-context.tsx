"use client"

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"
import { ordersApi } from "@/lib/api"
import { getClientSupabaseInstance } from "@/lib/supabase"
import type { CartItem, DeliveryAddress, Order } from "@/lib/types"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"

interface CreateOrderInput {
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
}

interface OrderContextType {
  orders: Order[]
  isLoading: boolean
  getOrderById: (id: string) => Order | undefined
  getDeliveryOrders: () => Order[]
  createOrder: (orderData: CreateOrderInput) => Promise<Order | null>
  updateOrderStatus: (orderId: string, status: Order["status"]) => Promise<boolean>
  updatePaymentStatus: (orderId: string, status: Order["paymentStatus"], method?: string) => Promise<boolean>
  updateDeliveryStatus: (
    orderId: string,
    status: NonNullable<Order["deliveryStatus"]>,
    location?: { lat: number; lng: number },
  ) => Promise<boolean>
  refreshOrders: () => Promise<void>
}

const OrderContext = createContext<OrderContextType | undefined>(undefined)

export function OrderProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: isAuthLoading } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const refreshOrders = useCallback(async () => {
    if (!user?.restaurant_id) {
      setOrders([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      setOrders(await ordersApi.getAll())
    } catch (cause) {
      toast({
        title: "Siparişler yüklenemedi",
        description: cause instanceof Error ? cause.message : "Sipariş verileri okunamadı.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast, user?.restaurant_id])

  useEffect(() => {
    if (isAuthLoading) return
    const timeoutId = window.setTimeout(() => void refreshOrders(), 0)
    return () => window.clearTimeout(timeoutId)
  }, [isAuthLoading, refreshOrders])

  useEffect(() => {
    if (!user?.restaurant_id) return
    const supabase = getClientSupabaseInstance()
    const refresh = () => void refreshOrders()
    const channel = supabase
      .channel(`orders:${user.restaurant_id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `restaurant_id=eq.${user.restaurant_id}` },
        refresh,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "deliveries", filter: `restaurant_id=eq.${user.restaurant_id}` },
        refresh,
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [refreshOrders, user?.restaurant_id])

  const getOrderById = (id: string) => orders.find((order) => order.id === id)
  const getDeliveryOrders = () => orders.filter((order) => order.isDelivery)

  const createOrder = async (orderData: CreateOrderInput) => {
    try {
      const newOrder = await ordersApi.create(orderData)
      if (newOrder) {
        setOrders((current) => [newOrder, ...current.filter((order) => order.id !== newOrder.id)])
        toast({
          title: "Sipariş oluşturuldu",
          description: `Sipariş #${newOrder.id.slice(-6)} başarıyla oluşturuldu.`,
        })
      }
      return newOrder
    } catch (cause) {
      toast({
        title: "Sipariş oluşturulamadı",
        description: cause instanceof Error ? cause.message : "Sipariş işlemi tamamlanamadı.",
        variant: "destructive",
      })
      return null
    }
  }

  const updateOrderStatus = async (orderId: string, status: Order["status"]) => {
    try {
      await ordersApi.updateStatus(orderId, status)
      setOrders((current) =>
        current.map((order) => (order.id === orderId ? { ...order, status, updatedAt: new Date() } : order)),
      )
      return true
    } catch (cause) {
      toast({
        title: "Sipariş durumu güncellenemedi",
        description: cause instanceof Error ? cause.message : "Durum değişikliği tamamlanamadı.",
        variant: "destructive",
      })
      return false
    }
  }

  const updatePaymentStatus = async (orderId: string, status: Order["paymentStatus"], method?: string) => {
    try {
      await ordersApi.updatePaymentStatus(orderId, status, method)
      setOrders((current) =>
        current.map((order) =>
          order.id === orderId
            ? {
                ...order,
                paymentStatus: status,
                paymentMethod: method,
                updatedAt: new Date(),
              }
            : order,
        ),
      )
      return true
    } catch (cause) {
      toast({
        title: "Ödeme kaydedilemedi",
        description: cause instanceof Error ? cause.message : "Ödeme işlemi tamamlanamadı.",
        variant: "destructive",
      })
      return false
    }
  }

  const updateDeliveryStatus = async (
    orderId: string,
    status: NonNullable<Order["deliveryStatus"]>,
    location?: { lat: number; lng: number },
  ) => {
    try {
      await ordersApi.updateDeliveryStatus(orderId, status, location)
      setOrders((current) =>
        current.map((order) =>
          order.id === orderId
            ? {
                ...order,
                deliveryStatus: status,
                status: status === "Teslim Edildi" ? "Tamamlandı" : order.status,
                updatedAt: new Date(),
              }
            : order,
        ),
      )
      toast({
        title: "Teslimat durumu güncellendi",
        description: `Sipariş #${orderId.slice(-6)} için yeni durum: ${status}.`,
      })
      return true
    } catch (cause) {
      toast({
        title: "Teslimat durumu güncellenemedi",
        description: cause instanceof Error ? cause.message : "Teslimat işlemi tamamlanamadı.",
        variant: "destructive",
      })
      return false
    }
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
  if (context === undefined) throw new Error("useOrderContext must be used within an OrderProvider")
  return context
}

export const useOrders = useOrderContext
