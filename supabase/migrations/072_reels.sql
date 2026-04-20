-- ============================================================
-- 072: Reels — short-form video (Instagram Reels / Stories clone)
--
-- Replaces the orphaned `city_highlights` system with a clean,
-- video-first table backed by Supabase Storage (no Mux).
-- Optional expires_at handles the "Story" case (24h TTL); null
-- means a permanent Reel.
-- ============================================================

-- ── 1. Clean slate — drop old, unused highlights tables ─────
DROP TABLE IF EXISTS highlight_views CASCADE;
DROP TABLE IF EXISTS highlight_reactions CASCADE;
DROP TABLE IF EXISTS city_highlights CASCADE;

-- Drop orphaned column on posts
ALTER TABLE posts DROP COLUMN IF EXISTS is_highlight;

-- ── 2. Reels ────────────────────────────────────────────────
CREATE TABLE reels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  video_path TEXT NOT NULL,           -- Storage path (for delete)
  poster_url TEXT,                    -- Thumbnail frame
  poster_path TEXT,                   -- Storage path (for delete)
  caption TEXT,
  duration_seconds NUMERIC(5,2),      -- e.g. 14.37
  width INTEGER,
  height INTEGER,
  view_count INTEGER NOT NULL DEFAULT 0,
  like_count INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  reaction_counts JSONB NOT NULL DEFAULT '{}'::jsonb,
  hashtags TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_story BOOLEAN NOT NULL DEFAULT FALSE,  -- true => 24h TTL
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reels_feed
  ON reels (created_at DESC)
  WHERE is_published = TRUE;

CREATE INDEX idx_reels_author
  ON reels (author_id, created_at DESC);

CREATE INDEX idx_reels_expires
  ON reels (expires_at)
  WHERE expires_at IS NOT NULL;

CREATE INDEX idx_reels_hashtags
  ON reels USING GIN (hashtags);

CREATE TRIGGER reels_updated_at
  BEFORE UPDATE ON reels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE reels ENABLE ROW LEVEL SECURITY;

-- Anyone can read published, non-expired reels
CREATE POLICY "reels_public_read"
  ON reels FOR SELECT
  USING (
    is_published = TRUE
    AND (expires_at IS NULL OR expires_at > NOW())
  );

-- Any authenticated + verified profile can post
CREATE POLICY "reels_verified_insert"
  ON reels FOR INSERT
  WITH CHECK (
    auth.uid() = author_id
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND verification_status = 'verified'
    )
  );

CREATE POLICY "reels_author_update"
  ON reels FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "reels_author_delete"
  ON reels FOR DELETE
  USING (auth.uid() = author_id);

-- ── 3. Reel reactions ───────────────────────────────────────
CREATE TABLE reel_reactions (
  reel_id UUID NOT NULL REFERENCES reels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL CHECK (emoji IN ('heart','fire','clap','hundred','pray')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (reel_id, user_id, emoji)
);

CREATE INDEX idx_reel_reactions_reel ON reel_reactions (reel_id);
CREATE INDEX idx_reel_reactions_user ON reel_reactions (user_id);

ALTER TABLE reel_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reel_reactions_public_read"
  ON reel_reactions FOR SELECT USING (TRUE);

CREATE POLICY "reel_reactions_user_insert"
  ON reel_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reel_reactions_user_delete"
  ON reel_reactions FOR DELETE
  USING (auth.uid() = user_id);

-- ── 4. Reel views (engagement analytics) ────────────────────
CREATE TABLE reel_views (
  reel_id UUID NOT NULL REFERENCES reels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (reel_id, user_id, viewed_at)
);

CREATE INDEX idx_reel_views_reel ON reel_views (reel_id, viewed_at DESC);

ALTER TABLE reel_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reel_views_author_read"
  ON reel_views FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM reels WHERE reels.id = reel_views.reel_id AND reels.author_id = auth.uid()
    )
  );

CREATE POLICY "reel_views_any_insert"
  ON reel_views FOR INSERT
  WITH CHECK (TRUE);

-- ── 5. Storage bucket (public read, authenticated upload) ───
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'reels',
  'reels',
  TRUE,
  104857600, -- 100 MB
  ARRAY['video/mp4','video/webm','video/quicktime','image/jpeg','image/png','image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = TRUE,
  file_size_limit = 104857600,
  allowed_mime_types = ARRAY['video/mp4','video/webm','video/quicktime','image/jpeg','image/png','image/webp'];

-- Storage policies
CREATE POLICY "reels_bucket_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'reels');

CREATE POLICY "reels_bucket_auth_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'reels'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "reels_bucket_owner_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'reels'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
