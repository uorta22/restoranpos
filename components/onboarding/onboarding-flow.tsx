"use client"

import { useEffect, useMemo, useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  CreditCard,
  Loader2,
  LogOut,
  Settings2,
  Store,
  UtensilsCrossed,
} from "lucide-react"
import { useAuth } from "@/context/auth-context"
import type { SignupBillingCycle, SignupPlanId } from "@/lib/auth-navigation"
import type { BillingCycle, OnboardingStep, OrderType, Tables } from "@/lib/database.types"
import { FEATURES } from "@/lib/subscription-plans"
import { getClientSupabaseInstance } from "@/lib/supabase"
import { cn, formatCurrency, validateEmail } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type OnboardingSession = Tables<"onboarding_sessions">
type SubscriptionPlan = Tables<"subscription_plans">

interface OnboardingFlowProps {
  initialPlan: SignupPlanId
  initialBillingCycle: SignupBillingCycle
  acquisitionSource?: string
}

interface DatabaseError {
  code?: string
  message?: string
}

const steps: Array<{ id: OnboardingStep; label: string; icon: typeof Building2 }> = [
  { id: "business", label: "İşletme", icon: Building2 },
  { id: "operations", label: "Operasyon", icon: Settings2 },
  { id: "plan", label: "Plan", icon: CreditCard },
  { id: "setup", label: "Kurulum", icon: ClipboardCheck },
  { id: "complete", label: "Tamam", icon: CheckCircle2 },
]

const serviceModeOptions: Array<{ id: OrderType; label: string; description: string }> = [
  { id: "dine_in", label: "Masada servis", description: "Masa ve adisyon akışı" },
  { id: "takeaway", label: "Gel-al", description: "Kasadan teslim siparişleri" },
  { id: "delivery", label: "Paket servis", description: "Kurye ve teslimat akışı" },
]

const starterCategoryOptions = ["Yiyecekler", "İçecekler", "Tatlılar"]
const schemaErrorCodes = new Set(["42703", "42883", "42P01", "PGRST202", "PGRST204", "PGRST205"])

function getFriendlyError(error: DatabaseError | null, fallback: string) {
  if (!error) return fallback

  if (
    (error.code && schemaErrorCodes.has(error.code)) ||
    error.message?.includes("onboarding") ||
    error.message?.includes("trial_enabled")
  ) {
    return "Supabase kurulumu henüz hazır değil. SQL Editor'da 06_onboarding_and_billing_foundation.sql dosyasını çalıştırın."
  }
  if (error.message?.includes("Restaurant name is too short")) return "İşletme adı en az iki karakter olmalıdır."
  if (error.message?.includes("valid restaurant email")) return "Geçerli bir işletme e-posta adresi girin."
  if (error.message?.includes("Only restaurant owners")) return "Bu kurulumu yalnızca işletme sahibi tamamlayabilir."
  if (error.message?.includes("Required onboarding steps")) return "Önceki kurulum adımlarını tamamlayın."

  return fallback
}

function LoadingScreen() {
  return (
    <main className="grid min-h-screen place-items-center bg-gray-50" aria-live="polite">
      <div className="flex items-center gap-3 text-sm text-gray-600">
        <Loader2 className="h-5 w-5 animate-spin text-orange-600" aria-hidden="true" />
        Kurulum bilgileri yükleniyor...
      </div>
    </main>
  )
}

