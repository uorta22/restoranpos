import { createServerSupabaseClient } from "@/lib/supabase"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  try {
    const { userId, code, newPassword } = await request.json()

    if (!userId || !code || !newPassword) {
      return NextResponse.json({ success: false, message: "Tüm alanlar gereklidir" }, { status: 400 })
    }

    // Şifre uzunluğunu kontrol et
    if (newPassword.length < 6) {
      return NextResponse.json({ success: false, message: "Şifre en az 6 karakter olmalıdır" }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    // Doğrulama kodunu kontrol et
    const { data: otpData, error: otpError } = await supabase
      .from("otp_codes")
      .select("*")
      .eq("user_id", userId)
      .eq("code", code)
      .eq("type", "password_reset")
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

    // Şifreyi hashle
    const passwordHash = await bcrypt.hash(newPassword, 10)

    // Kullanıcının şifresini güncelle
    await supabase.from("users").update({ password_hash: passwordHash }).eq("id", userId)

    // Kodu kullanıldı olarak işaretle
    await supabase.from("otp_codes").update({ is_used: true }).eq("id", otpData.id)

    return NextResponse.json({
      success: true,
      message: "Şifreniz başarıyla sıfırlandı",
    })
  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json(
      { success: false, message: "Şifre sıfırlama sırasında bir hata oluştu", error: String(error) },
      { status: 500 },
    )
  }
}
