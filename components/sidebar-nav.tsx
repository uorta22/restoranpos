"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Home,
  ShoppingCart,
  Users,
  Calendar,
  BarChart3,
  Settings,
  Store,
  MapPin,
  ChefHat,
  UtensilsCrossed,
  TableProperties,
  Package,
} from "lucide-react"

const navigation = [
  { name: "Ana Sayfa", href: "/", icon: Home },
  { name: "Menü", href: "/menu", icon: UtensilsCrossed },
  { name: "Siparişler", href: "/orders", icon: ShoppingCart },
  { name: "Mutfak", href: "/kitchen", icon: ChefHat },
  { name: "Masalar", href: "/tables", icon: TableProperties },
  { name: "Rezervasyonlar", href: "/reservations", icon: Calendar },
  { name: "Teslimat", href: "/delivery", icon: MapPin },
  { name: "Envanter", href: "/inventory", icon: Package },
  { name: "Kullanıcılar", href: "/users", icon: Users },
  { name: "Depo", href: "/store", icon: Store },
  { name: "Raporlar", href: "/reports", icon: BarChart3 },
  { name: "Ayarlar", href: "/settings", icon: Settings },
]

export function SidebarNav() {
  const pathname = usePathname()

  return (
    <div className="w-64 bg-white shadow-lg flex flex-col">
      <div className="p-6 border-b">
        <h2 className="text-xl font-bold text-gray-800">Restaurant POS</h2>
      </div>
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
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
