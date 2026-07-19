import type { EmailOtpType } from "@supabase/supabase-js"
import { NextResponse, type NextRequest } from "next/server"
import { getPanelOrigin, safeInternalPath } from "@/lib/auth-navigation"
import { createClient } from "@/lib/supabase/server"

// E-posta doğrulama iki farklı akışta gelebilir:
// - token_hash + type: OTP akışı (tarayıcıdan bağımsız çalışır, tercih edilen)
// - code: PKCE akışı (Supabase'in varsayılan {{ .ConfirmationURL }} şablonu)
// Route her ikisini de kabul eder; başarılı doğrulama sonrası `next` hedefine yönlendirir.
export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash")
  const type = request.nextUrl.searchParams.get("type") as EmailOtpType | null
  const code = request.nextUrl.searchParams.get("code")
  const next = safeInternalPath(request.nextUrl.searchParams.get("next"), "/onboarding")
  const panelOrigin = getPanelOrigin(request.nextUrl.origin)

  const supabase = await createClient()

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(new URL(next, panelOrigin))
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    if (!error) return NextResponse.redirect(new URL(next, panelOrigin))
  }

  const loginUrl = new URL("/login", panelOrigin)
  loginUrl.searchParams.set("error", "confirmation_failed")
  return NextResponse.redirect(loginUrl)
}
