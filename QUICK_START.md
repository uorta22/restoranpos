# 🚀 Hızlı Başlangıç Kılavuzu

Restaurant POS sisteminizi 5 dakikada çalıştırın!

## ⚡ Tablet/Browser'da Test Etmek İçin

### 1. Dependencies Kur

```bash
npm install --legacy-peer-deps
```

> **Not:** `--legacy-peer-deps` bayrağı React 19 uyumluluğu için gereklidir.

### 2. Development Server Başlat

```bash
npm run dev
```

Server başlayacak ve şu adreste çalışacak:
- **Local**: http://localhost:3000
- **Network**: http://192.168.x.x:3000

### 3. Tablet/Telefon'dan Bağlan

#### Aynı WiFi Ağındaysanız:

1. Terminal'de gösterilen **Network** adresini not alın
2. Tablet/telefon tarayıcısından bu adrese gidin
3. Demo kullanıcı ile giriş yapın:
   - **Email**: herhangi bir email (örn: `demo@test.com`)
   - **Şifre**: herhangi bir şifre (örn: `123456`)

#### Farklı Ağdaysanız (ngrok ile):

```bash
# Yeni terminal açın
npm install -g ngrok
ngrok http 3000

# Verilen URL'i kullanın (örn: https://xxx.ngrok.io)
```

---

## 🖥️ VSCode'da Test Etmek İçin

### Yöntem 1: Otomatik Debug

1. VSCode'da **F5** tuşuna basın
2. "Next.js: debug full stack" seçin
3. Otomatik olarak:
   - Server başlar
   - Chrome açılır
   - DevTools hazır gelir

### Yöntem 2: Task Runner

1. **Cmd+Shift+P** (Mac) / **Ctrl+Shift+P** (Windows)
2. "Tasks: Run Task" yazın
3. "Start Dev Server" seçin

### Tablet Simülasyonu (Chrome DevTools)

1. Chrome'da **F12** (DevTools aç)
2. **Cmd+Shift+M** (Mac) / **Ctrl+Shift+M** (Windows) - Device Toolbar
3. Tablet seç:
   - iPad Pro 12.9" (1024 x 1366)
   - iPad Air (820 x 1180)
   - Surface Pro 7 (912 x 1368)

---

## 🎯 Demo Mode (Varsayılan)

Sistem varsayılan olarak **Demo Mode**'da çalışır:

✅ **Avantajlar:**
- Supabase kurulumu gerektirmez
- Hemen test edebilirsiniz
- Tüm özellikler çalışır
- Veriler localStorage'da saklanır

❌ **Sınırlamalar:**
- Veriler tarayıcıya özeldir
- Gerçek database yok
- Çoklu cihaz senkronizasyonu yok

### Demo Kullanıcı Bilgileri

```
Email: demo@test.com (veya herhangi bir email)
Şifre: 123456 (veya herhangi bir şifre)
```

Giriş yaptıktan sonra otomatik demo veriler yüklenecek:
- 20+ ürün
- 10+ masa
- Örnek siparişler
- Kurye bilgileri

---

## 🗄️ Supabase ile Gerçek Database Kullanmak

### 1. Supabase Projesi Oluştur

1. [supabase.com](https://supabase.com) → Sign up (ücretsiz)
2. "New Project" → Proje adı ve şifre belirle
3. Proje oluşana kadar bekle (2-3 dakika)

### 2. Environment Variables Ayarla

`.env.local` dosyası oluşturun:

```bash
cp .env.example .env.local
```

Düzenleyin:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
NEXT_PUBLIC_DEMO_MODE=false
```

### 3. Database Tabloları Oluştur

Tarayıcıdan:
```
http://localhost:3000/api/setup-database
```

veya Supabase Dashboard'da SQL Editor'den manuel oluşturun.

### 4. Server'ı Yeniden Başlat

```bash
# Ctrl+C ile durdur
npm run dev
```

---

## 📱 PWA Olarak Kur (Tablet'te Uygulama Gibi)

1. Tablet tarayıcısında siteyi açın
2. Menü → "Add to Home Screen" / "Ana Ekrana Ekle"
3. İkon artık Ana Ekranda
4. Tam ekran uygulama gibi çalışır
5. Offline desteği var

---

## 🔧 Sorun Giderme

### Port 3000 kullanımda hatası

```bash
# Port 3001 veya başka bir port kullanılacak
# Terminal'de gösterilen portu kullanın
```

### Dependencies kurulum hatası

```bash
# --legacy-peer-deps ile tekrar deneyin
npm install --legacy-peer-deps
```

### "next: command not found" hatası

```bash
# node_modules silin ve tekrar kurun
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### Tablet'ten bağlanamıyorum

```bash
# IP adresinizi kontrol edin
# Mac/Linux:
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows:
ipconfig

# Firewall ayarlarını kontrol edin
```

### Demo mode'dan çıkamıyorum

```bash
# .env.local dosyasını kontrol edin
# NEXT_PUBLIC_DEMO_MODE=false olmalı
# Supabase credentials doğru olmalı
```

---

## 🎨 Özelleştirme

### Tema Renkleri

`tailwind.config.ts` dosyasından renkleri değiştirebilirsiniz.

### Logo

`public/` klasörüne kendi logonuzu ekleyin.

### Demo Veriler

`lib/mock-data.ts` dosyasından demo verileri düzenleyebilirsiniz.

---

## 📚 Daha Fazla Bilgi

- **Tam Dokümantasyon**: [README.md](README.md)
- **Katkıda Bulunma**: [CONTRIBUTING.md](CONTRIBUTING.md)
- **API Dokümantasyonu**: `lib/api.ts` dosyasını inceleyin

---

## 🚀 Hemen Başla!

```bash
# 1. Kur
npm install --legacy-peer-deps

# 2. Başlat
npm run dev

# 3. Aç
# http://localhost:3000

# 4. Giriş Yap
# Email: demo@test.com
# Şifre: 123456
```

**İyi kodlamalar!** 🎉

---

## 📞 Destek

Sorun mu yaşıyorsunuz?
- GitHub Issues: [github.com/uorta22/restoranpos/issues](https://github.com/uorta22/restoranpos/issues)
