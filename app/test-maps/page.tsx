"use client"

import { GoogleMapsTest } from "@/components/google-maps-test"
import { Header } from "@/components/header"
import { SidebarNav } from "@/components/sidebar-nav"
import { useState } from "react"

export default function TestMapsPage() {
  const [showSidebar, setShowSidebar] = useState(true)

  return (
    <div className="flex h-screen bg-gray-100">
      {showSidebar && <SidebarNav />}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header showMobileMenu={!showSidebar} onMenuToggle={() => setShowSidebar(!showSidebar)} />
        <div className="flex-1 overflow-auto p-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Google Maps API Test</h1>
            <GoogleMapsTest />
          </div>
        </div>
      </div>
    </div>
  )
}
