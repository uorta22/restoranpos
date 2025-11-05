"use client"

import { useEffect, useState } from "react"
import { GOOGLE_MAPS_CONFIG } from "@/lib/google-maps"

export function useGoogleMaps() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    // Google Maps zaten yüklüyse
    if (window.google && window.google.maps) {
      setIsLoaded(true)
      return
    }

    // API key yoksa hata ver
    if (!GOOGLE_MAPS_CONFIG.apiKey) {
      setLoadError("Google Maps API key bulunamadı")
      return
    }

    // Google Maps script'ini yükle
    const script = document.createElement("script")
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_CONFIG.apiKey}&libraries=${GOOGLE_MAPS_CONFIG.libraries.join(",")}`
    script.async = true
    script.defer = true

    script.onload = () => {
      setIsLoaded(true)
    }

    script.onerror = () => {
      setLoadError("Google Maps yüklenemedi")
    }

    document.head.appendChild(script)

    return () => {
      // Cleanup
      const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`)
      if (existingScript) {
        document.head.removeChild(existingScript)
      }
    }
  }, [])

  return { isLoaded, loadError }
}
