import type React from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { Fraunces } from "next/font/google"
import { UtensilsCrossed } from "lucide-react"
import { MarketingHeader } from "@/components/marketing/marketing-header"
import { getPanelHref } from "@/lib/marketing-links"

const display = Fraunces({
  subsets: ["latin", "latin-ext"],
  variable: "--font-display",
})

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

const footerProductLinks = [
  { label: "Modüller", href: "/#ozellikler" },
  { label: "Kimler için?", href: "/#segmentler" },
  { label: "Nasıl çalışır?", href: "/#nasil-calisir" },
  { label: "Fiyatlandırma", href: "/#fiyatlandirma" },
]

const footerCompanyLinks = [
  { label: "Hakkımızda", href: "/#hakkimizda" },
  { label: "Sık sorulanlar", href: "/#sss" },
  { label: "İletişim", href: "/#iletisim" },
]

const footerLegalLinks = [
  { label: "KVKK Aydınlatma Metni", href: "/kvkk" },
  { label: "Gizlilik Politikası", href: "/privacy" },
  { label: "Kullanım Koşulları", href: "/terms" },
]

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  const loginHref = getPanelHref("/login")
  const signupHref = getPanelHref("/signup?plan=standard&cycle=monthly&source=header")
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@restaurantpos.com"

  return (
    <div className={`${display.variable} min-h-screen bg-white text-gray-950`}>
      <MarketingHeader loginHref={loginHref} signupHref={signupHref} />
      {children}
      <footer className="bg-gray-950 text-gray-300">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-2 lg:grid-cols-[1.3fr_0.7fr_0.7fr_0.7fr]">
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
            <a
              href={`mailto:${contactEmail}`}
              className="mt-5 inline-block break-all border-b border-orange-500/40 pb-0.5 text-sm text-orange-300 transition-colors hover:border-orange-400 hover:text-orange-200"
            >
              {contactEmail}
            </a>
          </div>
          <nav aria-label="Footer ürün menüsü">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Ürün</p>
            <div className="mt-4 grid gap-3 text-sm text-gray-400">
              {footerProductLinks.map((link) => (
                <a key={link.href} href={link.href} className="transition-colors hover:text-white">
                  {link.label}
                </a>
              ))}
            </div>
          </nav>
          <nav aria-label="Footer şirket menüsü">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">RestaurantPOS</p>
            <div className="mt-4 grid gap-3 text-sm text-gray-400">
              {footerCompanyLinks.map((link) => (
                <a key={link.href} href={link.href} className="transition-colors hover:text-white">
                  {link.label}
                </a>
              ))}
            </div>
          </nav>
          <nav aria-label="Footer yasal menüsü">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Yasal</p>
            <div className="mt-4 grid gap-3 text-sm text-gray-400">
              {footerLegalLinks.map((link) => (
                <Link key={link.href} href={link.href} className="transition-colors hover:text-white">
                  {link.label}
                </Link>
              ))}
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
