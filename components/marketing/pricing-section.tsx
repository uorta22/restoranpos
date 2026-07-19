"use client"

import { useState } from "react"
import { ArrowRight, Check } from "lucide-react"
import { FEATURES, SINGLE_PLAN } from "@/lib/subscription-plans"
import { cn } from "@/lib/utils"

type BillingCycle = "monthly" | "yearly"

interface PricingSectionProps {
  signupHref: string
}

// Menü modüllerine ek olarak "her şey dahil" vaadini güçlendiren platform kalemleri.
const platformHighlights = [
  "Kendi online sipariş siteniz (QR menü)",
  "Yemeksepeti / Getir / Trendyol GO entegrasyonu",
  "6 ekip rolü ve yetki yönetimi",
  "Müşteriye canlı teslimat takibi",
  "Sınırsız ürün, kategori ve masa",
  "Kurulum, güncelleme ve destek dahil",
]

function formatPrice(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(value)
}

export function PricingSection({ signupHref }: PricingSectionProps) {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly")
  const price = billingCycle === "monthly" ? SINGLE_PLAN.price : SINGLE_PLAN.yearlyPrice
  const monthlyEquivalent = SINGLE_PLAN.yearlyPrice / 12
  const signupUrl = `${signupHref}?plan=${SINGLE_PLAN.id}&cycle=${billingCycle}&source=pricing`
  const moduleFeatures = SINGLE_PLAN.features.map(
    (featureId) => FEATURES.find((feature) => feature.id === featureId)?.name ?? featureId,
  )
  const allFeatures = [...moduleFeatures, ...platformHighlights]

  return (
    <section id="fiyatlandirma" className="scroll-mt-20 border-t border-gray-200 bg-gray-50 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-orange-700">Fiyatlandırma</p>
            <h2 className="mt-3 font-display text-3xl font-semibold sm:text-5xl">Tek fiyat, her şey dahil</h2>
            <p className="mt-4 text-base leading-7 text-gray-600">
              Kademe yok, gizli eklenti yok, komisyon yok. Tüm modüller tek pakette. 14 gün ücretsiz deneyin, kredi
              kartı gerekmez.
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
                {cycle === "monthly" ? "Aylık" : "Yıllık · 2 ay hediye"}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-10 grid overflow-hidden border border-gray-200 bg-white lg:grid-cols-[1.4fr_0.9fr]">
          {/* Özellik listesi */}
          <div className="p-7 sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-wider text-green-800">{SINGLE_PLAN.name}</p>
            <p className="mt-2 max-w-lg text-base leading-7 text-gray-600">{SINGLE_PLAN.description}</p>
            <ul className="mt-8 grid gap-x-8 gap-y-3.5 sm:grid-cols-2">
              {allFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5 text-sm leading-6 text-gray-800">
                  <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center bg-green-700 text-white">
                    <Check className="h-3 w-3" aria-hidden="true" />
                  </span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Fiyat paneli */}
          <div className="flex flex-col justify-center gap-6 border-t border-gray-200 bg-gray-950 p-7 text-white sm:p-10 lg:border-l lg:border-t-0">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-5xl font-semibold">{formatPrice(price)}</span>
                <span className="text-sm text-gray-400">/{billingCycle === "monthly" ? "ay" : "yıl"}</span>
              </div>
              <p className="mt-2 text-sm text-gray-400">
                {billingCycle === "monthly"
                  ? "aylık ödeme · +KDV"
                  : `yıllık ödeme · ayda ${formatPrice(monthlyEquivalent)} · +KDV`}
              </p>
              {billingCycle === "yearly" && (
                <span className="mt-3 inline-block bg-orange-600 px-2 py-1 text-xs font-semibold text-white">
                  2 ay hediye
                </span>
              )}
            </div>

            <a
              href={signupUrl}
              className="inline-flex h-12 items-center justify-center gap-2 bg-orange-600 px-6 text-sm font-semibold text-white transition-colors hover:bg-orange-500"
            >
              14 gün ücretsiz başla
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
            <p className="text-xs leading-5 text-gray-400">
              Deneme sonunda onayınız olmadan ücretli abonelik başlatılmaz. İstediğiniz zaman iptal edin.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
