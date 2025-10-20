import { createServerSupabaseClient } from "@/lib/supabase"
import { NextResponse } from "next/server"
import { sendVerificationEmail } from "@/lib/email"
import { generateOTP } from "@/lib/utils"

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ success: false, message: "Kullanıcı ID gereklidir" }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    // Kullanıcıyı bul
    const { data: user, error: userError } = await supabase.from("users").select("*").eq("id", userId).single()

    if (userError || !user) {
      return NextResponse.json({ success: false, message: "Kullanıcı bulunamadı" }, { status: 404 })
    }

    // Kullanıcı zaten doğrulanmış mı kontrol et
    if (user.email_verified) {
      return NextResponse.json({ success: false, message: "E-posta adresi zaten doğrulanmış" }, { status: 400 })
    }

    // Doğrulama kodu oluştur
    const verificationCode = generateOTP()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24) // 24 saat geçerli

    // Doğrulama kodunu veritabanına kaydet
    const { error: otpError } = await supabase.from("otp_codes").insert({
      user_id: user.id,
      code: verificationCode,
      type: "email",
      expires_at: expiresAt.toISOString(),
    })

    if (otpError) throw otpError

    // Doğrulama e-postası gönder
    await sendVerificationEmail(user.email, verificationCode, user.full_name)

    return NextResponse.json({
      success: true,
      message: "Doğrulama kodu yeniden gönderildi",
    })
  } catch (error) {
    console.error("Resend verification error:", error)
    return NextResponse.json(
      { success: false, message: "Doğrulama kodu gönderilirken bir hata oluştu", error: String(error) },
      { status: 500 },
    )
  }
}
