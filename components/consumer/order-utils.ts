import { validateEmail } from "@/lib/utils"
import type { CartLine, OnlineOrderKind, PublicProduct } from "@/components/consumer/types"

export const MIN_NAME_LENGTH = 2
export const MIN_PHONE_DIGITS = 10

function roundCurrency(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100
}

/** İndirim uygulanmış birim fiyatı döndürür. */
export function getUnitPrice(product: PublicProduct): number {
  const discountPercent = product.discount_percent ?? 0
  if (discountPercent <= 0) return product.price
  return roundCurrency(product.price - (product.price * discountPercent) / 100)
}

/** Sepet toplamlarını panel tarafındaki hesaplamayla aynı yuvarlama kurallarıyla üretir. */
export function calculateCartTotals(lines: CartLine[], taxRate: number) {
  let subtotal = 0
  let discount = 0

  for (const line of lines) {
    const lineSubtotal = roundCurrency(line.product.price * line.quantity)
    const lineDiscount = roundCurrency((lineSubtotal * (line.product.discount_percent ?? 0)) / 100)
    subtotal += lineSubtotal
    discount += lineDiscount
  }

  subtotal = roundCurrency(subtotal)
  discount = roundCurrency(discount)
  const netSubtotal = roundCurrency(subtotal - discount)
  const tax = roundCurrency((netSubtotal * taxRate) / 100)

  return {
    subtotal,
    discount,
    netSubtotal,
    tax,
    total: roundCurrency(netSubtotal + tax),
  }
}

export interface CheckoutFields {
  orderKind: OnlineOrderKind
  name: string
  phone: string
  address: string
  email: string
}

export type CheckoutFieldErrors = Partial<Record<"name" | "phone" | "address" | "email", string>>

/** Checkout formunu doğrular; alan bazlı Türkçe hata mesajları döndürür. */
export function validateCheckout(fields: CheckoutFields): CheckoutFieldErrors {
  const errors: CheckoutFieldErrors = {}

  if (fields.name.trim().length < MIN_NAME_LENGTH) {
    errors.name = "Lütfen adınızı girin (en az 2 karakter)."
  }

  if (fields.phone.replace(/\D/g, "").length < MIN_PHONE_DIGITS) {
    errors.phone = "Lütfen geçerli bir telefon numarası girin (en az 10 rakam)."
  }

  if (fields.orderKind === "delivery" && !fields.address.trim()) {
    errors.address = "Teslimat için adres bilgisi zorunludur."
  }

  if (fields.email.trim() && !validateEmail(fields.email.trim())) {
    errors.email = "Lütfen geçerli bir e-posta adresi girin."
  }

  return errors
}

/** RPC'nin İngilizce hata mesajlarını kullanıcı dostu Türkçe metinlere çevirir. */
export function translateOrderError(message: string): string {
  const normalized = message.toLowerCase()

  if (normalized.includes("too many recent orders")) {
    return "Kısa süre içinde çok fazla sipariş denemesi yapıldı. Lütfen birkaç dakika bekleyip tekrar deneyin."
  }
  if (normalized.includes("not found")) {
    return "Restoran ya da sepetinizdeki ürünlerden biri artık mevcut değil. Sayfayı yenileyip tekrar deneyin."
  }
  if (
    normalized.includes("not accept") ||
    normalized.includes("not available") ||
    normalized.includes("not enabled") ||
    normalized.includes("closed")
  ) {
    return "Restoran şu anda bu sipariş türü için online sipariş kabul etmiyor."
  }
  if (normalized.includes("invalid") || normalized.includes("required")) {
    return "Sipariş bilgilerinde eksik ya da hatalı alanlar var. Lütfen bilgilerinizi kontrol edin."
  }

  return "Siparişiniz gönderilirken bir sorun oluştu. Lütfen tekrar deneyin."
}
