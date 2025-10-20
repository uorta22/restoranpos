"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { SidebarNav } from "@/components/sidebar-nav"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Plus } from "lucide-react"
import { EmptyState } from "@/components/empty-state"
import { SupplierForm } from "@/components/supplier-form"
// Import API functions
import { suppliersApi, inventoryApi } from "@/lib/api"

export default function StorePage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [showSidebar, setShowSidebar] = useState(true)
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [inventory, setInventory] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isSupplierFormOpen, setIsSupplierFormOpen] = useState(false)

  // Responsive sidebar kontrolü
  useEffect(() => {
    const handleResize = () => {
      setShowSidebar(window.innerWidth >= 768)
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Load data from API
  useEffect(() => {
    const loadData = async () => {
      if (!user) return

      try {
        setLoading(true)
        // Load suppliers and inventory from database
        const [fetchedSuppliers, fetchedInventory] = await Promise.all([
          suppliersApi?.getAll() || Promise.resolve([]),
          inventoryApi?.getAll() || Promise.resolve([]),
        ])

        setSuppliers(fetchedSuppliers)
        setInventory(fetchedInventory)
      } catch (error) {
        console.error("Failed to load store data:", error)
        toast({
          title: "Veri yüklenemedi",
          description: "Depo verileri yüklenirken bir hata oluştu.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user, toast])

  if (isLoading || loading) {
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

  const handleAddFirstSupplier = () => {
    setIsSupplierFormOpen(true)
  }

  const handleSupplierSave = async (supplierData: any) => {
    try {
      const newSupplier = await suppliersApi.create(supplierData)
      if (newSupplier) {
        setSuppliers(prev => [...prev, newSupplier])
        toast({
          title: "Tedarikçi eklendi",
          description: `${supplierData.name} başarıyla eklendi.`,
        })
      }
    } catch (error) {
      console.error("Failed to create supplier:", error)
      toast({
        title: "Hata",
        description: "Tedarikçi eklenirken bir hata oluştu.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {showSidebar && <SidebarNav />}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header showMobileMenu={!showSidebar} onMenuToggle={() => setShowSidebar(!showSidebar)} />
        <div className="flex-1 overflow-auto p-4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Depo Yönetimi</h1>
            <Button onClick={handleAddFirstSupplier}>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Tedarikçi
            </Button>
          </div>

          {suppliers.length === 0 ? (
            <EmptyState
              type="suppliers"
              title="Henüz tedarikçi yok"
              description="Stok yönetimini başlatmak için tedarikçi bilgilerini ekleyin."
              onAction={handleAddFirstSupplier}
              actionLabel="İlk Tedarikçiyi Ekle"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {suppliers.map((supplier) => (
                <div key={supplier.id} className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="font-semibold text-lg mb-2">{supplier.name}</h3>
                  <p className="text-gray-600 mb-1">İletişim: {supplier.contactPerson}</p>
                  <p className="text-gray-600 mb-1">Telefon: {supplier.phone}</p>
                  <p className="text-gray-600 mb-1">E-posta: {supplier.email}</p>
                  {supplier.notes && (
                    <p className="text-gray-500 text-sm mt-2">{supplier.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          <SupplierForm
            open={isSupplierFormOpen}
            onOpenChange={setIsSupplierFormOpen}
            onSave={handleSupplierSave}
          />
        </div>
      </div>
    </div>
  )
}
