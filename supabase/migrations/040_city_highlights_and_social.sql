-- ============================================================
-- 040: City Highlights (standalone) + Post Bookmarks + Comment Likes
-- ============================================================

-- ── City Highlights ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS city_highlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  caption TEXT,
  link_url TEXT,
  link_label TEXT DEFAULT 'Learn More',
  media_width INTEGER,
  media_height INTEGER,
  view_count INTEGER NOT NULL DEFAULT 0,
  reaction_counts JSONB NOT NULL DEFAULT '{}',
  is_published BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_city_highlights_active
  ON city_highlights (created_at DESC)
  WHERE is_published = true;

CREATE INDEX idx_city_highlights_author
  ON city_highlights (author_id);

CREATE INDEX idx_city_highlights_expires
  ON city_highlights (expires_at)
  WHERE expires_at IS NOT NULL;

-- RLS
ALTER TABLE city_highlights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published highlights"
  ON city_highlights FOR SELECT
  USING (is_published = true);

CREATE POLICY "Authorized roles can create highlights"
  ON city_highlights FOR INSERT
  WITH CHECK (
    auth.uid() = author_id
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'city_official', 'city_ambassador', 'business_owner', 'content_creator')
    )
  );

CREATE POLICY "Authors can update their highlights"
  ON city_highlights FOR UPDATE
  USING (auth.uid() = author_id);

-- ── Highlight Reactions ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS highlight_reactions (
  highlight_id UUID NOT NULL REFERENCES city_highlights(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL CHECK (emoji IN ('heart', 'fire', 'clap', 'hundred', 'pray')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (highlight_id, user_id, emoji)
);

ALTER TABLE highlight_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view highlight reactions"
  ON highlight_reactions FOR SELECT
  USING (true);

CREATE POLICY "Users can add reactions"
  ON highlight_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their reactions"
  ON highlight_reactions FOR DELETE
  USING (auth.uid() = user_id);

-- ── Highlight Views ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS highlight_views (
  highlight_id UUID NOT NULL REFERENCES city_highlights(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (highlight_id, user_id)
);

ALTER TABLE highlight_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can record their views"
  ON highlight_views FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can see their views"
  ON highlight_views FOR SELECT
  USING (auth.uid() = user_id);

-- ── Post Bookmarks ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS post_bookmarks (
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

ALTER TABLE post_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their bookmarks"
  ON post_bookmarks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add bookmarks"
  ON post_bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove bookmarks"
  ON post_bookmarks FOR DELETE
  USING (auth.uid() = user_id);

-- ── Comment Likes ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS comment_likes (
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (comment_id, user_id)
);

ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comment likes"
  ON comment_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can add comment likes"
  ON comment_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove comment likes"
  ON comment_likes FOR DELETE
  USING (auth.uid() = user_id);
