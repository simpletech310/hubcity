-- ============================================================
-- 073: Vendor fleet — multiple trucks/carts per business
--
-- Splits the mobile-vendor per-vehicle fields off the businesses
-- row onto a new `vendor_vehicles` table so one business can run
-- a fleet of trucks + carts, each with its own status, current
-- location, and daily route. The map subscribes to this table
-- via Supabase Realtime so status flips push to clients instantly.
-- ============================================================

-- ── 1. vendor_vehicles table ────────────────────────────────
CREATE TABLE IF NOT EXISTS vendor_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('food_truck','cart')),
  name TEXT NOT NULL,                     -- e.g. "Truck 1", "Red Cart"
  image_url TEXT,
  current_lat DOUBLE PRECISION,
  current_lng DOUBLE PRECISION,
  current_location_name TEXT,
  vendor_status TEXT NOT NULL DEFAULT 'inactive' CHECK (vendor_status IN (
    'active','inactive','en_route','open','sold_out','closed','cancelled'
  )),
  vendor_route JSONB NOT NULL DEFAULT '[]'::jsonb,
  location_updated_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vendor_vehicles_business ON vendor_vehicles (business_id);
CREATE INDEX idx_vendor_vehicles_status ON vendor_vehicles (vendor_status) WHERE is_active = TRUE;
CREATE INDEX idx_vendor_vehicles_updated ON vendor_vehicles (location_updated_at DESC) WHERE is_active = TRUE;

CREATE TRIGGER vendor_vehicles_updated_at
  BEFORE UPDATE ON vendor_vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE vendor_vehicles ENABLE ROW LEVEL SECURITY;

-- Public can read active vehicles of published businesses
CREATE POLICY "vendor_vehicles_public_read"
  ON vendor_vehicles FOR SELECT
  USING (
    is_active = TRUE
    AND EXISTS (
      SELECT 1 FROM businesses b
      WHERE b.id = vendor_vehicles.business_id
        AND b.is_published = TRUE
    )
  );

-- Owner can CRUD their own vehicles
CREATE POLICY "vendor_vehicles_owner_all"
  ON vendor_vehicles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM businesses b
      WHERE b.id = vendor_vehicles.business_id
        AND b.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM businesses b
      WHERE b.id = vendor_vehicles.business_id
        AND b.owner_id = auth.uid()
    )
  );

-- ── 2. Backfill vehicles from existing mobile-vendor rows ───
-- For every business that was a mobile vendor pre-fleet, seed a
-- single vehicle row carrying whatever data was on the business.
INSERT INTO vendor_vehicles (
  business_id, vehicle_type, name, current_lat, current_lng,
  current_location_name, vendor_status, vendor_route, location_updated_at
)
SELECT
  b.id,
  COALESCE(b.business_sub_type, 'food_truck'),
  CASE
    WHEN b.business_sub_type = 'cart' THEN 'Cart 1'
    ELSE 'Truck 1'
  END,
  b.current_lat,
  b.current_lng,
  b.current_location_name,
  COALESCE(b.vendor_status, 'inactive'),
  COALESCE(b.vendor_route, '[]'::jsonb),
  b.location_updated_at
FROM businesses b
WHERE b.is_mobile_vendor = TRUE
  AND b.business_sub_type IN ('food_truck','cart')
  AND NOT EXISTS (
    SELECT 1 FROM vendor_vehicles v WHERE v.business_id = b.id
  );

-- ── 3. Drop deprecated per-vehicle columns off businesses ──
-- These now live on vendor_vehicles. Keep `is_mobile_vendor` as
-- a business-level flag.
ALTER TABLE businesses
  DROP COLUMN IF EXISTS current_lat,
  DROP COLUMN IF EXISTS current_lng,
  DROP COLUMN IF EXISTS current_location_name,
  DROP COLUMN IF EXISTS location_updated_at,
  DROP COLUMN IF EXISTS vendor_route,
  DROP COLUMN IF EXISTS vendor_status;

-- ── 4. Add vendor_vehicles to the realtime publication ────
-- Clients subscribe via supabase.channel('...').on('postgres_changes',
-- { table: 'vendor_vehicles', ... }, ...) to get live UPDATE/INSERT
-- pushed without polling.
ALTER PUBLICATION supabase_realtime ADD TABLE vendor_vehicles;
