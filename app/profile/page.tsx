"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { SidebarNav } from "@/components/sidebar-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { User, Mail, Shield, Camera, Key, Save, BellRing, Moon, SunMedium } from "lucide-react"
import { Switch } from "@/components/ui/switch"

export default function ProfilePage() {
  const { user, isLoading, updateProfile } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [showSidebar, setShowSidebar] = useState(true)
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    avatar: "",
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [notificationSettings, setNotificationSettings] = useState({
    orders: true,
    system: true,
    marketing: false,
  })
  const [isDarkMode, setIsDarkMode] = useState(false)

  // Responsive sidebar kontrolü
  useEffect(() => {
    const handleResize = () => {
      setShowSidebar(window.innerWidth >= 768)
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // User bilgilerini profil formuna doldur
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name,
        email: user.email,
        avatar: user.avatar || "",
      })
    }
  }, [user])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  if (!user) {
    router.push("/login")
    return null
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const result = await updateProfile(profileData)
      if (result.success) {
        toast({
          title: "Profil güncellendi",
          description: "Profil bilgileriniz başarıyla güncellendi.",
        })
      } else {
        toast({
          title: "Hata",
          description: result.message || "Profil güncellenirken bir hata oluştu.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Profil güncellenirken bir hata oluştu.",
        variant: "destructive",
      })
    }
  }

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Şifreler eşleşmiyor",
        description: "Yeni şifre ve şifre tekrarı alanları eşleşmiyor.",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Şifre güncellendi",
      description: "Şifreniz başarıyla güncellendi.",
    })

    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    })
  }

  const handleNotificationUpdate = (key: keyof typeof notificationSettings, value: boolean) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [key]: value,
    }))

    toast({
      title: "Bildirim ayarları güncellendi",
      description: "Bildirim ayarlarınız kaydedildi.",
    })
  }

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
    // In a real app, you would also update the theme in your theme provider
    toast({
      title: isDarkMode ? "Açık Tema" : "Koyu Tema",
      description: `Tema ${isDarkMode ? "açık" : "koyu"} olarak değiştirildi.`,
    })
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {showSidebar && <SidebarNav />}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header showMobileMenu={!showSidebar} onMenuToggle={() => setShowSidebar(!showSidebar)} />
        <div className="flex-1 overflow-auto p-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Profil Ayarları</h1>

            <div className="grid md:grid-cols-[240px_1fr] gap-8">
              <Card className="md:row-span-2 h-fit">
                <CardContent className="p-6 flex flex-col items-center">
                  <div className="relative mb-6">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback className="text-2xl">{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <Button
                      size="icon"
                      className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
                      variant="secondary"
                      onClick={() => {
                        toast({
                          title: "Fotoğraf güncelleme",
                          description: "Bu özellik yakında aktif olacak.",
                        })
                      }}
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                  <h2 className="text-xl font-semibold">{user.name}</h2>
                  <p className="text-sm text-gray-500">{user.email}</p>
                  <div className="mt-2 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">
                    {user.role}
                  </div>
                </CardContent>
              </Card>

              <Tabs defaultValue="general" className="flex-1">
                <TabsList className="w-full justify-start mb-6">
                  <TabsTrigger value="general">Genel</TabsTrigger>
                  <TabsTrigger value="security">Güvenlik</TabsTrigger>
                  <TabsTrigger value="notifications">Bildirimler</TabsTrigger>
                </TabsList>

                <TabsContent value="general">
                  <Card>
                    <CardHeader>
                      <CardTitle>Genel Bilgiler</CardTitle>
                    </CardHeader>
                    <form onSubmit={handleProfileUpdate}>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            İsim
                          </Label>
                          <Input
                            id="name"
                            value={profileData.name}
                            onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email" className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            E-posta
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            value={profileData.email}
                            onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="role" className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Rol
                          </Label>
                          <Input id="role" value={user.role} disabled />
                          <p className="text-xs text-gray-500">
                            Rol değişikliği için sistem yöneticisiyle iletişime geçin.
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-4">
                          <div className="flex items-center space-x-2">
                            <Switch id="dark-mode" checked={isDarkMode} onCheckedChange={toggleDarkMode} />
                            <Label htmlFor="dark-mode" className="flex items-center gap-2">
                              {isDarkMode ? (
                                <>
                                  <Moon className="h-4 w-4" />
                                  Koyu Tema
                                </>
                              ) : (
                                <>
                                  <SunMedium className="h-4 w-4" />
                                  Açık Tema
                                </>
                              )}
                            </Label>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button type="submit">
                          <Save className="mr-2 h-4 w-4" />
                          Değişiklikleri Kaydet
                        </Button>
                      </CardFooter>
                    </form>
                  </Card>
                </TabsContent>

                <TabsContent value="security">
                  <Card>
                    <CardHeader>
                      <CardTitle>Güvenlik</CardTitle>
                    </CardHeader>
                    <form onSubmit={handlePasswordUpdate}>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="current-password" className="flex items-center gap-2">
                            <Key className="h-4 w-4" />
                            Mevcut Şifre
                          </Label>
                          <Input
                            id="current-password"
                            type="password"
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="new-password" className="flex items-center gap-2">
                            <Key className="h-4 w-4" />
                            Yeni Şifre
                          </Label>
                          <Input
                            id="new-password"
                            type="password"
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="confirm-password" className="flex items-center gap-2">
                            <Key className="h-4 w-4" />
                            Şifre Tekrar
                          </Label>
                          <Input
                            id="confirm-password"
                            type="password"
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                          />
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button type="submit">
                          <Save className="mr-2 h-4 w-4" />
                          Şifreyi Güncelle
                        </Button>
                      </CardFooter>
                    </form>
                  </Card>
                </TabsContent>

                <TabsContent value="notifications">
                  <Card>
                    <CardHeader>
                      <CardTitle>Bildirim Ayarları</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="notify-orders" className="flex items-center gap-2 text-base">
                            <BellRing className="h-4 w-4" />
                            Sipariş Bildirimleri
                          </Label>
                          <p className="text-sm text-gray-500">
                            Yeni siparişler ve sipariş durumu güncellemeleri hakkında bildirim alın.
                          </p>
                        </div>
                        <Switch
                          id="notify-orders"
                          checked={notificationSettings.orders}
                          onCheckedChange={(checked) => handleNotificationUpdate("orders", checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="notify-system" className="flex items-center gap-2 text-base">
                            <BellRing className="h-4 w-4" />
                            Sistem Bildirimleri
                          </Label>
                          <p className="text-sm text-gray-500">
                            Sistem güncellemeleri ve önemli duyurular hakkında bildirim alın.
                          </p>
                        </div>
                        <Switch
                          id="notify-system"
                          checked={notificationSettings.system}
                          onCheckedChange={(checked) => handleNotificationUpdate("system", checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="notify-marketing" className="flex items-center gap-2 text-base">
                            <BellRing className="h-4 w-4" />
                            Pazarlama Bildirimleri
                          </Label>
                          <p className="text-sm text-gray-500">
                            Kampanyalar, indirimler ve özel teklifler hakkında bildirim alın.
                          </p>
                        </div>
                        <Switch
                          id="notify-marketing"
                          checked={notificationSettings.marketing}
                          onCheckedChange={(checked) => handleNotificationUpdate("marketing", checked)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
