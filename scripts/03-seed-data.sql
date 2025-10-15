-- Insert a demo restaurant
INSERT INTO restaurants (id, name, address, phone, email) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Demo Restaurant', 'Kadıköy, Istanbul, Turkey', '+90 555 123 4567', 'info@demo-restaurant.com')
ON CONFLICT (id) DO NOTHING;

-- Insert demo users (password for all: demo123)
-- Note: You'll need to hash these passwords properly in production
-- Using bcrypt: $2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
INSERT INTO users (id, email, password_hash, name, role, restaurant_id, is_verified) VALUES
  ('22222222-2222-2222-2222-222222222222', 'admin@demo.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin User', 'admin', '11111111-1111-1111-1111-111111111111', true),
  ('33333333-3333-3333-3333-333333333333', 'manager@demo.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Manager User', 'manager', '11111111-1111-1111-1111-111111111111', true),
  ('44444444-4444-4444-4444-444444444444', 'waiter@demo.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Garson Ali', 'waiter', '11111111-1111-1111-1111-111111111111', true),
  ('55555555-5555-5555-5555-555555555555', 'kitchen@demo.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Şef Mehmet', 'kitchen', '11111111-1111-1111-1111-111111111111', true)
ON CONFLICT (email) DO NOTHING;

-- Insert demo categories
INSERT INTO categories (id, name, restaurant_id) VALUES
  ('c1111111-1111-1111-1111-111111111111', 'Başlangıçlar', '11111111-1111-1111-1111-111111111111'),
  ('c2222222-2222-2222-2222-222222222222', 'Ana Yemekler', '11111111-1111-1111-1111-111111111111'),
  ('c3333333-3333-3333-3333-333333333333', 'Salatalar', '11111111-1111-1111-1111-111111111111'),
  ('c4444444-4444-4444-4444-444444444444', 'Tatlılar', '11111111-1111-1111-1111-111111111111'),
  ('c5555555-5555-5555-5555-555555555555', 'İçecekler', '11111111-1111-1111-1111-111111111111')
ON CONFLICT DO NOTHING;

-- Insert demo products
INSERT INTO products (id, name, description, price, category_id, restaurant_id, is_available, type, stock) 
VALUES 
    ('p1111111-1111-1111-1111-111111111111', 'Mercimek Çorbası', 'Geleneksel kırmızı mercimek çorbası', 45.00, 'c1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', true, 'Vejeteryan', 50),
    ('p2222222-2222-2222-2222-222222222222', 'Humus', 'Nohut ezmesi, zeytinyağlı', 55.00, 'c1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', true, 'Vejeteryan', 30),
    ('p3333333-3333-3333-3333-333333333333', 'Izgara Köfte', 'Özel baharatlarla hazırlanmış ızgara köfte', 180.00, 'c2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', true, 'Et', 40),
    ('p4444444-4444-4444-4444-444444444444', 'Tavuk Şiş', 'Marine edilmiş ızgara tavuk', 160.00, 'c2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', true, 'Et', 35),
    ('p5555555-5555-5555-5555-555555555555', 'Çoban Salata', 'Taze mevsim sebzeleri', 65.00, 'c3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', true, 'Vejeteryan', 25),
    ('p6666666-6666-6666-6666-666666666666', 'Baklava', 'Antep fıstıklı baklava', 85.00, 'c4444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', true, 'Vejeteryan', 20),
    ('p7777777-7777-7777-7777-777777777777', 'Künefe', 'Sıcak künefe, kaymak', 95.00, 'c4444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', true, 'Vejeteryan', 15),
    ('p8888888-8888-8888-8888-888888888888', 'Çay', 'Demli çay', 15.00, 'c5555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', true, 'Vejeteryan', 100),
    ('p9999999-9999-9999-9999-999999999999', 'Ayran', 'Ev yapımı ayran', 20.00, 'c5555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', true, 'Vejeteryan', 80)
ON CONFLICT DO NOTHING;

-- Insert demo tables
INSERT INTO tables (id, number, capacity, status, section, restaurant_id, position_x, position_y) VALUES
  ('t1111111-1111-1111-1111-111111111111', '1', 4, 'Müsait', 'İç Salon', '11111111-1111-1111-1111-111111111111', 100, 100),
  ('t2222222-2222-2222-2222-222222222222', '2', 4, 'Müsait', 'İç Salon', '11111111-1111-1111-1111-111111111111', 300, 100),
  ('t3333333-3333-3333-3333-333333333333', '3', 6, 'Müsait', 'İç Salon', '11111111-1111-1111-1111-111111111111', 100, 300),
  ('t4444444-4444-4444-4444-444444444444', '4', 2, 'Müsait', 'Bahçe', '11111111-1111-1111-1111-111111111111', 300, 300),
  ('t5555555-5555-5555-5555-555555555555', '5', 8, 'Müsait', 'Bahçe', '11111111-1111-1111-1111-111111111111', 500, 100)
ON CONFLICT DO NOTHING;

-- Insert demo suppliers
INSERT INTO suppliers (id, name, contact_name, phone, email, restaurant_id)
VALUES 
    ('s1111111-1111-1111-1111-111111111111', 'Et ve Tavuk A.Ş.', 'Ahmet Yılmaz', '+90 555 111 2222', 'ahmet@ettavuk.com', '11111111-1111-1111-1111-111111111111'),
    ('s2222222-2222-2222-2222-222222222222', 'Sebze Meyve Ltd.', 'Mehmet Demir', '+90 555 333 4444', 'mehmet@sebze.com', '11111111-1111-1111-1111-111111111111'),
    ('s3333333-3333-3333-3333-333333333333', 'Tatlı Dünyası', 'Ayşe Kaya', '+90 555 555 6666', 'ayse@tatli.com', '11111111-1111-1111-1111-111111111111')
ON CONFLICT DO NOTHING;

-- Insert demo inventory entries
INSERT INTO inventory (product_id, current_stock, min_stock, max_stock, unit, restaurant_id)
SELECT id, stock, 10, 100, 'adet', restaurant_id
FROM products
WHERE restaurant_id = '11111111-1111-1111-1111-111111111111'
ON CONFLICT DO NOTHING;
