-- ============================================================
-- Add interest-tag arrays to events and community_groups
-- ============================================================
-- Mirrors the existing resources.match_tags TEXT[] pattern.
-- GIN indexes for fast `@>` containment queries.
-- Backfill copies the current category::text into tags so legacy
-- rows stay visible when /events and /groups switch to filtering
-- by tag.
-- ============================================================

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE community_groups
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_events_tags
  ON events USING GIN (tags);

CREATE INDEX IF NOT EXISTS idx_community_groups_tags
  ON community_groups USING GIN (tags);

-- Backfill: any row with an empty tags array gets the existing category as a tag.
UPDATE events
SET tags = ARRAY[category::text]
WHERE COALESCE(array_length(tags, 1), 0) = 0
  AND category IS NOT NULL;

UPDATE community_groups
SET tags = ARRAY[category::text]
WHERE COALESCE(array_length(tags, 1), 0) = 0
  AND category IS NOT NULL;
