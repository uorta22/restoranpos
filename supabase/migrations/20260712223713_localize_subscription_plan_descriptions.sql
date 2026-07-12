update public.subscription_plans
set description = case id
  when 'basic' then 'Küçük restoranlar için temel POS özellikleri'
  when 'standard' then 'Büyüyen restoranlar için operasyon ve stok yönetimi'
  when 'pro' then 'Teslimat ve gelişmiş raporlama dahil tüm özellikler'
  else description
end
where id in ('basic', 'standard', 'pro');
