-- ============================================================
-- 074: Pickup location on orders
--
-- When a customer taps a food-truck pin and orders from the live map,
-- they need to tell the business WHERE to hand the order off — the
-- brick-and-mortar store, or a specific truck/cart in the fleet. We
-- persist that on the order row so the owner's order feed knows
-- which vehicle staff to notify.
-- ============================================================

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS pickup_location_name TEXT,
  ADD COLUMN IF NOT EXISTS pickup_vehicle_id UUID REFERENCES vendor_vehicles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_orders_pickup_vehicle
  ON orders (pickup_vehicle_id)
  WHERE pickup_vehicle_id IS NOT NULL;
