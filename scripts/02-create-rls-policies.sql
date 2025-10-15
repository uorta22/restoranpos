-- Enable Row Level Security on all tables
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Restaurants policies
CREATE POLICY "Users can view their own restaurant"
  ON restaurants FOR SELECT
  USING (id IN (SELECT restaurant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins can update their restaurant"
  ON restaurants FOR UPDATE
  USING (id IN (SELECT restaurant_id FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Users policies
CREATE POLICY "Users can view users in their restaurant"
  ON users FOR SELECT
  USING (restaurant_id IN (SELECT restaurant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins can insert users in their restaurant"
  ON users FOR INSERT
  WITH CHECK (restaurant_id IN (SELECT restaurant_id FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager')));

CREATE POLICY "Admins can update users in their restaurant"
  ON users FOR UPDATE
  USING (restaurant_id IN (SELECT restaurant_id FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager')));

-- Categories policies
CREATE POLICY "Users can view categories in their restaurant"
  ON categories FOR SELECT
  USING (restaurant_id IN (SELECT restaurant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Managers can insert categories"
  ON categories FOR INSERT
  WITH CHECK (restaurant_id IN (SELECT restaurant_id FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager')));

CREATE POLICY "Managers can update categories"
  ON categories FOR UPDATE
  USING (restaurant_id IN (SELECT restaurant_id FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager')));

CREATE POLICY "Managers can delete categories"
  ON categories FOR DELETE
  USING (restaurant_id IN (SELECT restaurant_id FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager')));

-- Products policies
CREATE POLICY "Users can view products in their restaurant"
  ON products FOR SELECT
  USING (restaurant_id IN (SELECT restaurant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Managers can insert products"
  ON products FOR INSERT
  WITH CHECK (restaurant_id IN (SELECT restaurant_id FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager')));

CREATE POLICY "Managers can update products"
  ON products FOR UPDATE
  USING (restaurant_id IN (SELECT restaurant_id FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager')));

CREATE POLICY "Managers can delete products"
  ON products FOR DELETE
  USING (restaurant_id IN (SELECT restaurant_id FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager')));

-- Inventory policies
CREATE POLICY "Users can view inventory in their restaurant"
  ON inventory FOR SELECT
  USING (restaurant_id IN (SELECT restaurant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Managers can manage inventory"
  ON inventory FOR ALL
  USING (restaurant_id IN (SELECT restaurant_id FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager')));

-- Suppliers policies
CREATE POLICY "Users can view suppliers in their restaurant"
  ON suppliers FOR SELECT
  USING (restaurant_id IN (SELECT restaurant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Managers can manage suppliers"
  ON suppliers FOR ALL
  USING (restaurant_id IN (SELECT restaurant_id FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager')));

-- Tables policies
CREATE POLICY "Users can view tables in their restaurant"
  ON tables FOR SELECT
  USING (restaurant_id IN (SELECT restaurant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Staff can update table status"
  ON tables FOR UPDATE
  USING (restaurant_id IN (SELECT restaurant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Managers can manage tables"
  ON tables FOR ALL
  USING (restaurant_id IN (SELECT restaurant_id FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager')));

-- Orders policies
CREATE POLICY "Users can view orders in their restaurant"
  ON orders FOR SELECT
  USING (restaurant_id IN (SELECT restaurant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Staff can create orders"
  ON orders FOR INSERT
  WITH CHECK (restaurant_id IN (SELECT restaurant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Staff can update orders"
  ON orders FOR UPDATE
  USING (restaurant_id IN (SELECT restaurant_id FROM users WHERE id = auth.uid()));

-- Order items policies
CREATE POLICY "Users can view order items from their restaurant"
  ON order_items FOR SELECT
  USING (order_id IN (SELECT id FROM orders WHERE restaurant_id IN (SELECT restaurant_id FROM users WHERE id = auth.uid())));

CREATE POLICY "Staff can manage order items"
  ON order_items FOR ALL
  USING (order_id IN (SELECT id FROM orders WHERE restaurant_id IN (SELECT restaurant_id FROM users WHERE id = auth.uid())));

-- Reservations policies
CREATE POLICY "Users can view reservations in their restaurant"
  ON reservations FOR SELECT
  USING (restaurant_id IN (SELECT restaurant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Staff can manage reservations"
  ON reservations FOR ALL
  USING (restaurant_id IN (SELECT restaurant_id FROM users WHERE id = auth.uid()));
