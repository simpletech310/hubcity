-- ============================================================
-- Featured-media slot on profiles
-- ============================================================
-- Lets a creator pin one piece of their work as the hero tile
-- on /creators cards and their /user/[handle] profile.
-- featured_id is a soft pointer (no FK) because it can target
-- any of: reels, channel_videos, posts, tracks, gallery_items.
-- The render-time resolver re-validates and gracefully falls
-- back to the algorithmic auto-pick when the row is missing.
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS featured_kind TEXT
    CHECK (featured_kind IS NULL OR featured_kind IN ('reel','video','post','track','exhibit')),
  ADD COLUMN IF NOT EXISTS featured_id UUID,
  ADD COLUMN IF NOT EXISTS featured_caption TEXT,
  ADD COLUMN IF NOT EXISTS featured_set_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_profiles_featured
  ON profiles(featured_kind)
  WHERE featured_id IS NOT NULL;
