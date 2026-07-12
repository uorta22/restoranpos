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
import { ImageIcon, Key, Mail, Save, Shield, User } from "lucide-react"
import { getClientSupabaseInstance } from "@/lib/supabase"
import { validatePassword } from "@/lib/utils"

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
    if (!user) return
    const timeoutId = window.setTimeout(
      () => setProfileData({ name: user.name, email: user.email, avatar: user.avatar || "" }),
      0,
    )
    return () => window.clearTimeout(timeoutId)
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
          description: result.requiresEmailConfirmation
            ? "Yeni e-posta adresinize gönderilen doğrulama bağlantısını açın."
            : "Profil bilgileriniz başarıyla güncellendi.",
        })
      } else {
        toast({
          title: "Hata",
          description: result.message || "Profil güncellenirken bir hata oluştu.",
          variant: "destructive",
        })
      }
    } catch {
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

    if (!validatePassword(passwordData.newPassword)) {
      toast({
        title: "Geçersiz parola",
        description: "Parola en az 8 karakter, büyük harf, küçük harf ve rakam içermelidir.",
        variant: "destructive",
      })
      return
    }

    const supabase = getClientSupabaseInstance()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: passwordData.currentPassword,
    })
    if (signInError) {
      toast({ title: "Mevcut parola hatalı", description: "Parolanız değiştirilemedi.", variant: "destructive" })
      return
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: passwordData.newPassword })
    if (updateError) {
      toast({ title: "Parola güncellenemedi", description: updateError.message, variant: "destructive" })
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
                            autoComplete="name"
                            required
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
                            autoComplete="email"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="avatar" className="flex items-center gap-2">
                            <ImageIcon className="h-4 w-4" aria-hidden="true" />
                            Profil görseli URL
                          </Label>
                          <Input
                            id="avatar"
                            type="url"
                            value={profileData.avatar}
                            onChange={(event) => setProfileData({ ...profileData, avatar: event.target.value })}
                            placeholder="https://..."
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
                            autoComplete="current-password"
                            required
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
                            autoComplete="new-password"
                            minLength={8}
                            required
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
                            autoComplete="new-password"
                            minLength={8}
                            required
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

              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
