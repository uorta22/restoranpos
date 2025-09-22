"use client"

import type React from "react"

import { ProductForm } from "@/components/product-form"
import { useState, useEffect, useRef } from "react"
import { Header } from "@/components/header"
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
import Script from "next/script"

// Import API functions
import { productsApi } from "@/lib/api"
// Import EmptyState component
import { EmptyState } from "@/components/empty-state"

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
  const [isExcelScriptLoaded, setIsExcelScriptLoaded] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [importStatus, setImportStatus] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [initialLoadDone, setInitialLoadDone] = useState(false)
  const [categories, setCategories] = useState<string[]>([])
  const [shouldRedirect, setShouldRedirect] = useState(false)
  const [
    /* @ts-expect-error: unused variable */ isDatabaseSetup,
    /* @ts-expect-error: unused variable */ setIsDatabaseSetup,
  ] = useState<boolean | null>(null)
  const [
    /* @ts-expect-error: unused variable */ isSettingUpDatabase,
    /* @ts-expect-error: unused variable */ setIsSettingUpDatabase,
  ] = useState(false)

  // Responsive sidebar kontrolü
  useEffect(() => {
    const handleResize = () => {
      setShowSidebar(window.innerWidth >= 768)
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Excel kütüphanesini yükle
  useEffect(() => {
    if (typeof window !== "undefined" && window.XLSX) {
      setIsExcelScriptLoaded(true)
      return
    }

    const script = document.createElement("script")
    script.src = "https://cdn.sheetjs.com/xlsx-0.19.3/package/dist/xlsx.full.min.js"
    script.async = true
    script.onload = () => {
      console.log("Excel kütüphanesi yüklendi")
      setIsExcelScriptLoaded(true)
    }
    script.onerror = () => {
      console.error("Excel kütüphanesi yüklenemedi")
      toast({
        title: "Excel kütüphanesi yüklenemedi",
        description: "Excel işlemleri kullanılamayabilir.",
        variant: "destructive",
      })
    }
    document.body.appendChild(script)

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [toast])

  // Ensure FoodItem type from "@/lib/types" includes category_id and restaurant_id if you use it directly for state.
  // Or rely on the return type of productsApi.getAll().

  // ... (useState declarations)
  // const [categories, setCategories] = useState<string[]>([]); // This should ideally be Category[]
  // For now, we'll adapt, but this is a point for future refactoring.

  // useEffect to load data
  useEffect(() => {
    const loadData = async () => {
      if (!user || !user.restaurant_id) {
        if (initialLoadDone && !isLoading) {
          toast({
            title: "Kullanıcı bilgileri eksik",
            description: "Restoran verileri yüklenemedi. Lütfen tekrar giriş yapın.",
            variant: "warning",
          })
        }
        return
      }
      try {
        const fetchedProducts = await productsApi.getAll(user.restaurant_id)
        setProducts(fetchedProducts)

        // Temporary category handling: derive from fetched products until categoriesApi is refactored
        const uniqueCategoryNames = [...new Set(fetchedProducts.map((p) => p.category).filter(Boolean))]
        setCategories(uniqueCategoryNames)

        // Ideal category fetching (requires categoriesApi to be restaurant_id aware and return Category[]):
        // const fetchedCategories = await categoriesApi.getAll(user.restaurant_id);
        // setCategories(fetchedCategories); // Assuming setCategories expects Category[]
      } catch (error) {
        console.error("Failed to load data:", error)
        toast({
          title: "Veri yüklenemedi",
          description: "Veriler yüklenirken bir hata oluştu.",
          variant: "destructive",
        })
      } finally {
        setInitialLoadDone(true)
      }
    }

    if (user && user.restaurant_id) {
      // Avoid re-fetching if data is already loaded and initialLoadDone is true,
      // unless there's a specific trigger to reload (e.g. products state changes elsewhere).
      // For simplicity, this loads when user/restaurant_id becomes available.
      loadData()
    } else if (!isLoading && !user) {
      setInitialLoadDone(true)
    }
    // }, [user, isLoading, toast, initialLoadDone]); // Original
  }, [user, user?.restaurant_id, isLoading, toast]) // Refined dependencies, remove initialLoadDone if loadData sets it. Re-add if needed for specific logic.

  // products değiştiğinde kategorileri otomatik güncelle
  useEffect(() => {
    const updatedCategories = [...new Set(products.map((item) => item.category))]
    setCategories(updatedCategories)
  }, [products])

  // Dialog kapandığında state'leri sıfırla
  useEffect(() => {
    if (!isImportDialogOpen) {
      setSelectedFile(null)
      setImportError(null)
      setImportStatus(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }, [isImportDialogOpen])

  // Auth kontrolü
  useEffect(() => {
    if (!user && !isLoading) {
      setShouldRedirect(true)
    }
  }, [user, isLoading])

  useEffect(() => {
    if (shouldRedirect) {
      router.push("/login")
    }
  }, [shouldRedirect, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  if (shouldRedirect) {
    return null
  }

  const handleAddItem = () => {
    setCurrentProduct(undefined)
    setIsAddProductOpen(true)
  }

  const handleEditItem = (id: string) => {
    const product = products.find((item) => item.id === id)
    if (product) {
      setCurrentProduct({ ...product })
      setIsEditProductOpen(true)
    }
  }

  const handleDeleteItem = async (id: string) => {
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
    } catch (error) {
      toast({ title: "Hata", description: "Ürün silinirken bir hata oluştu.", variant: "destructive" })
    }
  }

  const handleSaveProduct = async (productFormData: FoodItem) => {
    // productFormData comes from ProductForm.
    // CRITICAL ASSUMPTION: ProductForm's onSave provides `productFormData`
    // that includes `category_id`. If it only provides `category` (name),
    // you'll need to find the `category_id` here using a list of Category objects.
    // This example proceeds assuming `productFormData.category_id` is available.

    if (!user || !user.restaurant_id) {
      toast({ title: "Hata", description: "Kullanıcı veya restoran bilgisi eksik.", variant: "destructive" })
      return
    }

    if (!productFormData.category_id) {
      toast({
        title: "Eksik Bilgi",
        description: "Ürün kategorisi ID'si bulunamadı. Lütfen ürün formunu kontrol edin.",
        variant: "destructive",
      })
      // This indicates ProductForm needs to be updated to provide category_id.
      return
    }

    try {
      let result
      const payload = {
        title: productFormData.title,
        description: productFormData.description,
        price: productFormData.price,
        image: productFormData.image,
        category_id: productFormData.category_id, // Directly use from form data
        available: productFormData.available,
        type: productFormData.type,
        discount: productFormData.discount,
        stock: productFormData.stock,
        restaurant_id: user.restaurant_id, // Add restaurant_id from auth user
      }

      if (products.some((item) => item.id === productFormData.id)) {
        // Update existing product
        // For update, productsApi.update expects (productId, partialPayload, restaurant_id)
        const { restaurant_id, ...updatePayload } = payload // restaurant_id is passed as separate param for update
        result = await productsApi.update(productFormData.id, updatePayload, restaurant_id)
        if (result) {
          setProducts(products.map((item) => (item.id === productFormData.id ? result : item)))
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
    } catch (error) {
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
    } catch (error) {
      toast({
        title: "Hata",
        description: "Ürünler silinirken bir hata oluştu.",
        variant: "destructive",
      })
    }
  }

  const downloadExcelFile = (data: any[], fileName: string) => {
    try {
      if (typeof window === "undefined" || !window.XLSX) {
        toast({
          title: "Excel kütüphanesi yüklenemedi",
          description: "Lütfen sayfayı yenileyip tekrar deneyin.",
          variant: "destructive",
        })
        return false
      }

      const XLSX = window.XLSX
      const worksheet = XLSX.utils.json_to_sheet(data)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sayfa1")
      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      return true
    } catch (error) {
      console.error("Excel indirme hatası:", error)
      toast({
        title: "Excel indirme hatası",
        description: "Excel dosyası oluşturulurken bir hata oluştu.",
        variant: "destructive",
      })
      return false
    }
  }

  const exportToExcel = () => {
    setIsExcelLoading(true)

    try {
      const excelData = products.map((product) => ({
        ID: product.id,
        "Ürün Adı": product.title,
        Açıklama: product.description || "",
        Fiyat: product.price,
        Kategori: product.category,
        Tür: product.type,
        Mevcut: product.available ? "Evet" : "Hayır",
        İndirim: product.discount || 0,
        "Resim URL": product.image || "",
      }))

      const success = downloadExcelFile(excelData, "menu-urunleri.xlsx")

      if (success) {
        toast({
          title: "Dışa aktarma başarılı",
          description: "Ürünler Excel formatında dışa aktarıldı.",
        })
      }
    } finally {
      setIsExcelLoading(false)
    }
  }

  const downloadTemplate = () => {
    try {
      const templateData = [
        {
          "Ürün Adı": "Örnek Ürün",
          Açıklama: "Bu bir örnek ürün açıklamasıdır",
          Fiyat: 100,
          Kategori: "Ana Yemek",
          Tür: "Et",
          Mevcut: "Evet",
          İndirim: 0,
          "Resim URL": "/placeholder.svg?height=160&width=320",
        },
      ]

      const success = downloadExcelFile(templateData, "urun-import-sablonu.xlsx")

      if (success) {
        toast({
          title: "Şablon indirildi",
          description: "Excel şablonu başarıyla indirildi.",
        })
      }
    } catch (error) {
      console.error("Şablon indirme hatası:", error)
      toast({
        title: "Şablon indirme hatası",
        description: "Excel şablonu oluşturulurken bir hata oluştu.",
        variant: "destructive",
      })
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null)
    setImportStatus(null)

    const file = e.target.files?.[0]
    if (!file) {
      setSelectedFile(null)
      return
    }

    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      setImportError("Lütfen geçerli bir Excel dosyası (.xlsx veya .xls) seçin.")
      setSelectedFile(null)
      return
    }

    setSelectedFile(file)
    setImportStatus(`"${file.name}" dosyası seçildi. İçe aktarmak için "İçe Aktar" butonuna tıklayın.`)
  }

  const processExcelFile = () => {
    if (!selectedFile) {
      setImportError("Lütfen önce bir dosya seçin.")
      return
    }

    setIsExcelLoading(true)
    setImportError(null)
    setImportStatus("Dosya işleniyor...")

    const reader = new FileReader()

    reader.onload = (evt) => {
      try {
        if (!window.XLSX) {
          throw new Error("Excel kütüphanesi bulunamadı.")
        }

        const XLSX = window.XLSX
        const data = evt.target?.result

        if (!data) {
          throw new Error("Dosya içeriği okunamadı.")
        }

        const workbook = XLSX.read(data, { type: "binary" })

        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          throw new Error("Excel dosyasında sayfa bulunamadı.")
        }

        const worksheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[worksheetName]

        if (!worksheet) {
          throw new Error("Excel sayfası boş veya okunamadı.")
        }

        const jsonData = XLSX.utils.sheet_to_json(worksheet)

        if (!Array.isArray(jsonData) || jsonData.length === 0) {
          throw new Error("Excel dosyasında veri bulunamadı veya format uygun değil.")
        }

        const importedProducts: FoodItem[] = []

        for (let i = 0; i < jsonData.length; i++) {
          const row = jsonData[i]

          try {
            const product: FoodItem = {
              id: Math.random().toString(36).substring(2, 9),
              title: row["Ürün Adı"] || `Ürün ${i + 1}`,
              description: row["Açıklama"] || "",
              price: Number(row["Fiyat"]) || 0,
              category: row["Kategori"] || "Diğer",
              type: row["Tür"] === "Et" || row["Tür"] === "Vejeteryan" ? (row["Tür"] as "Et" | "Vejeteryan") : "Et",
              available: row["Mevcut"] === "Evet",
              discount: Number(row["İndirim"]) || 0,
              image: row["Resim URL"] || "/placeholder.svg?height=160&width=320",
            }

            importedProducts.push(product)
          } catch (error) {
            console.error(`Satır ${i + 1} işlenirken hata:`, error)
          }
        }

        if (importedProducts.length === 0) {
          throw new Error("Hiçbir ürün içe aktarılamadı. Lütfen dosya formatını kontrol edin.")
        }

        setProducts((prevProducts) => [...prevProducts, ...importedProducts])

        toast({
          title: "İçe aktarma başarılı",
          description: `${importedProducts.length} ürün başarıyla içe aktarıldı.`,
        })

        setIsImportDialogOpen(false)
      } catch (error: any) {
        console.error("Excel içe aktarma hatası:", error)
        setImportError(`Hata: ${error.message || "Excel dosyası işlenirken bir hata oluştu."}`)
        setImportStatus(null)
      } finally {
        setIsExcelLoading(false)
      }
    }

    reader.onerror = () => {
      setIsExcelLoading(false)
      setImportError("Dosya okunamadı. Lütfen dosyanın bozuk olmadığından emin olun.")
      setImportStatus(null)
    }

    reader.readAsBinaryString(selectedFile)
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Script
        src="https://cdn.sheetjs.com/xlsx-0.19.3/package/dist/xlsx.full.min.js"
        onLoad={() => {
          console.log("Excel kütüphanesi yüklendi")
          setIsExcelScriptLoaded(true)
        }}
        onError={(e) => {
          console.error("Excel kütüphanesi yüklenemedi:", e)
          toast({
            title: "Excel kütüphanesi yüklenemedi",
            description: "Excel işlemleri kullanılamayabilir.",
            variant: "destructive",
          })
        }}
        strategy="lazyOnload"
      />

      {showSidebar && <SidebarNav />}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header showMobileMenu={!showSidebar} onMenuToggle={() => setShowSidebar(!showSidebar)} />
        <div className="flex-1 overflow-auto p-4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Menü Yönetimi</h1>
            <div className="flex gap-2">
              {isBulkMode ? (
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
              ) : (
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
                            {isBulkMode && (
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
                              <img
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
                              {item.discount > 0 && (
                                <p className="text-sm text-orange-600">
                                  <span className="font-medium">İndirim:</span> %{item.discount}
                                </p>
                              )}
                            </div>
                          </CardContent>
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
                        </Card>
                      ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <EmptyState type="products" onAction={handleAddItem} actionLabel="İlk Ürünü Ekle" />
          )}
        </div>
      </div>

      <ProductForm open={isAddProductOpen} onOpenChange={setIsAddProductOpen} onSave={handleSaveProduct} />

      <ProductForm
        open={isEditProductOpen}
        onOpenChange={setIsEditProductOpen}
        initialData={currentProduct}
        onSave={handleSaveProduct}
      />

      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Excel'den Ürün İçe Aktar</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex flex-col gap-2">
              <p className="text-sm text-muted-foreground">
                Excel dosyanızı yükleyin veya şablonu indirin ve doldurun.
              </p>
              <Button variant="outline" onClick={downloadTemplate} className="gap-2">
                <Download className="h-4 w-4" /> Şablonu İndir
              </Button>
            </div>

            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="excel-file">Excel Dosyası</Label>
              <Input
                id="excel-file"
                type="file"
                accept=".xlsx, .xls"
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
                <li>Tür sütunu için "Et" veya "Vejeteryan" değerlerini kullanın</li>
                <li>Mevcut sütunu için "Evet" veya "Hayır" değerlerini kullanın</li>
                <li>Fiyat ve İndirim sütunları sayısal değer olmalıdır</li>
              </ul>
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsImportDialogOpen(false)} className="w-full sm:w-auto">
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
