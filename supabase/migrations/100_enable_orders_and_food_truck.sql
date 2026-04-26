-- ============================================================
-- Enable ordering on the 5 demo vendors + seed a live vehicle
-- for Tia Carmen Tacos so it shows on the Food Truck Tracker.
-- ============================================================
-- Paste-safe: no table-alias dot-notation, no example.com URLs.
-- Idempotent: businesses are toggled by slug; vehicle uses
-- ON CONFLICT DO NOTHING via a unique-ish (business_id, name) guard.
-- ============================================================

-- 1. Turn ordering on for the 5 demo food vendors
UPDATE businesses
SET accepts_orders = TRUE,
    delivery_enabled = TRUE,
    delivery_radius = 5,
    min_order = 0
WHERE slug IN (
  'hub-city-burger-house',
  'compton-soul-wings',
  'tia-carmen-tacos',
  'sunrise-plantcake-cafe',
  'yamashita-ramen-bar'
);

-- 2. Seed a live food truck for Tia Carmen Tacos so it appears on
--    the Food Truck Tracker. Pin set near South Park, Compton.
INSERT INTO vendor_vehicles (
  business_id, vehicle_type, name, image_url,
  current_lat, current_lng, current_location_name,
  vendor_status, location_updated_at, is_active
)
SELECT b.id,
       'food_truck',
       'Tia Carmen Truck 1',
       'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=1200&q=80',
       33.8958, -118.2201,
       'South Park, Compton',
       'open',
       NOW(),
       TRUE
FROM businesses b
WHERE b.slug = 'tia-carmen-tacos'
  AND NOT EXISTS (
    SELECT 1 FROM vendor_vehicles vv
    WHERE vv.business_id = b.id AND vv.name = 'Tia Carmen Truck 1'
  );
