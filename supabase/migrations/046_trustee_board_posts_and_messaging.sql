-- ============================================================
-- 046: Trustee Board Posts & Messaging — trustee area posts, programs, messaging
-- ============================================================

-- ── Trustee Area Posts (school trustee feed) ─────────────────
CREATE TABLE IF NOT EXISTS trustee_area_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trustee_area TEXT NOT NULL CHECK (trustee_area IN ('A','B','C','D','E','F','G')),
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_type TEXT NOT NULL DEFAULT 'update' CHECK (post_type IN ('update', 'alert', 'photo')),
  title TEXT,
  body TEXT,
  image_url TEXT,
  video_url TEXT,
  media_type TEXT CHECK (media_type IN ('image', 'video')),
  is_pinned BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  reaction_counts JSONB DEFAULT '{}',
  comment_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE trustee_area_posts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'trustee_area_posts' AND policyname = 'Anyone can view trustee area posts') THEN
    CREATE POLICY "Anyone can view trustee area posts" ON trustee_area_posts FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'trustee_area_posts' AND policyname = 'School trustees can create trustee area posts') THEN
    CREATE POLICY "School trustees can create trustee area posts" ON trustee_area_posts FOR INSERT
      WITH CHECK (auth.uid() = author_id AND EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'school_trustee'
      ));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'trustee_area_posts' AND policyname = 'School trustees can update own trustee area posts') THEN
    CREATE POLICY "School trustees can update own trustee area posts" ON trustee_area_posts FOR UPDATE
      USING (auth.uid() = author_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'trustee_area_posts' AND policyname = 'School trustees can delete own trustee area posts') THEN
    CREATE POLICY "School trustees can delete own trustee area posts" ON trustee_area_posts FOR DELETE
      USING (auth.uid() = author_id);
  END IF;
END $$;

-- ── Trustee Area Post Comments ──────────────────────────────
CREATE TABLE IF NOT EXISTS trustee_area_post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES trustee_area_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES trustee_area_post_comments(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE trustee_area_post_comments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'trustee_area_post_comments' AND policyname = 'Anyone can view trustee area post comments') THEN
    CREATE POLICY "Anyone can view trustee area post comments" ON trustee_area_post_comments FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'trustee_area_post_comments' AND policyname = 'Authenticated users can comment on trustee area posts') THEN
    CREATE POLICY "Authenticated users can comment on trustee area posts" ON trustee_area_post_comments FOR INSERT
      WITH CHECK (auth.uid() = author_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'trustee_area_post_comments' AND policyname = 'Users can delete own trustee area comments') THEN
    CREATE POLICY "Users can delete own trustee area comments" ON trustee_area_post_comments FOR DELETE
      USING (auth.uid() = author_id OR EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('school_trustee', 'admin')
      ));
  END IF;
END $$;

-- ── Trustee Area Post Reactions ─────────────────────────────
CREATE TABLE IF NOT EXISTS trustee_area_post_reactions (
  post_id UUID NOT NULL REFERENCES trustee_area_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL CHECK (emoji IN ('heart', 'fire', 'clap', 'hundred', 'pray')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id, emoji)
);

ALTER TABLE trustee_area_post_reactions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'trustee_area_post_reactions' AND policyname = 'Anyone can view trustee area post reactions') THEN
    CREATE POLICY "Anyone can view trustee area post reactions" ON trustee_area_post_reactions FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'trustee_area_post_reactions' AND policyname = 'Users can add trustee area post reactions') THEN
    CREATE POLICY "Users can add trustee area post reactions" ON trustee_area_post_reactions FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'trustee_area_post_reactions' AND policyname = 'Users can remove trustee area post reactions') THEN
    CREATE POLICY "Users can remove trustee area post reactions" ON trustee_area_post_reactions FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- ── Trustee Messages ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trustee_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE trustee_messages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'trustee_messages' AND policyname = 'Sender and trustee can view messages') THEN
    CREATE POLICY "Sender and trustee can view messages" ON trustee_messages FOR SELECT
      USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'trustee_messages' AND policyname = 'Authenticated users can send trustee messages') THEN
    CREATE POLICY "Authenticated users can send trustee messages" ON trustee_messages FOR INSERT
      WITH CHECK (auth.uid() = sender_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'trustee_messages' AND policyname = 'Trustees can update message read status') THEN
    CREATE POLICY "Trustees can update message read status" ON trustee_messages FOR UPDATE
      USING (auth.uid() = receiver_id);
  END IF;
END $$;

-- ── Trustee Area Programs ───────────────────────────────────
CREATE TABLE IF NOT EXISTS trustee_area_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trustee_area TEXT NOT NULL CHECK (trustee_area IN ('A','B','C','D','E','F','G')),
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'community' CHECK (category IN ('community', 'youth', 'sports', 'education', 'health', 'senior', 'arts')),
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  schedule TEXT,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE trustee_area_programs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'trustee_area_programs' AND policyname = 'Anyone can view trustee area programs') THEN
    CREATE POLICY "Anyone can view trustee area programs" ON trustee_area_programs FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'trustee_area_programs' AND policyname = 'School trustees can create trustee area programs') THEN
    CREATE POLICY "School trustees can create trustee area programs" ON trustee_area_programs FOR INSERT
      WITH CHECK (auth.uid() = created_by AND EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'school_trustee'
      ));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'trustee_area_programs' AND policyname = 'School trustees can update own programs') THEN
    CREATE POLICY "School trustees can update own programs" ON trustee_area_programs FOR UPDATE
      USING (auth.uid() = created_by);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'trustee_area_programs' AND policyname = 'School trustees can delete own programs') THEN
    CREATE POLICY "School trustees can delete own programs" ON trustee_area_programs FOR DELETE
      USING (auth.uid() = created_by);
  END IF;
END $$;

-- ── Indexes for performance ─────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_trustee_area_posts_area ON trustee_area_posts(trustee_area, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trustee_area_posts_author ON trustee_area_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_trustee_area_post_comments_post ON trustee_area_post_comments(post_id, created_at);
CREATE INDEX IF NOT EXISTS idx_trustee_area_post_reactions_post ON trustee_area_post_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_trustee_messages_receiver ON trustee_messages(receiver_id, is_read);
CREATE INDEX IF NOT EXISTS idx_trustee_messages_sender ON trustee_messages(sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trustee_area_programs_area ON trustee_area_programs(trustee_area, is_active);
