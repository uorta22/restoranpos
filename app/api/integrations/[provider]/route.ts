import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"
import type { Database, Json } from "@/lib/database.types"
import { extractExternalOrderId, isIntegrationProvider, normalizeWebhookPayload } from "@/lib/integrations"

// 3. parti platform webhook alıcısı. Kimlik doğrulama ve idempotency
// ingest_external_order RPC'si içinde yapılır; burada stateless client yeterli.

export async function POST(request: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params
  if (!isIntegrationProvider(provider)) {
    return NextResponse.json({ error: "Bilinmeyen sağlayıcı" }, { status: 404 })
  }

  const searchParams = request.nextUrl.searchParams
  const integrationId = request.headers.get("x-integration-id") ?? searchParams.get("integration_id")
  const webhookSecret = request.headers.get("x-webhook-secret") ?? searchParams.get("secret")
  if (!integrationId || !webhookSecret) {
    return NextResponse.json({ error: "Entegrasyon kimlik bilgileri eksik" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON gövdesi" }, { status: 400 })
  }

  const externalOrderId = extractExternalOrderId(provider, body)
  if (!externalOrderId) {
    return NextResponse.json({ error: "Dış sipariş kimliği (orderId) bulunamadı" }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!supabaseUrl || !publishableKey) {
    return NextResponse.json({ error: "Supabase yapılandırması eksik" }, { status: 503 })
  }

  const supabase = createClient<Database>(supabaseUrl, publishableKey, {
    auth: { persistSession: false },
  })

  const { data, error } = await supabase.rpc("ingest_external_order", {
    integration_id: integrationId,
    webhook_secret: webhookSecret,
    external_order_id: externalOrderId,
    payload: normalizeWebhookPayload(provider, body) as unknown as Json,
    event_type: "order.created",
  })

  if (error) {
    return NextResponse.json({ error: "Geçersiz entegrasyon kimliği veya secret" }, { status: 401 })
  }

  const result = (data ?? {}) as { ok?: boolean }
  if (result.ok === false) {
    return NextResponse.json(result, { status: 422 })
  }

  return NextResponse.json(result, { status: 200 })
}
