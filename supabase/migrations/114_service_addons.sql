-- ============================================================
-- Hub City App — Service add-ons
-- ============================================================
-- Adds `service_addons` so a bookable service (e.g. "Paint & Sip
-- Party — Adult Group") can offer optional extras (e.g. "+ Wine
-- Pairing", "+ Custom Canvas Size") that customers can stack on top
-- at booking time.
--
-- Surfaced read-only on /business/[id] under each service. The
-- booking checkout can opt into addon ids in a follow-up pass.
-- ============================================================

CREATE TABLE IF NOT EXISTS service_addons (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id    UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  price         INTEGER NOT NULL DEFAULT 0,    -- cents
  sort_order    INTEGER NOT NULL DEFAULT 0,
  is_available  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_addons_service
  ON service_addons (service_id, sort_order, is_available);

ALTER TABLE service_addons ENABLE ROW LEVEL SECURITY;

-- Anyone can read add-ons that belong to a published business.
CREATE POLICY "service_addons_public_read" ON service_addons
  FOR SELECT USING (
    EXISTS (
      SELECT 1
        FROM services s
        JOIN businesses b ON b.id = s.business_id
       WHERE s.id = service_addons.service_id
         AND b.is_published = TRUE
    )
  );

-- Owners (or admins) can manage their own service add-ons.
CREATE POLICY "service_addons_owner_all" ON service_addons
  FOR ALL USING (
    EXISTS (
      SELECT 1
        FROM services s
        JOIN businesses b ON b.id = s.business_id
       WHERE s.id = service_addons.service_id
         AND b.owner_id = auth.uid()
    )
  );

CREATE TRIGGER service_addons_updated_at
  BEFORE UPDATE ON service_addons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
