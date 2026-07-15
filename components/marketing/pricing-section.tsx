"use client"

import { useState } from "react"
import { ArrowRight, Check } from "lucide-react"
import { FEATURES, PLANS } from "@/lib/subscription-plans"
import { cn } from "@/lib/utils"

type BillingCycle = "monthly" | "yearly"

interface PricingSectionProps {
  signupHref: string
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(value)
}

export function PricingSection({ signupHref }: PricingSectionProps) {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly")

  return (
    <section id="fiyatlandirma" className="scroll-mt-20 border-t border-gray-200 bg-gray-50 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase text-orange-700">Fiyatlandırma</p>
            <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">İşletmeniz büyüdükçe genişleyen planlar</h2>
            <p className="mt-4 text-base leading-7 text-gray-600">
              Tüm planlarda 14 günlük ücretsiz deneme bulunur. Kredi kartı olmadan işletmenizi kurmaya başlayın.
            </p>
          </div>

          <div className="inline-flex rounded-md border border-gray-300 bg-white p-1" aria-label="Faturalama dönemi">
            {(["monthly", "yearly"] as BillingCycle[]).map((cycle) => (
              <button
                key={cycle}
                type="button"
                className={cn(
                  "h-9 rounded-sm px-4 text-sm font-medium transition-colors",
                  billingCycle === cycle ? "bg-gray-950 text-white" : "text-gray-600 hover:text-gray-950",
                )}
                onClick={() => setBillingCycle(cycle)}
                aria-pressed={billingCycle === cycle}
              >
                {cycle === "monthly" ? "Aylık" : "Yıllık · 2 ay avantaj"}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {PLANS.map((plan) => {
            const isRecommended = plan.id === "standard"
            const price = billingCycle === "monthly" ? plan.price : plan.yearlyPrice
            const signupUrl = `${signupHref}?plan=${plan.id}&cycle=${billingCycle}&source=pricing`

            return (
              <article
                key={plan.id}
                className={cn(
                  "flex min-h-[520px] flex-col rounded-md border bg-white p-6",
                  isRecommended ? "border-orange-500 ring-1 ring-orange-500" : "border-gray-200",
                )}
              >
                <div className="flex min-h-7 items-start justify-between gap-4">
                  <h3 className="text-xl font-semibold">{plan.name}</h3>
                  {isRecommended && (
                    <span className="bg-orange-100 px-2 py-1 text-xs font-semibold text-orange-800">Önerilen</span>
                  )}
                </div>
                <p className="mt-3 min-h-12 text-sm leading-6 text-gray-600">{plan.description}</p>
                <div className="mt-6 border-y border-gray-200 py-5">
                  <p className="text-3xl font-semibold text-gray-950">{formatPrice(price)}</p>
                  <p className="mt-1 text-sm text-gray-500">
                    {billingCycle === "monthly" ? "aylık ödeme" : `yıllık ödeme · ayda ${formatPrice(plan.yearlyPrice / 12)}`}
                  </p>
                </div>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((featureId) => (
                    <li key={featureId} className="flex items-start gap-2 text-sm leading-5 text-gray-700">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-700" aria-hidden="true" />
                      {FEATURES.find((feature) => feature.id === featureId)?.name ?? featureId}
                    </li>
                  ))}
                </ul>
                <a
                  href={signupUrl}
                  className={cn(
                    "mt-auto inline-flex h-11 items-center justify-center gap-2 px-4 text-sm font-semibold transition-colors",
                    isRecommended
                      ? "bg-orange-600 text-white hover:bg-orange-700"
                      : "border border-gray-300 text-gray-950 hover:border-gray-950 hover:bg-gray-950 hover:text-white",
                  )}
                >
                  14 gün ücretsiz dene
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>
              </article>
            )
          })}
        </div>

        <p className="mt-5 text-center text-xs leading-5 text-gray-500">
          Fiyatlara vergiler dahil değildir. Deneme sonunda onayınız olmadan ücretli abonelik başlatılmaz.
        </p>
      </div>
    </section>
  )
}
