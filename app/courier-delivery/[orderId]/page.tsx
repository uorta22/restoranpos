"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useOrderContext } from "@/context/order-context"
import { useCourierContext } from "@/context/courier-context"
import { CheckCircle, Package, User, MapPin, Phone, Clock } from "lucide-react"
import { formatCurrency, formatDateTime } from "@/lib/utils"
import { OrderStatus, PaymentStatus } from "@/lib/types"

interface Params {
  orderId: string
}

interface PageProps {
  params: Params
  searchParams: { [key: string]: string | string[] | undefined }
}

export default function CourierDeliveryPage({ params }: PageProps) {
  const { orderId } = params
  const { getOrderById, updateDeliveryStatus, updateOrderStatus, updatePaymentStatus } = useOrderContext()
  const { completeDelivery, couriers } = useCourierContext()
  const [isCompleting, setIsCompleting] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)

  const order = getOrderById(orderId)
  const courier = order?.courierId ? couriers.find(c => c.id === order.courierId) : null

  useEffect(() => {
    if (order?.deliveryStatus === "Teslim Edildi") {
      setIsCompleted(true)
    }
  }, [order])

  const handleCompleteDelivery = async () => {
    if (!order || !courier) return

    setIsCompleting(true)
    try {
      // 1. Kuryeyi serbest bırak
      completeDelivery(courier.id)

      // 2. Teslimat durumunu güncelle
      updateDeliveryStatus(order.id, "Teslim Edildi")

      // 3. Sipariş durumunu tamamlandı olarak güncelle
      await updateOrderStatus(order.id, OrderStatus.COMPLETED)

      // 4. Ödeme durumunu ödendi olarak güncelle (paket servis için nakit ödeme varsayıyoruz)
      await updatePaymentStatus(order.id, "Ödendi", "Nakit")

      setIsCompleted(true)

      // Success notification
      alert("Teslimat başarıyla tamamlandı! Sipariş ve ödeme durumu güncellendi. Bu sayfayı kapatabilirsiniz.")
    } catch (error) {
      console.error("Teslimat tamamlama hatası:", error)
      alert("Bir hata oluştu. Lütfen tekrar deneyin veya restoran ile iletişime geçin.")
    } finally {
      setIsCompleting(false)
    }
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Sipariş Bulunamadı</h2>
            <p className="text-gray-600">Bu sipariş numarası geçersiz veya silinmiş olabilir.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-600 mb-2">Teslimat Tamamlandı!</h2>
            <p className="text-gray-600 mb-4">Sipariş #{order.id.slice(-6)} başarıyla teslim edildi.</p>
            <Badge className="bg-green-100 text-green-800">Teslim Edildi</Badge>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-blue-600">Teslimat Onayı</CardTitle>
            <p className="text-gray-600">Sipariş #{order.id.slice(-6)}</p>
          </CardHeader>
        </Card>

        {/* Kurye Bilgileri */}
        {courier && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5" />
                Kurye Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Kurye:</strong> {courier.name}</p>
                <p className="flex items-center">
                  <Phone className="mr-2 h-4 w-4" />
                  {courier.phone}
                </p>
                <p><strong>Araç:</strong> {courier.vehicleType} {courier.vehiclePlate && `(${courier.vehiclePlate})`}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sipariş Detayları */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="mr-2 h-5 w-5" />
              Sipariş Detayları
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                <Clock className="mr-2 h-4 w-4 text-gray-500" />
                <span>{formatDateTime(order.createdAt)}</span>
              </div>

              <div className="flex items-center">
                <User className="mr-2 h-4 w-4 text-gray-500" />
                <span>{order.customerName || "Misafir"}</span>
              </div>

              {order.deliveryAddress && (
                <div className="flex items-start">
                  <MapPin className="mr-2 h-4 w-4 text-gray-500 mt-1" />
                  <span className="text-sm">
                    {order.deliveryAddress.address || order.deliveryAddress.fullAddress}
                  </span>
                </div>
              )}

              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Sipariş Öğeleri:</h4>
                <div className="space-y-2">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-start p-2 bg-gray-50 rounded">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.foodItem.title}</p>
                        <p className="text-xs text-gray-600">{item.quantity}x {formatCurrency(item.foodItem.price)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t font-bold text-lg">
                <span>Toplam:</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Teslimat Onay Butonu */}
        <Card>
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold mb-4">Siparişi teslim ettiniz mi?</h3>
            <p className="text-gray-600 mb-6">
              Bu butona bastıktan sonra teslimat tamamlanmış olarak işaretlenecektir.
            </p>
            <Button
              onClick={handleCompleteDelivery}
              disabled={isCompleting}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg"
            >
              {isCompleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  İşleniyor...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Evet, Teslim Ettim
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Uyarı */}
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <p className="text-yellow-800 text-sm">
              <strong>Not:</strong> Bu butona sadece siparişi gerçekten teslim ettikten sonra basın.
              Yanlış işaretleme durumunda restoran ile iletişime geçin.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}