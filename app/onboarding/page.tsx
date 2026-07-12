"use client"

import { useEffect, useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, Building2 } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { getClientSupabaseInstance } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

export default function OnboardingPage() {
  const router = useRouter()
  const { user, isLoading, refreshUser } = useAuth()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
  })

  useEffect(() => {
    if (user?.restaurant_id) router.replace("/")
  }, [router, user])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user) return
    if (formData.name.trim().length < 2) {
      toast({
        title: "Restoran adı gerekli",
        description: "En az iki karakterden oluşan bir restoran adı girin.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    const supabase = getClientSupabaseInstance()
    const { error } = await supabase.rpc("create_restaurant", {
      restaurant_name: formData.name.trim(),
      restaurant_address: formData.address.trim() || undefined,
      restaurant_phone: formData.phone.trim() || undefined,
      restaurant_email: formData.email.trim() || user.email || undefined,
    })

    if (error) {
      setIsSubmitting(false)
      toast({
        title: "Restoran oluşturulamadı",
        description: error.message,
        variant: "destructive",
      })
      return
    }

    await refreshUser()
    router.replace("/")
    router.refresh()
  }

  if (isLoading || !user || user.restaurant_id) {
    return (
      <main className="grid min-h-screen place-items-center bg-gray-50">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-orange-600" />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 sm:py-16">
      <div className="mx-auto w-full max-w-xl">
        <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-md bg-orange-600 text-white">
          <Building2 className="h-6 w-6" aria-hidden="true" />
        </div>
        <h1 className="text-3xl font-semibold text-gray-950">Restoranınızı oluşturun</h1>
        <p className="mt-2 text-sm text-gray-600">Menü, masalar ve ekip bu işletme altında yönetilecek.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="restaurant-name">Restoran adı</Label>
            <Input
              id="restaurant-name"
              value={formData.name}
              onChange={(event) => setFormData({ ...formData, name: event.target.value })}
              autoComplete="organization"
              maxLength={120}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="restaurant-address">Adres</Label>
            <Input
              id="restaurant-address"
              value={formData.address}
              onChange={(event) => setFormData({ ...formData, address: event.target.value })}
              autoComplete="street-address"
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="restaurant-phone">Telefon</Label>
              <Input
                id="restaurant-phone"
                type="tel"
                value={formData.phone}
                onChange={(event) => setFormData({ ...formData, phone: event.target.value })}
                autoComplete="tel"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="restaurant-email">E-posta</Label>
              <Input
                id="restaurant-email"
                type="email"
                value={formData.email}
                onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                placeholder={user.email}
                autoComplete="email"
              />
            </div>
          </div>
          <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
            {isSubmitting ? "Oluşturuluyor..." : "Restoranı oluştur"}
            {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />}
          </Button>
        </form>
      </div>
    </main>
  )
}
