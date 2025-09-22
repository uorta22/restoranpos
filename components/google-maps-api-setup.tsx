"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, ExternalLink, CheckCircle, Settings } from "lucide-react"

export function GoogleMapsAPISetup() {
  const requiredAPIs = [
    {
      name: "Maps JavaScript API",
      description: "Harita görüntüleme için gerekli",
      required: true,
    },
    {
      name: "Directions API",
      description: "Rota hesaplama için gerekli",
      required: true,
    },
    {
      name: "Geocoding API",
      description: "Adres çözümleme için gerekli",
      required: true,
    },
    {
      name: "Places API",
      description: "Adres önerileri için gerekli",
      required: false,
    },
  ]

  return (
    <div className="space-y-4">
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <CardTitle className="text-yellow-800">Google Maps API Kurulum Gerekli</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-yellow-700">
              Google Maps özelliklerini kullanabilmek için aşağıdaki API'lerin etkinleştirilmesi gerekiyor:
            </p>

            <div className="space-y-2">
              {requiredAPIs.map((api, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                  <div>
                    <span className="font-medium">{api.name}</span>
                    <p className="text-sm text-gray-600">{api.description}</p>
                  </div>
                  <Badge variant={api.required ? "destructive" : "secondary"}>
                    {api.required ? "Gerekli" : "Opsiyonel"}
                  </Badge>
                </div>
              ))}
            </div>

            <div className="bg-white p-4 rounded border">
              <h4 className="font-medium mb-2">Kurulum Adımları:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Google Cloud Console'a gidin</li>
                <li>Projenizi seçin veya yeni proje oluşturun</li>
                <li>API'ler ve Servisler → Kütüphane'ye gidin</li>
                <li>Yukarıdaki API'leri arayın ve etkinleştirin</li>
                <li>API'ler ve Servisler → Kimlik Bilgileri'ne gidin</li>
                <li>API anahtarınızı kopyalayın</li>
                <li>Faturalandırma hesabı ekleyin (gerekli)</li>
              </ol>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => window.open("https://console.cloud.google.com/apis/library", "_blank")}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                API Kütüphanesi
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open("https://console.cloud.google.com/apis/credentials", "_blank")}
              >
                <Settings className="w-4 h-4 mr-2" />
                Kimlik Bilgileri
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open("https://console.cloud.google.com/billing", "_blank")}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Faturalandırma
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Geçici Çözüm</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Google Maps API'leri kurulana kadar mock harita sistemi kullanılacak. Bu sistem:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
            <li>Kurye konumlarını simüle eder</li>
            <li>Mesafe ve süre hesaplamaları yapar</li>
            <li>Görsel harita gösterir</li>
            <li>Tüm takip özelliklerini sağlar</li>
          </ul>
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-green-800 text-sm">Mock sistem aktif ve çalışıyor</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
