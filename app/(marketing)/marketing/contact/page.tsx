import type { Metadata } from "next"
import { ArrowUpRight, Clock3, Mail } from "lucide-react"
import { getPanelHref } from "@/lib/marketing-links"

export const metadata: Metadata = {
  title: { absolute: "İletişim | RestaurantPOS" },
  description: "Plan seçimi, kurulum ve ürün kapsamı hakkında RestaurantPOS ekibine ulaşın.",
}

export default function ContactPage() {
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@restaurantpos.com"
  const signupHref = getPanelHref("/signup?plan=standard&cycle=monthly&source=contact")

  return (
    <main>
      <section className="bg-gray-950 text-white">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
          <p className="inline-flex items-center gap-2 border border-white/20 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-orange-300">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
            İletişim
          </p>
          <h1 className="mt-6 max-w-3xl font-display text-3xl font-semibold leading-tight sm:text-5xl">
            Restoranınızın akışını birlikte değerlendirelim
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-gray-300">
            Plan seçimi, kurulum veya ürün kapsamı hakkında sorularınız için e-posta gönderin; denemeye hazır
            olduğunuzda hesabınızı doğrudan oluşturun.
          </p>
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid gap-px border border-gray-200 bg-gray-200 lg:grid-cols-2">
            <div className="flex flex-col bg-white p-7 sm:p-10">
              <span className="grid h-10 w-10 place-items-center border border-orange-600/30 text-orange-700">
                <Mail className="h-5 w-5" aria-hidden="true" />
              </span>
              <h2 className="mt-6 font-display text-2xl font-semibold">E-posta ile ulaşın</h2>
              <p className="mt-3 max-w-md text-sm leading-6 text-gray-600">
                Ürün, fiyatlandırma ve kurulum sorularınızı yanıtlıyoruz. Mevcut müşterilerimizin destek talepleri
                öncelikli olarak ele alınır.
              </p>
              <div className="mt-auto pt-8">
                <a
                  href={`mailto:${contactEmail}?subject=RestaurantPOS%20hakk%C4%B1nda`}
                  className="inline-flex h-12 items-center gap-2 bg-gray-950 px-6 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
                >
                  <Mail className="h-4 w-4" aria-hidden="true" />
                  {contactEmail}
                </a>
                <p className="mt-4 flex items-center gap-2 text-xs text-gray-500">
                  <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                  Genellikle 1 iş günü içinde yanıtlıyoruz.
                </p>
              </div>
            </div>

            <div className="flex flex-col bg-gray-950 p-7 text-white sm:p-10">
              <span className="grid h-10 w-10 place-items-center border border-white/20 text-orange-300">
                <ArrowUpRight className="h-5 w-5" aria-hidden="true" />
              </span>
              <h2 className="mt-6 font-display text-2xl font-semibold">Beklemeden deneyin</h2>
              <p className="mt-3 max-w-md text-sm leading-6 text-gray-300">
                Kredi kartı bilgisi istemeden 14 günlük deneme hesabı oluşturun; işletmenizi tanımlayıp ilk siparişi
                dakikalar içinde açın.
              </p>
              <div className="mt-auto pt-8">
                <a
                  href={signupHref}
                  className="inline-flex h-12 items-center gap-2 bg-orange-600 px-6 text-sm font-semibold text-white transition-colors hover:bg-orange-500"
                >
                  Ücretsiz hesap oluştur
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </a>
                <p className="mt-4 text-xs text-gray-400">14 gün ücretsiz · Kredi kartı gerekmez</p>
              </div>
            </div>
          </div>

          <p className="mt-8 text-sm leading-6 text-gray-600">
            Sık sorulan soruların yanıtları için{" "}
            <a href="/#sss" className="font-medium text-gray-950 underline underline-offset-2">
              SSS bölümüne
            </a>{" "}
            göz atabilirsiniz.
          </p>
        </div>
      </section>
    </main>
  )
}
