"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { SidebarNav } from "@/components/sidebar-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useOrderContext } from "@/context/order-context"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { formatCurrency, formatDateTime } from "@/lib/utils"
import { OrderStatus, PaymentStatus } from "@/lib/types"
import { CheckCircle, Clock, XCircle, AlertTriangle, CreditCard, Printer, Search, Package } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ReceiptPrinter } from "@/components/receipt-printer"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function OrdersPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const { orders, updateOrderStatus, updatePaymentStatus } = useOrderContext()
  const [showSidebar, setShowSidebar] = useState(true)
  const [orderFilter, setOrderFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [currentOrder, setCurrentOrder] = useState<any>(null)
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false)
  const [isViewOrderDialogOpen, setIsViewOrderDialogOpen] = useState(false)

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

      // Close dialog if it's open
      if (isViewOrderDialogOpen) {
        setIsViewOrderDialogOpen(false)
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Sipariş durumu güncellenirken bir hata oluştu.",
        variant: "destructive",
      })
    }
  }

  const handlePaymentStatusChange = async (
    orderId: string,
    status: "Beklemede" | "Ödendi",
    method?: "Nakit" | "Kredi Kartı" | "Online",
  ) => {
    try {
      await updatePaymentStatus(orderId, status, method)
      toast({
        title: "Ödeme durumu güncellendi",
        description: `Ödeme durumu "${status}" olarak güncellendi.`,
      })
    } catch (error) {
      toast({
        title: "Hata",
        description: "Ödeme durumu güncellenirken bir hata oluştu.",
        variant: "destructive",
      })
    }
  }

  const handlePrintReceipt = (order: any) => {
    setCurrentOrder(order)
    setIsReceiptDialogOpen(true)
  }

  const handleViewOrderDetails = (order: any) => {
    setCurrentOrder(order)
    setIsViewOrderDialogOpen(true)
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
      case OrderStatus.COMPLETED:
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            <CheckCircle className="mr-1 h-3 w-3" /> Tamamlandı
          </Badge>
        )
      case OrderStatus.CANCELLED:
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <XCircle className="mr-1 h-3 w-3" /> İptal Edildi
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case PaymentStatus.PENDING:
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <AlertTriangle className="mr-1 h-3 w-3" /> Ödeme Bekliyor
          </Badge>
        )
      case PaymentStatus.PAID:
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CreditCard className="mr-1 h-3 w-3" /> Ödendi
          </Badge>
        )
      case PaymentStatus.PARTIAL:
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <CreditCard className="mr-1 h-3 w-3" /> Kısmi Ödendi
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const filteredOrders = orders.filter((order) => {
    // Status filter
    if (statusFilter !== "all" && order.status !== statusFilter) {
      return false
    }

    // Text search - check ID, table name, customer name
    if (orderFilter) {
      const searchLower = orderFilter.toLowerCase()
      return (
        order.id.toLowerCase().includes(searchLower) ||
        (order.tableName && order.tableName.toLowerCase().includes(searchLower)) ||
        (order.customerName && order.customerName.toLowerCase().includes(searchLower))
      )
    }

    return true
  })

  return (
    <div className="flex h-screen bg-gray-100">
      {showSidebar && <SidebarNav />}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header showMobileMenu={!showSidebar} onMenuToggle={() => setShowSidebar(!showSidebar)} />
        <div className="flex-1 overflow-auto p-4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Siparişler</h1>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Sipariş ara..."
                className="pl-8"
                value={orderFilter}
                onChange={(e) => setOrderFilter(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Durum filtresi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Siparişler</SelectItem>
                <SelectItem value="Beklemede">Beklemede</SelectItem>
                <SelectItem value="Hazırlanıyor">Hazırlanıyor</SelectItem>
                <SelectItem value="Hazır">Hazır</SelectItem>
                <SelectItem value="Tamamlandı">Tamamlandı</SelectItem>
                <SelectItem value="İptal Edildi">İptal Edildi</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">Tüm Siparişler</TabsTrigger>
              <TabsTrigger value="pending">Bekleyen</TabsTrigger>
              <TabsTrigger value="preparing">Hazırlanıyor</TabsTrigger>
              <TabsTrigger value="ready">Hazır</TabsTrigger>
              <TabsTrigger value="completed">Tamamlanan</TabsTrigger>
              <TabsTrigger value="cancelled">İptal Edilen</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredOrders.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <p className="text-gray-500">Siparişler bulunamadı.</p>
                  </div>
                ) : (
                  filteredOrders.map((order) => (
                    <Card key={order.id}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">Sipariş #{order.id.slice(-6)}</CardTitle>
                            <p className="text-sm text-gray-500">{formatDateTime(order.createdAt)}</p>
                          </div>
                          {getStatusBadge(order.status)}
                        </div>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="space-y-2">
                          {order.tableName && (
                            <p className="text-sm">
                              <span className="font-medium">Masa:</span> {order.tableName}
                            </p>
                          )}
                          {order.customerName && (
                            <p className="text-sm">
                              <span className="font-medium">Müşteri:</span> {order.customerName}
                            </p>
                          )}
                          <div className="border-t pt-2 mt-2">
                            <p className="font-medium mb-1">Ürünler:</p>
                            <ul className="space-y-1">
                              {order.items.slice(0, 3).map((item) => (
                                <li key={item.id} className="text-sm">
                                  {item.quantity}x {item.foodItem.title} -{" "}
                                  {formatCurrency(item.foodItem.price * item.quantity)}
                                </li>
                              ))}
                              {order.items.length > 3 && (
                                <li className="text-sm text-gray-500">+ {order.items.length - 3} ürün daha</li>
                              )}
                            </ul>
                          </div>
                          <div className="flex justify-between pt-2 border-t">
                            <span className="font-medium">Toplam:</span>
                            <span className="font-bold">{formatCurrency(order.total)}</span>
                          </div>
                          <div className="pt-1">
                            {getPaymentStatusBadge(order.paymentStatus)}
                            {order.paymentMethod && (
                              <span className="text-xs ml-2 text-gray-500">({order.paymentMethod})</span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleViewOrderDetails(order)}>
                          <Package className="mr-1 h-4 w-4" />
                          Detaylar
                        </Button>
                        {order.status !== OrderStatus.COMPLETED && order.status !== OrderStatus.CANCELLED && (
                          <>
                            {(order.status === OrderStatus.PENDING_CONFIRMATION || order.status === OrderStatus.CONFIRMED || order.status === OrderStatus.PAID) && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusChange(order.id, OrderStatus.PREPARING)}
                              >
                                Hazırlanıyor
                              </Button>
                            )}
                            {order.status === OrderStatus.PREPARING && (
                              <Button size="sm" variant="outline" onClick={() => handleStatusChange(order.id, OrderStatus.READY_FOR_SERVICE)}>
                                Hazır
                              </Button>
                            )}
                            {order.status === OrderStatus.READY_FOR_SERVICE && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusChange(order.id, OrderStatus.COMPLETED)}
                              >
                                Teslim Et
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-500"
                              onClick={() => handleStatusChange(order.id, OrderStatus.CANCELLED)}
                            >
                              İptal Et
                            </Button>
                          </>
                        )}
                        {order.paymentStatus === "Beklemede" && order.status !== "İptal Edildi" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePaymentStatusChange(order.id, "Ödendi", "Nakit")}
                          >
                            <CreditCard className="mr-1 h-4 w-4" />
                            Ödendi İşaretle
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => handlePrintReceipt(order)}>
                          <Printer className="mr-1 h-4 w-4" />
                          Fiş Yazdır
                        </Button>
                      </CardFooter>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="pending">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredOrders.filter((order) => order.status === "Beklemede").length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <p className="text-gray-500">Bekleyen sipariş bulunmuyor.</p>
                  </div>
                ) : (
                  filteredOrders
                    .filter((order) => order.status === "Beklemede")
                    .map((order) => (
                      <Card key={order.id}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg">Sipariş #{order.id.slice(-6)}</CardTitle>
                              <p className="text-sm text-gray-500">{formatDateTime(order.createdAt)}</p>
                            </div>
                            {getStatusBadge(order.status)}
                          </div>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <div className="space-y-2">
                            {order.tableName && (
                              <p className="text-sm">
                                <span className="font-medium">Masa:</span> {order.tableName}
                              </p>
                            )}
                            {order.customerName && (
                              <p className="text-sm">
                                <span className="font-medium">Müşteri:</span> {order.customerName}
                              </p>
                            )}
                            <div className="border-t pt-2 mt-2">
                              <p className="font-medium mb-1">Ürünler:</p>
                              <ul className="space-y-1">
                                {order.items.slice(0, 3).map((item) => (
                                  <li key={item.id} className="text-sm">
                                    {item.quantity}x {item.foodItem.title} -{" "}
                                    {formatCurrency(item.foodItem.price * item.quantity)}
                                  </li>
                                ))}
                                {order.items.length > 3 && (
                                  <li className="text-sm text-gray-500">+ {order.items.length - 3} ürün daha</li>
                                )}
                              </ul>
                            </div>
                            <div className="flex justify-between pt-2 border-t">
                              <span className="font-medium">Toplam:</span>
                              <span className="font-bold">{formatCurrency(order.total)}</span>
                            </div>
                            <div className="pt-1">
                              {getPaymentStatusBadge(order.paymentStatus)}
                              {order.paymentMethod && (
                                <span className="text-xs ml-2 text-gray-500">({order.paymentMethod})</span>
                              )}
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleViewOrderDetails(order)}>
                            <Package className="mr-1 h-4 w-4" />
                            Detaylar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(order.id, "Hazırlanıyor")}
                          >
                            Hazırlanıyor
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-500"
                            onClick={() => handleStatusChange(order.id, "İptal Edildi")}
                          >
                            İptal Et
                          </Button>
                        </CardFooter>
                      </Card>
                    ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="preparing">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredOrders.filter((order) => order.status === OrderStatus.PREPARING).length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <p className="text-gray-500">Hazırlanan sipariş bulunmuyor.</p>
                  </div>
                ) : (
                  filteredOrders
                    .filter((order) => order.status === OrderStatus.PREPARING)
                    .map((order) => (
                      <Card key={order.id}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg">Sipariş #{order.id.slice(-6)}</CardTitle>
                              <p className="text-sm text-gray-500">{formatDateTime(order.createdAt)}</p>
                            </div>
                            {getStatusBadge(order.status)}
                          </div>
                        </CardHeader>
                        <CardContent className="pb-2">{/* Kart içeriği aynı kalacak */}</CardContent>
                        <CardFooter className="flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleViewOrderDetails(order)}>
                            <Package className="mr-1 h-4 w-4" />
                            Detaylar
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleStatusChange(order.id, "Hazır")}>
                            Hazır
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-500"
                            onClick={() => handleStatusChange(order.id, "İptal Edildi")}
                          >
                            İptal Et
                          </Button>
                        </CardFooter>
                      </Card>
                    ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="ready">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredOrders.filter((order) => order.status === OrderStatus.READY_FOR_SERVICE).length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <p className="text-gray-500">Hazır sipariş bulunmuyor.</p>
                  </div>
                ) : (
                  filteredOrders
                    .filter((order) => order.status === OrderStatus.READY_FOR_SERVICE)
                    .map((order) => (
                      <Card key={order.id}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg">Sipariş #{order.id.slice(-6)}</CardTitle>
                              <p className="text-sm text-gray-500">{formatDateTime(order.createdAt)}</p>
                            </div>
                            {getStatusBadge(order.status)}
                          </div>
                        </CardHeader>
                        <CardContent className="pb-2">{/* Kart içeriği aynı kalacak */}</CardContent>
                        <CardFooter className="flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleViewOrderDetails(order)}>
                            <Package className="mr-1 h-4 w-4" />
                            Detaylar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(order.id, "Tamamlandı")}
                          >
                            Tamamlandı
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-500"
                            onClick={() => handleStatusChange(order.id, "İptal Edildi")}
                          >
                            İptal Et
                          </Button>
                        </CardFooter>
                      </Card>
                    ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="completed">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredOrders.filter((order) => order.status === "Tamamlandı").length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <p className="text-gray-500">Tamamlanan sipariş bulunmuyor.</p>
                  </div>
                ) : (
                  filteredOrders
                    .filter((order) => order.status === "Tamamlandı")
                    .map((order) => (
                      <Card key={order.id}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg">Sipariş #{order.id.slice(-6)}</CardTitle>
                              <p className="text-sm text-gray-500">{formatDateTime(order.createdAt)}</p>
                            </div>
                            {getStatusBadge(order.status)}
                          </div>
                        </CardHeader>
                        <CardContent className="pb-2">{/* Kart içeriği aynı kalacak */}</CardContent>
                        <CardFooter className="flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleViewOrderDetails(order)}>
                            <Package className="mr-1 h-4 w-4" />
                            Detaylar
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handlePrintReceipt(order)}>
                            <Printer className="mr-1 h-4 w-4" />
                            Fiş Yazdır
                          </Button>
                        </CardFooter>
                      </Card>
                    ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="cancelled">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredOrders.filter((order) => order.status === "İptal Edildi").length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <p className="text-gray-500">İptal edilen sipariş bulunmuyor.</p>
                  </div>
                ) : (
                  filteredOrders
                    .filter((order) => order.status === "İptal Edildi")
                    .map((order) => (
                      <Card key={order.id}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg">Sipariş #{order.id.slice(-6)}</CardTitle>
                              <p className="text-sm text-gray-500">{formatDateTime(order.createdAt)}</p>
                            </div>
                            {getStatusBadge(order.status)}
                          </div>
                        </CardHeader>
                        <CardContent className="pb-2">{/* Kart içeriği aynı kalacak */}</CardContent>
                        <CardFooter className="flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleViewOrderDetails(order)}>
                            <Package className="mr-1 h-4 w-4" />
                            Detaylar
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

      {/* Order Details Dialog */}
      <Dialog open={isViewOrderDialogOpen} onOpenChange={setIsViewOrderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sipariş Detayları</DialogTitle>
          </DialogHeader>
          {currentOrder && (
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">Sipariş #{currentOrder.id.slice(-6)}</h3>
                  <p className="text-sm text-gray-500">{formatDateTime(currentOrder.createdAt)}</p>
                </div>
                {getStatusBadge(currentOrder.status)}
              </div>

              <div>
                <p className="font-medium">Sipariş Bilgileri</p>
                {currentOrder.tableName && <p className="text-sm">Masa: {currentOrder.tableName}</p>}
                {currentOrder.customerName && <p className="text-sm">Müşteri: {currentOrder.customerName}</p>}
                <div className="text-sm">{getPaymentStatusBadge(currentOrder.paymentStatus)}</div>
                {currentOrder.paymentMethod && <p className="text-sm">Ödeme Yöntemi: {currentOrder.paymentMethod}</p>}
              </div>

              <div>
                <p className="font-medium">Sipariş Öğeleri</p>
                <div className="mt-2 space-y-2">
                  {currentOrder.items.map((item: any) => (
                    <div key={item.id} className="flex justify-between">
                      <span>
                        {item.quantity}x {item.foodItem.title}
                      </span>
                      <span>{formatCurrency(item.foodItem.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t mt-2 pt-2 flex justify-between font-medium">
                  <span>Toplam:</span>
                  <span>{formatCurrency(currentOrder.total)}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex flex-wrap gap-2">
            {currentOrder && currentOrder.status !== OrderStatus.COMPLETED && currentOrder.status !== OrderStatus.CANCELLED && (
              <>
                {(currentOrder.status === OrderStatus.PENDING_CONFIRMATION || currentOrder.status === OrderStatus.CONFIRMED || currentOrder.status === OrderStatus.PAID) && (
                  <Button size="sm" onClick={() => handleStatusChange(currentOrder.id, OrderStatus.PREPARING)}>
                    Hazırlanıyor
                  </Button>
                )}
                {currentOrder.status === OrderStatus.PREPARING && (
                  <Button size="sm" onClick={() => handleStatusChange(currentOrder.id, OrderStatus.READY_FOR_SERVICE)}>
                    Hazır
                  </Button>
                )}
                {currentOrder.status === OrderStatus.READY_FOR_SERVICE && (
                  <Button size="sm" onClick={() => handleStatusChange(currentOrder.id, OrderStatus.COMPLETED)}>
                    Teslim Et
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-500"
                  onClick={() => handleStatusChange(currentOrder.id, OrderStatus.CANCELLED)}
                >
                  İptal Et
                </Button>
              </>
            )}
            {currentOrder && currentOrder.paymentStatus === "Beklemede" && currentOrder.status !== "İptal Edildi" && (
              <Button size="sm" onClick={() => handlePaymentStatusChange(currentOrder.id, "Ödendi", "Nakit")}>
                <CreditCard className="mr-1 h-4 w-4" />
                Ödendi İşaretle
              </Button>
            )}
            <Button size="sm" onClick={() => handlePrintReceipt(currentOrder)}>
              <Printer className="mr-1 h-4 w-4" />
              Fiş Yazdır
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Printer */}
      <ReceiptPrinter open={isReceiptDialogOpen} onOpenChange={setIsReceiptDialogOpen} order={currentOrder} />
    </div>
  )
}
