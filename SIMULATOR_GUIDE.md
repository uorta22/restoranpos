# 📱 Simülatör Test Kılavuzu

Restaurant POS uygulamanızı farklı simülatörlerde test etmek için rehber.

## 🎯 En Hızlı: Safari Responsive Design Mode

### Adım 1: Safari'yi Hazırlayın

1. Safari → Settings → Advanced
2. ✅ "Show features for web developers" işaretleyin

### Adım 2: Responsive Mode'a Geçin

```bash
# Server çalışıyorsa Safari'de aç
open -a Safari http://localhost:3001
```

**Klavye Kısayolu:**
- **Cmd+Option+R** → Responsive Design Mode

### Adım 3: Cihaz Seçin

Üst menüden cihaz seçin:
- 📱 iPad Pro 12.9" (1024 × 1366)
- 📱 iPad Air (820 × 1180)
- 📱 iPad Mini (768 × 1024)
- 📱 iPhone 15 Pro Max (430 × 932)

### Adım 4: Test Edin!

**Özellikler:**
- ✅ Touch simülasyonu
- ✅ Gerçek cihaz boyutları
- ✅ Ekran yönü değiştirme
- ✅ User agent değiştirme
- ✅ Developer Console

---

## 🍎 iOS Simulator (Xcode)

### Gereksinimler

```bash
# Xcode yüklü mü kontrol et
xcode-select -p

# Yüklü değilse App Store'dan kur
# https://apps.apple.com/us/app/xcode/id497799835
```

### Hızlı Başlat

```bash
# Script ile otomatik başlat
./scripts/open-simulator.sh
```

### Manuel Başlatma

```bash
# 1. Simulator'ü aç
open -a Simulator

# 2. Cihaz seç (menüden)
# File → Open Simulator → iOS 17.x → iPad Pro 12.9"

# 3. IP adresini al
ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}'

# 4. Simulator'de Safari'yi aç
# Adrese git: http://YOUR_IP:3001
```

### Simulator Kısayolları

```
Cmd+K          → Keyboard aç/kapat
Cmd+←/→        → Cihaz döndür (portrait/landscape)
Cmd+1,2,3      → Zoom seviyesi
Cmd+Shift+H    → Home'a dön
Cmd+Shift+H×2  → App switcher
```

### Cihaz Listesi

```bash
# Mevcut simulatörleri listele
xcrun simctl list devices available
```

---

## 🌐 Chrome DevTools (Tablet Simülasyonu)

### Adım 1: Chrome'u Aç

```bash
open -a "Google Chrome" http://localhost:3001
```

### Adım 2: DevTools Device Mode

**Klavye Kısayolları:**
- **F12** → DevTools aç
- **Cmd+Shift+M** (Mac) / **Ctrl+Shift+M** (Windows) → Device Toolbar

### Adım 3: Tablet Seçin

DevTools üst menüsünden:

**iPad Modelleri:**
- iPad Pro 12.9" → 1024 × 1366
- iPad Air → 820 × 1180
- iPad Mini → 768 × 1024

**Surface:**
- Surface Pro 7 → 912 × 1368

**Custom:**
- Edit → Custom cihaz ekle

### Özellikler

```
✅ Touch simülasyonu (Toggle device toolbar)
✅ Network throttling (Slow 3G, Fast 3G)
✅ GPS lokasyon simülasyonu
✅ Sensors (accelerometer, gyroscope)
✅ Screenshot alma (Cmd+Shift+P → "Capture screenshot")
```

### Network Throttling

**Test Senaryoları:**
```
1. Fast 3G    → Normal müşteri
2. Slow 3G    → Yavaş internet
3. Offline    → Bağlantı kopması
```

---

## 🔥 Firefox Responsive Design Mode

### Başlatma

```bash
open -a Firefox http://localhost:3001
```

**Kısayol:**
- **Cmd+Option+M** (Mac)
- **Ctrl+Shift+M** (Windows)

### Özellikler

```
✅ Preset cihazlar (iPad, iPhone, vb.)
✅ Custom viewport
✅ Touch simülasyonu
✅ User agent değiştirme
✅ Screenshot (tam sayfa)
```

