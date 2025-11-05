"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { SidebarNav } from "@/components/sidebar-nav"
import { CategoryFilter } from "@/components/category-filter"
import { FoodGrid } from "@/components/food-grid"
import { Cart } from "@/components/cart"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { EmptyState } from "@/components/empty-state"
import { productsApi, categoriesApi } from "@/lib/api"
import { TableOverview } from "@/components/table-overview"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useOrderContext } from "@/context/order-context"
import { formatCurrency } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, DollarSign, ShoppingBag, Clock, Users, ChefHat } from "lucide-react"

export default function HomePage() {
  const { user, isLoading } = useAuth()
  const { orders } = useOrderContext()
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState("Tümü")
  const [searchQuery, setSearchQuery] = useState("")
  const [showSidebar, setShowSidebar] = useState(true)
  const [categories, setCategories] = useState<string[]>([]) // Stays as string[] for now
  const [hasProducts, setHasProducts] = useState(false)
  const [loadingData, setLoadingData] = useState(true) // Renamed to avoid conflict with auth isLoading

  // Responsive sidebar kontrolü
  useEffect(() => {
    const handleResize = () => {
      setShowSidebar(window.innerWidth >= 768)
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Auth kontrolü
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  // Kategorileri ve ürün varlığını kontrol et
  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        // Only load data if user is authenticated
        setLoadingData(false)
        return
      }

      try {
        setLoadingData(true)
        // Fetch categories first
        const fetchedCategoryNames = await categoriesApi.getAll()

        // Then fetch products (which now correctly joins for category names)
        const fetchedProducts = await productsApi.getAll()

        // Add "Tümü" to category names if not already present and there are categories
        const allCategories =
          fetchedCategoryNames.length > 0
            ? ["Tümü", ...fetchedCategoryNames.filter((name) => name !== "Tümü")]
            : ["Tümü"]

        setCategories(allCategories)
        setHasProducts(fetchedProducts.length > 0)

        if (allCategories.length > 1 && selectedCategory === "Tümü") {
          // if more than just "Tümü"
          // setSelectedCategory("Tümü"); // Already default
        } else if (allCategories.length === 1 && allCategories[0] === "Tümü" && fetchedProducts.length === 0) {
          // Only "Tümü" and no products, keep "Tümü"
        } else if (allCategories.length > 1) {
          // If "Tümü" is not the only option, ensure it's selected if no specific category is chosen
          // This logic might need refinement based on desired default behavior
        }
      } catch (error) {
        console.error("Failed to load data:", error)
        setCategories(["Tümü"]) // Default to "Tümü" on error
        setHasProducts(false)
      } finally {
        setLoadingData(false)
      }
    }

    if (!isLoading) {
      // Ensure auth state is resolved before loading data
      loadData()
    }
  }, [user, isLoading]) // Depend on user and isLoading

  if (isLoading || loadingData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login due to the useEffect above
  }

  const handleAddFirstProduct = () => {
    router.push("/menu")
  }

  // Quick stats calculations
  const todayOrders = orders.filter(order => {
    const orderDate = new Date(order.createdAt)
    const today = new Date()
    return orderDate.toDateString() === today.toDateString()
  })

  const pendingOrders = orders.filter(order =>
    order.status === "Beklemede" || order.status === "Hazırlanıyor"
  )

  const todayRevenue = todayOrders.reduce((sum, order) => sum + order.total, 0)
  const completedToday = todayOrders.filter(order => order.status === "Tamamlandı").length

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
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          <main className="flex-1 overflow-auto p-4">
            {!hasProducts ? (
              <div className="flex-1 flex items-center justify-center">
                <EmptyState
                  type="products"
                  title="Henüz ürün yok"
                  description="Siparişleri almaya başlamak için önce menünüze ürün eklemeniz gerekiyor."
                  onAction={handleAddFirstProduct}
                  actionLabel="İlk Ürünü Ekle"
                />
              </div>
            ) : (
              <>
                {/* Quick Stats Dashboard */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Bugünkü Gelir</CardTitle>
                      <DollarSign className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">{formatCurrency(todayRevenue)}</div>
                      <p className="text-xs text-muted-foreground">
                        {todayOrders.length} sipariş
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-green-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Tamamlanan</CardTitle>
                      <ShoppingBag className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">{completedToday}</div>
                      <p className="text-xs text-muted-foreground">
                        Bugün teslim edildi
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-orange-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Bekleyen</CardTitle>
                      <Clock className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-orange-600">{pendingOrders.length}</div>
                      <p className="text-xs text-muted-foreground">
                        Mutfakta hazırlanıyor
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-purple-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Toplam Sipariş</CardTitle>
                      <Users className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-purple-600">{orders.length}</div>
                      <p className="text-xs text-muted-foreground">
                        Tüm zamanlar
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="mb-6">
                  <TableOverview />
                </div>
                <CategoryFilter
                  categories={categories} // Still expects string[]
                  selectedCategory={selectedCategory}
                  onCategoryChange={setSelectedCategory}
                />
                <FoodGrid category={selectedCategory} searchQuery={searchQuery} />
              </>
            )}
          </main>
          {hasProducts && <Cart />}
        </div>
      </div>
    </div>
  )
}
