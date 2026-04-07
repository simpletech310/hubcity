-- ============================================================
-- Hub City App — Loyalty Program
-- ============================================================

-- ── Loyalty Balances ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS loyalty_balances (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL DEFAULT 0,
  lifetime_points INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE loyalty_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own loyalty balance" ON loyalty_balances
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role manages loyalty balances" ON loyalty_balances
  FOR ALL USING (auth.uid() = user_id);

-- ── Loyalty Transactions ─────────────────────────────────
CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID REFERENCES businesses(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('earn', 'redeem', 'bonus', 'adjustment', 'expire')),
  points INTEGER NOT NULL, -- positive for earn/bonus, negative for redeem/expire
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_loyalty_tx_user ON loyalty_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_tx_user_date ON loyalty_transactions(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_loyalty_tx_business ON loyalty_transactions(business_id);

ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own loyalty transactions" ON loyalty_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own loyalty transactions" ON loyalty_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ── Loyalty Rewards ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS loyalty_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  points_required INTEGER NOT NULL DEFAULT 100,
  reward_type TEXT NOT NULL CHECK (reward_type IN ('discount_fixed', 'discount_percent', 'free_item', 'custom')),
  reward_value INTEGER DEFAULT 0, -- cents or percent
  reward_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  max_redemptions_per_user INTEGER DEFAULT 0, -- 0 = unlimited
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_loyalty_rewards_business ON loyalty_rewards(business_id);

ALTER TABLE loyalty_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active loyalty rewards" ON loyalty_rewards
  FOR SELECT USING (is_active = true);

CREATE POLICY "Owners can manage loyalty rewards" ON loyalty_rewards
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM businesses WHERE id = business_id AND owner_id = auth.uid())
  );

CREATE POLICY "Owners can update loyalty rewards" ON loyalty_rewards
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM businesses WHERE id = business_id AND owner_id = auth.uid())
  );

CREATE POLICY "Owners can delete loyalty rewards" ON loyalty_rewards
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM businesses WHERE id = business_id AND owner_id = auth.uid())
  );

-- ── Verified Resident Discounts ──────────────────────────
CREATE TABLE IF NOT EXISTS verified_resident_discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  discount_percent NUMERIC(5,2) DEFAULT 10.0,
  applies_to_categories TEXT[],
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (business_id)
);

ALTER TABLE verified_resident_discounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active resident discounts" ON verified_resident_discounts
  FOR SELECT USING (is_active = true);

CREATE POLICY "Owners can manage resident discounts" ON verified_resident_discounts
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM businesses WHERE id = business_id AND owner_id = auth.uid())
  );

CREATE POLICY "Owners can update resident discounts" ON verified_resident_discounts
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM businesses WHERE id = business_id AND owner_id = auth.uid())
  );

-- ── Loyalty Config (platform-wide, single row) ──────────
CREATE TABLE IF NOT EXISTS loyalty_config (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  points_per_dollar INTEGER DEFAULT 10,
  points_to_dollar_ratio NUMERIC(10,6) DEFAULT 0.006667, -- 300 pts = ~$2
  min_redemption_points INTEGER DEFAULT 100,
  max_daily_earn INTEGER DEFAULT 500,
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO loyalty_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE loyalty_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read loyalty config" ON loyalty_config
  FOR SELECT USING (true);

-- ── Order loyalty columns ────────────────────────────────
ALTER TABLE orders ADD COLUMN IF NOT EXISTS loyalty_points_earned INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS loyalty_points_redeemed INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS loyalty_discount INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS verified_resident_discount INTEGER DEFAULT 0;
