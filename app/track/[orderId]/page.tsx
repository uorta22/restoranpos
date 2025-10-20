import { RealTimeTrackingMap } from "@/components/real-time-tracking-map"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Home } from "lucide-react"
import Link from "next/link"

interface Order {
  id: string
  status: string
}

interface CourierInfo {
  name: string
  phone: string
  photoUrl: string
}

const mockCourierLocation = {
  lat: 41.0082,
  lng: 28.9784,
}

const mockCustomerLocation = {
  lat: 41.0111,
  lng: 28.9756,
  address: "Beyoğlu, İstiklal Caddesi No:123"
}

const mockCourierInfo: CourierInfo = {
  name: "Mehmet Yılmaz",
  phone: "+90 555 123 45 67",
  photoUrl: "https://example.com/mehmet-yilmaz.jpg",
}

const mockOrder: Order = {
  id: "123",
  status: "on_the_way",
}

interface Params {
  orderId: string
}

interface PageProps {
  params: Params
  searchParams: { [key: string]: string | string[] | undefined }
}

const TrackOrderPage = async ({ params }: PageProps) => {
  const { orderId } = await params

  // Mock order data (replace with actual data fetching)
  const order = mockOrder

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* Header with Navigation */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Geri
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" size="sm">
                <Home className="w-4 h-4 mr-2" />
                Ana Sayfa
              </Button>
            </Link>
          </div>
          <div>
            <h1 className="text-xl font-bold">Sipariş Takibi</h1>
          </div>
        </div>
        <div className="mt-2">
          <p className="text-gray-600">Sipariş No: <span className="font-mono font-medium">#{orderId}</span></p>
        </div>
      </div>

      {/* Tracking Content */}
      {order && (
        <RealTimeTrackingMap
          orderId={orderId}
          courierLocation={mockCourierLocation}
          customerLocation={mockCustomerLocation}
          courierInfo={mockCourierInfo}
          orderStatus={order.status}
        />
      )}
    </div>
  )
}

export default TrackOrderPage
