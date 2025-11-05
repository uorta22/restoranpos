"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { MapPin } from "lucide-react"

export function CustomerTrackingLink() {
  const [isOpen, setIsOpen] = useState(false)
  const [orderId, setOrderId] = useState("")
  const { toast } = useToast()
  const router = useRouter()

  const handleTrack = () => {
    if (!orderId.trim()) {
      toast({
        title: "Sipariş numarası gerekli",
        description: "Lütfen sipariş numaranızı girin",
        variant: "destructive",
      })
      return
    }

    router.push(`/track/${orderId}`)
    setIsOpen(false)
  }

  return (
    <>
      <Button variant="outline" onClick={() => setIsOpen(true)}>
        <MapPin className="mr-2 h-4 w-4" />
        Siparişimi Takip Et
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sipariş Takibi</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="orderId">Sipariş Numarası</Label>
              <Input
                id="orderId"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="Sipariş numaranızı girin"
              />
              <p className="text-sm text-gray-500">
                Sipariş numaranız, sipariş onay mesajında veya e-postanızda bulunmaktadır.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleTrack}>Takip Et</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
