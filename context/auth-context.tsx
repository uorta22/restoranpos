"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { useToast } from "@/hooks/use-toast"
import { isDemoMode, DEMO_STORAGE_KEYS, loadFromLocalStorage, saveToLocalStorage, showDemoNotification } from "@/lib/demo-mode"
import { DEMO_USER, DEMO_RESTAURANT_ID, mockUsers } from "@/lib/mock-data"

// Define user type
export interface User {
  id: string
  name: string
  email: string
  role: "Yönetici" | "Garson" | "Şef" | "Kasiyer" | "Kurye"
  avatar?: string
  restaurant_id?: string // Add restaurant_id
}

// Define auth context type
interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>
  logout: () => void
  register: (
    name: string,
    email: string,
    password: string,
    role: string,
  ) => Promise<{ success: boolean; message?: string }>
  updateProfile: (data: Partial<User>) => Promise<{ success: boolean; message?: string }>
}

// Create auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Demo credentials
const DEMO_CREDENTIALS = [
  {
    email: "admin@demo.com",
    password: "demo123",
    user: { ...DEMO_USER, restaurant_id: DEMO_RESTAURANT_ID }
  },
  {
    email: "demo@demo.com",
    password: "demo",
    user: { ...DEMO_USER, restaurant_id: DEMO_RESTAURANT_ID }
  },
  {
    email: "test@test.com",
    password: "test",
    user: { ...DEMO_USER, restaurant_id: DEMO_RESTAURANT_ID }
  }
]

// Auth provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useLocalStorage<User | null>("restaurant-pos-user", null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (isDemoMode()) {
          // Demo mode: auto-login with demo user
          const savedUser = loadFromLocalStorage(DEMO_STORAGE_KEYS.CURRENT_USER, null)
          if (savedUser && !user) {
            setUser(savedUser)
            showDemoNotification("Demo modda otomatik giriş yapıldı")
          } else if (!user) {
            // Auto-login with demo user
            setUser(DEMO_CREDENTIALS[0].user)
            saveToLocalStorage(DEMO_STORAGE_KEYS.CURRENT_USER, DEMO_CREDENTIALS[0].user)
            showDemoNotification("Demo modda otomatik giriş yapıldı")
          }
        } else {
          // Real mode: check token
          const token = localStorage.getItem("auth_token")
          if (token && !user) {
            // Verify token with backend (would be real API call)
            // For now, just set from stored user
          }
        }
      } catch (error) {
        console.error("Auth check error:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [setUser, user])

  // Login function
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true)

      if (isDemoMode()) {
        // Demo mode: check demo credentials
        const foundCredential = DEMO_CREDENTIALS.find(
          (cred) => cred.email.toLowerCase() === email.toLowerCase() && cred.password === password
        )

        if (foundCredential) {
          setUser(foundCredential.user)
          saveToLocalStorage(DEMO_STORAGE_KEYS.CURRENT_USER, foundCredential.user)
          localStorage.setItem("auth_token", "demo-token-" + Date.now())
          showDemoNotification(`Giriş başarılı: ${foundCredential.user.name}`)
          return { success: true }
        }

        // Also allow any email/password in demo mode for easy testing
        if (email && password) {
          const demoUser = { ...DEMO_CREDENTIALS[0].user, email }
          setUser(demoUser)
          saveToLocalStorage(DEMO_STORAGE_KEYS.CURRENT_USER, demoUser)
          localStorage.setItem("auth_token", "demo-token-" + Date.now())
          showDemoNotification(`Demo giriş: ${email}`)
          return { success: true }
        }

        return { success: false, message: "Demo modda herhangi bir e-posta/şifre kullanabilirsiniz" }
      } else {
        // Real mode: API call to backend
        // This would be replaced with actual authentication API
        return { success: false, message: "Gerçek mod henüz yapılandırılmamış" }
      }
    } catch (error) {
      console.error("Login error:", error)
      return { success: false, message: "Giriş sırasında bir hata oluştu" }
    } finally {
      setIsLoading(false)
    }
  }

  // Logout function
  const logout = () => {
    setUser(null)
    localStorage.removeItem("auth_token")
  }

  // Register function
  const register = async (name: string, email: string, password: string, role: string) => {
    try {
      setIsLoading(true)

      // In a real app, you would call your API here
      // For demo purposes, we'll just check if the email is already used
      const existingUser = mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase())

      if (existingUser) {
        return { success: false, message: "Bu e-posta adresi zaten kullanılıyor" }
      }

      // In a real app, you would create the user in your database
      // For demo purposes, we'll just return success
      return { success: true }
    } catch (error) {
      console.error("Register error:", error)
      return { success: false, message: "Kayıt sırasında bir hata oluştu" }
    } finally {
      setIsLoading(false)
    }
  }

  // Update profile function
  const updateProfile = async (data: Partial<User>) => {
    try {
      setIsLoading(true)

      if (!user) {
        return { success: false, message: "Kullanıcı oturumu bulunamadı" }
      }

      // In a real app, you would call your API here
      // For demo purposes, we'll just update the local user
      setUser({ ...user, ...data })

      return { success: true }
    } catch (error) {
      console.error("Update profile error:", error)
      return { success: false, message: "Profil güncellenirken bir hata oluştu" }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        register,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
