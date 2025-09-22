"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { validateEmail, validatePassword } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

export default function LoginPage() {
  const router = useRouter()
  const { login, register } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  })
  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "Garson",
  })

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (!validateEmail(loginData.email)) {
      toast({
        title: "Geçersiz e-posta",
        description: "Lütfen geçerli bir e-posta adresi girin",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    try {
      console.log("Giriş işlemi başlatılıyor..."); // Giriş işleminin başladığını belirt

      const result = await login(loginData.email, loginData.password);

      console.log("Giriş sonucu:", result); // Giriş sonucunu konsola yazdır

      if (result.success) {
        console.log("Giriş başarılı!"); // Girişin başarılı olduğunu belirt

        // Başarılı giriş sonrası localStorage'a token bilgisini kaydet (simülasyon)
        localStorage.setItem("auth_token", "mock-jwt-token-" + Date.now());

        // Yönlendirme URL'ini kontrol et
        const urlParams = new URLSearchParams(window.location.search);
        const redirectUrl = urlParams.get("redirect") || "/";

        console.log("Yönlendirme URL'si:", redirectUrl); // Yönlendirme URL'sini konsola yazdır

        router.push(redirectUrl);

        console.log("Yönlendirme işlemi tamamlandı."); // Yönlendirme işleminin tamamlandığını belirt
      } else {
        console.log("Giriş başarısız:", result.message); // Girişin başarısız olduğunu belirt
        toast({
          title: "Giriş başarısız",
          description: result.message || "E-posta veya şifre hatalı",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Giriş sırasında hata:", error); // Hata mesajını konsola yazdır
      toast({
        title: "Hata",
        description: "Giriş sırasında bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      console.log("Giriş işlemi tamamlandı."); // Giriş işleminin tamamlandığını belirt
    }
  }

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (!validateEmail(registerData.email)) {
      toast({
        title: "Geçersiz e-posta",
        description: "Lütfen geçerli bir e-posta adresi girin",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    if (!validatePassword(registerData.password)) {
      toast({
        title: "Geçersiz şifre",
        description: "Şifre en az 6 karakter olmalıdır",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    if (registerData.password !== registerData.confirmPassword) {
      toast({
        title: "Şifreler eşleşmiyor",
        description: "Girdiğiniz şifreler eşleşmiyor",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    try {
      const result = await register(registerData.name, registerData.email, registerData.password, registerData.role)
      if (result.success) {
        toast({
          title: "Kayıt başarılı",
          description: "Hesabınız başarıyla oluşturuldu. Şimdi giriş yapabilirsiniz.",
        })
        // Reset form and switch to login tab
        setRegisterData({
          name: "",
          email: "",
          password: "",
          confirmPassword: "",
          role: "Garson",
        })
      } else {
        toast({
          title: "Kayıt başarısız",
          description: result.message || "Kayıt sırasında bir hata oluştu",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Kayıt sırasında bir hata oluştu",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-orange-600">RestaurantPOS</h1>
          <p className="text-gray-600 mt-2">Modern Restoran Yönetim Sistemi</p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="login">Giriş Yap</TabsTrigger>
            <TabsTrigger value="register">Kayıt Ol</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Giriş Yap</CardTitle>
                <CardDescription>Hesabınıza giriş yapın</CardDescription>
              </CardHeader>
              <form onSubmit={handleLoginSubmit}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-posta</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="ornek@email.com"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Şifre</Label>
                      <a href="#" className="text-xs text-orange-600 hover:underline">
                        Şifremi Unuttum
                      </a>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      required
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700" disabled={isLoading}>
                    {isLoading ? "Giriş Yapılıyor..." : "Giriş Yap"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
          <TabsContent value="register">
            <Card>
              <CardHeader>
                <CardTitle>Kayıt Ol</CardTitle>
                <CardDescription>Yeni bir hesap oluşturun</CardDescription>
              </CardHeader>
              <form onSubmit={handleRegisterSubmit}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Ad Soyad</Label>
                    <Input
                      id="name"
                      placeholder="Ad Soyad"
                      value={registerData.name}
                      onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email">E-posta</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="ornek@email.com"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Şifre</Label>
                    <Input
                      id="register-password"
                      type="password"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Şifre Tekrar</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={registerData.confirmPassword}
                      onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                      required
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700" disabled={isLoading}>
                    {isLoading ? "Kayıt Yapılıyor..." : "Kayıt Ol"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-4 text-center text-sm text-gray-600">
          <p>Demo hesapları:</p>
          <p>
            <strong>Admin:</strong> admin@example.com / password123
          </p>
          <p>
            <strong>Garson:</strong> waiter@example.com / password123
          </p>
        </div>
      </div>
    </div>
  )
}
