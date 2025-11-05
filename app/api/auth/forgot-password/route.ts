import { createServerSupabaseClient } from "@/lib/supabase"
import { NextResponse } from "next/server"
import { sendPasswordResetEmail } from "@/lib/email"
import { generateOTP } from "@/lib/utils"

export async function POST(request: Request) {
  try {
    // Environment variable kontrolü
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.SUPABASE_URL) {
      return NextResponse.json({ success: false, message: "Veritabanı yapılandırması eksik" }, { status: 500 })
    }

    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ success: false, message: "E-posta adresi gereklidir" }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    // Kullanıcıyı e-posta adresine göre bul
    const { data: user, error: userError } = await supabase.from("users").select("*").eq("email", email).single()

    if (userError || !user) {
      // Güvenlik nedeniyle kullanıcı bulunamasa bile başarılı mesajı döndür
      return NextResponse.json({
        success: true,
        message: "Şifre sıfırlama talimatları e-posta adresinize gönderildi",
      })
    }

    // Doğrulama kodu oluştur
    const resetCode = generateOTP()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 1) // 1 saat geçerli

    // Doğrulama kodunu veritabanına kaydet
    const { error: otpError } = await supabase.from("otp_codes").insert({
      user_id: user.id,
      code: resetCode,
      type: "password_reset",
      expires_at: expiresAt.toISOString(),
    })

    if (otpError) throw otpError

    // Şifre sıfırlama e-postası gönder
    await sendPasswordResetEmail(user.email, resetCode, user.full_name)

    return NextResponse.json({
      success: true,
      message: "Şifre sıfırlama talimatları e-posta adresinize gönderildi",
      userId: user.id,
    })
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json(
      { success: false, message: "Şifre sıfırlama işlemi sırasında bir hata oluştu", error: String(error) },
      { status: 500 },
    )
  }
}
