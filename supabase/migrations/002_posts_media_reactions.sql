-- ============================================================
-- Hub City App — Posts Media & Reactions
-- ============================================================

-- Add media columns to posts
ALTER TABLE posts ADD COLUMN media_type TEXT CHECK (media_type IN ('image', 'video'));
ALTER TABLE posts ADD COLUMN mux_asset_id TEXT;
ALTER TABLE posts ADD COLUMN mux_playback_id TEXT;
ALTER TABLE posts ADD COLUMN mux_upload_id TEXT;
ALTER TABLE posts ADD COLUMN video_status TEXT DEFAULT 'pending' CHECK (video_status IN ('pending', 'preparing', 'ready', 'errored'));
ALTER TABLE posts ADD COLUMN reaction_counts JSONB DEFAULT '{}';

-- Index for feed queries
CREATE INDEX idx_posts_published ON posts(is_published, is_pinned DESC, created_at DESC);
CREATE INDEX idx_posts_author ON posts(author_id);

-- ============================================================
-- POST REACTIONS
-- ============================================================
CREATE TABLE post_reactions (
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL CHECK (emoji IN ('heart', 'fire', 'clap', 'hundred', 'pray')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id, emoji)
);

CREATE INDEX idx_post_reactions_user ON post_reactions(user_id);

-- RLS for post_reactions
ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reactions are viewable by everyone"
  ON post_reactions FOR SELECT USING (true);

CREATE POLICY "Users can add reactions"
  ON post_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own reactions"
  ON post_reactions FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- STORAGE BUCKET for post images
-- ============================================================
-- Run via Supabase dashboard or SQL:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('post-images', 'post-images', true);

-- Storage RLS policies (run in Supabase SQL editor):
-- CREATE POLICY "Anyone can view post images"
--   ON storage.objects FOR SELECT USING (bucket_id = 'post-images');
-- CREATE POLICY "Authenticated users can upload post images"
--   ON storage.objects FOR INSERT WITH CHECK (
--     bucket_id = 'post-images' AND auth.role() = 'authenticated'
--   );
-- CREATE POLICY "Users can delete own post images"
--   ON storage.objects FOR DELETE USING (
--     bucket_id = 'post-images' AND auth.uid()::text = (storage.foldername(name))[1]
--   );
