import type { EmailOtpType } from "@supabase/supabase-js"
import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

function safeRedirectPath(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/onboarding"
}

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash")
  const type = request.nextUrl.searchParams.get("type") as EmailOtpType | null
  const next = safeRedirectPath(request.nextUrl.searchParams.get("next"))

  if (tokenHash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    if (!error) return NextResponse.redirect(new URL(next, request.url))
  }

  const loginUrl = new URL("/login", request.url)
  loginUrl.searchParams.set("error", "confirmation_failed")
  return NextResponse.redirect(loginUrl)
}
