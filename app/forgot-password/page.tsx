"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import { ArrowLeft, Mail } from "lucide-react"
import { getClientSupabaseInstance } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSent, setIsSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const confirmationUrl = new URL("/auth/confirm", window.location.origin)
    confirmationUrl.searchParams.set("next", "/reset-password")
    const supabase = getClientSupabaseInstance()
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: confirmationUrl.toString(),
    })

    setIsSubmitting(false)
    if (resetError) {
      setError("Parola sıfırlama isteği gönderilemedi. Lütfen daha sonra tekrar deneyin.")
      return
    }
    setIsSent(true)
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12 sm:py-20">
      <div className="mx-auto max-w-md">
        <Link href="/login" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-950">
          <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
          Giriş ekranına dön
        </Link>
        <div className="mt-8 flex h-12 w-12 items-center justify-center rounded-md bg-orange-600 text-white">
          <Mail className="h-6 w-6" aria-hidden="true" />
        </div>
        <h1 className="mt-6 text-3xl font-semibold text-gray-950">Parolanızı sıfırlayın</h1>
        <p className="mt-2 text-sm text-gray-600">Hesabınıza ait e-posta adresine güvenli bir bağlantı göndereceğiz.</p>

        {isSent ? (
          <p className="mt-8 border-l-2 border-green-600 pl-3 text-sm text-green-800">
            Hesap mevcutsa parola sıfırlama bağlantısı gönderildi. Gelen kutunuzu ve spam klasörünü kontrol edin.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="reset-email">E-posta</Label>
              <Input
                id="reset-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </div>
            {error && <p className="text-sm text-red-700">{error}</p>}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Gönderiliyor..." : "Sıfırlama bağlantısı gönder"}
            </Button>
          </form>
        )}
      </div>
    </main>
  )
}
