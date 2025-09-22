import { createServerSupabaseClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { userId, code } = await request.json()

    if (!userId || !code) {
      return NextResponse.json(
        { success: false, message: "Kullanıcı ID ve doğrulama kodu gereklidir" },
        { status: 400 },
      )
    }

    const supabase = createServerSupabaseClient()

    // Doğrulama kodunu kontrol et
    const { data: otpData, error: otpError } = await supabase
      .from("otp_codes")
      .select("*")
      .eq("user_id", userId)
      .eq("code", code)
      .eq("type", "email")
      .eq("is_used", false)
      .single()

    if (otpError || !otpData) {
      return NextResponse.json({ success: false, message: "Geçersiz veya kullanılmış doğrulama kodu" }, { status: 400 })
    }

    // Kodun süresi dolmuş mu kontrol et
    const expiresAt = new Date(otpData.expires_at)
    if (expiresAt < new Date()) {
      return NextResponse.json({ success: false, message: "Doğrulama kodunun süresi dolmuş" }, { status: 400 })
    }

    // Kodu kullanıldı olarak işaretle
    await supabase.from("otp_codes").update({ is_used: true }).eq("id", otpData.id)

    // Kullanıcıyı doğrulanmış olarak işaretle
    await supabase.from("users").update({ email_verified: true }).eq("id", userId)

    return NextResponse.json({
      success: true,
      message: "E-posta adresi başarıyla doğrulandı",
    })
  } catch (error) {
    console.error("Email verification error:", error)
    return NextResponse.json(
      { success: false, message: "E-posta doğrulama sırasında bir hata oluştu", error: String(error) },
      { status: 500 },
    )
  }
}
