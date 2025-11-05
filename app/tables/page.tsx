"use client"

import { useState } from "react"
import { useTableContext } from "@/context/table-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Plus, Edit, Trash2, Users, Coffee } from "lucide-react"
import { Header } from "@/components/header"
import { SidebarNav } from "@/components/sidebar-nav"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
// Import API functions and EmptyState
import { EmptyState } from "@/components/empty-state"

export default function TablesPage() {
  const { tables, addTable, updateTable, deleteTable } = useTableContext()
  const { toast } = useToast()
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [showSidebar, setShowSidebar] = useState(true)

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const [tableNumber, setTableNumber] = useState("")
  const [tableCapacity, setTableCapacity] = useState("4")
  const [tableSection, setTableSection] = useState("Ana Salon")
  const [selectedTable, setSelectedTable] = useState<string | null>(null)

  const mainTables = tables.filter((table) => table.section === "Ana Salon")
  const barTables = tables.filter((table) => table.section === "Bar")
  const terraceTables = tables.filter((table) => table.section === "Teras")


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

  const handleAddTable = () => {
    try {
      if (!tableNumber || !tableCapacity || !tableSection) {
        toast({
          title: "Hata",
          description: "Lütfen tüm alanları doldurun",
          variant: "destructive",
        })
        return
      }

      // Not: Aynı numarada farklı kapasiteli masalar olabilir, bu yüzden numara kontrolü yapılmıyor

      addTable(tableNumber, Number.parseInt(tableCapacity), tableSection)
      setIsAddDialogOpen(false)

      // Formu temizle
      setTableNumber("")
      setTableCapacity("4")
      setTableSection("Ana Salon")

      toast({
        title: "Başarılı",
        description: "Masa başarıyla eklendi",
      })
    } catch (error) {
      toast({
        title: "Hata",
        description: "Masa eklenirken bir hata oluştu",
        variant: "destructive",
      })
    }
  }

  const handleEditTable = () => {
    try {
      if (!selectedTable || !tableNumber || !tableCapacity || !tableSection) {
        toast({
          title: "Hata",
          description: "Lütfen tüm alanları doldurun",
          variant: "destructive",
        })
        return
      }

      // Not: Aynı numarada farklı kapasiteli masalar olabilir, bu yüzden numara kontrolü yapılmıyor

      updateTable(selectedTable, {
        number: tableNumber,
        capacity: Number.parseInt(tableCapacity),
        section: tableSection,
      })

      setIsEditDialogOpen(false)

      toast({
        title: "Başarılı",
        description: "Masa başarıyla güncellendi",
      })
    } catch (error) {
      toast({
        title: "Hata",
        description: "Masa güncellenirken bir hata oluştu",
        variant: "destructive",
      })
    }
  }

  const handleDeleteTable = () => {
    try {
      if (!selectedTable) return

      deleteTable(selectedTable)
      setIsDeleteDialogOpen(false)

      toast({
        title: "Başarılı",
        description: "Masa başarıyla silindi",
      })
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Masa silinirken bir hata oluştu",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (table: any) => {
    setSelectedTable(table.id)
    setTableNumber(table.number)
    setTableCapacity(table.capacity.toString())
    setTableSection(table.section)
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (tableId: string) => {
    setSelectedTable(tableId)
    setIsDeleteDialogOpen(true)
  }

  const renderTableCard = (table: any) => (
    <Card key={table.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <CardHeader
        className={`pb-2 ${
          table.status === "Müsait"
            ? "bg-gradient-to-r from-green-50 to-green-100"
            : table.status === "Dolu"
              ? "bg-gradient-to-r from-red-50 to-red-100"
              : "bg-gradient-to-r from-blue-50 to-blue-100"
        }`}
      >
        <CardTitle className="text-lg font-medium flex items-center justify-between">
          <div className="flex items-center">
            <Coffee className="mr-2 h-5 w-5 text-gray-600" />
            {table.number} ({table.capacity} kişi)
          </div>
          <Badge
            variant="outline"
            className={`
            ${
              table.status === "Müsait"
                ? "bg-green-100 text-green-800 border-green-200"
                : table.status === "Dolu"
                  ? "bg-red-100 text-red-800 border-red-200"
                  : "bg-blue-100 text-blue-800 border-blue-200"
            }
          `}
          >
            {table.status}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center text-sm text-gray-600">
            <Users className="h-4 w-4 mr-1" />
            {table.capacity} Kişilik
          </div>
          <div className="text-sm text-gray-600">{table.section}</div>
        </div>

        <div className="flex space-x-2 mt-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={() => openEditDialog(table)}>
            <Edit className="h-4 w-4 mr-1" />
            Düzenle
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-red-500 hover:text-red-700 hover:bg-red-50"
            onClick={() => openDeleteDialog(table.id)}
            disabled={table.status === "Dolu"}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Sil
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="flex h-screen bg-gray-100">
      {showSidebar && <SidebarNav />}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header showMobileMenu={!showSidebar} onMenuToggle={() => setShowSidebar(!showSidebar)} />
        <div className="flex-1 overflow-auto p-4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Masa Yönetimi</h1>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Masa Ekle
            </Button>
          </div>

          <Tabs defaultValue="all">
            <TabsList className="mb-6">
              <TabsTrigger value="all">Tüm Masalar</TabsTrigger>
              <TabsTrigger value="main">Ana Salon</TabsTrigger>
              <TabsTrigger value="bar">Bar</TabsTrigger>
              <TabsTrigger value="terrace">Teras</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {tables.map(renderTableCard)}
              </div>
            </TabsContent>

            <TabsContent value="main">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {mainTables.length > 0 ? (
                  mainTables.map(renderTableCard)
                ) : (
                  <div className="col-span-full">
                    <EmptyState type="tables" onAction={() => setIsAddDialogOpen(true)} actionLabel="İlk Masayı Ekle" />
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="bar">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {barTables.length > 0 ? (
                  barTables.map(renderTableCard)
                ) : (
                  <div className="col-span-full text-center py-10 text-gray-500">Bu bölümde masa bulunmamaktadır.</div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="terrace">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {terraceTables.length > 0 ? (
                  terraceTables.map(renderTableCard)
                ) : (
                  <div className="col-span-full text-center py-10 text-gray-500">Bu bölümde masa bulunmamaktadır.</div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Masa Ekleme Dialog */}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Yeni Masa Ekle</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="tableNumber">Masa Numarası</Label>
                  <Input
                    id="tableNumber"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="Örn: M1, B2, T3"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tableCapacity">Kapasite</Label>
                  <Select value={tableCapacity} onValueChange={setTableCapacity}>
                    <SelectTrigger>
                      <SelectValue placeholder="Kapasite seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Kişilik</SelectItem>
                      <SelectItem value="2">2 Kişilik</SelectItem>
                      <SelectItem value="4">4 Kişilik</SelectItem>
                      <SelectItem value="6">6 Kişilik</SelectItem>
                      <SelectItem value="8">8 Kişilik</SelectItem>
                      <SelectItem value="10">10 Kişilik</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tableSection">Bölüm</Label>
                  <Select value={tableSection} onValueChange={setTableSection}>
                    <SelectTrigger>
                      <SelectValue placeholder="Bölüm seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ana Salon">Ana Salon</SelectItem>
                      <SelectItem value="Bar">Bar</SelectItem>
                      <SelectItem value="Teras">Teras</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  İptal
                </Button>
                <Button onClick={handleAddTable}>Ekle</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Masa Düzenleme Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Masa Düzenle</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="editTableNumber">Masa Numarası</Label>
                  <Input
                    id="editTableNumber"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="Örn: M1, B2, T3"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editTableCapacity">Kapasite</Label>
                  <Select value={tableCapacity} onValueChange={setTableCapacity}>
                    <SelectTrigger>
                      <SelectValue placeholder="Kapasite seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Kişilik</SelectItem>
                      <SelectItem value="2">2 Kişilik</SelectItem>
                      <SelectItem value="4">4 Kişilik</SelectItem>
                      <SelectItem value="6">6 Kişilik</SelectItem>
                      <SelectItem value="8">8 Kişilik</SelectItem>
                      <SelectItem value="10">10 Kişilik</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editTableSection">Bölüm</Label>
                  <Select value={tableSection} onValueChange={setTableSection}>
                    <SelectTrigger>
                      <SelectValue placeholder="Bölüm seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ana Salon">Ana Salon</SelectItem>
                      <SelectItem value="Bar">Bar</SelectItem>
                      <SelectItem value="Teras">Teras</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  İptal
                </Button>
                <Button onClick={handleEditTable}>Kaydet</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Masa Silme Dialog */}
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Masa Sil</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <p>Bu masayı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.</p>
                <p className="text-sm text-gray-500 mt-2">Not: Dolu masalar silinemez.</p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                  İptal
                </Button>
                <Button variant="destructive" onClick={handleDeleteTable}>
                  Sil
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}
