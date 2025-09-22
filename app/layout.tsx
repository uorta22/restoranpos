import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/context/auth-context"
import { LicenseProvider } from "@/context/license-context"
import { CartProvider } from "@/context/cart-context"
import { NotificationProvider } from "@/context/notification-context"
import { OrderProvider } from "@/context/order-context"
import { TableProvider } from "@/context/table-context"
import { CourierProvider } from "@/context/courier-context"
import { ServiceWorkerRegistrar } from "@/components/service-worker-registrar"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
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
        </ThemeProvider>
        <ServiceWorkerRegistrar />
      </body>
    </html>
  )
}

export const metadata = {
      generator: 'v0.app'
    };
