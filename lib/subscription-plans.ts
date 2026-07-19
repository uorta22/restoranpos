export const FEATURES = [
  { id: "menu", name: "Menü yönetimi" },
  { id: "orders", name: "Sipariş yönetimi" },
  { id: "tables", name: "Masa yönetimi" },
  { id: "reservations", name: "Rezervasyon yönetimi" },
  { id: "kitchen", name: "Mutfak ekranı" },
  { id: "reports", name: "Raporlar" },
  { id: "inventory", name: "Stok takibi" },
  { id: "analytics", name: "Gelişmiş analitik" },
  { id: "delivery", name: "Kurye ve teslimat" },
]

// Tek 'her şey dahil' plan. id 'standard' korunur (signup/onboarding varsayılanı buna bağlı).
export const SINGLE_PLAN = {
  id: "standard",
  name: "Her Şey Dahil",
  description: "Tüm modüller tek fiyatta — eklenti yok, komisyon yok.",
  price: 899,
  yearlyPrice: 8990,
  features: [
    "menu",
    "orders",
    "tables",
    "reservations",
    "kitchen",
    "reports",
    "inventory",
    "analytics",
    "delivery",
  ],
}

export const PLANS = [SINGLE_PLAN]
