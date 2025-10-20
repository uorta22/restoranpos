"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DialogHeader, DialogTitle, DialogFooter, DialogContent, Dialog } from "@/components/ui/dialog"
import { useCart } from "@/context/cart-context"
import { useOrderContext } from "@/context/order-context"
import { useToast } from "@/hooks/use-toast"
import { MapPin, Phone, User, Home, CreditCard, Banknote } from "lucide-react"
import { CustomerTrackingLink } from "@/components/customer-tracking-link"
import { Badge } from "@/components/ui/badge"

interface DeliveryFormProps {
  onClose: () => void
}

export function DeliveryForm({ onClose }: DeliveryFormProps) {
  const { items, clearCart } = useCart()
  const { createOrder } = useOrderContext()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showTrackingLink, setShowTrackingLink] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    notes: "",
  })

  const [paymentMethod, setPaymentMethod] = useState<"Nakit" | "Kredi Kartı" | "Yemek Param" | null>(null)
  const [selectedMealCard, setSelectedMealCard] = useState<string | null>(null)
  const [isMealCardDialogOpen, setIsMealCardDialogOpen] = useState(false)

  const mealCardOptions = [
    { id: "sodexo", name: "Sodexo", logo: "/images/sodexo-logo.png" },
    { id: "multinet", name: "Multinet", logo: "/images/multinet-logo.png" },
    { id: "ticket", name: "Ticket Restaurant", logo: "/images/ticket-logo.png" },
    { id: "setcard", name: "SetCard", logo: "/images/setcard-logo.png" },
    { id: "metropol", name: "MetropolCard", logo: "/images/metropol-logo.png" },
    { id: "paye", name: "Paye Kart", logo: "/images/paye-logo.png" },
  ]

  // Calculate total with validation
  const calculateTotal = () => {
    if (!items || items.length === 0) return 0

    const total = items.reduce((sum, item) => {
      const itemPrice = item?.foodItem?.price || 0
      const quantity = item?.quantity || 0
      return sum + itemPrice * quantity
    }, 0)

    return Math.max(0, total) // Ensure non-negative
  }

  const orderTotal = calculateTotal()

  const handleMealCardSelect = (cardId: string) => {
    setSelectedMealCard(cardId)
    setIsMealCardDialogOpen(false)

    // Find the card name
    const cardName = mealCardOptions.find((card) => card.id === cardId)?.name || cardId

    toast({
      title: "Yemek kartı seçildi",
      description: `${cardName} ile ödeme seçildi`,
    })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.name || !formData.phone || !formData.address) {
      toast({
        title: "Eksik bilgi",
        description: "Lütfen tüm zorunlu alanları doldurun",
        variant: "destructive",
      })
      return
    }

    if (!items || items.length === 0) {
      toast({
        title: "Sepet boş",
        description: "Sipariş vermek için sepete ürün ekleyin",
        variant: "destructive",
      })
      return
    }

    if (orderTotal <= 0) {
      toast({
        title: "Geçersiz tutar",
        description: "Sipariş tutarı geçerli değil",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    let orderNotesWithPayment = formData.notes
    if (paymentMethod === "Yemek Param" && selectedMealCard) {
      const mealCardName = mealCardOptions.find((card) => card.id === selectedMealCard)?.name || selectedMealCard
      orderNotesWithPayment = `Ödeme: ${mealCardName}\n${formData.notes}`
    }

    try {
      console.log("DEBUG - Cart items:", items)
      console.log("DEBUG - Order total:", orderTotal)
      console.log("DEBUG - Form data:", formData)

      const orderData = {
        items,
        total: orderTotal,
        customerName: formData.name,
        notes: orderNotesWithPayment,
        tableId: null,
        isDelivery: true,
        deliveryAddress: {
          address: formData.address,
          phone: formData.phone,
          customerName: formData.name,
        },
      }

      console.log("Creating order with data:", orderData)

      const order = await createOrder(orderData)

      if (order) {
        clearCart()
        setOrderId(order.id)
        setShowTrackingLink(true)

        toast({
          title: "Sipariş alındı",
          description: "Paket servis siparişiniz başarıyla oluşturuldu",
        })
      } else {
        throw new Error("Order creation failed")
      }
    } catch (error) {
      console.error("Order creation error:", error)
      toast({
        title: "Hata",
        description: "Sipariş oluşturulurken bir hata oluştu",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
      setPaymentMethod(null)
      setSelectedMealCard(null)
    }
  }

  return (
    <div>
      <DialogHeader>
        <DialogTitle>Paket Servis Bilgileri</DialogTitle>
      </DialogHeader>

      {!showTrackingLink ? (
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Order Summary */}
          <div className="bg-gray-50 p-3 rounded-md">
            <h3 className="font-medium mb-2">Sipariş Özeti</h3>
            <div className="space-y-1 text-sm">
              {items.map((item, index) => (
                <div key={index} className="flex justify-between">
                  <span>
                    {item.quantity}x {item.foodItem.title}
                  </span>
                  <span>{(item.quantity * item.foodItem.price).toFixed(2)} ₺</span>
                </div>
              ))}
              <div className="border-t pt-1 font-medium flex justify-between">
                <span>Toplam:</span>
                <span>{orderTotal.toFixed(2)} ₺</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center">
              <User className="h-4 w-4 mr-2" />
              Adınız Soyadınız
            </Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Adınızı ve soyadınızı girin"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center">
              <Phone className="h-4 w-4 mr-2" />
              Telefon Numaranız
            </Label>
            <Input
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="05XX XXX XX XX"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="flex items-center">
              <MapPin className="h-4 w-4 mr-2" />
              Adres
            </Label>
            <Textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Teslimat adresinizi girin"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="flex items-center">
              <Home className="h-4 w-4 mr-2" />
              Adres Tarifi / Notlar
            </Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Adres tarifi veya ek notlar"
            />
          </div>

          <div className="border rounded-md p-3 mt-4">
            <h3 className="font-medium mb-2">Ödeme Yöntemi</h3>
            <div className="space-y-2">
              <Button
                type="button"
                variant={paymentMethod === "Kredi Kartı" ? "default" : "outline"}
                className="w-full justify-start h-12"
                onClick={() => setPaymentMethod("Kredi Kartı")}
              >
                <CreditCard className="mr-2 h-5 w-5" />
                Kredi Kartı
              </Button>
              <Button
                type="button"
                variant={paymentMethod === "Nakit" ? "default" : "outline"}
                className="w-full justify-start h-12"
                onClick={() => setPaymentMethod("Nakit")}
              >
                <Banknote className="mr-2 h-5 w-5" />
                Nakit
              </Button>
              <Button
                type="button"
                variant={paymentMethod === "Yemek Param" ? "default" : "outline"}
                className="w-full justify-start h-12"
                onClick={() => {
                  setPaymentMethod("Yemek Param")
                  setIsMealCardDialogOpen(true)
                }}
              >
                <CreditCard className="mr-2 h-5 w-5" />
                Yemek Param
                {selectedMealCard && (
                  <Badge className="ml-2 bg-green-100 text-green-800 border-green-200">
                    {mealCardOptions.find((card) => card.id === selectedMealCard)?.name}
                  </Badge>
                )}
              </Button>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              İptal
            </Button>
            <Button type="submit" disabled={isSubmitting || orderTotal <= 0}>
              {isSubmitting ? "Gönderiliyor..." : `Siparişi Tamamla (${orderTotal.toFixed(2)} ₺)`}
            </Button>
          </DialogFooter>
        </form>
      ) : (
        <div className="py-6">
          <div className="text-center mb-6">
            <div className="bg-green-50 text-green-700 p-3 rounded-md mb-4">Siparişiniz başarıyla oluşturuldu!</div>
            <p className="text-lg font-medium mb-2">Sipariş Numaranız:</p>
            <p className="text-2xl font-bold mb-4">#{orderId?.slice(-6)}</p>
            <p className="text-sm text-gray-500">Siparişinizi aşağıdaki bağlantıdan takip edebilirsiniz.</p>
          </div>

          {orderId && <CustomerTrackingLink orderId={orderId} />}

          <div className="mt-6 text-center">
            <Button onClick={onClose}>Kapat</Button>
          </div>
        </div>
      )}

      {/* Meal Card Selection Dialog */}
      <Dialog open={isMealCardDialogOpen} onOpenChange={setIsMealCardDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yemek Kartı Seçin</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            {mealCardOptions.map((card) => (
              <Button
                key={card.id}
                variant="outline"
                className="h-24 flex flex-col items-center justify-center gap-2"
                onClick={() => handleMealCardSelect(card.id)}
              >
                <img src={card.logo || "/placeholder.svg"} alt={card.name} className="h-10 object-contain" />
                <span>{card.name}</span>
              </Button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMealCardDialogOpen(false)}>
              İptal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
