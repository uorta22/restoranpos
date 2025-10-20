"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X, RefreshCw, Database, User } from "lucide-react"
import { isDemoMode, clearDemoData, DEMO_STORAGE_KEYS } from "@/lib/demo-mode"

export function DemoBanner() {
  const [isVisible, setIsVisible] = useState(false)
  const [isDemo, setIsDemo] = useState(false)

  useEffect(() => {
    const demoMode = isDemoMode()
    setIsDemo(demoMode)
    setIsVisible(demoMode)
  }, [])

  if (!isVisible || !isDemo) {
    return null
  }

  const handleResetData = () => {
    clearDemoData()
    window.location.reload()
  }

  const handleClose = () => {
    setIsVisible(false)
  }

  return (
    <Card className="fixed top-4 right-4 z-50 w-80 bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            <Badge variant="secondary" className="bg-white/20 text-white border-0">
              DEMO MODU
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-white hover:bg-white/20"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2 text-sm">
          <p className="font-medium">
            🎭 Bu bir demo versiyonudur
          </p>
          <p className="text-white/90">
            Tüm veriler tarayıcınızda saklanıyor ve gerçek değil.
          </p>

          <div className="bg-white/10 rounded p-2 mt-3">
            <p className="text-xs font-medium mb-1">Demo Giriş Bilgileri:</p>
            <ul className="text-xs space-y-1 text-white/90">
              <li>• <User className="inline h-3 w-3 mr-1" />admin@demo.com / demo123</li>
              <li>• demo@demo.com / demo</li>
              <li>• test@test.com / test</li>
              <li>• <em>Herhangi bir e-posta/şifre</em></li>
            </ul>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
            onClick={handleResetData}
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Sıfırla
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}