"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { KeyRound } from "lucide-react"
import { getClientSupabaseInstance } from "@/lib/supabase"
import { validatePassword } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!validatePassword(password)) {
      setError("Parola en az 8 karakter olmalı; büyük harf, küçük harf ve rakam içermelidir.")
      return
    }
    if (password !== confirmation) {
      setError("Parolalar eşleşmiyor.")
      return
    }

    setIsSubmitting(true)
    setError(null)
    const supabase = getClientSupabaseInstance()
    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) {
      setError("Parola güncellenemedi. Bağlantının süresi dolmuş olabilir.")
      setIsSubmitting(false)
      return
    }

    router.replace("/")
    router.refresh()
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12 sm:py-20">
      <div className="mx-auto max-w-md">
        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-orange-600 text-white">
          <KeyRound className="h-6 w-6" aria-hidden="true" />
        </div>
        <h1 className="mt-6 text-3xl font-semibold text-gray-950">Yeni parola belirleyin</h1>
        <p className="mt-2 text-sm text-gray-600">Hesabınız için daha önce kullanmadığınız güçlü bir parola seçin.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="new-password">Yeni parola</Label>
            <Input
              id="new-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password-confirmation">Yeni parola tekrar</Label>
            <Input
              id="new-password-confirmation"
              type="password"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              autoComplete="new-password"
              required
            />
          </div>
          {error && <p className="text-sm text-red-700">{error}</p>}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Güncelleniyor..." : "Parolayı güncelle"}
          </Button>
        </form>
      </div>
    </main>
  )
}
