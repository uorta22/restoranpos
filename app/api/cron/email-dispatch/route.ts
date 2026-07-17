import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/database.types"

// email_outbox kuyruğunu boşaltan dispatcher. Vercel Cron ile tetiklenir (vercel.json).
// Gerekli env'ler yoksa hiçbir şey göndermeden 503 döner — kuyruk veri kaybetmez.

const BATCH_SIZE = 20
const RESEND_ENDPOINT = "https://api.resend.com/emails"

interface EmailTemplate {
  subject: (payload: Record<string, unknown>) => string
  html: (payload: Record<string, unknown>) => string
}

const templates: Record<string, EmailTemplate> = {
  order_confirmation: {
    subject: (payload) => `Siparişiniz alındı — ${String(payload.restaurant_name ?? "Restoran")}`,
    html: (payload) => `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto">
        <h2 style="color:#0a0a0a">Siparişiniz alındı</h2>
        <p><strong>${String(payload.restaurant_name ?? "Restoran")}</strong> siparişinizi hazırlamaya başladı.</p>
        <p>Sipariş tutarı: <strong>${Number(payload.total_amount ?? 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</strong></p>
        ${payload.tracking_token ? `<p>Teslimatınızı takip edin: <a href="${process.env.NEXT_PUBLIC_PANEL_URL ?? ""}/track/${String(payload.tracking_token)}">Sipariş takibi</a></p>` : ""}
        <p style="color:#6b7280;font-size:12px">Bu e-posta RestaurantPOS altyapısıyla gönderilmiştir.</p>
      </div>`,
  },
}

const fallbackTemplate: EmailTemplate = {
  subject: () => "RestaurantPOS bildirimi",
  html: (payload) => `<pre style="font-family:monospace">${JSON.stringify(payload, null, 2)}</pre>`,
}

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get("authorization")
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SECRET_KEY
  const resendKey = process.env.RESEND_API_KEY
  const fromAddress = process.env.EMAIL_FROM

  if (!supabaseUrl || !serviceKey || !resendKey || !fromAddress) {
    return NextResponse.json(
      { error: "Email dispatcher is not configured", missing: { serviceKey: !serviceKey, resendKey: !resendKey, fromAddress: !fromAddress } },
      { status: 503 },
    )
  }

  const supabase = createClient<Database>(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  })

  const { data: queued, error: queueError } = await supabase
    .from("email_outbox")
    .select("*")
    .eq("status", "queued")
    .order("created_at", { ascending: true })
    .limit(BATCH_SIZE)

  if (queueError) {
    return NextResponse.json({ error: queueError.message }, { status: 500 })
  }

  let sent = 0
  let failed = 0

  for (const email of queued ?? []) {
    const template = templates[email.template] ?? fallbackTemplate
    const payload = (email.payload ?? {}) as Record<string, unknown>

    try {
      const response = await fetch(RESEND_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromAddress,
          to: email.recipient,
          subject: template.subject(payload),
          html: template.html(payload),
        }),
      })

      if (!response.ok) {
        const body = await response.text()
        throw new Error(`Resend ${response.status}: ${body.slice(0, 300)}`)
      }

      await supabase
        .from("email_outbox")
        .update({ status: "sent", sent_at: new Date().toISOString(), error_message: null })
        .eq("id", email.id)
      sent += 1
    } catch (error) {
      await supabase
        .from("email_outbox")
        .update({ status: "failed", error_message: error instanceof Error ? error.message : "Unknown error" })
        .eq("id", email.id)
      failed += 1
    }
  }

  return NextResponse.json({ ok: true, processed: (queued ?? []).length, sent, failed })
}
