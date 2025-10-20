"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { SidebarNav } from "@/components/sidebar-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useCourierContext } from "@/context/courier-context"
import { useOrderContext } from "@/context/order-context"
import { formatCurrency, formatDateTime } from "@/lib/utils"
import { CourierDashboard } from "@/components/courier-dashboard"
import { CourierOrderDetails } from "@/components/courier-order-details"
import { RealTimeTrackingMap } from "@/components/real-time-tracking-map"
import {
  Bike,
  Car,
  Truck,
  User,
  Phone,
  MapPin,
  Package,
  Clock,
  CheckCircle,
  Plus,
  Trash2,
  LocateFixed,
  Send,
  Edit,
  Navigation,
  Link,
  MessageSquare,
} from "lucide-react"
import type { Courier, Order } from "@/lib/types"
import { OrderStatus, PaymentStatus, OrderType } from "@/lib/types"

// Sabit demo konumları (İstanbul'da gerçekçi konumlar)
const DEMO_LOCATIONS = {
  // Restoran konumu (merkez)
  restaurant: { lat: 41.0082, lng: 28.9784 }, // Taksim Meydanı

  // Müşteri konumları (yakın çevre)
  customers: [
    { lat: 41.0111, lng: 28.9756, address: "Beyoğlu, İstiklal Caddesi No:123" }, // İstiklal Caddesi
    { lat: 41.0162, lng: 28.9833, address: "Şişhane, Meşrutiyet Caddesi No:45" }, // Şişhane
    { lat: 41.0046, lng: 28.9877, address: "Karaköy, Kemankeş Caddesi No:67" }, // Karaköy
    { lat: 41.0036, lng: 28.9732, address: "Cihangir, Sıraselviler Caddesi No:89" }, // Cihangir
    { lat: 41.0167, lng: 28.9718, address: "Kasımpaşa, Bahriye Caddesi No:34" }, // Kasımpaşa
  ],

  // Kurye başlangıç konumları (restoran civarı)
  courierStarts: [
    { lat: 41.0082, lng: 28.9784 }, // Restoran (Taksim)
    { lat: 41.0092, lng: 28.9774 }, // Taksim civarı
    { lat: 41.0072, lng: 28.9794 }, // Taksim civarı
  ],
}

