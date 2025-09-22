import { RealTimeTrackingMap } from "@/components/real-time-tracking-map"

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
  lat: 37.7749,
  lng: -122.4194,
}

const mockCustomerLocation = {
  lat: 37.7833,
  lng: -122.4067,
}

const mockCourierInfo: CourierInfo = {
  name: "John Doe",
  phone: "123-456-7890",
  photoUrl: "https://example.com/john-doe.jpg",
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
  const { orderId } = params

  // Mock order data (replace with actual data fetching)
  const order = mockOrder

  return (
    <div>
      <h1>Track Your Order</h1>
      <p>Order ID: {orderId}</p>

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
