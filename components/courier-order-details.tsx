"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDateTime } from "@/lib/utils"
import type { Order } from "@/lib/types"
import { MapPin, User, Phone, Clock, CreditCard } from "lucide-react"

interface CourierOrderDetailsProps {
  order: Order | null
  isOpen: boolean
  onClose: () => void
}

export function CourierOrderDetails({ order, isOpen, onClose }: CourierOrderDetailsProps) {
  if (!order) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sipariş Detayları #{order.id.slice(-6)}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">
                <Clock className="h-4 w-4 inline mr-1" />
                {formatDateTime(order.createdAt)}
              </p>
            </div>
            <Badge
              className={
                order.deliveryStatus === "Teslim Edildi"
                  ? "bg-green-100 text-green-800"
                  : order.deliveryStatus === "Yolda"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-yellow-100 text-yellow-800"
              }
            >
              {order.deliveryStatus || "Beklemede"}
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex items-center">
              <User className="h-4 w-4 mr-2 text-gray-500" />
              <span className="font-medium">{order.customerName || "Misafir"}</span>
            </div>

            {order.deliveryAddress && (
              <div className="flex items-start">
                <MapPin className="h-4 w-4 mr-2 text-gray-500 mt-1" />
                <div>
                  <p className="text-sm">{order.deliveryAddress.address || order.deliveryAddress.fullAddress}</p>
                  {order.deliveryAddress.contactPhone && (
                    <p className="text-xs flex items-center mt-1">
                      <Phone className="h-3 w-3 mr-1 text-gray-500" />
                      {order.deliveryAddress.contactPhone}
                    </p>
                  )}
                </div>
              </div>
            )}

            {order.paymentMethod && (
              <div className="flex items-center">
                <CreditCard className="h-4 w-4 mr-2 text-gray-500" />
                <span>{order.paymentMethod}</span>
              </div>
            )}
          </div>

          <div className="border-t pt-3">
            <h4 className="font-medium mb-2">Sipariş Öğeleri</h4>
            <ul className="space-y-2">
              {order.items.map((item, index) => (
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

            <div className="mt-3 font-bold flex justify-between text-lg">
              <span>Toplam</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>

          {order.notes && (
            <div className="bg-gray-50 p-2 rounded-md">
              <p className="text-sm font-medium">Notlar:</p>
              <p className="text-sm">{order.notes}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Kapat</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
