-- ============================================================
-- 091: Group Reels + Admin Approval + Curated Gallery
--
-- Adds three capabilities to community_groups:
--   1) `reels.group_id` so members can scope reels to a group.
--   2) `group_members.status` ('active'|'pending') so the group
--      creator/admin can approve, reject, or revoke access on
--      private groups.
--   3) `group_gallery_items` table — admin-curated images and
--      videos shown in the group gallery alongside post media.
-- ============================================================

-- ── 1. Reels can be scoped to a group ──────────────────────
ALTER TABLE reels
  ADD COLUMN IF NOT EXISTS group_id UUID
    REFERENCES community_groups(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_reels_group
  ON reels (group_id, created_at DESC)
  WHERE group_id IS NOT NULL AND is_published = TRUE;

-- ── 2. Group membership status (for approval flow) ─────────
-- 'active'  : confirmed member
-- 'pending' : awaiting admin approval (private groups)
ALTER TABLE group_members
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

ALTER TABLE group_members
  DROP CONSTRAINT IF EXISTS group_members_status_check;

ALTER TABLE group_members
  ADD CONSTRAINT group_members_status_check
    CHECK (status IN ('active', 'pending'));

CREATE INDEX IF NOT EXISTS idx_group_members_pending
  ON group_members (group_id, joined_at DESC)
  WHERE status = 'pending';

-- ── 3. Curated gallery items ───────────────────────────────
CREATE TABLE IF NOT EXISTS group_gallery_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES community_groups(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  media_url TEXT NOT NULL,
  media_path TEXT NOT NULL,            -- Storage path (for delete)
  poster_url TEXT,                     -- Video thumbnail
  poster_path TEXT,
  caption TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_group_gallery_items_group
  ON group_gallery_items (group_id, sort_order DESC, created_at DESC);

ALTER TABLE group_gallery_items ENABLE ROW LEVEL SECURITY;

-- Anyone can read curated media for active groups they can see.
CREATE POLICY "group_gallery_public_read"
  ON group_gallery_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM community_groups g
      WHERE g.id = group_gallery_items.group_id
        AND g.is_active = TRUE
    )
  );

-- Only group admins/moderators can insert.
CREATE POLICY "group_gallery_admin_insert"
  ON group_gallery_items FOR INSERT
  WITH CHECK (
    auth.uid() = uploaded_by
    AND EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_gallery_items.group_id
        AND gm.user_id = auth.uid()
        AND gm.role IN ('admin', 'moderator')
        AND gm.status = 'active'
    )
  );

-- Only admins/mods can delete (or the original uploader).
CREATE POLICY "group_gallery_admin_delete"
  ON group_gallery_items FOR DELETE
  USING (
    uploaded_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_gallery_items.group_id
        AND gm.user_id = auth.uid()
        AND gm.role = 'admin'
        AND gm.status = 'active'
    )
  );

-- ── 4. Storage bucket for group media ──────────────────────
-- Reuse existing 'reels' and 'post-media' buckets if available;
-- otherwise the app can fall back to public 'group-media' bucket.
-- (Bucket creation is idempotent in the seed script — left out here.)

COMMENT ON COLUMN reels.group_id IS
  'When set, this reel is scoped to a community group instead of the global feed.';
COMMENT ON COLUMN group_members.status IS
  'active = confirmed; pending = awaiting admin approval (private groups).';
COMMENT ON TABLE group_gallery_items IS
  'Admin-curated photos / videos shown on the group gallery tab.';
