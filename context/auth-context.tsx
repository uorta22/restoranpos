"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { useToast } from "@/hooks/use-toast"

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

// Mock user data for demo purposes
const mockUsers = [
  {
    id: "1",
    name: "Admin User",
    email: "admin@example.com",
    password: "password123",
    role: "Yönetici" as const,
    avatar: "/abstract-admin-interface.png",
    restaurant_id: "mock-restaurant-1", // Add mock restaurant_id
  },
  {
    id: "2",
    name: "Waiter User",
    email: "waiter@example.com",
    password: "password123",
    role: "Garson" as const,
    avatar: "/friendly-cafe-server.png",
    restaurant_id: "mock-restaurant-1", // Add mock restaurant_id
  },
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
        // In a real app, you would verify the token with your backend
        const token = localStorage.getItem("auth_token")
        if (token && !user) {
          // For demo purposes, we'll just set a mock user
          setUser(mockUsers[0])
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

      // In a real app, you would call your API here
      // For demo purposes, we'll just check against mock users
      const foundUser = mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password)

      if (foundUser) {
        const { password: _, ...userWithoutPassword } = foundUser
        setUser(userWithoutPassword)

        // Store token in localStorage (in a real app, this would be a JWT)
        localStorage.setItem("auth_token", "mock-token-" + Date.now())

        return { success: true }
      }

      return { success: false, message: "E-posta veya şifre hatalı" }
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
