"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { AlertTriangle, Boxes, PackagePlus, Plus, Trash2 } from "lucide-react"
import { inventoryApi, suppliersApi } from "@/lib/api"
import type { InventoryItem, Supplier } from "@/lib/types"
import { Header } from "@/components/header"
import { SidebarNav } from "@/components/sidebar-nav"
import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"

export default function InventoryPage() {
  const { user, isLoading: isAuthLoading } = useAuth()
  const { toast } = useToast()
  const [showSidebar, setShowSidebar] = useState(true)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false)
  const [supplierForm, setSupplierForm] = useState({ name: "", contactName: "", phone: "", email: "", address: "" })
  const [editingStock, setEditingStock] = useState<InventoryItem | null>(null)
  const [newStock, setNewStock] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const restaurantId = user?.restaurant_id
  const canManage = user?.memberRole === "owner" || user?.memberRole === "manager"
  const lowStockCount = useMemo(
    () => inventory.filter((item) => item.currentStock <= item.minStock).length,
    [inventory],
  )

  const loadData = useCallback(async () => {
    if (!restaurantId) return
    setIsLoading(true)
    try {
      const [supplierRows, inventoryRows] = await Promise.all([
        suppliersApi.getAll(restaurantId),
        inventoryApi.getAll(restaurantId),
      ])
      setSuppliers(supplierRows)
      setInventory(inventoryRows)
    } catch (cause) {
      toast({
        title: "Envanter verileri yüklenemedi",
        description: cause instanceof Error ? cause.message : "Veriler okunamadı.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [restaurantId, toast])

  useEffect(() => {
    if (isAuthLoading) return
    const timeoutId = window.setTimeout(() => void loadData(), 0)
    return () => window.clearTimeout(timeoutId)
  }, [isAuthLoading, loadData])

  const createSupplier = async () => {
    if (!supplierForm.name.trim()) return
    setIsSubmitting(true)
    try {
      const created = await suppliersApi.create({
        name: supplierForm.name,
        contact_name: supplierForm.contactName,
        phone: supplierForm.phone,
        email: supplierForm.email,
        address: supplierForm.address,
        restaurant_id: restaurantId,
      })
      if (created) setSuppliers((current) => [...current, created])
      setSupplierForm({ name: "", contactName: "", phone: "", email: "", address: "" })
      setIsSupplierDialogOpen(false)
      toast({ title: "Tedarikçi eklendi", description: "Tedarikçi kaydı oluşturuldu." })
    } catch (cause) {
      toast({
        title: "Tedarikçi eklenemedi",
        description: cause instanceof Error ? cause.message : "İşlem tamamlanamadı.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const removeSupplier = async (supplier: Supplier) => {
    try {
      await suppliersApi.delete(supplier.id, restaurantId)
      setSuppliers((current) => current.filter((item) => item.id !== supplier.id))
      toast({ title: "Tedarikçi silindi", description: `${supplier.name} kaldırıldı.` })
    } catch (cause) {
      toast({
        title: "Tedarikçi silinemedi",
        description: cause instanceof Error ? cause.message : "İşlem tamamlanamadı.",
        variant: "destructive",
      })
    }
  }

  const updateStock = async () => {
    if (!editingStock) return
    const quantity = Number(newStock)
    if (!Number.isFinite(quantity) || quantity < 0) return
    setIsSubmitting(true)
    try {
      await inventoryApi.updateStock(editingStock.productId, quantity)
      setInventory((current) =>
        current.map((item) => (item.id === editingStock.id ? { ...item, currentStock: quantity } : item)),
      )
      setEditingStock(null)
      toast({ title: "Stok güncellendi", description: "Düzeltme stok hareketlerine kaydedildi." })
    } catch (cause) {
      toast({
        title: "Stok güncellenemedi",
        description: cause instanceof Error ? cause.message : "İşlem tamamlanamadı.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isAuthLoading || isLoading) {
    return (
      <div className="grid h-screen place-items-center bg-gray-50">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-orange-600" />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {showSidebar && <SidebarNav />}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header showMobileMenu={!showSidebar} onMenuToggle={() => setShowSidebar((current) => !current)} />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold text-gray-950">Envanter Yönetimi</h1>
              <p className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                <AlertTriangle className="h-4 w-4 text-orange-600" aria-hidden="true" />
                {lowStockCount} ürün düşük stok seviyesinde
              </p>
            </div>
            {canManage && (
              <Button onClick={() => setIsSupplierDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                Tedarikçi ekle
              </Button>
            )}
          </div>

          <Tabs defaultValue="inventory">
            <TabsList>
              <TabsTrigger value="inventory">Stok</TabsTrigger>
              <TabsTrigger value="suppliers">Tedarikçiler</TabsTrigger>
            </TabsList>
            <TabsContent value="inventory" className="mt-5">
              {inventory.length ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {inventory.map((item) => {
                    const isLow = item.currentStock <= item.minStock
                    return (
                      <Card key={item.id} className={isLow ? "border-orange-400" : undefined}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">{item.productName || "Ürün"}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-end justify-between gap-4">
                            <div>
                              <p className="text-2xl font-semibold text-gray-950">{item.currentStock} {item.unit}</p>
                              <p className="mt-1 text-xs text-gray-500">Minimum: {item.minStock} {item.unit}</p>
                            </div>
                            {canManage && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingStock(item)
                                  setNewStock(String(item.currentStock))
                                }}
                              >
                                Düzelt
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              ) : (
                <EmptyState type="products" title="Stok takibi yapılan ürün yok" description="Menüde bir ürüne stok miktarı eklediğinizde burada görünür." />
              )}
            </TabsContent>
            <TabsContent value="suppliers" className="mt-5">
              {suppliers.length ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {suppliers.map((supplier) => (
                    <Card key={supplier.id}>
                      <CardHeader className="pb-2"><CardTitle className="text-base">{supplier.name}</CardTitle></CardHeader>
                      <CardContent className="space-y-1 text-sm text-gray-600">
                        {supplier.contact_name && <p>{supplier.contact_name}</p>}
                        {supplier.phone && <p>{supplier.phone}</p>}
                        {supplier.email && <p>{supplier.email}</p>}
                        {canManage && (
                          <Button variant="ghost" size="sm" className="mt-3 text-red-600" onClick={() => void removeSupplier(supplier)}>
                            <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                            Sil
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <EmptyState type="suppliers" title="Henüz tedarikçi yok" description="Satın alma kaynaklarınızı ekleyerek başlayın." onAction={canManage ? () => setIsSupplierDialogOpen(true) : undefined} actionLabel="Tedarikçi ekle" />
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>

      <Dialog open={isSupplierDialogOpen} onOpenChange={setIsSupplierDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Yeni tedarikçi</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-3 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2"><Label htmlFor="supplier-name">Tedarikçi adı</Label><Input id="supplier-name" value={supplierForm.name} onChange={(event) => setSupplierForm({ ...supplierForm, name: event.target.value })} required /></div>
            <div className="space-y-2"><Label htmlFor="supplier-contact">Yetkili</Label><Input id="supplier-contact" value={supplierForm.contactName} onChange={(event) => setSupplierForm({ ...supplierForm, contactName: event.target.value })} /></div>
            <div className="space-y-2"><Label htmlFor="supplier-phone">Telefon</Label><Input id="supplier-phone" value={supplierForm.phone} onChange={(event) => setSupplierForm({ ...supplierForm, phone: event.target.value })} /></div>
            <div className="space-y-2"><Label htmlFor="supplier-email">E-posta</Label><Input id="supplier-email" type="email" value={supplierForm.email} onChange={(event) => setSupplierForm({ ...supplierForm, email: event.target.value })} /></div>
            <div className="space-y-2"><Label htmlFor="supplier-address">Adres</Label><Input id="supplier-address" value={supplierForm.address} onChange={(event) => setSupplierForm({ ...supplierForm, address: event.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setIsSupplierDialogOpen(false)}>İptal</Button><Button onClick={createSupplier} disabled={isSubmitting || !supplierForm.name.trim()}><PackagePlus className="mr-2 h-4 w-4" />Ekle</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editingStock)} onOpenChange={(open) => !open && setEditingStock(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Stok düzelt</DialogTitle></DialogHeader>
          <div className="space-y-2 py-3"><Label htmlFor="stock-quantity">Yeni miktar</Label><Input id="stock-quantity" type="number" min="0" step="0.001" value={newStock} onChange={(event) => setNewStock(event.target.value)} /></div>
          <DialogFooter><Button variant="outline" onClick={() => setEditingStock(null)}>İptal</Button><Button onClick={updateStock} disabled={isSubmitting}><Boxes className="mr-2 h-4 w-4" />Kaydet</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
