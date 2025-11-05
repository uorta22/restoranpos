"use client"

import { useEffect, useRef } from "react"
import { useNotification } from "@/context/notification-context"
import { useOrders } from "@/context/order-context"

export function OrderDelayAlert() {
  const { showNotification, requestPermission, notificationPermission } = useNotification()
  const { orders } = useOrders()

  // Use a ref to track which orders we've already processed
  const processedOrdersRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    // Request notification permission on component mount
    if (notificationPermission !== "granted") {
      requestPermission().catch((error) => {
        console.error("Failed to request notification permission:", error)
      })
    }
  }, [notificationPermission, requestPermission])

  useEffect(() => {
    // Safety check for orders
    if (!orders || !Array.isArray(orders)) {
      return
    }

    try {
      // Check for delayed orders
      const now = new Date()

      orders.forEach((order) => {
        // Skip if we've already processed this order or if it's missing required properties
        if (!order || !order.id || processedOrdersRef.current.has(order.id)) {
          return
        }

        // Safety checks for order properties
        const estimatedDeliveryTime = order.estimatedDeliveryTime ? new Date(order.estimatedDeliveryTime) : null

        const status = order.status || ""

        // Check if the order is delayed
        if (
          estimatedDeliveryTime &&
          (status === "preparing" || status === "out-for-delivery") &&
          now > estimatedDeliveryTime
        ) {
          // Mark this order as processed
          processedOrdersRef.current.add(order.id)

          // Show notification for delayed order
          if (notificationPermission === "granted") {
            showNotification("Order Delayed", {
              body: `Order #${order.id} is delayed. Please check the status.`,
              icon: "/icons/notification-icon.png",
              tag: `order-delay-${order.id}`,
            })
          }
        }
      })
    } catch (error) {
      console.error("Error processing orders for delay alerts:", error)
    }
  }, [orders, showNotification, notificationPermission])

  // This component doesn't render anything visible
  return null
}
