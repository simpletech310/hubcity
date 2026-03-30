-- ============================================================
-- Hub City App — Food: Mobile Vendors, Specials, Promos, Tours, Challenges
-- ============================================================

-- ============================================================
-- ALTER BUSINESSES — Add mobile vendor fields
-- ============================================================
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS is_mobile_vendor BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS current_lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS current_lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS current_location_name TEXT,
  ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS vendor_route JSONB,
  ADD COLUMN IF NOT EXISTS vendor_status TEXT DEFAULT 'inactive' CHECK (vendor_status IN ('active', 'inactive', 'en_route'));

CREATE INDEX idx_businesses_mobile_vendor ON businesses(is_mobile_vendor) WHERE is_mobile_vendor = TRUE;
CREATE INDEX idx_businesses_vendor_status ON businesses(vendor_status) WHERE vendor_status != 'inactive';

-- ============================================================
-- FOOD SPECIALS
-- ============================================================
CREATE TABLE food_specials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  original_price NUMERIC(10,2) NOT NULL,
  special_price NUMERIC(10,2) NOT NULL,
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_food_specials_business ON food_specials(business_id);
CREATE INDEX idx_food_specials_active ON food_specials(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_food_specials_valid ON food_specials(valid_from, valid_until);

CREATE TRIGGER food_specials_updated_at
  BEFORE UPDATE ON food_specials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- FOOD PROMOTIONS
-- ============================================================
CREATE TABLE food_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  promo_type TEXT NOT NULL CHECK (promo_type IN ('discount', 'bogo', 'free_item', 'bundle', 'loyalty')),
  promo_code TEXT,
  discount_percent NUMERIC(5,2),
  discount_amount NUMERIC(10,2),
  min_order NUMERIC(10,2),
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_food_promotions_business ON food_promotions(business_id);
CREATE INDEX idx_food_promotions_active ON food_promotions(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_food_promotions_valid ON food_promotions(valid_from, valid_until);
CREATE INDEX idx_food_promotions_type ON food_promotions(promo_type);

CREATE TRIGGER food_promotions_updated_at
  BEFORE UPDATE ON food_promotions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- FOOD TOURS
-- ============================================================
CREATE TABLE food_tours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  stops JSONB NOT NULL DEFAULT '[]',
  estimated_duration INTEGER NOT NULL DEFAULT 60, -- minutes
  is_featured BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT FALSE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_food_tours_slug ON food_tours(slug);
CREATE INDEX idx_food_tours_published ON food_tours(is_published) WHERE is_published = TRUE;
CREATE INDEX idx_food_tours_featured ON food_tours(is_featured) WHERE is_featured = TRUE;

CREATE TRIGGER food_tours_updated_at
  BEFORE UPDATE ON food_tours
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- FOOD CHALLENGES
-- ============================================================
CREATE TABLE food_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  challenge_type TEXT NOT NULL CHECK (challenge_type IN ('eating', 'collection', 'photo')),
  rules TEXT,
  prize_description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  participant_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_food_challenges_slug ON food_challenges(slug);
CREATE INDEX idx_food_challenges_active ON food_challenges(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_food_challenges_dates ON food_challenges(start_date, end_date);

CREATE TRIGGER food_challenges_updated_at
  BEFORE UPDATE ON food_challenges
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Food Specials
ALTER TABLE food_specials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active food specials are viewable by everyone"
  ON food_specials FOR SELECT USING (is_active = true);

CREATE POLICY "Business owners can insert their own specials"
  ON food_specials FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM businesses WHERE id = business_id AND owner_id = auth.uid())
  );

CREATE POLICY "Business owners can update their own specials"
  ON food_specials FOR UPDATE USING (
    EXISTS (SELECT 1 FROM businesses WHERE id = business_id AND owner_id = auth.uid())
  );

CREATE POLICY "Business owners can delete their own specials"
  ON food_specials FOR DELETE USING (
    EXISTS (SELECT 1 FROM businesses WHERE id = business_id AND owner_id = auth.uid())
  );

CREATE POLICY "Admins can manage all food specials"
  ON food_specials FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'city_official'))
  );

-- Food Promotions
ALTER TABLE food_promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active food promotions are viewable by everyone"
  ON food_promotions FOR SELECT USING (is_active = true);

CREATE POLICY "Business owners can insert their own promotions"
  ON food_promotions FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM businesses WHERE id = business_id AND owner_id = auth.uid())
  );

CREATE POLICY "Business owners can update their own promotions"
  ON food_promotions FOR UPDATE USING (
    EXISTS (SELECT 1 FROM businesses WHERE id = business_id AND owner_id = auth.uid())
  );

CREATE POLICY "Business owners can delete their own promotions"
  ON food_promotions FOR DELETE USING (
    EXISTS (SELECT 1 FROM businesses WHERE id = business_id AND owner_id = auth.uid())
  );

CREATE POLICY "Admins can manage all food promotions"
  ON food_promotions FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'city_official'))
  );

-- Food Tours
ALTER TABLE food_tours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published food tours are viewable by everyone"
  ON food_tours FOR SELECT USING (is_published = true);

CREATE POLICY "Admins can manage all food tours"
  ON food_tours FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'city_official'))
  );

-- Food Challenges
ALTER TABLE food_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active food challenges are viewable by everyone"
  ON food_challenges FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage all food challenges"
  ON food_challenges FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'city_official'))
  );
