"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { SidebarNav } from "@/components/sidebar-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useOrderContext } from "@/context/order-context"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { formatCurrency, formatDateTime } from "@/lib/utils"
import { OrderStatus, OrderType } from "@/lib/types"
import { Clock, CheckCircle, AlertTriangle, ChefHat } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function KitchenPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const { orders, updateOrderStatus } = useOrderContext()
  const [showSidebar, setShowSidebar] = useState(true)

  // Responsive sidebar kontrolü
  useEffect(() => {
    const handleResize = () => {
      setShowSidebar(window.innerWidth >= 768)
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  if (!user) {
    router.push("/login")
    return null
  }

  // Mutfak için sadece aktif siparişler
  const kitchenOrders = orders.filter(
    (order) => order.status === OrderStatus.PENDING_CONFIRMATION ||
               order.status === OrderStatus.CONFIRMED ||
               order.status === OrderStatus.PAID ||
               order.status === OrderStatus.PREPARING ||
               order.status === OrderStatus.READY_FOR_SERVICE
  )

  const handleStatusChange = async (
    orderId: string,
    status: OrderStatus,
  ) => {
    try {
      await updateOrderStatus(orderId, status)
      toast({
        title: "Durum güncellendi",
        description: `Sipariş durumu "${status}" olarak güncellendi.`,
      })
    } catch (error) {
      toast({
        title: "Hata",
        description: "Sipariş durumu güncellenirken bir hata oluştu.",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case OrderStatus.PENDING_CONFIRMATION:
        return (
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
            <AlertTriangle className="mr-1 h-3 w-3" /> Onay Bekliyor
          </Badge>
        )
      case OrderStatus.CONFIRMED:
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <AlertTriangle className="mr-1 h-3 w-3" /> Onaylandı
          </Badge>
        )
      case OrderStatus.PAID:
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="mr-1 h-3 w-3" /> Ödendi
          </Badge>
        )
      case OrderStatus.PREPARING:
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="mr-1 h-3 w-3" /> Hazırlanıyor
          </Badge>
        )
      case OrderStatus.READY_FOR_SERVICE:
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="mr-1 h-3 w-3" /> Servis Bekliyor
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPriorityColor = (createdAt: string) => {
    const orderTime = new Date(createdAt)
    const now = new Date()
    const diffMinutes = (now.getTime() - orderTime.getTime()) / (1000 * 60)

    if (diffMinutes > 30) return "border-red-500 bg-red-50"
    if (diffMinutes > 15) return "border-yellow-500 bg-yellow-50"
    return "border-gray-200"
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {showSidebar && <SidebarNav />}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header showMobileMenu={!showSidebar} onMenuToggle={() => setShowSidebar(!showSidebar)} />
        <div className="flex-1 overflow-auto p-4">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <ChefHat className="w-8 h-8 text-orange-600" />
              <h1 className="text-2xl font-bold">Mutfak Ekranı</h1>
            </div>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>Acil (30+ dk)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span>Dikkat (15+ dk)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Normal</span>
              </div>
            </div>
          </div>

          {kitchenOrders.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <ChefHat className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium mb-2">Bekleyen Sipariş Yok</h3>
                <p className="text-gray-600">Yeni siparişler burada görünecek.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {kitchenOrders
                .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                .map((order) => (
                  <Card key={order.id} className={`${getPriorityColor(order.createdAt)} border-2`}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">#{order.id.slice(-6)}</CardTitle>
                          <p className="text-sm text-gray-600">{formatDateTime(order.createdAt)}</p>
                          {order.tableName && (
                            <p className="text-sm font-medium text-blue-600">Masa: {order.tableName}</p>
                          )}
                          {order.customerName && (
                            <p className="text-sm font-medium text-green-600">Müşteri: {order.customerName}</p>
                          )}
                        </div>
                        {getStatusBadge(order.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Sipariş Öğeleri */}
                      <div className="space-y-2">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex justify-between items-start p-2 bg-white rounded border">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{item.foodItem.title}</p>
                              <p className="text-xs text-gray-600">{item.foodItem.description}</p>
                            </div>
                            <div className="text-right ml-2">
                              <p className="font-bold text-lg">{item.quantity}x</p>
                              <p className="text-xs text-gray-500">{formatCurrency(item.foodItem.price)}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Notlar */}
                      {order.notes && (
                        <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
                          <p className="text-xs font-medium text-yellow-800">Not:</p>
                          <p className="text-sm text-yellow-700">{order.notes}</p>
                        </div>
                      )}

                      {/* Toplam */}
                      <div className="flex justify-between items-center pt-2 border-t">
                        <span className="font-medium">Toplam:</span>
                        <span className="font-bold text-lg">{formatCurrency(order.total)}</span>
                      </div>

                      {/* Aksiyon Butonları */}
                      <div className="flex flex-col gap-2">
                        {order.status === OrderStatus.PENDING_CONFIRMATION && (
                          <Button
                            onClick={() => {
                              // Gel-Al siparişleri için direkt ödendi statüsüne geç
                              if (order.orderType === OrderType.TAKEAWAY) {
                                handleStatusChange(order.id, OrderStatus.PAID)
                              } else {
                                handleStatusChange(order.id, OrderStatus.CONFIRMED)
                              }
                            }}
                            className="w-full bg-blue-600 hover:bg-blue-700"
                          >
                            Onayla
                          </Button>
                        )}
                        {(order.status === OrderStatus.CONFIRMED || order.status === OrderStatus.PAID) && (
                          <Button
                            onClick={() => handleStatusChange(order.id, OrderStatus.PREPARING)}
                            className="w-full bg-yellow-600 hover:bg-yellow-700"
                          >
                            Hazırlamaya Başla
                          </Button>
                        )}
                        {order.status === OrderStatus.PREPARING && (
                          <Button
                            onClick={() => handleStatusChange(order.id, OrderStatus.READY_FOR_SERVICE)}
                            className="w-full bg-green-600 hover:bg-green-700"
                          >
                            Hazır
                          </Button>
                        )}
                        {order.status === OrderStatus.READY_FOR_SERVICE && (
                          <>
                            {order.orderType === OrderType.TAKEAWAY ? (
                              <Button
                                onClick={() => handleStatusChange(order.id, OrderStatus.COMPLETED)}
                                className="w-full bg-green-600 hover:bg-green-700"
                              >
                                Teslim Edildi (Gel-Al)
                              </Button>
                            ) : order.orderType === OrderType.DELIVERY ? (
                              <Button
                                onClick={() => handleStatusChange(order.id, OrderStatus.OUT_FOR_DELIVERY)}
                                className="w-full bg-purple-600 hover:bg-purple-700"
                              >
                                Kuryeye Ver
                              </Button>
                            ) : (
                              <div className="text-center p-2 bg-green-100 rounded">
                                <p className="text-green-800 font-medium">Garson Servisi Bekliyor</p>
                              </div>
                            )}
                          </>
                        )}
                        {order.status === OrderStatus.OUT_FOR_DELIVERY && (
                          <Button
                            onClick={() => handleStatusChange(order.id, OrderStatus.COMPLETED)}
                            className="w-full bg-green-600 hover:bg-green-700"
                          >
                            Teslim Edildi (Paket)
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
