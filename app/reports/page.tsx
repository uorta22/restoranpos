"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { SidebarNav } from "@/components/sidebar-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { EmptyState } from "@/components/empty-state"
import { useOrderContext } from "@/context/order-context"
import { formatCurrency } from "@/lib/utils"
import { CheckCircle2, Clock, DollarSign, Package, ShoppingBag, TrendingUp } from "lucide-react"

export default function ReportsPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const { orders } = useOrderContext()
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

  const handleCreateFirstOrder = () => {
    router.push("/")
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
  const paidOrders = orders.filter((order) => order.paymentStatus === "Ödendi")
  const totalRevenue = paidOrders.reduce((sum, order) => sum + order.total, 0)
  const totalOrders = orders.length
  const completedOrders = orders.filter((order) => order.status === "Tamamlandı").length
  const averageOrderValue = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0
  const productTotals = new Map<string, { name: string; quantity: number; revenue: number }>()

  for (const order of paidOrders) {
    for (const item of order.items) {
      const current = productTotals.get(item.foodItem.id) ?? {
        name: item.foodItem.title,
        quantity: 0,
        revenue: 0,
      }
      const netUnitPrice = item.foodItem.price * (1 - (item.foodItem.discount ?? 0) / 100)
      current.quantity += item.quantity
      current.revenue += netUnitPrice * item.quantity
      productTotals.set(item.foodItem.id, current)
    }
  }

  const productSales = [...productTotals.values()].sort((left, right) => right.quantity - left.quantity)

  return (
    <div className="flex h-screen bg-gray-100">
      {showSidebar && <SidebarNav />}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header showMobileMenu={!showSidebar} onMenuToggle={() => setShowSidebar(!showSidebar)} />
        <div className="flex-1 overflow-auto p-4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Raporlar</h1>
          </div>

          <Tabs defaultValue="overview">
            <TabsList className="mb-6">
              <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
              <TabsTrigger value="sales">Satış Raporu</TabsTrigger>
              <TabsTrigger value="products">Ürün Analizi</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
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
                      Ödemesi alınan satışlar
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
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
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
                    <p className="text-xs text-muted-foreground">Ödenen sipariş başına</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="sales">
              <Card>
                <CardHeader>
                  <CardTitle>Satış Detayları</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="flex justify-between items-center p-3 border rounded">
                        <div>
                          <p className="font-medium">Sipariş #{order.id.slice(-6)}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(order.createdAt).toLocaleDateString("tr-TR")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(order.total)}</p>
                          <p className="text-sm text-gray-500">{order.status} · {order.paymentStatus}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="products">
              <Card>
                <CardHeader>
                  <CardTitle>Ürün Analizi</CardTitle>
                </CardHeader>
                <CardContent>
                  {productSales.length ? (
                    <div className="space-y-3">
                      {productSales.map((product, index) => (
                        <div key={`${product.name}:${index}`} className="flex items-center justify-between gap-4 border-b py-3 last:border-0">
                          <div className="flex min-w-0 items-center gap-3">
                            <Package className="h-4 w-4 shrink-0 text-orange-600" aria-hidden="true" />
                            <div className="min-w-0">
                              <p className="truncate font-medium text-gray-950">{product.name}</p>
                              <p className="text-sm text-gray-500">{product.quantity} adet</p>
                            </div>
                          </div>
                          <p className="font-semibold">{formatCurrency(product.revenue)}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Ürün analizi için ödemesi alınmış sipariş bulunmuyor.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
