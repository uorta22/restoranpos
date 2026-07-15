"use client"

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"
import { getClientSupabaseInstance } from "@/lib/supabase"
import { useAuth } from "@/context/auth-context"

export const FEATURE_SETS = {
  basic: ["menu", "orders", "tables", "reservations"],
  standard: ["menu", "orders", "tables", "reservations", "kitchen", "reports", "inventory"],
  pro: ["menu", "orders", "tables", "reservations", "kitchen", "reports", "inventory", "analytics", "delivery"],
}

export const FEATURE_DESCRIPTIONS = {
  menu: "Menü yönetimi",
  orders: "Sipariş yönetimi",
  tables: "Masa yönetimi",
  reservations: "Rezervasyon yönetimi",
  kitchen: "Mutfak ekranı",
  reports: "Raporlar",
  inventory: "Stok takibi",
  analytics: "Gelişmiş analitik",
  delivery: "Kurye ve teslimat",
}

export type License = {
  id: string
  userId: string
  type: string
  plan: string
  features: string[]
  validUntil: string
  restaurantName?: string
  restaurantAddress?: string
  restaurantPhone?: string
  restaurantEmail?: string
  restaurantLogo?: string
  createdAt: string
  updatedAt: string
  status: string
}

interface LicenseContextType {
  license: License | null
  isLoading: boolean
  isLicenseValid: () => boolean
  isTrialExpired: () => boolean
  getRemainingDays: () => number
  activateLicense: (licenseKey: string) => Promise<{ success: boolean; message?: string }>
  startTrial: () => Promise<void>
  updateLicense: (license: Partial<License>) => Promise<void>
  isFeatureRestricted: (feature: string) => boolean
  hasFeature: (feature: string) => boolean
  refreshLicense: () => Promise<void>
}

const LicenseContext = createContext<LicenseContextType | undefined>(undefined)

export function LicenseProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: isAuthLoading } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [license, setLicense] = useState<License | null>(null)

  const refreshLicense = useCallback(async () => {
    if (!user?.restaurant_id) {
      setLicense(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    const supabase = getClientSupabaseInstance()
    try {
      const [subscriptionResult, restaurantResult] = await Promise.all([
        supabase
          .from("restaurant_subscriptions")
          .select("*")
          .eq("restaurant_id", user.restaurant_id)
          .maybeSingle(),
        supabase.from("restaurants").select("*").eq("id", user.restaurant_id).single(),
      ])

      if (subscriptionResult.error) throw subscriptionResult.error
      if (restaurantResult.error) throw restaurantResult.error
      if (!subscriptionResult.data) {
        setLicense(null)
        return
      }

      const { data: plan, error: planError } = await supabase
        .from("subscription_plans")
        .select("features")
        .eq("id", subscriptionResult.data.plan_id)
        .single()
      if (planError) throw planError

      const subscription = subscriptionResult.data
      const restaurant = restaurantResult.data
      const validUntil = subscription.trial_ends_at || subscription.current_period_end || new Date(0).toISOString()
      setLicense({
        id: subscription.restaurant_id,
        userId: user.id,
        type: subscription.status === "trialing" ? "TRIAL" : subscription.status.toUpperCase(),
        plan: subscription.plan_id,
        features: plan.features,
        validUntil,
        restaurantName: restaurant.name,
        restaurantAddress: restaurant.address ?? undefined,
        restaurantPhone: restaurant.phone ?? undefined,
        restaurantEmail: restaurant.email ?? undefined,
        restaurantLogo: restaurant.logo_url ?? undefined,
        createdAt: subscription.created_at,
        updatedAt: subscription.updated_at,
        status: subscription.status,
      })
    } catch {
      setLicense(null)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (isAuthLoading) return
    const timeoutId = window.setTimeout(() => void refreshLicense(), 0)
    return () => window.clearTimeout(timeoutId)
  }, [isAuthLoading, refreshLicense])

  const isLicenseValid = () => {
    if (!license || !["trialing", "active"].includes(license.status)) return false
    return new Date(license.validUntil).getTime() > Date.now()
  }

  const isTrialExpired = () => {
    if (!license || license.status !== "trialing") return false
    return new Date(license.validUntil).getTime() <= Date.now()
  }

  const getRemainingDays = () => {
    if (!license) return 0
    return Math.max(0, Math.ceil((new Date(license.validUntil).getTime() - Date.now()) / 86_400_000))
  }

  const activateLicense = async (licenseKey: string) => {
    void licenseKey
    return {
      success: false,
      message: "Lisans anahtarıyla aktivasyon desteklenmiyor. Abonelik değişiklikleri ödeme sağlayıcısı üzerinden yapılmalıdır.",
    }
  }

  const startTrial = async () => {
    await refreshLicense()
  }

  const updateLicense = async (updatedLicense: Partial<License>) => {
    void updatedLicense
    throw new Error("Abonelik istemciden değiştirilemez")
  }

  const hasFeature = (feature: string) => Boolean(license?.features.includes(feature) && isLicenseValid())
  const isFeatureRestricted = (feature: string) => !hasFeature(feature)

  return (
    <LicenseContext.Provider
      value={{
        license,
        isLoading,
        isLicenseValid,
        isTrialExpired,
        getRemainingDays,
        activateLicense,
        startTrial,
        updateLicense,
        isFeatureRestricted,
        hasFeature,
        refreshLicense,
      }}
    >
      {children}
    </LicenseContext.Provider>
  )
}

export function useLicense() {
  const context = useContext(LicenseContext)
  if (context === undefined) throw new Error("useLicense must be used within a LicenseProvider")
  return context
}
