-- ============================================================
-- Hub City App — Channels, Videos, Time Blocks, Follows
-- For Creator Program & HubCity TV
-- ============================================================

-- ============================================================
-- CHANNELS
-- ============================================================
CREATE TABLE IF NOT EXISTS channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'community'
    CHECK (type IN ('school', 'city', 'organization', 'media', 'community')),
  avatar_url TEXT,
  banner_url TEXT,
  owner_id UUID REFERENCES profiles(id),
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  follower_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_channels_slug ON channels(slug);
CREATE INDEX IF NOT EXISTS idx_channels_owner ON channels(owner_id);
CREATE INDEX IF NOT EXISTS idx_channels_active ON channels(is_active) WHERE is_active = TRUE;

CREATE TRIGGER channels_updated_at
  BEFORE UPDATE ON channels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "channels_public_read" ON channels
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "channels_owner_all" ON channels
  FOR ALL USING (owner_id = auth.uid());

-- ============================================================
-- CHANNEL VIDEOS
-- ============================================================
CREATE TABLE IF NOT EXISTS channel_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_type TEXT NOT NULL DEFAULT 'on_demand'
    CHECK (video_type IN ('on_demand', 'featured', 'original', 'podcast', 'city_hall', 'replay')),
  mux_asset_id TEXT,
  mux_playback_id TEXT,
  mux_upload_id TEXT,
  video_url TEXT,
  status TEXT NOT NULL DEFAULT 'processing'
    CHECK (status IN ('processing', 'ready', 'errored')),
  duration REAL,
  thumbnail_url TEXT,
  view_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_channel_videos_channel ON channel_videos(channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_videos_status ON channel_videos(status);
CREATE INDEX IF NOT EXISTS idx_channel_videos_published ON channel_videos(is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_channel_videos_featured ON channel_videos(is_featured) WHERE is_featured = TRUE;

CREATE TRIGGER channel_videos_updated_at
  BEFORE UPDATE ON channel_videos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE channel_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "channel_videos_public_read" ON channel_videos
  FOR SELECT USING (is_published = TRUE AND status = 'ready');

CREATE POLICY "channel_videos_owner_all" ON channel_videos
  FOR ALL USING (
    EXISTS (SELECT 1 FROM channels WHERE id = channel_videos.channel_id AND owner_id = auth.uid())
  );

-- Allow admin insert for seeding
CREATE POLICY "channel_videos_admin_all" ON channel_videos
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'city_official'))
  );

-- ============================================================
-- TIME BLOCKS (scheduled programming)
-- ============================================================
CREATE TABLE IF NOT EXISTS time_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  title TEXT,
  is_recurring BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_time_blocks_channel ON time_blocks(channel_id);
CREATE INDEX IF NOT EXISTS idx_time_blocks_day ON time_blocks(day_of_week);

ALTER TABLE time_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "time_blocks_public_read" ON time_blocks
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "time_blocks_owner_all" ON time_blocks
  FOR ALL USING (
    EXISTS (SELECT 1 FROM channels WHERE id = time_blocks.channel_id AND owner_id = auth.uid())
  );

-- ============================================================
-- CHANNEL FOLLOWS
-- ============================================================
CREATE TABLE IF NOT EXISTS channel_follows (
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (channel_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_channel_follows_user ON channel_follows(user_id);

ALTER TABLE channel_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "channel_follows_public_read" ON channel_follows
  FOR SELECT USING (TRUE);

CREATE POLICY "channel_follows_user_manage" ON channel_follows
  FOR ALL USING (user_id = auth.uid());

-- ============================================================
-- ADD channel_id TO live_streams IF MISSING
-- ============================================================
ALTER TABLE live_streams ADD COLUMN IF NOT EXISTS channel_id UUID REFERENCES channels(id);
