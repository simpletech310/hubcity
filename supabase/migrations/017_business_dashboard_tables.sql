-- ============================================================
-- Hub City App — Business Dashboard Tables
-- Menu items, orders, bookings, services, Stripe accounts
-- ============================================================

-- ============================================================
-- ADD MISSING COLUMNS TO BUSINESSES
-- ============================================================
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS accepts_orders BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS accepts_bookings BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS delivery_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS delivery_radius INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS min_order INTEGER DEFAULT 0;

-- ============================================================
-- MENU ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  category TEXT DEFAULT 'Main',
  sort_order INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_menu_items_business ON menu_items(business_id);
CREATE INDEX idx_menu_items_category ON menu_items(business_id, category);

CREATE TRIGGER menu_items_updated_at
  BEFORE UPDATE ON menu_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- Anyone can view menu items for published businesses
CREATE POLICY "menu_items_public_read" ON menu_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM businesses WHERE id = menu_items.business_id AND is_published = TRUE)
  );

-- Business owner can manage their menu
CREATE POLICY "menu_items_owner_all" ON menu_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM businesses WHERE id = menu_items.business_id AND owner_id = auth.uid())
  );

-- ============================================================
-- ORDERS (business food/product orders, NOT ticket_orders)
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES profiles(id),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'delivered', 'cancelled')),
  type TEXT NOT NULL DEFAULT 'pickup'
    CHECK (type IN ('pickup', 'delivery')),
  subtotal INTEGER NOT NULL DEFAULT 0,
  platform_fee INTEGER NOT NULL DEFAULT 0,
  tax INTEGER NOT NULL DEFAULT 0,
  tip INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  stripe_payment_intent_id TEXT,
  delivery_address TEXT,
  delivery_notes TEXT,
  estimated_ready_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_business ON orders(business_id);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(business_id, status);
CREATE INDEX idx_orders_created ON orders(business_id, created_at DESC);

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Customer can view their own orders
CREATE POLICY "orders_customer_read" ON orders
  FOR SELECT USING (customer_id = auth.uid());

-- Business owner can view/update their orders
CREATE POLICY "orders_owner_read" ON orders
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM businesses WHERE id = orders.business_id AND owner_id = auth.uid())
  );

CREATE POLICY "orders_owner_update" ON orders
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM businesses WHERE id = orders.business_id AND owner_id = auth.uid())
  );

-- Authenticated users can create orders
CREATE POLICY "orders_create" ON orders
  FOR INSERT WITH CHECK (customer_id = auth.uid());

-- ============================================================
-- ORDER ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  price INTEGER NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 1,
  special_instructions TEXT
);

CREATE INDEX idx_order_items_order ON order_items(order_id);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Same access as parent order
CREATE POLICY "order_items_customer_read" ON order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE id = order_items.order_id AND customer_id = auth.uid())
  );

CREATE POLICY "order_items_owner_read" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders o
      JOIN businesses b ON b.id = o.business_id
      WHERE o.id = order_items.order_id AND b.owner_id = auth.uid()
    )
  );

CREATE POLICY "order_items_create" ON order_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM orders WHERE id = order_items.order_id AND customer_id = auth.uid())
  );

-- ============================================================
-- SERVICES (for bookable businesses: barbers, beauty, etc.)
-- ============================================================
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER DEFAULT 0,
  duration INTEGER DEFAULT 30,
  is_available BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_services_business ON services(business_id);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "services_public_read" ON services
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM businesses WHERE id = services.business_id AND is_published = TRUE)
  );

CREATE POLICY "services_owner_all" ON services
  FOR ALL USING (
    EXISTS (SELECT 1 FROM businesses WHERE id = services.business_id AND owner_id = auth.uid())
  );

-- ============================================================
-- TIME SLOTS (availability schedule for bookings)
-- ============================================================
CREATE TABLE IF NOT EXISTS time_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_duration INTEGER DEFAULT 30,
  max_bookings INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_time_slots_business ON time_slots(business_id);

ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "time_slots_public_read" ON time_slots
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM businesses WHERE id = time_slots.business_id AND is_published = TRUE)
  );

