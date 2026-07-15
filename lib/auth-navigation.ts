export const SIGNUP_PLAN_IDS = ["basic", "standard", "pro"] as const
export const BILLING_CYCLES = ["monthly", "yearly"] as const

export type SignupPlanId = (typeof SIGNUP_PLAN_IDS)[number]
export type SignupBillingCycle = (typeof BILLING_CYCLES)[number]

export function getSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export function safeInternalPath(value: string | null | undefined, fallback: string) {
  if (!value?.startsWith("/") || value.startsWith("//") || value.includes("\\") || /[\r\n]/.test(value)) {
    return fallback
  }
  return value
}

export function isInvitationPath(pathname: string) {
  return /^\/invite\/[^/?#]+(?:[?#].*)?$/.test(pathname)
}

export function normalizeSignupPlan(value: string | null | undefined): SignupPlanId {
  return SIGNUP_PLAN_IDS.includes(value as SignupPlanId) ? (value as SignupPlanId) : "standard"
}

export function normalizeBillingCycle(value: string | null | undefined): SignupBillingCycle {
  return BILLING_CYCLES.includes(value as SignupBillingCycle) ? (value as SignupBillingCycle) : "monthly"
}

export function normalizeAcquisitionSource(value: string | null | undefined) {
  const normalized = value?.trim().replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "")
  return normalized ? normalized.slice(0, 80) : undefined
}

export function buildOnboardingPath(plan: SignupPlanId, cycle: SignupBillingCycle, source?: string) {
  const params = new URLSearchParams({ plan, cycle })
  if (source) params.set("source", source)
  return `/onboarding?${params.toString()}`
}

export function getPanelOrigin(fallbackOrigin: string) {
  const configuredPanelUrl = process.env.NEXT_PUBLIC_PANEL_URL
  if (configuredPanelUrl) {
    try {
      const parsedUrl = new URL(configuredPanelUrl)
      if (parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:") return parsedUrl.origin
    } catch {
      // The caller-provided origin remains the safe fallback for local development.
    }
  }
  return fallbackOrigin
}

export function getClientPanelOrigin() {
  return getPanelOrigin(window.location.origin)
}
