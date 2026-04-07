-- ============================================================
-- Hub City App — Chamber of Commerce Portal
-- ============================================================

-- ── Add chamber_admin role ───────────────────────────────
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('citizen', 'business_owner', 'admin', 'city_official', 'content_creator', 'city_ambassador', 'chamber_admin'));

-- ── Chamber Updates ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS chamber_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general'
    CHECK (category IN ('event', 'resource', 'grant', 'networking', 'policy', 'general')),
  image_url TEXT,
  target_business_types TEXT[], -- null = all types
  is_pinned BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chamber_updates_published ON chamber_updates(is_published, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chamber_updates_pinned ON chamber_updates(is_pinned) WHERE is_pinned = true;

ALTER TABLE chamber_updates ENABLE ROW LEVEL SECURITY;

-- Business owners can read published updates
CREATE POLICY "Business owners can read chamber updates" ON chamber_updates
  FOR SELECT USING (
    is_published = true OR
    auth.uid() = author_id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('chamber_admin', 'admin'))
  );

-- Chamber admins can manage
CREATE POLICY "Chamber admins can insert updates" ON chamber_updates
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('chamber_admin', 'admin'))
  );

CREATE POLICY "Chamber admins can update updates" ON chamber_updates
  FOR UPDATE USING (
    auth.uid() = author_id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('chamber_admin', 'admin'))
  );

CREATE POLICY "Chamber admins can delete updates" ON chamber_updates
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('chamber_admin', 'admin'))
  );

-- ── Chamber Update Reads (tracking) ─────────────────────
CREATE TABLE IF NOT EXISTS chamber_update_reads (
  update_id UUID NOT NULL REFERENCES chamber_updates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (update_id, user_id)
);

ALTER TABLE chamber_update_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own read receipts" ON chamber_update_reads
  FOR ALL USING (auth.uid() = user_id);

-- ── Chamber Analytics (aggregate only, no individual tx) ─
CREATE OR REPLACE FUNCTION get_chamber_analytics(start_date TIMESTAMPTZ, end_date TIMESTAMPTZ)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_businesses', (SELECT count(*) FROM businesses WHERE chamber_status = 'active'),
    'paused_businesses', (SELECT count(*) FROM businesses WHERE chamber_status = 'paused'),
    'total_orders', (
      SELECT count(*) FROM orders
      WHERE created_at BETWEEN start_date AND end_date
    ),
    'total_revenue_cents', (
      SELECT COALESCE(sum(total), 0) FROM orders
      WHERE created_at BETWEEN start_date AND end_date
      AND status NOT IN ('cancelled')
    ),
    'orders_by_type', (
      SELECT json_object_agg(t, c) FROM (
        SELECT b.business_type AS t, count(*) AS c
        FROM orders o
        JOIN businesses b ON b.id = o.business_id
        WHERE o.created_at BETWEEN start_date AND end_date
        GROUP BY b.business_type
      ) sub
    ),
    'new_businesses_count', (
      SELECT count(*) FROM businesses
      WHERE created_at BETWEEN start_date AND end_date
    ),
    'total_loyalty_points_earned', (
      SELECT COALESCE(sum(points), 0) FROM loyalty_transactions
      WHERE type = 'earn' AND created_at BETWEEN start_date AND end_date
    ),
    'total_loyalty_points_redeemed', (
      SELECT COALESCE(abs(sum(points)), 0) FROM loyalty_transactions
      WHERE type = 'redeem' AND created_at BETWEEN start_date AND end_date
    )
  ) INTO result;

  RETURN result;
END;
$$;
