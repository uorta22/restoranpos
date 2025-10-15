-- Insert a demo restaurant
INSERT INTO restaurants (id, name, address, phone, email) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'Demo Restaurant', '123 Main St, Istanbul', '+90 212 555 0100', 'info@demorestaurant.com')
ON CONFLICT DO NOTHING;

-- Insert demo users (password: demo123 for all)
-- Note: In production, use bcrypt hashed passwords
INSERT INTO users (id, email, password_hash, name, role, restaurant_id, is_email_verified) VALUES
  ('660e8400-e29b-41d4-a716-446655440001', 'admin@demo.com', '$2a$10$rBV2KU6P3VVZDXhNjKJZ0.ZP4gVYYXXKJv7rKxKXZXBPLV5XKZXK.', 'Admin User', 'admin', '550e8400-e29b-41d4-a716-446655440000', true),
  ('660e8400-e29b-41d4-a716-446655440002', 'manager@demo.com', '$2a$10$rBV2KU6P3VVZDXhNjKJZ0.ZP4gVYYXXKJv7rKxKXZXBPLV5XKZXK.', 'Manager User', 'manager', '550e8400-e29b-41d4-a716-446655440000', true),
  ('660e8400-e29b-41d4-a716-446655440003', 'waiter@demo.com', '$2a$10$rBV2KU6P3VVZDXhNjKJZ0.ZP4gVYYXXKJv7rKxKXZXBPLV5XKZXK.', 'Waiter User', 'waiter', '550e8400-e29b-41d4-a716-446655440000', true),
  ('660e8400-e29b-41d4-a716-446655440004', 'kitchen@demo.com', '$2a$10$rBV2KU6P3VVZDXhNjKJZ0.ZP4gVYYXXKJv7rKxKXZXBPLV5XKZXK.', 'Kitchen User', 'kitchen', '550e8400-e29b-41d4-a716-446655440000', true)
ON CONFLICT DO NOTHING;

-- Insert demo categories
INSERT INTO categories (name, restaurant_id) VALUES
  ('Burgers', '550e8400-e29b-41d4-a716-446655440000'),
  ('Pizza', '550e8400-e29b-41d4-a716-446655440000'),
  ('Salads', '550e8400-e29b-41d4-a716-446655440000'),
  ('Beverages', '550e8400-e29b-41d4-a716-446655440000'),
  ('Desserts', '550e8400-e29b-41d4-a716-446655440000')
ON CONFLICT DO NOTHING;

-- Insert demo products
INSERT INTO products (name, description, price, category_id, restaurant_id, is_available) 
SELECT 
  'Classic Burger', 
  'Beef patty with lettuce, tomato, and cheese', 
  89.90, 
  id, 
  '550e8400-e29b-41d4-a716-446655440000', 
  true 
FROM categories WHERE name = 'Burgers' AND restaurant_id = '550e8400-e29b-41d4-a716-446655440000' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO products (name, description, price, category_id, restaurant_id, is_available) 
SELECT 
  'Margherita Pizza', 
  'Classic pizza with mozzarella and basil', 
  129.90, 
  id, 
  '550e8400-e29b-41d4-a716-446655440000', 
  true 
FROM categories WHERE name = 'Pizza' AND restaurant_id = '550e8400-e29b-41d4-a716-446655440000' LIMIT 1
ON CONFLICT DO NOTHING;

-- Insert demo tables
INSERT INTO tables (table_number, capacity, status, x_position, y_position, restaurant_id) VALUES
  (1, 4, 'available', 100, 100, '550e8400-e29b-41d4-a716-446655440000'),
  (2, 2, 'available', 300, 100, '550e8400-e29b-41d4-a716-446655440000'),
  (3, 6, 'available', 100, 300, '550e8400-e29b-41d4-a716-446655440000'),
  (4, 4, 'available', 300, 300, '550e8400-e29b-41d4-a716-446655440000')
ON CONFLICT DO NOTHING;
