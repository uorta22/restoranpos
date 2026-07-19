"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { AlertTriangle, ArrowLeft, Check, Crown } from "lucide-react"
import { FEATURES } from "@/lib/subscription-plans"
import { cn, formatCurrency, formatDate } from "@/lib/utils"
import { getClientSupabaseInstance } from "@/lib/supabase"
import type { Tables } from "@/lib/database.types"
import { useLicense } from "@/context/license-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@restaurantpos.com"

const STATUS_LABELS: Record<string, string> = {
  trialing: "Deneme",
  active: "Aktif",
  past_due: "Ödeme gecikti",
  cancelled: "İptal edildi",
  expired: "Süresi doldu",
}

type SubscriptionSummary = Pick<Tables<"restaurant_subscriptions">, "billing_cycle" | "current_period_end">

export default function BillingPage() {
  const { license, isLoading, isTrialExpired, getRemainingDays } = useLicense()
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly")
  const [plans, setPlans] = useState<Tables<"subscription_plans">[]>([])
  const [isPlansLoading, setIsPlansLoading] = useState(true)
  const [plansError, setPlansError] = useState<string | null>(null)
  const [subscription, setSubscription] = useState<SubscriptionSummary | null>(null)

  useEffect(() => {
    let active = true
    const supabase = getClientSupabaseInstance()
    void supabase
      .from("subscription_plans")
      .select("*")
      .eq("is_active", true)
      .order("price_monthly", { ascending: true })
      .then(({ data, error }) => {
        if (!active) return
        if (error) setPlansError("Abonelik planları şu anda yüklenemiyor.")
        else setPlans(data)
        setIsPlansLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    // license.id abonelik kaydındaki restaurant_id değeridir
    if (!license?.id) return
    let active = true
    const supabase = getClientSupabaseInstance()
    void supabase
      .from("restaurant_subscriptions")
      .select("billing_cycle, current_period_end")
      .eq("restaurant_id", license.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return
        setSubscription(data ?? null)
      })

    return () => {
      active = false
    }
  }, [license?.id])

  if (isLoading || isPlansLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-gray-50">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-orange-600" />
      </main>
    )
  }

  const trialExpired = isTrialExpired()
  const remainingDays = getRemainingDays()
  const currentPlanName = license ? (plans.find((plan) => plan.id === license.plan)?.name ?? license.plan) : null
  const statusLabel = license ? (STATUS_LABELS[license.status] ?? license.status) : null
  const statusTone =
    license?.status === "active"
      ? "border-green-200 bg-green-50 text-green-700"
      : license?.status === "trialing"
        ? "border-orange-200 bg-orange-50 text-orange-700"
        : "border-red-200 bg-red-50 text-red-700"
  const periodEnd = subscription?.current_period_end ?? license?.validUntil ?? null

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 sm:py-14">
      <div className="mx-auto max-w-6xl">
        <Link href="/" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-950">
          <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
          Panele dön
        </Link>

        <div className="mt-7 flex flex-wrap items-end justify-between gap-5">
          <div>
            <h1 className="text-3xl font-semibold text-gray-950">Aboneliğiniz</h1>
            <p className="mt-2 text-sm text-gray-600">Tüm modüller tek pakette; aylık veya yıllık dönem fiyatını görüntüleyin.</p>
          </div>
          <Tabs value={billingCycle} onValueChange={(value) => setBillingCycle(value as "monthly" | "yearly")}>
            <TabsList>
              <TabsTrigger value="monthly">Aylık</TabsTrigger>
              <TabsTrigger value="yearly">Yıllık</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {license && (
          <Card className="mt-8">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="text-lg">Mevcut abonelik</CardTitle>
                <span className={cn("inline-flex items-center border px-2.5 py-0.5 text-xs font-medium", statusTone)}>
                  {statusLabel}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-gray-500">Plan</dt>
                  <dd className="mt-1 text-sm font-medium text-gray-950">{currentPlanName}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-gray-500">Kalan gün</dt>
                  <dd className="mt-1 text-sm font-medium text-gray-950">{remainingDays} gün</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-gray-500">Faturalama dönemi</dt>
                  <dd className="mt-1 text-sm font-medium text-gray-950">
                    {subscription ? (subscription.billing_cycle === "yearly" ? "Yıllık" : "Aylık") : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-gray-500">Dönem bitişi</dt>
                  <dd className="mt-1 text-sm font-medium text-gray-950">
                    {periodEnd ? formatDate(new Date(periodEnd)) : "—"}
                  </dd>
                </div>
              </dl>

              {trialExpired && (
                <div className="mt-5 flex items-start gap-3 border-l-2 border-red-600 bg-red-50 p-4">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Deneme süreniz sona erdi</p>
                    <p className="mt-1 text-sm text-red-700">
                      Panele kesintisiz erişim için aboneliğinizi etkinleştirmeniz gerekiyor.
                    </p>
                    <Button asChild size="sm" className="mt-3 bg-red-600 text-white hover:bg-red-700">
                      <a href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Abonelik aktivasyonu")}`}>
                        Destek ile iletişime geçin
                      </a>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {plansError ? (
          <p className="mt-8 border-l-2 border-red-600 py-2 pl-4 text-sm text-red-700">{plansError}</p>
        ) : (
        <div className="mt-8 grid max-w-md gap-5">
          {plans.map((plan) => {
            const isCurrent = license?.plan === plan.id
            const price = billingCycle === "yearly" ? plan.price_yearly : plan.price_monthly
            return (
              <Card key={plan.id} className={plan.id === "standard" ? "border-orange-500" : undefined}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    {plan.id === "standard" && <Crown className="h-5 w-5 text-orange-600" aria-label="Önerilen" />}
                  </div>
                  <CardDescription>{plan.description ?? ""}</CardDescription>
                  <div className="pt-3">
                    <span className="text-3xl font-semibold text-gray-950">{formatCurrency(price)}</span>
                    <span className="ml-1 text-sm text-gray-500">/{billingCycle === "monthly" ? "ay" : "yıl"}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((featureId) => (
                      <li key={featureId} className="flex items-start gap-2 text-sm text-gray-700">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" aria-hidden="true" />
                        {FEATURES.find((feature) => feature.id === featureId)?.name || featureId}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" variant={isCurrent ? "outline" : "default"} disabled>
                    {isCurrent ? "Mevcut plan" : "Plan değişikliği yakında"}
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
        )}
      </div>
    </main>
  )
}
