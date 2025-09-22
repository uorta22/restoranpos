import { type NextRequest, NextResponse } from "next/server"

// Google Maps API çağrılarını proxy'lemek için
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const service = searchParams.get("service") // 'geocoding', 'directions', etc.

  if (!process.env.GOOGLE_MAPS_API_KEY) {
    return NextResponse.json({ error: "Google Maps API key not configured" }, { status: 500 })
  }

  try {
    let apiUrl = ""

    switch (service) {
      case "geocoding":
        const address = searchParams.get("address")
        apiUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address || "")}&key=${process.env.GOOGLE_MAPS_API_KEY}`
        break

      case "directions":
        const origin = searchParams.get("origin")
        const destination = searchParams.get("destination")
        apiUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&key=${process.env.GOOGLE_MAPS_API_KEY}`
        break

      default:
        return NextResponse.json({ error: "Invalid service" }, { status: 400 })
    }

    const response = await fetch(apiUrl)
    const data = await response.json()

    return NextResponse.json(data)
  } catch (error) {
    console.error("Google Maps API error:", error)
    return NextResponse.json({ error: "Failed to fetch from Google Maps API" }, { status: 500 })
  }
}
