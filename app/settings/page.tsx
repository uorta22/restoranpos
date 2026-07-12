"use client"

import { useEffect, useState, type FormEvent } from "react"
import { Building2, MapPinned, Save } from "lucide-react"
import { Header } from "@/components/header"
import { SidebarNav } from "@/components/sidebar-nav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import { getClientSupabaseInstance } from "@/lib/supabase"

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
      .select("name, address, phone, email, tax_rate")
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
