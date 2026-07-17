# RestaurantPOS — Ürün Stratejisi

Tarih: 16 Temmuz 2026 · Durum: Onaylı taslak (v1)
Temel alınan öneri: **"Önce POS Mükemmelliği + Ödeme"** (jüri toplamı en yüksek) — üzerine **kanal-adaptör çekirdeği** (adapter-first) ve **tüketici vitrin/takip desenleri** (marketplace-first) harmanlandı.

---

## 1) Vizyon

**Uzun vade (CEO vizyonu):** RestaurantPOS, işletme tarafında POS/operasyon, tüketici tarafında web+mobil yemek siparişi sunan; Yemeksepeti/Getir/Trendyol GO siparişlerini tek panele akıtan; tedarik, e-posta ve harita katmanlarıyla bütünleşik bir restoran işletim sistemi olur.

**90 günlük gerçeklik:** Vizyonun ön koşulu ürünün para toplayabilmesi. Bugün trial bitince ürün kilitleniyor ve tahsilat mekanizması yok — gelir sıfır. Sıralama bu yüzden:

1. **Tahsilat + POS çekirdeğinin eksiksizleşmesi** (para musluğunu aç)
2. **3P kanal entegrasyonu** (mevcut müşteriye satılabilir en yüksek değerli eklenti)
3. **White-label tüketici yüzeyi** (Toast/Olo modeli — komisyonsuz "kendi kanalın")

Marketplace/Getir-rakibi vizyonu 90 günün dışında; ancak tüm şema kararları o kapıyı **kapatmayacak** şekilde alınır: tüketici web'i ayrıcalıklı bir sistem değil, `consumer_web` kanal kimlikli bir adaptördür. Yarın marketplace açılırsa aynı ingestion çekirdeği kullanılır.

## 2) Pazar Konumlanması

Araştırma bulgusu net: Türkiye'de kimse "her şey dahil, şeffaf fiyat" satmıyor; 3P entegrasyon, QR menü, ÖKC hep ayrı ücretli eklenti ve toplam maliyet 2-3 katına çıkıyor. Tüketici yüzeyi ise herkesin kör noktası.

**Konumlanma cümlesi:** *"Tek fiyat, her şey dahil: POS + 3P kanallar + kendi sipariş siten — komisyonsuz."*

Farklılaştırıcılar (öncelik sırasıyla):

| # | Farklılaştırıcı | Pazar boşluğu kanıtı |
|---|---|---|
| 1 | Şeffaf, self-servis, her şey dahil fiyat | Adisyo/Menulux eklenti cehennemi; Protel/RobotPOS teklif usulü |
| 2 | Komisyon sonrası **net marj raporu** (kanal kârlılığı) | Hiçbir rakipte öne çıkmıyor |
| 3 | White-label tüketici sipariş sitesi (first-party ordering) | Türkiye'de boş — Toast/Olo modeli |
| 4 | Kendi kuryesiyle çalışana teslimat/bölge/canlı takip derinliği | Ana POS'larda yüzeysel, ayrı araçlara gidiliyor |

## 3) Rakip Özet Matrisi

| Oyuncu | Segment | Fiyat modeli | 3P entegrasyon | Tüketici yüzeyi | Zayıf noktası |
|---|---|---|---|---|---|
| Simpra (Protel/Protein) | Tekil → zincir, otel F&B | 1.550 TL/ay + KDV, tek paket | YS, Getir, TGO, Migros, Fuudy | QR/kiosk (işletme-içi) | Kurumsal fiyat opak; tüketici app yok |
| Protel / Oracle MICROS | Kurumsal, zincir, otel | Teklif usulü | Marketplace/entegratör | Yok | KOBİ'ye inmiyor, pahalı/karmaşık |
| Adisyo | Küçük-orta KOBİ | 1.040–2.150 TL/ay + eklentiler | YS, Getir, TGO, Migros (+225 TL/ay) | QR/kiosk | Eklenti başına ücret, TCO şişiyor |
| Menulux | Geniş, modüler | ~250–1.250 TL/ay + ayrı lisanslar | YS, Getir, TGO, Migros | QR/self-servis | Entegrasyon fiyatı opak, satış görüşmesi şart |
| Paycell POS (Turkcell) | Esnaf geneli | ~399 TL/ay + %3,54 komisyon | Tespit edilemedi | Cüzdan var, sipariş yok | Restoran yazılımı yok |
| RobotPOS | Butik → franchise zinciri | Opak | Var (tek ekran) | Yok | Fiyat opak; KOBİ self-servis yok |
| Ara-katmanlar (Posentegra, SepetTakip...) | POS-bağımsız | Kullandıkça öde | Çekirdek işi | Yok | POS entegrasyonlarının yetersizliğinin kanıtı |

