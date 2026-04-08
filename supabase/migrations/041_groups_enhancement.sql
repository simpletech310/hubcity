-- ============================================================
-- 041: Groups Enhancement — video support, avatars, event visibility, comment likes
-- ============================================================

-- ── Community Groups: add avatar_url ────────────────────────
ALTER TABLE community_groups ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- ── Group Posts: add video + pinning support ────────────────
ALTER TABLE group_posts ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE group_posts ADD COLUMN IF NOT EXISTS media_type TEXT CHECK (media_type IN ('image', 'video'));
ALTER TABLE group_posts ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;

-- ── Events: add visibility control ──────────────────────────
ALTER TABLE events ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'group'));

-- ── Group Post Reactions (ensure exists) ────────────────────
CREATE TABLE IF NOT EXISTS group_post_reactions (
  group_post_id UUID NOT NULL REFERENCES group_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL CHECK (emoji IN ('heart', 'fire', 'clap', 'hundred', 'pray')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (group_post_id, user_id, emoji)
);

ALTER TABLE group_post_reactions ENABLE ROW LEVEL SECURITY;

-- Policies (use IF NOT EXISTS pattern via DO block)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'group_post_reactions' AND policyname = 'Anyone can view group post reactions') THEN
    CREATE POLICY "Anyone can view group post reactions" ON group_post_reactions FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'group_post_reactions' AND policyname = 'Users can add group post reactions') THEN
    CREATE POLICY "Users can add group post reactions" ON group_post_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'group_post_reactions' AND policyname = 'Users can remove group post reactions') THEN
    CREATE POLICY "Users can remove group post reactions" ON group_post_reactions FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- ── Group Post Comment Likes ────────────────────────────────
CREATE TABLE IF NOT EXISTS group_post_comment_likes (
  comment_id UUID NOT NULL REFERENCES group_post_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (comment_id, user_id)
);

ALTER TABLE group_post_comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view group comment likes"
  ON group_post_comment_likes FOR SELECT USING (true);

CREATE POLICY "Users can add group comment likes"
  ON group_post_comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove group comment likes"
  ON group_post_comment_likes FOR DELETE USING (auth.uid() = user_id);
