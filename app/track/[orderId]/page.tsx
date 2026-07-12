import { AlertCircle, CheckCircle2, Clock3, Package, Truck } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { RealTimeTrackingMap } from "@/components/real-time-tracking-map"

const statusLabels = {
  pending: "Siparişiniz hazırlanıyor",
  assigned: "Kurye siparişinize atandı",
  en_route: "Siparişiniz yolda",
  delivered: "Siparişiniz teslim edildi",
  cancelled: "Teslimat iptal edildi",
} as const

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export default async function TrackOrderPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId: trackingToken } = await params
  let tracking: Awaited<ReturnType<typeof getTracking>> = null

  if (uuidPattern.test(trackingToken)) tracking = await getTracking(trackingToken)

  if (!tracking) {
    return (
      <main className="grid min-h-screen place-items-center bg-gray-50 px-4">
        <div className="max-w-md text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-red-600" aria-hidden="true" />
          <h1 className="mt-5 text-2xl font-semibold text-gray-950">Takip bağlantısı geçersiz</h1>
          <p className="mt-2 text-sm text-gray-600">Bağlantının süresi dolmuş, kapatılmış veya hatalı yazılmış olabilir.</p>
        </div>
      </main>
    )
  }

  const hasMapCoordinates =
    tracking.courier_lat !== null &&
    tracking.courier_lng !== null &&
    tracking.customer_lat !== null &&
    tracking.customer_lng !== null

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 sm:py-14">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center gap-3">
          {tracking.status === "delivered" ? (
            <CheckCircle2 className="h-8 w-8 text-green-600" aria-hidden="true" />
          ) : tracking.status === "en_route" ? (
            <Truck className="h-8 w-8 text-orange-600" aria-hidden="true" />
          ) : (
            <Package className="h-8 w-8 text-gray-700" aria-hidden="true" />
          )}
          <div>
            <p className="text-sm text-gray-500">Sipariş #{tracking.order_reference}</p>
            <h1 className="text-2xl font-semibold text-gray-950">{statusLabels[tracking.status]}</h1>
          </div>
        </div>

        {tracking.estimated_delivery_at && tracking.status !== "delivered" && (
          <p className="mt-5 flex items-center gap-2 text-sm text-gray-700">
            <Clock3 className="h-4 w-4" aria-hidden="true" />
            Tahmini teslimat: {new Date(tracking.estimated_delivery_at).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
          </p>
        )}

        <div className="mt-8">
          {hasMapCoordinates ? (
            <RealTimeTrackingMap
              courierLocation={{ lat: tracking.courier_lat!, lng: tracking.courier_lng! }}
              customerLocation={{ lat: tracking.customer_lat!, lng: tracking.customer_lng!, address: "Teslimat noktası" }}
              courierInfo={{ name: "Kuryeniz", vehicleType: "Motorsiklet" }}
              orderStatus={tracking.status}
            />
          ) : (
            <div className="border-l-2 border-orange-500 py-2 pl-4 text-sm text-gray-600">
              Canlı harita, kurye yola çıkıp konum paylaşımını açtığında burada görünecek.
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

async function getTracking(token: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("get_delivery_tracking", { token })
  if (error) return null
  return data[0] ?? null
}
