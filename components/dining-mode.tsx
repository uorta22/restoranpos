"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useCart } from "@/context/cart-context"
import { Utensils, MenuIcon as TakeoutDining, Bike, Users } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FloorPlan } from "@/components/floor-plan"
import { OrderType } from "@/lib/types"

export function DiningMode() {
  const { toast } = useToast()
  const { setTableInfo } = useCart()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [mode, setMode] = useState<OrderType>(OrderType.TAKEAWAY)
  const [customerName, setCustomerName] = useState("")
  const [selectedOption, setSelectedOption] = useState<{
    type: OrderType | string
    customer: string
  }>({ type: "Sipariş Tipi Seçilmedi", customer: "" })

  const handleModeChange = (newMode: OrderType) => {
    setMode(newMode)
  }

  const handleSave = () => {
    const customer = customerName || "Misafir"

    setSelectedOption({
      type: mode,
      customer,
    })

    // Sipariş tipine göre işlem yap
    switch (mode) {
      case OrderType.TAKEAWAY:
        setTableInfo("takeaway", "Gel-Al", customer)
        break
      case OrderType.DELIVERY:
        setTableInfo("delivery", "Paket Servis", customer)
        break
      case OrderType.DINE_IN:
        // Restoranda seçildiğinde masa seçimine yönlendir
        setTableInfo(null, null, customer)
        // Masa planı sekmesine geçiş yap
        setTimeout(() => {
          const floorPlanTab = document.querySelector('[data-value="floor-plan"]') as HTMLElement
          if (floorPlanTab) floorPlanTab.click()
        }, 100)
        break
    }

    setIsDialogOpen(false)

    toast({
      title: `${mode} Seçildi`,
      description: customerName ? `${customerName} için sipariş hazırlanıyor` : "Sipariş hazırlanıyor",
    })
  }

  return (
    <>
      <Tabs defaultValue="dining-mode" className="mb-4">
        <TabsList>
          <TabsTrigger value="dining-mode">Sipariş Tipi</TabsTrigger>
          <TabsTrigger value="floor-plan" data-value="floor-plan">
            Masa Planı
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dining-mode">
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">{selectedOption.type}</h3>
                  {selectedOption.customer && (
                    <p className="text-sm text-gray-500">Müşteri: {selectedOption.customer}</p>
                  )}
                </div>
                <Button onClick={() => setIsDialogOpen(true)}>
                  {selectedOption.type !== "Sipariş Tipi Seçilmedi" ? "Değiştir" : "Sipariş Tipi Seç"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="floor-plan">
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <FloorPlan />
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sipariş Tipi Seçin</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-4 py-4">
            <Button
              variant={mode === OrderType.DINE_IN ? "default" : "outline"}
              className="h-24 flex flex-col"
              onClick={() => handleModeChange(OrderType.DINE_IN)}
            >
              <Utensils className="h-8 w-8 mb-2" />
              <span>Restoranda</span>
            </Button>
            <Button
              variant={mode === OrderType.TAKEAWAY ? "default" : "outline"}
              className="h-24 flex flex-col"
              onClick={() => handleModeChange(OrderType.TAKEAWAY)}
            >
              <TakeoutDining className="h-8 w-8 mb-2" />
              <span>Gel-Al</span>
            </Button>
            <Button
              variant={mode === OrderType.DELIVERY ? "default" : "outline"}
              className="h-24 flex flex-col"
              onClick={() => handleModeChange(OrderType.DELIVERY)}
            >
              <Bike className="h-8 w-8 mb-2" />
              <span>Paket Servis</span>
            </Button>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customerName" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Müşteri Adı (Opsiyonel)
              </Label>
              <Input
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Müşteri adını girin"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleSave}>Devam Et</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
