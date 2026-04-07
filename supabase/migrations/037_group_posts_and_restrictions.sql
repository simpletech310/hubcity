-- ============================================================
-- Hub City App — Group Posts & Creation Restrictions
-- Only city_ambassador, city_official, admin can CREATE groups.
-- Members can post inside groups they belong to.
-- ============================================================

-- Create group_posts table for in-group discussion
CREATE TABLE IF NOT EXISTS group_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES community_groups(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  image_url TEXT,
  is_published BOOLEAN DEFAULT true,
  reaction_counts JSONB DEFAULT '{}',
  comment_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create group_post_comments table
CREATE TABLE IF NOT EXISTS group_post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_post_id UUID NOT NULL REFERENCES group_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_group_posts_group_id ON group_posts(group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_group_posts_author ON group_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_group_post_comments_post ON group_post_comments(group_post_id, created_at);

-- RLS
ALTER TABLE group_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_post_comments ENABLE ROW LEVEL SECURITY;

-- Anyone can read published group posts (public groups)
CREATE POLICY "Anyone can read group posts" ON group_posts
  FOR SELECT USING (is_published = true);

-- Only group members can create posts in a group
CREATE POLICY "Group members can create posts" ON group_posts
  FOR INSERT WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_id = group_posts.group_id
      AND user_id = auth.uid()
    )
  );

-- Authors can update their own posts
CREATE POLICY "Authors can update own group posts" ON group_posts
  FOR UPDATE USING (author_id = auth.uid());

-- Authors can delete their own posts
CREATE POLICY "Authors can delete own group posts" ON group_posts
  FOR DELETE USING (author_id = auth.uid());

-- Anyone can read comments
CREATE POLICY "Anyone can read group comments" ON group_post_comments
  FOR SELECT USING (is_published = true);

-- Group members can comment
CREATE POLICY "Group members can comment" ON group_post_comments
  FOR INSERT WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (
      SELECT 1 FROM group_posts gp
      JOIN group_members gm ON gm.group_id = gp.group_id
      WHERE gp.id = group_post_comments.group_post_id
      AND gm.user_id = auth.uid()
    )
  );

-- Restrict group creation RLS — only elevated roles
DROP POLICY IF EXISTS "Authenticated users can create groups" ON community_groups;
DROP POLICY IF EXISTS "Anyone can create groups" ON community_groups;
DROP POLICY IF EXISTS "Users can create groups" ON community_groups;

CREATE POLICY "Officials can create groups" ON community_groups
  FOR INSERT WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('city_ambassador', 'city_official', 'admin')
    )
  );
