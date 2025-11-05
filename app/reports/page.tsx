"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { SidebarNav } from "@/components/sidebar-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { EmptyState } from "@/components/empty-state"
import { useOrderContext } from "@/context/order-context"
import { formatCurrency } from "@/lib/utils"
import { TrendingUp, DollarSign, ShoppingBag, Users, Clock, Calendar, Package, Truck, Star, Download, FileText, Printer, RefreshCw } from "lucide-react"
import { analyticsApi, ordersApi, inventoryApi, couriersApi } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

export default function ReportsPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const { orders } = useOrderContext()
  const { toast } = useToast()
  const [showSidebar, setShowSidebar] = useState(true)
  const [dateRange, setDateRange] = useState("today")
  const [analytics, setAnalytics] = useState<any>(null)
  const [inventory, setInventory] = useState<any[]>([])
  const [couriers, setCouriers] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(true)

  // Responsive sidebar kontrolü
  useEffect(() => {
    const handleResize = () => {
      setShowSidebar(window.innerWidth >= 768)
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  useEffect(() => {
    const loadReportData = async () => {
      if (!user) return

      try {
        setLoadingData(true)
        const [analyticsData, inventoryData, couriersData] = await Promise.all([
          analyticsApi.getDashboardStats(),
          inventoryApi.getAll(),
          couriersApi.getAll(user.restaurant_id || ""),
        ])

        setAnalytics(analyticsData)
        setInventory(inventoryData)
        setCouriers(couriersData)
      } catch (error) {
        console.error("Failed to load report data:", error)
      } finally {
        setLoadingData(false)
      }
    }

    if (!isLoading) {
      loadReportData()
    }
  }, [user, isLoading])

  if (isLoading || loadingData) {
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

  const handleCreateFirstOrder = () => {
    router.push("/")
  }

  const handleExportReport = () => {
    try {
      const reportData = {
        dateRange,
        totalRevenue,
        totalOrders,
        completedOrders,
        averageOrderValue,
        topProducts: topProducts.slice(0, 10),
        lowStockItems,
        couriers: couriers.map(c => ({
          name: c.name,
          status: c.status,
          deliveries: c.totalDeliveries || 0
        })),
        generatedAt: new Date().toISOString()
      }

      const dataStr = JSON.stringify(reportData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `restaurant-report-${new Date().toISOString().split('T')[0]}.json`
      link.click()
      URL.revokeObjectURL(url)

      toast({
        title: "Rapor dışa aktarıldı",
        description: "Rapor dosyası başarıyla indirildi.",
      })
    } catch (error) {
      toast({
        title: "Hata",
        description: "Rapor dışa aktarılırken bir hata oluştu.",
        variant: "destructive",
      })
    }
  }

  const handlePrintReport = () => {
    window.print()
    toast({
      title: "Yazdırma",
      description: "Yazdırma penceresi açıldı.",
    })
  }

  const handleRefreshData = async () => {
    try {
      setLoadingData(true)
      const [analyticsData, inventoryData, couriersData] = await Promise.all([
        analyticsApi.getDashboardStats(),
        inventoryApi.getAll(),
        couriersApi.getAll(user?.restaurant_id || ""),
      ])

      setAnalytics(analyticsData)
      setInventory(inventoryData)
      setCouriers(couriersData)

      toast({
        title: "Veriler güncellendi",
        description: "Rapor verileri başarıyla yenilendi.",
      })
    } catch (error) {
      toast({
        title: "Hata",
        description: "Veriler güncellenirken bir hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setLoadingData(false)
    }
  }

  // Sipariş yoksa boş durum göster
  if (orders.length === 0) {
    return (
      <div className="flex h-screen bg-gray-100">
        {showSidebar && <SidebarNav />}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header showMobileMenu={!showSidebar} onMenuToggle={() => setShowSidebar(!showSidebar)} />
          <div className="flex-1 flex items-center justify-center p-4">
            <EmptyState
              type="orders"
              title="Henüz rapor yok"
              description="Raporları görebilmek için önce sipariş almanız gerekiyor."
              onAction={handleCreateFirstOrder}
              actionLabel="İlk Siparişi Al"
            />
          </div>
        </div>
      </div>
    )
  }

  // Rapor hesaplamaları
  const totalRevenue = analytics?.totalRevenue || orders.reduce((sum, order) => sum + order.total, 0)
  const totalOrders = analytics?.totalOrders || orders.length
  const completedOrders = orders.filter((order) => order.status === "Tamamlandı").length
  const averageOrderValue = analytics?.avgOrderValue || (totalOrders > 0 ? totalRevenue / totalOrders : 0)

  // Envanter analizleri
  const lowStockItems = inventory.filter(item => item.currentStock <= item.minStock)
  const totalInventoryValue = inventory.reduce((sum, item) => sum + (item.currentStock * (item.costPrice || 0)), 0)

  // Kurye analizleri
  const availableCouriers = couriers.filter(c => c.status === "Müsait")
  const busyCouriers = couriers.filter(c => c.status !== "Müsait")
  const totalDeliveries = couriers.reduce((sum, c) => sum + (c.totalDeliveries || 0), 0)

  // Ürün analizleri
  const productStats = orders.reduce((acc, order) => {
    order.items.forEach(item => {
      const key = item.foodItem.title
      if (!acc[key]) {
        acc[key] = { count: 0, revenue: 0 }
      }
      acc[key].count += item.quantity
      acc[key].revenue += item.quantity * item.foodItem.price
    })
    return acc
  }, {} as Record<string, { count: number; revenue: number }>)

  const topProducts = Object.entries(productStats)
    .sort(([,a], [,b]) => b.count - a.count)
    .slice(0, 5)

  return (
    <div className="flex h-screen bg-gray-100">
      {showSidebar && <SidebarNav />}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header showMobileMenu={!showSidebar} onMenuToggle={() => setShowSidebar(!showSidebar)} />
        <div className="flex-1 overflow-auto p-4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Raporlar ve Analitik</h1>
            <div className="flex items-center gap-4">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Bugün</SelectItem>
                  <SelectItem value="week">Bu Hafta</SelectItem>
                  <SelectItem value="month">Bu Ay</SelectItem>
                  <SelectItem value="year">Bu Yıl</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={handleRefreshData}
                disabled={loadingData}
                size="sm"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${loadingData ? 'animate-spin' : ''}`} />
                Yenile
              </Button>
              <Button variant="outline" onClick={handlePrintReport} size="sm">
                <Printer className="mr-2 h-4 w-4" />
                Yazdır
              </Button>
              <Button variant="outline" onClick={handleExportReport} size="sm">
                <Download className="mr-2 h-4 w-4" />
                Dışa Aktar
              </Button>
            </div>
          </div>

          <Tabs defaultValue="overview">
            <TabsList className="mb-6">
              <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
              <TabsTrigger value="sales">Satış Raporu</TabsTrigger>
              <TabsTrigger value="products">Ürün Analizi</TabsTrigger>
              <TabsTrigger value="inventory">Envanter Raporu</TabsTrigger>
              <TabsTrigger value="delivery">Teslimat Raporu</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              {/* Ana Metrikler */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Toplam Gelir</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
                    <p className="text-xs text-muted-foreground">
                      <TrendingUp className="inline h-3 w-3 mr-1" />
                      Toplam satış
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Toplam Sipariş</CardTitle>
                    <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalOrders}</div>
                    <p className="text-xs text-muted-foreground">Tüm siparişler</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tamamlanan</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{completedOrders}</div>
                    <p className="text-xs text-muted-foreground">Başarılı teslimat</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ortalama Sipariş</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(averageOrderValue)}</div>
                    <p className="text-xs text-muted-foreground">Sipariş başına</p>
                  </CardContent>
                </Card>
              </div>

              {/* Popüler Saatler ve Ürünler */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Popüler Ürünler</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {topProducts.map(([product, stats], index) => (
                        <div key={product} className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{index + 1}</Badge>
                            <span className="font-medium">{product}</span>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{stats.count} adet</p>
                            <p className="text-sm text-gray-500">{formatCurrency(stats.revenue)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Yoğun Saatler</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analytics?.peakHours?.length > 0 ? (
                      <div className="space-y-3">
                        {analytics.peakHours.map((hour: any, index: number) => (
                          <div key={hour.hour} className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <Star className="h-4 w-4 text-yellow-500" />
                              <span>{hour.hour}:00 - {hour.hour + 1}:00</span>
                            </div>
                            <Badge variant="secondary">{hour.count} sipariş</Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">Henüz veri bulunmuyor</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="sales">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Satış Detayları</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {orders.slice(0, 10).map((order) => (
                        <div key={order.id} className="flex justify-between items-center p-3 border rounded">
                          <div>
                            <p className="font-medium">Sipariş #{order.id.slice(-6)}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(order.createdAt).toLocaleDateString("tr-TR")}
                            </p>
                            {order.isDelivery && (
                              <Badge variant="secondary" className="mt-1">Teslimat</Badge>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{formatCurrency(order.total)}</p>
                            <p className="text-sm text-gray-500">{order.status}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="products">
              <Card>
                <CardHeader>
                  <CardTitle>Ürün Satış Analizi</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(productStats)
                      .sort(([,a], [,b]) => b.revenue - a.revenue)
                      .map(([product, stats]) => (
                        <div key={product} className="flex justify-between items-center p-3 border rounded">
                          <div>
                            <p className="font-medium">{product}</p>
                            <p className="text-sm text-gray-500">{stats.count} adet satıldı</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{formatCurrency(stats.revenue)}</p>
                            <p className="text-sm text-gray-500">
                              Birim: {formatCurrency(stats.revenue / stats.count)}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="inventory">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Toplam Ürün</CardTitle>
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{inventory.length}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Düşük Stok</CardTitle>
                      <Package className="h-4 w-4 text-yellow-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-yellow-600">{lowStockItems.length}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Envanter Değeri</CardTitle>
                      <DollarSign className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(totalInventoryValue)}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {lowStockItems.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Düşük Stok Uyarıları</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {lowStockItems.map((item) => (
                          <div key={item.id} className="flex justify-between items-center p-3 border rounded bg-yellow-50">
                            <div>
                              <p className="font-medium">{item.productName || 'Bilinmeyen Ürün'}</p>
                              <p className="text-sm text-gray-500">
                                Mevcut: {item.currentStock} {item.unit}
                              </p>
                            </div>
                            <Badge variant="destructive">Düşük Stok</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="delivery">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                      <Users className="h-4 w-4 text-green-600" />
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
                      <CardTitle className="text-sm font-medium">Toplam Teslimat</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{totalDeliveries}</div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Kurye Performansı</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {couriers
                        .sort((a, b) => (b.totalDeliveries || 0) - (a.totalDeliveries || 0))
                        .slice(0, 10)
                        .map((courier) => (
                          <div key={courier.id} className="flex justify-between items-center p-3 border rounded">
                            <div>
                              <p className="font-medium">{courier.name}</p>
                              <p className="text-sm text-gray-500">{courier.vehicleType}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">{courier.totalDeliveries || 0} teslimat</p>
                              <Badge
                                variant={courier.status === "Müsait" ? "secondary" : "default"}
                              >
                                {courier.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
