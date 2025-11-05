"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useLicense } from "@/context/license-context"
import { useAuth } from "@/context/auth-context"
import { PaymentForm } from "@/components/payment-form"
import { PLANS, FEATURES } from "@/lib/subscription-plans"
import { cn, formatCurrency } from "@/lib/utils"
import { Check, CheckCircle, Crown } from "lucide-react"

export default function PricingPage() {
  const { toast } = useToast()
  const router = useRouter()
  const { user } = useAuth()
  const { license, updateLicense, isLoading } = useLicense()
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly")
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: "",
    cardHolder: "",
    expiryDate: "",
    cvv: "",
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentCompleted, setPaymentCompleted] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push("/login")
    }
  }, [user, router])

  useEffect(() => {
    if (license?.plan && !selectedPlan) {
      setSelectedPlan(license.plan)
    }
  }, [license, selectedPlan])

  // Ödeme tamamlandıktan sonra yönlendirme için
  useEffect(() => {
    if (paymentCompleted) {
      const redirectTimer = setTimeout(() => {
        router.push("/dashboard")
      }, 2000)

      return () => clearTimeout(redirectTimer)
    }
  }, [paymentCompleted, router])

  const handleSelectPlan = (planId: string) => {
    // Eğer zaten seçili plan buysa ve ödeme formu açıksa, formu kapat
    if (planId === selectedPlan && showPaymentForm) {
      setShowPaymentForm(false)
      return
    }

    setSelectedPlan(planId)
    setShowPaymentForm(true)
  }

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Eğer zaten işlem yapılıyorsa, çift tıklamayı önle
    if (isProcessing) return

    setIsProcessing(true)

    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Update license with selected plan
      if (selectedPlan) {
        await updateLicense({
          ...license,
          plan: selectedPlan,
          features: PLANS.find((p) => p.id === selectedPlan)?.features || [],
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        })

        toast({
          title: "Ödeme başarılı!",
          description: "Aboneliğiniz başarıyla güncellendi.",
        })

        // Reset form and state
        setShowPaymentForm(false)
        setPaymentDetails({
          cardNumber: "",
          cardHolder: "",
          expiryDate: "",
          cvv: "",
        })

        // İşlem tamamlandı olarak işaretle
        setPaymentCompleted(true)
      }
    } catch (error) {
      console.error("Payment error:", error)
      toast({
        variant: "destructive",
        title: "Ödeme işlemi başarısız",
        description: "Lütfen bilgilerinizi kontrol edip tekrar deneyin.",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePaymentCancel = () => {
    setShowPaymentForm(false)
    // Ödeme iptal edildiğinde seçili planı sıfırla
    setSelectedPlan(license?.plan || null)
  }

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Yükleniyor...</div>
  }

  const popularPlanId = "pro" // En popüler plan ID'si

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl sm:tracking-tight">Planlarımız</h1>
          <p className="mt-3 text-lg text-gray-500">
            İşletmenizin ihtiyaçlarına en uygun planı seçin ve hemen kullanmaya başlayın
          </p>
        </div>

        <div className="flex justify-center mb-6">
          <div className="bg-white p-1 rounded-full shadow-sm border">
            <Tabs
              defaultValue="monthly"
              className="w-full"
              onValueChange={(value) => setBillingCycle(value as "monthly" | "yearly")}
            >
              <TabsList className="grid grid-cols-2 w-64">
                <TabsTrigger value="monthly" className="rounded-full text-sm">
                  Aylık
                </TabsTrigger>
                <TabsTrigger value="yearly" className="rounded-full text-sm">
                  Yıllık{" "}
                  <span className="ml-1 text-xs bg-green-100 text-green-800 rounded-full px-2 py-0.5">%20 İndirim</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3 max-w-7xl mx-auto">
          {PLANS.map((plan) => {
            const isPopular = plan.id === popularPlanId
            const isCurrentPlan = plan.id === license?.plan
            const isSelected = plan.id === selectedPlan

            return (
              <div key={plan.id} className="relative flex flex-col">
                {isPopular && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[0.6rem] font-semibold bg-orange-500 text-white shadow-sm">
                      <Crown className="w-3 h-3 mr-1" /> En Popüler
                    </span>
                  </div>
                )}

                <Card
                  className={cn(
                    "flex flex-col h-full transition-all duration-200 border",
                    isPopular && "border-orange-200 shadow-md",
                    isSelected && "ring-2 ring-orange-500",
                    isCurrentPlan && !isSelected && "bg-blue-50 border-blue-200",
                  )}
                >
                  <CardHeader className={cn("pb-3", isPopular && "bg-gradient-to-br from-orange-50 to-orange-100")}>
                    <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                    <CardDescription className="mt-1 text-sm text-gray-500">{plan.description}</CardDescription>
                    <div className="mt-3">
                      <span className="text-3xl font-extrabold">
                        {formatCurrency(billingCycle === "yearly" ? Math.floor(plan.price * 0.8 * 12) : plan.price)}
                      </span>
                      <span className="text-gray-500 ml-1 text-sm">/{billingCycle === "yearly" ? "yıl" : "ay"}</span>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-grow">
                    <h3 className="font-medium text-gray-900 mb-2 text-sm">Özellikler</h3>
                    <ul className="space-y-1">
                      {FEATURES.map((feature) => {
                        const included = plan.features.includes(feature.id)
                        return (
                          <li key={feature.id} className="flex items-center">
                            {included ? (
                              <CheckCircle className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                            ) : (
                              <div className="h-3 w-3 border border-gray-300 rounded-full mr-2 flex-shrink-0" />
                            )}
                            <span className={cn("text-sm", included ? "text-gray-900" : "text-gray-400")}>
                              {feature.name}
                            </span>
                          </li>
                        )
                      })}
                    </ul>
                  </CardContent>

                  <CardFooter className="pt-3">
                    <Button
                      className={cn(
                        "w-full py-2 text-sm font-medium",
                        isPopular && !isSelected && !isCurrentPlan && "bg-orange-600 hover:bg-orange-700",
                        isCurrentPlan && !isSelected && "bg-blue-50 text-blue-800 hover:bg-blue-200",
                      )}
                      variant={isSelected ? "outline" : isPopular ? "default" : "outline"}
                      onClick={() => handleSelectPlan(plan.id)}
                      disabled={isCurrentPlan && !showPaymentForm}
                    >
                      {isCurrentPlan ? "Mevcut Planınız" : isSelected ? "Seçildi" : "Planı Seç"}
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            )
          })}
        </div>

        <div className="mt-8 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Sıkça Sorulan Sorular</h2>
          <div className="max-w-3xl mx-auto grid gap-4 md:grid-cols-2">
            <div className="text-left bg-white p-3 rounded-lg shadow-sm border">
              <h3 className="font-bold text-base mb-1">Planlar arasında nasıl geçiş yapabilirim?</h3>
              <p className="text-gray-600 text-sm">
                İstediğiniz zaman planlar arasında geçiş yapabilirsiniz. Yükseltme durumunda, ödeme farkı anlık olarak
                hesaplanır.
              </p>
            </div>
            <div className="text-left bg-white p-3 rounded-lg shadow-sm border">
              <h3 className="font-bold text-base mb-1">İade politikanız nedir?</h3>
              <p className="text-gray-600 text-sm">
                Satın alma işleminden sonraki 14 gün içinde iade talep edebilirsiniz. Detaylı bilgi için müşteri
                hizmetlerimizle iletişime geçin.
              </p>
            </div>
            <div className="text-left bg-white p-3 rounded-lg shadow-sm border">
              <h3 className="font-bold text-base mb-1">Teknik destek sunuyor musunuz?</h3>
              <p className="text-gray-600 text-sm">
                Tüm planlarımızda e-posta desteği sunuyoruz. Premium ve üzeri planlarda 7/24 canlı destek hizmeti
                mevcuttur.
              </p>
            </div>
            <div className="text-left bg-white p-3 rounded-lg shadow-sm border">
              <h3 className="font-bold text-base mb-1">Özel fiyatlandırma mümkün mü?</h3>
              <p className="text-gray-600 text-sm">
                Büyük işletmeler için özel fiyatlandırma ve özelleştirme seçeneklerimiz mevcuttur. Satış ekibimizle
                iletişime geçin.
              </p>
            </div>
          </div>
        </div>
      </div>

      {showPaymentForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md animate-in fade-in-50 slide-in-from-bottom-10">
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl">Ödeme Bilgileri</CardTitle>
              <CardDescription>
                {selectedPlan && `${PLANS.find((p) => p.id === selectedPlan)?.name} planı için ödeme yapıyorsunuz.`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PaymentForm
                paymentDetails={paymentDetails}
                setPaymentDetails={setPaymentDetails}
                onSubmit={handlePaymentSubmit}
                isProcessing={isProcessing}
              />
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handlePaymentCancel}>
                İptal
              </Button>
              <Button
                onClick={handlePaymentSubmit}
                disabled={isProcessing}
                className={isProcessing ? "bg-orange-600" : ""}
              >
                {isProcessing ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                    İşleniyor...
                  </>
                ) : (
                  "Ödemeyi Tamamla"
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {paymentCompleted && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full text-center animate-in fade-in-50 zoom-in-95">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold mb-2">Ödeme Başarılı!</h2>
            <p className="text-gray-600 mb-6">Aboneliğiniz başarıyla güncellendi. Yönlendiriliyorsunuz...</p>
            <Button onClick={() => router.push("/dashboard")} className="w-full">
              Gösterge Paneline Git
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
