"use server"

/**
 * This is a Server Action. It is guaranteed to run only on the server.
 * It checks for the presence of the Google Maps API key environment variable.
 * @returns A promise that resolves to a boolean indicating if the key is configured.
 */
export async function getGoogleMapsApiConfigStatus(): Promise<boolean> {
  return !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
}
