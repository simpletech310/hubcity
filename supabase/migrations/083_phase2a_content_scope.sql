-- 083_phase2a_content_scope.sql
-- Phase 2A: Add content_scope enum + city_id to content tables that need
-- multi-city scoping. Create performance indexes for city-filtered queries.
--
-- Re-runnable: CREATE TYPE ... EXCEPTION; ADD COLUMN IF NOT EXISTS;
--              CREATE INDEX IF NOT EXISTS.
--
-- Pre-existing city_id columns (added by 052_city_id_on_content.sql):
--   businesses, events, resources, job_listings, posts, channels
--   (plus profiles, health_resources, parks, schools, community_groups, etc.)
--
-- Missing city_id (tables created AFTER migration 052):
--   reels (created in 072_reels.sql)
--
-- Tables from spec that do NOT exist in this schema:
--   food_vendors  — no such table; food vendor data is on businesses +
--                   vendor_vehicles + food_vendor_hours. Skip safely.
--   chambers      — no standalone chambers table; chamber data lives in
--                   chamber_updates (owned by organizations of type 'chamber').
--                   Skip safely.
--
-- content_scope is not yet applied to channels in earlier migrations;
-- channels get DEFAULT 'national' per spec (creators are national by default).
-- All other tables default to 'local'.

-- ── Part A: content_scope enum ───────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE public.content_scope AS ENUM ('local', 'regional', 'national');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TYPE public.content_scope IS
  'Visibility scope for content items: local (city-only), regional, or national.';

-- ── Part B: Add city_id + content_scope to content tables ────────────────────

-- businesses (city_id already exists from 052; add content_scope)
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS content_scope public.content_scope NOT NULL DEFAULT 'local';

-- events (city_id already exists from 052; add content_scope)
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS content_scope public.content_scope NOT NULL DEFAULT 'local';

-- resources (city_id already exists from 052; add content_scope)
ALTER TABLE public.resources
  ADD COLUMN IF NOT EXISTS content_scope public.content_scope NOT NULL DEFAULT 'local';

-- job_listings (city_id already exists from 052; add content_scope)
ALTER TABLE public.job_listings
  ADD COLUMN IF NOT EXISTS content_scope public.content_scope NOT NULL DEFAULT 'local';

-- posts (city_id already exists from 052; add content_scope)
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS content_scope public.content_scope NOT NULL DEFAULT 'local';

-- reels (city_id NOT added by 052 — reels table was created in 072, after 052)
ALTER TABLE public.reels
  ADD COLUMN IF NOT EXISTS city_id      uuid REFERENCES public.cities(id),
  ADD COLUMN IF NOT EXISTS content_scope public.content_scope NOT NULL DEFAULT 'local';

-- channels (city_id already exists from 052 + used in 079; add content_scope)
-- Creators are national by default per spec
ALTER TABLE public.channels
  ADD COLUMN IF NOT EXISTS content_scope public.content_scope NOT NULL DEFAULT 'national';

-- ── Part C: Indexes for fast city filtering ───────────────────────────────────
-- Note: some city_id indexes already exist from 052 under names like
-- businesses_city_idx. CREATE INDEX IF NOT EXISTS with distinct names is safe
-- and adds any missing ones without conflict.

CREATE INDEX IF NOT EXISTS idx_businesses_city_id   ON public.businesses(city_id);
CREATE INDEX IF NOT EXISTS idx_events_city_id        ON public.events(city_id);
CREATE INDEX IF NOT EXISTS idx_resources_city_id     ON public.resources(city_id);
CREATE INDEX IF NOT EXISTS idx_job_listings_city_id  ON public.job_listings(city_id);
CREATE INDEX IF NOT EXISTS idx_posts_city_id         ON public.posts(city_id);
CREATE INDEX IF NOT EXISTS idx_reels_city_id         ON public.reels(city_id);
CREATE INDEX IF NOT EXISTS idx_channels_city_id      ON public.channels(city_id);

-- content_scope indexes (new — no prior migration covered these)
CREATE INDEX IF NOT EXISTS idx_businesses_content_scope   ON public.businesses(content_scope);
CREATE INDEX IF NOT EXISTS idx_events_content_scope        ON public.events(content_scope);
CREATE INDEX IF NOT EXISTS idx_resources_content_scope     ON public.resources(content_scope);
CREATE INDEX IF NOT EXISTS idx_job_listings_content_scope  ON public.job_listings(content_scope);
CREATE INDEX IF NOT EXISTS idx_posts_content_scope         ON public.posts(content_scope);
CREATE INDEX IF NOT EXISTS idx_reels_content_scope         ON public.reels(content_scope);
CREATE INDEX IF NOT EXISTS idx_channels_content_scope      ON public.channels(content_scope);

-- ── Part D: Add city_id to chamber_updates ────────────────────────────────────
-- Note: There is no standalone `chambers` table in this schema. The chamber
-- concept lives in chamber_updates (posts by chamber_admin users) and in
-- organizations rows of type 'chamber'. We apply city_id to chamber_updates
-- to enable city-scoped chamber content.

ALTER TABLE public.chamber_updates
  ADD COLUMN IF NOT EXISTS city_id uuid REFERENCES public.cities(id);

CREATE INDEX IF NOT EXISTS idx_chamber_updates_city_id ON public.chamber_updates(city_id);
