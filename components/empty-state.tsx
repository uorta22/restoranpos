"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Database, AlertTriangle } from "lucide-react"

interface EmptyStateProps {
  type: "products" | "tables" | "orders" | "database"
  onAction?: () => void
  actionLabel?: string
  title?: string
  description?: string
}

export function EmptyState({ type, onAction, actionLabel, title, description }: EmptyStateProps) {
  const getEmptyStateContent = () => {
    switch (type) {
      case "products":
        return {
          icon: <Plus className="h-12 w-12 text-gray-400" />,
          title: title || "Henüz ürün yok",
          description: description || "İlk ürününüzü ekleyerek menünüzü oluşturmaya başlayın.",
          actionLabel: actionLabel || "İlk Ürünü Ekle",
        }
      case "tables":
        return {
          icon: <Plus className="h-12 w-12 text-gray-400" />,
          title: title || "Henüz masa yok",
          description: description || "İlk masanızı ekleyerek restoran düzeninizi oluşturmaya başlayın.",
          actionLabel: actionLabel || "İlk Masayı Ekle",
        }
      case "orders":
        return {
          icon: <Plus className="h-12 w-12 text-gray-400" />,
          title: title || "Henüz sipariş yok",
          description: description || "İlk siparişiniz geldiğinde burada görünecek.",
          actionLabel: actionLabel || "Yeni Sipariş",
        }
      case "database":
        return {
          icon: <AlertTriangle className="h-12 w-12 text-orange-400" />,
          title: title || "Veritabanı kurulumu gerekli",
          description:
            description || "Uygulamayı kullanmaya başlamak için önce veritabanı tablolarının oluşturulması gerekiyor.",
          actionLabel: actionLabel || "Veritabanını Kur",
        }
      default:
        return {
          icon: <Plus className="h-12 w-12 text-gray-400" />,
          title: title || "Henüz veri yok",
          description: description || "İlk kaydınızı ekleyerek başlayın.",
          actionLabel: actionLabel || "Ekle",
        }
    }
  }

  const content = getEmptyStateContent()

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="flex flex-col items-center justify-center p-8 text-center">
        <div className="mb-4">{content.icon}</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{content.title}</h3>
        <p className="text-sm text-gray-500 mb-6">{content.description}</p>
        {onAction && (
          <Button onClick={onAction} className="gap-2">
            {type === "database" ? <Database className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {content.actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
