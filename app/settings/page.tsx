"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { GoogleMapsSetupGuide } from "@/components/google-maps-setup-guide"
import { getGoogleMapsApiConfigStatus } from "./actions"

function GoogleMapsSettings() {
  const [isKeyConfigured, setIsKeyConfigured] = useState<boolean | null>(null)

  useEffect(() => {
    // Call the server action when the component mounts
    getGoogleMapsApiConfigStatus().then((status) => {
      setIsKeyConfigured(status)
    })
  }, [])

  if (isKeyConfigured === null) {
    // Loading state
    return (
      <div className="p-6">
        <div className="h-24 w-full bg-gray-200 animate-pulse rounded-lg"></div>
      </div>
    )
  }

  return <GoogleMapsSetupGuide isApiKeyConfigured={isKeyConfigured} />
}

export default function SettingsPage() {
  // This main page component can now contain other client-side logic
  // and state as needed.

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Ayarlar</h1>
        <p className="text-gray-500">Uygulama ayarlarını ve entegrasyonları buradan yönetin.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Harita Entegrasyonu</CardTitle>
          <CardDescription>Kurye takibi ve teslimat özellikleri için Google Maps API kurulumu.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* 
            We now render a dedicated client component that handles
            calling the server action to get the API key status.
          */}
          <GoogleMapsSettings />
        </CardContent>
      </Card>

      {/* You can add other settings sections here */}
    </div>
  )
}
