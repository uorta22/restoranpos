"use client"

import { useState } from "react"
import { useTableContext } from "@/context/table-context"
import { useOrderContext } from "@/context/order-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import type { Order } from "@/lib/types"
import { Coffee, Users, CreditCard, Banknote } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function TableOverview() {
  const { tables, updateTableStatus } = useTableContext()
  const { orders, getOrderById, updateOrderStatus, updatePaymentStatus } = useOrderContext()
  const { toast } = useToast()
  const [selectedTable, setSelectedTable] = useState<any>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isPaymentCompleted, setIsPaymentCompleted] = useState(false)
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

  // Masa durumlarını hesapla
  const availableTables = tables.filter((table) => table.status === "Müsait").length
  const occupiedTables = tables.filter((table) => table.status === "Dolu").length
  const reservedTables = tables.filter((table) => table.status === "Rezerve").length

  // Bölümlere göre masaları grupla
  const mainTables = tables.filter((table) => table.section === "Ana Salon")
  const barTables = tables.filter((table) => table.section === "Bar")
  const terraceTables = tables.filter((table) => table.section === "Teras")

  // Masaya ait siparişi bul
  const findTableOrder = (tableId: string) => {
    return orders.find(
      (order) => order.tableId === tableId && order.status !== "Tamamlandı" && order.status !== "İptal Edildi",
    )
  }

  // Masaya tıklandığında
  const handleTableClick = (table: any) => {
    if (table.status === "Dolu") {
      setSelectedTable(table)
      const order = findTableOrder(table.id)
      if (order) {
        setSelectedOrder(order)
        setIsDialogOpen(true)
        setIsPaymentCompleted(false)
        setPaymentMethod(null)
        setSelectedMealCard(null)
      }
    }
  }

  // Meal card seçildiğinde
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

  // Ödeme alma işlemi
  const handleCompletePayment = (method: "Nakit" | "Kredi Kartı" | "Yemek Param") => {
    if (selectedOrder && selectedTable) {
      // Ödeme yöntemini belirle
      let paymentInfo = method

      // Eğer Yemek Param seçildiyse ve bir kart seçildiyse, kart bilgisini ekle
      if (method === "Yemek Param" && selectedMealCard) {
        const mealCardName = mealCardOptions.find((card) => card.id === selectedMealCard)?.name || selectedMealCard
        paymentInfo = `${method} - ${mealCardName}`
      }

      // Siparişi tamamlandı olarak işaretle
      updateOrderStatus(selectedOrder.id, "Tamamlandı")

      // Ödeme durumunu güncelle
      updatePaymentStatus(selectedOrder.id, "Ödendi", paymentInfo)

      // Masa durumunu müsait olarak güncelle
      updateTableStatus(selectedTable.id, "Müsait")

      // Ödeme tamamlandı durumunu güncelle
      setIsPaymentCompleted(true)
      setPaymentMethod(method)
    }
  }

  // Dialog'u kapat
  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setSelectedOrder(null)
    setSelectedTable(null)
    setIsPaymentCompleted(false)
    setPaymentMethod(null)
    setSelectedMealCard(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Masa Durumu</h2>
        <div className="flex space-x-2">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 px-3 py-1">
            Müsait: {availableTables}
          </Badge>
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 px-3 py-1">
            Dolu: {occupiedTables}
          </Badge>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 px-3 py-1">
            Rezerve: {reservedTables}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Ana Salon */}
        <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 pb-2">
            <CardTitle className="text-lg font-medium flex items-center">
              <Coffee className="mr-2 h-5 w-5 text-orange-600" />
              Ana Salon
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <div className="grid grid-cols-4 gap-2">
              {mainTables.map((table) => (
                <div
                  key={table.id}
                  className={`
                    relative p-2 rounded-md flex flex-col items-center justify-center
                    ${
                      table.status === "Müsait"
                        ? "bg-green-50 border border-green-200"
                        : table.status === "Dolu"
                          ? "bg-red-50 border border-red-200 cursor-pointer"
                          : "bg-blue-50 border border-blue-200"
                    }
                  `}
                  onClick={() => table.status === "Dolu" && handleTableClick(table)}
                >
                  <span className="font-bold">{table.number}</span>
                  <div className="flex items-center text-xs text-gray-500 mt-1">
                    <Users className="h-3 w-3 mr-1" />
                    {table.capacity}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Bar */}
        <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 pb-2">
            <CardTitle className="text-lg font-medium flex items-center">
              <Coffee className="mr-2 h-5 w-5 text-indigo-600" />
              Bar
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <div className="grid grid-cols-4 gap-2">
              {barTables.map((table) => (
                <div
                  key={table.id}
                  className={`
                    relative p-2 rounded-md flex flex-col items-center justify-center
                    ${
                      table.status === "Müsait"
                        ? "bg-green-50 border border-green-200"
                        : table.status === "Dolu"
                          ? "bg-red-50 border border-red-200 cursor-pointer"
                          : "bg-blue-50 border border-blue-200"
                    }
                  `}
                  onClick={() => table.status === "Dolu" && handleTableClick(table)}
                >
                  <span className="font-bold">{table.number}</span>
                  <div className="flex items-center text-xs text-gray-500 mt-1">
                    <Users className="h-3 w-3 mr-1" />
                    {table.capacity}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Teras */}
        <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 pb-2">
            <CardTitle className="text-lg font-medium flex items-center">
              <Coffee className="mr-2 h-5 w-5 text-teal-600" />
              Teras
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <div className="grid grid-cols-4 gap-2">
              {terraceTables.map((table) => (
                <div
                  key={table.id}
                  className={`
                    relative p-2 rounded-md flex flex-col items-center justify-center
                    ${
                      table.status === "Müsait"
                        ? "bg-green-50 border border-green-200"
                        : table.status === "Dolu"
                          ? "bg-red-50 border border-red-200 cursor-pointer"
                          : "bg-blue-50 border border-blue-200"
                    }
                  `}
                  onClick={() => table.status === "Dolu" && handleTableClick(table)}
                >
                  <span className="font-bold">{table.number}</span>
                  <div className="flex items-center text-xs text-gray-500 mt-1">
                    <Users className="h-3 w-3 mr-1" />
                    {table.capacity}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sipariş Detayları ve Ödeme Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isPaymentCompleted ? "Ödeme Tamamlandı" : `Masa ${selectedTable?.number} - Sipariş Detayları`}
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && !isPaymentCompleted && (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Sipariş Öğeleri</h3>
                <ul className="space-y-2">
                  {selectedOrder.items.map((item, index) => (
                    <li key={index} className="flex justify-between items-center border-b pb-1">
                      <div>
                        <div className="font-medium">
                          {item.quantity}x {item.foodItem.title}
                        </div>
                        {item.foodItem.description && (
                          <div className="text-xs text-gray-500">{item.foodItem.description}</div>
                        )}
                      </div>
                      <span>{formatCurrency(item.foodItem.price * item.quantity)}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 font-bold flex justify-between text-lg">
                  <span>Toplam</span>
                  <span>{formatCurrency(selectedOrder.total)}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <h3 className="font-medium mb-1">Ödeme Yöntemi</h3>
                <Button variant="outline" className="justify-start h-12" onClick={() => handleCompletePayment("Nakit")}>
                  <Banknote className="mr-2 h-5 w-5" />
                  Nakit Ödeme
                </Button>
                <Button
                  variant="outline"
                  className="justify-start h-12"
                  onClick={() => handleCompletePayment("Kredi Kartı")}
                >
                  <CreditCard className="mr-2 h-5 w-5" />
                  Kredi Kartı
                </Button>
                <Button variant="outline" className="justify-start h-12" onClick={() => setIsMealCardDialogOpen(true)}>
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
          )}

          {/* Ödeme Tamamlandı Ekranı */}
          {isPaymentCompleted && selectedOrder && (
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-md border border-green-200 text-center">
                <h3 className="text-green-700 font-bold text-lg mb-1">Ödeme Başarıyla Tamamlandı</h3>
                <p className="text-green-600">Masa {selectedTable?.number} artık müsait durumda.</p>
              </div>

              <div className="border rounded-md p-3">
                <h4 className="font-medium mb-2">Ödeme Bilgileri</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Ödeme Yöntemi:</span>
                    <span className="font-medium">
                      {paymentMethod === "Yemek Param" && selectedMealCard
                        ? `${paymentMethod} - ${mealCardOptions.find((card) => card.id === selectedMealCard)?.name}`
                        : paymentMethod}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Toplam Tutar:</span>
                    <span className="font-medium">{formatCurrency(selectedOrder.total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tarih:</span>
                    <span>{new Date().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sipariş No:</span>
                    <span>#{selectedOrder.id.slice(-6)}</span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-3">
                <h4 className="font-medium mb-2">Sipariş Özeti</h4>
                <ul className="space-y-1 text-sm">
                  {selectedOrder.items.map((item, index) => (
                    <li key={index} className="flex justify-between">
                      <span>
                        {item.quantity}x {item.foodItem.title}
                      </span>
                      <span>{formatCurrency(item.foodItem.price * item.quantity)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Button className="w-full" onClick={handleCloseDialog}>
                Kapat
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Meal Card Selection Dialog */}
      <Dialog open={isMealCardDialogOpen} onOpenChange={setIsMealCardDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Yemek Kartı Seçin</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            {mealCardOptions.map((card) => (
              <Button
                key={card.id}
                variant="outline"
                className="h-24 flex flex-col items-center justify-center gap-2"
                onClick={() => {
                  handleMealCardSelect(card.id)
                  setTimeout(() => handleCompletePayment("Yemek Param"), 100)
                }}
              >
                <img src={card.logo || "/placeholder.svg"} alt={card.name} className="h-10 object-contain" />
                <span>{card.name}</span>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
