"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Check, Crown } from "lucide-react"
import { FEATURES } from "@/lib/subscription-plans"
import { formatCurrency } from "@/lib/utils"
import { getClientSupabaseInstance } from "@/lib/supabase"
import type { Tables } from "@/lib/database.types"
import { useLicense } from "@/context/license-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function BillingPage() {
  const { license, isLoading } = useLicense()
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly")
  const [plans, setPlans] = useState<Tables<"subscription_plans">[]>([])
  const [isPlansLoading, setIsPlansLoading] = useState(true)
  const [plansError, setPlansError] = useState<string | null>(null)

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

  if (isLoading || isPlansLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-gray-50">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-orange-600" />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 sm:py-14">
      <div className="mx-auto max-w-6xl">
        <Link href="/" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-950">
          <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
          Panele dön
        </Link>

        <div className="mt-7 flex flex-wrap items-end justify-between gap-5">
          <div>
            <h1 className="text-3xl font-semibold text-gray-950">Abonelik planları</h1>
            <p className="mt-2 text-sm text-gray-600">İşletmenizin kullandığı modülleri ve dönem fiyatlarını karşılaştırın.</p>
          </div>
          <Tabs value={billingCycle} onValueChange={(value) => setBillingCycle(value as "monthly" | "yearly")}>
            <TabsList>
              <TabsTrigger value="monthly">Aylık</TabsTrigger>
              <TabsTrigger value="yearly">Yıllık</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {plansError ? (
          <p className="mt-8 border-l-2 border-red-600 py-2 pl-4 text-sm text-red-700">{plansError}</p>
        ) : (
        <div className="mt-8 grid gap-5 lg:grid-cols-3">
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
