"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertCircle, Loader2, RefreshCw } from "lucide-react"

export function GoogleMapsTest() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [errorMessage, setErrorMessage] = useState("")
  const [apiKeyStatus, setApiKeyStatus] = useState<"checking" | "valid" | "invalid">("checking")
  const [testResults, setTestResults] = useState({
    staticMap: false,
    geocoding: false,
    directions: false,
  })

  const testStaticMapsAPI = async () => {
    try {
      const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=41.0082,28.9784&zoom=13&size=400x300&markers=color:red%7C41.0082,28.9784&key=AIzaSyBBbRndxi4HvAI51BP9-pMyrVwzSS8QspU`

      const response = await fetch(staticMapUrl)
      if (response.ok) {
        setTestResults((prev) => ({ ...prev, staticMap: true }))
        return true
      } else {
        throw new Error(`Static Maps API hatası: ${response.status}`)
      }
    } catch (error: any) {
      setErrorMessage((prev) => prev + `Static Maps: ${error.message}\n`)
      return false
    }
  }

  const testGeocodingAPI = async () => {
    try {
      const geocodingUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=Istanbul,Turkey&key=AIzaSyBBbRndxi4HvAI51BP9-pMyrVwzSS8QspU`

      const response = await fetch(geocodingUrl)
      const data = await response.json()

      if (data.status === "OK") {
        setTestResults((prev) => ({ ...prev, geocoding: true }))
        return true
      } else {
        throw new Error(`Geocoding API hatası: ${data.status}`)
      }
    } catch (error: any) {
      setErrorMessage((prev) => prev + `Geocoding: ${error.message}\n`)
      return false
    }
  }

  const testDirectionsAPI = async () => {
    try {
      const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=41.0082,28.9784&destination=41.015,28.985&key=AIzaSyBBbRndxi4HvAI51BP9-pMyrVwzSS8QspU`

      const response = await fetch(directionsUrl)
      const data = await response.json()

      if (data.status === "OK") {
        setTestResults((prev) => ({ ...prev, directions: true }))
        return true
      } else {
        throw new Error(`Directions API hatası: ${data.status}`)
      }
    } catch (error: any) {
      setErrorMessage((prev) => prev + `Directions: ${error.message}\n`)
      return false
    }
  }

  const runAllTests = async () => {
    setStatus("loading")
    setApiKeyStatus("checking")
    setErrorMessage("")
    setTestResults({ staticMap: false, geocoding: false, directions: false })

    try {
      const results = await Promise.all([testStaticMapsAPI(), testGeocodingAPI(), testDirectionsAPI()])

      const successCount = results.filter(Boolean).length

      if (successCount === 3) {
        setStatus("success")
        setApiKeyStatus("valid")
      } else if (successCount > 0) {
        setStatus("error")
        setApiKeyStatus("valid")
        setErrorMessage((prev) => prev + `\n${successCount}/3 API test başarılı`)
      } else {
        setStatus("error")
        setApiKeyStatus("invalid")
      }
    } catch (error: any) {
      setStatus("error")
      setApiKeyStatus("invalid")
      setErrorMessage(`Genel test hatası: ${error.message}`)
    }
  }

  useEffect(() => {
    runAllTests()
  }, [])

  const getStatusBadge = () => {
    switch (status) {
      case "loading":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Test Ediliyor
          </Badge>
        )
      case "success":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Başarılı
          </Badge>
        )
      case "error":
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Hata
          </Badge>
        )
    }
  }

  const getApiKeyBadge = () => {
    switch (apiKeyStatus) {
      case "checking":
        return (
          <Badge variant="outline">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Kontrol Ediliyor
          </Badge>
        )
      case "valid":
        return (
          <Badge className="bg-green-500 text-white">
            <CheckCircle className="w-3 h-3 mr-1" />
            Geçerli
          </Badge>
        )
      case "invalid":
        return (
          <Badge className="bg-red-500 text-white">
            <AlertCircle className="w-3 h-3 mr-1" />
            Geçersiz
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Google Maps API Test</CardTitle>
            <div className="flex gap-2">
              {getApiKeyBadge()}
              {getStatusBadge()}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>API Key:</strong> AIzaSyB...cnF4 (gizlendi)
              </div>
              <div>
                <strong>Test Türü:</strong> REST API Testleri
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800 text-sm whitespace-pre-line">{errorMessage}</p>
                {errorMessage.includes("BILLING") && (
                  <div className="mt-2">
                    <a
                      href="https://console.cloud.google.com/billing"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Google Cloud Billing Console →
                    </a>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={runAllTests} disabled={status === "loading"}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Tekrar Test Et
              </Button>

              <Button
                variant="outline"
                onClick={() => window.open("https://console.cloud.google.com/apis/dashboard", "_blank")}
              >
                Google Cloud Console
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Static Map Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Static Map Önizleme</CardTitle>
        </CardHeader>
        <CardContent>
          {testResults.staticMap ? (
            <img
              src={`https://maps.googleapis.com/maps/api/staticmap?center=41.0082,28.9784&zoom=13&size=400x300&markers=color:red%7C41.0082,28.9784&key=AIzaSyBBbRndxi4HvAI51BP9-pMyrVwzSS8QspU`}
              alt="Istanbul Static Map"
              className="w-full max-w-md mx-auto rounded-lg border"
            />
          ) : (
            <div className="w-full h-64 bg-gray-100 rounded-lg border flex items-center justify-center">
              {status === "loading" ? (
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                  <p className="text-gray-600">Harita yükleniyor...</p>
                </div>
              ) : (
                <div className="text-center">
                  <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                  <p className="text-gray-600">Harita yüklenemedi</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Results */}
      <Card>
        <CardHeader>
          <CardTitle>API Test Sonuçları</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              {testResults.staticMap ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-500" />
              )}
              <span>Static Maps API</span>
            </div>

            <div className="flex items-center gap-2">
              {testResults.geocoding ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-500" />
              )}
              <span>Geocoding API</span>
            </div>

            <div className="flex items-center gap-2">
              {testResults.directions ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-500" />
              )}
              <span>Directions API</span>
            </div>
          </div>

          {status === "success" && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-800 text-sm">
                ✅ Tüm Google Maps API'leri başarıyla çalışıyor! Artık gerçek harita takibini kullanabilirsiniz.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
