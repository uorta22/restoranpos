"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTableContext } from "@/context/table-context"
import type { Reservation } from "@/lib/types"

interface ReservationFormValue extends Omit<Reservation, "tableNumber"> {
  time: string
  tableNumber: string
  notes: string
}

interface ReservationFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: ReservationFormValue
  onSave: (reservation: ReservationFormValue) => void
}

export function ReservationForm({ open, onOpenChange, initialData, onSave }: ReservationFormProps) {
  const { toast } = useToast()
  const { tables } = useTableContext()
  const isEditing = Boolean(initialData?.id)

  const [formData, setFormData] = useState<ReservationFormValue>(() =>
    initialData ?? {
      id: "",
      customerName: "",
      date: new Date(),
      time: "19:00",
      people: 2,
      tableNumber: "",
      phone: "",
      notes: "",
      status: "Beklemede",
    },
  )

  const available = tables.filter((table) => table.status === "Müsait")
  const selected = initialData?.tableNumber
    ? tables.find((table) => table.number === initialData.tableNumber)
    : undefined
  const tableChoices = selected && !available.some((table) => table.id === selected.id) ? [...available, selected] : available
  const availableTables = tableChoices.map((table) => ({ id: table.id, number: table.number, capacity: table.capacity }))

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "people" ? Number(value) : value,
    }))
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      date: new Date(e.target.value),
    }))
  }

  const handleStatusChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      status: value as "Beklemede" | "Onaylandı" | "İptal Edildi",
    }))
  }

  const handleTableChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      tableNumber: value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.customerName || !formData.phone) {
      toast({
        title: "Eksik bilgi",
        description: "Lütfen müşteri adı ve telefon numarası alanlarını doldurun",
        variant: "destructive",
      })
      return
    }

    // Tarih ve saat birleştirme
    const [hours, minutes] = formData.time.split(":")
    const reservationDate = new Date(formData.date)
    reservationDate.setHours(Number(hours), Number(minutes))

    const finalData = {
      ...formData,
      date: reservationDate,
    }

    onSave(finalData)
    onOpenChange(false)

    toast({
      title: isEditing ? "Rezervasyon güncellendi" : "Rezervasyon eklendi",
      description: isEditing
        ? `${formData.customerName} rezervasyonu başarıyla güncellendi.`
        : `${formData.customerName} için yeni rezervasyon başarıyla eklendi.`,
    })
  }

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split("T")[0]
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Rezervasyonu Düzenle" : "Yeni Rezervasyon"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="customerName" className="text-right">
                Müşteri Adı
              </Label>
              <Input
                id="customerName"
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
                className="col-span-3"
                required
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
              <Label htmlFor="date" className="text-right">
                Tarih
              </Label>
              <Input
                id="date"
                type="date"
                value={formatDateForInput(formData.date)}
                onChange={handleDateChange}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="time" className="text-right">
                Saat
              </Label>
              <Input
                id="time"
                name="time"
                type="time"
                value={formData.time}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="people" className="text-right">
                Kişi Sayısı
              </Label>
              <Input
                id="people"
                name="people"
                type="number"
                min="1"
                value={formData.people}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tableNumber" className="text-right">
                Masa
              </Label>
              <Select value={formData.tableNumber} onValueChange={handleTableChange}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Masa seçin" />
                </SelectTrigger>
                <SelectContent>
                  {availableTables.map((table) => (
                    <SelectItem key={table.id} value={table.number}>
                      {table.number} ({table.capacity} Kişilik)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Durum
              </Label>
              <Select value={formData.status} onValueChange={handleStatusChange}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Durum seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Beklemede">Beklemede</SelectItem>
                  <SelectItem value="Onaylandı">Onaylandı</SelectItem>
                  <SelectItem value="İptal Edildi">İptal Edildi</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="notes" className="text-right">
                Notlar
              </Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes || ""}
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