**Çıkarım:** Entegrasyonları çekirdeğe gömüp tek fiyatla satan + tüketici kanalını hediye eden oyuncu pazarı ikiye böler.

## 4) Seçilen Mimari

### 4.1 Ana tez: Tek sipariş omurgası + kanal-adaptör çekirdeği

Tüm sipariş kaynakları (POS, tüketici web, Yemeksepeti, Trendyol GO, Getir) tek `orders` tablosuna düşer. **Kanal bir boyuttur, ayrı sistem değil.** KDS, kurye, raporlama ve stok akışları sıfır değişiklikle tüm kanallara hizmet eder. Platform API'si değişirse (Uber/Trendyol GO konsolidasyonu gibi pazar şokları) sadece adaptör değişir, çekirdek değişmez.

### 4.2 Mevcut koddan devralınan desenler (repo doğrulaması yapıldı)

Referans: `/Users/ufukorta/Downloads/restoranpos-git/supabase/migrations/20260711134708_initial_schema.sql`

- Çok kiracılılık: kompozit FK `(restaurant_id, id)` — tüm yeni tablolar bu desene uyar.
- RLS yardımcıları: `private.is_restaurant_member()`, `private.has_restaurant_role()`.
- Yazma işlemleri: `security definer set search_path = ''` RPC katmanı (20 mevcut RPC).
- Katalog deseni: `subscription_plans` gibi **text-PK seed tablosu** → kanal listesi enum değil, `channels` katalog tablosu olur (yeni kanal = 1 INSERT + 1 adaptör dosyası, enum ALTER gerekmez). *(adapter-first'ten alınan karar)*
- `order_items.product_id` nullable + `product_name not null` → eşleşmemiş 3P ürünleri ham adla taşımaya hazır.
- `restaurant_subscriptions.provider_customer_id / provider_subscription_id` kolonları hazır → iyzico bağlanmaya hazır zemin.
- `deliveries.tracking_token` anon erişim emsali → tüketici sipariş takibi `orders.public_token` ile aynı deseni kullanır. *(marketplace-first'ten alınan karar)*
- `lib/google-maps.ts` (Haversine + Places), `lib/app-routing.ts` + `proxy.ts` (subdomain yönlendirme), `daily_sales` view.

### 4.3 Katmanlar

```
[iyzico webhook]──┐                      ┌──> billing_events (idempotent ledger, service-role)
                  ├─> API route ─────────┤
[3P webhook'lar]──┘                      └──> channel_events (append-only inbox, idempotent)
                                                    │
                                              işleyici (normalize + create_external_order RPC)
                                                    │
POS UI ──> create_order RPC ──────────────> orders (channel_id boyutuyla) ──> KDS / kurye / raporlar
Tüketici PWA ──> place_consumer_order RPC ──┘         │
                                                order_events (timeline)  ──> tüketici takip sayfası (public_token)
                                                email_outbox ──> dispatcher (Vercel Cron route) ──> Resend
```

Kritik tasarım kuralları:
- **Idempotency iki katman:** `unique (provider, external_event_id)` (billing) ve `unique (connection_id, external_event_id)` (kanal). Aynı webhook iki kez gelirse ikincisi `duplicate` loglanır.
- **Sırlar tabloda tutulmaz:** kanal API anahtarları ve webhook imza sırları Supabase Vault'ta; tablolar sadece referans ID taşır.
- **Soft-lock çift kapı:** `private.subscription_allows_writes()` hem yazma RPC'lerinde guard hem de INSERT/UPDATE RLS politikalarında koşul olur — PostgREST tablo endpoint'i kilidi delemez *(jüri bulgusu düzeltmesi)*.
- **Fiyat sunucuda:** tüketici siparişinde tutarlar client'tan alınmaz, RPC içinde DB'den yeniden hesaplanır.
- **E-posta dispatcher'ı tanımlı:** `email_outbox` kuyruğunu Vercel Cron ile tetiklenen bir route handler boşaltır (Edge Function bağımlılığı yok, mevcut Next.js deploy hattı yeter) *(jüri bulgusu düzeltmesi)*.
- **`order_status` enum'una dokunulmaz:** kabul/ret semantiği `accepted_at` / `rejected_reason` kolonlarıyla — migration riski sıfır *(marketplace-first'ten alınan karar)*.

## 5) Faz Planı

### Faz 0 — 48 Saatlik Sprint: "Para musluğunu aç"

Hedef: Trial'ı biten restoran karta abone olabilsin; ödeme webhook'u aboneliği aktive etsin; kilit hard-lock'tan read-only soft-lock'a dönsün.

**Saat 0'da (paralel, bekleme süreleri kritik yolda):**
- iyzico sandbox hesabı açılışını başlat (onay anlık olmayabilir).
- Resend hesabı + domain DKIM/SPF DNS kayıtlarını gir (propagasyon saatler sürebilir).
- Yemeksepeti (integration.yemeksepeti.com) ve Trendyol GO (developers.tgoapps.com) entegrasyon başvurularını gönder; Getir için entegratör görüşmesi başlat (onaylar haftalar sürer — kritik yol). *(adapter-first'ten alınan disiplin)*

| Saat | İş | Doğrulama |
|---|---|---|
| 0–8 | Billing migration'ı: `billing_events`, `subscription_invoices`, `restaurant_subscriptions` kolon eklemeleri, `private.subscription_allows_writes()` + yazma RPC'lerine ve **RLS INSERT/UPDATE politikalarına** gate | `supabase db reset` yeşil; süresi dolmuş abonelikte `create_order` ve doğrudan tablo INSERT beklenen hatayı verir (test) |
| 8–24 | iyzico sandbox: hosted checkout başlatma (server action), callback route, webhook route → `billing_events` idempotent ledger → `activate_subscription` service-role RPC | Test kartıyla ödeme → abonelik `active`; aynı webhook 2. kez → `duplicate` |
| 24–36 | Panel UI: plan seçimi → ödeme → abonelik durumu sayfası; trial kilidini read-only moda çevirme (veri görünür, yazma kapalı, banner + CTA) | Trial'ı bitmiş hesapta raporlar açılır, sipariş girişi engellenir, abone ol akışı uçtan uca |
| 36–48 | `email_outbox` + Cron dispatcher + Resend: ödeme makbuzu ve trial D-3/D-1 şablonları; smoke test + deploy | Kuyruklanan mail gerçek kutuya düşer (DKIM saat 0'da girildiği için hazır) |

Bilinçli olarak 48 saate **girmeyenler:** dunning otomasyonu, plan değişimi/proration, fatura PDF, e-arşiv, kanal migration'ları, tüketici yüzeyi.

### Faz 1 — 2 Hafta: "POS çekirdeği eksiksiz + kanal temeli"

- **Billing olgunlaşması:** dunning (3 deneme + grace period), fatura geçmişi ekranı, plan upgrade/downgrade (dönem sonunda geçiş, proration yok — iyzico kısıtı), webhook replay aracı (ledger'dan yeniden işleme).
- **POS mükemmelliği:** gün sonu / Z-raporu (kasa kapanış RPC'si + `daily_sales` genişletme), iade/void akışı (`payments.status='refunded'` + stok geri alma), parçalı ödeme UX cilası.
- **Kanal temeli (feature flag arkasında):** `channels` katalog tablosu (seed'li), `channel_connections`, `channel_events`, `channel_product_mappings` migration'ları + `orders`'a `channel_id`/`external_ref`/`accepted_at`/`rejected_reason` kolonları; TypeScript `ChannelAdapter` arayüzü + **mock adaptör** — gerçek platform onayı beklenmeden idempotency ve normalizasyon uçtan uca kanıtlanır. *(adapter-first'ten alınan yöntem)*
- **E-posta genişlemesi:** davet e-postaları (`restaurant_invitations` akışına bağla — bugün e-postasız, hazır borç), rezervasyon onayı, sipariş durum bildirimi şablonları.
- **Harita v1:** `delivery_zones` tablosu + panelde polygon çizimi + adres autocomplete (Places, session token'lı).

### Faz 2 — 90 Gün: "Büyüme katmanları"

| Hafta | İş |
|---|---|
| 3–6 | **3P kanal canlı:** Trendyol GO production (açık dev portalı — muhtemelen ilk onaylanan) → Yemeksepeti (onay geldiyse). Menü eşleştirme ekranı + "eşleşmemiş ürünler" kuyruğu, sipariş kabul/ret/hazır statü geri yazımı (outbox/`channel_jobs`), kanal bazlı komisyon girişi + **komisyon sonrası net marj raporu** (`channel_sales` view). Panelde dead-letter listesi + yeniden dene. |
| 5–9 | **Tüketici yüzeyi (white-label PWA):** `siparis.{domain}/{slug}` storefront — `restaurant_storefronts` tablosu, SSR menü, sepet, misafir checkout (ad+telefon+adres), Turnstile, kapıda ödeme + online ödeme (aynı iyzico client'ı), `public_token`'lı sipariş takip sayfası. Siparişler `channel_id='consumer_web'` ile aynı boru hattına düşer. |
| 7–10 | **Kurye/harita derinleşmesi:** kurye PWA'da foreground konum → `deliveries.courier_lat/lng` (kolonlar mevcut), tüketici takip sayfasında canlı harita (Realtime), bölge bazlı teslimat ücreti/min. sepet. |
| 9–12 | **Tedarik + raporlama:** `purchase_orders` akışı (PO oluştur → e-postayla tedarikçiye → mal kabul → `stock_movements('purchase')`), kanal kârlılığı + saatlik satış raporları, `channel_events` retention/arşiv politikası. |
| ~60. gün | **Karar noktası:** Getir (entegratör mü, doğrudan API mi, beklemek mi — kamuya açık portal yok) ve Expo mobil (PWA trafiği verisine göre). 90 gün hedefi **2 canlı 3P kanal**, 3 değil. |

## 6) Gelir Modeli Varsayımları (doğrulanacak)

Jüri eleştirisi gereği açıkça yazılır; rakamlar hipotezdir, Faz 1 sonunda gerçek dönüşüm verisiyle güncellenir.

- Fiyat çıpası: Adisyo Standart (1.540 TL/ay) + paket entegrasyon (+225) + QR (+546) ≈ 2.300 TL/ay eklentili TCO. Bizim "her şey dahil" tek fiyat bu bandın içinde ama eklentisiz konumlanır.
- Faz 0 başarı metriği: trial→paid dönüşümünün sıfırdan >0'a çıkması; ilk 30 günde en az 10 ödeyen hesap.
- Faz 2 upsell hikayesi: 3P kanal + net marj raporu mevcut ödeyen tabana satılır; tüketici sitesi churn kalkanıdır (kendi kanalı olan müşteri POS değiştirmez).

## 7) Risk Listesi

| # | Risk | Olasılık | Etki | Azaltma |
|---|---|---|---|---|
| 1 | 3P onay süreçleri (YS/TGO/Getir) kontrolümüz dışında gecikir | Yüksek | Yüksek | Başvurular saat 0'da; mock adaptör + fikstürlerle çekirdek onay beklemeden kanıtlanır; 90 gün hedefi 2 kanal |
| 2 | Soft-lock delinir (RPC dışı yazma yolu) | Orta | Yüksek | Gate hem RPC hem RLS politikalarında; "kilitli hesap yazamaz" testi CI'da |
| 3 | iyzico sandbox/prod onboarding gecikmesi | Orta | Yüksek | Hesap açılışı saat 0'da; 48 saat hedefi sandbox uçtan uca, prod anahtarı ayrı takvim |
| 4 | Webhook idempotency hatası → çift sipariş/çift tahsilat | Orta | Yüksek | Unique kısıtlar + ledger deseni + tekrar-gönderim testi (aynı payload 2x → tek satır) |
| 5 | DKIM/SPF propagasyonu 48 saat penceresini yer | Orta | Orta | DNS kayıtları saat 0'da girilir; e-posta bloğu sprintin son dilimine konur |
| 6 | Getir'in açık API'sinin olmaması | Yüksek | Orta | 60. gün karar noktası: entegratör (Posentegra tarzı) vs bekleme; adaptör mimarisi iki seçeneğe de hazır |
| 7 | Kanal sırlarının sızması | Düşük | Kritik | Supabase Vault; tablolarda yalnız referans; `credentials_secret_id` kolonlarına column-level grant kısıtı |
| 8 | Tüketici PWA'ya talep gelmemesi (iki taraflı pazar) | Orta | Orta | White-label konumlanma: trafik restoranın kendi müşterisi (QR, kart, sosyal medya); marketplace iddiası 90 gün dışı |
| 9 | Tüketici ödemesinde pazaryeri/alt-üye işyeri regülasyonu | Orta | Yüksek | MVP kapıda ödeme + restoranın kendi iyzico'su; para bizden akmıyorsa lisans yükü yok — hukuk görüşü Faz 2 başında |
| 10 | KVKK: tüketici PII + kurye konum verisi | Orta | Orta | Veri envanteri + aydınlatma metni Faz 2 sertleştirme haftasında; konum yalnız aktif teslimatta |
| 11 | Kapsam kayması: marketplace vizyonu 90 günü işgal eder | Orta | Yüksek | Bu doküman: marketplace açıkça 90 gün dışı; şema kapıyı açık tutar, yol haritası tutmaz |
