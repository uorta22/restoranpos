"use client"

import type React from "react"

import { ProductForm } from "@/components/product-form"
import { useEffect, useMemo, useRef, useState } from "react"
import { Header } from "@/components/header"
import { ProductImage } from "@/components/product-image"
import { SidebarNav } from "@/components/sidebar-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCurrency } from "@/lib/utils"
import {
  Edit,
  Plus,
  Trash2,
  FileDown,
  FileUp,
  CheckSquare,
  Trash,
  Download,
  Upload,
  X,
  AlertCircle,
} from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import type { FoodItem } from "@/lib/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Import API functions
import { productsApi } from "@/lib/api"
// Import EmptyState component
import { EmptyState } from "@/components/empty-state"

function escapeCsvCell(value: string | number | boolean) {
  const text = String(value)
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

function parseCsv(content: string) {
  const rows: string[][] = []
  let row: string[] = []
  let value = ""
  let quoted = false

  for (let index = 0; index < content.length; index += 1) {
    const character = content[index]
    if (character === '"') {
      if (quoted && content[index + 1] === '"') {
        value += '"'
        index += 1
      } else {
        quoted = !quoted
      }
    } else if (character === "," && !quoted) {
      row.push(value)
      value = ""
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && content[index + 1] === "\n") index += 1
      row.push(value)
      if (row.some((cell) => cell.trim())) rows.push(row)
      row = []
      value = ""
    } else {
      value += character
    }
  }

  row.push(value)
  if (row.some((cell) => cell.trim())) rows.push(row)
  return rows
}

