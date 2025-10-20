"use client"

import { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTableContext } from "@/context/table-context"
import { useOrderContext } from "@/context/order-context"
import { useToast } from "@/hooks/use-toast"
import type { Table, Order } from "@/lib/types"
import { User, Plus, Clipboard, Receipt, CreditCard, Info, Utensils, Users, Clock } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCart } from "@/context/cart-context"

export function FloorPlan() {
  const { tables, updateTableStatus, clearTable, getTablesBySection, assignOrderToTable } = useTableContext()
  const { setTableInfo } = useCart()
  const { orders, getOrderById, updatePaymentStatus } = useOrderContext()
  const { toast } = useToast()

  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [isTableDialogOpen, setIsTableDialogOpen] = useState(false)
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null)
  const [customerName, setCustomerName] = useState("")
  const [newStatus, setNewStatus] = useState<"Müsait" | "Dolu" | "Rezerve">("Dolu")
  const [activeTab, setActiveTab] = useState("ana-salon")

  const anaSalonTables = getTablesBySection("Ana Salon")
  const bahceTables = getTablesBySection("Bahçe")
  const terasTables = getTablesBySection("Teras")

  // Load the active order for the selected table
  useEffect(() => {
    if (selectedTable && selectedTable.currentOrderId) {
      const order = getOrderById(selectedTable.currentOrderId)
      setCurrentOrder(order || null)
    } else {
      setCurrentOrder(null)
    }
  }, [selectedTable, getOrderById])

  const handleTableClick = useCallback(
    (table: Table) => {
      setSelectedTable(table)
      setIsTableDialogOpen(true)

      // Find active order for the table
      if (table.currentOrderId) {
        const order = getOrderById(table.currentOrderId)
        setCurrentOrder(order || null)
      } else {
        setCurrentOrder(null)
      }

      // Set customer name
      setCustomerName(table.customer || "")
    },
    [getOrderById],
  )

  const handleOpenStatusDialog = useCallback(() => {
    if (!selectedTable) return

    setNewStatus(selectedTable.status)
    setCustomerName(selectedTable.customer || "")
    setIsStatusDialogOpen(true)
  }, [selectedTable])

  const handleStatusChange = useCallback(() => {
    if (!selectedTable) return

    updateTableStatus(selectedTable.id, newStatus, customerName || undefined)
    setIsStatusDialogOpen(false)
    setIsTableDialogOpen(false)

    toast({
      title: `Masa ${selectedTable.number} güncellendi`,
      description: `Masa durumu ${newStatus} olarak değiştirildi.`,
    })
  }, [selectedTable, newStatus, customerName, updateTableStatus, toast])

  const handleSetupOrder = useCallback(() => {
    if (!selectedTable) return

    setTableInfo(selectedTable.id, selectedTable.number, selectedTable.customer || "Misafir")
    setIsTableDialogOpen(false)

    toast({
      title: "Masa seçildi",
      description: `${selectedTable.number} numaralı masa için sipariş hazırlanıyor.`,
    })
  }, [selectedTable, setTableInfo, toast])

  const handleClearTable = useCallback(() => {
    if (!selectedTable) return

    clearTable(selectedTable.id)
    setIsTableDialogOpen(false)

    toast({
      title: "Masa temizlendi",
      description: `${selectedTable.number} numaralı masa temizlendi ve müsait duruma getirildi.`,
    })
  }, [selectedTable, clearTable, toast])

  const handlePaymentClick = useCallback(() => {
    if (currentOrder) {
      setIsPaymentDialogOpen(true)
    }
  }, [currentOrder])

  const handleCompletePayment = useCallback(
    (method: "Nakit" | "Kredi Kartı") => {
      if (!currentOrder) return

      updatePaymentStatus(currentOrder.id, "Ödendi", method)
      setIsPaymentDialogOpen(false)

      toast({
        title: "Ödeme tamamlandı",
        description: `${method} ile ödeme işlemi tamamlandı.`,
      })
    },
    [currentOrder, updatePaymentStatus, toast],
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Müsait":
        return <Badge className="bg-green-100 text-green-800 border-green-200">Müsait</Badge>
      case "Dolu":
        return <Badge className="bg-red-100 text-red-800 border-red-200">Dolu</Badge>
      case "Rezerve":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Rezerve</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  // Check if an order is delayed
  const isOrderDelayed = (order: Order | null) => {
    if (!order) return false

    const orderTime = new Date(order.createdAt).getTime()
    const currentTime = new Date().getTime()
    const timeDiff = currentTime - orderTime
    const minutesDiff = Math.floor(timeDiff / (1000 * 60))

    // Mark as delayed if more than 15 minutes
    return minutesDiff > 15
  }

  const renderTable = useCallback(
    (table: Table) => {
      const order = table.currentOrderId ? getOrderById(table.currentOrderId) : null
      const isDelayed = isOrderDelayed(order)

      // Table shape and size classes
      const tableShape = table.capacity <= 2 ? "rounded-full" : "rounded-lg"
      const tableSize = table.capacity <= 2 ? "h-32 w-32" : table.capacity <= 4 ? "h-36 w-36" : "h-40 w-40"

      // Status color classes
      const statusColors = {
        Müsait: "bg-gradient-to-br from-green-50 to-green-100 border-green-300 hover:from-green-100 hover:to-green-200",
        Dolu: "bg-gradient-to-br from-red-50 to-red-100 border-red-300 hover:from-red-100 hover:to-red-200",
        Rezerve: "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300 hover:from-blue-100 hover:to-blue-200",
      }

      return (
        <div className="flex items-center justify-center p-2" key={table.id}>
          <div
            className={`${tableShape} ${tableSize} cursor-pointer transition-all duration-200 transform hover:scale-105 hover:shadow-lg ${statusColors[table.status as keyof typeof statusColors]} ${isDelayed ? "animate-pulse border-2 border-red-500" : "border"} flex flex-col items-center justify-center relative overflow-hidden`}
            onClick={() => handleTableClick(table)}
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gray-200"></div>
            <div className="font-bold text-2xl mb-1">{table.number}</div>
            <div
              className={`text-xs font-semibold px-2 py-0.5 rounded-full mb-2 ${
                table.status === "Müsait"
                  ? "bg-green-500 text-white"
                  : table.status === "Dolu"
                    ? "bg-red-500 text-white"
                    : "bg-blue-500 text-white"
              }`}
            >
              {table.status}
            </div>
            <div className="text-sm mb-1 font-medium">{table.capacity} Kişilik</div>

            {table.customer && (
              <div className="flex items-center justify-center text-xs mb-1 bg-gray-100 px-2 py-0.5 rounded-full w-4/5">
                <User className="h-2.5 w-2.5 mr-1 text-gray-600" />
                <span className="truncate max-w-[60px]">{table.customer}</span>
              </div>
            )}

            {table.currentOrderId && (
              <div className="mt-1 w-4/5">
                <Badge
                  variant="outline"
                  className={`w-full justify-center text-xs py-0.5 ${isDelayed ? "bg-red-100 text-red-800 border-red-500" : "bg-orange-100 text-orange-800 border-orange-300"}`}
                >
                  {isDelayed ? (
                    <>
                      <Clock className="h-2.5 w-2.5 mr-1" /> Gecikiyor
                    </>
                  ) : (
                    <>
                      <Utensils className="h-2.5 w-2.5 mr-1" /> Aktif
                    </>
                  )}
                </Badge>
              </div>
            )}
          </div>
        </div>
      )
    },
    [getOrderById, handleTableClick],
  )

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Masa Planı</h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="ana-salon">Ana Salon</TabsTrigger>
          <TabsTrigger value="bahce">Bahçe</TabsTrigger>
          <TabsTrigger value="teras">Teras</TabsTrigger>
        </TabsList>

        <TabsContent value="ana-salon">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
            {anaSalonTables.map(renderTable)}
          </div>
        </TabsContent>

        <TabsContent value="bahce">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
            {bahceTables.map(renderTable)}
          </div>
        </TabsContent>

        <TabsContent value="teras">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
            {terasTables.map(renderTable)}
          </div>
        </TabsContent>
      </Tabs>

      {/* Table Details Dialog */}
      {selectedTable && (
        <Dialog
          open={isTableDialogOpen}
          onOpenChange={(open) => {
            setIsTableDialogOpen(open)
            if (!open) {
              // Reset state when dialog closes
              setTimeout(() => setSelectedTable(null), 100)
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center">
                Masa {selectedTable.number} {getStatusBadge(selectedTable.status)}
              </DialogTitle>
            </DialogHeader>

            <div className="py-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Kapasite:</span>
                  <span>{selectedTable.capacity} Kişi</span>
                </div>
                {selectedTable.customer && (
                  <div className="flex justify-between">
                    <span>Müşteri:</span>
                    <span>{selectedTable.customer}</span>
                  </div>
                )}

                {/* Active order details */}
                {currentOrder && (
                  <div className="mt-4 pt-4 border-t">
                    <h3 className="font-medium mb-2 flex items-center justify-between">
                      <span>Aktif Sipariş Bilgileri</span>
                      {isOrderDelayed(currentOrder) && (
                        <Badge className="bg-red-100 text-red-800">
                          <Clock className="h-3 w-3 mr-1" /> Gecikiyor
                        </Badge>
                      )}
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Sipariş No:</span>
                        <span>#{currentOrder.id.slice(-6)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sipariş Zamanı:</span>
                        <span>{new Date(currentOrder.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Toplam Tutar:</span>
                        <span className="font-semibold">{formatCurrency(currentOrder.total)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ürün Sayısı:</span>
                        <span>{currentOrder.items.reduce((total, item) => total + item.quantity, 0)} adet</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ödeme Durumu:</span>
                        <Badge
                          variant={currentOrder.paymentStatus === "Ödendi" ? "default" : "outline"}
                          className={
                            currentOrder.paymentStatus === "Ödendi"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }
                        >
                          {currentOrder.paymentStatus}
                        </Badge>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <h4 className="font-medium">Sipariş Detayı:</h4>
                      {currentOrder.items.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>
                            {item.quantity}x {item.foodItem.title}
                          </span>
                          <span>{formatCurrency(item.foodItem.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 space-y-3">
                <h3 className="font-medium">İşlemler</h3>

                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={handleOpenStatusDialog}>
                    <Info className="mr-2 h-4 w-4" />
                    Masa Durumunu Değiştir
                  </Button>

                  {selectedTable.status !== "Müsait" && (
                    <Button variant="outline" onClick={handleClearTable}>
                      <User className="mr-2 h-4 w-4" />
                      Masayı Temizle
                    </Button>
                  )}

                  {/* Create order button if no order exists */}
                  {!currentOrder && (
                    <Button onClick={handleSetupOrder}>
                      <Clipboard className="mr-2 h-4 w-4" />
                      Sipariş Oluştur
                    </Button>
                  )}

                  {/* Order details and payment buttons if order exists */}
                  {currentOrder && (
                    <>
                      <Button onClick={handleSetupOrder}>
                        <Plus className="mr-2 h-4 w-4" />
                        Siparişe Ekle
                      </Button>

                      {currentOrder.paymentStatus !== "Ödendi" && (
                        <Button onClick={handlePaymentClick}>
                          <CreditCard className="mr-2 h-4 w-4" />
                          Ödeme Al
                        </Button>
                      )}

                      <Button variant="outline" className="col-span-2">
                        <Receipt className="mr-2 h-4 w-4" />
                        Adisyon Yazdır
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Table Status Change Dialog */}
      {selectedTable && (
        <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Masa Durumunu Değiştir</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Label>Masa Durumu</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={newStatus === "Müsait" ? "default" : "outline"}
                    onClick={() => setNewStatus("Müsait")}
                    className={newStatus === "Müsait" ? "bg-green-600 hover:bg-green-700" : ""}
                  >
                    Müsait
                  </Button>
                  <Button
                    variant={newStatus === "Dolu" ? "default" : "outline"}
                    onClick={() => setNewStatus("Dolu")}
                    className={newStatus === "Dolu" ? "bg-red-600 hover:bg-red-700" : ""}
                  >
                    Dolu
                  </Button>
                  <Button
                    variant={newStatus === "Rezerve" ? "default" : "outline"}
                    onClick={() => setNewStatus("Rezerve")}
                    className={newStatus === "Rezerve" ? "bg-blue-600 hover:bg-blue-700" : ""}
                  >
                    Rezerve
                  </Button>
                </div>
              </div>

              {(newStatus === "Dolu" || newStatus === "Rezerve") && (
                <div className="space-y-2">
                  <Label htmlFor="customerName" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Müşteri Adı
                  </Label>
                  <Input
                    id="customerName"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Müşteri adını girin"
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>
                İptal
              </Button>
              <Button onClick={handleStatusChange}>Kaydet</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Payment Dialog */}
      {currentOrder && (
        <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ödeme İşlemi</DialogTitle>
            </DialogHeader>

            <div className="py-4">
              <div className="text-center mb-6">
                <p className="text-lg font-semibold mb-1">Toplam Tutar</p>
                <p className="text-3xl font-bold">{formatCurrency(currentOrder.total)}</p>
              </div>

              <div className="space-y-4">
                <Button className="w-full h-12 text-lg" onClick={() => handleCompletePayment("Nakit")}>
                  <Receipt className="mr-2 h-5 w-5" />
                  Nakit Ödeme
                </Button>

                <Button className="w-full h-12 text-lg" onClick={() => handleCompletePayment("Kredi Kartı")}>
                  <CreditCard className="mr-2 h-5 w-5" />
                  Kredi Kartı ile Ödeme
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
                İptal
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
