"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Building2, MailCheck } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import type { SignupBillingCycle, SignupPlanId } from "@/lib/auth-navigation"
import { validateEmail, validatePassword } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

const planLabels: Record<SignupPlanId, string> = {
  basic: "Temel",
  standard: "Her Şey Dahil",
  pro: "Profesyonel",
}

interface SignupFormProps {
  plan: SignupPlanId
  cycle: SignupBillingCycle
  nextPath: string
  loginHref: string
  invitationSignup: boolean
}

export function SignupForm({ plan, cycle, nextPath, loginHref, invitationSignup }: SignupFormProps) {
  const router = useRouter()
  const { register } = useAuth()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmation: "",
  })

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (formData.name.trim().length < 2) {
      toast({ title: "Ad soyad gerekli", description: "En az iki karakter girin.", variant: "destructive" })
      return
    }
    if (!validateEmail(formData.email)) {
      toast({ title: "Geçersiz e-posta", description: "Geçerli bir e-posta adresi girin.", variant: "destructive" })
      return
    }
    if (!validatePassword(formData.password)) {
      toast({
        title: "Parola yeterince güçlü değil",
        description: "En az 8 karakter, büyük harf, küçük harf ve rakam kullanın.",
        variant: "destructive",
      })
      return
    }
    if (formData.password !== formData.confirmation) {
      toast({ title: "Parolalar eşleşmiyor", description: "İki parola alanını kontrol edin.", variant: "destructive" })
      return
    }

    setIsSubmitting(true)
    try {
      const result = await register(
        formData.name.trim(),
        formData.email.trim().toLowerCase(),
        formData.password,
        nextPath,
      )
      if (!result.success) {
        toast({
          title: "Hesap oluşturulamadı",
          description: result.message || "Kayıt işlemi tamamlanamadı.",
          variant: "destructive",
        })
        return
      }

      if (result.requiresEmailConfirmation) {
        setConfirmationEmail(formData.email.trim().toLowerCase())
        return
      }

      router.replace(nextPath)
      router.refresh()
    } catch {
      toast({
        title: "Hesap oluşturulamadı",
        description: "Lütfen kısa bir süre sonra yeniden deneyin.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (confirmationEmail) {
    return (
      <main className="grid min-h-screen place-items-center bg-gray-100 px-4 py-10">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="mb-4 grid h-11 w-11 place-items-center bg-green-700 text-white">
              <MailCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <CardTitle>E-postanızı doğrulayın</CardTitle>
            <CardDescription>
              <span className="font-medium text-gray-900">{confirmationEmail}</span> adresine gönderilen bağlantıyı açın.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild variant="outline" className="w-full">
              <Link href={loginHref}>Giriş ekranına dön</Link>
            </Button>
          </CardFooter>
        </Card>
      </main>
    )
  }

  return (
    <main className="grid min-h-screen place-items-center bg-gray-100 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto grid h-11 w-11 place-items-center bg-orange-600 text-white">
            <Building2 className="h-5 w-5" aria-hidden="true" />
          </div>
          <h1 className="mt-5 text-3xl font-semibold text-gray-950">
            {invitationSignup ? "Hesabınızı oluşturun" : "İşletme hesabı oluşturun"}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            {invitationSignup
              ? "Davet edildiğiniz ekibe kendi hesabınızla katılın."
              : "İlk kayıt işletme sahibi hesabını oluşturur."}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Kayıt bilgileri</CardTitle>
            <CardDescription>
              {invitationSignup
                ? "Davet edildiğiniz ekibe kendi hesabınızla katılın."
                : `${planLabels[plan]} plan, ${cycle === "monthly" ? "aylık" : "yıllık"} dönem ve 14 günlük deneme.`}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-name">Ad soyad</Label>
                <Input
                  id="signup-name"
                  value={formData.name}
                  onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                  autoComplete="name"
                  maxLength={120}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-email">E-posta</Label>
                <Input
                  id="signup-email"
                  type="email"
                  value={formData.email}
                  onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                  autoComplete="email"
                  placeholder="ornek@email.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Parola</Label>
                <Input
                  id="signup-password"
                  type="password"
                  value={formData.password}
                  onChange={(event) => setFormData({ ...formData, password: event.target.value })}
                  autoComplete="new-password"
                  aria-describedby="password-requirements"
                  required
                />
                <p id="password-requirements" className="text-xs leading-5 text-gray-500">
                  En az 8 karakter, büyük harf, küçük harf ve rakam.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-confirmation">Parola tekrar</Label>
                <Input
                  id="signup-confirmation"
                  type="password"
                  value={formData.confirmation}
                  onChange={(event) => setFormData({ ...formData, confirmation: event.target.value })}
                  autoComplete="new-password"
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-4">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Hesap oluşturuluyor..." : "Hesap oluştur"}
              </Button>
              <p className="text-center text-sm text-gray-600">
                Zaten hesabınız var mı?{" "}
                <Link href={loginHref} className="font-medium text-orange-700 hover:underline">
                  Giriş yapın
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </main>
  )
}
