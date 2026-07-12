"use client"

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"
import { couriersApi, membersApi, ordersApi } from "@/lib/api"
import { getClientSupabaseInstance } from "@/lib/supabase"
import type { Courier } from "@/lib/types"
import { useAuth } from "@/context/auth-context"

interface NewCourierInput extends Omit<Courier, "id" | "totalDeliveries" | "activeFrom"> {
  email: string
}

interface CourierContextType {
  couriers: Courier[]
  isLoading: boolean
  getAvailableCouriers: () => Courier[]
  getCourierById: (id: string) => Courier | undefined
  assignOrderToCourier: (courierId: string, orderId: string) => Promise<void>
  updateCourierStatus: (courierId: string, status: Courier["status"], orderId?: string) => Promise<void>
  updateCourierLocation: (courierId: string, lat: number, lng: number) => Promise<void>
  addCourier: (courier: NewCourierInput) => Promise<string>
  updateCourier: (id: string, courierData: Partial<Courier>) => Promise<void>
  removeCourier: (id: string) => Promise<void>
  completeDelivery: (courierId: string) => Promise<void>
  startLiveTracking: (courierId: string, orderId: string) => Promise<boolean>
  stopLiveTracking: (courierId: string) => void
  isLiveTracking: (courierId: string) => boolean
  refreshCouriers: () => Promise<void>
}

const CourierContext = createContext<CourierContextType | undefined>(undefined)

export function CourierProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: isAuthLoading } = useAuth()
  const [couriers, setCouriers] = useState<Courier[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [locationWatchers, setLocationWatchers] = useState<Record<string, number>>({})

  const refreshCouriers = useCallback(async () => {
    if (!user?.restaurant_id) {
      setCouriers([])
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    try {
      setCouriers(await couriersApi.getAll())
    } finally {
      setIsLoading(false)
    }
  }, [user?.restaurant_id])

  useEffect(() => {
    if (isAuthLoading) return
    const timeoutId = window.setTimeout(() => void refreshCouriers(), 0)
    return () => window.clearTimeout(timeoutId)
  }, [isAuthLoading, refreshCouriers])

  useEffect(() => {
    if (!user?.restaurant_id) return
    const supabase = getClientSupabaseInstance()
    const channel = supabase
      .channel(`couriers:${user.restaurant_id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "deliveries", filter: `restaurant_id=eq.${user.restaurant_id}` },
        () => void refreshCouriers(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "courier_profiles",
          filter: `restaurant_id=eq.${user.restaurant_id}`,
        },
        () => void refreshCouriers(),
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [refreshCouriers, user?.restaurant_id])

  useEffect(() => {
    return () => {
      if (!("geolocation" in navigator)) return
      Object.values(locationWatchers).forEach((watchId) => navigator.geolocation.clearWatch(watchId))
    }
  }, [locationWatchers])

  const getAvailableCouriers = () => couriers.filter((courier) => courier.status === "Müsait")
  const getCourierById = (id: string) => couriers.find((courier) => courier.id === id)

  const assignOrderToCourier = async (courierId: string, orderId: string) => {
    await couriersApi.assignOrder(courierId, orderId)
    await refreshCouriers()
  }

  const updateCourierStatus = async (courierId: string, status: Courier["status"], orderId?: string) => {
    const courier = getCourierById(courierId)
    const targetOrderId = orderId || courier?.currentOrderId
    if (!targetOrderId) return
    if (status === "Teslimatta") await ordersApi.updateDeliveryStatus(targetOrderId, "Yolda")
    if (status === "Müsait") await couriersApi.completeDelivery(targetOrderId)
    await refreshCouriers()
  }

  const updateCourierLocation = async (courierId: string, lat: number, lng: number) => {
    const courier = getCourierById(courierId)
    if (!courier?.currentOrderId) throw new Error("Kuryenin aktif teslimatı bulunamadı")
    await couriersApi.updateLocation(courier.currentOrderId, lat, lng)
    setCouriers((current) =>
      current.map((item) => (item.id === courierId ? { ...item, location: { lat, lng } } : item)),
    )
  }

  const addCourier = async (courier: NewCourierInput) => {
    return couriersApi.createInvitation(courier)
  }

  const updateCourier = async (id: string, courierData: Partial<Courier>) => {
    await couriersApi.updateProfile(id, courierData)
    await refreshCouriers()
  }

  const removeCourier = async (id: string) => {
    const courier = getCourierById(id)
    if (courier && courier.status !== "Müsait") throw new Error("Aktif teslimat yapan kurye silinemez")
    stopLiveTracking(id)
    await membersApi.remove(id)
    setCouriers((current) => current.filter((courierItem) => courierItem.id !== id))
  }

  const completeDelivery = async (courierId: string) => {
    const courier = getCourierById(courierId)
    if (!courier?.currentOrderId) throw new Error("Kuryenin aktif teslimatı bulunamadı")
    await couriersApi.completeDelivery(courier.currentOrderId)
    stopLiveTracking(courierId)
    await refreshCouriers()
  }

  const startLiveTracking = async (courierId: string, orderId: string) => {
    if (courierId !== user?.id || user.memberRole !== "courier" || !("geolocation" in navigator)) return false
    stopLiveTracking(courierId)

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        void couriersApi.updateLocation(orderId, position.coords.latitude, position.coords.longitude)
      },
      () => stopLiveTracking(courierId),
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 20_000 },
    )
    setLocationWatchers((current) => ({ ...current, [courierId]: watchId }))
    return true
  }

  const stopLiveTracking = (courierId: string) => {
    const watchId = locationWatchers[courierId]
    if (watchId === undefined || !("geolocation" in navigator)) return
    navigator.geolocation.clearWatch(watchId)
    setLocationWatchers((current) => {
      const next = { ...current }
      delete next[courierId]
      return next
    })
  }

  const isLiveTracking = (courierId: string) => locationWatchers[courierId] !== undefined

  return (
    <CourierContext.Provider
      value={{
        couriers,
        isLoading,
        getAvailableCouriers,
        getCourierById,
        assignOrderToCourier,
        updateCourierStatus,
        updateCourierLocation,
        addCourier,
        updateCourier,
        removeCourier,
        completeDelivery,
        startLiveTracking,
        stopLiveTracking,
        isLiveTracking,
        refreshCouriers,
      }}
    >
      {children}
    </CourierContext.Provider>
  )
}

export function useCourierContext() {
  const context = useContext(CourierContext)
  if (context === undefined) throw new Error("useCourierContext must be used within a CourierProvider")
  return context
}
