-- Migration 013: Creator Program & Kevel Ad Network
-- Adds creator applications, earnings tracking, and ad campaign infrastructure

-- ═══════════════════════════════════════════════════════
-- 1. Extend profiles for creator program
-- ═══════════════════════════════════════════════════════

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'content_creator';

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_creator BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS creator_approved_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS creator_tier TEXT CHECK (creator_tier IN ('starter', 'rising', 'partner', 'premium'));

-- ═══════════════════════════════════════════════════════
-- 2. Creator Program Tables
-- ═══════════════════════════════════════════════════════

CREATE TABLE creator_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  channel_name TEXT NOT NULL,
  content_type TEXT NOT NULL, -- video, podcast, both
  description TEXT NOT NULL,
  portfolio_url TEXT,
  social_links JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE creator_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES profiles(id),
  source TEXT NOT NULL CHECK (source IN ('ad_revenue', 'tip', 'sponsorship')),
  amount_cents INTEGER NOT NULL,
  description TEXT,
  period_start DATE,
  period_end DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════
-- 3. Kevel Ad Network Tables
-- ═══════════════════════════════════════════════════════

CREATE TABLE ad_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id UUID REFERENCES profiles(id),
  business_id UUID REFERENCES businesses(id),
  kevel_flight_id INTEGER,
  name TEXT NOT NULL,
  budget_cents INTEGER NOT NULL,
  spent_cents INTEGER DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  targeting JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ad_creatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  kevel_creative_id INTEGER,
  ad_type TEXT NOT NULL CHECK (ad_type IN ('pre_roll', 'mid_roll', 'banner', 'audio_spot', 'overlay')),
  title TEXT NOT NULL,
  body TEXT,
  image_url TEXT,
  video_url TEXT,
  audio_url TEXT,
  click_url TEXT NOT NULL,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ad_impressions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creative_id UUID REFERENCES ad_creatives(id),
  campaign_id UUID REFERENCES ad_campaigns(id),
  user_id UUID REFERENCES profiles(id),
  zone TEXT NOT NULL,
  content_id UUID,
  impression_at TIMESTAMPTZ DEFAULT now(),
  clicked BOOLEAN DEFAULT false,
  clicked_at TIMESTAMPTZ
);

-- ═══════════════════════════════════════════════════════
-- 4. Indexes
-- ═══════════════════════════════════════════════════════

CREATE INDEX idx_creator_applications_user ON creator_applications(user_id);
CREATE INDEX idx_creator_applications_status ON creator_applications(status);
CREATE INDEX idx_creator_earnings_creator ON creator_earnings(creator_id);
CREATE INDEX idx_creator_earnings_status ON creator_earnings(status);
CREATE INDEX idx_ad_campaigns_status ON ad_campaigns(status);
CREATE INDEX idx_ad_campaigns_advertiser ON ad_campaigns(advertiser_id);
CREATE INDEX idx_ad_campaigns_business ON ad_campaigns(business_id);
CREATE INDEX idx_ad_creatives_campaign ON ad_creatives(campaign_id);
CREATE INDEX idx_ad_creatives_type ON ad_creatives(ad_type);
CREATE INDEX idx_ad_impressions_campaign ON ad_impressions(campaign_id);
CREATE INDEX idx_ad_impressions_creative ON ad_impressions(creative_id);
CREATE INDEX idx_ad_impressions_zone ON ad_impressions(zone);
CREATE INDEX idx_ad_impressions_at ON ad_impressions(impression_at);

-- ═══════════════════════════════════════════════════════
-- 5. Updated_at triggers
-- ═══════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_creator_applications_updated_at
  BEFORE UPDATE ON creator_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_ad_campaigns_updated_at
  BEFORE UPDATE ON ad_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════
-- 6. RLS Policies
-- ═══════════════════════════════════════════════════════

ALTER TABLE creator_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_creatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_impressions ENABLE ROW LEVEL SECURITY;

-- Creator Applications: applicant + admins
CREATE POLICY "Users can view own creator applications"
  ON creator_applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own creator applications"
  ON creator_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all creator applications"
  ON creator_applications FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update creator applications"
  ON creator_applications FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Creator Earnings: creator + admins
CREATE POLICY "Creators can view own earnings"
  ON creator_earnings FOR SELECT
  USING (auth.uid() = creator_id);

CREATE POLICY "Admins can view all earnings"
  ON creator_earnings FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can manage earnings"
  ON creator_earnings FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Ad Campaigns: anyone can view active, business owners manage own, admins manage all
CREATE POLICY "Anyone can view active ad campaigns"
  ON ad_campaigns FOR SELECT
  USING (status = 'active');

CREATE POLICY "Business owners can view own campaigns"
  ON ad_campaigns FOR SELECT
  USING (auth.uid() = advertiser_id);

CREATE POLICY "Business owners can insert own campaigns"
  ON ad_campaigns FOR INSERT
  WITH CHECK (auth.uid() = advertiser_id);

CREATE POLICY "Business owners can update own campaigns"
  ON ad_campaigns FOR UPDATE
  USING (auth.uid() = advertiser_id);

CREATE POLICY "Admins can manage all campaigns"
  ON ad_campaigns FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Ad Creatives: follow campaign access
CREATE POLICY "Anyone can view creatives of active campaigns"
  ON ad_creatives FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM ad_campaigns WHERE id = campaign_id AND status = 'active')
  );

CREATE POLICY "Business owners can manage own creatives"
  ON ad_creatives FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM ad_campaigns
      WHERE id = campaign_id AND advertiser_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all creatives"
  ON ad_creatives FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Ad Impressions: insert-only for authenticated users
CREATE POLICY "Authenticated users can insert impressions"
  ON ad_impressions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can view all impressions"
  ON ad_impressions FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Business owners can view own campaign impressions"
  ON ad_impressions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ad_campaigns
      WHERE id = campaign_id AND advertiser_id = auth.uid()
    )
  );
