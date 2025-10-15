-- Insert sample restaurant
INSERT INTO restaurants (id, name, address, phone, email) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Demo Restaurant', '123 Main St, İstanbul', '+90 212 123 4567', 'info@demorestaurant.com')
ON CONFLICT (id) DO NOTHING;

-- Insert subscription plans
INSERT INTO subscription_plans (id, name, description, price, billing_cycle, max_users, max_tables, features) VALUES
  ('10000000-0000-0000-0000-000000000001', 'Ücretsiz', 'Başlangıç için ideal', 0.00, 'monthly', 3, 5, '{"reports": false, "inventory": false, "delivery": false}'),
  ('10000000-0000-0000-0000-000000000002', 'Temel', 'Küçük işletmeler için', 299.00, 'monthly', 10, 20, '{"reports": true, "inventory": true, "delivery": false}'),
  ('10000000-0000-0000-0000-000000000003', 'Profesyonel', 'Büyüyen işletmeler için', 599.00, 'monthly', 25, 50, '{"reports": true, "inventory": true, "delivery": true}'),
  ('10000000-0000-0000-0000-000000000004', 'Kurumsal', 'Büyük restoranlar için', 999.00, 'monthly', NULL, NULL, '{"reports": true, "inventory": true, "delivery": true, "multi_location": true}')
ON CONFLICT (id) DO NOTHING;

-- Insert sample categories
INSERT INTO categories (id, name, description, restaurant_id) VALUES
  ('20000000-0000-0000-0000-000000000001', 'Ana Yemekler', 'Et ve tavuk yemekleri', '00000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000002', 'Mezeler', 'Soğuk ve sıcak mezeler', '00000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000003', 'Salatalar', 'Taze salatalar', '00000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000004', 'İçecekler', 'Soğuk ve sıcak içecekler', '00000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000005', 'Tatlılar', 'Ev yapımı tatlılar', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- Insert sample products
INSERT INTO products (id, name, description, price, category_id, restaurant_id, is_available) VALUES
  ('30000000-0000-0000-0000-000000000001', 'Izgara Köfte', 'Özel baharatlarla hazırlanmış', 120.00, '20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', true),
  ('30000000-0000-0000-0000-000000000002', 'Tavuk Şiş', 'Marine edilmiş tavuk göğsü', 100.00, '20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', true),
  ('30000000-0000-0000-0000-000000000003', 'Humus', 'Ev yapımı humus', 35.00, '20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', true),
  ('30000000-0000-0000-0000-000000000004', 'Çoban Salata', 'Taze mevsim sebzeleri', 40.00, '20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', true),
  ('30000000-0000-0000-0000-000000000005', 'Ayran', 'Ev yapımı ayran', 15.00, '20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', true),
  ('30000000-0000-0000-0000-000000000006', 'Baklava', 'Antep fıstıklı baklava', 60.00, '20000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', true)
ON CONFLICT (id) DO NOTHING;

-- Insert sample tables
INSERT INTO tables (id, table_number, capacity, status, restaurant_id) VALUES
  ('40000000-0000-0000-0000-000000000001', 1, 4, 'available', '00000000-0000-0000-0000-000000000001'),
  ('40000000-0000-0000-0000-000000000002', 2, 2, 'available', '00000000-0000-0000-0000-000000000001'),
  ('40000000-0000-0000-0000-000000000003', 3, 6, 'available', '00000000-0000-0000-0000-000000000001'),
  ('40000000-0000-0000-0000-000000000004', 4, 4, 'available', '00000000-0000-0000-0000-000000000001'),
  ('40000000-0000-0000-0000-000000000005', 5, 8, 'available', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (table_number, restaurant_id) DO NOTHING;
