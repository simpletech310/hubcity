-- ============================================================
-- 107: business_deals — generalized deals/promos table for the
--      /business page (mirrors food_promotions but for retail,
--      services, beauty, health, auto, etc.).
--
-- Seeded with REAL deals for the 4 real non-food businesses
-- currently in the directory: Element 78, FakeSmiles, BFlyy LA,
-- Glamorous Mane.
-- ============================================================

CREATE TABLE IF NOT EXISTS business_deals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id     UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT NOT NULL DEFAULT '',
  -- Display label for the discount, e.g. "10% OFF", "$49.99",
  -- "B2G1", "FREE", "SAVE $20". Free-form so the merchant decides
  -- the language; renderer just shows it as a chip.
  discount_label  TEXT NOT NULL,
  -- Optional code for checkout / in-store mention. NULL means the
  -- deal applies automatically (e.g., a recurring weekly special).
  promo_code      TEXT,
  valid_from      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until     TIMESTAMPTZ NOT NULL,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_business_deals_business ON business_deals(business_id);
CREATE INDEX IF NOT EXISTS idx_business_deals_active   ON business_deals(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_business_deals_window   ON business_deals(valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_business_deals_promo    ON business_deals(promo_code) WHERE promo_code IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'business_deals_updated_at'
  ) THEN
    CREATE TRIGGER business_deals_updated_at
      BEFORE UPDATE ON business_deals
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END$$;

ALTER TABLE business_deals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS business_deals_public_read ON business_deals;
CREATE POLICY business_deals_public_read ON business_deals
  FOR SELECT USING (
    is_active = TRUE
    AND valid_from <= NOW()
    AND valid_until >= NOW()
  );

DROP POLICY IF EXISTS business_deals_owner_all ON business_deals;
CREATE POLICY business_deals_owner_all ON business_deals
  FOR ALL USING (
    EXISTS (SELECT 1 FROM businesses b WHERE b.id = business_id AND b.owner_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM businesses b WHERE b.id = business_id AND b.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS business_deals_admin_all ON business_deals;
CREATE POLICY business_deals_admin_all ON business_deals
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','city_official'))
  );

COMMENT ON TABLE business_deals IS
  'Promotions / deals / promo codes for non-food businesses (mirrors food_promotions). Surfaced on /business.';

-- ────────────────────────────────────────────────────────────
-- Seed: real deals for the 4 real non-food businesses.
-- All idempotent via NOT EXISTS guards on (business_id, title).
-- ────────────────────────────────────────────────────────────

-- Element 78 — fitness retail
INSERT INTO business_deals (business_id, title, description, discount_label, promo_code, valid_until)
SELECT b.id, x.title, x.description, x.discount_label, x.promo_code, x.valid_until
FROM businesses b, (VALUES
  ('Launch Drop — 10% Off',
   'First-drop discount on Training Tees, Performance Joggers, and the Tripod Hydration Bottle. Use at checkout.',
   '10% OFF',
   'LAUNCH10',
   NOW() + INTERVAL '30 days'),
  ('Free Tripod Bottle With Apparel Set',
   'Buy any two apparel items (Training Tee + Performance Joggers) and we throw in a Tripod Hydration Bottle on the house.',
   'FREE BOTTLE',
   NULL,
   NOW() + INTERVAL '21 days')
) AS x(title, description, discount_label, promo_code, valid_until)
WHERE b.slug = 'element-78'
  AND NOT EXISTS (
    SELECT 1 FROM business_deals d WHERE d.business_id = b.id AND d.title = x.title
  );

-- FakeSmiles — streetwear
INSERT INTO business_deals (business_id, title, description, discount_label, promo_code, valid_until)
SELECT b.id, x.title, x.description, x.discount_label, x.promo_code, x.valid_until
FROM businesses b, (VALUES
  ('First Order 15% Off',
   'New customer? 15% off your first FakeSmiles order — works on tees, hats, hoodies.',
   '15% OFF',
   'WELCOME15',
   NOW() + INTERVAL '60 days'),
  ('Two Tees, Save $10',
   'Stack two FakeSmiles tees in one order and $10 comes off automatically at checkout. No code needed.',
   'SAVE $10',
   NULL,
   NOW() + INTERVAL '30 days')
) AS x(title, description, discount_label, promo_code, valid_until)
WHERE b.slug = 'fakesmiles'
  AND NOT EXISTS (
    SELECT 1 FROM business_deals d WHERE d.business_id = b.id AND d.title = x.title
  );

-- BFlyy LA — women's streetwear
INSERT INTO business_deals (business_id, title, description, discount_label, promo_code, valid_until)
SELECT b.id, x.title, x.description, x.discount_label, x.promo_code, x.valid_until
FROM businesses b, (VALUES
  ('Spring Track-Set Bundle',
   'The two-piece Track Set + a Crop Tee for $130. Pick any colorway. Best deal on a fit-of-the-week.',
   '$130 BUNDLE',
   'SPRINGFLY',
   NOW() + INTERVAL '21 days'),
  ('First Order 15% Off',
   'New to BFlyy LA? 15% off your first order — sets, tops, accessories included.',
   '15% OFF',
   'BFLYY15',
   NOW() + INTERVAL '60 days')
) AS x(title, description, discount_label, promo_code, valid_until)
WHERE b.slug = 'bflyy-la'
  AND NOT EXISTS (
    SELECT 1 FROM business_deals d WHERE d.business_id = b.id AND d.title = x.title
  );

-- Glamorous Mane — beauty / hair studio
INSERT INTO business_deals (business_id, title, description, discount_label, promo_code, valid_until)
SELECT b.id, x.title, x.description, x.discount_label, x.promo_code, x.valid_until
FROM businesses b, (VALUES
  ('New Client — $20 Off Lace Install',
   'Booking with us for the first time? $20 off your lace install. Mention the code when you book.',
   '$20 OFF',
   'NEWCLIENT20',
   NOW() + INTERVAL '45 days'),
  ('Silk Press Tuesday',
   'Silk press special every Tuesday. Walk-ins welcome between 10am and 4pm.',
   'TUESDAY SPECIAL',
   NULL,
   NOW() + INTERVAL '90 days')
) AS x(title, description, discount_label, promo_code, valid_until)
WHERE b.slug = 'glamorous-mane'
  AND NOT EXISTS (
    SELECT 1 FROM business_deals d WHERE d.business_id = b.id AND d.title = x.title
  );