export function OnboardingFlow({ initialPlan, initialBillingCycle, acquisitionSource }: OnboardingFlowProps) {
  const router = useRouter()
  const { user, isLoading: isAuthLoading, logout, refreshUser } = useAuth()
  const [session, setSession] = useState<OnboardingSession | null>(null)
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [isInitializing, setIsInitializing] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [pageError, setPageError] = useState<string | null>(null)
  const [stepError, setStepError] = useState<string | null>(null)
  const [business, setBusiness] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    timezone: "Europe/Istanbul",
    currency: "TRY",
  })
  const [serviceModes, setServiceModes] = useState<OrderType[]>(["dine_in", "takeaway", "delivery"])
  const [tableCount, setTableCount] = useState("10")
  const [taxRate, setTaxRate] = useState("10")
  const [selectedPlan, setSelectedPlan] = useState<SignupPlanId>(initialPlan)
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(initialBillingCycle)
  const [starterCategories, setStarterCategories] = useState<string[]>(starterCategoryOptions)
  const userId = user?.id
  const userEmail = user?.email ?? ""

  useEffect(() => {
    if (isAuthLoading || !userId) return

    let active = true
    const initialize = async () => {
      setIsInitializing(true)
      setPageError(null)
      const supabase = getClientSupabaseInstance()
      const [sessionResult, plansResult] = await Promise.all([
        supabase.rpc("start_onboarding", {
          requested_plan_id: initialPlan,
          requested_billing_cycle: initialBillingCycle,
          acquisition_source: acquisitionSource,
        }),
        supabase
          .from("subscription_plans")
          .select("*")
          .eq("is_active", true)
          .eq("trial_enabled", true)
          .order("price_monthly", { ascending: true }),
      ])

      if (!active) return
      if (sessionResult.error || !sessionResult.data) {
        setPageError(getFriendlyError(sessionResult.error, "Kurulum oturumu başlatılamadı. Lütfen tekrar deneyin."))
        setIsInitializing(false)
        return
      }
      if (plansResult.error || !plansResult.data?.length) {
        setPageError(getFriendlyError(plansResult.error, "Abonelik planları yüklenemedi. Lütfen tekrar deneyin."))
        setIsInitializing(false)
        return
      }

      const nextSession = sessionResult.data
      setSession(nextSession)
      setPlans(plansResult.data)
      setSelectedPlan(nextSession.selected_plan_id as SignupPlanId)
      setBillingCycle(nextSession.billing_cycle)
      setTableCount(String(nextSession.table_count || 10))
      setBusiness((current) => ({ ...current, email: current.email || userEmail }))

      if (nextSession.restaurant_id) {
        const restaurantResult = await supabase
          .from("restaurants")
          .select("name, address, phone, email, timezone, currency, tax_rate, service_modes")
          .eq("id", nextSession.restaurant_id)
          .maybeSingle()

        if (!active) return
        if (restaurantResult.error || !restaurantResult.data) {
          setPageError("İşletme bilgileri yüklenemedi. Lütfen tekrar deneyin.")
          setIsInitializing(false)
          return
        }

        const restaurant = restaurantResult.data
        setBusiness({
          name: restaurant.name,
          address: restaurant.address ?? "",
          phone: restaurant.phone ?? "",
          email: restaurant.email ?? userEmail,
          timezone: restaurant.timezone,
          currency: restaurant.currency,
        })
        setServiceModes(restaurant.service_modes)
        setTaxRate(String(restaurant.tax_rate))
      }

      setIsInitializing(false)
    }

    void initialize()
    return () => {
      active = false
    }
  }, [acquisitionSource, initialBillingCycle, initialPlan, isAuthLoading, userEmail, userId])

  const activeStep = session?.current_step ?? "business"
  const activeStepIndex = steps.findIndex((step) => step.id === activeStep)
  const selectedPlanData = useMemo(
    () => plans.find((plan) => plan.id === selectedPlan),
    [plans, selectedPlan],
  )

  const handleBusinessSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStepError(null)
    if (business.name.trim().length < 2) {
      setStepError("İşletme adı en az iki karakter olmalıdır.")
      return
    }
    if (business.email.trim() && !validateEmail(business.email.trim())) {
      setStepError("Geçerli bir işletme e-posta adresi girin.")
      return
    }

    setIsSaving(true)
    const supabase = getClientSupabaseInstance()
    const { data, error } = await supabase.rpc("create_restaurant_from_onboarding", {
      restaurant_name: business.name.trim(),
      restaurant_address: business.address.trim() || undefined,
      restaurant_phone: business.phone.trim() || undefined,
      restaurant_email: business.email.trim().toLowerCase() || undefined,
      restaurant_timezone: business.timezone,
      restaurant_currency: business.currency,
    })

    if (error || !data) {
      setStepError(getFriendlyError(error, "İşletme oluşturulamadı. Bilgileri kontrol edip tekrar deneyin."))
      setIsSaving(false)
      return
    }

    setSession((current) => current && { ...current, restaurant_id: data, current_step: "operations" })
    try {
      await refreshUser()
    } catch {
      // The membership is persisted; the next navigation will hydrate it again.
    }
    setIsSaving(false)
  }

  const handleOperationsSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStepError(null)
    const parsedTableCount = Number(tableCount)
    const parsedTaxRate = Number(taxRate)

    if (!serviceModes.length) {
      setStepError("En az bir servis modeli seçin.")
      return
    }
    if (!Number.isInteger(parsedTableCount) || parsedTableCount < 0 || parsedTableCount > 200) {
      setStepError("Masa sayısı 0 ile 200 arasında tam sayı olmalıdır.")
      return
    }
    if (!Number.isFinite(parsedTaxRate) || parsedTaxRate < 0 || parsedTaxRate > 100) {
      setStepError("Vergi oranı 0 ile 100 arasında olmalıdır.")
      return
    }

    setIsSaving(true)
    const supabase = getClientSupabaseInstance()
    const { data, error } = await supabase.rpc("save_onboarding_operations", {
      selected_service_modes: serviceModes,
      requested_table_count: serviceModes.includes("dine_in") ? parsedTableCount : 0,
      requested_tax_rate: parsedTaxRate,
    })

    if (error || !data) {
      setStepError(getFriendlyError(error, "Operasyon ayarları kaydedilemedi. Lütfen tekrar deneyin."))
    } else {
      setSession(data)
    }
    setIsSaving(false)
  }

  const handlePlanSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStepError(null)
    if (!selectedPlanData) {
      setStepError("Devam etmek için geçerli bir plan seçin.")
      return
    }

    setIsSaving(true)
    const supabase = getClientSupabaseInstance()
    const { data, error } = await supabase.rpc("save_onboarding_plan", {
      requested_plan_id: selectedPlan,
      requested_billing_cycle: billingCycle,
    })

    if (error || !data) {
      setStepError(getFriendlyError(error, "Plan seçimi kaydedilemedi. Lütfen tekrar deneyin."))
    } else {
      setSession(data)
    }
    setIsSaving(false)
  }

  const handleSetupSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStepError(null)
    setIsSaving(true)
    const supabase = getClientSupabaseInstance()
    const { data, error } = await supabase.rpc("complete_onboarding", {
      starter_category_names: starterCategories,
    })

    if (error || !data) {
      setStepError(getFriendlyError(error, "Kurulum tamamlanamadı. Lütfen tekrar deneyin."))
      setIsSaving(false)
      return
    }

    setSession((current) => current && { ...current, current_step: "complete", completed_at: new Date().toISOString() })
    try {
      await refreshUser()
    } catch {
      // The completed state is already stored and will be loaded on the next request.
    }
    setIsSaving(false)
  }

  const handleLogout = async () => {
    await logout()
    router.replace("/login")
    router.refresh()
  }

  if (isAuthLoading || isInitializing || (!user && !pageError)) return <LoadingScreen />

  if (pageError) {
    return (
      <main className="grid min-h-screen place-items-center bg-gray-50 px-4 py-10">
        <div className="w-full max-w-lg">
          <Alert variant="destructive" className="rounded-md bg-white">
            <CircleAlert className="h-4 w-4" aria-hidden="true" />
            <AlertTitle>Kurulum başlatılamadı</AlertTitle>
            <AlertDescription>{pageError}</AlertDescription>
          </Alert>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button type="button" onClick={() => window.location.reload()}>
              Tekrar dene
            </Button>
            <Button type="button" variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
              Çıkış yap
            </Button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-950">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center bg-orange-600 text-white">
              <UtensilsCrossed className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">RestaurantPOS</p>
              <p className="truncate text-xs text-gray-500">İşletme kurulumu</p>
            </div>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
            Çıkış
          </Button>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-8 sm:px-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:px-8 lg:py-12">
        <aside aria-label="Kurulum ilerlemesi">
          <ol className="grid grid-cols-5 gap-1 lg:grid-cols-1 lg:gap-0">
            {steps.map((step, index) => {
              const isComplete = activeStep === "complete" || index < activeStepIndex
              const isActive = index === activeStepIndex
              const StepIcon = step.icon
              return (
                <li
                  key={step.id}
                  className={cn(
                    "flex min-w-0 flex-col items-center gap-2 border-t-2 px-1 pt-3 text-center lg:flex-row lg:border-l-2 lg:border-t-0 lg:px-4 lg:py-4 lg:text-left",
                    isActive && "border-orange-600 text-gray-950",
                    isComplete && "border-green-600 text-gray-700",
                    !isActive && !isComplete && "border-gray-200 text-gray-400",
                  )}
                  aria-current={isActive ? "step" : undefined}
                >
                  <span
                    className={cn(
                      "grid h-7 w-7 shrink-0 place-items-center rounded-full border text-xs font-semibold",
                      isActive && "border-orange-600 bg-orange-600 text-white",
                      isComplete && "border-green-600 bg-green-600 text-white",
                      !isActive && !isComplete && "border-gray-300 bg-white",
                    )}
                  >
                    {isComplete ? <Check className="h-4 w-4" aria-hidden="true" /> : <StepIcon className="h-3.5 w-3.5" aria-hidden="true" />}
                  </span>
                  <span className="break-words text-[11px] font-medium leading-4 sm:text-xs lg:text-sm">{step.label}</span>
                </li>
              )
            })}
          </ol>
        </aside>

        <section className="min-w-0">
          {stepError && (
            <Alert variant="destructive" className="mb-6 rounded-md bg-white">
              <CircleAlert className="h-4 w-4" aria-hidden="true" />
              <AlertTitle>Bu adım kaydedilemedi</AlertTitle>
              <AlertDescription>{stepError}</AlertDescription>
            </Alert>
          )}

          {activeStep === "business" && (
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-orange-700">1 / 4</p>
              <h1 className="mt-2 text-3xl font-semibold">İşletmenizi tanımlayın</h1>
              <p className="mt-3 text-sm leading-6 text-gray-600">Bu bilgiler fişlerde, raporlarda ve ekip ekranlarında kullanılacak.</p>

              <form onSubmit={handleBusinessSubmit} className="mt-8 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="business-name">İşletme adı</Label>
                  <Input
                    id="business-name"
                    value={business.name}
                    onChange={(event) => setBusiness({ ...business, name: event.target.value })}
                    autoComplete="organization"
                    maxLength={120}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business-address">Adres</Label>
                  <Input
                    id="business-address"
                    value={business.address}
                    onChange={(event) => setBusiness({ ...business, address: event.target.value })}
                    autoComplete="street-address"
                    maxLength={300}
                  />
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="business-phone">Telefon</Label>
                    <Input
                      id="business-phone"
                      type="tel"
                      value={business.phone}
                      onChange={(event) => setBusiness({ ...business, phone: event.target.value })}
                      autoComplete="tel"
                      maxLength={40}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="business-email">İşletme e-postası</Label>
                    <Input
                      id="business-email"
                      type="email"
                      value={business.email}
                      onChange={(event) => setBusiness({ ...business, email: event.target.value })}
                      autoComplete="email"
                    />
                  </div>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="business-timezone">Saat dilimi</Label>
                    <Select value={business.timezone} onValueChange={(value) => setBusiness({ ...business, timezone: value })}>
                      <SelectTrigger id="business-timezone">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Europe/Istanbul">İstanbul</SelectItem>
                        <SelectItem value="Europe/Berlin">Berlin</SelectItem>
                        <SelectItem value="Europe/London">Londra</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="business-currency">Para birimi</Label>
                    <Select value={business.currency} onValueChange={(value) => setBusiness({ ...business, currency: value })}>
                      <SelectTrigger id="business-currency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TRY">TRY - Türk lirası</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="USD">USD - ABD doları</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <ArrowRight className="mr-2 h-4 w-4" aria-hidden="true" />}
                  İşletmeyi oluştur ve devam et
                </Button>
              </form>
            </div>
          )}

          {activeStep === "operations" && (
            <div className="max-w-3xl">
              <p className="text-sm font-semibold text-orange-700">2 / 4</p>
              <h1 className="mt-2 text-3xl font-semibold">Operasyon modelinizi seçin</h1>
              <p className="mt-3 text-sm leading-6 text-gray-600">Panel, seçtiğiniz servis biçimlerine göre başlangıç ayarlarını hazırlayacak.</p>

              <form onSubmit={handleOperationsSubmit} className="mt-8 space-y-8">
                <fieldset>
                  <legend className="text-sm font-medium">Servis modelleri</legend>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    {serviceModeOptions.map((option) => {
                      const checked = serviceModes.includes(option.id)
                      return (
                        <label
                          key={option.id}
                          className={cn(
                            "flex cursor-pointer items-start gap-3 rounded-md border bg-white p-4 transition-colors",
                            checked ? "border-orange-500" : "border-gray-200 hover:border-gray-400",
                          )}
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(nextChecked) => {
                              setServiceModes((current) =>
                                nextChecked ? [...current, option.id] : current.filter((mode) => mode !== option.id),
                              )
                            }}
                            aria-label={option.label}
                          />
                          <span className="min-w-0">
                            <span className="block text-sm font-medium">{option.label}</span>
                            <span className="mt-1 block text-xs leading-5 text-gray-500">{option.description}</span>
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </fieldset>

                <div className="grid gap-5 border-t border-gray-200 pt-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="table-count">Masa sayısı</Label>
                    <Input
                      id="table-count"
                      type="number"
                      min={0}
                      max={200}
                      step={1}
                      value={serviceModes.includes("dine_in") ? tableCount : "0"}
                      onChange={(event) => setTableCount(event.target.value)}
                      disabled={!serviceModes.includes("dine_in")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tax-rate">Varsayılan vergi oranı (%)</Label>
                    <Input
                      id="tax-rate"
                      type="number"
                      min={0}
                      max={100}
                      step="0.01"
                      value={taxRate}
                      onChange={(event) => setTaxRate(event.target.value)}
                    />
                  </div>
                </div>

                <Button type="submit" disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <ArrowRight className="mr-2 h-4 w-4" aria-hidden="true" />}
                  Kaydet ve plan seçimine geç
                </Button>
              </form>
            </div>
          )}

          {activeStep === "plan" && (
            <div className="max-w-4xl">
              <p className="text-sm font-semibold text-orange-700">3 / 4</p>
              <div className="mt-2 flex flex-wrap items-end justify-between gap-5">
                <div>
                  <h1 className="text-3xl font-semibold">Abonelik planınızı seçin</h1>
                  <p className="mt-3 text-sm leading-6 text-gray-600">Deneme süresince ücret alınmaz; ödeme bağlantısı sonraki fazda eklenecek.</p>
                </div>
                <div className="inline-flex rounded-md border border-gray-300 bg-white p-1" aria-label="Faturalama dönemi">
                  {(["monthly", "yearly"] as BillingCycle[]).map((cycle) => (
                    <button
                      key={cycle}
                      type="button"
                      className={cn(
                        "h-9 rounded-sm px-4 text-sm font-medium",
                        billingCycle === cycle ? "bg-gray-950 text-white" : "text-gray-600 hover:text-gray-950",
                      )}
                      onClick={() => setBillingCycle(cycle)}
                      aria-pressed={billingCycle === cycle}
                    >
                      {cycle === "monthly" ? "Aylık" : "Yıllık"}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handlePlanSubmit} className="mt-8">
                <fieldset>
                  <legend className="sr-only">Abonelik planı</legend>
                  <div className="grid gap-4 lg:grid-cols-3">
                    {plans.map((plan) => {
                      const checked = selectedPlan === plan.id
                      const price = billingCycle === "monthly" ? plan.price_monthly : plan.price_yearly
                      return (
                        <label
                          key={plan.id}
                          className={cn(
                            "relative flex cursor-pointer flex-col rounded-md border bg-white p-5 transition-colors",
                            checked ? "border-orange-500 ring-1 ring-orange-500" : "border-gray-200 hover:border-gray-400",
                          )}
                        >
                          <input
                            type="radio"
                            name="subscription-plan"
                            value={plan.id}
                            checked={checked}
                            onChange={() => setSelectedPlan(plan.id as SignupPlanId)}
                            className="sr-only"
                          />
                          <span className="flex items-start justify-between gap-3">
                            <span className="text-lg font-semibold">{plan.name}</span>
                            <span
                              className={cn(
                                "grid h-5 w-5 shrink-0 place-items-center rounded-full border",
                                checked ? "border-orange-600 bg-orange-600 text-white" : "border-gray-300",
                              )}
                            >
                              {checked && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                            </span>
                          </span>
                          <span className="mt-3 text-2xl font-semibold">
                            {formatCurrency(price)}
                            <span className="ml-1 text-sm font-normal text-gray-500">/{billingCycle === "monthly" ? "ay" : "yıl"}</span>
                          </span>
                          <span className="mt-2 text-sm leading-6 text-gray-600">{plan.description}</span>
                          <span className="mt-5 border-t border-gray-200 pt-4 text-xs font-medium text-green-700">
                            {plan.trial_days} gün ücretsiz deneme
                          </span>
                          <ul className="mt-4 space-y-2">
                            {plan.features.slice(0, 5).map((featureId) => (
                              <li key={featureId} className="flex items-start gap-2 text-xs leading-5 text-gray-600">
                                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600" aria-hidden="true" />
                                {FEATURES.find((feature) => feature.id === featureId)?.name ?? featureId}
                              </li>
                            ))}
                          </ul>
                        </label>
                      )
                    })}
                  </div>
                </fieldset>
                <Button type="submit" className="mt-7" disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <ArrowRight className="mr-2 h-4 w-4" aria-hidden="true" />}
                  Planı kaydet ve kuruluma geç
                </Button>
              </form>
            </div>
          )}

          {activeStep === "setup" && (
            <div className="max-w-3xl">
              <p className="text-sm font-semibold text-orange-700">4 / 4</p>
              <h1 className="mt-2 text-3xl font-semibold">Başlangıç verilerini hazırlayın</h1>
              <p className="mt-3 text-sm leading-6 text-gray-600">Seçilen kategoriler ve masa kayıtları işletmenize bir kez eklenecek.</p>

              <form onSubmit={handleSetupSubmit} className="mt-8 space-y-8">
                <fieldset>
                  <legend className="text-sm font-medium">Başlangıç menü kategorileri</legend>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    {starterCategoryOptions.map((category) => {
                      const checked = starterCategories.includes(category)
                      return (
                        <label key={category} className="flex cursor-pointer items-center gap-3 rounded-md border border-gray-200 bg-white p-4">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(nextChecked) => {
                              setStarterCategories((current) =>
                                nextChecked ? [...current, category] : current.filter((item) => item !== category),
                              )
                            }}
                          />
                          <span className="text-sm font-medium">{category}</span>
                        </label>
                      )
                    })}
                  </div>
                </fieldset>

                <div className="grid gap-4 border-y border-gray-200 py-5 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-gray-500">Plan</p>
                    <p className="mt-1 text-sm font-medium">{selectedPlanData?.name ?? selectedPlan}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Servis modeli</p>
                    <p className="mt-1 text-sm font-medium">{serviceModes.length} seçim</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Masa</p>
                    <p className="mt-1 text-sm font-medium">{serviceModes.includes("dine_in") ? session?.table_count ?? 0 : 0}</p>
                  </div>
                </div>

                <Button type="submit" disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <Check className="mr-2 h-4 w-4" aria-hidden="true" />}
                  Kurulumu tamamla
                </Button>
              </form>
            </div>
          )}

          {activeStep === "complete" && (
            <div className="max-w-2xl py-6">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-green-700 text-white">
                <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
              </span>
              <h1 className="mt-6 text-3xl font-semibold">İşletmeniz hazır</h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-gray-600">
                Menü kategorileri ve operasyon ayarları oluşturuldu. Ekip üyelerini paneldeki Ekip bölümünden davet edebilirsiniz.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button
                  type="button"
                  onClick={() => {
                    router.replace("/")
                    router.refresh()
                  }}
                >
                  <Store className="mr-2 h-4 w-4" aria-hidden="true" />
                  Panele geç
                </Button>
                <Button type="button" variant="outline" onClick={() => router.push("/menu")}>
                  Menüyü düzenle
                </Button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
