import type { MemberRole } from "@/lib/database.types"

export type PanelFeature =
  | "menu"
  | "orders"
  | "tables"
  | "reservations"
  | "kitchen"
  | "reports"
  | "inventory"
  | "delivery"

export interface PanelRouteRule {
  path: string
  roles: readonly MemberRole[]
  feature?: PanelFeature
}

const allRoles: readonly MemberRole[] = ["owner", "manager", "cashier", "waiter", "kitchen", "courier"]
const management: readonly MemberRole[] = ["owner", "manager"]
const frontOfHouse: readonly MemberRole[] = ["owner", "manager", "cashier", "waiter"]

export const PANEL_ROUTE_RULES: readonly PanelRouteRule[] = [
  { path: "/", roles: frontOfHouse, feature: "orders" },
  { path: "/menu", roles: [...frontOfHouse, "kitchen"], feature: "menu" },
  { path: "/orders", roles: [...frontOfHouse, "kitchen"], feature: "orders" },
  { path: "/kitchen", roles: [...management, "kitchen"], feature: "kitchen" },
  { path: "/tables", roles: frontOfHouse, feature: "tables" },
  { path: "/reservations", roles: frontOfHouse, feature: "reservations" },
  { path: "/delivery", roles: [...management, "cashier", "courier"], feature: "delivery" },
  { path: "/team", roles: management },
  { path: "/inventory", roles: management, feature: "inventory" },
  { path: "/reports", roles: [...management, "cashier"], feature: "reports" },
  { path: "/settings", roles: management },
  { path: "/billing", roles: ["owner"] },
  { path: "/profile", roles: allRoles },
]

const preferredRoleHome: Record<MemberRole, string> = {
  owner: "/",
  manager: "/",
  cashier: "/",
  waiter: "/",
  kitchen: "/kitchen",
  courier: "/delivery",
}

export function getPanelRouteRule(pathname: string) {
  return PANEL_ROUTE_RULES.find(({ path }) =>
    path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(`${path}/`),
  )
}

export function getRoleHome(role: MemberRole) {
  return preferredRoleHome[role]
}

export function getAccessibleRoleHome(role: MemberRole, features: readonly string[]) {
  const candidates = [preferredRoleHome[role], ...PANEL_ROUTE_RULES.map(({ path }) => path), "/profile"]
  return (
    candidates.find((path, index) => {
      if (candidates.indexOf(path) !== index) return false
      const rule = PANEL_ROUTE_RULES.find((candidate) => candidate.path === path)
      return Boolean(rule?.roles.includes(role) && (!rule.feature || features.includes(rule.feature)))
    }) ?? "/profile"
  )
}