export default function MenuPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [showSidebar, setShowSidebar] = useState(true)
  const [isAddProductOpen, setIsAddProductOpen] = useState(false)
  const [isEditProductOpen, setIsEditProductOpen] = useState(false)
  const [currentProduct, setCurrentProduct] = useState<FoodItem | undefined>(undefined)
  const [products, setProducts] = useState<FoodItem[]>([])
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [isBulkMode, setIsBulkMode] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [isExcelLoading, setIsExcelLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [importStatus, setImportStatus] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const categories = useMemo(() => [...new Set(products.map((item) => item.category))], [products])
  const canManage = user?.memberRole === "owner" || user?.memberRole === "manager"

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
    if (!user?.restaurant_id) return
    let active = true
    void productsApi
      .getAll(user.restaurant_id)
      .then((fetchedProducts) => {
        if (active) setProducts(fetchedProducts)
      })
      .catch(() => {
        toast({
          title: "Veri yüklenemedi",
          description: "Veriler yüklenirken bir hata oluştu.",
          variant: "destructive",
        })
      })
    return () => {
      active = false
    }
  }, [toast, user?.restaurant_id])

  const handleImportDialogChange = (open: boolean) => {
    setIsImportDialogOpen(open)
    if (!open) {
      setSelectedFile(null)
      setImportError(null)
      setImportStatus(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  useEffect(() => {
    if (!user && !isLoading) router.replace("/login")
  }, [isLoading, router, user])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  if (!user) return null

  const handleAddItem = () => {
    if (!canManage) return
    setCurrentProduct(undefined)
    setIsAddProductOpen(true)
  }

  const handleEditItem = (id: string) => {
    if (!canManage) return
    const product = products.find((item) => item.id === id)
    if (product) {
      setCurrentProduct({ ...product })
      setIsEditProductOpen(true)
    }
  }

  const handleDeleteItem = async (id: string) => {
    if (!canManage) return
    if (!user || !user.restaurant_id) {
      toast({ title: "Hata", description: "Kullanıcı veya restoran bilgisi eksik.", variant: "destructive" })
      return
    }
    try {
      const success = await productsApi.delete(id, user.restaurant_id) // Pass restaurant_id
      if (success) {
        const updatedProducts = products.filter((item) => item.id !== id)
        setProducts(updatedProducts)
        toast({ title: "Ürün silindi", description: "Ürün başarıyla silindi." })
      } else {
        throw new Error("Delete failed")
      }
    } catch {
      toast({ title: "Hata", description: "Ürün silinirken bir hata oluştu.", variant: "destructive" })
    }
  }

  const handleSaveProduct = async (productFormData: FoodItem) => {
    if (!canManage) return
    if (!user || !user.restaurant_id) {
      toast({ title: "Hata", description: "Kullanıcı veya restoran bilgisi eksik.", variant: "destructive" })
      return
    }

    try {
      let result: FoodItem | null
      const payload = {
        title: productFormData.title,
        description: productFormData.description,
        price: productFormData.price,
        image: productFormData.image,
        category_id: productFormData.category_id,
        category: productFormData.category,
        available: productFormData.available,
        type: productFormData.type,
        discount: productFormData.discount,
        stock: productFormData.stock,
        restaurant_id: user.restaurant_id,
      }

      if (products.some((item) => item.id === productFormData.id)) {
        // Update existing product
        // For update, productsApi.update expects (productId, partialPayload, restaurant_id)
        const { restaurant_id, ...updatePayload } = payload // restaurant_id is passed as separate param for update
        result = await productsApi.update(productFormData.id, updatePayload, restaurant_id)
        if (result) {
          const updatedProduct = result
          setProducts(products.map((item) => (item.id === productFormData.id ? updatedProduct : item)))
          toast({ title: "Ürün güncellendi", description: "Ürün başarıyla güncellendi." })
        }
      } else {
        // Add new product
        result = await productsApi.create(payload)
        if (result) {
          setProducts([...products, result])
          toast({ title: "Ürün eklendi", description: "Ürün başarıyla eklendi." })
        }
      }

      if (!result) {
        throw new Error("API call failed")
      }
      setIsAddProductOpen(false)
      setIsEditProductOpen(false)
    } catch {
      toast({ title: "Hata", description: "İşlem sırasında bir hata oluştu.", variant: "destructive" })
    }
  }

  const toggleBulkMode = () => {
    setIsBulkMode(!isBulkMode)
    setSelectedProducts([])

    if (!isBulkMode) {
      toast({
        title: "Toplu işlem modu açıldı",
        description: "Silmek istediğiniz ürünleri sağ üst köşedeki kutucuklardan seçin.",
      })
    }
  }

  const toggleProductSelection = (id: string) => {
    setSelectedProducts((prev) => {
      if (prev.includes(id)) {
        return prev.filter((productId) => productId !== id)
      } else {
        return [...prev, id]
      }
    })
  }

  const handleBulkDelete = async () => {
    if (!canManage) return
    if (selectedProducts.length === 0) {
      toast({
        title: "Seçili ürün yok",
        description: "Lütfen silmek istediğiniz ürünleri seçin.",
        variant: "destructive",
      })
      return
    }

    try {
      const deletePromises = selectedProducts.map((id) => productsApi.delete(id))
      await Promise.all(deletePromises)

      const updatedProducts = products.filter((product) => !selectedProducts.includes(product.id))
      const deletedCount = products.length - updatedProducts.length

      setProducts(updatedProducts)
      setSelectedProducts([])

      toast({
        title: "Ürünler silindi",
        description: `${deletedCount} ürün başarıyla silindi.`,
      })

      setIsBulkMode(false)
    } catch {
      toast({
        title: "Hata",
        description: "Ürünler silinirken bir hata oluştu.",
        variant: "destructive",
      })
    }
  }

  const downloadCsv = (rows: Array<Array<string | number | boolean>>, fileName: string) => {
    const content = `\uFEFF${rows.map((row) => row.map(escapeCsvCell).join(",")).join("\r\n")}`
    const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }))
    const link = document.createElement("a")
    link.href = url
    link.download = fileName
    link.click()
    URL.revokeObjectURL(url)
  }

  const exportToExcel = () => {
    setIsExcelLoading(true)
    const header = ["Ürün Adı", "Açıklama", "Fiyat", "Kategori", "Tür", "Mevcut", "İndirim", "Stok", "Resim URL"]
    const rows = products.map((product) => [
      product.title,
      product.description || "",
      product.price,
      product.category,
      product.type,
      product.available ? "Evet" : "Hayır",
      product.discount || 0,
      product.stock ?? "",
      product.image || "",
    ])
    downloadCsv([header, ...rows], "menu-urunleri.csv")
    setIsExcelLoading(false)
    toast({ title: "Dışa aktarma tamamlandı", description: "Ürünler CSV formatında dışa aktarıldı." })
  }

  const downloadTemplate = () => {
    downloadCsv(
      [
        ["Ürün Adı", "Açıklama", "Fiyat", "Kategori", "Tür", "Mevcut", "İndirim", "Stok", "Resim URL"],
        ["Örnek Ürün", "Örnek açıklama", 100, "Ana Yemek", "Et", "Evet", 0, 20, ""],
      ],
      "urun-import-sablonu.csv",
    )
    toast({ title: "Şablon indirildi", description: "CSV şablonu hazırlandı." })
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null)
    setImportStatus(null)

    const file = e.target.files?.[0]
    if (!file) {
      setSelectedFile(null)
      return
    }

    if (!file.name.toLocaleLowerCase("tr-TR").endsWith(".csv")) {
      setImportError("Lütfen geçerli bir CSV dosyası seçin.")
      setSelectedFile(null)
      return
    }

    setSelectedFile(file)
    setImportStatus(`"${file.name}" dosyası seçildi. İçe aktarmak için "İçe Aktar" butonuna tıklayın.`)
  }

  const processExcelFile = async () => {
    if (!selectedFile) {
      setImportError("Lütfen önce bir dosya seçin.")
      return
    }

    setIsExcelLoading(true)
    setImportError(null)
    setImportStatus("Dosya işleniyor...")

    try {
      if (!user?.restaurant_id) throw new Error("Restoran üyeliği bulunamadı.")
      const rows = parseCsv(await selectedFile.text())
      if (rows.length < 2) throw new Error("CSV dosyasında ürün satırı bulunamadı.")
      const headers = rows[0].map((header) => header.replace(/^\uFEFF/, "").trim())
      const importedProducts: FoodItem[] = []

      for (const [index, cells] of rows.slice(1).entries()) {
        const record = Object.fromEntries(headers.map((header, cellIndex) => [header, cells[cellIndex]?.trim() || ""]))
        const price = Number(record["Fiyat"].replace(",", "."))
        if (!record["Ürün Adı"] || !Number.isFinite(price) || price < 0) {
          throw new Error(`${index + 2}. satırda ürün adı veya fiyat geçersiz.`)
        }

        const created = await productsApi.create({
          title: record["Ürün Adı"],
          description: record["Açıklama"],
          price,
          image: record["Resim URL"] || undefined,
          category: record["Kategori"] || "Diğer",
          available: record["Mevcut"].toLocaleLowerCase("tr-TR") !== "hayır",
          type: record["Tür"] === "Vejeteryan" ? "Vejeteryan" : "Et",
          discount: Number(record["İndirim"].replace(",", ".")) || 0,
          stock: record["Stok"] ? Number(record["Stok"].replace(",", ".")) : undefined,
          restaurant_id: user.restaurant_id,
        })
        if (created) importedProducts.push(created)
      }

      setProducts((current) => [...importedProducts, ...current])
      toast({ title: "İçe aktarma tamamlandı", description: `${importedProducts.length} ürün veritabanına eklendi.` })
      handleImportDialogChange(false)
    } catch (cause) {
      setImportError(cause instanceof Error ? cause.message : "CSV dosyası işlenemedi.")
      setImportStatus(null)
    } finally {
      setIsExcelLoading(false)
    }
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {showSidebar && <SidebarNav />}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header showMobileMenu={!showSidebar} onMenuToggle={() => setShowSidebar(!showSidebar)} />
        <div className="flex-1 overflow-auto p-4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">{canManage ? "Menü Yönetimi" : "Menü"}</h1>
            <div className="flex gap-2">
              {canManage && isBulkMode ? (
                <>
                  <Button variant="outline" onClick={toggleBulkMode} className="gap-2">
                    <X className="h-4 w-4" /> Toplu Modu Kapat
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleBulkDelete}
                    disabled={selectedProducts.length === 0}
                    className="gap-2 transition-all duration-200"
                    style={{
                      opacity: selectedProducts.length > 0 ? 1 : 0.5,
                      transform: selectedProducts.length > 0 ? "scale(1.05)" : "scale(1)",
                    }}
                  >
                    <Trash className="h-4 w-4" />
                    Seçilenleri Sil ({selectedProducts.length})
                  </Button>
                </>
              ) : canManage ? (
                <>
                  <Button variant="outline" onClick={() => setIsImportDialogOpen(true)} className="gap-2">
                    <FileUp className="h-4 w-4" /> İçe Aktar
                  </Button>
                  <Button variant="outline" onClick={exportToExcel} className="gap-2" disabled={isExcelLoading}>
                    <FileDown className="h-4 w-4" />
                    {isExcelLoading ? "İşleniyor..." : "Dışa Aktar"}
                  </Button>
                  <Button variant="outline" onClick={toggleBulkMode} className="gap-2">
                    <CheckSquare className="h-4 w-4" /> Toplu İşlem
                  </Button>
                  <Button onClick={handleAddItem} className="gap-2">
                    <Plus className="h-4 w-4" /> Yeni Ürün
                  </Button>
                </>
              ) : (
                <Button variant="outline" onClick={exportToExcel} className="gap-2" disabled={isExcelLoading}>
                  <FileDown className="h-4 w-4" />
                  {isExcelLoading ? "İşleniyor..." : "Dışa Aktar"}
                </Button>
              )}
            </div>
          </div>

          <div className="mb-6">
            <Input
              placeholder="Menüde ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
          </div>

          {categories.length > 0 ? (
            <Tabs defaultValue={categories[0]}>
              <TabsList className="mb-4 overflow-auto">
                {categories.map((category) => (
                  <TabsTrigger key={category} value={category}>
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>

              {categories.map((category) => (
                <TabsContent key={category} value={category}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products
                      .filter((item) => item.category === category)
                      .filter(
                        (item) =>
                          searchQuery === "" ||
                          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.description?.toLowerCase().includes(searchQuery.toLowerCase()),
                      )
                      .map((item) => (
                        <Card
                          key={item.id}
                          className={`relative ${selectedProducts.includes(item.id) ? "border-2 border-primary" : ""}`}
                        >
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg">{item.title}</CardTitle>
                            {canManage && isBulkMode && (
                              <div className="absolute top-3 right-3 z-10">
                                <Checkbox
                                  id={`select-${item.id}`}
                                  checked={selectedProducts.includes(item.id)}
                                  onCheckedChange={() => toggleProductSelection(item.id)}
                                  className="h-5 w-5 border-2 bg-white"
                                />
                              </div>
                            )}
                          </CardHeader>
                          <CardContent className="pb-2">
                            <div className="aspect-w-4 aspect-h-3 mb-3 overflow-hidden rounded-md">
                              <ProductImage
                                src={item.image || "/placeholder.svg?height=160&width=320"}
                                alt={item.title}
                                className="object-cover w-full h-full"
                              />
                            </div>
                            <p className="text-sm text-gray-500">{item.description}</p>
                            <div className="mt-2">
                              <p className="font-semibold">{formatCurrency(item.price)}</p>
                              <p className="text-sm">
                                <span className="font-medium">Kategori:</span> {item.category}
                              </p>
                              <p className="text-sm">
                                <span className="font-medium">Tür:</span> {item.type}
                              </p>
                              {(item.discount ?? 0) > 0 && (
                                <p className="text-sm text-orange-600">
                                  <span className="font-medium">İndirim:</span> %{item.discount}
                                </p>
                              )}
                            </div>
                          </CardContent>
                          {canManage && (
                            <CardFooter className="flex justify-end gap-2">
                            {!isBulkMode && (
                              <>
                                <Button variant="outline" size="sm" onClick={() => handleEditItem(item.id)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => handleDeleteItem(item.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            </CardFooter>
                          )}
                        </Card>
                      ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <EmptyState
              type="products"
              onAction={canManage ? handleAddItem : undefined}
              actionLabel={canManage ? "İlk Ürünü Ekle" : undefined}
            />
          )}
        </div>
      </div>

      {canManage && isAddProductOpen && (
        <ProductForm open={isAddProductOpen} onOpenChange={setIsAddProductOpen} onSave={handleSaveProduct} />
      )}

      {canManage && isEditProductOpen && (
        <ProductForm
          open={isEditProductOpen}
          onOpenChange={setIsEditProductOpen}
          initialData={currentProduct}
          onSave={handleSaveProduct}
        />
      )}

      <Dialog open={canManage && isImportDialogOpen} onOpenChange={handleImportDialogChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>CSV ile Ürün İçe Aktar</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex flex-col gap-2">
              <p className="text-sm text-muted-foreground">
                CSV dosyanızı yükleyin veya şablonu indirip doldurun.
              </p>
              <Button variant="outline" onClick={downloadTemplate} className="gap-2">
                <Download className="h-4 w-4" /> Şablonu İndir
              </Button>
            </div>

            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="excel-file">CSV Dosyası</Label>
              <Input
                id="excel-file"
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileSelect}
                ref={fileInputRef}
                disabled={isExcelLoading}
              />
            </div>

            {importStatus && (
              <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
                <p className="text-sm text-blue-700">{importStatus}</p>
              </div>
            )}

            {importError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Hata</AlertTitle>
                <AlertDescription>{importError}</AlertDescription>
              </Alert>
            )}

            <div className="bg-amber-50 p-3 rounded-md border border-amber-200">
              <h4 className="text-sm font-medium text-amber-800 mb-1">Önemli Notlar:</h4>
              <ul className="text-xs text-amber-700 list-disc pl-4 space-y-1">
                <li>Şablondaki tüm sütunları doldurun</li>
                <li>Tür sütunu için Et veya Vejeteryan değerlerini kullanın</li>
                <li>Mevcut sütunu için Evet veya Hayır değerlerini kullanın</li>
                <li>Fiyat ve İndirim sütunları sayısal değer olmalıdır</li>
              </ul>
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => handleImportDialogChange(false)} className="w-full sm:w-auto">
              İptal
            </Button>
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="gap-2 w-full sm:w-auto"
              disabled={isExcelLoading}
            >
              <Upload className="h-4 w-4" /> Dosya Seç
            </Button>
            <Button
              type="button"
              onClick={processExcelFile}
              className="gap-2 w-full sm:w-auto"
              disabled={isExcelLoading || !selectedFile}
            >
              <FileUp className="h-4 w-4" />
              {isExcelLoading ? "İşleniyor..." : "İçe Aktar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
