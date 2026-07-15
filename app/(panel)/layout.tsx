import type React from "react"
import { Toaster } from "sonner"
import { AuthProvider } from "@/context/auth-context"
import { CartProvider } from "@/context/cart-context"
import { CourierProvider } from "@/context/courier-context"
import { LicenseProvider } from "@/context/license-context"
import { NotificationProvider } from "@/context/notification-context"
import { OrderProvider } from "@/context/order-context"
import { TableProvider } from "@/context/table-context"

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <LicenseProvider>
        <NotificationProvider>
          <TableProvider>
            <OrderProvider>
              <CourierProvider>
                <CartProvider>{children}</CartProvider>
              </CourierProvider>
            </OrderProvider>
          </TableProvider>
        </NotificationProvider>
      </LicenseProvider>
      <Toaster richColors closeButton position="top-right" />
    </AuthProvider>
  )
}
