"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import type { SupabaseClient, User as SupabaseUser, UserAttributes } from "@supabase/supabase-js"
import type { Database, MemberRole } from "@/lib/database.types"
import { getClientSupabaseInstance } from "@/lib/supabase"
import { getClientPanelOrigin, safeInternalPath } from "@/lib/auth-navigation"

export interface User {
  id: string
  name: string
  email: string
  role: "Yönetici" | "Garson" | "Şef" | "Kasiyer" | "Kurye"
  memberRole?: MemberRole
  avatar?: string
  restaurant_id?: string
}

interface AuthResult {
  success: boolean
  message?: string
  needsOnboarding?: boolean
  requiresEmailConfirmation?: boolean
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<AuthResult>
  logout: () => Promise<void>
  register: (name: string, email: string, password: string, redirectPath?: string) => Promise<AuthResult>
  updateProfile: (data: Partial<User>) => Promise<AuthResult>
  refreshUser: () => Promise<User | null>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const roleLabels: Record<MemberRole, User["role"]> = {
  owner: "Yönetici",
  manager: "Yönetici",
  waiter: "Garson",
  kitchen: "Şef",
  cashier: "Kasiyer",
  courier: "Kurye",
}

async function hydrateUser(supabase: SupabaseClient<Database>, authUser: SupabaseUser): Promise<User> {
  const [profileResult, membershipResult] = await Promise.all([
    supabase.from("profiles").select("full_name, avatar_url").eq("id", authUser.id).maybeSingle(),
    supabase
      .from("restaurant_members")
      .select("restaurant_id, role")
      .eq("user_id", authUser.id)
      .eq("status", "active")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ])

  if (profileResult.error) throw new Error(`Profil okunamadı: ${profileResult.error.message}`)
  if (membershipResult.error) throw new Error(`Restoran üyeliği okunamadı: ${membershipResult.error.message}`)

  const metadataName = authUser.user_metadata?.full_name
  const name =
    profileResult.data?.full_name?.trim() ||
    (typeof metadataName === "string" && metadataName.trim()) ||
    authUser.email ||
    "Kullanıcı"
  const memberRole = membershipResult.data?.role

  return {
    id: authUser.id,
    name,
    email: authUser.email || "",
    role: memberRole ? roleLabels[memberRole] : "Yönetici",
    memberRole,
    avatar: profileResult.data?.avatar_url ?? undefined,
    restaurant_id: membershipResult.data?.restaurant_id,
  }
}

function getAuthMessage(message: string) {
  if (message.includes("Invalid login credentials")) return "E-posta veya şifre hatalı"
  if (message.includes("Email not confirmed")) return "Giriş yapmadan önce e-posta adresinizi doğrulayın"
  if (message.includes("already registered")) return "Bu e-posta adresi zaten kullanılıyor"
  if (message.includes("Password should be")) return "Şifre güvenlik gereksinimlerini karşılamıyor"
  return "Kimlik doğrulama işlemi tamamlanamadı"
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = async () => {
    const supabase = getClientSupabaseInstance()
    const {
      data: { user: authUser },
      error,
    } = await supabase.auth.getUser()

    if (error || !authUser) {
      setUser(null)
      return null
    }

    const appUser = await hydrateUser(supabase, authUser)
    setUser(appUser)
    return appUser
  }

  useEffect(() => {
    const supabase = getClientSupabaseInstance()
    let active = true
    let hydrationSequence = 0

    const applyAuthUser = async (authUser: SupabaseUser | null) => {
      const sequence = ++hydrationSequence
      try {
        const appUser = authUser ? await hydrateUser(supabase, authUser) : null
        if (active && sequence === hydrationSequence) setUser(appUser)
      } catch {
        if (active && sequence === hydrationSequence) setUser(null)
      } finally {
        if (active && sequence === hydrationSequence) setIsLoading(false)
      }
    }

    void supabase.auth.getUser().then(({ data }) => applyAuthUser(data.user))

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(() => void applyAuthUser(session?.user ?? null), 0)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const login = async (email: string, password: string): Promise<AuthResult> => {
    setIsLoading(true)
    const supabase = getClientSupabaseInstance()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setIsLoading(false)
      return { success: false, message: getAuthMessage(error.message) }
    }

    const appUser = data.user ? await hydrateUser(supabase, data.user) : null
    setUser(appUser)
    setIsLoading(false)
    return { success: true, needsOnboarding: !appUser?.restaurant_id }
  }

  const logout = async () => {
    const supabase = getClientSupabaseInstance()
    await supabase.auth.signOut()
    setUser(null)
  }

  const register = async (
    name: string,
    email: string,
    password: string,
    redirectPath?: string,
  ): Promise<AuthResult> => {
    setIsLoading(true)
    const supabase = getClientSupabaseInstance()
    const nextPath = safeInternalPath(redirectPath, "/onboarding")
    const confirmationUrl = new URL("/auth/confirm", getClientPanelOrigin())
    confirmationUrl.searchParams.set("next", nextPath)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name.trim() },
        emailRedirectTo: confirmationUrl.toString(),
      },
    })

    if (error) {
      setIsLoading(false)
      return { success: false, message: getAuthMessage(error.message) }
    }

    const appUser = data.session && data.user ? await hydrateUser(supabase, data.user) : null
    setUser(appUser)
    setIsLoading(false)
    return {
      success: true,
      needsOnboarding: Boolean(appUser && !appUser.restaurant_id),
      requiresEmailConfirmation: !data.session,
    }
  }

  const updateProfile = async (data: Partial<User>): Promise<AuthResult> => {
    if (!user) return { success: false, message: "Kullanıcı oturumu bulunamadı" }

    const fullName = (data.name ?? user.name).trim()
    const normalizedEmail = (data.email ?? user.email).trim().toLowerCase()
    const avatarUrl = (data.avatar ?? user.avatar ?? "").trim()
    if (fullName.length < 2) return { success: false, message: "Ad soyad en az iki karakter olmalıdır" }
    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      return { success: false, message: "Geçerli bir e-posta adresi girin" }
    }
    if (avatarUrl && !avatarUrl.startsWith("https://")) {
      return { success: false, message: "Profil görseli HTTPS adresi olmalıdır" }
    }

    setIsLoading(true)
    const supabase = getClientSupabaseInstance()
    const emailChanged = normalizedEmail !== user.email.toLowerCase()
    const authUpdates: UserAttributes = {
      data: {
        full_name: fullName,
        avatar_url: avatarUrl || null,
      },
    }
    if (emailChanged) authUpdates.email = normalizedEmail

    const { error: authError } = await supabase.auth.updateUser(authUpdates)

    if (authError) {
      setIsLoading(false)
      return { success: false, message: getAuthMessage(authError.message) }
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        avatar_url: avatarUrl || null,
      })
      .eq("id", user.id)

    if (profileError) {
      setIsLoading(false)
      return { success: false, message: "Profil güncellenemedi" }
    }

    await refreshUser()
    setIsLoading(false)
    return { success: true, requiresEmailConfirmation: emailChanged }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, register, updateProfile, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider")
  return context
}
