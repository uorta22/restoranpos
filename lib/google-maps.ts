// Google Maps API utilities
export interface GoogleMapsConfig {
  apiKey: string
  libraries: string[]
}

// Google Maps API key'ini güncelleyelim
export const GOOGLE_MAPS_CONFIG: GoogleMapsConfig = {
  apiKey: "AIzaSyBBbRndxi4HvAI51BP9-pMyrVwzSS8QspU",
  libraries: ["places", "geometry"],
}

export interface Location {
  lat: number
  lng: number
  address?: string
}

export interface RouteInfo {
  distance: string
  duration: string
  steps: google.maps.DirectionsStep[]
}

declare global {
  interface Window {
    google: any
  }
}

// Haversine formula ile mesafe hesaplama (Google Maps olmadan da çalışır)
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Tahmini varış süresi hesaplama
export function estimateDeliveryTime(
  distanceKm: number,
  vehicleType: "Motorsiklet" | "Bisiklet" | "Araba" = "Motorsiklet",
): number {
  const speeds = {
    Motorsiklet: 25, // km/h ortalama şehir içi hız
    Bisiklet: 15,
    Araba: 20,
  }

  const speed = speeds[vehicleType]
  const timeInHours = distanceKm / speed
  const timeInMinutes = Math.ceil(timeInHours * 60)

  // Minimum 5 dakika, maksimum 60 dakika
  return Math.max(5, Math.min(60, timeInMinutes))
}
