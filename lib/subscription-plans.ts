export const FEATURES = [
  { id: "menu", name: "Menü yönetimi" },
  { id: "orders", name: "Sipariş yönetimi" },
  { id: "tables", name: "Masa yönetimi" },
  { id: "kitchen", name: "Mutfak ekranı" },
  { id: "reports", name: "Raporlar" },
  { id: "inventory", name: "Stok takibi" },
  { id: "analytics", name: "Gelişmiş analitik" },
  { id: "marketing", name: "Pazarlama araçları" },
  { id: "delivery", name: "Kurye ve teslimat" },
  { id: "loyalty", name: "Sadakat programı" },
]

export const PLANS = [
  {
    id: "basic",
    name: "Temel",
    description: "Küçük işletmeler için temel özellikler",
    price: 199,
    features: ["menu", "orders", "tables"],
  },
  {
    id: "standard",
    name: "Standart",
    description: "Orta ölçekli işletmeler için ideal",
    price: 399,
    features: ["menu", "orders", "tables", "kitchen", "reports", "inventory"],
  },
  {
    id: "pro",
    name: "Profesyonel",
    description: "Büyük işletmeler için tam kapsamlı çözüm",
    price: 699,
    features: [
      "menu",
      "orders",
      "tables",
      "kitchen",
      "reports",
      "inventory",
      "analytics",
      "marketing",
      "delivery",
      "loyalty",
    ],
  },
]
