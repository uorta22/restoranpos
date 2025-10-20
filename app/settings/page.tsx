"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GoogleMapsSetupGuide } from "@/components/google-maps-setup-guide"
import { getGoogleMapsApiConfigStatus } from "./actions"
import { useToast } from "@/hooks/use-toast"
import { isDemoMode, clearDemoData } from "@/lib/demo-mode"
import { Save, Trash2, RefreshCw, Building, CreditCard, Settings as SettingsIcon, Bell } from "lucide-react"

function GoogleMapsSettings() {
  const [isKeyConfigured, setIsKeyConfigured] = useState<boolean | null>(null)

  useEffect(() => {
    // Call the server action when the component mounts
    getGoogleMapsApiConfigStatus().then((status) => {
      setIsKeyConfigured(status)
    })
  }, [])

  if (isKeyConfigured === null) {
    // Loading state
    return (
      <div className="p-6">
        <div className="h-24 w-full bg-gray-200 animate-pulse rounded-lg"></div>
      </div>
    )
  }

  return <GoogleMapsSetupGuide isApiKeyConfigured={isKeyConfigured} />
}

export default function SettingsPage() {
  const { toast } = useToast()
  const [restaurantSettings, setRestaurantSettings] = useState({
    name: "Demo Restaurant",
    address: "Demo Mahallesi, Demo Sokak No:1",
    phone: "+90 555 123 4567",
    email: "info@demo-restaurant.com",
    taxRate: 8,
    currency: "TRY",
    serviceCharge: 0,
    autoAcceptOrders: true,
    notificationsEnabled: true,
    deliveryFee: 5.00,
    minOrderAmount: 25.00,
  })

  const [paymentSettings, setPaymentSettings] = useState({
    cashEnabled: true,
    cardEnabled: true,
    onlinePaymentEnabled: false,
    mealVoucherEnabled: true,
    contactlessEnabled: true,
  })

  const handleSaveRestaurantSettings = () => {
    // In demo mode, just save to localStorage
    if (isDemoMode()) {
      localStorage.setItem('restaurant-settings', JSON.stringify(restaurantSettings))
      toast({
        title: "Ayarlar Kaydedildi",
        description: "Restoran ayarları başarıyla güncellendi.",
      })
    }
  }

  const handleSavePaymentSettings = () => {
    if (isDemoMode()) {
      localStorage.setItem('payment-settings', JSON.stringify(paymentSettings))
      toast({
        title: "Ödeme Ayarları Kaydedildi",
        description: "Ödeme yöntemleri ayarları güncellendi.",
      })
    }
  }

  const handleClearDemoData = () => {
    clearDemoData()
    toast({
      title: "Demo Verileri Temizlendi",
      description: "Tüm demo verileri başarıyla temizlendi.",
    })
    setTimeout(() => window.location.reload(), 1000)
  }

  useEffect(() => {
    // Load saved settings in demo mode
    if (isDemoMode()) {
      const savedRestaurantSettings = localStorage.getItem('restaurant-settings')
      const savedPaymentSettings = localStorage.getItem('payment-settings')

      if (savedRestaurantSettings) {
        setRestaurantSettings(JSON.parse(savedRestaurantSettings))
      }
      if (savedPaymentSettings) {
        setPaymentSettings(JSON.parse(savedPaymentSettings))
      }
    }
  }, [])

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Ayarlar</h1>
        <p className="text-gray-500">Uygulama ayarlarını ve entegrasyonları buradan yönetin.</p>
        {isDemoMode() && (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            Demo Mode - Değişiklikler sadece bu oturumda geçerlidir
          </Badge>
        )}
      </div>

      <Tabs defaultValue="restaurant" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="restaurant" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Restoran
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Ödeme
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Bildirimler
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2">
            <SettingsIcon className="h-4 w-4" />
            Entegrasyonlar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="restaurant" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Restoran Bilgileri</CardTitle>
              <CardDescription>Restoran detayları ve temel ayarlar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="restaurant-name">Restoran Adı</Label>
                  <Input
                    id="restaurant-name"
                    value={restaurantSettings.name}
                    onChange={(e) => setRestaurantSettings(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="restaurant-phone">Telefon</Label>
                  <Input
                    id="restaurant-phone"
                    value={restaurantSettings.phone}
                    onChange={(e) => setRestaurantSettings(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="restaurant-address">Adres</Label>
                <Input
                  id="restaurant-address"
                  value={restaurantSettings.address}
                  onChange={(e) => setRestaurantSettings(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="restaurant-email">E-posta</Label>
                <Input
                  id="restaurant-email"
                  type="email"
                  value={restaurantSettings.email}
                  onChange={(e) => setRestaurantSettings(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <Separator />

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tax-rate">KDV Oranı (%)</Label>
                  <Input
                    id="tax-rate"
                    type="number"
                    min="0"
                    max="100"
                    value={restaurantSettings.taxRate}
                    onChange={(e) => setRestaurantSettings(prev => ({ ...prev, taxRate: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delivery-fee">Teslimat Ücreti (₺)</Label>
                  <Input
                    id="delivery-fee"
                    type="number"
                    min="0"
                    step="0.50"
                    value={restaurantSettings.deliveryFee}
                    onChange={(e) => setRestaurantSettings(prev => ({ ...prev, deliveryFee: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="min-order">Min. Sipariş Tutarı (₺)</Label>
                  <Input
                    id="min-order"
                    type="number"
                    min="0"
                    step="0.50"
                    value={restaurantSettings.minOrderAmount}
                    onChange={(e) => setRestaurantSettings(prev => ({ ...prev, minOrderAmount: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Siparişleri Otomatik Kabul Et</Label>
                  <p className="text-sm text-gray-500">Yeni siparişler otomatik olarak kabul edilsin</p>
                </div>
                <Switch
                  checked={restaurantSettings.autoAcceptOrders}
                  onCheckedChange={(checked) => setRestaurantSettings(prev => ({ ...prev, autoAcceptOrders: checked }))}
                />
              </div>

              <Button onClick={handleSaveRestaurantSettings} className="w-full">
                <Save className="mr-2 h-4 w-4" />
                Restoran Ayarlarını Kaydet
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ödeme Yöntemleri</CardTitle>
              <CardDescription>Kabul edilen ödeme yöntemlerini yönetin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Nakit Ödeme</Label>
                    <p className="text-sm text-gray-500">Nakit ödeme kabul edilsin</p>
                  </div>
                  <Switch
                    checked={paymentSettings.cashEnabled}
                    onCheckedChange={(checked) => setPaymentSettings(prev => ({ ...prev, cashEnabled: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Kredi/Banka Kartı</Label>
                    <p className="text-sm text-gray-500">Kart ile ödeme kabul edilsin</p>
                  </div>
                  <Switch
                    checked={paymentSettings.cardEnabled}
                    onCheckedChange={(checked) => setPaymentSettings(prev => ({ ...prev, cardEnabled: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Online Ödeme</Label>
                    <p className="text-sm text-gray-500">Online ödeme entegrasyonu</p>
                  </div>
                  <Switch
                    checked={paymentSettings.onlinePaymentEnabled}
                    onCheckedChange={(checked) => setPaymentSettings(prev => ({ ...prev, onlinePaymentEnabled: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Yemek Kartları</Label>
                    <p className="text-sm text-gray-500">Sodexo, Multinet vb. yemek kartları</p>
                  </div>
                  <Switch
                    checked={paymentSettings.mealVoucherEnabled}
                    onCheckedChange={(checked) => setPaymentSettings(prev => ({ ...prev, mealVoucherEnabled: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Temassız Ödeme</Label>
                    <p className="text-sm text-gray-500">QR kod, NFC temassız ödeme</p>
                  </div>
                  <Switch
                    checked={paymentSettings.contactlessEnabled}
                    onCheckedChange={(checked) => setPaymentSettings(prev => ({ ...prev, contactlessEnabled: checked }))}
                  />
                </div>
              </div>

              <Button onClick={handleSavePaymentSettings} className="w-full">
                <Save className="mr-2 h-4 w-4" />
                Ödeme Ayarlarını Kaydet
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bildirim Ayarları</CardTitle>
              <CardDescription>Sistem bildirimleri ve uyarıları yönetin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Sistem Bildirimleri</Label>
                  <p className="text-sm text-gray-500">Yeni sipariş, ödeme vb. bildirimleri</p>
                </div>
                <Switch
                  checked={restaurantSettings.notificationsEnabled}
                  onCheckedChange={(checked) => setRestaurantSettings(prev => ({ ...prev, notificationsEnabled: checked }))}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="font-medium">Bildirim Türleri</h4>
                <div className="space-y-3 pl-4">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="new-orders" defaultChecked />
                    <Label htmlFor="new-orders">Yeni siparişler</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="payments" defaultChecked />
                    <Label htmlFor="payments">Ödeme bildirimleri</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="low-stock" defaultChecked />
                    <Label htmlFor="low-stock">Düşük stok uyarıları</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="delivery" defaultChecked />
                    <Label htmlFor="delivery">Teslimat durumu</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Harita Entegrasyonu</CardTitle>
              <CardDescription>Kurye takibi ve teslimat özellikleri için Google Maps API kurulumu.</CardDescription>
            </CardHeader>
            <CardContent>
              <GoogleMapsSettings />
            </CardContent>
          </Card>

          {isDemoMode() && (
            <Card>
              <CardHeader>
                <CardTitle>Demo Verileri</CardTitle>
                <CardDescription>Demo verilerini yönetin ve sıfırlayın</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-800">Demo Modu Aktif</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Şu anda demo modunda çalışıyorsunuz. Tüm veriler tarayıcıda saklanıyor.
                  </p>
                </div>

                <Button
                  variant="destructive"
                  onClick={handleClearDemoData}
                  className="w-full"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Tüm Demo Verilerini Temizle
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
