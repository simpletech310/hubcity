-- ============================================================
-- 042: Council District Enhancement — district posts, programs, messaging
-- ============================================================

-- ── District Posts (council member feed) ────────────────────
CREATE TABLE IF NOT EXISTS district_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district INTEGER NOT NULL CHECK (district BETWEEN 1 AND 4),
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

ALTER TABLE district_posts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'district_posts' AND policyname = 'Anyone can view district posts') THEN
    CREATE POLICY "Anyone can view district posts" ON district_posts FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'district_posts' AND policyname = 'City officials can create district posts') THEN
    CREATE POLICY "City officials can create district posts" ON district_posts FOR INSERT
      WITH CHECK (auth.uid() = author_id AND EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'city_official'
      ));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'district_posts' AND policyname = 'City officials can update own district posts') THEN
    CREATE POLICY "City officials can update own district posts" ON district_posts FOR UPDATE
      USING (auth.uid() = author_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'district_posts' AND policyname = 'City officials can delete own district posts') THEN
    CREATE POLICY "City officials can delete own district posts" ON district_posts FOR DELETE
      USING (auth.uid() = author_id);
  END IF;
END $$;

-- ── District Post Comments ─────────────────────────────────
CREATE TABLE IF NOT EXISTS district_post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES district_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES district_post_comments(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE district_post_comments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'district_post_comments' AND policyname = 'Anyone can view district post comments') THEN
    CREATE POLICY "Anyone can view district post comments" ON district_post_comments FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'district_post_comments' AND policyname = 'Authenticated users can comment on district posts') THEN
    CREATE POLICY "Authenticated users can comment on district posts" ON district_post_comments FOR INSERT
      WITH CHECK (auth.uid() = author_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'district_post_comments' AND policyname = 'Users can delete own district comments') THEN
    CREATE POLICY "Users can delete own district comments" ON district_post_comments FOR DELETE
      USING (auth.uid() = author_id OR EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('city_official', 'admin')
      ));
  END IF;
END $$;

-- ── District Post Reactions ────────────────────────────────
CREATE TABLE IF NOT EXISTS district_post_reactions (
  post_id UUID NOT NULL REFERENCES district_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL CHECK (emoji IN ('heart', 'fire', 'clap', 'hundred', 'pray')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id, emoji)
);

ALTER TABLE district_post_reactions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'district_post_reactions' AND policyname = 'Anyone can view district post reactions') THEN
    CREATE POLICY "Anyone can view district post reactions" ON district_post_reactions FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'district_post_reactions' AND policyname = 'Users can add district post reactions') THEN
    CREATE POLICY "Users can add district post reactions" ON district_post_reactions FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'district_post_reactions' AND policyname = 'Users can remove district post reactions') THEN
    CREATE POLICY "Users can remove district post reactions" ON district_post_reactions FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- ── Council Messages ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS council_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district INTEGER NOT NULL CHECK (district BETWEEN 1 AND 4),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  council_member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE council_messages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'council_messages' AND policyname = 'Sender and council member can view messages') THEN
    CREATE POLICY "Sender and council member can view messages" ON council_messages FOR SELECT
      USING (auth.uid() = sender_id OR auth.uid() = council_member_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'council_messages' AND policyname = 'Verified residents can send council messages') THEN
    CREATE POLICY "Verified residents can send council messages" ON council_messages FOR INSERT
      WITH CHECK (auth.uid() = sender_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'council_messages' AND policyname = 'Council members can update message read status') THEN
    CREATE POLICY "Council members can update message read status" ON council_messages FOR UPDATE
      USING (auth.uid() = council_member_id);
  END IF;
END $$;

-- ── District Programs ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS district_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district INTEGER NOT NULL CHECK (district BETWEEN 1 AND 4),
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'community' CHECK (category IN ('community', 'youth', 'sports', 'education', 'health', 'senior', 'arts')),
  location_name TEXT,
  schedule TEXT,
  start_date DATE,
  end_date DATE,
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE district_programs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'district_programs' AND policyname = 'Anyone can view district programs') THEN
    CREATE POLICY "Anyone can view district programs" ON district_programs FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'district_programs' AND policyname = 'City officials can create district programs') THEN
    CREATE POLICY "City officials can create district programs" ON district_programs FOR INSERT
      WITH CHECK (auth.uid() = created_by AND EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'city_official'
      ));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'district_programs' AND policyname = 'City officials can update own programs') THEN
    CREATE POLICY "City officials can update own programs" ON district_programs FOR UPDATE
      USING (auth.uid() = created_by);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'district_programs' AND policyname = 'City officials can delete own programs') THEN
    CREATE POLICY "City officials can delete own programs" ON district_programs FOR DELETE
      USING (auth.uid() = created_by);
  END IF;
END $$;

-- ── Indexes for performance ────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_district_posts_district ON district_posts(district, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_district_posts_author ON district_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_district_post_comments_post ON district_post_comments(post_id, created_at);
CREATE INDEX IF NOT EXISTS idx_district_post_reactions_post ON district_post_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_council_messages_district ON council_messages(district, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_council_messages_council_member ON council_messages(council_member_id, is_read);
CREATE INDEX IF NOT EXISTS idx_district_programs_district ON district_programs(district, is_active);
