"use client"

import dynamic from "next/dynamic"

// Dynamically import OrderDelayAlert with no SSR to avoid hydration issues
const OrderDelayAlert = dynamic(() => import("@/components/order-delay-alert").then((mod) => mod.OrderDelayAlert), {
  ssr: false,
})

// Dynamically import ServiceWorkerRegistrar with no SSR
const ServiceWorkerRegistrar = dynamic(
  () => import("@/components/service-worker-registrar").then((mod) => mod.ServiceWorkerRegistrar),
  {
    ssr: false,
  },
)

export function ClientComponents() {
  return (
    <>
      <OrderDelayAlert />
      <ServiceWorkerRegistrar />
    </>
  )
}
