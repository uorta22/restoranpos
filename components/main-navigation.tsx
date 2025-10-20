"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/auth-context"
import {
  LayoutDashboard,
  MenuIcon,
  ListChecks,
  Calendar,
  BarChart,
  Store,
  Users,
  Settings,
  Bike,
  Grid3X3,
  LogOut,
} from "lucide-react"

export function MainNavigation({ collapsed = false }) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [activeItem, setActiveItem] = useState("")

  useEffect(() => {
    setActiveItem(pathname)
  }, [pathname])

  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Menü", href: "/menu", icon: MenuIcon },
    { name: "Siparişler", href: "/orders", icon: ListChecks },
    { name: "Rezervasyonlar", href: "/reservations", icon: Calendar },
    { name: "Masa Yönetimi", href: "/tables", icon: Grid3X3 },
    { name: "Raporlar", href: "/reports", icon: BarChart },
    { name: "Depo", href: "/store", icon: Store },
    { name: "Kurye Yönetimi", href: "/delivery", icon: Bike },
  ]

  // Sadece yöneticiler için ek menü öğeleri
  const adminNavigation = [
    { name: "Kullanıcı Yönetimi", href: "/users", icon: Users },
    { name: "Ayarlar", href: "/settings", icon: Settings },
  ]

  const isAdmin = user?.role === "Yönetici"

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 space-y-1 py-2">
        {navigation.map((item) => {
          const isActive = activeItem === item.href
          return (
            <Button
              key={item.name}
              variant={isActive ? "default" : "ghost"}
              className={`w-full justify-start ${isActive ? "bg-orange-600 hover:bg-orange-700" : ""}`}
              onClick={() => router.push(item.href)}
            >
              <item.icon className="mr-2 h-4 w-4" />
              {!collapsed && <span>{item.name}</span>}
            </Button>
          )
        })}

        {isAdmin &&
          adminNavigation.map((item) => {
            const isActive = activeItem === item.href
            return (
              <Button
                key={item.name}
                variant={isActive ? "default" : "ghost"}
                className={`w-full justify-start ${isActive ? "bg-orange-600 hover:bg-orange-700" : ""}`}
                onClick={() => router.push(item.href)}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {!collapsed && <span>{item.name}</span>}
              </Button>
            )
          })}
      </div>

      <div className="pt-2">
        <Button
          variant="ghost"
          className="w-full justify-start text-red-500 hover:text-red-700 hover:bg-red-50"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {!collapsed && <span>Çıkış Yap</span>}
        </Button>
      </div>
    </div>
  )
}
