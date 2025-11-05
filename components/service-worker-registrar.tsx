"use client"

import { useEffect, useState } from "react"

export function ServiceWorkerRegistrar() {
  const [registrationStatus, setRegistrationStatus] = useState<"idle" | "registering" | "registered" | "failed">("idle")

  useEffect(() => {
    // Only register service worker in production and if the API is available
    if (process.env.NODE_ENV !== "production" || typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return
    }

    const registerServiceWorker = async () => {
      try {
        setRegistrationStatus("registering")

        // Register the service worker with error handling
        const registration = await navigator.serviceWorker
          .register("/sw.js", {
            scope: "/",
          })
          .catch((error) => {
            console.error("Service worker registration failed:", error)
            throw error
          })

        console.log("Service worker registered successfully:", registration)
        setRegistrationStatus("registered")
      } catch (error) {
        console.error("Error during service worker registration:", error)
        setRegistrationStatus("failed")
      }
    }

    registerServiceWorker()
  }, [])

  // This component doesn't render anything visible
  return null
}
