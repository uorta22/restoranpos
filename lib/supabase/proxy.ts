import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import type { Database, SubscriptionStatus } from "@/lib/database.types"
import { isPanelPublicPath } from "@/lib/app-routing"
import { getAccessibleRoleHome, getPanelRouteRule, getRoleHome } from "@/lib/panel-access"

const NO_CACHE_HEADERS = ["cache-control", "expires", "pragma"]
const SCHEMA_NOT_READY_CODES = new Set(["42703", "42P01", "PGRST204", "PGRST205"])

function redirectWithSessionCookies(url: URL, response: NextResponse) {
  const redirectResponse = NextResponse.redirect(url)

  response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie))
  NO_CACHE_HEADERS.forEach((header) => {
    const value = response.headers.get(header)
    if (value) redirectResponse.headers.set(header, value)
  })

  return redirectResponse
}

function isSubscriptionUsable(
  status: SubscriptionStatus,
  trialEndsAt: string | null,
  currentPeriodEnd: string | null,
) {
  const now = Date.now()
  if (status === "trialing") return Boolean(trialEndsAt && new Date(trialEndsAt).getTime() > now)
  if (status === "active") return !currentPeriodEnd || new Date(currentPeriodEnd).getTime() > now
  return false
}

function redirectToPanelPath(request: NextRequest, response: NextResponse, pathname: string) {
  const redirectUrl = request.nextUrl.clone()
  redirectUrl.pathname = pathname
  redirectUrl.search = ""
  return redirectWithSessionCookies(redirectUrl, response)
}

function isOnboardingSchemaUnavailable(code: string | undefined) {
  return Boolean(code && SCHEMA_NOT_READY_CODES.has(code))
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
  const userId = typeof data?.claims?.sub === "string" ? data.claims.sub : null
  const isAuthenticated = Boolean(userId)
  const { pathname, search } = request.nextUrl

  if (!isAuthenticated && !isPanelPublicPath(pathname)) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = "/login"
    loginUrl.search = ""
    loginUrl.searchParams.set("redirect", `${pathname}${search}`)
    return redirectWithSessionCookies(loginUrl, response)
  }

  const routeRule = getPanelRouteRule(pathname)
  const shouldCheckMembership =
    isAuthenticated && (pathname === "/login" || pathname === "/signup" || pathname === "/onboarding" || Boolean(routeRule))

  if (shouldCheckMembership) {
    const { data: membership, error: membershipError } = await supabase
      .from("restaurant_members")
      .select("restaurant_id, role")
      .eq("user_id", userId as string)
      .eq("status", "active")
      .order("created_at", { ascending: true })
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

    let onboardingComplete = true
    if (membership) {
      const { data: restaurant, error: restaurantError } = await supabase
        .from("restaurants")
        .select("onboarding_completed_at")
        .eq("id", membership.restaurant_id)
        .maybeSingle()

      if (restaurantError && !isOnboardingSchemaUnavailable(restaurantError.code)) {
        return new NextResponse("Authorization service is temporarily unavailable.", { status: 503 })
      }

      onboardingComplete = restaurantError ? true : Boolean(restaurant?.onboarding_completed_at)
    }

    const ownerNeedsOnboarding = membership?.role === "owner" && !onboardingComplete
    const memberWaitsForOwner = Boolean(membership && membership.role !== "owner" && !onboardingComplete)

    if (membership && (pathname === "/login" || pathname === "/signup")) {
      if (ownerNeedsOnboarding) return redirectToPanelPath(request, response, "/onboarding")
      if (memberWaitsForOwner) return redirectToPanelPath(request, response, "/profile")
      return redirectToPanelPath(request, response, getRoleHome(membership.role))
    }

    if (membership && pathname === "/onboarding") {
      if (onboardingComplete) return redirectToPanelPath(request, response, getRoleHome(membership.role))
      if (membership.role !== "owner") return redirectToPanelPath(request, response, "/profile")
    }

    if (membership && routeRule && ownerNeedsOnboarding) {
      return redirectToPanelPath(request, response, "/onboarding")
    }

    if (membership && routeRule && memberWaitsForOwner && routeRule.path !== "/profile") {
      return redirectToPanelPath(request, response, "/profile")
    }

    if (membership && routeRule && !routeRule.roles.includes(membership.role)) {
      return redirectToPanelPath(request, response, getRoleHome(membership.role))
    }

    const needsSubscription = routeRule && routeRule.path !== "/billing" && routeRule.path !== "/profile"
    if (membership && routeRule && needsSubscription) {
      const { data: subscription, error: subscriptionError } = await supabase
        .from("restaurant_subscriptions")
        .select("plan_id, status, trial_ends_at, current_period_end")
        .eq("restaurant_id", membership.restaurant_id)
        .maybeSingle()

      if (subscriptionError) {
        return new NextResponse("Subscription service is temporarily unavailable.", { status: 503 })
      }

      if (!subscription || !isSubscriptionUsable(subscription.status, subscription.trial_ends_at, subscription.current_period_end)) {
        return redirectToPanelPath(request, response, membership.role === "owner" ? "/billing" : "/profile")
      }

      const { data: plan, error: planError } = await supabase
        .from("subscription_plans")
        .select("features")
        .eq("id", subscription.plan_id)
        .eq("is_active", true)
        .maybeSingle()

      if (planError) {
        return new NextResponse("Subscription service is temporarily unavailable.", { status: 503 })
      }

      const features = plan?.features ?? []
      if (!plan || (routeRule.feature && !features.includes(routeRule.feature))) {
        const fallback = membership.role === "owner" ? "/billing" : getAccessibleRoleHome(membership.role, features)
        return redirectToPanelPath(request, response, fallback)
      }
    }
  }

  return response
}
