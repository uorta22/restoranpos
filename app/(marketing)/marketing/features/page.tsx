import type { Metadata } from "next"
import { ArrowRight, ArrowUpRight } from "lucide-react"
import { ModuleShowcase } from "@/components/marketing/module-showcase"
import { getPanelHref } from "@/lib/marketing-links"

export const metadata: Metadata = {
  title: { absolute: "Modüller | RestaurantPOS" },
  description:
    "Sipariş, masa, mutfak, teslimat, stok, raporlama ve ekip modüllerini yakından inceleyin. Tüm operasyon tek veri kaynağında.",
}

export default function FeaturesPage() {
  const signupHref = getPanelHref("/signup?plan=standard&cycle=monthly&source=features")

  return (
    <main>
      <section className="bg-gray-950 text-white">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
          <p className="inline-flex items-center gap-2 border border-white/20 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-orange-300">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
            Modüller
          </p>
          <h1 className="mt-6 max-w-3xl font-display text-3xl font-semibold leading-tight sm:text-5xl">
            Operasyonun her parçası, tek veri kaynağı
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-gray-300">
            Kopuk araçlar yerine ortak akış: sipariş açıldığı anda mutfak, kasa, stok ve raporlar aynı kaydı izler.
            Yedi modülün her birini aşağıdan inceleyin.
          </p>
        </div>
      </section>

      <section className="bg-gray-50 pb-20 pt-4 sm:pb-24" aria-label="Modül detayları">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <ModuleShowcase />
        </div>
      </section>

      <section className="bg-orange-600 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-orange-100">Başlayın</p>
            <h2 className="mt-3 font-display text-3xl font-semibold sm:text-5xl">
              Tüm modüller, ilk günden açık
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-orange-50">
              14 günlük deneme süresince yedi modülün tamamını kendi menünüz ve ekibinizle test edin. Kredi kartı
              bilgisi gerekmez.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <a
              href={signupHref}
              className="inline-flex h-12 items-center justify-center gap-2 bg-white px-6 text-sm font-semibold text-orange-700 transition-colors hover:bg-gray-950 hover:text-white"
            >
              14 gün ücretsiz deneyin
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
            <a
              href="/#fiyatlandirma"
              className="inline-flex h-12 items-center justify-center gap-2 border border-white px-6 text-sm font-semibold text-white transition-colors hover:bg-white hover:text-orange-700"
            >
              Fiyatlandırmayı görün
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}
