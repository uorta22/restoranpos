# RestaurantPOS — Önceliklendirilmiş Backlog

Tarih: 16 Temmuz 2026 · Kaynak: docs/STRATEGY.md (Faz 0/1/2 planı)
Büyüklük: S ≈ ≤1 gün · M ≈ 2–4 gün · L ≈ 1 hafta+
Konvansiyon: tüm yeni tablolar `(restaurant_id, id)` kompozit FK, RLS `private.is_restaurant_member/has_restaurant_role`, yazmalar `security definer set search_path = ''` RPC, migration `supabase/migrations/YYYYMMDDHHMMSS_*.sql`, sonrasında `lib/database.types.ts` regen.

---

## FAZ 0 — 48 SAAT SPRİNTİ: "Para musluğunu aç"

> Sprint hedefi: trial'ı biten restoran karta abone olur, webhook aboneliği aktive eder, kilit read-only soft-lock'a döner, makbuz e-postası gider.

### 0.0 — Saat 0 dış bağımlılık ateşlemesi
- **Neden:** iyzico hesap onayı, DKIM/SPF propagasyonu ve 3P platform onayları kontrol dışı bekleme süreleri; sprint başında tetiklenmezse kritik yolu tıkar.
- **Kapsam:** iyzico sandbox başvurusu; Resend hesabı + domain DNS kayıtları (DKIM/SPF); Yemeksepeti (integration.yemeksepeti.com) ve Trendyol GO (developers.tgoapps.com) entegrasyon başvuruları; Getir entegratör görüşme talebi. Kod yok.
- **Büyüklük:** S · **Bağımlılık:** yok — HER ŞEYDEN ÖNCE.

