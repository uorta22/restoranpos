-- Enable Row Level Security on all tables
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;

-- Create a helper function to get current user's restaurant_id
CREATE OR REPLACE FUNCTION get_user_restaurant_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT restaurant_id 
    FROM users 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for restaurants table
CREATE POLICY "Users can view their own restaurant"
  ON restaurants FOR SELECT
  USING (id = get_user_restaurant_id());

CREATE POLICY "Admins can update their restaurant"
  ON restaurants FOR UPDATE
  USING (
    id = get_user_restaurant_id() AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'Yönetici'
    )
  );

-- RLS Policies for users table
CREATE POLICY "Users can view users in their restaurant"
  ON users FOR SELECT
  USING (restaurant_id = get_user_restaurant_id());

CREATE POLICY "Admins can manage users in their restaurant"
  ON users FOR ALL
  USING (
    restaurant_id = get_user_restaurant_id() AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'Yönetici'
    )
  );

-- RLS Policies for categories table
CREATE POLICY "Users can view categories in their restaurant"
  ON categories FOR SELECT
  USING (restaurant_id = get_user_restaurant_id());

CREATE POLICY "Admins can manage categories in their restaurant"
  ON categories FOR ALL
  USING (
    restaurant_id = get_user_restaurant_id() AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('Yönetici', 'Şef')
    )
  );

-- RLS Policies for products table
CREATE POLICY "Users can view products in their restaurant"
  ON products FOR SELECT
  USING (restaurant_id = get_user_restaurant_id());

CREATE POLICY "Admins and chefs can manage products"
  ON products FOR ALL
  USING (
    restaurant_id = get_user_restaurant_id() AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('Yönetici', 'Şef')
    )
  );

-- RLS Policies for tables
CREATE POLICY "Users can view tables in their restaurant"
  ON tables FOR SELECT
  USING (restaurant_id = get_user_restaurant_id());

CREATE POLICY "Staff can manage tables"
  ON tables FOR ALL
  USING (
    restaurant_id = get_user_restaurant_id() AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('Yönetici', 'Garson')
    )
  );

-- RLS Policies for orders
CREATE POLICY "Users can view orders in their restaurant"
  ON orders FOR SELECT
  USING (restaurant_id = get_user_restaurant_id());

CREATE POLICY "Staff can create orders"
  ON orders FOR INSERT
  WITH CHECK (
    restaurant_id = get_user_restaurant_id() AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid()
    )
  );

CREATE POLICY "Staff can update orders"
  ON orders FOR UPDATE
  USING (
    restaurant_id = get_user_restaurant_id() AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid()
    )
  );

-- RLS Policies for order_items
CREATE POLICY "Users can view order items in their restaurant"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.restaurant_id = get_user_restaurant_id()
    )
  );

CREATE POLICY "Staff can manage order items"
  ON order_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.restaurant_id = get_user_restaurant_id()
    )
  );

-- RLS Policies for suppliers
CREATE POLICY "Users can view suppliers in their restaurant"
  ON suppliers FOR SELECT
  USING (restaurant_id = get_user_restaurant_id());

CREATE POLICY "Admins can manage suppliers"
  ON suppliers FOR ALL
  USING (
    restaurant_id = get_user_restaurant_id() AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'Yönetici'
    )
  );

-- RLS Policies for inventory
CREATE POLICY "Users can view inventory in their restaurant"
  ON inventory FOR SELECT
  USING (restaurant_id = get_user_restaurant_id());

CREATE POLICY "Admins and chefs can manage inventory"
  ON inventory FOR ALL
  USING (
    restaurant_id = get_user_restaurant_id() AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('Yönetici', 'Şef')
    )
  );

-- RLS Policies for reservations
CREATE POLICY "Users can view reservations in their restaurant"
  ON reservations FOR SELECT
  USING (restaurant_id = get_user_restaurant_id());

CREATE POLICY "Staff can manage reservations"
  ON reservations FOR ALL
  USING (
    restaurant_id = get_user_restaurant_id() AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('Yönetici', 'Garson')
    )
  );

-- RLS Policies for subscription_plans (public read)
CREATE POLICY "Anyone can view subscription plans"
  ON subscription_plans FOR SELECT
  TO public
  USING (true);

-- RLS Policies for user_subscriptions
CREATE POLICY "Users can view their own subscription"
  ON user_subscriptions FOR SELECT
  USING (user_id = auth.uid());

-- RLS Policies for otp_codes
CREATE POLICY "Users can view their own OTP codes"
  ON otp_codes FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Service role can manage OTP codes"
  ON otp_codes FOR ALL
  USING (true);