CREATE POLICY "time_slots_owner_all" ON time_slots
  FOR ALL USING (
    EXISTS (SELECT 1 FROM businesses WHERE id = time_slots.business_id AND owner_id = auth.uid())
  );

-- ============================================================
-- BOOKINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES profiles(id),
  service_name TEXT NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')),
  price INTEGER,
  stripe_payment_intent_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bookings_business ON bookings(business_id);
CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_bookings_date ON bookings(business_id, date);
CREATE INDEX idx_bookings_status ON bookings(business_id, status);

CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bookings_customer_read" ON bookings
  FOR SELECT USING (customer_id = auth.uid());

CREATE POLICY "bookings_owner_read" ON bookings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM businesses WHERE id = bookings.business_id AND owner_id = auth.uid())
  );

CREATE POLICY "bookings_owner_update" ON bookings
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM businesses WHERE id = bookings.business_id AND owner_id = auth.uid())
  );

CREATE POLICY "bookings_create" ON bookings
  FOR INSERT WITH CHECK (customer_id = auth.uid());

-- ============================================================
-- STRIPE ACCOUNTS (Stripe Connect for business payouts)
-- ============================================================
CREATE TABLE IF NOT EXISTS stripe_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL UNIQUE REFERENCES businesses(id) ON DELETE CASCADE,
  stripe_account_id TEXT NOT NULL,
  onboarding_complete BOOLEAN DEFAULT FALSE,
  charges_enabled BOOLEAN DEFAULT FALSE,
  payouts_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stripe_accounts_business ON stripe_accounts(business_id);

CREATE TRIGGER stripe_accounts_updated_at
  BEFORE UPDATE ON stripe_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE stripe_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stripe_accounts_owner_read" ON stripe_accounts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM businesses WHERE id = stripe_accounts.business_id AND owner_id = auth.uid())
  );

-- ============================================================
-- BUSINESS CUSTOMERS (CRM tracking)
-- ============================================================
CREATE TABLE IF NOT EXISTS business_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES profiles(id),
  total_orders INTEGER DEFAULT 0,
  total_bookings INTEGER DEFAULT 0,
  total_spent INTEGER DEFAULT 0,
  first_visit TIMESTAMPTZ DEFAULT NOW(),
  last_visit TIMESTAMPTZ DEFAULT NOW(),
  tags TEXT[] DEFAULT '{}',
  UNIQUE(business_id, customer_id)
);

CREATE INDEX idx_business_customers_business ON business_customers(business_id);
CREATE INDEX idx_business_customers_customer ON business_customers(customer_id);

ALTER TABLE business_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "business_customers_owner_read" ON business_customers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM businesses WHERE id = business_customers.business_id AND owner_id = auth.uid())
  );

CREATE POLICY "business_customers_insert" ON business_customers
  FOR INSERT WITH CHECK (customer_id = auth.uid());

CREATE POLICY "business_customers_update" ON business_customers
  FOR UPDATE USING (customer_id = auth.uid());

