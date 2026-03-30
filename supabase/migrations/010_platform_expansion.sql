-- ============================================================
-- Hub City App — Platform Expansion
-- City Issues, Reviews, Podcasts, Groups, Badges, Bot Support,
-- Hashtag Actions, Schools DB, Audit Log, Search Logging
-- ============================================================

-- ============================================================
-- EXTEND notification_type ENUM
-- ============================================================
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'order';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'booking';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'application';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'message';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'issue';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'badge';

-- ============================================================
-- PROFILES — add is_bot + is_suspended
-- ============================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_bot BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspended_reason TEXT;

-- ============================================================
-- POSTS — add hashtag + automation support
-- ============================================================
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_automated BOOLEAN DEFAULT false;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS hashtags TEXT[] DEFAULT '{}';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS location_text TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- ============================================================
-- CITY ISSUES
-- ============================================================
CREATE TYPE issue_type AS ENUM (
  'pothole', 'streetlight', 'graffiti', 'trash', 'flooding',
  'parking', 'noise', 'sidewalk', 'tree', 'parks', 'water',
  'stray', 'safety', 'other'
);
CREATE TYPE issue_status AS ENUM (
  'reported', 'acknowledged', 'in_progress', 'resolved', 'closed'
);
CREATE TYPE issue_priority AS ENUM ('low', 'normal', 'high', 'critical');

CREATE TABLE city_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type issue_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  location_text TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  district INTEGER CHECK (district BETWEEN 1 AND 4),
  image_url TEXT,
  status issue_status DEFAULT 'reported',
  priority issue_priority DEFAULT 'normal',
  reported_by UUID REFERENCES profiles(id),
  source_post_id UUID REFERENCES posts(id),
  assigned_department TEXT,
  department_email TEXT,
  upvote_count INTEGER DEFAULT 1,
  forwarded_at TIMESTAMPTZ,
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  resolved_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE city_issue_upvotes (
  issue_id UUID REFERENCES city_issues(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (issue_id, user_id)
);

CREATE TRIGGER city_issues_updated_at
  BEFORE UPDATE ON city_issues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE city_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE city_issue_upvotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view issues" ON city_issues FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create issues" ON city_issues FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Admin/officials can update issues" ON city_issues FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'city_official'))
  );
CREATE POLICY "Reporter can update own issue" ON city_issues FOR UPDATE
  USING (reported_by = auth.uid());

CREATE POLICY "Anyone can view upvotes" ON city_issue_upvotes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can upvote" ON city_issue_upvotes FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove own upvote" ON city_issue_upvotes FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- BUSINESS REVIEWS
-- ============================================================
CREATE TABLE business_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  body TEXT,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(business_id, reviewer_id)
);

CREATE TRIGGER business_reviews_updated_at
  BEFORE UPDATE ON business_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE business_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published reviews" ON business_reviews FOR SELECT
  USING (is_published = true);
CREATE POLICY "Authenticated users can create reviews" ON business_reviews FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id);
CREATE POLICY "Users can update own review" ON business_reviews FOR UPDATE
  USING (auth.uid() = reviewer_id);
CREATE POLICY "Admin can manage reviews" ON business_reviews FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- PODCASTS
-- ============================================================
CREATE TABLE podcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  audio_url TEXT NOT NULL,
  duration INTEGER, -- seconds
  episode_number INTEGER,
  season_number INTEGER DEFAULT 1,
  thumbnail_url TEXT,
  transcript TEXT,
  listen_count INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER podcasts_updated_at
  BEFORE UPDATE ON podcasts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE podcasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published podcasts" ON podcasts FOR SELECT
  USING (is_published = true);
CREATE POLICY "Admin/officials can manage podcasts" ON podcasts FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'city_official')));

-- ============================================================
-- COMMUNITY GROUPS
-- ============================================================
CREATE TYPE group_category AS ENUM (
  'neighborhood', 'interest', 'school', 'faith', 'sports', 'business', 'other'
);

CREATE TABLE community_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  category group_category DEFAULT 'other',
  image_url TEXT,
  is_public BOOLEAN DEFAULT true,
  member_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE group_members (
  group_id UUID REFERENCES community_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member', -- member, moderator, admin
  joined_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);

CREATE TRIGGER community_groups_updated_at
  BEFORE UPDATE ON community_groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE community_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active groups" ON community_groups FOR SELECT USING (is_active = true);
CREATE POLICY "Authenticated users can create groups" ON community_groups FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Creator can update own group" ON community_groups FOR UPDATE
  USING (created_by = auth.uid());
CREATE POLICY "Admin can manage groups" ON community_groups FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Anyone can view group members" ON group_members FOR SELECT USING (true);
CREATE POLICY "Users can join groups" ON group_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave groups" ON group_members FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- CITIZEN BADGES
-- ============================================================
CREATE TABLE citizen_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, badge_type)
);

ALTER TABLE citizen_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view badges" ON citizen_badges FOR SELECT USING (true);
CREATE POLICY "System can award badges" ON citizen_badges FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- SCHOOLS TABLE (move from hardcoded)
-- ============================================================
CREATE TABLE schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  level TEXT NOT NULL, -- elementary, middle, high, college
  grades TEXT,
  enrollment INTEGER,
  rating NUMERIC(2,1),
  established INTEGER,
  address TEXT,
  phone TEXT,
  website TEXT,
  district INTEGER CHECK (district BETWEEN 1 AND 4),
  tagline TEXT,
  principal TEXT,
  mascot TEXT,
  colors JSONB DEFAULT '[]', -- [{hex, name}]
  programs TEXT[] DEFAULT '{}',
  athletics TEXT[] DEFAULT '{}',
  clubs TEXT[] DEFAULT '{}',
  highlights TEXT[] DEFAULT '{}',
  notable_alumni TEXT[] DEFAULT '{}',
  image_url TEXT,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER schools_updated_at
  BEFORE UPDATE ON schools
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE schools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published schools" ON schools FOR SELECT USING (is_published = true);
CREATE POLICY "Admin/officials can manage schools" ON schools FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'city_official')));

