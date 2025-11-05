"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useCourierContext } from "@/context/courier-context"
import { useOrderContext } from "@/context/order-context"
import { Bike, Car, Truck, Phone, Package, Plus, Users } from "lucide-react"
import { EmptyState } from "@/components/empty-state"

export function CourierDashboard() {
  const { couriers, getAvailableCouriers } = useCourierContext()
  const { getDeliveryOrders } = useOrderContext()

  const [availableCouriers, setAvailableCouriers] = useState<number>(0)
  const [busyCouriers, setBusyCouriers] = useState<number>(0)
  const [completedDeliveries, setCompletedDeliveries] = useState<number>(0)
  const [pendingOrders, setPendingOrders] = useState<number>(0)

  useEffect(() => {
    // Kurye durumlarını hesapla
    const available = getAvailableCouriers().length
    const busy = couriers.filter((c) => c.status !== "Müsait").length
    const completed = couriers.reduce((total, courier) => total + courier.totalDeliveries, 0)

    // Bekleyen paket servis siparişlerini hesapla
    const deliveryOrders = getDeliveryOrders()
    const pending = deliveryOrders.filter(
      (order) =>
        order.status === "Hazır" && (!order.deliveryStatus || order.deliveryStatus === "Beklemede") && !order.courierId,
    ).length

    setAvailableCouriers(available)
    setBusyCouriers(busy)
    setCompletedDeliveries(completed)
    setPendingOrders(pending)
  }, [couriers, getAvailableCouriers, getDeliveryOrders])

  const getVehicleIcon = (type: string) => {
    switch (type) {
      case "Motorsiklet":
        return <Bike className="h-5 w-5" />
      case "Araba":
        return <Car className="h-5 w-5" />
      case "Bisiklet":
        return <Bike className="h-5 w-5" />
      default:
        return <Truck className="h-5 w-5" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Müsait":
        return <Badge className="bg-green-100 text-green-800">Müsait</Badge>
      case "Siparişte":
        return <Badge className="bg-blue-100 text-blue-800">Siparişte</Badge>
      case "Teslimatta":
        return <Badge className="bg-orange-100 text-orange-800">Teslimatta</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  // Eğer kurye yoksa empty state göster
  if (couriers.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Henüz kurye eklenmemiş"
        description="Paket servis hizmeti verebilmek için önce kurye eklemeniz gerekiyor."
        action={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            İlk Kuryeyi Ekle
          </Button>
        }
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Müsait Kuryeler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{availableCouriers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Meşgul Kuryeler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{busyCouriers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Bekleyen Siparişler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{pendingOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Tamamlanan Teslimatlar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{completedDeliveries}</div>
          </CardContent>
        </Card>
      </div>

      <h3 className="text-lg font-semibold mt-6">Aktif Kuryeler</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {couriers.map((courier) => (
          <Card key={courier.id} className={courier.status === "Müsait" ? "border-green-200" : "border-blue-200"}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{courier.name}</CardTitle>
                {getStatusBadge(courier.status)}
              </div>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="space-y-2">
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-gray-500" />
                  <span>{courier.phone}</span>
                </div>
                <div className="flex items-center">
                  {getVehicleIcon(courier.vehicleType)}
                  <span className="ml-2">{courier.vehicleType}</span>
                  {courier.vehiclePlate && <span className="ml-2 text-gray-500">({courier.vehiclePlate})</span>}
                </div>
                <div className="flex items-center">
                  <Package className="h-4 w-4 mr-2 text-gray-500" />
                  <span>{courier.totalDeliveries} teslimat</span>
                </div>
                {courier.currentOrderId && (
                  <div className="mt-2 p-2 bg-blue-50 rounded-md">
                    <p className="text-sm font-medium">Aktif Sipariş:</p>
                    <p className="text-sm">#{courier.currentOrderId.slice(-6)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
