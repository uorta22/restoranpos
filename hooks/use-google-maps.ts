"use client"

import { useEffect, useState } from "react"
import { GOOGLE_MAPS_CONFIG } from "@/lib/google-maps"

// Global flag to prevent multiple script loads
let isGoogleMapsLoading = false
let googleMapsLoadPromise: Promise<void> | null = null

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

    // Zaten yüklenmekte olan script var mı kontrol et
    const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`)
    if (existingScript) {
      setIsLoaded(false) // Yükleme devam ediyor
      return
    }

    // Zaten yükleme süreci başlamışsa promise'i bekle
    if (isGoogleMapsLoading && googleMapsLoadPromise) {
      googleMapsLoadPromise.then(() => setIsLoaded(true)).catch(() => setLoadError("Google Maps yüklenemedi"))
      return
    }

    // İlk kez yükleme başlat
    isGoogleMapsLoading = true

    googleMapsLoadPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script")
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_CONFIG.apiKey}&libraries=${GOOGLE_MAPS_CONFIG.libraries.join(",")}`
      script.async = true
      script.defer = true

      script.onload = () => {
        isGoogleMapsLoading = false
        resolve()
      }

      script.onerror = () => {
        isGoogleMapsLoading = false
        reject(new Error("Google Maps yüklenemedi"))
      }

      document.head.appendChild(script)
    })

    googleMapsLoadPromise.then(() => setIsLoaded(true)).catch(() => setLoadError("Google Maps yüklenemedi"))
  }, [])

  return { isLoaded, loadError }
}
