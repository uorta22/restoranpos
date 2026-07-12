import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import type { Database, MemberRole } from "@/lib/database.types"

const PUBLIC_PATHS = ["/login", "/pricing", "/track", "/auth", "/invite", "/forgot-password", "/reset-password"]
const NO_CACHE_HEADERS = ["cache-control", "expires", "pragma"]
const CONTROLLED_PATHS = [
  "/",
  "/menu",
  "/orders",
  "/kitchen",
  "/tables",
  "/reservations",
  "/delivery",
  "/users",
  "/store",
  "/reports",
  "/settings",
  "/profile",
] as const
const MANAGEMENT_PATHS = ["/", "/menu", "/orders", "/kitchen", "/tables", "/reservations", "/delivery", "/users", "/store", "/reports", "/settings", "/profile"]
const ROLE_PATHS: Record<MemberRole, string[]> = {
  owner: MANAGEMENT_PATHS,
  manager: MANAGEMENT_PATHS,
  cashier: ["/", "/menu", "/orders", "/tables", "/reservations", "/delivery", "/reports", "/profile"],
  waiter: ["/", "/menu", "/orders", "/tables", "/reservations", "/profile"],
  kitchen: ["/menu", "/orders", "/kitchen", "/profile"],
  courier: ["/delivery", "/profile"],
}
const ROLE_HOME: Record<MemberRole, string> = {
  owner: "/",
  manager: "/",
  cashier: "/",
  waiter: "/",
  kitchen: "/kitchen",
  courier: "/delivery",
}

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))
}

function getControlledPath(pathname: string) {
  return CONTROLLED_PATHS.find((path) => path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(`${path}/`))
}

function redirectWithSessionCookies(url: URL, response: NextResponse) {
  const redirectResponse = NextResponse.redirect(url)

  response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie))
  NO_CACHE_HEADERS.forEach((header) => {
    const value = response.headers.get(header)
    if (value) redirectResponse.headers.set(header, value)
  })

  return redirectResponse
}

export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!url || !publishableKey) {
    return new NextResponse("Application authentication is not configured.", { status: 503 })
  }

  let response = NextResponse.next({ request })
  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value))
      },
    },
  })

  const { data } = await supabase.auth.getClaims()
  const isAuthenticated = Boolean(data?.claims?.sub)
  const { pathname, search } = request.nextUrl

  if (!isAuthenticated && !isPublicPath(pathname)) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = "/login"
    loginUrl.search = ""
    loginUrl.searchParams.set("redirect", `${pathname}${search}`)
    return redirectWithSessionCookies(loginUrl, response)
  }

  const shouldCheckMembership =
    isAuthenticated && (pathname === "/login" || pathname === "/onboarding" || !isPublicPath(pathname))

  if (shouldCheckMembership) {
    const { data: membership, error: membershipError } = await supabase
      .from("restaurant_members")
      .select("restaurant_id, role")
      .eq("user_id", data?.claims?.sub as string)
      .eq("status", "active")
      .limit(1)
      .maybeSingle()

    if (membershipError) {
      return new NextResponse("Authorization service is temporarily unavailable.", { status: 503 })
    }

    if (!membership && pathname !== "/onboarding") {
      const onboardingUrl = request.nextUrl.clone()
      onboardingUrl.pathname = "/onboarding"
      onboardingUrl.search = ""
      return redirectWithSessionCookies(onboardingUrl, response)
    }

    if (membership && (pathname === "/login" || pathname === "/onboarding")) {
      const homeUrl = request.nextUrl.clone()
      homeUrl.pathname = "/"
      homeUrl.search = ""
      return redirectWithSessionCookies(homeUrl, response)
    }

    const controlledPath = getControlledPath(pathname)
    if (membership && controlledPath && !ROLE_PATHS[membership.role].includes(controlledPath)) {
      const roleHomeUrl = request.nextUrl.clone()
      roleHomeUrl.pathname = ROLE_HOME[membership.role]
      roleHomeUrl.search = ""
      return redirectWithSessionCookies(roleHomeUrl, response)
    }
  }

  return response
}
