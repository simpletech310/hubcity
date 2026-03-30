-- ============================================================
-- SCHOOL POSTS SYSTEM
-- School admins can post to their school's profile page
-- Posts appear in an Instagram-style grid
-- ============================================================

-- Link users to schools they can admin
CREATE TABLE school_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'staff', 'coach')),
  title TEXT, -- e.g. "Principal", "Athletic Director", "Communications"
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(school_id, user_id)
);

ALTER TABLE school_admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view school admins" ON school_admins FOR SELECT USING (true);
CREATE POLICY "Platform admins manage school admins" ON school_admins FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'city_official')));

-- Add school_id to posts so a post can be tied to a school profile
ALTER TABLE posts ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_posts_school_id ON posts(school_id) WHERE school_id IS NOT NULL;

-- School posts RLS: school admins can insert/update/delete their school's posts
CREATE POLICY "School admins can create school posts" ON posts FOR INSERT
  WITH CHECK (
    school_id IS NULL
    OR EXISTS (
      SELECT 1 FROM school_admins
      WHERE school_admins.school_id = posts.school_id
        AND school_admins.user_id = auth.uid()
    )
  );

CREATE POLICY "School admins can update their school posts" ON posts FOR UPDATE
  USING (
    school_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM school_admins
      WHERE school_admins.school_id = posts.school_id
        AND school_admins.user_id = auth.uid()
    )
  );

CREATE POLICY "School admins can delete their school posts" ON posts FOR DELETE
  USING (
    school_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM school_admins
      WHERE school_admins.school_id = posts.school_id
        AND school_admins.user_id = auth.uid()
    )
  );