---

## 🌍 BrowserStack (Online Gerçek Cihazlar)

### Free Trial

1. [browserstack.com](https://www.browserstack.com/users/sign_up) → Sign up (Free trial)
2. Live → Choose Device → iPad / iPhone
3. Enter URL → http://YOUR_IP:3001

**NOT:** Local test için ngrok kullanın:

```bash
# Terminal 1: Server
npm run dev

# Terminal 2: ngrok
npm install -g ngrok
ngrok http 3001

# BrowserStack'te ngrok URL'ini kullan
# https://xxx.ngrok.io
```

### Avantajlar

```
✅ Gerçek cihazlar (fiziksel)
✅ Gerçek iOS/Android
✅ Debug tools
✅ Video recording
✅ Network simülasyonu
```

---

## 🎨 Playwright (Automated Testing)

### Kurulum

```bash
npm install -D @playwright/test
npx playwright install
```

### Test Script

```typescript
// tests/tablet.spec.ts
import { test, expect } from '@playwright/test';

test('iPad Pro görünümü', async ({ page }) => {
  // iPad Pro 12.9" viewport
  await page.setViewportSize({ width: 1024, height: 1366 });

  await page.goto('http://localhost:3001');

  // Login test
  await page.fill('input[type="email"]', 'demo@test.com');
  await page.fill('input[type="password"]', '123456');
  await page.click('button[type="submit"]');

  // Dashboard yüklendi mi?
  await expect(page.locator('h1')).toBeVisible();

  // Screenshot
  await page.screenshot({ path: 'tablet-view.png' });
});
```

### Çalıştırma

```bash
# Tüm testler
npx playwright test

# UI mode (interactive)
npx playwright test --ui

# Sadece iPad testi
npx playwright test tablet.spec.ts
```

---

## 📊 Karşılaştırma

| Yöntem | Hız | Gerçeklik | Ücretsiz | Kolay Kurulum |
|--------|-----|-----------|----------|---------------|
| Safari RDM | ⚡⚡⚡ | ⭐⭐ | ✅ | ✅✅✅ |
| Chrome DevTools | ⚡⚡⚡ | ⭐⭐ | ✅ | ✅✅✅ |
| iOS Simulator | ⚡⚡ | ⭐⭐⭐⭐ | ✅ | ✅✅ |
| BrowserStack | ⚡ | ⭐⭐⭐⭐⭐ | Trial | ✅✅ |
| Playwright | ⚡⚡ | ⭐⭐⭐ | ✅ | ✅ |

---

## 🎯 Önerilen İş Akışı

### 1. Hızlı Geliştirme
```bash
# Safari/Chrome Responsive Mode kullan
# Anında test, hızlı iterasyon
```

### 2. Detaylı Test
```bash
# iOS Simulator
./scripts/open-simulator.sh
```

### 3. Production Test
```bash
# BrowserStack ile gerçek cihazlarda
# Farklı iOS/iPadOS versiyonları
```

### 4. Otomatik Test
```bash
# Playwright ile CI/CD
npx playwright test
```

---

## 🛠️ Sorun Giderme

### Simulator açılmıyor

```bash
# Xcode Command Line Tools kur
xcode-select --install

# Veya Xcode'u yeniden başlat
sudo xcode-select --reset
```

### Local IP bulamıyorum

```bash
# Mac
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig
```

### Simulator'de sayfa yüklenmiyor

```bash
# Firewall kontrolü
# System Settings → Network → Firewall

# Development server çalışıyor mu?
curl http://localhost:3001
```

---

## 🎉 Hızlı Başlat

**En hızlı yöntem (Safari):**

```bash
# 1. Server başlat (zaten çalışıyor)
npm run dev

# 2. Safari'de aç
open -a Safari http://localhost:3001

# 3. Responsive mode
# Cmd+Option+R

# 4. iPad Pro seç
# Ready! 🎉
```

---

## 📞 Destek

Sorun mu yaşıyorsunuz?
- [GitHub Issues](https://github.com/uorta22/restoranpos/issues)
- [QUICK_START.md](QUICK_START.md)
