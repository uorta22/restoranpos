import type React from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { UtensilsCrossed } from "lucide-react"
import { MarketingHeader } from "@/components/marketing/marketing-header"
import { getPanelHref } from "@/lib/marketing-links"

function getMetadataBase() {
  const configuredUrl = process.env.NEXT_PUBLIC_MARKETING_URL
  if (configuredUrl) {
    try {
      const url = new URL(configuredUrl)
      if (url.protocol === "http:" || url.protocol === "https:") return url
    } catch {
      // Local fallback keeps metadata rendering deterministic when configuration is incomplete.
    }
  }
  return new URL("http://www.localhost:3000")
}

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: { absolute: "RestaurantPOS | Restoran yönetim sistemi" },
  description: "Sipariş, masa, mutfak, ekip, stok ve raporlama süreçlerini tek panelde yönetin.",
  openGraph: {
    title: "RestaurantPOS | Restoran yönetim sistemi",
    description: "Restoran operasyonunuzu servisten mutfağa tek panelde yönetin.",
    images: [{ url: "/images/restaurant-pos-hero-generated.jpg", width: 1536, height: 1024 }],
  },
}

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  const loginHref = getPanelHref("/login")
  const signupHref = getPanelHref("/signup?plan=standard&cycle=monthly&source=header")
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@restaurantpos.com"

  return (
    <div className="min-h-screen bg-white text-gray-950">
      <MarketingHeader loginHref={loginHref} signupHref={signupHref} />
      {children}
      <footer className="bg-gray-950 text-gray-300">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
          <div className="max-w-sm">
            <Link href="/" className="flex items-center gap-2 font-semibold text-white" aria-label="RestaurantPOS ana sayfa">
              <span className="grid h-9 w-9 place-items-center bg-orange-600 text-white">
                <UtensilsCrossed className="h-5 w-5" aria-hidden="true" />
              </span>
              <span>RestaurantPOS</span>
            </Link>
            <p className="mt-4 text-sm leading-6 text-gray-400">
              Restoran operasyonunu siparişten rapora kadar ortak çalışma alanında yönetin.
            </p>
          </div>
          <nav aria-label="Footer ürün menüsü">
            <p className="text-sm font-semibold text-white">Ürün</p>
            <div className="mt-4 grid gap-3 text-sm text-gray-400">
              <a href="#ozellikler" className="hover:text-white">Özellikler</a>
              <a href="#nasil-calisir" className="hover:text-white">Nasıl çalışır?</a>
              <a href="#fiyatlandirma" className="hover:text-white">Fiyatlandırma</a>
            </div>
          </nav>
          <nav aria-label="Footer şirket menüsü">
            <p className="text-sm font-semibold text-white">RestaurantPOS</p>
            <div className="mt-4 grid gap-3 text-sm text-gray-400">
              <a href="#hakkimizda" className="hover:text-white">Hakkımızda</a>
              <a href="#iletisim" className="hover:text-white">İletişim</a>
              <a href={`mailto:${contactEmail}`} className="break-all hover:text-white">{contactEmail}</a>
            </div>
          </nav>
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-6 text-xs text-gray-500 sm:px-8">
            <span>© {new Date().getFullYear()} RestaurantPOS</span>
            <span>Restoran operasyon yönetimi</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
