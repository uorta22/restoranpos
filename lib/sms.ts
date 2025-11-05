// SMS gönderimi için basit bir simülasyon
// Gerçek bir SMS servisi entegre edilmediğinde kullanılabilir

// SMS gönder (simülasyon)
export async function sendSMS(to: string, message: string) {
  try {
    // Gerçek SMS gönderimi yerine konsola yazdır
    console.log(`[SMS SIMULATION] To: ${to}, Message: ${message}`)

    // Gerçek bir uygulamada burada SMS API'si çağrılır

    return { success: true, messageId: `sim_${Date.now()}` }
  } catch (error) {
    console.error("SMS sending error:", error)
    return { success: false, error: String(error) }
  }
}

// OTP SMS'i gönder
export async function sendOtpSMS(to: string, code: string) {
  const message = `Restaurant POS doğrulama kodunuz: ${code}. Bu kod 10 dakika boyunca geçerlidir.`
  return sendSMS(to, message)
}

// Telefon numarasını formatla (simülasyon için basit bir işlev)
function formatPhoneNumber(phone: string): string {
  // Başında 0 varsa kaldır ve +90 ekle
  if (phone.startsWith("0")) {
    return "+9" + phone
  }

  // Başında + yoksa +90 ekle
  if (!phone.startsWith("+")) {
    return "+90" + phone
  }

  return phone
}
