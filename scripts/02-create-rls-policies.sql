-- Enable Row Level Security on all tables
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's restaurant_id
CREATE OR REPLACE FUNCTION get_user_restaurant_id()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT restaurant_id FROM users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Restaurants policies
CREATE POLICY "Users can view their own restaurant"
  ON restaurants FOR SELECT
  USING (id = get_user_restaurant_id());

CREATE POLICY "Admins can update their restaurant"
  ON restaurants FOR UPDATE
  USING (id = get_user_restaurant_id() AND EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Users policies
CREATE POLICY "Users can view users in their restaurant"
  ON users FOR SELECT
  USING (restaurant_id = get_user_restaurant_id());

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Admins can manage users"
  ON users FOR ALL
  USING (restaurant_id = get_user_restaurant_id() AND EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager')
  ));

-- Categories policies
CREATE POLICY "Users can view categories in their restaurant"
  ON categories FOR SELECT
  USING (restaurant_id = get_user_restaurant_id());

CREATE POLICY "Managers can manage categories"
  ON categories FOR ALL
  USING (restaurant_id = get_user_restaurant_id() AND EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager')
  ));

-- Products policies
CREATE POLICY "Users can view products in their restaurant"
  ON products FOR SELECT
  USING (restaurant_id = get_user_restaurant_id());

CREATE POLICY "Managers can manage products"
  ON products FOR ALL
  USING (restaurant_id = get_user_restaurant_id() AND EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager')
  ));

-- Tables policies
CREATE POLICY "Users can view tables in their restaurant"
  ON tables FOR SELECT
  USING (restaurant_id = get_user_restaurant_id());

CREATE POLICY "Staff can manage tables"
  ON tables FOR ALL
  USING (restaurant_id = get_user_restaurant_id());

-- Orders policies
CREATE POLICY "Users can view orders in their restaurant"
  ON orders FOR SELECT
  USING (restaurant_id = get_user_restaurant_id());

CREATE POLICY "Staff can create orders"
  ON orders FOR INSERT
  WITH CHECK (restaurant_id = get_user_restaurant_id());

CREATE POLICY "Staff can update orders"
  ON orders FOR UPDATE
  USING (restaurant_id = get_user_restaurant_id());

CREATE POLICY "Admins can delete orders"
  ON orders FOR DELETE
  USING (restaurant_id = get_user_restaurant_id() AND EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager')
  ));

-- Inventory policies
CREATE POLICY "Users can view inventory in their restaurant"
  ON inventory FOR SELECT
  USING (restaurant_id = get_user_restaurant_id());

CREATE POLICY "Managers can manage inventory"
  ON inventory FOR ALL
  USING (restaurant_id = get_user_restaurant_id() AND EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager')
  ));

-- Suppliers policies
CREATE POLICY "Users can view suppliers in their restaurant"
  ON suppliers FOR SELECT
  USING (restaurant_id = get_user_restaurant_id());

CREATE POLICY "Managers can manage suppliers"
  ON suppliers FOR ALL
  USING (restaurant_id = get_user_restaurant_id() AND EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager')
  ));

-- Reservations policies
CREATE POLICY "Users can view reservations in their restaurant"
  ON reservations FOR SELECT
  USING (restaurant_id = get_user_restaurant_id());

CREATE POLICY "Staff can manage reservations"
  ON reservations FOR ALL
  USING (restaurant_id = get_user_restaurant_id());

-- Analytics policies
CREATE POLICY "Users can view analytics for their restaurant"
  ON analytics FOR SELECT
  USING (restaurant_id = get_user_restaurant_id());

CREATE POLICY "System can manage analytics"
  ON analytics FOR ALL
  USING (restaurant_id = get_user_restaurant_id());
