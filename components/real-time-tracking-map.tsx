"use client"

import { AlertCircle, Clock, ExternalLink, MapPin, Navigation, Phone, Truck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { calculateDistance, estimateDeliveryTime, GOOGLE_MAPS_CONFIG } from "@/lib/google-maps"

interface RealTimeTrackingMapProps {
  courierLocation: { lat: number; lng: number }
  customerLocation: { lat: number; lng: number; address: string }
  courierInfo: {
    name: string
    phone?: string
    vehicleType: "Motorsiklet" | "Bisiklet" | "Araba"
    vehiclePlate?: string
  }
  orderStatus: string
}

const statusLabels: Record<string, string> = {
  pending: "Beklemede",
  assigned: "Kurye atandı",
  en_route: "Yolda",
  delivered: "Teslim edildi",
  cancelled: "İptal edildi",
}

export function RealTimeTrackingMap({
  courierLocation,
  customerLocation,
  courierInfo,
  orderStatus,
}: RealTimeTrackingMapProps) {
  const distance = calculateDistance(
    courierLocation.lat,
    courierLocation.lng,
    customerLocation.lat,
    customerLocation.lng,
  )
  const estimatedTime = estimateDeliveryTime(distance, courierInfo.vehicleType)
  const travelMode = courierInfo.vehicleType === "Bisiklet" ? "bicycling" : "driving"
  const directionsUrl = new URL("https://www.google.com/maps/dir/")
  directionsUrl.searchParams.set("api", "1")
  directionsUrl.searchParams.set("origin", `${courierLocation.lat},${courierLocation.lng}`)
  directionsUrl.searchParams.set("destination", `${customerLocation.lat},${customerLocation.lng}`)
  directionsUrl.searchParams.set("travelmode", travelMode)

  let embedUrl: string | null = null
  if (GOOGLE_MAPS_CONFIG.apiKey) {
    const url = new URL("https://www.google.com/maps/embed/v1/directions")
    url.searchParams.set("key", GOOGLE_MAPS_CONFIG.apiKey)
    url.searchParams.set("origin", `${courierLocation.lat},${courierLocation.lng}`)
    url.searchParams.set("destination", `${customerLocation.lat},${customerLocation.lng}`)
    url.searchParams.set("mode", travelMode)
    embedUrl = url.toString()
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
          <CardTitle className="flex min-w-0 items-center gap-2 text-base">
            <Navigation className="h-5 w-5 shrink-0" aria-hidden="true" />
            Canlı takip
          </CardTitle>
          <Badge variant={orderStatus === "cancelled" || orderStatus === "İptal Edildi" ? "destructive" : "secondary"}>
            {statusLabels[orderStatus] ?? orderStatus}
          </Badge>
        </CardHeader>
        <CardContent>
          {embedUrl ? (
            <iframe
              title="Kurye ile teslimat noktası arasındaki rota"
              src={embedUrl}
              className="h-96 w-full border"
              loading="lazy"
              allowFullScreen
            />
          ) : (
            <div className="flex h-72 flex-col items-center justify-center border bg-gray-50 px-6 text-center">
              <AlertCircle className="h-6 w-6 text-orange-600" aria-hidden="true" />
              <p className="mt-3 font-medium text-gray-950">Harita yapılandırılmamış</p>
              <p className="mt-1 max-w-md text-sm text-gray-600">
                Rota özeti kullanılabilir; gömülü harita için alan adıyla kısıtlanmış Google Maps Embed API anahtarı gerekir.
              </p>
            </div>
          )}
          <Button asChild variant="outline" size="sm" className="mt-3">
            <a href={directionsUrl.toString()} target="_blank" rel="noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" aria-hidden="true" />
              {"Google Maps'te aç"}
            </a>
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <MapPin className="h-5 w-5 text-blue-600" aria-hidden="true" />
            <div>
              <p className="text-sm text-gray-600">Yaklaşık mesafe</p>
              <p className="font-semibold">{distance.toFixed(1)} km</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Clock className="h-5 w-5 text-green-600" aria-hidden="true" />
            <div>
              <p className="text-sm text-gray-600">Tahmini süre</p>
              <p className="font-semibold">{estimatedTime} dk</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Truck className="h-5 w-5 text-violet-600" aria-hidden="true" />
            <div>
              <p className="text-sm text-gray-600">Araç</p>
              <p className="font-semibold">{courierInfo.vehicleType}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Kurye bilgileri</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-medium text-gray-950">{courierInfo.name}</p>
            <p className="text-sm text-gray-600">
              {courierInfo.vehicleType} · {courierInfo.vehiclePlate || "Plaka bilgisi yok"}
            </p>
          </div>
          {courierInfo.phone && (
            <Button asChild variant="outline" size="sm">
              <a href={`tel:${courierInfo.phone}`}>
                <Phone className="mr-2 h-4 w-4" aria-hidden="true" />
                {courierInfo.phone}
              </a>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
