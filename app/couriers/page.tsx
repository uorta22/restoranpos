"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { SidebarNav } from "@/components/sidebar-nav"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { EmptyState } from "@/components/empty-state"
import { Plus, Truck, Phone, MapPin, Clock, Award } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Edit, Trash2, UserPlus } from "lucide-react"
import { couriersApi, ordersApi } from "@/lib/api"
import type { Courier, Order } from "@/lib/types"

export default function CouriersPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [showSidebar, setShowSidebar] = useState(true)
  const [couriers, setCouriers] = useState<Courier[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [isAddCourierOpen, setIsAddCourierOpen] = useState(false)
  const [isEditCourierOpen, setIsEditCourierOpen] = useState(false)
  const [currentCourier, setCurrentCourier] = useState<Courier | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filter, setFilter] = useState<"all" | "available" | "busy">("all")
  const [loadingData, setLoadingData] = useState(true)
  const [courierForm, setCourierForm] = useState({
    name: "",
    phone: "",
    vehicleType: "Motorsiklet" as "Motorsiklet" | "Araba" | "Bisiklet",
    vehiclePlate: "",
  })
  const { toast } = useToast()

  useEffect(() => {
    const handleResize = () => {
      setShowSidebar(window.innerWidth >= 768)
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  useEffect(() => {
    const loadData = async () => {
      if (!user) return

      try {
        setLoadingData(true)
        const [couriersData, ordersData] = await Promise.all([
          couriersApi.getAll(user.restaurant_id || ""),
          ordersApi.getAll(),
        ])

        setCouriers(couriersData)
        setOrders(ordersData.filter(order => order.isDelivery))
      } catch (error) {
        console.error("Failed to load couriers data:", error)
        toast({
          title: "Hata",
          description: "Kurye verileri yüklenirken bir hata oluştu.",
          variant: "destructive",
        })
      } finally {
        setLoadingData(false)
      }
    }

    if (!isLoading) {
      loadData()
    }
  }, [user, isLoading, toast])

  if (isLoading || loadingData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const handleAddFirstCourier = () => {
    setIsAddCourierOpen(true)
  }

  const handleAddCourier = async () => {
    if (!courierForm.name || !courierForm.phone) {
      toast({
        title: "Eksik bilgi",
        description: "Lütfen tüm zorunlu alanları doldurun.",
        variant: "destructive",
      })
      return
    }

    try {
      const result = await couriersApi.create({
        ...courierForm,
        restaurant_id: user.restaurant_id || "",
      })

      if (result) {
        setCouriers([...couriers, result])
        setIsAddCourierOpen(false)

        setCourierForm({
          name: "",
          phone: "",
          vehicleType: "Motorsiklet",
          vehiclePlate: "",
        })

        toast({
          title: "Kurye eklendi",
          description: `${courierForm.name} başarıyla eklendi.`,
        })
      } else {
        toast({
          title: "Hata",
          description: "Kurye eklenirken bir hata oluştu.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Kurye eklenirken bir hata oluştu.",
        variant: "destructive",
      })
    }
  }

  const handleEditCourier = (courier: Courier) => {
    setCurrentCourier(courier)
    setCourierForm({
      name: courier.name,
      phone: courier.phone,
      vehicleType: courier.vehicleType,
      vehiclePlate: courier.vehiclePlate || "",
    })
    setIsEditCourierOpen(true)
  }

  const handleUpdateCourier = async () => {
    if (!currentCourier) return

    try {
      const result = await couriersApi.update(
        currentCourier.id,
        courierForm,
        user.restaurant_id || "",
      )

      if (result) {
        const updatedCouriers = couriers.map((c) =>
          c.id === currentCourier.id ? result : c
        )

        setCouriers(updatedCouriers)
        setIsEditCourierOpen(false)

        toast({
          title: "Kurye güncellendi",
          description: `${courierForm.name} başarıyla güncellendi.`,
        })
      } else {
        toast({
          title: "Hata",
          description: "Kurye güncellenirken bir hata oluştu.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Kurye güncellenirken bir hata oluştu.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteCourier = async (id: string, name: string) => {
    try {
      const success = await couriersApi.delete(id, user.restaurant_id || "")

      if (success) {
        setCouriers(couriers.filter((c) => c.id !== id))

        toast({
          title: "Kurye silindi",
          description: `${name} başarıyla silindi.`,
        })
      } else {
        toast({
          title: "Hata",
          description: "Kurye aktif teslimatları olduğu için silinemez.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Kurye silinirken bir hata oluştu.",
        variant: "destructive",
      })
    }
  }

  const handleAssignOrder = async (courierId: string, orderId: string) => {
    try {
      const success = await couriersApi.assignOrder(courierId, orderId, user.restaurant_id || "")

      if (success) {
        // Refresh data
        const [couriersData, ordersData] = await Promise.all([
          couriersApi.getAll(user.restaurant_id || ""),
          ordersApi.getAll(),
        ])

        setCouriers(couriersData)
        setOrders(ordersData.filter(order => order.isDelivery))

        toast({
          title: "Sipariş atandı",
          description: "Sipariş kuryeye başarıyla atandı.",
        })
      } else {
        toast({
          title: "Hata",
          description: "Sipariş atanırken bir hata oluştu.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Sipariş atanırken bir hata oluştu.",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: Courier["status"]) => {
    switch (status) {
      case "Müsait":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Müsait</Badge>
      case "Siparişte":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Siparişte</Badge>
      case "Teslimatta":
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Teslimatta</Badge>
      default:
        return <Badge variant="secondary">Bilinmiyor</Badge>
    }
  }

  const getVehicleIcon = (vehicleType: Courier["vehicleType"]) => {
    switch (vehicleType) {
      case "Motorsiklet":
        return "🏍️"
      case "Araba":
        return "🚗"
      case "Bisiklet":
        return "🚲"
      default:
        return "🚗"
    }
  }

  const filteredCouriers = couriers.filter((courier) => {
    const matchesSearch =
      courier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      courier.phone.includes(searchQuery) ||
      courier.vehicleType.toLowerCase().includes(searchQuery.toLowerCase())

    if (filter === "available") {
      return matchesSearch && courier.status === "Müsait"
    }
    if (filter === "busy") {
      return matchesSearch && courier.status !== "Müsait"
    }
    return matchesSearch
  })

  const availableCouriers = couriers.filter(c => c.status === "Müsait")
  const busyCouriers = couriers.filter(c => c.status !== "Müsait")
  const pendingOrders = orders.filter(o => o.deliveryStatus === "Beklemede")

  return (
    <div className="flex h-screen bg-gray-100">
      {showSidebar && <SidebarNav />}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          showMobileMenu={!showSidebar}
          onMenuToggle={() => setShowSidebar(!showSidebar)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
        <div className="flex-1 overflow-auto p-4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Kurye Yönetimi</h1>
            <Button onClick={handleAddFirstCourier}>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Kurye
            </Button>
          </div>

          {/* Özet Kartları */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Toplam Kurye</CardTitle>
                <Truck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{couriers.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Müsait Kurye</CardTitle>
                <Award className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{availableCouriers.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Aktif Teslimat</CardTitle>
                <Clock className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{busyCouriers.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bekleyen Sipariş</CardTitle>
                <MapPin className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{pendingOrders.length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filtreler */}
          <div className="flex gap-2 mb-6">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              onClick={() => setFilter("all")}
              size="sm"
            >
              Tümü
            </Button>
            <Button
              variant={filter === "available" ? "default" : "outline"}
              onClick={() => setFilter("available")}
              size="sm"
            >
              Müsait
            </Button>
            <Button
              variant={filter === "busy" ? "default" : "outline"}
              onClick={() => setFilter("busy")}
              size="sm"
            >
              Meşgul
            </Button>
          </div>

          {couriers.length === 0 ? (
            <EmptyState
              type="couriers"
              title="Henüz kurye yok"
              description="Teslimat hizmetini başlatmak için kurye eklemeye başlayın."
              onAction={handleAddFirstCourier}
              actionLabel="İlk Kuryeyi Ekle"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCouriers.map((courier) => {
                const currentOrder = orders.find(o => o.id === courier.currentOrderId)

                return (
                  <Card key={courier.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <span>{getVehicleIcon(courier.vehicleType)}</span>
                          {courier.name}
                        </CardTitle>
                        {getStatusBadge(courier.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="flex items-center space-x-4 mb-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={courier.avatar} alt={courier.name} />
                          <AvatarFallback>{courier.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {courier.phone}
                          </p>
                          <p className="text-xs text-gray-500">
                            {courier.vehicleType} {courier.vehiclePlate && `- ${courier.vehiclePlate}`}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Toplam Teslimat:</span>
                          <span className="font-semibold">{courier.totalDeliveries}</span>
                        </div>

                        {currentOrder && (
                          <div className="bg-blue-50 p-2 rounded">
                            <p className="text-xs font-medium text-blue-800">Aktif Sipariş:</p>
                            <p className="text-xs text-blue-600">#{currentOrder.id.slice(-6)}</p>
                          </div>
                        )}

                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Aktif Süre:</span>
                          <span className="text-xs">
                            {new Date(courier.activeFrom).toLocaleDateString("tr-TR")}
                          </span>
                        </div>
                      </div>
                    </CardContent>

                    <CardFooter className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditCourier(courier)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteCourier(courier.id, courier.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>

                      {courier.status === "Müsait" && pendingOrders.length > 0 && (
                        <select
                          className="text-xs p-1 border rounded flex-1"
                          onChange={(e) => {
                            if (e.target.value) {
                              handleAssignOrder(courier.id, e.target.value)
                              e.target.value = ""
                            }
                          }}
                        >
                          <option value="">Sipariş Ata</option>
                          {pendingOrders.map((order) => (
                            <option key={order.id} value={order.id}>
                              #{order.id.slice(-6)} - ₺{order.total}
                            </option>
                          ))}
                        </select>
                      )}
                    </CardFooter>
                  </Card>
                )
              })}
            </div>
          )}
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
              <Label htmlFor="name" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Kurye Adı
              </Label>
              <Input
                id="name"
                value={courierForm.name}
                onChange={(e) => setCourierForm({ ...courierForm, name: e.target.value })}
                placeholder="Kurye adını girin"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Telefon
              </Label>
              <Input
                id="phone"
                value={courierForm.phone}
                onChange={(e) => setCourierForm({ ...courierForm, phone: e.target.value })}
                placeholder="Telefon numarasını girin"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicleType" className="flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Araç Tipi
              </Label>
              <Select
                value={courierForm.vehicleType}
                onValueChange={(value) => setCourierForm({ ...courierForm, vehicleType: value as "Motorsiklet" | "Araba" | "Bisiklet" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Araç tipi seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Motorsiklet">🏍️ Motorsiklet</SelectItem>
                  <SelectItem value="Araba">🚗 Araba</SelectItem>
                  <SelectItem value="Bisiklet">🚲 Bisiklet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehiclePlate">Araç Plakası (İsteğe bağlı)</Label>
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
              <Label htmlFor="edit-name" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Kurye Adı
              </Label>
              <Input
                id="edit-name"
                value={courierForm.name}
                onChange={(e) => setCourierForm({ ...courierForm, name: e.target.value })}
                placeholder="Kurye adını girin"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Telefon
              </Label>
              <Input
                id="edit-phone"
                value={courierForm.phone}
                onChange={(e) => setCourierForm({ ...courierForm, phone: e.target.value })}
                placeholder="Telefon numarasını girin"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-vehicleType" className="flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Araç Tipi
              </Label>
              <Select
                value={courierForm.vehicleType}
                onValueChange={(value) => setCourierForm({ ...courierForm, vehicleType: value as "Motorsiklet" | "Araba" | "Bisiklet" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Araç tipi seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Motorsiklet">🏍️ Motorsiklet</SelectItem>
                  <SelectItem value="Araba">🚗 Araba</SelectItem>
                  <SelectItem value="Bisiklet">🚲 Bisiklet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-vehiclePlate">Araç Plakası (İsteğe bağlı)</Label>
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
            <Button onClick={handleUpdateCourier}>Değişiklikleri Kaydet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}