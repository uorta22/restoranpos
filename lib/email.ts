import nodemailer from "nodemailer"

// E-posta gönderimi için transporter oluştur
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER,
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: Number(process.env.EMAIL_PORT) === 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
})

// Doğrulama e-postası gönder
export async function sendVerificationEmail(to: string, code: string, name: string) {
  const appName = "Restaurant POS"
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  const mailOptions = {
    from: `"${appName}" <${process.env.EMAIL_FROM}>`,
    to,
    subject: `${appName} - E-posta Adresinizi Doğrulayın`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f97316;">Merhaba ${name},</h2>
        <p>E-posta adresinizi doğrulamak için aşağıdaki kodu kullanın:</p>
        <div style="background-color: #f3f4f6; padding: 12px; border-radius: 4px; text-align: center; margin: 20px 0;">
          <span style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${code}</span>
        </div>
        <p>Bu kod 24 saat boyunca geçerlidir.</p>
        <p>Eğer bu işlemi siz yapmadıysanız, lütfen bu e-postayı dikkate almayın.</p>
        <p>Teşekkürler,<br>${appName} Ekibi</p>
        <hr style="border: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="font-size: 12px; color: #6b7280; text-align: center;">
          Bu e-posta ${appUrl} adresindeki hesabınız için gönderilmiştir.
        </p>
      </div>
    `,
  }

  return transporter.sendMail(mailOptions)
}

// Şifre sıfırlama e-postası gönder
export async function sendPasswordResetEmail(to: string, code: string, name: string) {
  const appName = "Restaurant POS"
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  const mailOptions = {
    from: `"${appName}" <${process.env.EMAIL_FROM}>`,
    to,
    subject: `${appName} - Şifre Sıfırlama`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f97316;">Merhaba ${name},</h2>
        <p>Şifrenizi sıfırlamak için aşağıdaki kodu kullanın:</p>
        <div style="background-color: #f3f4f6; padding: 12px; border-radius: 4px; text-align: center; margin: 20px 0;">
          <span style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${code}</span>
        </div>
        <p>Bu kod 1 saat boyunca geçerlidir.</p>
        <p>Eğer bu işlemi siz yapmadıysanız, lütfen bu e-postayı dikkate almayın.</p>
        <p>Teşekkürler,<br>${appName} Ekibi</p>
        <hr style="border: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="font-size: 12px; color: #6b7280; text-align: center;">
          Bu e-posta ${appUrl} adresindeki hesabınız için gönderilmiştir.
        </p>
      </div>
    `,
  }

  return transporter.sendMail(mailOptions)
}

// Abonelik yenileme hatırlatma e-postası
export async function sendSubscriptionRenewalEmail(to: string, name: string, planName: string, expiryDate: string) {
  const appName = "Restaurant POS"
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  const mailOptions = {
    from: `"${appName}" <${process.env.EMAIL_FROM}>`,
    to,
    subject: `${appName} - Abonelik Yenileme Hatırlatması`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f97316;">Merhaba ${name},</h2>
        <p>${planName} aboneliğiniz ${expiryDate} tarihinde sona erecek.</p>
        <p>Hizmetlerimizden kesintisiz yararlanmaya devam etmek için aboneliğinizi yenilemenizi öneririz.</p>
        <div style="margin: 20px 0;">
          <a href="${appUrl}/subscription" style="background-color: #f97316; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Aboneliğimi Yenile
          </a>
        </div>
        <p>Teşekkürler,<br>${appName} Ekibi</p>
        <hr style="border: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="font-size: 12px; color: #6b7280; text-align: center;">
          Bu e-posta ${appUrl} adresindeki hesabınız için gönderilmiştir.
        </p>
      </div>
    `,
  }

  return transporter.sendMail(mailOptions)
}
