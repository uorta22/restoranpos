"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Package, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"

export default function TrackPage() {
  const [orderId, setOrderId] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!orderId.trim()) {
      setError("Lütfen sipariş numarası girin")
      return
    }

    setLoading(true)
    setError("")

    try {
      // Validate order ID format (basic validation)
      if (orderId.length < 3) {
        throw new Error("Geçersiz sipariş numarası")
      }

      // Navigate to order tracking page
      router.push(`/track/${encodeURIComponent(orderId.trim())}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Package className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Sipariş Takibi</CardTitle>
          <CardDescription>Sipariş numaranızı girerek siparişinizin durumunu takip edebilirsiniz</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleTrack} className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="Sipariş numaranızı girin"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="text-center text-lg"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading || !orderId.trim()}>
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Aranıyor...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Siparişi Takip Et
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Sipariş numaranızı SMS veya e-posta ile aldınız</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
