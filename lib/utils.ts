import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { CartItem, FoodItem } from "./types"

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

function roundCurrency(amount: number) {
  return Math.round((amount + Number.EPSILON) * 100) / 100
}

export function calculateOrderTotals(items: CartItem[], taxRate: number) {
  let subtotal = 0
  let discount = 0

  for (const item of items) {
    const lineSubtotal = roundCurrency(item.foodItem.price * item.quantity)
    const lineDiscount = roundCurrency(lineSubtotal * (item.foodItem.discount ?? 0) / 100)
    subtotal += lineSubtotal
    discount += lineDiscount
  }

  subtotal = roundCurrency(subtotal)
  discount = roundCurrency(discount)
  const netSubtotal = roundCurrency(subtotal - discount)
  const tax = roundCurrency(netSubtotal * taxRate / 100)

  return {
    subtotal,
    discount,
    netSubtotal,
    tax,
    total: roundCurrency(netSubtotal + tax),
  }
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePassword(password: string): boolean {
  return password.length >= 8 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password)
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
