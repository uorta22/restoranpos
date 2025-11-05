import { createServerSupabaseClient } from "@/lib/supabase"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { sendVerificationEmail } from "@/lib/email"
import { generateOTP } from "@/lib/utils"

export async function POST(request: Request) {
  try {
    const { email, password, fullName, role, phone } = await request.json()

    // Gerekli alanları kontrol et
    if (!email || !password || !fullName || !role) {
      return NextResponse.json({ success: false, message: "Tüm zorunlu alanları doldurun" }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    // E-posta adresi zaten kullanılıyor mu kontrol et
    const { data: existingUser } = await supabase.from("users").select("id").eq("email", email).single()

    if (existingUser) {
      return NextResponse.json({ success: false, message: "Bu e-posta adresi zaten kullanılıyor" }, { status: 400 })
    }

    // Şifreyi hashle
    const passwordHash = await bcrypt.hash(password, 10)

    // Kullanıcıyı oluştur
    const { data: user, error: userError } = await supabase
      .from("users")
      .insert({
        email,
        password_hash: passwordHash,
        full_name: fullName,
        role,
        phone: phone || null,
      })
      .select()
      .single()

    if (userError) throw userError

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
    await sendVerificationEmail(email, verificationCode, fullName)

    // Ücretsiz abonelik planını bul
    const { data: freePlan } = await supabase.from("subscription_plans").select("id").eq("name", "Ücretsiz").single()

    if (freePlan) {
      // Kullanıcıya ücretsiz abonelik ata
      const currentDate = new Date()
      const endDate = new Date()
      endDate.setFullYear(endDate.getFullYear() + 100) // Ücretsiz plan için uzun bir süre

      await supabase.from("user_subscriptions").insert({
        user_id: user.id,
        plan_id: freePlan.id,
        status: "active",
        billing_cycle: "monthly",
        current_period_start: currentDate.toISOString(),
        current_period_end: endDate.toISOString(),
      })
    }

    return NextResponse.json({
      success: true,
      message: "Kayıt başarılı. Lütfen e-posta adresinizi doğrulayın.",
      userId: user.id,
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { success: false, message: "Kayıt sırasında bir hata oluştu", error: String(error) },
      { status: 500 },
    )
  }
}
