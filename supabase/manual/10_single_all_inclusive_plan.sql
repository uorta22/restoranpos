-- Tek 'her şey dahil' plana geçiş.
-- Temel/Standart/Profesyonel kademeleri kaldırılır; 'standard' id'si tüm
-- özellikleri içeren tek aktif plan olur (₺899/ay, ₺8.990/yıl). Varsayılanların
-- (onboarding_sessions.selected_plan_id, signup) 'standard'a bağlı olması nedeniyle
-- id korunur.

begin;

update public.subscription_plans
set
  name = 'Her Şey Dahil',
  description = 'Tüm modüller tek fiyatta: POS, mutfak, teslimat, stok, rezervasyon, raporlar ve 3. parti kanallar. Eklenti yok, komisyon yok.',
  price_monthly = 899,
  price_yearly = 8990,
  features = (select features from public.subscription_plans where id = 'pro'),
  trial_enabled = true,
  trial_days = 14,
  is_active = true
where id = 'standard';

-- Mevcut abonelikleri tek plana taşı (eski kademedeki restoranlar da her şeye erişsin).
update public.restaurant_subscriptions
set plan_id = 'standard'
where plan_id in ('basic', 'pro');

-- Eski kademeleri devre dışı bırak (FK geçmişi için tabloda kalır, yeni kayıt kullanmaz).
update public.subscription_plans
set is_active = false, trial_enabled = false
where id in ('basic', 'pro');

commit;
