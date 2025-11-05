"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Navigation, Phone, Truck, Clock, Route, AlertCircle } from "lucide-react"
import { calculateDistance, estimateDeliveryTime } from "@/lib/google-maps"

interface MockMapTrackingProps {
  orderId: string
  courierLocation: { lat: number; lng: number }
  customerLocation: { lat: number; lng: number; address?: string }
  courierInfo: {
    name: string
    phone: string
    vehicleType: "Motorsiklet" | "Bisiklet" | "Araba"
    vehiclePlate?: string
  }
  orderStatus: string
}

export function MockMapTracking({
  orderId,
  courierLocation,
  customerLocation,
  courierInfo,
  orderStatus,
}: MockMapTrackingProps) {
  const [distance, setDistance] = useState<number>(0)
  const [estimatedTime, setEstimatedTime] = useState<number>(0)
  const [currentStep, setCurrentStep] = useState(0)
  const [isMoving, setIsMoving] = useState(false)

  // Simulated route steps
  const routeSteps = [
    "Restorandan çıkış yapıldı",
    "Ana caddeye çıkıldı",
    "Trafik ışıklarından geçiliyor",
    "Hedef bölgeye yaklaşılıyor",
    "Teslimat adresine varıldı",
  ]

  useEffect(() => {
    const dist = calculateDistance(courierLocation.lat, courierLocation.lng, customerLocation.lat, customerLocation.lng)
    setDistance(dist)
    setEstimatedTime(estimateDeliveryTime(dist, courierInfo.vehicleType))
  }, [courierLocation, customerLocation, courierInfo.vehicleType])

  // Simulate movement
  useEffect(() => {
    if (orderStatus === "delivering" || orderStatus === "Yolda") {
      setIsMoving(true)
      const interval = setInterval(() => {
        setCurrentStep((prev) => (prev < routeSteps.length - 1 ? prev + 1 : prev))
      }, 3000)

      return () => clearInterval(interval)
    }
  }, [orderStatus, routeSteps.length])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "preparing":
      case "Hazırlanıyor":
        return "bg-yellow-500"
      case "ready":
      case "Hazır":
        return "bg-blue-500"
      case "delivering":
      case "Yolda":
        return "bg-purple-500"
      case "delivered":
      case "Teslim Edildi":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "preparing":
      case "Hazırlanıyor":
        return "Hazırlanıyor"
      case "ready":
      case "Hazır":
        return "Hazır"
      case "delivering":
      case "Yolda":
        return "Yolda"
      case "delivered":
      case "Teslim Edildi":
        return "Teslim Edildi"
      default:
        return "Bilinmiyor"
    }
  }

  return (
    <div className="space-y-4">
      {/* Mock Map Visualization */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Navigation className="w-5 h-5" />
              Teslimat Takibi (Demo)
              <Badge variant="secondary" className={`${getStatusColor(orderStatus)} text-white`}>
                {isMoving && <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></div>}
                {getStatusText(orderStatus)}
              </Badge>
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              Mock Sistem
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Visual Map Representation */}
          <div className="relative bg-gradient-to-br from-blue-50 to-green-50 rounded-lg border-2 border-dashed border-gray-300 h-80 overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="grid grid-cols-8 grid-rows-6 h-full">
                {Array.from({ length: 48 }).map((_, i) => (
                  <div key={i} className="border border-gray-400"></div>
                ))}
              </div>
            </div>

            {/* Route Line */}
            <svg className="absolute inset-0 w-full h-full">
              <defs>
                <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#EF4444" stopOpacity="0.8" />
                </linearGradient>
              </defs>
              <path
                d="M 60 240 Q 150 180 240 160 T 420 120"
                stroke="url(#routeGradient)"
                strokeWidth="4"
                fill="none"
                strokeDasharray={isMoving ? "10,5" : "none"}
                className={isMoving ? "animate-pulse" : ""}
              />
            </svg>

            {/* Restaurant Marker */}
            <div className="absolute top-60 left-12 transform -translate-x-1/2 -translate-y-1/2">
              <div className="bg-blue-500 text-white p-2 rounded-full shadow-lg">
                <Truck className="w-4 h-4" />
              </div>
              <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 rounded shadow text-xs whitespace-nowrap">
                Restoran
              </div>
            </div>

            {/* Courier Marker (Moving) */}
            <div
              className={`absolute transition-all duration-1000 transform -translate-x-1/2 -translate-y-1/2 ${
                isMoving ? "top-40 left-60" : "top-60 left-12"
              }`}
            >
              <div
                className={`bg-purple-500 text-white p-3 rounded-full shadow-lg ${isMoving ? "animate-bounce" : ""}`}
              >
                <Navigation className="w-5 h-5" />
              </div>
              <div className="absolute top-12 left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 rounded shadow text-xs whitespace-nowrap">
                {courierInfo.name}
              </div>
            </div>

            {/* Customer Marker */}
            <div className="absolute top-30 right-12 transform translate-x-1/2 -translate-y-1/2">
              <div className="bg-red-500 text-white p-2 rounded-full shadow-lg">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 rounded shadow text-xs whitespace-nowrap">
                Teslimat Adresi
              </div>
            </div>

            {/* Demo Notice */}
            <div className="absolute bottom-4 left-4 bg-yellow-100 border border-yellow-300 rounded px-3 py-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                <span className="text-xs text-yellow-800">
                  Bu örnek uygulamada simüle edilmiş harita kullanılmaktadır
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Route Progress */}
      {isMoving && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Route className="w-5 h-5" />
              Rota İlerlemesi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {routeSteps.map((step, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      index <= currentStep ? "bg-green-500" : "bg-gray-300"
                    } ${index === currentStep ? "animate-pulse" : ""}`}
                  />
                  <span className={`text-sm ${index <= currentStep ? "text-green-700 font-medium" : "text-gray-500"}`}>
                    {step}
                  </span>
                  {index === currentStep && (
                    <Badge variant="secondary" className="text-xs">
                      Şu an
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tracking Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <MapPin className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Mesafe</p>
                <p className="font-semibold">{distance.toFixed(1)} km</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-full">
                <Clock className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Tahmini Süre</p>
                <p className="font-semibold">{Math.max(1, estimatedTime - currentStep * 2)} dk</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-full">
                <Truck className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Araç</p>
                <p className="font-semibold">{courierInfo.vehicleType}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Courier Info */}
      <Card>
        <CardHeader>
          <CardTitle>Kurye Bilgileri</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-full">
                <Truck className="w-4 h-4 text-gray-600" />
              </div>
              <div>
                <p className="font-medium">{courierInfo.name}</p>
                <p className="text-sm text-gray-600">
                  {courierInfo.vehicleType} • {courierInfo.vehiclePlate || "Plaka bilgisi yok"}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              <Phone className="w-4 h-4 mr-2" />
              {courierInfo.phone}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Address Info */}
      <Card>
        <CardHeader>
          <CardTitle>Teslimat Bilgileri</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-gray-500 mt-1" />
              <div>
                <p className="text-sm text-gray-600">Teslimat Adresi</p>
                <p className="font-medium">{customerLocation.address || "Teslimat adresi bilgisi mevcut değil"}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
