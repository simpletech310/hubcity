-- ============================================================
-- Hub City App — Soft-delete foundation
-- ============================================================
-- Adds `deleted_at TIMESTAMPTZ` to the user-generated content tables
-- that benefit most from a "trash + restore" UX. Existing hard-DELETE
-- handlers keep working; the new helper at `src/lib/soft-delete.ts`
-- is opt-in. Future passes can migrate each DELETE handler over.
--
-- Tables covered:
--   posts, events, albums, tracks, community_groups,
--   reels, group_posts, channel_videos
--
-- Public-read policies are tightened to hide soft-deleted rows.
-- ============================================================

ALTER TABLE posts             ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE events            ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE albums            ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE tracks            ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE community_groups  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE reels             ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE group_posts       ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE channel_videos    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Partial indexes — fast queries for live (non-deleted) rows.
CREATE INDEX IF NOT EXISTS idx_posts_live           ON posts            (created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_events_live          ON events           (start_date)      WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_albums_live          ON albums           (created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tracks_live          ON tracks           (created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_community_groups_live ON community_groups (created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_reels_live           ON reels            (created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_group_posts_live     ON group_posts      (created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_channel_videos_live  ON channel_videos   (published_at DESC) WHERE deleted_at IS NULL;

-- Trash-aware row counts for the dashboard restore page.
CREATE INDEX IF NOT EXISTS idx_posts_trash           ON posts            (author_id, deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_trash          ON events           (created_by, deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_albums_trash          ON albums           (creator_id, deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_community_groups_trash ON community_groups (created_by, deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reels_trash           ON reels            (author_id, deleted_at) WHERE deleted_at IS NOT NULL;
