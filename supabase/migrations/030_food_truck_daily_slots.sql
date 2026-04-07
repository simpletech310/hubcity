-- ============================================================
-- Hub City App — Food Truck Daily Slots
-- ============================================================

-- Allows food trucks/carts to post daily "where we'll be" slots
CREATE TABLE IF NOT EXISTS vendor_daily_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location_name TEXT NOT NULL,
  location_address TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  status TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'active', 'sold_out', 'cancelled', 'completed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_vendor_daily_slots_biz_date ON vendor_daily_slots(business_id, date);
CREATE INDEX IF NOT EXISTS idx_vendor_daily_slots_date_status ON vendor_daily_slots(date, status);

-- RLS
ALTER TABLE vendor_daily_slots ENABLE ROW LEVEL SECURITY;

-- Anyone can read slots
CREATE POLICY "Anyone can read vendor daily slots" ON vendor_daily_slots
  FOR SELECT USING (true);

-- Business owners can manage their own slots
CREATE POLICY "Owners can insert vendor daily slots" ON vendor_daily_slots
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM businesses WHERE id = business_id AND owner_id = auth.uid())
  );

CREATE POLICY "Owners can update vendor daily slots" ON vendor_daily_slots
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM businesses WHERE id = business_id AND owner_id = auth.uid())
  );

CREATE POLICY "Owners can delete vendor daily slots" ON vendor_daily_slots
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM businesses WHERE id = business_id AND owner_id = auth.uid())
  );
