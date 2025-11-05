"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "./auth-context"

// Feature sets and descriptions
export const FEATURE_SETS = {
  basic: ["menu", "orders", "tables"],
  standard: ["menu", "orders", "tables", "kitchen", "reports", "inventory"],
  pro: ["menu", "orders", "tables", "kitchen", "reports", "inventory", "analytics", "marketing", "delivery", "loyalty"],
}

export const FEATURE_DESCRIPTIONS = {
  menu: "Menü yönetimi",
  orders: "Sipariş yönetimi",
  tables: "Masa yönetimi",
  kitchen: "Mutfak ekranı",
  reports: "Raporlar",
  inventory: "Stok takibi",
  analytics: "Gelişmiş analitik",
  marketing: "Pazarlama araçları",
  delivery: "Kurye ve teslimat",
  loyalty: "Sadakat programı",
}

export const LICENSE_PLANS = [
  {
    type: "BASIC",
    name: "Basic",
    description: "Essential features for small businesses",
    price: 19,
    priceUnit: "$",
    period: "month",
  },
  {
    type: "STANDARD",
    name: "Standard",
    description: "Ideal for growing businesses",
    price: 49,
    priceUnit: "$",
    period: "month",
  },
  {
    type: "PREMIUM",
    name: "Premium",
    description: "Advanced features for large enterprises",
    price: 99,
    priceUnit: "$",
    period: "month",
  },
]

export type License = {
  id: string
  userId: string
  type: string
  plan?: string
  features: string[]
  validUntil: string
  restaurantName?: string
  restaurantAddress?: string
  restaurantPhone?: string
  restaurantEmail?: string
  restaurantLogo?: string
  createdAt: string
  updatedAt: string
  status?: string
}

type LicenseContextType = {
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
}

const LicenseContext = createContext<LicenseContextType | undefined>(undefined)

export function LicenseProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [license, setLicense] = useLocalStorage<License | null>("restaurant-pos-license", null)

  useEffect(() => {
    const fetchLicense = async () => {
      if (!user) {
        setIsLoading(false)
        return
      }

      try {
        // In a real app, you would fetch the license from an API
        // For now, we'll use a mock license if one doesn't exist
        if (!license || license.userId !== user.id) {
          const mockLicense: License = {
            id: "license_" + Math.random().toString(36).substr(2, 9),
            userId: user.id,
            type: "FREE",
            plan: "basic",
            features: FEATURE_SETS.basic,
            validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
          setLicense(mockLicense)
        }
      } catch (error) {
        console.error("Error fetching license:", error)
        toast({
          variant: "destructive",
          title: "Lisans bilgileri alınamadı",
          description: "Lütfen daha sonra tekrar deneyin.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchLicense()
  }, [user, license, setLicense, toast])

  const isLicenseValid = () => {
    if (!license) return false
    const now = new Date()
    const validUntil = new Date(license.validUntil)
    return now < validUntil
  }

  const isTrialExpired = () => {
    if (!license || license.type !== "FREE") return true
    const now = new Date()
    const validUntil = new Date(license.validUntil)
    return now > validUntil
  }

  const getRemainingDays = () => {
    if (!license) return 0
    const now = new Date()
    const validUntil = new Date(license.validUntil)
    const diff = validUntil.getTime() - now.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  const activateLicense = async (licenseKey: string) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // In a real app, you would validate the license key against your server
    if (licenseKey === "VALID-LICENSE-KEY") {
      const newLicense = {
        ...license,
        type: "PREMIUM",
        plan: "pro",
        features: FEATURE_SETS.pro,
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
      }
      setLicense(newLicense as License)
      return { success: true }
    } else {
      return { success: false, message: "Geçersiz lisans anahtarı" }
    }
  }

  const startTrial = async () => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const newLicense = {
      ...license,
      type: "TRIAL",
      plan: "standard",
      features: FEATURE_SETS.standard,
      validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
    }
    setLicense(newLicense as License)
  }

  const updateLicense = async (updatedLicense: Partial<License>) => {
    if (!license) return

    try {
      // In a real app, you would update the license via an API
      const newLicense = {
        ...license,
        ...updatedLicense,
        updatedAt: new Date().toISOString(),
      }
      setLicense(newLicense as License)
      return Promise.resolve()
    } catch (error) {
      console.error("Error updating license:", error)
      toast({
        variant: "destructive",
        title: "Lisans güncellenemedi",
        description: "Lütfen daha sonra tekrar deneyin.",
      })
      return Promise.reject(error)
    }
  }

  const isFeatureRestricted = (feature: string) => {
    if (!license) return true
    return !license.features.includes(feature)
  }

  const hasFeature = (feature: string) => {
    if (!license) return false
    return license.features.includes(feature)
  }

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
      }}
    >
      {children}
    </LicenseContext.Provider>
  )
}

export function useLicense() {
  const context = useContext(LicenseContext)
  if (context === undefined) {
    throw new Error("useLicense must be used within a LicenseProvider")
  }
  return context
}
