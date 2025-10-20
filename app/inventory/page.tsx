"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { SidebarNav } from "@/components/sidebar-nav"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { EmptyState } from "@/components/empty-state"
import { Plus, Package, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { inventoryApi, productsApi } from "@/lib/api"

interface InventoryItem {
  id: string
  productId: string
  productName?: string
  currentStock: number
  minStock: number
  maxStock: number
  unit: string
  costPrice?: number
  supplierId?: string
  lastUpdated: string
}

export default function InventoryPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [showSidebar, setShowSidebar] = useState(true)
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [isAddItemOpen, setIsAddItemOpen] = useState(false)
  const [isEditItemOpen, setIsEditItemOpen] = useState(false)
  const [currentItem, setCurrentItem] = useState<InventoryItem | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filter, setFilter] = useState<"all" | "low" | "empty">("all")
  const [loadingData, setLoadingData] = useState(true)
  const [inventoryForm, setInventoryForm] = useState({
    productId: "",
    currentStock: 0,
    minStock: 5,
    maxStock: 100,
    unit: "adet",
    costPrice: 0,
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
        const [inventoryData, productsData] = await Promise.all([
          inventoryApi.getAll(),
          productsApi.getAll(user.restaurant_id || ""),
        ])

        const enhancedInventory = inventoryData.map((item) => {
          const product = productsData.find((p) => p.id === item.productId)
          return {
            ...item,
            productName: product?.title || "Bilinmeyen Ürün",
          }
        })

        setInventory(enhancedInventory)
        setProducts(productsData)
      } catch (error) {
        console.error("Failed to load inventory data:", error)
        toast({
          title: "Hata",
          description: "Envanter verileri yüklenirken bir hata oluştu.",
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

  const handleAddFirstItem = () => {
    setIsAddItemOpen(true)
  }

  const handleAddItem = async () => {
    if (!inventoryForm.productId) {
      toast({
        title: "Eksik bilgi",
        description: "Lütfen bir ürün seçin.",
        variant: "destructive",
      })
      return
    }

    try {
      const selectedProduct = products.find((p) => p.id === inventoryForm.productId)
      const newItem: InventoryItem = {
        id: Math.random().toString(36).substring(2, 9),
        productId: inventoryForm.productId,
        productName: selectedProduct?.title || "Bilinmeyen Ürün",
        currentStock: inventoryForm.currentStock,
        minStock: inventoryForm.minStock,
        maxStock: inventoryForm.maxStock,
        unit: inventoryForm.unit,
        costPrice: inventoryForm.costPrice,
        lastUpdated: new Date().toISOString(),
      }

      setInventory([...inventory, newItem])
      setIsAddItemOpen(false)

      setInventoryForm({
        productId: "",
        currentStock: 0,
        minStock: 5,
        maxStock: 100,
        unit: "adet",
        costPrice: 0,
      })

      toast({
        title: "Envanter eklendi",
        description: `${selectedProduct?.title} envantere eklendi.`,
      })
    } catch (error) {
      toast({
        title: "Hata",
        description: "Envanter eklenirken bir hata oluştu.",
        variant: "destructive",
      })
    }
  }

  const handleEditItem = (item: InventoryItem) => {
    setCurrentItem(item)
    setInventoryForm({
      productId: item.productId,
      currentStock: item.currentStock,
      minStock: item.minStock,
      maxStock: item.maxStock,
      unit: item.unit,
      costPrice: item.costPrice || 0,
    })
    setIsEditItemOpen(true)
  }

  const handleUpdateItem = async () => {
    if (!currentItem) return

    try {
      const success = await inventoryApi.updateStock(currentItem.productId, inventoryForm.currentStock)

      if (success) {
        const updatedInventory = inventory.map((item) =>
          item.id === currentItem.id
            ? {
                ...item,
                currentStock: inventoryForm.currentStock,
                minStock: inventoryForm.minStock,
                maxStock: inventoryForm.maxStock,
                unit: inventoryForm.unit,
                costPrice: inventoryForm.costPrice,
                lastUpdated: new Date().toISOString(),
              }
            : item,
        )

        setInventory(updatedInventory)
        setIsEditItemOpen(false)

        toast({
          title: "Envanter güncellendi",
          description: `${currentItem.productName} başarıyla güncellendi.`,
        })
      } else {
        toast({
          title: "Hata",
          description: "Envanter güncellenirken bir hata oluştu.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Envanter güncellenirken bir hata oluştu.",
        variant: "destructive",
      })
    }
  }

  const getStockStatus = (item: InventoryItem) => {
    if (item.currentStock === 0) return "empty"
    if (item.currentStock <= item.minStock) return "low"
    return "normal"
  }

  const getStockBadge = (item: InventoryItem) => {
    const status = getStockStatus(item)
    switch (status) {
      case "empty":
        return <Badge variant="destructive">Stok Yok</Badge>
      case "low":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Düşük Stok</Badge>
      case "normal":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Normal</Badge>
      default:
        return <Badge variant="secondary">Bilinmiyor</Badge>
    }
  }

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      item.productName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.unit.toLowerCase().includes(searchQuery.toLowerCase())

    if (filter === "low") {
      return matchesSearch && item.currentStock <= item.minStock && item.currentStock > 0
    }
    if (filter === "empty") {
      return matchesSearch && item.currentStock === 0
    }
    return matchesSearch
  })

  const lowStockCount = inventory.filter((item) => item.currentStock <= item.minStock && item.currentStock > 0).length
  const emptyStockCount = inventory.filter((item) => item.currentStock === 0).length

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
            <h1 className="text-2xl font-bold">Envanter Yönetimi</h1>
            <Button onClick={handleAddFirstItem}>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Envanter
            </Button>
          </div>

          {/* Özet Kartları */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
                <TrendingDown className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{lowStockCount}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Stok Yok</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{emptyStockCount}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Toplam Değer</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  ₺{inventory.reduce((sum, item) => sum + (item.currentStock * (item.costPrice || 0)), 0).toFixed(2)}
                </div>
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
              variant={filter === "low" ? "default" : "outline"}
              onClick={() => setFilter("low")}
              size="sm"
            >
              Düşük Stok
            </Button>
            <Button
              variant={filter === "empty" ? "default" : "outline"}
              onClick={() => setFilter("empty")}
              size="sm"
            >
              Stok Yok
            </Button>
          </div>

          {inventory.length === 0 ? (
            <EmptyState
              type="inventory"
              title="Henüz envanter yok"
              description="Ürünlerinizin stok durumunu takip etmek için envanter eklemeye başlayın."
              onAction={handleAddFirstItem}
              actionLabel="İlk Envanteri Ekle"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredInventory.map((item) => (
                <Card key={item.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{item.productName}</CardTitle>
                      {getStockBadge(item)}
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Mevcut Stok:</span>
                        <span className="font-semibold">{item.currentStock} {item.unit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Min. Stok:</span>
                        <span>{item.minStock} {item.unit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Maks. Stok:</span>
                        <span>{item.maxStock} {item.unit}</span>
                      </div>
                      {item.costPrice && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Birim Fiyat:</span>
                          <span>₺{item.costPrice.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Son Güncelleme:</span>
                        <span className="text-xs">{new Date(item.lastUpdated).toLocaleDateString("tr-TR")}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" size="sm" onClick={() => handleEditItem(item)} className="w-full">
                      Düzenle
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Inventory Dialog */}
      <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni Envanter Ekle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="product">Ürün</Label>
              <select
                id="product"
                className="w-full p-2 border rounded-md"
                value={inventoryForm.productId}
                onChange={(e) => setInventoryForm({ ...inventoryForm, productId: e.target.value })}
              >
                <option value="">Ürün seçin</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currentStock">Mevcut Stok</Label>
              <Input
                id="currentStock"
                type="number"
                value={inventoryForm.currentStock}
                onChange={(e) => setInventoryForm({ ...inventoryForm, currentStock: Number.parseInt(e.target.value) })}
                placeholder="Mevcut stok miktarı"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minStock">Minimum Stok</Label>
              <Input
                id="minStock"
                type="number"
                value={inventoryForm.minStock}
                onChange={(e) => setInventoryForm({ ...inventoryForm, minStock: Number.parseInt(e.target.value) })}
                placeholder="Minimum stok miktarı"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxStock">Maksimum Stok</Label>
              <Input
                id="maxStock"
                type="number"
                value={inventoryForm.maxStock}
                onChange={(e) => setInventoryForm({ ...inventoryForm, maxStock: Number.parseInt(e.target.value) })}
                placeholder="Maksimum stok miktarı"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Birim</Label>
              <Input
                id="unit"
                value={inventoryForm.unit}
                onChange={(e) => setInventoryForm({ ...inventoryForm, unit: e.target.value })}
                placeholder="kg, adet, litre vb."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="costPrice">Birim Fiyat (₺)</Label>
              <Input
                id="costPrice"
                type="number"
                step="0.01"
                value={inventoryForm.costPrice}
                onChange={(e) => setInventoryForm({ ...inventoryForm, costPrice: Number.parseFloat(e.target.value) })}
                placeholder="Birim fiyat"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddItemOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleAddItem}>Envanter Ekle</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Inventory Dialog */}
      <Dialog open={isEditItemOpen} onOpenChange={setIsEditItemOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Envanter Düzenle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-currentStock">Mevcut Stok</Label>
              <Input
                id="edit-currentStock"
                type="number"
                value={inventoryForm.currentStock}
                onChange={(e) => setInventoryForm({ ...inventoryForm, currentStock: Number.parseInt(e.target.value) })}
                placeholder="Mevcut stok miktarı"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-minStock">Minimum Stok</Label>
              <Input
                id="edit-minStock"
                type="number"
                value={inventoryForm.minStock}
                onChange={(e) => setInventoryForm({ ...inventoryForm, minStock: Number.parseInt(e.target.value) })}
                placeholder="Minimum stok miktarı"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-maxStock">Maksimum Stok</Label>
              <Input
                id="edit-maxStock"
                type="number"
                value={inventoryForm.maxStock}
                onChange={(e) => setInventoryForm({ ...inventoryForm, maxStock: Number.parseInt(e.target.value) })}
                placeholder="Maksimum stok miktarı"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-unit">Birim</Label>
              <Input
                id="edit-unit"
                value={inventoryForm.unit}
                onChange={(e) => setInventoryForm({ ...inventoryForm, unit: e.target.value })}
                placeholder="kg, adet, litre vb."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-costPrice">Birim Fiyat (₺)</Label>
              <Input
                id="edit-costPrice"
                type="number"
                step="0.01"
                value={inventoryForm.costPrice}
                onChange={(e) => setInventoryForm({ ...inventoryForm, costPrice: Number.parseFloat(e.target.value) })}
                placeholder="Birim fiyat"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditItemOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleUpdateItem}>Değişiklikleri Kaydet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}