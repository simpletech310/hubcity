-- ============================================================
-- Profile gallery images — creators can curate a photo wall on
-- their public profile (masonry grid), optionally tagged to an event.
-- ============================================================

CREATE TABLE IF NOT EXISTS profile_gallery_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  width INTEGER,
  height INTEGER,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profile_gallery_owner
  ON profile_gallery_images (owner_id, display_order DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_profile_gallery_event
  ON profile_gallery_images (event_id)
  WHERE event_id IS NOT NULL;

ALTER TABLE profile_gallery_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profile_gallery_public_read"
  ON profile_gallery_images FOR SELECT
  USING (true);

CREATE POLICY "profile_gallery_owner_insert"
  ON profile_gallery_images FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "profile_gallery_owner_update"
  ON profile_gallery_images FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "profile_gallery_owner_delete"
  ON profile_gallery_images FOR DELETE
  USING (owner_id = auth.uid());
