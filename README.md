# Restaurant POS System

Restoran işletmeleri için modern, kapsamlı bir satış noktası (POS) yönetim sistemi. Next.js 15, TypeScript ve Supabase ile geliştirilmiştir.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15.2.4-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![React](https://img.shields.io/badge/React-19-blue)

## 🚀 Özellikler

### Sipariş Yönetimi
- **Çoklu Sipariş Türleri**: Restoranda, gel-al, paket servis
- **Gerçek Zamanlı Takip**: Sipariş durumlarını anlık olarak takip edin
- **Öncelik Sistemi**: Siparişleri öncelik seviyelerine göre yönetin (düşük, normal, yüksek, acil)
- **Sipariş İş Akışı**: 9 farklı sipariş durumu ile detaylı iş akışı
- **Müşteri Bildirimleri**: Sipariş durumu güncellemelerini otomatik bildirim sistemi

### Masa Yönetimi
- **Görsel Kat Planı**: Sürükle-bırak ile masa düzenleme
- **Masa Durumları**: Müsait, dolu, rezerve durumları
- **Masa Bazlı Sipariş**: Her masa için ayrı sipariş takibi
- **Kapasite Yönetimi**: Masa kapasitelerini belirleme ve takip

### Ödeme Sistemi
- **Çoklu Ödeme Yöntemleri**: Nakit, kredi kartı, online ödeme, yemek kartı
- **Kısmi Ödeme Desteği**: Siparişleri taksitli ödeme imkanı
- **Fiş Yazdırma**: Termal yazıcı desteği ile fiş çıktısı
- **Ödeme Takibi**: Detaylı ödeme durumu raporlaması

### Kurye ve Teslimat
- **Kurye Yönetimi**: Kurye performans takibi
- **Gerçek Zamanlı Takip**: Google Maps entegrasyonu ile canlı konum takibi
- **Teslimat Rotası**: Optimum rota planlama
- **Müşteri Takip Linki**: Müşterilerin siparişlerini takip etmesi için özel link

### Envanter Yönetimi
- **Stok Takibi**: Ürün stoklarını gerçek zamanlı takip
- **Düşük Stok Uyarıları**: Otomatik bildirimler
- **Tedarikçi Yönetimi**: Tedarikçi bilgileri ve sipariş geçmişi
- **Kategori Yönetimi**: Ürünleri kategorilere ayırma

### Raporlama ve Analitik
- **Satış Raporları**: Günlük, haftalık, aylık satış analizleri
- **Performans Metrikleri**: Çalışan ve ürün performans raporları
- **Grafik Gösterimler**: Recharts ile görsel raporlar
- **Excel Export**: Raporları Excel formatında dışa aktarma

### Kullanıcı Yönetimi
- **Rol Bazlı Yetkilendirme**: Yönetici, garson, şef, kasiyer, kurye rolleri
- **Güvenli Kimlik Doğrulama**: JWT ve bcryptjs ile şifreleme
- **Kullanıcı Profilleri**: Kişiselleştirilebilir kullanıcı profilleri
- **Aktivite Günlüğü**: Kullanıcı işlem kayıtları

### Ek Özellikler
- **Demo Mod**: Supabase olmadan localStorage ile çalışma
- **Responsive Tasarım**: Mobil, tablet ve masaüstü uyumlu
- **Dark Mode**: Karanlık tema desteği
- **Çoklu Dil Desteği**: Türkçe arayüz (İngilizce yakında)
- **PWA Desteği**: Progressive Web App özellikleri
- **Offline Mod**: İnternet bağlantısı olmadan çalışma

## 🛠️ Teknoloji Stack

### Frontend
- **Framework**: Next.js 15.2.4 (App Router)
- **UI Library**: React 19
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 3.4.17
- **UI Components**: Radix UI
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts 2.15.0
- **Icons**: Lucide React
- **Dates**: date-fns 4.1.0

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth + JWT
- **Storage**: Supabase Storage
- **Real-time**: Supabase Realtime

### Development Tools
- **Package Manager**: npm / pnpm
- **Linter**: ESLint
- **Formatter**: Prettier (önerilir)

## 📋 Gereksinimler

- Node.js 18.x veya üzeri
- npm 9.x veya üzeri (ya da pnpm 8.x)
- Supabase hesabı (ücretsiz plan yeterli)
- Google Maps API key (teslimat takibi için - opsiyonel)

## 🚦 Kurulum

### 1. Projeyi Klonlayın

```bash
git clone https://github.com/uorta22/restoranpos.git
cd restoranpos
```

### 2. Bağımlılıkları Yükleyin

```bash
npm install
# veya
pnpm install
```

### 3. Ortam Değişkenlerini Ayarlayın

`.env.local` dosyası oluşturun:

```bash
cp .env.example .env.local
```

Gerekli değişkenleri doldurun:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Google Maps (Opsiyonel)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key

# JWT Secret
JWT_SECRET=your_jwt_secret_key

# Email Configuration (Opsiyonel)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_DEMO_MODE=false
```

### 4. Veritabanını Kurun

Tarayıcınızdan aşağıdaki endpoint'i ziyaret edin:

```
http://localhost:3000/api/setup-database
```

Bu işlem Supabase'de gerekli tabloları oluşturacaktır.

### 5. Demo Verileri Yükleyin (Opsiyonel)

```
http://localhost:3000/api/seed-database
```

### 6. Uygulamayı Başlatın

```bash
npm run dev
# veya
pnpm dev
```

Uygulama [http://localhost:3000](http://localhost:3000) adresinde çalışacaktır.

## 📱 Demo Mod

Supabase yapılandırması olmadan sistemi test etmek için demo modu kullanabilirsiniz:

1. `.env.local` dosyasında:
```env
NEXT_PUBLIC_DEMO_MODE=true
```

2. Tarayıcınızda `/login` sayfasında herhangi bir e-posta ve şifre ile giriş yapabilirsiniz.

Demo modda tüm veriler tarayıcınızın localStorage'ında saklanır.

## 🏗️ Proje Yapısı

```
restoranpos/
├── app/                    # Next.js App Router sayfaları
│   ├── api/               # API routes
│   ├── login/             # Giriş sayfası
│   ├── menu/              # Menü yönetimi
│   ├── orders/            # Sipariş yönetimi
│   ├── kitchen/           # Mutfak ekranı
│   ├── tables/            # Masa yönetimi
│   ├── delivery/          # Teslimat takibi
│   ├── couriers/          # Kurye yönetimi
│   ├── inventory/         # Envanter yönetimi
│   ├── reports/           # Raporlar
│   ├── settings/          # Ayarlar
│   └── ...
├── components/            # React bileşenleri
│   ├── ui/               # Temel UI bileşenleri
│   └── ...               # İş mantığı bileşenleri
├── context/              # React Context API
│   ├── auth-context.tsx
│   ├── cart-context.tsx
│   ├── order-context.tsx
│   └── ...
├── lib/                  # Yardımcı fonksiyonlar
│   ├── api.ts           # API işlemleri
│   ├── types.ts         # TypeScript tipleri
│   ├── supabase.ts      # Supabase client
│   └── ...
├── hooks/                # Custom React hooks
├── public/               # Statik dosyalar
└── styles/              # Global stil dosyaları
```

## 🔐 Güvenlik

- Tüm şifreler bcryptjs ile hash'lenir
- JWT token'ları güvenli şekilde saklanır
- Supabase Row Level Security (RLS) politikaları
- CORS yapılandırması
- SQL injection koruması
- XSS koruması

## 🧪 Test

```bash
# Unit testler (yakında)
npm run test

# E2E testler (yakında)
npm run test:e2e
```

## 📦 Production Build

```bash
npm run build
npm start
```

## 🚀 Deployment

### Vercel (Önerilen)

1. Vercel hesabınıza giriş yapın
2. GitHub reposunu bağlayın
3. Environment variables'ları ekleyin
4. Deploy edin

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/uorta22/restoranpos)

### Diğer Platformlar

- **Netlify**: Next.js desteği ile
- **Railway**: Automatic deployment
- **DigitalOcean App Platform**: Container deployment
- **AWS Amplify**: Serverless deployment

## 🤝 Katkıda Bulunma

Katkılarınızı bekliyoruz! Lütfen [CONTRIBUTING.md](CONTRIBUTING.md) dosyasını okuyun.

1. Bu repoyu fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'feat: Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📝 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 👥 İletişim

Proje Sahibi: [@uorta22](https://github.com/uorta22)

Proje Linki: [https://github.com/uorta22/restoranpos](https://github.com/uorta22/restoranpos)

## 🙏 Teşekkürler

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [Radix UI](https://www.radix-ui.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vercel](https://vercel.com/)

## 📸 Ekran Görüntüleri

### Dashboard
![Dashboard](docs/screenshots/dashboard.png)

### Sipariş Ekranı
![Orders](docs/screenshots/orders.png)

### Masa Yönetimi
![Tables](docs/screenshots/tables.png)

### Mutfak Ekranı
![Kitchen](docs/screenshots/kitchen.png)

---

⭐️ Bu projeyi beğendiyseniz yıldız vermeyi unutmayın!
