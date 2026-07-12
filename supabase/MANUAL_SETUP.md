# Supabase Manuel Kurulum

SQL komutları **Table Editor** yerine Supabase panelindeki **SQL Editor** bölümünde çalıştırılmalıdır.

## 1. Mevcut durumu kontrol et

Önce `manual/00_check_installation_state.sql` dosyasını çalıştır.

- `FRESH`: Veritabanı boş. Aşağıdaki dört migration dosyasını sırayla çalıştır.
- `INSTALLED`: Şema daha önce kurulmuş. Migration dosyalarını yeniden çalıştırma; doğrudan doğrulama adımına geç.
- `PARTIAL`: Kurulum yarım kalmış veya eski şema bulunuyor. Devam etmeden önce sonuçtaki `missing_tables` listesini incele.

## 2. Migration dosyalarını sırayla çalıştır

Yalnızca durum `FRESH` ise her dosyayı ayrı bir SQL Editor sorgusu olarak çalıştır:

1. `migrations/20260711134708_initial_schema.sql`
2. `migrations/20260712191631_harden_rpc_type_checks.sql`
3. `migrations/20260712192401_add_operational_notifications.sql`
4. `migrations/20260712223713_localize_subscription_plan_descriptions.sql`

Bir dosya hata verirse sonraki dosyaya geçme. Hata mesajı ve çalıştırılan dosya adı birlikte incelenmelidir.

## 3. Kurulumu doğrula

`manual/05_verify_installation.sql` dosyasını çalıştır. Sonuçtaki bütün satırların `status` değeri `OK` olmalıdır. `FAIL` veya `MISSING` varsa uygulamayı kullanmaya başlamadan önce düzeltilmelidir.

## 4. Auth ayarları

Supabase panelinde Authentication ayarlarını şu şekilde yapılandır:

- E-posta ile kayıt açık.
- E-posta doğrulaması açık.
- Minimum parola uzunluğu en az 8.
- Parola kuralı büyük harf, küçük harf ve rakam içeriyor.
- Geliştirmede Site URL: `http://localhost:3000`.
- Geliştirmede Redirect URL: `http://localhost:3000/**`.
- Canlıya geçerken localhost adreslerini gerçek HTTPS alan adıyla birlikte güncelle.

## 5. Uygulama ortamı

`.env.example` dosyasını temel alarak `.env.local` oluştur ve yalnızca şu tarayıcı ayarlarını gir:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_APP_URL`
- İsteğe bağlı `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

Database parolası, secret key veya service-role key uygulamanın `.env.local` dosyasına eklenmemelidir. Bu proje tarayıcıdan yalnızca publishable key kullanır; veri erişimi RLS ve güvenli RPC fonksiyonlarıyla sınırlandırılır.
