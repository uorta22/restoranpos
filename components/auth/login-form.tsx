"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LogIn } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { isInvitationPath } from "@/lib/auth-navigation"
import { validateEmail } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

interface LoginFormProps {
  redirectPath: string
  signupHref: string
  confirmationFailed: boolean
}

export function LoginForm({ redirectPath, signupHref, confirmationFailed }: LoginFormProps) {
  const router = useRouter()
  const { login } = useAuth()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!validateEmail(email)) {
      toast({
        title: "Geçersiz e-posta",
        description: "Geçerli bir e-posta adresi girin.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const result = await login(email.trim(), password)
      if (!result.success) {
        toast({
          title: "Giriş başarısız",
          description: result.message || "E-posta veya parola hatalı.",
          variant: "destructive",
        })
        return
      }

      const preservesMembershipSetup = isInvitationPath(redirectPath) || redirectPath.startsWith("/onboarding")
      const destination = result.needsOnboarding && !preservesMembershipSetup ? "/onboarding" : redirectPath
      router.replace(destination)
      router.refresh()
    } catch {
      toast({
        title: "Giriş tamamlanamadı",
        description: "Lütfen kısa bir süre sonra yeniden deneyin.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-gray-100 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto grid h-11 w-11 place-items-center bg-orange-600 text-white">
            <LogIn className="h-5 w-5" aria-hidden="true" />
          </div>
          <h1 className="mt-5 text-3xl font-semibold text-gray-950">RestaurantPOS</h1>
          <p className="mt-2 text-sm text-gray-600">Restoran panelinize giriş yapın.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Giriş yap</CardTitle>
            <CardDescription>Mevcut hesabınızla devam edin.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {confirmationFailed && (
                <p className="border-l-2 border-red-600 pl-3 text-sm text-red-700">
                  Doğrulama bağlantısı geçersiz veya süresi dolmuş. Yeni bir bağlantı için tekrar kayıt olmayı deneyin.
                </p>
              )}
              <div className="space-y-2">
                <Label htmlFor="login-email">E-posta</Label>
                <Input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  placeholder="ornek@email.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="login-password">Parola</Label>
                  <Link href="/forgot-password" className="text-xs text-orange-700 hover:underline">
                    Parolamı unuttum
                  </Link>
                </div>
                <Input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-4">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Giriş yapılıyor..." : "Giriş yap"}
              </Button>
              <p className="text-center text-sm text-gray-600">
                Hesabınız yok mu?{" "}
                <Link href={signupHref} className="font-medium text-orange-700 hover:underline">
                  İşletme hesabı oluşturun
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </main>
  )
}
