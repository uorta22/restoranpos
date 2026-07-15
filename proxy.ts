import { NextResponse, type NextRequest } from "next/server"
import {
  fromInternalMarketingPath,
  getAppSurface,
  getLegacyPanelPath,
  getSurfaceUrl,
  isInternalMarketingPath,
  isMarketingOnlyPath,
  isPanelPath,
  toInternalMarketingPath,
} from "@/lib/app-routing"
import { updateSession } from "@/lib/supabase/proxy"

function missingDomainConfiguration() {
  return new NextResponse("Application domains are not configured.", { status: 503 })
}

function getRoutingUrl(request: NextRequest) {
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim()
  const host = forwardedHost || request.headers.get("host")
  if (!host) return new URL(request.nextUrl)

  const forwardedProtocol = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim()
  const protocol = forwardedProtocol === "http" || forwardedProtocol === "https"
    ? forwardedProtocol
    : request.nextUrl.protocol.replace(":", "")

  try {
    return new URL(`${protocol}://${host}${request.nextUrl.pathname}${request.nextUrl.search}`)
  } catch {
    return new URL(request.nextUrl)
  }
}

function redirectToSurface(
  routingUrl: URL,
  surface: "marketing" | "panel",
  pathname: string,
) {
  const target = getSurfaceUrl(surface, routingUrl, pathname)
  return target ? NextResponse.redirect(target, 308) : missingDomainConfiguration()
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const routingUrl = getRoutingUrl(request)
  const surface = getAppSurface(routingUrl)

  if (surface === "marketing") {
    if (isInternalMarketingPath(pathname)) {
      return redirectToSurface(routingUrl, "marketing", fromInternalMarketingPath(pathname))
    }

    if (isPanelPath(pathname)) return redirectToSurface(routingUrl, "panel", pathname)

    const rewriteUrl = request.nextUrl.clone()
    rewriteUrl.pathname = toInternalMarketingPath(pathname)
    return NextResponse.rewrite(rewriteUrl)
  }

  if (isInternalMarketingPath(pathname)) {
    if (process.env.VERCEL_ENV === "preview" && !process.env.NEXT_PUBLIC_MARKETING_URL) {
      return NextResponse.next()
    }
    return redirectToSurface(routingUrl, "marketing", fromInternalMarketingPath(pathname))
  }

  if (isMarketingOnlyPath(pathname)) return redirectToSurface(routingUrl, "marketing", pathname)

  const legacyPath = getLegacyPanelPath(pathname)
  if (legacyPath) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = legacyPath
    return NextResponse.redirect(redirectUrl, 308)
  }

  return updateSession(request)
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
