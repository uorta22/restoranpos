"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/auth-context"
import { useLicense } from "@/context/license-context"
import { getPanelRouteRule } from "@/lib/panel-access"
import {
  Home,
  ShoppingCart,
  Users,
  Calendar,
  BarChart3,
  Settings,
  Boxes,
  CreditCard,
  MapPin,
  ChefHat,
  UtensilsCrossed,
  TableProperties,
  Plug,
} from "lucide-react"

const navigation: Array<{
  name: string
  href: string
  icon: typeof Home
}> = [
  { name: "Ana Sayfa", href: "/", icon: Home },
  { name: "Menü", href: "/menu", icon: UtensilsCrossed },
  { name: "Siparişler", href: "/orders", icon: ShoppingCart },
  { name: "Mutfak", href: "/kitchen", icon: ChefHat },
  { name: "Masalar", href: "/tables", icon: TableProperties },
  { name: "Rezervasyonlar", href: "/reservations", icon: Calendar },
  { name: "Teslimat", href: "/delivery", icon: MapPin },
  { name: "Ekip", href: "/team", icon: Users },
  { name: "Envanter", href: "/inventory", icon: Boxes },
  { name: "Raporlar", href: "/reports", icon: BarChart3 },
  { name: "Entegrasyonlar", href: "/integrations", icon: Plug },
  { name: "Ayarlar", href: "/settings", icon: Settings },
  { name: "Abonelik", href: "/billing", icon: CreditCard },
]

export function SidebarNav() {
  const pathname = usePathname()
  const { user } = useAuth()
  const { hasFeature, isLicenseValid, isLoading: isLicenseLoading } = useLicense()
  const hasUsableSubscription = !isLicenseLoading && isLicenseValid()
  const visibleNavigation = user?.memberRole
    ? navigation.filter((item) => {
        const rule = getPanelRouteRule(item.href)
        if (!rule?.roles.includes(user.memberRole!)) return false
        if (item.href === "/billing") return true
        if (!hasUsableSubscription) return false
        return !rule.feature || hasFeature(rule.feature)
      })
    : []

  return (
    <div className="w-64 bg-white shadow-lg flex flex-col">
      <div className="p-6 border-b">
        <h2 className="text-xl font-bold text-gray-800">Restaurant POS</h2>
      </div>
      <nav className="flex-1 p-4" aria-label="Panel menüsü">
        <ul className="space-y-2">
          {visibleNavigation.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                    isActive
                      ? "bg-orange-100 text-orange-700 border-r-2 border-orange-500"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
