-- ============================================================
-- Hub City App — Business Types, Fees & Poll/Survey Access
-- ============================================================

-- ============================================================
-- FIX: Allow all authenticated users to create polls & surveys
-- ============================================================
DROP POLICY IF EXISTS "Officials can create polls" ON polls;
CREATE POLICY "Authenticated users can create polls" ON polls
  FOR INSERT WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Officials can create surveys" ON surveys;
CREATE POLICY "Authenticated users can create surveys" ON surveys
  FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Also fix poll_options and survey_questions to just check authorship
DROP POLICY IF EXISTS "Officials can manage poll options" ON poll_options;
CREATE POLICY "Authors can manage poll options" ON poll_options
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM polls WHERE id = poll_id AND author_id = auth.uid())
  );

DROP POLICY IF EXISTS "Officials can manage questions" ON survey_questions;
CREATE POLICY "Authors can manage survey questions" ON survey_questions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM surveys WHERE id = survey_id AND author_id = auth.uid())
  );

-- ============================================================
-- BUSINESS TYPES & SUB-TYPES
-- ============================================================

ALTER TABLE businesses ADD COLUMN IF NOT EXISTS business_type TEXT
  CHECK (business_type IN ('food', 'retail', 'service'));

ALTER TABLE businesses ADD COLUMN IF NOT EXISTS business_sub_type TEXT
  CHECK (business_sub_type IN ('brick_and_mortar', 'food_truck', 'cart', 'digital', 'general'));

-- Chamber of Commerce management fields
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS chamber_status TEXT DEFAULT 'active'
  CHECK (chamber_status IN ('active', 'paused', 'removed'));
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS chamber_paused_at TIMESTAMPTZ;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS chamber_notes TEXT;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_businesses_type ON businesses(business_type);
CREATE INDEX IF NOT EXISTS idx_businesses_sub_type ON businesses(business_sub_type);
CREATE INDEX IF NOT EXISTS idx_businesses_chamber_status ON businesses(chamber_status);

-- ============================================================
-- BACKFILL business_type from existing category
-- ============================================================

-- Food businesses
UPDATE businesses SET business_type = 'food', business_sub_type = 'brick_and_mortar'
WHERE category = 'restaurant' AND business_type IS NULL;

-- Override food trucks
UPDATE businesses SET business_sub_type = 'food_truck'
WHERE is_mobile_vendor = TRUE AND business_type = 'food';

-- Retail businesses
UPDATE businesses SET business_type = 'retail', business_sub_type = 'brick_and_mortar'
WHERE category = 'retail' AND business_type IS NULL;

-- Service businesses (all remaining categories)
UPDATE businesses SET business_type = 'service', business_sub_type = 'general'
WHERE category IN ('barber', 'beauty', 'health', 'auto', 'services', 'entertainment', 'other')
  AND business_type IS NULL;

-- Catch any remaining
UPDATE businesses SET business_type = 'service', business_sub_type = 'general'
WHERE business_type IS NULL;

-- ============================================================
-- EXPAND VENDOR STATUS for food trucks/carts
-- ============================================================

ALTER TABLE businesses DROP CONSTRAINT IF EXISTS businesses_vendor_status_check;
ALTER TABLE businesses ADD CONSTRAINT businesses_vendor_status_check
  CHECK (vendor_status IN ('active', 'inactive', 'en_route', 'open', 'sold_out', 'closed', 'cancelled'));

-- ============================================================
-- EXPAND ORDER STATUS for delivery tracking
-- ============================================================

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'out_for_delivery', 'delayed', 'delivered', 'cancelled'));

ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_status_updated_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS estimated_delivery_at TIMESTAMPTZ;
