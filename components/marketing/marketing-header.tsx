"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowUpRight, Menu, UtensilsCrossed, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface MarketingHeaderProps {
  loginHref: string
  signupHref: string
}

const navigation = [
  { label: "Özellikler", href: "#ozellikler" },
  { label: "Nasıl çalışır?", href: "#nasil-calisir" },
  { label: "Hakkımızda", href: "#hakkimizda" },
  { label: "Fiyatlandırma", href: "#fiyatlandirma" },
  { label: "İletişim", href: "#iletisim" },
]

export function MarketingHeader({ loginHref, signupHref }: MarketingHeaderProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-semibold" aria-label="RestaurantPOS ana sayfa">
          <span className="grid h-9 w-9 place-items-center bg-orange-600 text-white">
            <UtensilsCrossed className="h-5 w-5" aria-hidden="true" />
          </span>
          <span>RestaurantPOS</span>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex" aria-label="Ana menü">
          {navigation.map((item) => (
            <a key={item.href} href={item.href} className="text-sm text-gray-600 transition-colors hover:text-gray-950">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 sm:flex">
          <a
            href={loginHref}
            className="inline-flex h-10 items-center px-3 text-sm font-medium text-gray-700 transition-colors hover:text-gray-950"
          >
            Panele gir
          </a>
          <a
            href={signupHref}
            className="inline-flex h-10 items-center gap-2 bg-gray-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
          >
            Ücretsiz başla
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>

        <button
          type="button"
          className="grid h-10 w-10 place-items-center border border-gray-300 text-gray-950 sm:hidden"
          onClick={() => setIsOpen((current) => !current)}
          aria-label={isOpen ? "Menüyü kapat" : "Menüyü aç"}
          aria-expanded={isOpen}
        >
          {isOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
        </button>
      </div>

      <div className={cn("border-t border-gray-200 bg-white sm:hidden", isOpen ? "block" : "hidden")}>
        <nav className="mx-auto max-w-7xl px-5 py-4" aria-label="Mobil menü">
          <div className="grid">
            {navigation.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="border-b border-gray-100 py-3 text-sm font-medium text-gray-700"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </a>
            ))}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <a
              href={loginHref}
              className="inline-flex h-11 items-center justify-center border border-gray-300 px-3 text-sm font-medium"
            >
              Panele gir
            </a>
            <a
              href={signupHref}
              className="inline-flex h-11 items-center justify-center bg-orange-600 px-3 text-sm font-semibold text-white"
            >
              Ücretsiz başla
            </a>
          </div>
        </nav>
      </div>
    </header>
  )
}
