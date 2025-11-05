import { NextResponse } from "next/server"

export async function GET() {
  // This runs on the server, so it's safe to access environment variables here
  // We're not returning the actual token, just a placeholder for this demo
  return NextResponse.json({
    success: true,
    message: "In a real application, this would return a token with limited scope and expiration",
  })
}
