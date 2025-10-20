"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Switch } from "@/components/ui/switch"
import type { FoodItem, Category } from "@/lib/types"
import { PlusCircle, Save } from "lucide-react"
import { categoriesApi } from "@/lib/api"

interface ProductFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: FoodItem
  onSave: (product: FoodItem & { category_id: string }) => void
}

export function ProductForm({ open, onOpenChange, initialData, onSave }: ProductFormProps) {
  const { toast } = useToast()
  const isEditing = !!initialData
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("")

  const [formData, setFormData] = useState<FoodItem>({
    id: "",
    title: "",
    description: "",
    price: 0,
    image: "/placeholder.svg?height=160&width=320",
    category: "",
    available: true,
    type: "Et",
    discount: 0,
  })

  // Load categories when dialog opens
  useEffect(() => {
    if (open) {
      categoriesApi.getAllFull().then(setCategories).catch(console.error)
    }
  }, [open])

  // Update form data when initialData changes or dialog opens
  useEffect(() => {
    if (initialData && open) {
      setFormData({ ...initialData })
      // Find the category ID based on the category name
      const category = categories.find(c => c.name === initialData.category)
      setSelectedCategoryId(category?.id || "")
    } else if (!initialData && open) {
      // Reset form for new product
      setFormData({
        id: Math.random().toString(36).substring(2, 9),
        title: "",
        description: "",
        price: 0,
        image: "/placeholder.svg?height=160&width=320",
        category: "",
        available: true,
        type: "Et",
        discount: 0,
      })
      setSelectedCategoryId("")
    }
  }, [initialData, open, categories])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "price" || name === "discount" ? Number(value) : value,
    }))
  }

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      available: checked,
    }))
  }

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      type: e.target.value as "Et" | "Vejeteryan",
    }))
  }

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const categoryId = e.target.value
    const category = categories.find(c => c.id === categoryId)
    setSelectedCategoryId(categoryId)
    setFormData(prev => ({
      ...prev,
      category: category?.name || ""
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title || !selectedCategoryId || formData.price <= 0) {
      toast({
        title: "Eksik bilgi",
        description: "Lütfen ürün adı, kategori ve fiyat alanlarını doldurun.",
        variant: "destructive",
      })
      return
    }

    onSave({ ...formData, category_id: selectedCategoryId })
    onOpenChange(false)

    toast({
      title: isEditing ? "Ürün güncellendi" : "Ürün eklendi",
      description: isEditing
        ? `${formData.title} ürünü başarıyla güncellendi.`
        : `${formData.title} ürünü başarıyla eklendi.`,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Ürünü Düzenle" : "Yeni Ürün Ekle"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 items-center gap-4">
              <Label htmlFor="title">Ürün Adı</Label>
              <Input id="title" name="title" value={formData.title} onChange={handleChange} required />
            </div>

            <div className="grid grid-cols-2 items-center gap-4">
              <Label htmlFor="category">Kategori</Label>
              <select
                id="category"
                name="category"
                value={selectedCategoryId}
                onChange={handleCategoryChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
              >
                <option key="empty" value="">Kategori seçin</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 items-center gap-4">
              <Label htmlFor="price">Fiyat (₺)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={handleChange}
                required
              />
            </div>

            <div className="grid grid-cols-2 items-center gap-4">
              <Label htmlFor="discount">İndirim (%)</Label>
              <Input
                id="discount"
                name="discount"
                type="number"
                min="0"
                max="100"
                value={formData.discount || 0}
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-2 items-center gap-4">
              <Label htmlFor="type">Tür</Label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleTypeChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option key="Et" value="Et">Et</option>
                <option key="Vejeteryan" value="Vejeteryan">Vejeteryan</option>
              </select>
            </div>

            <div className="grid grid-cols-2 items-center gap-4">
              <Label htmlFor="available">Mevcut</Label>
              <div className="flex items-center">
                <Switch id="available" checked={formData.available} onCheckedChange={handleSwitchChange} />
              </div>
            </div>

            <div className="grid grid-cols-2 items-start gap-4">
              <Label htmlFor="description">Açıklama</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description || ""}
                onChange={handleChange}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 items-center gap-4">
              <Label htmlFor="image">Resim URL</Label>
              <Input
                id="image"
                name="image"
                value={formData.image}
                onChange={handleChange}
                placeholder="/placeholder.svg?height=160&width=320"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              İptal
            </Button>
            <Button type="submit">
              {isEditing ? <Save className="mr-2 h-4 w-4" /> : <PlusCircle className="mr-2 h-4 w-4" />}
              {isEditing ? "Kaydet" : "Ekle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
