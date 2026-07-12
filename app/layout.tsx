import type React from "react"
import type { Metadata } from "next"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { Toaster } from "sonner"
import { AuthProvider } from "@/context/auth-context"
import { LicenseProvider } from "@/context/license-context"
import { CartProvider } from "@/context/cart-context"
import { NotificationProvider } from "@/context/notification-context"
import { OrderProvider } from "@/context/order-context"
import { TableProvider } from "@/context/table-context"
import { CourierProvider } from "@/context/courier-context"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className={inter.className}>
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
        </AuthProvider>
        <Toaster richColors closeButton position="top-right" />
      </body>
    </html>
  )
}

export const metadata: Metadata = {
  title: "RestaurantPOS",
  description: "Restoran sipariş ve operasyon yönetimi",
}
