-- ============================================================
-- Knect TV Pivot — National thematic channels, shows, simulated live
-- ============================================================

-- 1a. Expand channels.type to include new thematic categories
ALTER TABLE channels DROP CONSTRAINT IF EXISTS channels_type_check;
ALTER TABLE channels ADD CONSTRAINT channels_type_check CHECK (type IN (
  -- legacy "local" types
  'school','city','organization','media','community','museum',
  -- new "national" thematic types
  'food','home','art','fashion','wellness','comedy','talk',
  'business','tech','education','civic','music','faith','sports'
));

-- 1b. Channel scope: national (open to all) vs local (verified-address only)
ALTER TABLE channels
  ADD COLUMN IF NOT EXISTS scope TEXT NOT NULL DEFAULT 'local'
    CHECK (scope IN ('national','local')),
  ADD COLUMN IF NOT EXISTS is_live_simulated BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_channels_scope ON channels(scope);
CREATE INDEX IF NOT EXISTS idx_channels_live_sim ON channels(is_live_simulated) WHERE is_live_simulated = TRUE;

-- ============================================================
-- 1c. SHOWS — parent container grouping episodes on a channel
-- ============================================================
CREATE TABLE IF NOT EXISTS shows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  tagline TEXT,
  description TEXT,
  poster_url TEXT,
  runtime_minutes INTEGER,
  format TEXT,
  creator_id UUID REFERENCES profiles(id),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shows_channel ON shows(channel_id);
CREATE INDEX IF NOT EXISTS idx_shows_slug ON shows(slug);

CREATE TRIGGER shows_updated_at
  BEFORE UPDATE ON shows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE shows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shows_public_read" ON shows
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "shows_creator_all" ON shows
  FOR ALL USING (creator_id = auth.uid());

CREATE POLICY "shows_admin_all" ON shows
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','city_official'))
  );

-- ============================================================
-- 1d. channel_videos: link to shows + PPV scaffolding
-- ============================================================
ALTER TABLE channel_videos
  ADD COLUMN IF NOT EXISTS show_id UUID REFERENCES shows(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS episode_number INTEGER,
  ADD COLUMN IF NOT EXISTS is_premium BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS price_cents INTEGER,
  ADD COLUMN IF NOT EXISTS preview_seconds INTEGER;

CREATE INDEX IF NOT EXISTS idx_channel_videos_show ON channel_videos(show_id);

-- ============================================================
-- 1e. SCHEDULED BROADCASTS — the simulated live TV schedule
-- ============================================================
CREATE TABLE IF NOT EXISTS scheduled_broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES channel_videos(id) ON DELETE CASCADE,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  position INTEGER NOT NULL,
  is_ad_slot BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_broadcasts_channel_time
  ON scheduled_broadcasts(channel_id, starts_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_broadcasts_window
  ON scheduled_broadcasts(starts_at, ends_at);

ALTER TABLE scheduled_broadcasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scheduled_broadcasts_public_read" ON scheduled_broadcasts
  FOR SELECT USING (TRUE);

-- ============================================================
-- 1f. PPV — video_purchases ledger (Stripe wiring deferred)
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payment_intents_resource_type_check') THEN
    ALTER TABLE payment_intents DROP CONSTRAINT payment_intents_resource_type_check;
    ALTER TABLE payment_intents ADD CONSTRAINT payment_intents_resource_type_check
      CHECK (resource_type IN ('booking','order','ticket','video_purchase'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS video_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES channel_videos(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, video_id)
);

CREATE INDEX IF NOT EXISTS idx_video_purchases_user ON video_purchases(user_id);

ALTER TABLE video_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "video_purchases_own_read" ON video_purchases
  FOR SELECT USING (user_id = auth.uid());

-- ============================================================
-- 1g. SHOW SUBMISSIONS — community pitches
-- ============================================================
CREATE TABLE IF NOT EXISTS show_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submitter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  show_title TEXT NOT NULL,
  channel_slug TEXT,
  tagline TEXT,
  synopsis TEXT NOT NULL,
  format TEXT,
  pilot_video_url TEXT,
  social_links JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected','needs_info')),
  reviewer_id UUID REFERENCES profiles(id),
  reviewer_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_show_submissions_submitter ON show_submissions(submitter_id);
CREATE INDEX IF NOT EXISTS idx_show_submissions_status ON show_submissions(status);

CREATE TRIGGER show_submissions_updated_at
  BEFORE UPDATE ON show_submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE show_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "show_submissions_own" ON show_submissions
  FOR ALL USING (submitter_id = auth.uid());

CREATE POLICY "show_submissions_admin" ON show_submissions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','city_official'))
  );

-- ============================================================
-- 1h. STORAGE BUCKET — show-posters (public read, admin write)
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('show-posters', 'show-posters', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'show_posters_public_read') THEN
    CREATE POLICY "show_posters_public_read" ON storage.objects FOR SELECT
      USING (bucket_id = 'show-posters');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'show_posters_admin_write') THEN
    CREATE POLICY "show_posters_admin_write" ON storage.objects FOR INSERT
      WITH CHECK (
        bucket_id = 'show-posters'
        AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','city_official'))
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'show_posters_admin_update') THEN
    CREATE POLICY "show_posters_admin_update" ON storage.objects FOR UPDATE
      USING (
        bucket_id = 'show-posters'
        AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','city_official'))
      );
  END IF;
END $$;
