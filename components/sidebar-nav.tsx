"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/auth-context"
import type { MemberRole } from "@/lib/database.types"
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
} from "lucide-react"

const management: MemberRole[] = ["owner", "manager"]
const frontOfHouse: MemberRole[] = ["owner", "manager", "cashier", "waiter"]
const navigation: Array<{
  name: string
  href: string
  icon: typeof Home
  roles: MemberRole[]
}> = [
  { name: "Ana Sayfa", href: "/", icon: Home, roles: frontOfHouse },
  { name: "Menü", href: "/menu", icon: UtensilsCrossed, roles: [...frontOfHouse, "kitchen"] },
  { name: "Siparişler", href: "/orders", icon: ShoppingCart, roles: [...frontOfHouse, "kitchen"] },
  { name: "Mutfak", href: "/kitchen", icon: ChefHat, roles: [...management, "kitchen"] },
  { name: "Masalar", href: "/tables", icon: TableProperties, roles: frontOfHouse },
  { name: "Rezervasyonlar", href: "/reservations", icon: Calendar, roles: frontOfHouse },
  { name: "Teslimat", href: "/delivery", icon: MapPin, roles: [...management, "cashier", "courier"] },
  { name: "Kullanıcılar", href: "/users", icon: Users, roles: management },
  { name: "Depo", href: "/store", icon: Store, roles: management },
  { name: "Raporlar", href: "/reports", icon: BarChart3, roles: [...management, "cashier"] },
  { name: "Ayarlar", href: "/settings", icon: Settings, roles: management },
]

export function SidebarNav() {
  const pathname = usePathname()
  const { user } = useAuth()
  const visibleNavigation = user?.memberRole
    ? navigation.filter((item) => item.roles.includes(user.memberRole!))
    : []

  return (
    <div className="w-64 bg-white shadow-lg flex flex-col">
      <div className="p-6 border-b">
        <h2 className="text-xl font-bold text-gray-800">Restaurant POS</h2>
      </div>
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {visibleNavigation.map((item) => {
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
