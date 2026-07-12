"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Building2, CheckCircle2, LogIn, UserPlus } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { membersApi, type RestaurantInvitation } from "@/lib/api"
import { Button } from "@/components/ui/button"

const roleLabels = {
  owner: "İşletme sahibi",
  manager: "Yönetici",
  cashier: "Kasiyer",
  waiter: "Garson",
  kitchen: "Mutfak",
  courier: "Kurye",
} as const

export default function InvitationPage() {
  const params = useParams<{ token: string }>()
  const router = useRouter()
  const { user, isLoading: isAuthLoading, refreshUser } = useAuth()
  const [invitation, setInvitation] = useState<RestaurantInvitation | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAccepting, setIsAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    void membersApi
      .getInvitation(params.token)
      .then((data) => {
        if (!active) return
        setInvitation(data)
        if (!data) setError("Bu davet geçersiz, süresi dolmuş veya daha önce kullanılmış.")
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "Davet okunamadı.")
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })
    return () => {
      active = false
    }
  }, [params.token])

  const loginUrl = `/login?redirect=${encodeURIComponent(`/invite/${params.token}`)}`
  const emailMatches = Boolean(user && invitation && user.email.toLowerCase() === invitation.email.toLowerCase())

  const acceptInvitation = async () => {
    setIsAccepting(true)
    setError(null)
    try {
      await membersApi.acceptInvitation(params.token)
      await refreshUser()
      router.replace("/")
      router.refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Davet kabul edilemedi.")
      setIsAccepting(false)
    }
  }

  if (isLoading || isAuthLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-gray-50">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-orange-600" />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12 sm:py-20">
      <div className="mx-auto max-w-lg">
        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-orange-600 text-white">
          <Building2 className="h-6 w-6" aria-hidden="true" />
        </div>

        {invitation ? (
          <>
            <h1 className="mt-7 text-3xl font-semibold text-gray-950">{invitation.restaurantName} ekibine katılın</h1>
            <p className="mt-3 text-gray-600">
              <span className="font-medium text-gray-900">{invitation.email}</span> adresi için {roleLabels[invitation.role]} rolüyle davet edildiniz.
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Davet {invitation.expiresAt.toLocaleDateString("tr-TR")} tarihine kadar geçerli.
            </p>

            {error && <p className="mt-5 border-l-2 border-red-500 pl-3 text-sm text-red-700">{error}</p>}

            <div className="mt-8">
              {!user ? (
                <Button onClick={() => router.push(loginUrl)}>
                  <LogIn className="mr-2 h-4 w-4" aria-hidden="true" />
                  Giriş yap veya hesap oluştur
                </Button>
              ) : emailMatches ? (
                <Button onClick={acceptInvitation} disabled={isAccepting}>
                  <CheckCircle2 className="mr-2 h-4 w-4" aria-hidden="true" />
                  {isAccepting ? "Davet kabul ediliyor..." : "Daveti kabul et"}
                </Button>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-red-700">
                    Bu davet {invitation.email} adresine ait. Şu anda {user.email} ile giriş yaptınız.
                  </p>
                  <Button variant="outline" onClick={() => router.push(loginUrl)}>
                    <UserPlus className="mr-2 h-4 w-4" aria-hidden="true" />
                    Doğru hesapla devam et
                  </Button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <h1 className="mt-7 text-3xl font-semibold text-gray-950">Davet kullanılamıyor</h1>
            <p className="mt-3 text-gray-600">{error || "Davet bilgileri bulunamadı."}</p>
          </>
        )}
      </div>
    </main>
  )
}
