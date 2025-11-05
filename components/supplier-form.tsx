"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

interface Supplier {
  id: string
  name: string
  contactPerson: string
  email: string
  phone: string
  address: string
  notes?: string
}

interface SupplierFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: Supplier
  onSave: (supplier: Supplier) => void
}

export function SupplierForm({ open, onOpenChange, initialData, onSave }: SupplierFormProps) {
  const { toast } = useToast()
  const isEditing = !!initialData

  const [formData, setFormData] = useState<Supplier>(
    initialData || {
      id: Math.random().toString(36).substring(2, 9),
      name: "",
      contactPerson: "",
      email: "",
      phone: "",
      address: "",
      notes: "",
    },
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.phone) {
      toast({
        title: "Eksik bilgi",
        description: "Lütfen tedarikçi adı ve telefon numarası alanlarını doldurun.",
        variant: "destructive",
      })
      return
    }

    onSave(formData)
    onOpenChange(false)

    toast({
      title: isEditing ? "Tedarikçi güncellendi" : "Tedarikçi eklendi",
      description: isEditing
        ? `${formData.name} tedarikçisi başarıyla güncellendi.`
        : `${formData.name} tedarikçisi başarıyla eklendi.`,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Tedarikçiyi Düzenle" : "Yeni Tedarikçi Ekle"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Tedarikçi Adı
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="contactPerson" className="text-right">
                İletişim Kişisi
              </Label>
              <Input
                id="contactPerson"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                E-posta
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Telefon
              </Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="address" className="text-right">
                Adres
              </Label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="notes" className="text-right">
                Notlar
              </Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="col-span-3"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              İptal
            </Button>
            <Button type="submit">{isEditing ? "Kaydet" : "Ekle"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
