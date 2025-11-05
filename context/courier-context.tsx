"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import type { Courier } from "@/lib/types"
import { v4 as uuidv4 } from "uuid"

interface CourierContextType {
  couriers: Courier[]
  getAvailableCouriers: () => Courier[]
  getCourierById: (id: string) => Courier | undefined
  assignOrderToCourier: (courierId: string, orderId: string) => void
  updateCourierStatus: (courierId: string, status: Courier["status"], orderId?: string) => void
  updateCourierLocation: (courierId: string, lat: number, lng: number) => void
  addCourier: (courier: Omit<Courier, "id" | "totalDeliveries" | "activeFrom">) => void
  updateCourier: (id: string, courierData: Partial<Courier>) => void
  removeCourier: (id: string) => void
  completeDelivery: (courierId: string) => void
  startLiveTracking: (courierId: string, orderId: string) => void
  stopLiveTracking: (courierId: string) => void
  isLiveTracking: (courierId: string) => boolean
}

const CourierContext = createContext<CourierContextType | undefined>(undefined)

// İstanbul'da gerçekçi konumlar (Taksim merkez)
const DEMO_LOCATIONS = {
  center: { lat: 41.0082, lng: 28.9784 }, // Taksim Meydanı
}

export const CourierProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [couriers, setCouriers] = useState<Courier[]>([]) // Boş array ile başla
  const [liveTrackingCouriers, setLiveTrackingCouriers] = useState<Record<string, NodeJS.Timeout>>({})

  // LocalStorage'dan kurye verilerini yükle
  useEffect(() => {
    const savedCouriers = localStorage.getItem("restaurant-couriers")
    if (savedCouriers) {
      try {
        const parsedCouriers = JSON.parse(savedCouriers)
        // Date nesnelerini dönüştür
        const couriersWithDates = parsedCouriers.map((courier: any) => ({
          ...courier,
          activeFrom: new Date(courier.activeFrom),
        }))
        setCouriers(couriersWithDates)
      } catch (error) {
        console.error("Failed to parse couriers from localStorage:", error)
        setCouriers([]) // Hata durumunda boş array
      }
    }
  }, [])

  // Kurye verilerini LocalStorage'a kaydet
  useEffect(() => {
    localStorage.setItem("restaurant-couriers", JSON.stringify(couriers))
  }, [couriers])

  // Component unmount olduğunda tüm interval'ları temizle
  useEffect(() => {
    return () => {
      Object.values(liveTrackingCouriers).forEach((intervalId) => {
        clearInterval(intervalId)
      })
    }
  }, [liveTrackingCouriers])

  const getAvailableCouriers = () => {
    return couriers.filter((courier) => courier.status === "Müsait")
  }

  const getCourierById = (id: string) => {
    return couriers.find((courier) => courier.id === id)
  }

  const assignOrderToCourier = (courierId: string, orderId: string) => {
    setCouriers((prevCouriers) =>
      prevCouriers.map((courier) =>
        courier.id === courierId
          ? {
              ...courier,
              status: "Siparişte",
              currentOrderId: orderId,
            }
          : courier,
      ),
    )
  }

  const updateCourierStatus = (courierId: string, status: Courier["status"], orderId?: string) => {
    setCouriers((prevCouriers) =>
      prevCouriers.map((courier) =>
        courier.id === courierId
          ? {
              ...courier,
              status,
              currentOrderId: orderId || (status === "Müsait" ? undefined : courier.currentOrderId),
            }
          : courier,
      ),
    )
  }

  const updateCourierLocation = (courierId: string, lat: number, lng: number) => {
    setCouriers((prevCouriers) =>
      prevCouriers.map((courier) =>
        courier.id === courierId
          ? {
              ...courier,
              location: { lat, lng },
            }
          : courier,
      ),
    )
  }

  const addCourier = (courier: Omit<Courier, "id" | "totalDeliveries" | "activeFrom">) => {
    const newCourier: Courier = {
      ...courier,
      id: uuidv4(),
      totalDeliveries: 0,
      activeFrom: new Date(),
    }
    setCouriers((prevCouriers) => [...prevCouriers, newCourier])
  }

  const updateCourier = (id: string, courierData: Partial<Courier>) => {
    setCouriers((prevCouriers) =>
      prevCouriers.map((courier) =>
        courier.id === id
          ? {
              ...courier,
              ...courierData,
            }
          : courier,
      ),
    )
  }

  const removeCourier = (id: string) => {
    // Eğer kurye aktif bir teslimat yapıyorsa silmeyi engelle
    const courier = getCourierById(id)
    if (courier && courier.status !== "Müsait") {
      throw new Error("Aktif teslimat yapan kurye silinemez")
    }

    // Canlı takip varsa durdur
    if (liveTrackingCouriers[id]) {
      clearInterval(liveTrackingCouriers[id])
      setLiveTrackingCouriers((prev) => {
        const newTracking = { ...prev }
        delete newTracking[id]
        return newTracking
      })
    }

    setCouriers((prevCouriers) => prevCouriers.filter((courier) => courier.id !== id))
  }

  const completeDelivery = (courierId: string) => {
    setCouriers((prevCouriers) =>
      prevCouriers.map((courier) =>
        courier.id === courierId
          ? {
              ...courier,
              status: "Müsait",
              currentOrderId: undefined,
              totalDeliveries: courier.totalDeliveries + 1,
            }
          : courier,
      ),
    )

    // Canlı takibi durdur
    stopLiveTracking(courierId)
  }

  // Canlı takip başlatma
  const startLiveTracking = (courierId: string, orderId: string) => {
    // Önceki takibi durdur
    if (liveTrackingCouriers[courierId]) {
      clearInterval(liveTrackingCouriers[courierId])
    }

    const courier = getCourierById(courierId)
    if (!courier) return

    // Başlangıç konumu
    const startLocation = courier.location || DEMO_LOCATIONS.center

    // Hedef konumu (müşteri konumu)
    // Gerçek uygulamada bu sipariş veritabanından alınır
    const targetLat = startLocation.lat + Math.random() * 0.01
    const targetLng = startLocation.lng + Math.random() * 0.01

    // Toplam adım sayısı ve mevcut adım
    const totalSteps = 20
    let currentStep = 0

    // Kurye konumunu rastgele güncelle (gerçek uygulamada GPS verisi kullanılır)
    const intervalId = setInterval(() => {
      currentStep++

      if (currentStep >= totalSteps) {
        // Hedefe ulaşıldı, takibi durdur
        clearInterval(liveTrackingCouriers[courierId])
        return
      }

      // İlerleme oranı (0-1 arası)
      const progress = currentStep / totalSteps

      // Doğrusal interpolasyon ile yeni konum hesapla
      const newLat = startLocation.lat + (targetLat - startLocation.lat) * progress
      const newLng = startLocation.lng + (targetLng - startLocation.lng) * progress

      // Biraz rastgelelik ekle (gerçekçi hareket için)
      const jitter = 0.0002
      const finalLat = newLat + (Math.random() - 0.5) * jitter
      const finalLng = newLng + (Math.random() - 0.5) * jitter

      updateCourierLocation(courierId, finalLat, finalLng)
    }, 3000) // 3 saniyede bir güncelle

    setLiveTrackingCouriers((prev) => ({
      ...prev,
      [courierId]: intervalId,
    }))
  }

  // Canlı takibi durdurma
  const stopLiveTracking = (courierId: string) => {
    if (liveTrackingCouriers[courierId]) {
      clearInterval(liveTrackingCouriers[courierId])
      setLiveTrackingCouriers((prev) => {
        const newTracking = { ...prev }
        delete newTracking[courierId]
        return newTracking
      })
    }
  }

  // Kurye canlı takip ediliyor mu?
  const isLiveTracking = (courierId: string) => {
    return !!liveTrackingCouriers[courierId]
  }

  return (
    <CourierContext.Provider
      value={{
        couriers,
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
      }}
    >
      {children}
    </CourierContext.Provider>
  )
}

export const useCourierContext = () => {
  const context = useContext(CourierContext)
  if (context === undefined) {
    throw new Error("useCourierContext must be used within a CourierProvider")
  }
  return context
}
