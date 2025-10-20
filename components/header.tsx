"use client"

import type React from "react"
import { useState } from "react"
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { Menu, Search, Settings, LogOut, User, Moon, Sun } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { NotificationCenter } from "@/components/notification-center"

interface HeaderProps {
  showMobileMenu?: boolean
  onMenuToggle?: () => void
  searchQuery?: string
  onSearchChange?: (query: string) => void
}

export function Header({ showMobileMenu = false, onMenuToggle, searchQuery = "", onSearchChange }: HeaderProps) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [notificationSettings, setNotificationSettings] = useState({
    orders: true,
    system: true,
    marketing: false,
  })

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      toast({
        title: "Arama yapılıyor",
        description: `"${searchQuery}" için arama yapılıyor...`,
      })
    }
  }

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
    toast({
      title: isDarkMode ? "Açık tema" : "Koyu tema",
      description: `Tema ${isDarkMode ? "açık" : "koyu"} olarak değiştirildi.`,
    })
  }

  const saveSettings = () => {
    setIsSettingsOpen(false)
    toast({
      title: "Ayarlar kaydedildi",
      description: "Uygulama ayarlarınız başarıyla kaydedildi.",
    })
  }

  return (
    <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
      <div className="flex items-center">
        {onMenuToggle && (
          <Button variant="ghost" size="icon" className="mr-2 md:hidden" onClick={onMenuToggle}>
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        )}
        <div className="text-xl font-bold text-orange-600">RestaurantPOS</div>
      </div>

      <form onSubmit={handleSearch} className="hidden md:flex max-w-sm items-center flex-1 mx-4">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Menüde ara..."
            className="w-full pl-8 bg-gray-50"
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
          />
        </div>
      </form>

      <div className="flex items-center gap-2">
        <NotificationCenter />

        <Button variant="ghost" size="icon" className="text-gray-500" onClick={() => setIsSettingsOpen(true)}>
          <Settings className="h-5 w-5" />
          <span className="sr-only">Settings</span>
        </Button>

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
            <DropdownMenuItem onClick={toggleDarkMode}>
              {isDarkMode ? (
                <>
                  <Sun className="mr-2 h-4 w-4" />
                  <span>Açık Tema</span>
                </>
              ) : (
                <>
                  <Moon className="mr-2 h-4 w-4" />
                  <span>Koyu Tema</span>
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Çıkış Yap</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Uygulama Ayarları</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Koyu Tema</h3>
                <p className="text-sm text-gray-500">Uygulama temasını değiştirin</p>
              </div>
              <Switch checked={isDarkMode} onCheckedChange={setIsDarkMode} />
            </div>

            <div className="space-y-3">
              <h3 className="font-medium">Bildirim Ayarları</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Sipariş Bildirimleri</p>
                  <p className="text-xs text-gray-500">Yeni ve güncellenen siparişler için bildirim alın</p>
                </div>
                <Switch
                  checked={notificationSettings.orders}
                  onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, orders: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Sistem Bildirimleri</p>
                  <p className="text-xs text-gray-500">Sistem güncellemeleri ve duyurular için bildirim alın</p>
                </div>
                <Switch
                  checked={notificationSettings.system}
                  onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, system: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Pazarlama Bildirimleri</p>
                  <p className="text-xs text-gray-500">Kampanya ve indirimler için bildirim alın</p>
                </div>
                <Switch
                  checked={notificationSettings.marketing}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({ ...notificationSettings, marketing: checked })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
              İptal
            </Button>
            <Button onClick={saveSettings}>Kaydet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  )
}
