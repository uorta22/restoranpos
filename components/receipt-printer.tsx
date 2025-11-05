"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { formatCurrency, formatDateTime } from "@/lib/utils"
import { Printer, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Order } from "@/lib/types"

interface ReceiptPrinterProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: Order | null
}

export function ReceiptPrinter({ open, onOpenChange, order }: ReceiptPrinterProps) {
  const { toast } = useToast()
  const [isPrinting, setIsPrinting] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const receiptRef = useRef<HTMLDivElement>(null)

  // Return early if order is null
  if (!order || !order.items || order.items.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sipariş Fişi</DialogTitle>
          </DialogHeader>
          <div className="p-4 text-center">
            <p>Sipariş bilgisi bulunamadı.</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const handlePrint = () => {
    setIsPrinting(true)

    try {
      const printWindow = window.open("", "_blank")
      if (!printWindow) {
        toast({
          title: "Hata",
          description: "Yazdırma penceresi açılamadı. Lütfen popup engelleyiciyi kontrol edin.",
          variant: "destructive",
        })
        setIsPrinting(false)
        return
      }

      printWindow.document.write(`
        <html>
          <head>
            <title>Sipariş Fişi #${order.id.slice(-6)}</title>
            <style>
              body { font-family: 'Courier New', monospace; margin: 0; padding: 0; }
              @media print {
                body { width: 80mm; }
              }
            </style>
          </head>
          <body>
            ${receiptRef.current?.innerHTML || ""}
          </body>
        </html>
      `)

      printWindow.document.close()

      // Yazdırma işlemi
      setTimeout(() => {
        printWindow.focus()
        printWindow.print()

        // Yazdırma tamamlandığında pencereyi kapat
        printWindow.onafterprint = () => {
          printWindow.close()
          setIsPrinting(false)

          toast({
            title: "Başarılı",
            description: "Fiş yazdırma işlemi başarıyla tamamlandı.",
          })
        }
      }, 500)
    } catch (error) {
      console.error("Yazdırma hatası:", error)
      setIsPrinting(false)

      toast({
        title: "Hata",
        description: "Fiş yazdırılırken bir hata oluştu.",
        variant: "destructive",
      })
    }
  }

  const handleDownload = () => {
    setIsDownloading(true)

    try {
      const content = receiptRef.current?.innerHTML || ""
      const blob = new Blob(
        [
          `
        <html>
          <head>
            <title>Sipariş Fişi #${order.id.slice(-6)}</title>
            <style>
              body { font-family: 'Courier New', monospace; margin: 0; padding: 20px; }
            </style>
          </head>
          <body>
            ${content}
          </body>
        </html>
      `,
        ],
        { type: "text/html" },
      )

      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `siparis-${order.id.slice(-6)}.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setIsDownloading(false)

      toast({
        title: "Başarılı",
        description: "Fiş başarıyla indirildi.",
      })
    } catch (error) {
      console.error("İndirme hatası:", error)
      setIsDownloading(false)

      toast({
        title: "Hata",
        description: "Fiş indirilirken bir hata oluştu.",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sipariş Fişi</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <div className="mb-4 flex justify-between items-center">
            <div className="space-x-2">
              <Button size="sm" onClick={handlePrint} disabled={isPrinting || isDownloading}>
                {isPrinting ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                    Yazdırılıyor...
                  </>
                ) : (
                  <>
                    <Printer className="mr-2 h-4 w-4" />
                    Yazdır
                  </>
                )}
              </Button>
              <Button size="sm" variant="outline" onClick={handleDownload} disabled={isPrinting || isDownloading}>
                {isDownloading ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                    İndiriliyor...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    İndir
                  </>
                )}
              </Button>
            </div>
          </div>

      <div
        id="receipt-content"
        ref={receiptRef}
        className="bg-white p-4 border rounded-md font-mono text-sm whitespace-pre-wrap"
      >
        <div className="text-center font-bold mb-2">RESTAURANT POS</div>
        <div className="text-center mb-4">Sipariş Fişi #{order.id.slice(-6)}</div>

        <div className="mb-2">
          <div>Tarih: {order && order.createdAt ? formatDateTime(order.createdAt) : "-"}</div>
          <div>Sipariş Tipi: {order.orderType || "Restoranda"}</div>
          {order.tableId && <div>Masa: {order.tableName}</div>}
          {order.customerName && <div>Müşteri: {order.customerName}</div>}
        </div>

        {order.notes && (
          <div className="mb-2">
            <div className="font-bold">Sipariş Notu:</div>
            <div>{order.notes}</div>
          </div>
        )}

        <Separator className="my-2" />

        <div className="space-y-1">
          {order.items.map((item, index) => (
            <div key={index} className="flex justify-between">
              <div>
                {item.quantity}x {item.foodItem.title}
              </div>
              <div>{formatCurrency(item.foodItem.price * item.quantity)}</div>
            </div>
          ))}
        </div>

        <Separator className="my-2" />

        <div className="space-y-1">
          <div className="flex justify-between">
            <div>Ara Toplam:</div>
            <div>{formatCurrency(order.subtotal || order.total)}</div>
          </div>
          <div className="flex justify-between">
            <div>KDV (%8):</div>
            <div>{formatCurrency(order.tax || order.total * 0.08)}</div>
          </div>
          {order.deliveryFee > 0 && (
            <div className="flex justify-between">
              <div>Teslimat Ücreti:</div>
              <div>{formatCurrency(order.deliveryFee)}</div>
            </div>
          )}
          <div className="flex justify-between font-bold">
            <div>Toplam:</div>
            <div>{formatCurrency(order.total)}</div>
          </div>
        </div>

        <Separator className="my-2" />

        <div className="text-center text-xs mt-4">
          <div>Bizi tercih ettiğiniz için teşekkür ederiz!</div>
          <div>www.restaurantpos.com</div>
        </div>
      </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
