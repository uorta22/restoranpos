"use client"

import { useState } from "react"
import {
  BarChart3,
  Boxes,
  Calendar,
  Check,
  ChefHat,
  ClipboardList,
  MapPin,
  Users,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ModuleDefinition {
  id: string
  label: string
  icon: LucideIcon
  title: string
  description: string
  bullets: string[]
  preview: {
    heading: string
    rows: Array<{ primary: string; secondary: string; badge: string; tone: "orange" | "green" | "amber" | "sky" }>
  }
}

const modules: ModuleDefinition[] = [
  {
    id: "orders",
    label: "Sipariş & Kasa",
    icon: ClipboardList,
    title: "Salon, gel-al ve paket siparişleri tek akışta",
    description:
      "Sipariş açılışından ödemeye kadar her adım aynı kayıtta ilerler. Kasiyer, garson ve yönetici aynı güncel durumu görür.",
    bullets: [
      "Masaya, gel-al kuyruğuna veya adrese göre sipariş açma",
      "Sipariş kalemleri, notlar ve durum geçmişi tek kayıtta",
      "Nakit ve kart ödemelerini sipariş üzerinden tahsil etme",
      "Rol bazlı yetkiyle iptal ve durum değişikliği",
    ],
    preview: {
      heading: "Açık siparişler",
      rows: [
        { primary: "Masa 04", secondary: "6 ürün · 8 dk önce", badge: "Yeni", tone: "orange" },
        { primary: "Gel-al #184", secondary: "3 ürün · 3 dk önce", badge: "Hazırlanıyor", tone: "amber" },
        { primary: "Paket #179", secondary: "4 ürün · 12 dk önce", badge: "Hazır", tone: "green" },
      ],
    },
  },
  {
    id: "tables",
    label: "Masa & Rezervasyon",
    icon: Calendar,
    title: "Doluluk, adisyon ve rezervasyon tek görünümde",
    description:
      "Masaların anlık durumu, açık adisyonlar ve yaklaşan rezervasyonlar aynı ekranda; servis planı sürprizsiz ilerler.",
    bullets: [
      "Bölüm ve kapasiteye göre masa düzeni",
      "Masa durumları: boş, dolu, rezerve, temizleniyor",
      "Tarih ve saate göre rezervasyon kaydı",
      "Rezervasyondan masaya hızlı geçiş",
    ],
    preview: {
      heading: "Bu akşam",
      rows: [
        { primary: "Masa 07 · 4 kişi", secondary: "19:30 rezervasyon", badge: "Rezerve", tone: "sky" },
        { primary: "Masa 11", secondary: "Açık adisyon · ₺840", badge: "Dolu", tone: "orange" },
        { primary: "Masa 02", secondary: "Servise hazır", badge: "Boş", tone: "green" },
      ],
    },
  },
  {
    id: "kitchen",
    label: "Mutfak Ekranı",
    icon: ChefHat,
    title: "Mutfak, sipariş sırasını kağıtsız yönetir",
    description:
      "Yeni gelen, hazırlanan ve servise hazır siparişler istasyonların çalışma sırasına göre akar; fiş kovalamak gerekmez.",
    bullets: [
      "Siparişler geliş sırasına göre kuyrukta",
      "Kaleme değil siparişe göre hazırlık takibi",
      "Hazır siparişte servise anlık bildirim",
      "Geciken siparişleri renkle ayırt etme",
    ],
    preview: {
      heading: "Mutfak kuyruğu",
      rows: [
        { primary: "Masa 04", secondary: "2× Izgara köfte, 1× salata", badge: "Sırada", tone: "orange" },
        { primary: "Paket #182", secondary: "1× Pide, 2× ayran", badge: "Ocakta", tone: "amber" },
        { primary: "Masa 09", secondary: "3× Makarna", badge: "Hazır", tone: "green" },
      ],
    },
  },
  {
    id: "delivery",
    label: "Kurye & Teslimat",
    icon: MapPin,
    title: "Paket servisi atamadan teslimata kadar izleyin",
    description:
      "Kurye ekibinizi davetle panele ekleyin; siparişi atayın, yol durumunu izleyin, müşteriye takip bağlantısı verin.",
    bullets: [
      "Kurye davet ve araç bilgisi kaydı",
      "Siparişe kurye atama ve durum akışı",
      "Müşteriye açık teslimat takip sayfası",
      "Teslimat geçmişi ve durum kayıtları",
    ],
    preview: {
      heading: "Aktif teslimatlar",
      rows: [
        { primary: "Paket #179", secondary: "Kurye: Mehmet · Motosiklet", badge: "Yolda", tone: "sky" },
        { primary: "Paket #175", secondary: "Kadıköy · 2,4 km", badge: "Teslim edildi", tone: "green" },
        { primary: "Paket #183", secondary: "Kurye bekliyor", badge: "Atanmadı", tone: "orange" },
      ],
    },
  },
  {
    id: "inventory",
    label: "Stok & Tedarik",
    icon: Boxes,
    title: "Kritik stok seviyesi sürpriz olmaktan çıkar",
    description:
      "Stok kalemleri, hareket geçmişi ve tedarikçi kayıtları operasyonla aynı yerde; sayım ve sipariş kararları veriye dayanır.",
    bullets: [
      "Stok kalemi ve birim takibi",
      "Kritik seviye uyarıları",
      "Giriş, çıkış ve düzeltme hareketleri",
      "Tedarikçi kayıtları ve iletişim bilgileri",
    ],
    preview: {
      heading: "Kritik stoklar",
      rows: [
        { primary: "Dana kıyma", secondary: "2,5 kg kaldı · eşik 5 kg", badge: "Kritik", tone: "orange" },
        { primary: "Ayçiçek yağı", secondary: "8 L kaldı · eşik 10 L", badge: "Azalıyor", tone: "amber" },
        { primary: "Ayran 300ml", secondary: "142 adet", badge: "Yeterli", tone: "green" },
      ],
    },
  },
  {
    id: "reports",
    label: "Raporlama",
    icon: BarChart3,
    title: "Günü kapatırken ne olduğunu bilirsiniz",
    description:
      "Günlük satış, sipariş ve ödeme kırılımları hazır raporlarda; performansı dönemler arasında karşılaştırın.",
    bullets: [
      "Günlük satış ve sipariş özeti",
      "Ödeme yöntemine göre kırılım",
      "Ürün ve kategori performansı",
      "Dönem karşılaştırmalı görünümler",
    ],
    preview: {
      heading: "Bugün",
      rows: [
        { primary: "₺18.420", secondary: "62 sipariş · ort. ₺297", badge: "Ciro", tone: "green" },
        { primary: "%68 kart", secondary: "%32 nakit", badge: "Ödeme", tone: "sky" },
        { primary: "Izgara köfte", secondary: "24 adet satıldı", badge: "En çok", tone: "amber" },
      ],
    },
  },
  {
    id: "team",
    label: "Ekip & Roller",
    icon: Users,
    title: "Herkes yalnızca kendi işinin ekranını görür",
    description:
      "Sahip, yönetici, kasiyer, garson, mutfak ve kurye rolleri ayrı yetkilerle çalışır; ekip davetle katılır.",
    bullets: [
      "E-posta davetiyle ekip üyesi ekleme",
      "6 hazır rol, role uygun menü ve yetki",
      "Rol değişikliği ve üyelik yönetimi",
      "İşletme verisi diğer işletmelerden izole",
    ],
    preview: {
      heading: "Ekip",
      rows: [
        { primary: "Ayşe K.", secondary: "ayse@ornek.com", badge: "Yönetici", tone: "sky" },
        { primary: "Mehmet D.", secondary: "Motosiklet · 34 ABC 123", badge: "Kurye", tone: "amber" },
        { primary: "davet@ornek.com", secondary: "Davet gönderildi", badge: "Bekliyor", tone: "orange" },
      ],
    },
  },
]

const badgeTones: Record<ModuleDefinition["preview"]["rows"][number]["tone"], string> = {
  orange: "bg-orange-100 text-orange-800",
  green: "bg-green-100 text-green-800",
  amber: "bg-amber-100 text-amber-800",
  sky: "bg-sky-100 text-sky-800",
}

export function ModuleShowcase() {
  const [activeId, setActiveId] = useState(modules[0].id)
  const activeModule = modules.find((module) => module.id === activeId) ?? modules[0]

  return (
    <div className="mt-12">
      <div className="flex gap-2 overflow-x-auto pb-2" role="tablist" aria-label="Ürün modülleri">
        {modules.map((module) => {
          const isActive = module.id === activeId
          const TabIcon = module.icon
          return (
            <button
              key={module.id}
              type="button"
              role="tab"
              id={`module-tab-${module.id}`}
              aria-selected={isActive}
              aria-controls={`module-panel-${module.id}`}
              onClick={() => setActiveId(module.id)}
              className={cn(
                "flex shrink-0 items-center gap-2 border px-4 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "border-gray-950 bg-gray-950 text-white"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-400 hover:text-gray-950",
              )}
            >
              <TabIcon className="h-4 w-4" aria-hidden="true" />
              {module.label}
            </button>
          )
        })}
      </div>

      <div
        key={activeModule.id}
        role="tabpanel"
        id={`module-panel-${activeModule.id}`}
        aria-labelledby={`module-tab-${activeModule.id}`}
        className="grid gap-10 border border-gray-200 bg-white p-6 duration-300 animate-in fade-in slide-in-from-bottom-2 sm:p-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14"
      >
        <div>
          <h3 className="font-display text-2xl font-semibold sm:text-3xl">{activeModule.title}</h3>
          <p className="mt-4 max-w-xl text-base leading-7 text-gray-600">{activeModule.description}</p>
          <ul className="mt-7 space-y-3">
            {activeModule.bullets.map((bullet) => (
              <li key={bullet} className="flex items-start gap-3 text-sm leading-6 text-gray-700">
                <span className="mt-1 grid h-4 w-4 shrink-0 place-items-center bg-green-700 text-white">
                  <Check className="h-3 w-3" aria-hidden="true" />
                </span>
                {bullet}
              </li>
            ))}
          </ul>
        </div>

        <div className="border border-gray-200 bg-gray-50" aria-hidden="true">
          <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
            <p className="text-sm font-semibold">{activeModule.preview.heading}</p>
            <span className="h-2 w-2 rounded-full bg-green-600" />
          </div>
          <div className="space-y-3 p-4">
            {activeModule.preview.rows.map((row) => (
              <div key={row.primary} className="flex items-center justify-between gap-3 border border-gray-200 bg-white p-3.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{row.primary}</p>
                  <p className="mt-0.5 truncate text-xs text-gray-500">{row.secondary}</p>
                </div>
                <span className={cn("shrink-0 px-2 py-1 text-[11px] font-semibold", badgeTones[row.tone])}>
                  {row.badge}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