-- ============================================================
-- BROADCAST LOG (track sent notifications)
-- ============================================================
CREATE TABLE broadcast_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  target_district INTEGER, -- NULL = all districts
  sent_by UUID REFERENCES profiles(id),
  recipient_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE broadcast_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/officials can view broadcasts" ON broadcast_log FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'city_official')));
CREATE POLICY "Admin/officials can create broadcasts" ON broadcast_log FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'city_official')));

-- ============================================================
-- AUDIT LOG
-- ============================================================
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL, -- 'role_change', 'suspend', 'delete_post', etc.
  target_type TEXT, -- 'user', 'post', 'business', etc.
  target_id UUID,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view audit log" ON audit_log FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "System can create audit entries" ON audit_log FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- SEARCH QUERY LOG (for understanding citizen needs)
-- ============================================================
CREATE TABLE search_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  query TEXT NOT NULL,
  search_type TEXT DEFAULT 'global', -- global, resource, business, ai
  result_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE search_queries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view search queries" ON search_queries FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Anyone can log searches" ON search_queries FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- HASHTAG REGISTRY (configurable action hashtags)
-- ============================================================
CREATE TABLE hashtag_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hashtag TEXT UNIQUE NOT NULL, -- without #
  action_type TEXT NOT NULL, -- 'issue', 'spotlight', 'commerce', 'event'
  issue_type issue_type, -- for issue-type hashtags
  department TEXT,
  department_email TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE hashtag_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active hashtags" ON hashtag_actions FOR SELECT
  USING (is_active = true);
CREATE POLICY "Admin can manage hashtags" ON hashtag_actions FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'city_official')));

-- Seed default hashtag actions
INSERT INTO hashtag_actions (hashtag, action_type, issue_type, department, department_email, description) VALUES
  ('pothole', 'issue', 'pothole', 'Public Works', 'publicworks@comptoncity.org', 'Report potholes on city streets'),
  ('streetlight', 'issue', 'streetlight', 'Public Works', 'publicworks@comptoncity.org', 'Report broken or damaged streetlights'),
  ('graffiti', 'issue', 'graffiti', 'Sanitation', 'sanitation@comptoncity.org', 'Report graffiti for removal'),
  ('trash', 'issue', 'trash', 'Sanitation', 'sanitation@comptoncity.org', 'Report illegal dumping or missed trash collection'),
  ('flooding', 'issue', 'flooding', 'Public Works', 'publicworks@comptoncity.org', 'Report flooding or drainage issues'),
  ('parking', 'issue', 'parking', 'Code Enforcement', 'codeenforcement@comptoncity.org', 'Report parking violations or issues'),
  ('noise', 'issue', 'noise', 'Code Enforcement', 'codeenforcement@comptoncity.org', 'Report noise complaints'),
  ('sidewalk', 'issue', 'sidewalk', 'Public Works', 'publicworks@comptoncity.org', 'Report damaged sidewalks'),
  ('tree', 'issue', 'tree', 'Parks & Recreation', 'parks@comptoncity.org', 'Report tree trimming or removal needs'),
  ('parks', 'issue', 'parks', 'Parks & Recreation', 'parks@comptoncity.org', 'Report park maintenance issues'),
  ('water', 'issue', 'water', 'Utilities', 'utilities@comptoncity.org', 'Report water leaks or water quality issues'),
  ('stray', 'issue', 'stray', 'Animal Control', 'animalcontrol@comptoncity.org', 'Report stray animals'),
  ('safety', 'issue', 'safety', 'Public Safety', 'publicsafety@comptoncity.org', 'Report public safety concerns'),
  ('shoutout', 'spotlight', NULL, NULL, NULL, 'Give a community shoutout'),
  ('hiring', 'commerce', NULL, NULL, NULL, 'Announce job openings'),
  ('deal', 'commerce', NULL, NULL, NULL, 'Share a deal or promotion'),
  ('event', 'event', NULL, NULL, NULL, 'Suggest an event')
ON CONFLICT (hashtag) DO NOTHING;

-- ============================================================
-- BOT SCHEDULE TRACKING
-- ============================================================
CREATE TABLE bot_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_name TEXT NOT NULL, -- 'hubcity', 'pollster', 'spotlight', 'resources'
  post_type TEXT NOT NULL, -- 'morning_brief', 'weekly_stats', 'event_reminder', etc.
  post_id UUID REFERENCES posts(id),
  poll_id UUID REFERENCES polls(id),
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE bot_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view bot posts" ON bot_posts FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'city_official')));
CREATE POLICY "System can create bot posts" ON bot_posts FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- CONTENT REPORTS (flag system)
-- ============================================================
CREATE TYPE report_status AS ENUM ('pending', 'reviewed', 'action_taken', 'dismissed');

CREATE TABLE content_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES profiles(id),
  content_type TEXT NOT NULL, -- 'post', 'comment', 'review', 'business'
  content_id UUID NOT NULL,
  reason TEXT NOT NULL, -- 'spam', 'inappropriate', 'harassment', 'misinformation', 'other'
  details TEXT,
  status report_status DEFAULT 'pending',
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  action_taken TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create reports" ON content_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Admin can manage reports" ON content_reports FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'city_official')));