-- ============================================================
-- RE-SEED MENU ITEMS INTO THE NEW TABLE
-- (Migration 016 tried to insert but table didn't exist yet)
-- ============================================================
-- Billionaire Burger Boyz
INSERT INTO menu_items (business_id, name, description, price, category, sort_order, is_available)
SELECT b.id, v.name, v.description, v.price, v.category, v.sort_order, true
FROM businesses b,
(VALUES
  ('The OG Burger', 'Signature smash burger with secret sauce, lettuce, tomato, pickles', 1299, 'Burgers', 1),
  ('Double Stack', 'Double patty with American cheese, grilled onions, special sauce', 1599, 'Burgers', 2),
  ('Billionaire Burger', 'Premium wagyu blend, truffle aioli, aged cheddar, brioche bun', 1999, 'Burgers', 3),
  ('Bacon BBQ Burger', 'Thick-cut bacon, BBQ sauce, cheddar, crispy onion rings', 1699, 'Burgers', 4),
  ('Mushroom Swiss', 'Sautéed mushrooms, Swiss cheese, garlic aioli', 1499, 'Burgers', 5),
  ('Chicken Sandwich', 'Crispy fried chicken, coleslaw, pickles, spicy mayo', 1399, 'Sandwiches', 6),
  ('Loaded Fries', 'Seasoned fries with cheese sauce, bacon bits, green onions', 899, 'Sides', 7),
  ('Sweet Potato Fries', 'Crispy sweet potato fries with chipotle ranch', 699, 'Sides', 8),
  ('Milkshake', 'Hand-spun milkshake — vanilla, chocolate, or strawberry', 799, 'Drinks', 9),
  ('Fresh Lemonade', 'House-made lemonade with real lemons', 499, 'Drinks', 10)
) AS v(name, description, price, category, sort_order)
WHERE b.slug = 'billionaire-burger-boyz'
ON CONFLICT DO NOTHING;

-- Tacos El Poblano
INSERT INTO menu_items (business_id, name, description, price, category, sort_order, is_available)
SELECT b.id, v.name, v.description, v.price, v.category, v.sort_order, true
FROM businesses b,
(VALUES
  ('Street Tacos (3)', 'Choice of carne asada, al pastor, or carnitas on corn tortillas', 899, 'Tacos', 1),
  ('Birria Tacos (3)', 'Slow-braised beef birria, melted cheese, consommé for dipping', 1199, 'Tacos', 2),
  ('Burrito Supreme', 'Loaded burrito with rice, beans, meat, cheese, sour cream', 1099, 'Burritos', 3),
  ('California Burrito', 'Carne asada, fries, cheese, guacamole, sour cream', 1199, 'Burritos', 4),
  ('Quesadilla', 'Flour tortilla with melted cheese and choice of meat', 999, 'Specialties', 5),
  ('Nachos Supreme', 'Chips loaded with beans, meat, cheese, jalapeños, sour cream', 1099, 'Specialties', 6),
  ('Horchata', 'Traditional Mexican rice drink', 399, 'Drinks', 7),
  ('Agua Fresca', 'Jamaica, tamarindo, or mango', 399, 'Drinks', 8)
) AS v(name, description, price, category, sort_order)
WHERE b.slug = 'tacos-el-poblano'
ON CONFLICT DO NOTHING;

-- Louis Burgers II
INSERT INTO menu_items (business_id, name, description, price, category, sort_order, is_available)
SELECT b.id, v.name, v.description, v.price, v.category, v.sort_order, true
FROM businesses b,
(VALUES
  ('Cheeseburger', 'Classic cheeseburger with all the fixings', 799, 'Burgers', 1),
  ('Double Cheeseburger', 'Two patties, double cheese', 1099, 'Burgers', 2),
  ('Pastrami Burger', 'Burger topped with hot pastrami and Swiss', 1199, 'Burgers', 3),
  ('Chili Cheese Fries', 'Fries smothered in chili and nacho cheese', 699, 'Sides', 4),
  ('Onion Rings', 'Crispy battered onion rings', 499, 'Sides', 5),
  ('Fish & Chips', 'Beer-battered fish with fries and tartar sauce', 1099, 'Seafood', 6)
) AS v(name, description, price, category, sort_order)
WHERE b.slug = 'louis-burgers-ii'
ON CONFLICT DO NOTHING;

-- Tam's Burgers
INSERT INTO menu_items (business_id, name, description, price, category, sort_order, is_available)
SELECT b.id, v.name, v.description, v.price, v.category, v.sort_order, true
FROM businesses b,
(VALUES
  ('Tam''s Famous Burger', 'Quarter pound burger with special seasoning', 699, 'Burgers', 1),
  ('Pastrami Sandwich', 'Hot pastrami on a hoagie with mustard', 899, 'Sandwiches', 2),
  ('Chicken Wings (6pc)', 'Crispy fried chicken wings', 799, 'Chicken', 3),
  ('Philly Cheesesteak', 'Sliced steak with peppers, onions, melted cheese', 999, 'Sandwiches', 4),
  ('Chili Cheese Dog', 'All-beef hot dog with chili and cheese', 599, 'Hot Dogs', 5)
) AS v(name, description, price, category, sort_order)
WHERE b.slug = 'tams-burgers-compton'
ON CONFLICT DO NOTHING;

-- Original Taco Pete
INSERT INTO menu_items (business_id, name, description, price, category, sort_order, is_available)
SELECT b.id, v.name, v.description, v.price, v.category, v.sort_order, true
FROM businesses b,
(VALUES
  ('Pete''s Famous Taco', 'Crispy shell taco with seasoned beef, cheese, lettuce', 299, 'Tacos', 1),
  ('Soft Taco', 'Soft flour tortilla with choice of meat', 349, 'Tacos', 2),
  ('Bean & Cheese Burrito', 'Classic bean and cheese burrito', 599, 'Burritos', 3),
  ('Combo Plate', '2 tacos, rice, beans, and a drink', 999, 'Combos', 4),
  ('Churros', 'Fresh fried churros with cinnamon sugar', 399, 'Desserts', 5)
) AS v(name, description, price, category, sort_order)
WHERE b.slug = 'original-taco-pete'
ON CONFLICT DO NOTHING;

-- Fishbone Seafood
INSERT INTO menu_items (business_id, name, description, price, category, sort_order, is_available)
SELECT b.id, v.name, v.description, v.price, v.category, v.sort_order, true
FROM businesses b,
(VALUES
  ('Catfish Plate', '2 pieces of crispy catfish with fries and coleslaw', 1299, 'Plates', 1),
  ('Shrimp Basket', 'Fried shrimp with fries and cocktail sauce', 1199, 'Plates', 2),
  ('Fish Tacos (3)', 'Grilled or fried fish tacos with mango salsa', 1099, 'Tacos', 3),
  ('Seafood Gumbo', 'Rich gumbo with shrimp, crab, and andouille sausage', 1399, 'Soups', 4),
  ('Lobster Roll', 'Maine-style lobster roll on a buttered bun', 1699, 'Specialties', 5),
  ('Hush Puppies', 'Southern-style cornmeal hush puppies', 499, 'Sides', 6)
) AS v(name, description, price, category, sort_order)
WHERE b.slug = 'fishbone-seafood'
ON CONFLICT DO NOTHING;

-- Krab Kingz Seafood
INSERT INTO menu_items (business_id, name, description, price, category, sort_order, is_available)
SELECT b.id, v.name, v.description, v.price, v.category, v.sort_order, true
FROM businesses b,
(VALUES
  ('King Crab Legs (1 lb)', 'Steamed king crab legs with butter and lemon', 3999, 'Crab', 1),
  ('Shrimp Boil', 'Cajun shrimp boil with corn, potatoes, sausage', 1999, 'Boils', 2),
  ('Lobster Tail', 'Grilled lobster tail with garlic butter', 2999, 'Specialties', 3),
  ('Crab Fries', 'Fries loaded with crab meat and cheese sauce', 1499, 'Sides', 4),
  ('Snow Crab Cluster', 'Seasoned snow crab cluster', 2499, 'Crab', 5)
) AS v(name, description, price, category, sort_order)
WHERE b.slug = 'krab-kingz-seafood'
ON CONFLICT DO NOTHING;

-- Everytable
INSERT INTO menu_items (business_id, name, description, price, category, sort_order, is_available)
SELECT b.id, v.name, v.description, v.price, v.category, v.sort_order, true
FROM businesses b,
(VALUES
  ('Jamaican Jerk Chicken Bowl', 'Jerk chicken, rice and peas, plantains', 899, 'Bowls', 1),
  ('California Cobb Salad', 'Grilled chicken, avocado, egg, bacon, blue cheese', 899, 'Salads', 2),
  ('Korean Japchae', 'Sweet potato noodles, vegetables, sesame', 799, 'Bowls', 3),
  ('Chicken Tikka Masala', 'Tender chicken in creamy tikka sauce over rice', 899, 'Bowls', 4),
  ('Margherita Flatbread', 'Fresh mozzarella, tomato, basil on flatbread', 799, 'Flatbreads', 5)
) AS v(name, description, price, category, sort_order)
WHERE b.slug = 'everytable-compton'
ON CONFLICT DO NOTHING;

-- Enable accepts_orders for restaurants, accepts_bookings for service businesses
UPDATE businesses SET accepts_orders = TRUE WHERE category = 'restaurant' AND is_published = TRUE;
UPDATE businesses SET accepts_bookings = TRUE WHERE category IN ('barber', 'beauty', 'health', 'auto') AND is_published = TRUE;
