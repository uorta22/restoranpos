"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { Menu, Search, Settings, LogOut, User } from "lucide-react"
import { NotificationCenter } from "@/components/notification-center"

interface HeaderProps {
  showMobileMenu?: boolean
  onMenuToggle?: () => void
  searchQuery?: string
  onSearchChange?: (value: string) => void
}

export function Header({ showMobileMenu = false, onMenuToggle, searchQuery, onSearchChange }: HeaderProps) {
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.replace("/login")
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
  }

  return (
    <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
      <div className="flex items-center">
        {showMobileMenu && onMenuToggle && (
          <Button variant="ghost" size="icon" className="mr-2 md:hidden" onClick={onMenuToggle}>
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        )}
        <div className="text-xl font-bold text-orange-600">RestaurantPOS</div>
      </div>

      {onSearchChange && (
        <form onSubmit={handleSearch} className="mx-4 hidden max-w-sm flex-1 items-center md:flex">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" aria-hidden="true" />
            <Input
              type="search"
              aria-label="Menüde ara"
              placeholder="Menüde ara..."
              className="w-full bg-gray-50 pl-8"
              value={searchQuery ?? ""}
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </div>
        </form>
      )}

      <div className="flex items-center gap-2">
        <NotificationCenter />

        {(user?.memberRole === "owner" || user?.memberRole === "manager") && (
          <Button variant="ghost" size="icon" className="text-gray-500" onClick={() => router.push("/settings")}>
            <Settings className="h-5 w-5" />
            <span className="sr-only">Ayarlar</span>
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar} alt={user?.name} />
                <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <p className="text-xs leading-none text-gray-500">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/profile")}>
              <User className="mr-2 h-4 w-4" />
              <span>Profil</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => void handleLogout()}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Çıkış Yap</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

    </header>
  )
}