### 0.1 — Billing migration'ı + soft-lock çift kapı
- **Neden:** Tahsilatın veri temeli; kilidin RPC + RLS iki katmanda da çalışması (tek katman delinir — jüri bulgusu).
- **Kapsam:** Yeni migration: `billing_events` (unique `(provider, external_event_id)` idempotent ledger, service-role yazar), `subscription_invoices`, `restaurant_subscriptions`'a `cancel_at_period_end`/`grace_period_ends_at`/`card_brand`/`card_last_four` kolonları; `private.subscription_allows_writes(restaurant_id)` helper; guard'ın `create_order`, `record_order_payment`, `set_order_status` vb. yazma RPC'lerine VE ilgili tabloların INSERT/UPDATE RLS politikalarına eklenmesi. Test: süresi dolmuş abonelikte hem RPC hem doğrudan tablo yazması reddedilir.
- **Dosya ipucu:** `supabase/migrations/`, mevcut desen: `20260711134708_initial_schema.sql` (RPC'ler ~satır 1006+), `supabase/manual/06_onboarding_and_billing_foundation.sql` (kısmen döşenmiş zemin).
- **Büyüklük:** M · **Bağımlılık:** yok.

### 0.2 — iyzico checkout + webhook → abonelik aktivasyonu
- **Neden:** Gelirin kendisi. `restaurant_subscriptions.provider_customer_id/provider_subscription_id` kolonları zaten hazır.
- **Kapsam:** Server action ile hosted checkout başlatma; `app/api/billing/callback` ve `app/api/billing/webhook` route handler'ları; webhook → `billing_events` insert (idempotent) → `activate_subscription` service-role RPC. Sandbox test kartıyla uçtan uca; aynı webhook 2. kez → `duplicate`.
- **Dosya ipucu:** `app/api/billing/*`, `lib/` altına iyzico client (SDK repo'da yok, sıfırdan), env: `IYZICO_API_KEY/SECRET` (.env, commit edilmez).
- **Büyüklük:** M · **Bağımlılık:** 0.0 (hesap), 0.1 (ledger).

### 0.3 — Panel abonelik UI + read-only kilit deneyimi
- **Neden:** Hard-lock churn üretir; read-only + CTA dönüşüm üretir.
- **Kapsam:** Plan seçimi → ödeme → abonelik durumu sayfası (`app/(panel)/` altında); trial bitmiş hesapta raporlar/veriler görünür, yazma aksiyonları disabled + banner + "Abone ol" CTA. `lib/subscription-plans.ts` mevcut plan verisi kullanılır.
- **Büyüklük:** M · **Bağımlılık:** 0.2.

### 0.4 — email_outbox + Cron dispatcher + Resend şablonları
- **Neden:** Transactional e-posta altyapısı sıfır; makbuz ve trial uyarıları dönüşümün parçası. Dispatcher açıkça tanımlı: Vercel Cron → route handler (jüri bulgusu: tanımsız bileşen bırakma).
- **Kapsam:** Migration: `email_outbox` (status: queued/sending/sent/failed, attempts, RLS açık + policy yok = yalnız service-role); `app/api/cron/email-dispatch` route (Vercel Cron, kilitli batch işleme); Resend client; şablonlar: ödeme makbuzu, trial D-3, trial D-1.
- **Büyüklük:** M · **Bağımlılık:** 0.0 (DKIM), 0.1 (migration zinciri). E-posta gönderimi sprintin SON dilimi — DNS propagasyonuna zaman tanı.

---

## FAZ 1 — 2 HAFTA: POS çekirdeği eksiksiz + kanal temeli

### 1.1 — Dunning + fatura geçmişi + plan değişimi
- **Neden:** Ödeme başarısızlığı gerçek hayatta %5-10; otomatik kurtarma MRR korur.
- **Kapsam:** Başarısız ödeme → 3 deneme + `grace_period_ends_at`; `subscription_invoices` listesi paneli; upgrade/downgrade dönem sonunda geçiş (proration yok); webhook replay aracı (`billing_events` ledger'ından yeniden işleme, admin-only).
- **Büyüklük:** M · **Bağımlılık:** 0.1, 0.2, 0.4.

### 1.2 — Gün sonu / Z-raporu
- **Neden:** POS'un satılabilir sayılması için asgari beklenti; rakiplerin tamamında var.
- **Kapsam:** Kasa kapanış RPC'si (`close_register_day`), `daily_sales` view genişletme (ödeme tipi kırılımı), panel gün sonu ekranı + yazdırılabilir çıktı.
- **Dosya ipucu:** `daily_sales` view (initial_schema.sql ~satır 1931).
- **Büyüklük:** M · **Bağımlılık:** yok.

### 1.3 — İade / void akışı
- **Neden:** Kasada iade yapamayan POS gerçek işletmede tutunamaz.
- **Kapsam:** `payments.status='refunded'` geçişi + iade RPC'si (rol: owner/manager) + stok geri alma (`stock_movements`) + `order_events` kaydı; panel UI.
- **Büyüklük:** M · **Bağımlılık:** yok.

### 1.4 — Kanal çekirdeği migration'ı (feature flag arkasında)
- **Neden:** 3P onayları beklerken çekirdek hazırlanır; tüm kanallar (tüketici dahil) bu omurgaya oturur.
- **Kapsam:** Migration: `channels` text-PK seed katalog tablosu ('pos','consumer_web','qr','yemeksepeti','trendyol_go','getir' — enum DEĞİL, `subscription_plans` deseni); `channel_connections` (Vault referanslı sır kolonları + column-level grant, `unique (channel_id, external_restaurant_id)` tenant çözümleme anahtarı); `channel_events` (append-only inbox, `unique (connection_id, external_event_id)`); `channel_product_mappings`; `orders`'a `channel_id text not null default 'pos' references channels(id)`, `external_ref`, `accepted_at`, `rejected_reason`, `public_token uuid unique` kolonları + `(restaurant_id, channel_id, created_at desc)` index; `order_events` timeline tablosu.
- **Not:** `order_status` enum'una DOKUNULMAZ; `order_items.product_id` nullable olduğu için eşleşmemiş 3P ürünler `product_name` ile taşınır.
- **Büyüklük:** L · **Bağımlılık:** 0.1 (migration zinciri).

### 1.5 — ChannelAdapter arayüzü + mock adaptör + ingest hattı
- **Neden:** Gerçek platform onayı olmadan idempotency ve normalizasyon uçtan uca kanıtlanır; onay geldiğinde yalnız adaptör dosyası yazılır.
- **Kapsam:** `lib/channels/adapter.ts` (arayüz: `verifySignature`, `normalizeOrder`, `pushStatus`), `lib/channels/mock.ts`; `app/api/channels/webhook/[channel]` route (fast-ack: doğrula → `channel_events`'e yaz → 200); işleyici (Cron veya inline) → `create_external_order` service-role RPC → KDS'ye bildirim. Test: aynı payload 2x POST → tek `channel_events`, tek `orders` satırı; Yemeksepeti dokümanındaki gerçek şemayla fikstür testi.
- **Büyüklük:** L · **Bağımlılık:** 1.4.

### 1.6 — Panel "Kanallar" sayfası + sipariş kanal rozeti
- **Neden:** Operatör kanal durumunu görmeli; 3P sipariş kabul/ret aksiyonu operasyonun kalbi.
- **Kapsam:** `app/(panel)/channels` — bağlantı listesi, durum, son hata, dead-letter listesi + yeniden dene; sipariş listesi/KDS kartlarına kanal chip'i; kabul/ret aksiyonları (`accepted_at`/`rejected_reason` + outbox'a status push job).
- **Büyüklük:** M · **Bağımlılık:** 1.4, 1.5.

### 1.7 — E-posta genişlemesi: davet + rezervasyon + sipariş durumu
- **Neden:** `restaurant_invitations` akışı bugün e-postasız — hazır borç; rezervasyon onayı temel beklenti.
- **Kapsam:** Şablonlar (davet, rezervasyon onayı, sipariş durum bildirimi); ilgili RPC/aksiyonlardan `email_outbox`'a kuyruklama.
- **Büyüklük:** S · **Bağımlılık:** 0.4.

### 1.8 — Harita v1: teslimat bölgeleri + adres autocomplete
- **Neden:** Kendi kuryesiyle çalışan restoranlar için bölge/ücret temeli; tüketici checkout'unun ön koşulu.
- **Kapsam:** Migration: `delivery_zones` (MVP: merkez lat/lng + yarıçap; PostGIS polygon Faz 2); panelde bölge yönetimi; Places autocomplete (session token'lı) — `lib/google-maps.ts` Haversine mevcut.
- **Büyüklük:** M · **Bağımlılık:** yok.

---

## FAZ 2 — 90 GÜN: Büyüme katmanları

### 2.1 — Trendyol GO adaptörü (sandbox → production)
- **Neden:** Açık dev portalı var — muhtemelen ilk onaylanan gerçek kanal.
- **Kapsam:** `lib/channels/trendyol-go.ts`; imza doğrulama, sipariş normalize, kabul/ret/hazır statü geri yazımı; `channel_connections` onboarding UI (vendor ID + Vault'a sır kaydı).
- **Büyüklük:** L · **Bağımlılık:** 1.5, 1.6, 0.0 (platform onayı).

### 2.2 — Yemeksepeti adaptörü
- **Kapsam:** `lib/channels/yemeksepeti.ts` (Delivery Hero entegrasyon API'si); fikstürler 1.5'te hazırlandığı için fark yalnız gerçek uçlar.
- **Büyüklük:** L · **Bağımlılık:** 1.5, 1.6, 0.0 (platform onayı).

### 2.3 — Menü eşleştirme ekranı + eşleşmemiş ürün kuyruğu
- **Neden:** 3P entegrasyonun operasyonel can damarı; ara-katman rakiplerinin (Posentegra vb.) tüm işi bu.
- **Kapsam:** `channel_product_mappings` CRUD UI; "eşleşmemiş ürünler" kuyruğu (product_id null gelen order_items'tan beslenir); kanal bazlı fiyat farkı alanı.
- **Büyüklük:** M · **Bağımlılık:** 2.1 veya 2.2 (gerçek veri).

### 2.4 — Komisyon sonrası net marj raporu (channel_sales)
- **Neden:** Araştırmadaki en net boşluk — hiçbir rakip sunmuyor; satış kapatıcı farklılaştırıcı.
- **Kapsam:** `channel_connections.config`'e komisyon oranı; `channel_sales` view (`daily_sales` yanına): kanal bazlı ciro, komisyon, net marj; panel rapor sayfası + karşılaştırma grafiği.
- **Büyüklük:** M · **Bağımlılık:** 1.4; gerçek değer için 2.1/2.2.

### 2.5 — Tüketici storefront (white-label PWA)
- **Neden:** Türkiye'de first-party ordering boş; komisyonsuz "kendi kanalın" hikayesi + churn kalkanı.
- **Kapsam:** Migration: `restaurant_storefronts` 1:1 tablo (is_listed, çalışma saatleri jsonb, min. sepet, teslimat ücreti, kapıda/online ödeme bayrakları); `lib/app-routing.ts` + `proxy.ts`'e üçüncü surface (`siparis.` subdomain) + `app/(consumer)` route group; SSR menü (`get_storefront_menu` anon RPC), client sepet, misafir checkout (ad+telefon+adres, Turnstile), `place_consumer_order` RPC (fiyat sunucuda hesaplanır) → `channel_id='consumer_web'`; PWA manifest.
- **Büyüklük:** L · **Bağımlılık:** 1.4, 1.8; online ödeme için 2.6.
- **Bilinçli dışarıda (MVP):** tüketici hesabı, puanlama, mobil app.

### 2.6 — Tüketici online ödeme
- **Neden:** Kapıda ödeme MVP'yi açar ama online ödeme dönüşümü büyütür.
- **Kapsam:** Restoranın kendi iyzico üye işyeri anahtarıyla tahsilat (para bizden akmaz — lisans riski düşük, STRATEGY.md risk #9); checkout'a kart akışı; hukuk görüşü bu maddenin başlangıç kriteri.
- **Büyüklük:** M · **Bağımlılık:** 2.5, hukuk görüşü.

### 2.7 — Tüketici sipariş takip sayfası
- **Kapsam:** `/(consumer)/takip/[token]` — `orders.public_token` üzerinden `get_consumer_order(token)` anon RPC (`get_delivery_tracking` emsali); durum akışı + Realtime canlılık; `order_events` timeline gösterimi.
- **Büyüklük:** S · **Bağımlılık:** 1.4, 2.5.

### 2.8 — Kurye canlı takip + bölge bazlı ücret
- **Kapsam:** Kurye PWA'da foreground konum bildirimi → `deliveries.courier_lat/lng` (kolonlar mevcut); tüketici takip sayfasında canlı harita; `delivery_zones` bazlı teslimat ücreti/min. sepet; PostGIS polygon'a geçiş.
- **Büyüklük:** M · **Bağımlılık:** 1.8, 2.7.

### 2.9 — Tedarik v1: purchase_orders
- **Kapsam:** Migration: `purchase_orders` + `purchase_order_items` (suppliers tablosu mevcut); akış: PO oluştur → `email_outbox` ile tedarikçiye gönder → mal kabul → `stock_movements('purchase')` otomatik; panel UI.
- **Büyüklük:** M · **Bağımlılık:** 0.4.

### 2.10 — Getir kararı (60. gün karar noktası)
- **Kapsam:** Kamuya açık API yok. Seçenekler: (a) entegratör (Posentegra tarzı) üzerinden, (b) doğrudan erişim geldiyse adaptör, (c) bekle. Adaptör mimarisi üçüne de hazır; karar verisi: müşteri talebi + entegratör maliyeti.
- **Büyüklük:** karar S, uygulama L · **Bağımlılık:** 1.5, pazar verisi.

### 2.11 — Sertleştirme + uyum
- **Kapsam:** Webhook rate limit; dead-letter eşik alarmı; yük testi (100 eşzamanlı webhook); `channel_events` retention/arşiv; KVKK veri envanteri + tüketici aydınlatma metni; Expo mobil kararı için PWA trafik verisi toplama.
- **Büyüklük:** M · **Bağımlılık:** 2.1–2.8.

---

## Bağımlılık özeti (kritik yol)

```
0.0 ──> 0.2 ──> 0.3          0.0 ──> (haftalar) ──> 2.1 / 2.2 platform onayları
0.1 ──> 0.2         0.1 ──> 1.4 ──> 1.5 ──> 1.6 ──> 2.1/2.2 ──> 2.3/2.4
0.0 ──> 0.4 ──> 1.7 / 2.9              1.4 + 1.8 ──> 2.5 ──> 2.6/2.7 ──> 2.8
```

En uzun bekleme süreleri (0.0'daki başvurular) koda değil takvime bağlıdır — bu yüzden sprint saat 0'da ateşlenir.
