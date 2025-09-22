"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useOrderContext } from "@/context/order-context"
import { useCourierContext } from "@/context/courier-context"
import { MapDelivery } from "@/components/map-delivery"
import { formatCurrency, formatDateTime } from "@/lib/utils"
import { MapPin, User, Phone, Clock, Bike } from "lucide-react"

interface CustomerTrackingProps {
  orderId: string
  customerName: string
}

export function CustomerTracking({ orderId, customerName }: CustomerTrackingProps) {
  const { getOrderById } = useOrderContext()
  const { getCourierById } = useCourierContext()
  const [order, setOrder] = useState<any>(null)
  const [courier, setCourier] = useState<any>(null)
  const [isMapOpen, setIsMapOpen] = useState(false)

  useEffect(() => {
    // Siparişi yükle
    const orderData = getOrderById(orderId)
    setOrder(orderData)

    // Kurye bilgisini yükle
    if (orderData && orderData.courierId) {
      const courierData = getCourierById(orderData.courierId)
      setCourier(courierData)
    }

    // Gerçek bir uygulamada, burada WebSocket bağlantısı kurulabilir
    // ve sipariş/kurye bilgileri gerçek zamanlı olarak güncellenebilir

    // Simülasyon için 10 saniyede bir güncelle
    const intervalId = setInterval(() => {
      const refreshedOrder = getOrderById(orderId)
      setOrder(refreshedOrder)

      if (refreshedOrder && refreshedOrder.courierId) {
        const refreshedCourier = getCourierById(refreshedOrder.courierId)
        setCourier(refreshedCourier)
      }
    }, 10000)

    return () => clearInterval(intervalId)
  }, [orderId, getOrderById, getCourierById])

  if (!order) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p>Sipariş bilgisi yükleniyor...</p>
        </CardContent>
      </Card>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Beklemede":
        return <Badge className="bg-yellow-100 text-yellow-800">Hazırlanıyor</Badge>
      case "Hazırlanıyor":
        return <Badge className="bg-blue-100 text-blue-800">Hazırlanıyor</Badge>
      case "Hazır":
        return <Badge className="bg-green-100 text-green-800">Hazır</Badge>
      case "Tamamlandı":
        return <Badge className="bg-purple-100 text-purple-800">Tamamlandı</Badge>
      case "İptal Edildi":
        return <Badge className="bg-red-100 text-red-800">İptal Edildi</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getDeliveryStatusBadge = (status: string) => {
    switch (status) {
      case "Beklemede":
        return <Badge className="bg-yellow-100 text-yellow-800">Beklemede</Badge>
      case "Yolda":
        return <Badge className="bg-blue-100 text-blue-800">Yolda</Badge>
      case "Teslim Edildi":
        return <Badge className="bg-green-100 text-green-800">Teslim Edildi</Badge>
      default:
        return <Badge>{status || "Hazırlanıyor"}</Badge>
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Sipariş Takibi #{order.id.slice(-6)}</span>
            {order.deliveryStatus && getDeliveryStatusBadge(order.deliveryStatus)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-500">
              <Clock className="inline-block h-4 w-4 mr-1" />
              Sipariş Zamanı: {formatDateTime(order.createdAt)}
            </p>

            <div className="flex justify-between">
              <span>Sipariş Durumu:</span>
              <span>{getStatusBadge(order.status)}</span>
            </div>

            {order.deliveryAddress && (
              <div className="mt-4 space-y-2">
                <h3 className="font-medium">Teslimat Adresi</h3>
                <p className="text-sm flex items-start">
                  <MapPin className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                  <span>{order.deliveryAddress.fullAddress}</span>
                </p>
                <p className="text-sm">
                  <Phone className="inline-block h-4 w-4 mr-1" />
                  {order.deliveryAddress.contactPhone}
                </p>
              </div>
            )}

            {courier && (
              <div className="mt-4 p-3 bg-blue-50 rounded-md">
                <h3 className="font-medium mb-2">Kurye Bilgileri</h3>
                <p className="text-sm flex items-center">
                  <User className="h-4 w-4 mr-1" />
                  {courier.name}
                </p>
                <p className="text-sm flex items-center mt-1">
                  <Phone className="h-4 w-4 mr-1" />
                  {courier.phone}
                </p>
                <p className="text-sm flex items-center mt-1">
                  <Bike className="h-4 w-4 mr-1" />
                  {courier.vehicleType}
                  {courier.vehiclePlate && ` (${courier.vehiclePlate})`}
                </p>

                {order.deliveryStatus === "Yolda" && (
                  <Button variant="outline" className="w-full mt-3" onClick={() => setIsMapOpen(true)}>
                    <MapPin className="mr-2 h-4 w-4" />
                    Haritada Takip Et
                  </Button>
                )}
              </div>
            )}

            <div className="mt-4 pt-4 border-t">
              <h3 className="font-medium mb-2">Sipariş Özeti</h3>
              <div className="space-y-2">
                {order.items.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between">
                    <span>
                      {item.quantity}x {item.foodItem.title}
                    </span>
                    <span>{formatCurrency(item.foodItem.price * item.quantity)}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold pt-2 border-t">
                  <span>Toplam:</span>
                  <span>{formatCurrency(order.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Harita Dialog */}
      {courier && (
        <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Kurye Takibi</DialogTitle>
            </DialogHeader>
            <div className="h-[500px]">
              <MapDelivery courier={courier} order={order} customerView={true} />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
