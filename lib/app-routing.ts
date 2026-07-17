export const INTERNAL_MARKETING_PREFIX = "/marketing"

const PANEL_PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/track",
  "/auth",
  "/invite",
  "/forgot-password",
  "/reset-password",
  "/r",
  "/api/integrations",
  "/api/cron",
] as const

const PANEL_PATHS = [
  ...PANEL_PUBLIC_PATHS,
  "/onboarding",
  "/menu",
  "/orders",
  "/kitchen",
  "/tables",
  "/reservations",
  "/delivery",
  "/team",
  "/inventory",
  "/reports",
  "/settings",
  "/billing",
  "/profile",
  "/users",
  "/store",
  "/integrations",
] as const

const MARKETING_ONLY_PATHS = ["/features", "/contact", "/privacy", "/terms", "/kvkk"] as const

const LEGACY_PANEL_ROUTES = [
  { from: "/users", to: "/team" },
  { from: "/store", to: "/inventory" },
  { from: "/pricing", to: "/billing" },
] as const

export type AppSurface = "marketing" | "panel"

export function matchesPath(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

export function isPanelPublicPath(pathname: string) {
  return PANEL_PUBLIC_PATHS.some((path) => matchesPath(pathname, path))
}

export function isPanelPath(pathname: string) {
  return PANEL_PATHS.some((path) => matchesPath(pathname, path))
}

export function isMarketingOnlyPath(pathname: string) {
  return MARKETING_ONLY_PATHS.some((path) => matchesPath(pathname, path))
}

export function getLegacyPanelPath(pathname: string) {
  const route = LEGACY_PANEL_ROUTES.find(({ from }) => matchesPath(pathname, from))
  if (!route) return null
  return `${route.to}${pathname.slice(route.from.length)}`
}

export function isInternalMarketingPath(pathname: string) {
  return matchesPath(pathname, INTERNAL_MARKETING_PREFIX)
}

export function toInternalMarketingPath(pathname: string) {
  return pathname === "/" ? INTERNAL_MARKETING_PREFIX : `${INTERNAL_MARKETING_PREFIX}${pathname}`
}

export function fromInternalMarketingPath(pathname: string) {
  const publicPath = pathname.slice(INTERNAL_MARKETING_PREFIX.length)
  return publicPath || "/"
}

function parseConfiguredUrl(value: string | undefined) {
  if (!value) return null
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:" ? url : null
  } catch {
    return null
  }
}

function isLocalHostname(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1" || hostname.endsWith(".localhost")
}

export function getAppSurface(requestUrl: URL): AppSurface {
  const configuredMarketingUrl = parseConfiguredUrl(process.env.NEXT_PUBLIC_MARKETING_URL)
  if (configuredMarketingUrl?.host === requestUrl.host) return "marketing"

  const hostname = requestUrl.hostname.toLowerCase()
  if (hostname === "www.localhost" || hostname.startsWith("www.")) return "marketing"
  return "panel"
}

export function getSurfaceUrl(surface: AppSurface, requestUrl: URL, pathname: string) {
  const configuredUrl = parseConfiguredUrl(
    surface === "marketing" ? process.env.NEXT_PUBLIC_MARKETING_URL : process.env.NEXT_PUBLIC_PANEL_URL,
  )

  let target = configuredUrl
  if (!target && isLocalHostname(requestUrl.hostname)) {
    const hostname = surface === "marketing" ? "www.localhost" : "panel.localhost"
    const port = requestUrl.port ? `:${requestUrl.port}` : ""
    target = new URL(`${requestUrl.protocol}//${hostname}${port}`)
  }
  if (!target) return null

  const url = new URL(target)
  url.pathname = pathname
  url.search = requestUrl.search
  url.hash = ""
  return url
}
