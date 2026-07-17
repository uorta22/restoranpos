"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AlertTriangle, Copy, Pause, Play, Plug, RefreshCw } from "lucide-react"
import { Header } from "@/components/header"
import { SidebarNav } from "@/components/sidebar-nav"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/context/auth-context"
import { PROVIDERS, type IntegrationProviderInfo } from "@/lib/integrations"
import { getClientSupabaseInstance } from "@/lib/supabase"
import type { Tables } from "@/lib/database.types"
import { formatDateTime } from "@/lib/utils"

type ChannelIntegration = Tables<"channel_integrations">
type WebhookEvent = Tables<"webhook_events">

const integrationStatusBadges: Record<ChannelIntegration["status"], { label: string; className: string }> = {
  pending: { label: "Beklemede", className: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  active: { label: "Aktif", className: "bg-green-50 text-green-700 border-green-200" },
  paused: { label: "Duraklatıldı", className: "bg-gray-50 text-gray-600 border-gray-200" },
  error: { label: "Hata", className: "bg-red-50 text-red-700 border-red-200" },
}

const eventStatusBadges: Record<WebhookEvent["status"], { label: string; className: string }> = {
  received: { label: "Alındı", className: "bg-blue-50 text-blue-700 border-blue-200" },
  processed: { label: "İşlendi", className: "bg-green-50 text-green-700 border-green-200" },
  duplicate: { label: "Mükerrer", className: "bg-gray-50 text-gray-600 border-gray-200" },
  failed: { label: "Başarısız", className: "bg-red-50 text-red-700 border-red-200" },
}

const providerNames = new Map(PROVIDERS.map((provider) => [provider.id as string, provider.name]))

function CredentialRow({ label, value }: { label: string; value: string }) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      toast.success(`${label} kopyalandı`)
    } catch {
      toast.error("Panoya kopyalanamadı")
    }
  }

  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <p className="truncate font-mono text-xs text-gray-900">{value}</p>
      </div>
      <Button size="sm" variant="ghost" onClick={handleCopy} aria-label={`${label} kopyala`}>
        <Copy className="h-4 w-4" />
      </Button>
    </div>
  )
}

