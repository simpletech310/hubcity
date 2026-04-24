-- 082_phase2a_cities_and_feature_flags.sql
-- Phase 2A: Extend cities table for multi-city expansion, seed 9 cities,
-- and create the feature_flags table for runtime feature toggling.
--
-- Re-runnable: ADD COLUMN IF NOT EXISTS; ON CONFLICT ... DO UPDATE for upserts.
--
-- Existing cities table columns (from 049_cities.sql):
--   id, slug, name, state, timezone, default_zip_codes,
--   mapbox_center_lng, mapbox_center_lat, mapbox_bounds,
--   districts, launch_status, theme, created_at
-- Already-existing cities (049 + 076):
--   compton, inglewood, hawthorne, south-gate, long-beach, carson
-- New columns added here: region, is_active, display_order, tagline

-- ── Part A: Extend cities table ──────────────────────────────────────────────

ALTER TABLE public.cities
  ADD COLUMN IF NOT EXISTS region        text,
  ADD COLUMN IF NOT EXISTS is_active     boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tagline       text;

COMMENT ON COLUMN public.cities.region        IS 'Macro-region grouping, e.g. "SoCal", "Inland Empire", "Texas Triangle".';
COMMENT ON COLUMN public.cities.is_active     IS 'Whether this city is visible in the city selector.';
COMMENT ON COLUMN public.cities.display_order IS 'Sort position in city picker and admin lists.';
COMMENT ON COLUMN public.cities.tagline       IS 'Short city tagline shown in discovery UI.';

-- ── Part B: Seed 9 cities (upsert) ──────────────────────────────────────────
-- NOTE: launch_status constraint from 049 accepts 'live','coming_soon','hidden'.
-- We map 'active' -> 'live' per the existing check constraint.

INSERT INTO public.cities
  (slug, name, state, region, tagline, display_order, launch_status,
   timezone, mapbox_center_lng, mapbox_center_lat,
   default_zip_codes, districts)
VALUES
  -- 1. Compton (already exists — update metadata)
  (
    'compton', 'Compton', 'CA', 'SoCal', 'The Hub City', 1, 'live',
    'America/Los_Angeles', -118.2201, 33.8958,
    ARRAY['90220','90221','90222','90223','90224'],
    NULL
  ),
  -- 2. Los Angeles (new)
  (
    'los-angeles', 'Los Angeles', 'CA', 'SoCal', 'The City of Angels', 2, 'coming_soon',
    'America/Los_Angeles', -118.2437, 34.0522,
    ARRAY[]::text[], NULL
  ),
  -- 3. Long Beach (already exists — update metadata)
  (
    'long-beach', 'Long Beach', 'CA', 'SoCal', 'The LBC', 3, 'coming_soon',
    'America/Los_Angeles', -118.1937, 33.7701,
    ARRAY['90802','90803','90804','90805','90806','90807','90808','90810','90813','90814','90815'],
    NULL
  ),
  -- 4. Inglewood (already exists — update metadata)
  (
    'inglewood', 'Inglewood', 'CA', 'SoCal', 'City of Champions', 4, 'coming_soon',
    'America/Los_Angeles', -118.3531, 33.9617,
    ARRAY['90301','90302','90303','90304','90305'],
    NULL
  ),
  -- 5. Riverside (new)
  (
    'riverside', 'Riverside', 'CA', 'Inland Empire', 'The IE', 5, 'coming_soon',
    'America/Los_Angeles', -117.3961, 33.9806,
    ARRAY[]::text[], NULL
  ),
  -- 6. San Bernardino (new)
  (
    'san-bernardino', 'San Bernardino', 'CA', 'Inland Empire', 'The Inland Empire', 6, 'coming_soon',
    'America/Los_Angeles', -117.2898, 34.1083,
    ARRAY[]::text[], NULL
  ),
  -- 7. Dallas (new)
  (
    'dallas', 'Dallas', 'TX', 'Texas Triangle', 'Big D', 7, 'coming_soon',
    'America/Chicago', -96.7970, 32.7767,
    ARRAY[]::text[], NULL
  ),
  -- 8. Houston (new)
  (
    'houston', 'Houston', 'TX', 'Texas Triangle', 'H-Town', 8, 'coming_soon',
    'America/Chicago', -95.3698, 29.7604,
    ARRAY[]::text[], NULL
  ),
  -- 9. Atlanta (new)
  (
    'atlanta', 'Atlanta', 'GA', 'ATL', 'ATL', 9, 'coming_soon',
    'America/New_York', -84.3880, 33.7490,
    ARRAY[]::text[], NULL
  )
ON CONFLICT (slug) DO UPDATE SET
  state         = EXCLUDED.state,
  region        = EXCLUDED.region,
  tagline       = EXCLUDED.tagline,
  display_order = EXCLUDED.display_order,
  launch_status = EXCLUDED.launch_status,
  timezone      = EXCLUDED.timezone,
  mapbox_center_lng = COALESCE(EXCLUDED.mapbox_center_lng, public.cities.mapbox_center_lng),
  mapbox_center_lat = COALESCE(EXCLUDED.mapbox_center_lat, public.cities.mapbox_center_lat);

-- ── Part C: Feature flags table ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.feature_flags (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL UNIQUE,
  is_enabled  boolean     NOT NULL DEFAULT false,
  description text,
  city_id     uuid        REFERENCES public.cities(id) ON DELETE CASCADE,  -- null = global
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.feature_flags IS
  'Runtime feature flags. city_id = NULL means global; city_id set means city-scoped override.';

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Anyone can read flags (needed by client-side feature checks)
DROP POLICY IF EXISTS feature_flags_select_all ON public.feature_flags;
CREATE POLICY "feature_flags_select_all" ON public.feature_flags
  FOR SELECT USING (true);

-- Only admins can write
DROP POLICY IF EXISTS feature_flags_admin_all ON public.feature_flags;
CREATE POLICY "feature_flags_admin_all" ON public.feature_flags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Seed initial feature flags
INSERT INTO public.feature_flags (name, is_enabled, description) VALUES
  ('civic_enabled',          false, 'City hall, district, council, trustee, schools, parks features'),
  ('multi_city_enabled',     true,  'Multi-city discovery and city selector'),
  ('creator_studio_enabled', true,  'Creator studio dashboard'),
  ('spanish_enabled',        false, 'Spanish language toggle (i18n)')
ON CONFLICT (name) DO UPDATE SET
  is_enabled  = EXCLUDED.is_enabled,
  updated_at  = now();
