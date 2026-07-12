"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { MapPin } from "lucide-react"

export function CustomerTrackingLink({ trackingToken }: { trackingToken?: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [orderId, setOrderId] = useState(trackingToken ?? "")
  const { toast } = useToast()
  const router = useRouter()

  const handleTrack = () => {
    if (!orderId.trim()) {
      toast({
        title: "Takip kodu gerekli",
        description: "Lütfen güvenli takip kodunu girin",
        variant: "destructive",
      })
      return
    }

    if (!/^[0-9a-f-]{36}$/i.test(orderId.trim())) {
      toast({ title: "Geçersiz takip kodu", description: "Takip kodunu kontrol edin.", variant: "destructive" })
      return
    }

    router.push(`/track/${encodeURIComponent(orderId.trim())}`)
    setIsOpen(false)
  }

  return (
    <>
      <Button variant="outline" onClick={() => setIsOpen(true)}>
        <MapPin className="mr-2 h-4 w-4" />
        Teslimatı Takip Et
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sipariş Takibi</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="orderId">Takip Kodu</Label>
              <Input
                id="orderId"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="Takip kodunu girin"
                readOnly={Boolean(trackingToken)}
              />
              <p className="text-sm text-gray-500">
                Takip kodu, restoranın sizinle paylaştığı güvenli bağlantıda bulunur.
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