export default function IntegrationsPage() {
  const { user, isLoading: isAuthLoading } = useAuth()
  const router = useRouter()
  const [showSidebar, setShowSidebar] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [origin, setOrigin] = useState("")
  const [integrations, setIntegrations] = useState<ChannelIntegration[]>([])
  const [events, setEvents] = useState<WebhookEvent[]>([])
  const canManage = user?.memberRole === "owner" || user?.memberRole === "manager"

  useEffect(() => {
    const handleResize = () => setShowSidebar(window.innerWidth >= 768)
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  const loadData = useCallback(async () => {
    if (!user?.restaurant_id) return
    const supabase = getClientSupabaseInstance()
    const [integrationsResult, eventsResult] = await Promise.all([
      supabase
        .from("channel_integrations")
        .select("*")
        .eq("restaurant_id", user.restaurant_id)
        .order("created_at", { ascending: true }),
      supabase
        .from("webhook_events")
        .select("*")
        .eq("restaurant_id", user.restaurant_id)
        .order("created_at", { ascending: false })
        .limit(10),
    ])

    if (integrationsResult.error) {
      toast.error("Entegrasyonlar yüklenemedi", { description: integrationsResult.error.message })
    } else {
      setIntegrations(integrationsResult.data)
    }
    if (eventsResult.error) {
      toast.error("Webhook olayları yüklenemedi", { description: eventsResult.error.message })
    } else {
      setEvents(eventsResult.data)
    }
    setIsLoading(false)
  }, [user?.restaurant_id])

  useEffect(() => {
    if (isAuthLoading || !user?.restaurant_id || !canManage) return
    void loadData()
  }, [canManage, isAuthLoading, loadData, user?.restaurant_id])

  const handleCreate = async (provider: IntegrationProviderInfo) => {
    if (!user?.restaurant_id) return
    const supabase = getClientSupabaseInstance()
    const { error } = await supabase
      .from("channel_integrations")
      .insert({ restaurant_id: user.restaurant_id, provider: provider.id })

    if (error) {
      toast.error("Bağlantı oluşturulamadı", { description: error.message })
      return
    }
    toast.success(`${provider.name} bağlantısı oluşturuldu`)
    await loadData()
  }

  const handleToggleStatus = async (integration: ChannelIntegration) => {
    const nextStatus = integration.status === "active" ? "paused" : "active"
    const supabase = getClientSupabaseInstance()
    const { error } = await supabase
      .from("channel_integrations")
      .update({ status: nextStatus })
      .eq("id", integration.id)

    if (error) {
      toast.error("Durum güncellenemedi", { description: error.message })
      return
    }
    toast.success(nextStatus === "active" ? "Entegrasyon aktifleştirildi" : "Entegrasyon duraklatıldı")
    await loadData()
  }

  const handleRotateSecret = async (integration: ChannelIntegration) => {
    const supabase = getClientSupabaseInstance()
    const { error } = await supabase
      .from("channel_integrations")
      .update({ webhook_secret: crypto.randomUUID() })
      .eq("id", integration.id)

    if (error) {
      toast.error("Secret yenilenemedi", { description: error.message })
      return
    }
    toast.success("Webhook secret yenilendi", { description: "Eski secret artık geçersiz." })
    await loadData()
  }

  if (isAuthLoading || (canManage && isLoading)) {
    return (
      <div className="grid h-screen place-items-center bg-gray-50">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-orange-600" />
      </div>
    )
  }

  if (!user) {
    router.push("/login")
    return null
  }

  if (!canManage) return null

  return (
    <div className="flex h-screen bg-gray-50">
      {showSidebar && <SidebarNav />}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header showMobileMenu={!showSidebar} onMenuToggle={() => setShowSidebar((current) => !current)} />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="mx-auto max-w-5xl">
            <div className="flex items-center gap-2">
              <Plug className="h-6 w-6 text-orange-600" aria-hidden="true" />
              <h1 className="text-2xl font-semibold text-gray-950">Entegrasyonlar</h1>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Yemek platformlarından gelen siparişleri webhook ile panelinize aktarın.
            </p>

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              {PROVIDERS.map((provider) => {
                const integration = integrations.find((item) => item.provider === provider.id)
                const statusBadge = integration ? integrationStatusBadges[integration.status] : null

                return (
                  <Card key={provider.id} className="flex flex-col">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-lg">{provider.name}</CardTitle>
                        {statusBadge ? (
                          <Badge variant="outline" className={statusBadge.className}>
                            {statusBadge.label}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200">
                            Bağlı değil
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{provider.description}</p>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-2 pb-3">
                      {integration ? (
                        <>
                          {integration.error_message && (
                            <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                              <span>{integration.error_message}</span>
                            </div>
                          )}
                          <CredentialRow label="Webhook URL" value={`${origin}/api/integrations/${provider.id}`} />
                          <CredentialRow label="Integration ID" value={integration.id} />
                          <CredentialRow label="Webhook Secret" value={integration.webhook_secret} />
                          <p className="text-xs text-gray-500">
                            İstekler <span className="font-mono">x-integration-id</span> ve{" "}
                            <span className="font-mono">x-webhook-secret</span> başlıklarıyla doğrulanır.
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-gray-500">
                          Webhook bilgilerini almak için önce bağlantı oluşturun.
                        </p>
                      )}
                    </CardContent>
                    <CardFooter className="flex flex-wrap gap-2">
                      {integration ? (
                        <>
                          <Button size="sm" variant="outline" onClick={() => handleToggleStatus(integration)}>
                            {integration.status === "active" ? (
                              <>
                                <Pause className="mr-1 h-4 w-4" /> Duraklat
                              </>
                            ) : (
                              <>
                                <Play className="mr-1 h-4 w-4" /> Aktifleştir
                              </>
                            )}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleRotateSecret(integration)}>
                            <RefreshCw className="mr-1 h-4 w-4" /> Secret yenile
                          </Button>
                        </>
                      ) : (
                        <Button size="sm" onClick={() => handleCreate(provider)}>
                          <Plug className="mr-1 h-4 w-4" /> Bağlantı oluştur
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                )
              })}
            </div>

            <Card className="mt-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Son webhook olayları</CardTitle>
              </CardHeader>
              <CardContent>
                {events.length === 0 ? (
                  <p className="text-sm text-gray-500">Henüz webhook olayı alınmadı.</p>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {events.map((event) => {
                      const badge = eventStatusBadges[event.status]
                      return (
                        <li key={event.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-sm">
                          <span className="font-medium text-gray-900">
                            {providerNames.get(event.provider) ?? event.provider}
                          </span>
                          <span className="font-mono text-xs text-gray-500">{event.external_id ?? "—"}</span>
                          <Badge variant="outline" className={badge.className}>
                            {badge.label}
                          </Badge>
                          {event.error_message && <span className="text-xs text-red-600">{event.error_message}</span>}
                          <span className="ml-auto text-xs text-gray-500">{formatDateTime(event.created_at)}</span>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
