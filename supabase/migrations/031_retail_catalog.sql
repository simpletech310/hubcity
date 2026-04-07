-- ============================================================
-- Hub City App — Retail Catalog (Variants + Coupons)
-- ============================================================

-- ── Product Variants ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT,
  price_override INTEGER, -- null = use parent menu_item price
  stock_count INTEGER DEFAULT 0,
  attributes JSONB DEFAULT '{}', -- { "size": "XL", "color": "Black" }
  sort_order INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_variants_item ON product_variants(menu_item_id);

ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read product variants" ON product_variants
  FOR SELECT USING (true);

CREATE POLICY "Owners can manage product variants" ON product_variants
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM menu_items mi
      JOIN businesses b ON b.id = mi.business_id
      WHERE mi.id = menu_item_id AND b.owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can update product variants" ON product_variants
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM menu_items mi
      JOIN businesses b ON b.id = mi.business_id
      WHERE mi.id = menu_item_id AND b.owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can delete product variants" ON product_variants
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM menu_items mi
      JOIN businesses b ON b.id = mi.business_id
      WHERE mi.id = menu_item_id AND b.owner_id = auth.uid()
    )
  );

-- ── Coupons ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed_amount', 'free_shipping')),
  discount_value INTEGER NOT NULL DEFAULT 0, -- percent (0-100) or cents
  min_order_amount INTEGER DEFAULT 0, -- minimum order in cents
  max_uses INTEGER, -- null = unlimited
  current_uses INTEGER DEFAULT 0,
  max_uses_per_customer INTEGER DEFAULT 1,
  applies_to TEXT DEFAULT 'all' CHECK (applies_to IN ('all', 'category', 'item')),
  applies_to_ids TEXT[], -- category names or item IDs
  valid_from TIMESTAMPTZ DEFAULT now(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (business_id, code)
);

CREATE INDEX IF NOT EXISTS idx_coupons_business ON coupons(business_id);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(business_id, code);

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active coupons" ON coupons
  FOR SELECT USING (is_active = true);

CREATE POLICY "Owners can manage coupons" ON coupons
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM businesses WHERE id = business_id AND owner_id = auth.uid())
  );

CREATE POLICY "Owners can update coupons" ON coupons
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM businesses WHERE id = business_id AND owner_id = auth.uid())
  );

CREATE POLICY "Owners can delete coupons" ON coupons
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM businesses WHERE id = business_id AND owner_id = auth.uid())
  );

-- ── Order coupon tracking ────────────────────────────────
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_id UUID REFERENCES coupons(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount INTEGER DEFAULT 0;
