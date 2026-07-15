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

export const PLANS = [
  {
    id: "basic",
    name: "Temel",
    description: "Küçük işletmeler için temel özellikler",
    price: 199,
    yearlyPrice: 1990,
    features: ["menu", "orders", "tables", "reservations"],
  },
  {
    id: "standard",
    name: "Standart",
    description: "Orta ölçekli işletmeler için ideal",
    price: 399,
    yearlyPrice: 3990,
    features: ["menu", "orders", "tables", "reservations", "kitchen", "reports", "inventory"],
  },
  {
    id: "pro",
    name: "Profesyonel",
    description: "Büyük işletmeler için tam kapsamlı çözüm",
    price: 699,
    yearlyPrice: 6990,
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
  },
]
