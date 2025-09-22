"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useCart } from "@/context/cart-context"
import { useOrderContext } from "@/context/order-context"
import { useTableContext } from "@/context/table-context"
import { formatCurrency, getDiscountedPrice } from "@/lib/utils"
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Receipt,
  CreditCard,
  Banknote,
  X,
  Bike,
  Store,
  UtensilsCrossed,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ReceiptPrinter } from "@/components/receipt-printer"
import { DeliveryForm } from "@/components/delivery-form"
import type { Order } from "@/lib/types"
import { TableSelector } from "@/components/table-selector"

export function Cart() {
  const {
    items,
    removeItem,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice,
    tableName,
    customerName,
    tableId,
    setTableInfo,
  } = useCart()
  const { createOrder } = useOrderContext()
  const { assignOrderToTable, tables } = useTableContext()
  const { toast } = useToast()
  const [orderNotes, setOrderNotes] = useState("")
  const [isOrderTypeDialogOpen, setIsOrderTypeDialogOpen] = useState(false)
  const [isOrderSummaryDialogOpen, setIsOrderSummaryDialogOpen] = useState(false)
  const [isDeliveryFormOpen, setIsDeliveryFormOpen] = useState(false)
  const [isTableSelectorOpen, setIsTableSelectorOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<"Nakit" | "Kredi Kartı" | "Yemek Param" | null>(null)
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null)
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false)
  const [selectedOrderType, setSelectedOrderType] = useState<"Restoranda" | "Gel-Al" | "Paket Servis" | null>(null)
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

  const handleOpenOrderTypeDialog = () => {
    if (items.length === 0) {
      toast({
        title: "Sepet boş",
        description: "Lütfen sipariş vermeden önce ürün ekleyin",
        variant: "destructive",
      })
      return
    }
    setIsOrderTypeDialogOpen(true)
  }

  const handleOrderTypeSelect = (type: "Restoranda" | "Gel-Al" | "Paket Servis") => {
    setSelectedOrderType(type)
    setIsOrderTypeDialogOpen(false)

    // Sipariş tipine göre farklı akışlar - wait for the dialog to close first
    setTimeout(() => {
      if (type === "Restoranda") {
        setIsTableSelectorOpen(true)
      } else if (type === "Gel-Al") {
        setIsOrderSummaryDialogOpen(true)
      } else if (type === "Paket Servis") {
        setIsDeliveryFormOpen(true)
      }
    }, 100)
  }

  // Update the handleTableSelect function to create the order directly without showing the payment options dialog
  const handleTableSelect = (selectedTableId: string) => {
    // First close the dialog
    setIsTableSelectorOpen(false)

    // Then process the selection after dialog is closed
    setTimeout(() => {
      const selectedTable = tables.find((table) => table.id === selectedTableId)
      if (!selectedTable) {
        toast({
          title: "Hata",
          description: "Masa bulunamadı",
          variant: "destructive",
        })
        return
      }

      // SADECE sipariş oluştururken masa bilgisini set et, öncesinde değil
      createOrder(items, selectedTable.number, customerName || "Misafir", orderNotes, selectedTableId)
        .then((order) => {
          if (!order) {
            toast({
              title: "Hata",
              description: "Sipariş oluşturulamadı",
              variant: "destructive",
            })
            return
          }

          // Assign order to table
          assignOrderToTable(selectedTableId, order.id)

          // Şimdi masa bilgisini set et
          setTableInfo(selectedTableId, selectedTable.number, customerName || "Misafir")

          // Clear cart and show receipt
          clearCart()
          setOrderNotes("")
          setCurrentOrder(order)

          // Open receipt dialog after a small delay
          setTimeout(() => {
            setIsReceiptDialogOpen(true)
          }, 100)

          toast({
            title: "Adisyon başlatıldı",
            description: "Siparişiniz başarıyla oluşturuldu ve adisyon başlatıldı",
          })
        })
        .catch((error) => {
          toast({
            title: "Hata",
            description: "Sipariş oluşturulurken bir hata oluştu",
            variant: "destructive",
          })
        })
    }, 100)
  }

  // Update the handleCreateOrder function to handle all order types
  const handleCreateOrder = useCallback(() => {
    setIsProcessing(true)
    setIsOrderSummaryDialogOpen(false)

    // Add meal card info to the notes if selected
    let orderNotesWithPayment = orderNotes
    if (paymentMethod === "Yemek Param" && selectedMealCard) {
      const mealCardName = mealCardOptions.find((card) => card.id === selectedMealCard)?.name || selectedMealCard
      orderNotesWithPayment = `Ödeme: ${mealCardName}\n${orderNotes}`
    }

    // For restaurant orders, we need to create the order and assign it to the table
    if (selectedOrderType === "Restoranda" && tableId) {
      createOrder(items, tableName, customerName || "Misafir", orderNotesWithPayment, tableId)
        .then((order) => {
          if (!order) {
            toast({
              title: "Hata",
              description: "Sipariş oluşturulamadı",
              variant: "destructive",
            })
            setIsProcessing(false)
            return
          }

          // Assign order to table
          assignOrderToTable(tableId, order.id)

          // Clear cart and show receipt
          clearCart()
          setOrderNotes("")
          setCurrentOrder(order)

          // Open receipt dialog after a small delay
          setTimeout(() => {
            setIsReceiptDialogOpen(true)
          }, 100)

          toast({
            title: "Adisyon başlatıldı",
            description: "Siparişiniz başarıyla oluşturuldu ve adisyon başlatıldı",
          })
        })
        .catch((error) => {
          toast({
            title: "Hata",
            description: "Sipariş oluşturulurken bir hata oluştu",
            variant: "destructive",
          })
        })
        .finally(() => {
          setIsProcessing(false)
          setPaymentMethod(null)
          setSelectedMealCard(null)
        })
      return
    }

    // For Gel-Al orders
    const orderType = selectedOrderType === "Gel-Al" ? "Gel-Al" : tableName || undefined

    createOrder(
      items,
      orderType,
      customerName || undefined,
      orderNotesWithPayment,
      tableId,
      selectedOrderType === "Paket Servis",
    )
      .then((order) => {
        if (!order) {
          toast({
            title: "Hata",
            description: "Sipariş oluşturulamadı",
            variant: "destructive",
          })
          setIsProcessing(false)
          return
        }

        // Siparişi masaya ata
        if (tableId) {
          assignOrderToTable(tableId, order.id)
        }

        clearCart()
        setOrderNotes("")
        setCurrentOrder(order)
        setIsReceiptDialogOpen(true)

        toast({
          title: "Sipariş oluşturuldu",
          description: `${selectedOrderType} siparişi başarıyla oluşturuldu`,
        })
      })
      .catch((error) => {
        toast({
          title: "Hata",
          description: "Sipariş oluşturulurken bir hata oluştu",
          variant: "destructive",
        })
      })
      .finally(() => {
        setIsProcessing(false)
        setPaymentMethod(null)
        setSelectedMealCard(null)
      })
  }, [
    items,
    orderNotes,
    tableId,
    tableName,
    customerName,
    selectedOrderType,
    createOrder,
    assignOrderToTable,
    clearCart,
    toast,
    paymentMethod,
    selectedMealCard,
    mealCardOptions,
  ])

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

  const handleCloseReceiptDialog = () => {
    setIsReceiptDialogOpen(false)
    setCurrentOrder(null)
  }

  return (
    <div className="w-full md:w-96 border-l bg-white flex flex-col h-full">
      <CardHeader className="px-4 py-3 border-b">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold flex items-center">
            <ShoppingCart className="mr-2 h-5 w-5" />
            Sepet
            {totalItems > 0 && (
              <Badge variant="secondary" className="ml-2">
                {totalItems} ürün
              </Badge>
            )}
          </CardTitle>
          {items.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={clearCart}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Temizle
            </Button>
          )}
        </div>
      </CardHeader>

      <div className="flex-1 overflow-auto p-4">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <ShoppingCart className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">Sepetiniz boş</h3>
            <p className="text-gray-500">Sipariş vermek için menüden ürün ekleyin</p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => {
              const discountedPrice = item.foodItem.discount ? getDiscountedPrice(item.foodItem) : item.foodItem.price
              const itemTotal = discountedPrice * item.quantity

              return (
                <Card key={item.id} className="overflow-hidden">
                  <CardContent className="p-3">
                    <div className="flex justify-between">
                      <div className="flex-1">
                        <div className="font-medium">{item.foodItem.title}</div>
                        <div className="text-sm text-gray-500 mt-1">
                          {formatCurrency(discountedPrice)} x {item.quantity}
                        </div>
                        {item.notes && (
                          <div className="text-xs bg-gray-50 p-1 rounded mt-1 text-gray-600">Not: {item.notes}</div>
                        )}
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="font-semibold">{formatCurrency(itemTotal)}</div>
                        <div className="flex items-center mt-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 rounded-full"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="mx-2 text-sm font-medium w-5 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 rounded-full"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}

            <div className="mt-4">
              <Textarea
                placeholder="Sipariş notu ekleyin..."
                className="resize-none"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      <CardFooter className="border-t p-4 flex-col">
        <div className="w-full space-y-2">
          <div className="flex justify-between text-sm">
            <span>Ara Toplam</span>
            <span>{formatCurrency(totalPrice)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>KDV (%8)</span>
            <span>{formatCurrency(totalPrice * 0.08)}</span>
          </div>
          <Separator className="my-2" />
          <div className="flex justify-between font-bold">
            <span>Toplam</span>
            <span>{formatCurrency(totalPrice * 1.08)}</span>
          </div>
        </div>

        <div className="w-full mt-4 space-y-2">
          <Button
            className="w-full bg-orange-600 hover:bg-orange-700"
            size="lg"
            disabled={items.length === 0}
            onClick={handleOpenOrderTypeDialog}
          >
            <Receipt className="mr-2 h-5 w-5" />
            Sipariş Oluştur
          </Button>
        </div>
      </CardFooter>

      {/* Sipariş Tipi Seçim Dialog */}
      <Dialog open={isOrderTypeDialogOpen} onOpenChange={setIsOrderTypeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sipariş Tipi Seçin</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Button
              className="h-20 flex flex-col items-center justify-center gap-2"
              onClick={() => handleOrderTypeSelect("Restoranda")}
            >
              <UtensilsCrossed className="h-6 w-6" />
              <span>Restoranda</span>
            </Button>

            <Button
              className="h-20 flex flex-col items-center justify-center gap-2"
              variant="outline"
              onClick={() => handleOrderTypeSelect("Gel-Al")}
            >
              <Store className="h-6 w-6" />
              <span>Gel-Al</span>
            </Button>

            <Button
              className="h-20 flex flex-col items-center justify-center gap-2"
              variant="outline"
              onClick={() => handleOrderTypeSelect("Paket Servis")}
            >
              <Bike className="h-6 w-6" />
              <span>Paket Servis</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Masa Seçim Dialog */}
      {isTableSelectorOpen && (
        <Dialog open={isTableSelectorOpen} onOpenChange={setIsTableSelectorOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Masa Seçin</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <TableSelector onTableSelect={handleTableSelect} />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Sipariş Özeti Dialog */}
      {isOrderSummaryDialogOpen && (
        <Dialog open={isOrderSummaryDialogOpen} onOpenChange={setIsOrderSummaryDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Sipariş Özeti - {selectedOrderType}</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <div className="space-y-4">
                <div className="border rounded-md p-3">
                  <h3 className="font-medium mb-2">Sipariş Detayları</h3>
                  <div className="space-y-2">
                    {items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>
                          {item.quantity}x {item.foodItem.title}
                        </span>
                        <span>{formatCurrency(item.foodItem.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border rounded-md p-3">
                  <h3 className="font-medium mb-2">Ödeme Yöntemi</h3>
                  <div className="space-y-2">
                    <Button
                      variant={paymentMethod === "Kredi Kartı" ? "default" : "outline"}
                      className="w-full justify-start h-12"
                      onClick={() => setPaymentMethod("Kredi Kartı")}
                    >
                      <CreditCard className="mr-2 h-5 w-5" />
                      Kredi Kartı
                    </Button>
                    <Button
                      variant={paymentMethod === "Nakit" ? "default" : "outline"}
                      className="w-full justify-start h-12"
                      onClick={() => setPaymentMethod("Nakit")}
                    >
                      <Banknote className="mr-2 h-5 w-5" />
                      Nakit
                    </Button>
                    <Button
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

                <div className="border-t pt-4">
                  <div className="flex justify-between text-sm">
                    <span>Ara Toplam</span>
                    <span>{formatCurrency(totalPrice)}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span>KDV (%8)</span>
                    <span>{formatCurrency(totalPrice * 0.08)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg mt-2">
                    <span>Toplam Tutar</span>
                    <span>{formatCurrency(totalPrice * 1.08)}</span>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOrderSummaryDialogOpen(false)}>
                <X className="mr-2 h-4 w-4" />
                İptal
              </Button>
              <Button onClick={handleCreateOrder} disabled={isProcessing}>
                {isProcessing ? "İşleniyor..." : "Sipariş Oluştur"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Receipt Printer Dialog */}
      {isReceiptDialogOpen && currentOrder && (
        <Dialog open={isReceiptDialogOpen} onOpenChange={handleCloseReceiptDialog}>
          <DialogContent>
            <ReceiptPrinter order={currentOrder} onClose={handleCloseReceiptDialog} />
          </DialogContent>
        </Dialog>
      )}

      {/* Delivery Form Dialog */}
      {isDeliveryFormOpen && (
        <Dialog open={isDeliveryFormOpen} onOpenChange={setIsDeliveryFormOpen}>
          <DialogContent>
            <DeliveryForm onClose={() => setIsDeliveryFormOpen(false)} />
          </DialogContent>
        </Dialog>
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
