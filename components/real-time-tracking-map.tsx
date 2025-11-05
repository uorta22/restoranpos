"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Navigation, Phone, Truck, Clock, AlertCircle } from "lucide-react"
import { calculateDistance, estimateDeliveryTime } from "@/lib/google-maps"
import { MockMapTracking } from "@/components/mock-map-tracking"

interface RealTimeTrackingMapProps {
  orderId: string
  courierLocation: { lat: number; lng: number }
  customerLocation: { lat: number; lng: number; address: string }
  courierInfo: {
    name: string
    phone: string
    vehicleType: "Motorsiklet" | "Bisiklet" | "Araba"
    vehiclePlate?: string
  }
  orderStatus: string
}

declare global {
  interface Window {
    google: any
    initMap: () => void
    gm_authFailure: () => void
  }
}

export function RealTimeTrackingMap({
  orderId,
  courierLocation,
  customerLocation,
  courierInfo,
  orderStatus,
}: RealTimeTrackingMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const courierMarkerRef = useRef<any>(null)
  const customerMarkerRef = useRef<any>(null)
  const directionsRendererRef = useRef<any>(null)

  const [isLoaded, setIsLoaded] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const [distance, setDistance] = useState<number>(0)
  const [estimatedTime, setEstimatedTime] = useState<number>(0)
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null)

  // Calculate fallback distance and time
  useEffect(() => {
    const dist = calculateDistance(courierLocation.lat, courierLocation.lng, customerLocation.lat, customerLocation.lng)
    setDistance(dist)
    setEstimatedTime(estimateDeliveryTime(dist, courierInfo.vehicleType))
  }, [courierLocation, customerLocation, courierInfo.vehicleType])

  // Load Google Maps
  useEffect(() => {
    if (window.google?.maps) {
      setIsLoaded(true)
      return
    }

    const script = document.createElement("script")
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBBbRndxi4HvAI51BP9-pMyrVwzSS8QspU&libraries=places,geometry`
    script.async = true
    script.defer = true

    script.onload = () => {
      setIsLoaded(true)
    }

    script.onerror = () => {
      setLoadError("Google Maps script yüklenemedi")
    }

    // Listen for Google Maps API errors
    window.gm_authFailure = () => {
      setApiError("Google Maps API anahtarı geçersiz")
    }

    document.head.appendChild(script)
  }, [])

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapRef.current || loadError || apiError) return

    try {
      // Create map
      const map = new window.google.maps.Map(mapRef.current, {
        zoom: 14,
        center: courierLocation,
        mapTypeId: window.google.maps.MapTypeId.ROADMAP,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
          },
        ],
      })

      mapInstanceRef.current = map

      // Create courier marker
      const courierMarker = new window.google.maps.Marker({
        position: courierLocation,
        map: map,
        title: `Kurye: ${courierInfo.name}`,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: "#3B82F6",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 3,
        },
      })

      courierMarkerRef.current = courierMarker

      // Create customer marker
      const customerMarker = new window.google.maps.Marker({
        position: customerLocation,
        map: map,
        title: "Teslimat Adresi",
        icon: {
          path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
          scale: 6,
          fillColor: "#EF4444",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      })

      customerMarkerRef.current = customerMarker

      // Create directions renderer
      const directionsRenderer = new window.google.maps.DirectionsRenderer({
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: "#3B82F6",
          strokeWeight: 4,
          strokeOpacity: 0.8,
        },
      })

      directionsRenderer.setMap(map)
      directionsRendererRef.current = directionsRenderer

      // Calculate and display route
      const directionsService = new window.google.maps.DirectionsService()
      directionsService.route(
        {
          origin: courierLocation,
          destination: customerLocation,
          travelMode: window.google.maps.TravelMode.DRIVING,
          avoidHighways: false,
          avoidTolls: false,
        },
        (result: any, status: any) => {
          if (status === window.google.maps.DirectionsStatus.OK && result) {
            directionsRenderer.setDirections(result)

            const route = result.routes[0]
            if (route && route.legs[0]) {
              setRouteInfo({
                distance: route.legs[0].distance?.text || "",
                duration: route.legs[0].duration?.text || "",
              })
            }
          } else {
            console.error("Directions request failed:", status)
            if (status === "REQUEST_DENIED") {
              setApiError("Directions API etkinleştirilmemiş")
            }
          }
        },
      )

      // Fit map to show both markers
      const bounds = new window.google.maps.LatLngBounds()
      bounds.extend(courierLocation)
      bounds.extend(customerLocation)
      map.fitBounds(bounds)
    } catch (error: any) {
      console.error("Map initialization error:", error)
      setLoadError("Harita başlatılamadı: " + error.message)
    }
  }, [isLoaded, loadError, apiError, courierLocation, customerLocation, courierInfo])

  // If there's an API error, show setup guide
  if (apiError || loadError) {
    return (
      <div className="space-y-4">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-800">Google Maps API Hatası</h3>
                <p className="text-sm text-red-700 mt-1">{apiError || loadError}</p>
                <p className="text-sm text-red-600 mt-2">Mock harita sistemi kullanılıyor.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <MockMapTracking
          orderId={orderId}
          courierLocation={courierLocation}
          customerLocation={customerLocation}
          courierInfo={courierInfo}
          orderStatus={orderStatus}
        />
      </div>
    )
  }

  // If not loaded yet, show loading
  if (!isLoaded) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Google Maps yükleniyor...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Map */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="w-5 h-5" />
            Canlı Takip
            <Badge variant="secondary" className="bg-green-500 text-white">
              <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></div>
              Aktif
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div ref={mapRef} className="w-full h-96 rounded-lg border" />
        </CardContent>
      </Card>

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
                <p className="font-semibold">{routeInfo?.distance || `${distance.toFixed(1)} km`}</p>
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
                <p className="font-semibold">{routeInfo?.duration || `${estimatedTime} dk`}</p>
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
    </div>
  )
}
