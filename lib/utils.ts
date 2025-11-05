import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { FoodItem } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
  }).format(amount)
}

export function getDiscountedPrice(item: FoodItem): number {
  if (!item.discount) return item.price
  return item.price - (item.price * item.discount) / 100
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePassword(password: string): boolean {
  return password.length >= 6
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date)
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

// formatDateTime fonksiyonunu güvenli hale getirelim
export function formatDateTime(date: Date | string | number | null | undefined): string {
  if (!date) return "-"

  try {
    const dateObj = date instanceof Date ? date : new Date(date)

    // Geçersiz tarih kontrolü
    if (isNaN(dateObj.getTime())) {
      return "-"
    }

    return new Intl.DateTimeFormat("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(dateObj)
  } catch (error) {
    console.error("Tarih formatlanırken hata oluştu:", error)
    return "-"
  }
}

// Sipariş numarası oluşturma fonksiyonu
let lastOrderNumber = 0

export function generateOrderNumber(): string {
  // LocalStorage'dan son sipariş numarasını al
  if (typeof window !== "undefined" && lastOrderNumber === 0) {
    const storedLastNumber = localStorage.getItem("lastOrderNumber")
    if (storedLastNumber) {
      lastOrderNumber = Number.parseInt(storedLastNumber, 10)
    } else {
      // İlk sipariş numarası
      lastOrderNumber = 1000000000
    }
  } else if (lastOrderNumber === 0) {
    // Server-side rendering için başlangıç değeri
    lastOrderNumber = 1000000000
  }

  // Bir sonraki sipariş numarası
  lastOrderNumber++

  // LocalStorage'a kaydet
  if (typeof window !== "undefined") {
    localStorage.setItem("lastOrderNumber", lastOrderNumber.toString())
  }

  // 10 haneli numara olarak döndür
  return lastOrderNumber.toString()
}

// OTP (One-Time Password) oluşturma fonksiyonu
export function generateOTP(length = 6): string {
  const digits = "0123456789"
  let otp = ""

  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)]
  }

  return otp
}
