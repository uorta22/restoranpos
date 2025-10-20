"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, MapPin, Phone, User } from "lucide-react"
import type { Courier, Order } from "@/lib/types"

interface Location {
  lat: number
  lng: number
}

interface MapDeliveryProps {
  couriers?: Courier[]
  activeCourier?: Courier | null
  setActiveCourier?: (courier: Courier | null) => void
  courier?: Courier
  order?: Order | null
  customerView?: boolean
}

export function MapDelivery({
  couriers = [],
  activeCourier = null,
  setActiveCourier = () => {},
  courier,
  order,
  customerView = false,
}: MapDeliveryProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [simulationRunning, setSimulationRunning] = useState(false)
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null)
  const [progress, setProgress] = useState(0)
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(
    courier?.location || { lat: 41.0082, lng: 28.9784 },
  )
  const [showCourierInfo, setShowCourierInfo] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
      // Set a default estimated time for demo purposes
      if (customerView) {
        setEstimatedTime(15)
        startSimulation()
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [customerView])

  const startSimulation = () => {
    if (simulationRunning) return

    setSimulationRunning(true)

    // Simple simulation that updates progress every second
    let currentProgress = 0
    const interval = setInterval(() => {
      currentProgress += 2
      setProgress(Math.min(currentProgress, 100))

      if (currentProgress >= 100) {
        clearInterval(interval)
        setSimulationRunning(false)
      }
    }, 1000)

    return () => clearInterval(interval)
  }

  const handleStartSimulation = () => {
    if (simulationRunning) {
      setSimulationRunning(false)
    } else {
      startSimulation()
    }
  }

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-100 min-h-[300px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Harita yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full">
      <div className="h-full w-full bg-gray-100 relative min-h-[300px] rounded-md">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center p-4">
            <p className="text-lg font-medium">Harita Görünümü</p>
            <p className="text-muted-foreground mt-2">
              Bu örnek uygulamada gerçek harita entegrasyonu bulunmamaktadır.
            </p>

            {courier && <p className="text-muted-foreground mt-2">Kurye: {courier.name}</p>}
            {order?.deliveryAddress && (
              <p className="text-muted-foreground mt-1">Teslimat Adresi: {order.deliveryAddress.fullAddress}</p>
            )}

            {activeCourier && <p className="text-muted-foreground mt-2">Aktif kurye: {activeCourier.name}</p>}
            {couriers && couriers.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                {couriers.map((courier) => (
                  <div
                    key={courier.id}
                    className={`px-3 py-2 rounded-full cursor-pointer transition-colors ${
                      activeCourier?.id === courier.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-white hover:bg-gray-200"
                    }`}
                    onClick={() => setActiveCourier(courier)}
                  >
                    {courier.name} ({courier.status})
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {estimatedTime !== null && customerView && (
        <div className="absolute top-4 left-4 bg-white p-3 rounded-md shadow-md">
          <h3 className="font-medium text-sm">Tahmini Varış Süresi</h3>
          <p className="text-lg font-bold">{estimatedTime} dakika</p>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      )}

      {/* Kurye bilgisi kartı */}
      {courier && (
        <div className="absolute top-4 right-4">
          <Button
            variant="outline"
            className="bg-white shadow-md mb-2"
            onClick={() => setShowCourierInfo(!showCourierInfo)}
          >
            {showCourierInfo ? "Kurye Bilgisini Gizle" : "Kurye Bilgisini Göster"}
          </Button>

          {showCourierInfo && (
            <Card className="shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <User className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">{courier.name}</h3>
                    <p className="text-sm text-gray-500">{courier.vehicleType}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <Phone className="h-4 w-4 mr-2 text-gray-500" />
                    <span>{courier.phone}</span>
                  </div>

                  {currentLocation && (
                    <div className="flex items-center text-sm">
                      <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                      <span>
                        {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
                      </span>
                    </div>
                  )}

                  {estimatedTime !== null && (
                    <div className="flex items-center text-sm">
                      <Clock className="h-4 w-4 mr-2 text-gray-500" />
                      <span>Tahmini: {estimatedTime} dakika</span>
                    </div>
                  )}

                  <div className="mt-2">
                    <Badge
                      className={simulationRunning ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}
                    >
                      {simulationRunning ? "Hareket Halinde" : "Beklemede"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {order?.deliveryAddress && !customerView && (
        <div className="absolute bottom-4 right-4">
          <Button onClick={handleStartSimulation}>
            {simulationRunning ? "Simülasyonu Durdur" : "Kurye Hareketini Simüle Et"}
          </Button>
        </div>
      )}
    </div>
  )
}
