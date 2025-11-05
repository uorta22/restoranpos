"use client"

import { useOrderContext } from "@/context/order-context"

export function OrderTest() {
  const { orders } = useOrderContext()

  return (
    <div>
      <h2>Order Test</h2>
      <p>Number of orders: {orders.length}</p>
    </div>
  )
}