export default function DeliveryPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const {
    couriers,
    getAvailableCouriers,
    addCourier,
    updateCourier,
    removeCourier,
    assignOrderToCourier,
    updateCourierStatus,
    completeDelivery,
    startLiveTracking,
    stopLiveTracking,
    isLiveTracking,
  } = useCourierContext()
  const { orders, getDeliveryOrders, updateDeliveryStatus, getOrderById, updateOrderStatus, updatePaymentStatus } = useOrderContext()

  const [showSidebar, setShowSidebar] = useState(true)
  const [isAddCourierOpen, setIsAddCourierOpen] = useState(false)
  const [isEditCourierOpen, setIsEditCourierOpen] = useState(false)
  const [isAssignOrderOpen, setIsAssignOrderOpen] = useState(false)
  const [isViewOrderOpen, setIsViewOrderOpen] = useState(false)
  const [isTrackingOpen, setIsTrackingOpen] = useState(false)
  const [selectedCourier, setSelectedCourier] = useState<Courier | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null)
  const [viewOrderDetails, setViewOrderDetails] = useState<Order | null>(null)
  const [courierForm, setCourierForm] = useState({
    id: "",
    name: "",
    phone: "",
    vehicleType: "Motorsiklet" as Courier["vehicleType"],
    vehiclePlate: "",
  })

  // Demo için sabit müşteri konumu (sipariş seçildiğinde değişmeyecek)
  const [customerLocation, setCustomerLocation] = useState(DEMO_LOCATIONS.customers[0])

  const deliveryOrders = getDeliveryOrders()
  const pendingDeliveryOrders = deliveryOrders.filter(
    (order) =>
      (order.status === OrderStatus.OUT_FOR_DELIVERY || order.status === OrderStatus.READY_FOR_SERVICE) &&
      (!order.deliveryStatus || order.deliveryStatus === "Beklemede") &&
      !order.courierId,
  )
  const activeDeliveryOrders = deliveryOrders.filter(
    (order) => order.courierId && (order.deliveryStatus === "Beklemede" || order.deliveryStatus === "Yolda"),
  )
  const completedDeliveryOrders = deliveryOrders.filter((order) => order.deliveryStatus === "Teslim Edildi")

  const availableCouriers = getAvailableCouriers()
  const busyCouriers = couriers.filter((courier) => courier.status !== "Müsait")

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

  const handleAddCourier = () => {
    if (!courierForm.name || !courierForm.phone) {
      toast({
        title: "Eksik bilgi",
        description: "Lütfen kurye adı ve telefon numarası girin.",
        variant: "destructive",
      })
      return
    }

    // Rastgele bir başlangıç konumu seç
    const startLocation = DEMO_LOCATIONS.courierStarts[Math.floor(Math.random() * DEMO_LOCATIONS.courierStarts.length)]

    addCourier({
      name: courierForm.name,
      phone: courierForm.phone,
      status: "Müsait",
      vehicleType: courierForm.vehicleType,
      vehiclePlate: courierForm.vehiclePlate,
      location: startLocation,
    })

    setCourierForm({
      id: "",
      name: "",
      phone: "",
      vehicleType: "Motorsiklet",
      vehiclePlate: "",
    })

    setIsAddCourierOpen(false)
    toast({
      title: "Kurye eklendi",
      description: `${courierForm.name} başarıyla kurye listesine eklendi.`,
    })
  }

  const handleEditCourier = (courier: Courier) => {
    setCourierForm({
      id: courier.id,
      name: courier.name,
      phone: courier.phone,
      vehicleType: courier.vehicleType,
      vehiclePlate: courier.vehiclePlate || "",
    })
    setIsEditCourierOpen(true)
  }

  const handleUpdateCourier = () => {
    if (!courierForm.name || !courierForm.phone) {
      toast({
        title: "Eksik bilgi",
        description: "Lütfen kurye adı ve telefon numarası girin.",
        variant: "destructive",
      })
      return
    }

    updateCourier(courierForm.id, {
      name: courierForm.name,
      phone: courierForm.phone,
      vehicleType: courierForm.vehicleType,
      vehiclePlate: courierForm.vehiclePlate,
    })

    setIsEditCourierOpen(false)
    toast({
      title: "Kurye güncellendi",
      description: `${courierForm.name} bilgileri başarıyla güncellendi.`,
    })
  }

  const handleRemoveCourier = (id: string, name: string) => {
    try {
      removeCourier(id)
      toast({
        title: "Kurye silindi",
        description: `${name} başarıyla kurye listesinden silindi.`,
      })
    } catch (error) {
      toast({
        title: "Hata",
        description: "Aktif teslimat yapan kurye silinemez.",
        variant: "destructive",
      })
    }
  }

  const handleOpenAssignDialog = (courier: Courier) => {
    setSelectedCourier(courier)
    setSelectedOrder(null)
    setIsAssignOrderOpen(true)
  }

  const handleAssignOrder = () => {
    if (!selectedCourier || !selectedOrder) {
      toast({
        title: "Hata",
        description: "Lütfen bir sipariş seçin.",
        variant: "destructive",
      })
      return
    }

    assignOrderToCourier(selectedCourier.id, selectedOrder)
    updateDeliveryStatus(selectedOrder, "Yolda")
    setIsAssignOrderOpen(false)

    // Canlı takibi başlat
    startLiveTracking(selectedCourier.id, selectedOrder)

    // Sipariş için sabit bir müşteri konumu seç
    const customerIndex = Math.floor(Math.random() * DEMO_LOCATIONS.customers.length)
    setCustomerLocation(DEMO_LOCATIONS.customers[customerIndex])

    toast({
      title: "Sipariş atandı",
      description: `Sipariş başarıyla ${selectedCourier.name} kuryesine atandı.`,
    })
  }

  const handleViewOrder = (orderId: string) => {
    const order = getOrderById(orderId)
    if (order) {
      setViewOrderDetails(order)
      setIsViewOrderOpen(true)
    }
  }

  const handleTrackOrder = (orderId: string) => {
    router.push(`/track/${orderId}`)
  }

  const handleSendCourierLink = async (orderId: string, courierPhone: string) => {
    try {
      const deliveryLink = `${window.location.origin}/courier-delivery/${orderId}`

      // Metni panoya kopyala
      await navigator.clipboard.writeText(
        `Teslimat Onay Linki: ${deliveryLink}\n\nSipariş #${orderId.slice(-6)} için teslimat onayı yapabilirsiniz.`
      )

      toast({
        title: "Link Kopyalandı",
        description: `Teslimat linki panoya kopyalandı. Kurye ${courierPhone} numarasına WhatsApp ile gönderilebilir.`,
      })
    } catch (error) {
      // Clipboard API desteklenmiyorsa manuel olarak göster
      const deliveryLink = `${window.location.origin}/courier-delivery/${orderId}`

      toast({
        title: "Teslimat Linki",
        description: deliveryLink,
        duration: 10000, // 10 saniye göster
      })
    }
  }

  const handleViewCourierOrder = (orderId: string) => {
    const order = getOrderById(orderId)
    if (order) {
      setViewOrderDetails(order)
      setIsViewOrderOpen(true)
    }
  }

  const handleTrackDelivery = (courier: Courier) => {
    setSelectedCourier(courier)
    if (courier.currentOrderId) {
      setSelectedOrder(courier.currentOrderId)

      // Eğer canlı takip başlatılmamışsa başlat
      if (!isLiveTracking(courier.id)) {
        startLiveTracking(courier.id, courier.currentOrderId)
      }
    }
    setIsTrackingOpen(true)
  }

  const handleCompleteDelivery = async (courierId: string, orderId: string) => {
    try {
      // 1. Kuryeyi serbest bırak
      completeDelivery(courierId)

      // 2. Teslimat durumunu güncelle
      updateDeliveryStatus(orderId, "Teslim Edildi")

      // 3. Sipariş durumunu tamamlandı olarak güncelle
      await updateOrderStatus(orderId, OrderStatus.COMPLETED)

      // 4. Ödeme durumunu ödendi olarak güncelle (paket servis için nakit ödeme varsayıyoruz)
      await updatePaymentStatus(orderId, "Ödendi", "Nakit")

      toast({
        title: "Teslimat tamamlandı",
        description: "Sipariş başarıyla teslim edildi olarak işaretlendi ve ödeme tamamlandı.",
      })
    } catch (error) {
      console.error("Teslimat tamamlama hatası:", error)
      toast({
        title: "Hata",
        description: "Teslimat tamamlanırken bir hata oluştu.",
        variant: "destructive",
      })
    }
  }

  const getVehicleIcon = (type: Courier["vehicleType"]) => {
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

  // Düzeltilmiş getStatusBadge fonksiyonu
  const getStatusBadge = (status: Courier["status"]) => {
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

  return (
    <div className="flex h-screen bg-gray-100">
      {showSidebar && <SidebarNav />}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header showMobileMenu={!showSidebar} onMenuToggle={() => setShowSidebar(!showSidebar)} />
        <div className="flex-1 overflow-auto p-4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Paket Servis Yönetimi</h1>
            <Button onClick={() => setIsAddCourierOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Yeni Kurye Ekle
            </Button>
          </div>

          <Tabs defaultValue="dashboard">
            <TabsList className="mb-4">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="couriers">Kuryeler</TabsTrigger>
              <TabsTrigger value="pending-orders">Bekleyen Siparişler</TabsTrigger>
              <TabsTrigger value="active-orders">Aktif Teslimatlar</TabsTrigger>
              <TabsTrigger value="completed-orders">Tamamlanan Teslimatlar</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard">
              <CourierDashboard />
            </TabsContent>

            <TabsContent value="couriers">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {couriers.map((courier) => (
                  <Card key={courier.id}>
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
                            <Button
                              variant="link"
                              size="sm"
                              className="p-0 h-auto text-blue-600"
                              onClick={() => handleViewOrder(courier.currentOrderId!)}
                            >
                              Detayları Görüntüle
                            </Button>
                          </div>
                        )}
                        {isLiveTracking(courier.id) && (
                          <div className="flex items-center">
                            <Badge className="bg-green-100 text-green-800">
                              <LocateFixed className="h-3 w-3 mr-1" /> Canlı Takip Aktif
                            </Badge>
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="flex flex-wrap gap-2">
                      {courier.status === "Müsait" ? (
                        <Button onClick={() => handleOpenAssignDialog(courier)}>
                          <Send className="mr-2 h-4 w-4" />
                          Sipariş Ata
                        </Button>
                      ) : (
                        <>
                          <Button onClick={() => handleTrackDelivery(courier)}>
                            <LocateFixed className="mr-2 h-4 w-4" />
                            Takip Et
                          </Button>
                          {courier.currentOrderId && (
                            <Button
                              variant="outline"
                              onClick={() => handleCompleteDelivery(courier.id, courier.currentOrderId!)}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Teslim Edildi
                            </Button>
                          )}
                        </>
                      )}
                      <Button variant="outline" onClick={() => handleEditCourier(courier)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        className="text-red-500"
                        onClick={() => handleRemoveCourier(courier.id, courier.name)}
                        disabled={courier.status !== "Müsait"}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="pending-orders">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingDeliveryOrders.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <p className="text-gray-500">Bekleyen paket servis siparişi bulunmuyor.</p>
                  </div>
                ) : (
                  pendingDeliveryOrders.map((order) => (
                    <Card key={order.id}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">Sipariş #{order.id.slice(-6)}</CardTitle>
                          <Badge className="bg-yellow-100 text-yellow-800">Bekliyor</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-gray-500" />
                            <span>{formatDateTime(order.createdAt)}</span>
                          </div>
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2 text-gray-500" />
                            <span>{order.customerName || "Misafir"}</span>
                          </div>
                          {order.deliveryAddress && (
                            <div className="flex items-start">
                              <MapPin className="h-4 w-4 mr-2 text-gray-500 mt-1" />
                              <span className="text-sm">
                                {order.deliveryAddress.address || order.deliveryAddress.fullAddress}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between font-medium">
                            <span>Toplam:</span>
                            <span>{formatCurrency(order.total)}</span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="flex flex-wrap gap-2">
                        <Button onClick={() => handleViewOrder(order.id)}>
                          <Package className="mr-2 h-4 w-4" />
                          Detaylar
                        </Button>
                        <Button variant="outline" onClick={() => handleTrackOrder(order.id)}>
                          <Navigation className="mr-2 h-4 w-4" />
                          Sipariş Takibi
                        </Button>
                        {availableCouriers.length > 0 && (
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSelectedOrder(order.id)
                              setSelectedCourier(availableCouriers[0])
                              setIsAssignOrderOpen(true)
                            }}
                          >
                            <Send className="mr-2 h-4 w-4" />
                            Kurye Ata
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="active-orders">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeDeliveryOrders.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <p className="text-gray-500">Aktif teslimat bulunmuyor.</p>
                  </div>
                ) : (
                  activeDeliveryOrders.map((order) => {
                    const courier = couriers.find((c) => c.id === order.courierId)
                    return (
                      <Card key={order.id}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg">Sipariş #{order.id.slice(-6)}</CardTitle>
                            <Badge className="bg-blue-100 text-blue-800">
                              {order.deliveryStatus === "Yolda" ? "Yolda" : "Hazırlanıyor"}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <div className="space-y-2">
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-2 text-gray-500" />
                              <span>{formatDateTime(order.createdAt)}</span>
                            </div>
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-2 text-gray-500" />
                              <span>{order.customerName || "Misafir"}</span>
                            </div>
                            {courier && (
                              <div className="flex items-center">
                                <Bike className="h-4 w-4 mr-2 text-gray-500" />
                                <span>Kurye: {courier.name}</span>
                              </div>
                            )}
                            {order.deliveryAddress && (
                              <div className="flex items-start">
                                <MapPin className="h-4 w-4 mr-2 text-gray-500 mt-1" />
                                <span className="text-sm">
                                  {order.deliveryAddress.address || order.deliveryAddress.fullAddress}
                                </span>
                              </div>
                            )}
                            <div className="flex justify-between font-medium">
                              <span>Toplam:</span>
                              <span>{formatCurrency(order.total)}</span>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="flex flex-wrap gap-2">
                          <Button onClick={() => handleViewOrder(order.id)}>
                            <Package className="mr-2 h-4 w-4" />
                            Detaylar
                          </Button>
                          <Button variant="outline" onClick={() => handleTrackOrder(order.id)}>
                            <Navigation className="mr-2 h-4 w-4" />
                            Sipariş Takibi
                          </Button>
                          {courier && (
                            <Button variant="outline" onClick={() => handleTrackDelivery(courier)}>
                              <LocateFixed className="mr-2 h-4 w-4" />
                              Takip Et
                            </Button>
                          )}
                          {courier && (
                            <Button variant="outline" onClick={() => handleSendCourierLink(order.id, courier.phone)}>
                              <MessageSquare className="mr-2 h-4 w-4" />
                              Kuryeye Link Gönder
                            </Button>
                          )}
                          {courier && (
                            <Button variant="outline" onClick={() => handleCompleteDelivery(courier.id, order.id)}>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Teslim Edildi
                            </Button>
                          )}
                        </CardFooter>
                      </Card>
                    )
                  })
                )}
              </div>
            </TabsContent>

            <TabsContent value="completed-orders">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {completedDeliveryOrders.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <p className="text-gray-500">Tamamlanan teslimat bulunmuyor.</p>
                  </div>
                ) : (
                  completedDeliveryOrders.map((order) => (
                    <Card key={order.id}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">Sipariş #{order.id.slice(-6)}</CardTitle>
                          <Badge className="bg-green-100 text-green-800">Teslim Edildi</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-gray-500" />
                            <span>{formatDateTime(order.createdAt)}</span>
                          </div>
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2 text-gray-500" />
                            <span>{order.customerName || "Misafir"}</span>
                          </div>
                          {order.deliveryAddress && (
                            <div className="flex items-start">
                              <MapPin className="h-4 w-4 mr-2 text-gray-500 mt-1" />
                              <span className="text-sm">
                                {order.deliveryAddress.address || order.deliveryAddress.fullAddress}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between font-medium">
                            <span>Toplam:</span>
                            <span>{formatCurrency(order.total)}</span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="flex flex-wrap gap-2">
                        <Button variant="outline" onClick={() => handleViewOrder(order.id)}>
                          <Package className="mr-2 h-4 w-4" />
                          Detaylar
                        </Button>
                        <Button variant="outline" onClick={() => handleTrackOrder(order.id)}>
                          <Navigation className="mr-2 h-4 w-4" />
                          Sipariş Takibi
                        </Button>
                      </CardFooter>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Add Courier Dialog */}
      <Dialog open={isAddCourierOpen} onOpenChange={setIsAddCourierOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni Kurye Ekle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Kurye Adı</Label>
              <Input
                id="name"
                value={courierForm.name}
                onChange={(e) => setCourierForm({ ...courierForm, name: e.target.value })}
                placeholder="Kurye adını girin"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                value={courierForm.phone}
                onChange={(e) => setCourierForm({ ...courierForm, phone: e.target.value })}
                placeholder="Telefon numarasını girin"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicleType">Araç Tipi</Label>
              <Select
                value={courierForm.vehicleType}
                onValueChange={(value) =>
                  setCourierForm({ ...courierForm, vehicleType: value as Courier["vehicleType"] })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Araç tipi seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Motorsiklet">Motorsiklet</SelectItem>
                  <SelectItem value="Araba">Araba</SelectItem>
                  <SelectItem value="Bisiklet">Bisiklet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehiclePlate">Plaka (Opsiyonel)</Label>
              <Input
                id="vehiclePlate"
                value={courierForm.vehiclePlate}
                onChange={(e) => setCourierForm({ ...courierForm, vehiclePlate: e.target.value })}
                placeholder="Araç plakasını girin"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddCourierOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleAddCourier}>Kurye Ekle</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Courier Dialog */}
      <Dialog open={isEditCourierOpen} onOpenChange={setIsEditCourierOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kurye Düzenle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Kurye Adı</Label>
              <Input
                id="edit-name"
                value={courierForm.name}
                onChange={(e) => setCourierForm({ ...courierForm, name: e.target.value })}
                placeholder="Kurye adını girin"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Telefon</Label>
              <Input
                id="edit-phone"
                value={courierForm.phone}
                onChange={(e) => setCourierForm({ ...courierForm, phone: e.target.value })}
                placeholder="Telefon numarasını girin"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-vehicleType">Araç Tipi</Label>
              <Select
                value={courierForm.vehicleType}
                onValueChange={(value) =>
                  setCourierForm({ ...courierForm, vehicleType: value as Courier["vehicleType"] })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Araç tipi seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Motorsiklet">Motorsiklet</SelectItem>
                  <SelectItem value="Araba">Araba</SelectItem>
                  <SelectItem value="Bisiklet">Bisiklet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-vehiclePlate">Plaka (Opsiyonel)</Label>
              <Input
                id="edit-vehiclePlate"
                value={courierForm.vehiclePlate}
                onChange={(e) => setCourierForm({ ...courierForm, vehiclePlate: e.target.value })}
                placeholder="Araç plakasını girin"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditCourierOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleUpdateCourier}>Güncelle</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Order Dialog */}
      <Dialog open={isAssignOrderOpen} onOpenChange={setIsAssignOrderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sipariş Ata</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Kurye</Label>
              <Select
                value={selectedCourier?.id}
                onValueChange={(value) => setSelectedCourier(couriers.find((c) => c.id === value) || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Kurye seçin" />
                </SelectTrigger>
                <SelectContent>
                  {availableCouriers.map((courier) => (
                    <SelectItem key={courier.id} value={courier.id}>
                      {courier.name} ({courier.vehicleType})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Sipariş</Label>
              <Select value={selectedOrder || ""} onValueChange={setSelectedOrder}>
                <SelectTrigger>
                  <SelectValue placeholder="Sipariş seçin" />
                </SelectTrigger>
                <SelectContent>
                  {pendingDeliveryOrders.map((order) => (
                    <SelectItem key={order.id} value={order.id}>
                      #{order.id.slice(-6)} - {order.customerName || "Misafir"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedOrder && (
              <div className="p-3 bg-gray-50 rounded-md">
                <h4 className="font-medium mb-2">Sipariş Detayları</h4>
                {(() => {
                  const order = getOrderById(selectedOrder)
                  if (!order) return null
                  return (
                    <div className="space-y-1 text-sm">
                      <p>
                        <span className="font-medium">Müşteri:</span> {order.customerName || "Misafir"}
                      </p>
                      {order.deliveryAddress && (
                        <p>
                          <span className="font-medium">Adres:</span>{" "}
                          {order.deliveryAddress.address || order.deliveryAddress.fullAddress}
                        </p>
                      )}
                      <p>
                        <span className="font-medium">Toplam:</span> {formatCurrency(order.total)}
                      </p>
                    </div>
                  )
                })()}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignOrderOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleAssignOrder}>Sipariş Ata</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tracking Dialog */}
      <Dialog open={isTrackingOpen} onOpenChange={setIsTrackingOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Teslimat Takibi</DialogTitle>
          </DialogHeader>
          <div className="h-[500px] overflow-auto">
            {selectedCourier && selectedOrder && (
              <RealTimeTrackingMap
                orderId={selectedOrder}
                courierLocation={selectedCourier.location || DEMO_LOCATIONS.restaurant}
                customerLocation={{
                  ...customerLocation,
                  address: customerLocation.address || "Teslimat Adresi",
                }}
                courierInfo={{
                  name: selectedCourier.name,
                  phone: selectedCourier.phone,
                  vehicleType: selectedCourier.vehicleType,
                  vehiclePlate: selectedCourier.vehiclePlate,
                }}
                orderStatus={getOrderById(selectedOrder)?.deliveryStatus || "delivering"}
              />
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsTrackingOpen(false)}>Kapat</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sipariş Detayları Dialog */}
      <CourierOrderDetails
        order={viewOrderDetails}
        isOpen={isViewOrderOpen}
        onClose={() => {
          setIsViewOrderOpen(false)
          setViewOrderDetails(null)
        }}
      />
    </div>
  )
}
