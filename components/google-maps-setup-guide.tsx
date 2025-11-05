"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ExternalLink, Key, Settings, CheckCircle, AlertCircle } from "lucide-react"

interface GoogleMapsSetupGuideProps {
  isApiKeyConfigured: boolean
}

export function GoogleMapsSetupGuide({ isApiKeyConfigured }: GoogleMapsSetupGuideProps) {
  const hasApiKey = isApiKeyConfigured

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="w-5 h-5" />
          Google Maps API Kurulumu
          <Badge variant={hasApiKey ? "default" : "destructive"}>{hasApiKey ? "Yapılandırıldı" : "Gerekli"}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {!hasApiKey && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-yellow-800">API Key Gerekli</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Gerçek harita görünümü için Google Maps API key'i yapılandırılmalıdır.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <h3 className="font-medium flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Kurulum Adımları
          </h3>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm font-medium flex items-center justify-center mt-0.5">
                1
              </div>
              <div>
                <p className="font-medium">Google Cloud Console'a Gidin</p>
                <p className="text-sm text-gray-600">
                  Google Cloud Console'da yeni bir proje oluşturun veya mevcut projeyi seçin.
                </p>
                <Button variant="outline" size="sm" className="mt-2" asChild>
                  <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Google Cloud Console
                  </a>
                </Button>
              </div>
            </div>

            <Separator />

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm font-medium flex items-center justify-center mt-0.5">
                2
              </div>
              <div>
                <p className="font-medium">API'leri Etkinleştirin</p>
                <p className="text-sm text-gray-600 mb-2">
                  Aşağıdaki API'leri "APIs & Services" &gt; "Library" bölümünden etkinleştirin:
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Maps JavaScript API</li>
                  <li>• Directions API</li>
                  <li>• Geocoding API (opsiyonel)</li>
                  <li>• Places API (opsiyonel)</li>
                </ul>
              </div>
            </div>

            <Separator />

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm font-medium flex items-center justify-center mt-0.5">
                3
              </div>
              <div>
                <p className="font-medium">API Key Oluşturun</p>
                <p className="text-sm text-gray-600 mb-2">
                  "APIs & Services" &gt; "Credentials" &gt; "Create Credentials" &gt; "API Key"
                </p>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium">Güvenlik İçin:</p>
                  <ul className="text-sm text-gray-600 mt-1 space-y-1">
                    <li>• API key'i kısıtlayın (HTTP referrers)</li>
                    <li>• Sadece gerekli API'leri seçin</li>
                    <li>• Kullanım kotalarını ayarlayın</li>
                  </ul>
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm font-medium flex items-center justify-center mt-0.5">
                4
              </div>
              <div>
                <p className="font-medium">Environment Variables Ekleyin</p>
                <p className="text-sm text-gray-600 mb-2">Projenizin Vercel proje ayarlarına ekleyin:</p>
                <div className="p-3 bg-gray-900 text-gray-100 rounded-lg font-mono text-sm">
                  <div>
                    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
                    <span className="text-yellow-400">[YOUR_API_KEY]</span>
                  </div>
                  <div>
                    GOOGLE_MAPS_API_KEY=
                    <span className="text-yellow-400">[YOUR_API_KEY]</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {hasApiKey && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-green-800">API Key Yapılandırıldı</h3>
                <p className="text-sm text-green-700 mt-1">
                  Google Maps API key'i başarıyla yapılandırıldı. Gerçek harita görünümü kullanılabilir.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-medium text-blue-800 mb-2">💡 İpuçları</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Geliştirme için günlük $200 ücretsiz kredi</li>
            <li>• API key'i GitHub'a commit etmeyin</li>
            <li>• Production'da domain kısıtlaması kullanın</li>
            <li>• Kullanım istatistiklerini takip edin</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
