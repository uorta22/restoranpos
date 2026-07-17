"use client"

import { useEffect, useState, type FormEvent } from "react"
import { Building2, ConciergeBell, MapPinned, Save } from "lucide-react"
import { Header } from "@/components/header"
import { SidebarNav } from "@/components/sidebar-nav"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import type { OrderType } from "@/lib/database.types"
import { getClientSupabaseInstance } from "@/lib/supabase"
import { cn } from "@/lib/utils"

const serviceModeOptions: Array<{ id: OrderType; label: string; description: string }> = [
  { id: "dine_in", label: "Masada servis", description: "Masa ve adisyon akışı" },
  { id: "takeaway", label: "Gel-al", description: "Kasadan teslim siparişleri" },
  { id: "delivery", label: "Paket servis", description: "Kurye ve teslimat akışı" },
]

export default function SettingsPage() {
  const { user, isLoading: isAuthLoading } = useAuth()
  const { toast } = useToast()
  const [showSidebar, setShowSidebar] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    taxRate: "0",
  })
  const [serviceModes, setServiceModes] = useState<OrderType[]>([])
  const canManage = user?.memberRole === "owner" || user?.memberRole === "manager"

  useEffect(() => {
    const handleResize = () => setShowSidebar(window.innerWidth >= 768)
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  useEffect(() => {
    if (!user?.restaurant_id || !canManage) return
    let active = true
    const supabase = getClientSupabaseInstance()
    void supabase
      .from("restaurants")
      .select("name, address, phone, email, tax_rate, service_modes")
      .eq("id", user.restaurant_id)
      .single()
      .then(({ data, error }) => {
        if (!active) return
        if (error) {
          toast({ title: "Ayarlar yüklenemedi", description: error.message, variant: "destructive" })
        } else {
          setFormData({
            name: data.name,
            address: data.address ?? "",
            phone: data.phone ?? "",
            email: data.email ?? "",
            taxRate: String(data.tax_rate),
          })
          setServiceModes(data.service_modes ?? [])
        }
        setIsLoading(false)
      })
    return () => {
      active = false
    }
  }, [canManage, toast, user?.restaurant_id])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user?.restaurant_id || !canManage) return
    const name = formData.name.trim()
    const taxRate = Number(formData.taxRate)
    if (name.length < 2 || !Number.isFinite(taxRate) || taxRate < 0 || taxRate > 100) {
      toast({
        title: "Geçersiz ayar",
        description: "Restoran adı ve KDV oranını kontrol edin.",
        variant: "destructive",
      })
      return
    }
    if (serviceModes.length === 0) {
      toast({
        title: "Servis modeli gerekli",
        description: "En az bir servis modeli seçili olmalıdır.",
        variant: "destructive",
      })
      return
    }
    setIsSaving(true)
    const supabase = getClientSupabaseInstance()
    const { error } = await supabase
      .from("restaurants")
      .update({
        name,
        address: formData.address.trim() || null,
        phone: formData.phone.trim() || null,
        email: formData.email.trim() || null,
        tax_rate: taxRate,
        service_modes: serviceModes,
      })
      .eq("id", user.restaurant_id)

    setIsSaving(false)
    toast(
      error
        ? { title: "Ayarlar kaydedilemedi", description: error.message, variant: "destructive" }
        : { title: "Ayarlar kaydedildi", description: "Restoran bilgileri güncellendi." },
    )
  }

  if (isAuthLoading) {
    return (
      <div className="grid h-screen place-items-center bg-gray-50">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-orange-600" />
      </div>
    )
  }

  if (!canManage) return null

  if (isLoading) {
    return (
      <div className="grid h-screen place-items-center bg-gray-50">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-orange-600" />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {showSidebar && <SidebarNav />}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header showMobileMenu={!showSidebar} onMenuToggle={() => setShowSidebar((current) => !current)} />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="mx-auto max-w-3xl">
            <h1 className="text-2xl font-semibold text-gray-950">Ayarlar</h1>

            <section className="mt-7 border-b border-gray-200 pb-8">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-orange-600" aria-hidden="true" />
                <h2 className="text-lg font-medium text-gray-950">Restoran bilgileri</h2>
              </div>
              <form onSubmit={handleSubmit} className="mt-5 grid gap-5 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="settings-name">Restoran adı</Label>
                  <Input id="settings-name" value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} required />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="settings-address">Adres</Label>
                  <Input id="settings-address" value={formData.address} onChange={(event) => setFormData({ ...formData, address: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="settings-phone">Telefon</Label>
                  <Input id="settings-phone" type="tel" value={formData.phone} onChange={(event) => setFormData({ ...formData, phone: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="settings-email">E-posta</Label>
                  <Input id="settings-email" type="email" value={formData.email} onChange={(event) => setFormData({ ...formData, email: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="settings-tax">KDV oranı (%)</Label>
                  <Input id="settings-tax" type="number" min="0" max="100" step="0.01" value={formData.taxRate} onChange={(event) => setFormData({ ...formData, taxRate: event.target.value })} />
                </div>

                <fieldset className="sm:col-span-2 border-t border-gray-200 pt-5">
                  <legend className="sr-only">Servis modelleri</legend>
                  <div className="flex items-center gap-2">
                    <ConciergeBell className="h-5 w-5 text-orange-600" aria-hidden="true" />
                    <h2 className="text-lg font-medium text-gray-950">Servis modelleri</h2>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">En az bir servis modeli seçili olmalıdır.</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    {serviceModeOptions.map((option) => {
                      const checked = serviceModes.includes(option.id)
                      return (
                        <label
                          key={option.id}
                          className={cn(
                            "flex cursor-pointer items-start gap-3 rounded-md border bg-white p-4 transition-colors",
                            checked ? "border-orange-500" : "border-gray-200 hover:border-gray-400",
                          )}
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(nextChecked) => {
                              setServiceModes((current) =>
                                nextChecked ? [...current, option.id] : current.filter((mode) => mode !== option.id),
                              )
                            }}
                            aria-label={option.label}
                          />
                          <span className="min-w-0">
                            <span className="block text-sm font-medium">{option.label}</span>
                            <span className="mt-1 block text-xs leading-5 text-gray-500">{option.description}</span>
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </fieldset>

                <div className="flex items-end">
                  <Button type="submit" disabled={isSaving}>
                    <Save className="mr-2 h-4 w-4" aria-hidden="true" />
                    {isSaving ? "Kaydediliyor..." : "Kaydet"}
                  </Button>
                </div>
              </form>
            </section>

            <section className="py-8">
              <div className="flex items-center gap-2">
                <MapPinned className="h-5 w-5 text-orange-600" aria-hidden="true" />
                <h2 className="text-lg font-medium text-gray-950">Harita entegrasyonu</h2>
              </div>
              <p className="mt-3 text-sm text-gray-600">
                Durum: {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? "Etkin" : "Yapılandırılmamış"}
              </p>
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}
