-- ============================================================
-- 075 — Creator Monetization
-- Stripe Connect for creators, channel subscriptions, PPV (gated VOD).
-- Builds on 070 which already added is_premium / price_cents / preview_seconds
-- to channel_videos and the video_purchases ledger.
-- ============================================================

-- ============================================================
-- 1. CREATOR STRIPE CONNECT ACCOUNTS
-- Mirrors stripe_accounts (businesses) but keyed to a creator profile.
-- A user can be both a business owner AND a creator; payouts are kept on
-- separate Connect accounts so earnings reconcile cleanly per persona.
-- ============================================================
CREATE TABLE IF NOT EXISTS creator_stripe_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_account_id TEXT NOT NULL UNIQUE,
  onboarding_complete BOOLEAN NOT NULL DEFAULT FALSE,
  charges_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  payouts_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_creator_stripe_accounts_creator
  ON creator_stripe_accounts(creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_stripe_accounts_stripe
  ON creator_stripe_accounts(stripe_account_id);

CREATE TRIGGER creator_stripe_accounts_updated_at
  BEFORE UPDATE ON creator_stripe_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE creator_stripe_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "creator_stripe_accounts_own_read"
  ON creator_stripe_accounts FOR SELECT
  USING (creator_id = auth.uid());

-- Inserts/updates flow through service-role webhooks. No RLS write policies
-- for end users — keeps onboarding state tamper-proof.

-- Convenience: store a Stripe Customer id on the profile so subscriptions
-- and the billing portal can be created without re-creating customers.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- ============================================================
-- 2. CHANNEL SUBSCRIPTION PRICING
-- Price lives on the channel; Stripe Price object is created on save and
-- cached so we don't hit Stripe on every read.
-- ============================================================
ALTER TABLE channels
  ADD COLUMN IF NOT EXISTS subscription_price_cents INTEGER,
  ADD COLUMN IF NOT EXISTS subscription_currency TEXT NOT NULL DEFAULT 'usd',
  ADD COLUMN IF NOT EXISTS subscription_stripe_price_id TEXT,
  ADD COLUMN IF NOT EXISTS subscription_stripe_product_id TEXT;

-- ============================================================
-- 3. PER-VIDEO ACCESS GATE
-- access_type drives the paywall:
--   free        — anyone can play
--   subscribers — channel subscribers only
--   ppv         — must purchase the video (one-time)
-- Existing column `price_cents` (added in 070) is reused for PPV pricing.
-- ============================================================
ALTER TABLE channel_videos
  ADD COLUMN IF NOT EXISTS access_type TEXT NOT NULL DEFAULT 'free'
    CHECK (access_type IN ('free','subscribers','ppv')),
  ADD COLUMN IF NOT EXISTS ppv_stripe_price_id TEXT;

CREATE INDEX IF NOT EXISTS idx_channel_videos_access ON channel_videos(access_type);

-- Backfill: anything previously marked is_premium=true and priced becomes PPV.
UPDATE channel_videos
   SET access_type = 'ppv'
 WHERE is_premium = TRUE
   AND price_cents IS NOT NULL
   AND access_type = 'free';

-- ============================================================
-- 4. CHANNEL SUBSCRIPTIONS (recurring)
-- ============================================================
CREATE TABLE IF NOT EXISTS channel_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','past_due','canceled','incomplete','trialing','unpaid','paused')),
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  amount_cents INTEGER,
  currency TEXT NOT NULL DEFAULT 'usd',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, channel_id)
);

CREATE INDEX IF NOT EXISTS idx_channel_subs_user ON channel_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_channel_subs_channel ON channel_subscriptions(channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_subs_status ON channel_subscriptions(status);

CREATE TRIGGER channel_subscriptions_updated_at
  BEFORE UPDATE ON channel_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE channel_subscriptions ENABLE ROW LEVEL SECURITY;

-- Subscriber sees their own subscriptions
CREATE POLICY "channel_subs_own_read"
  ON channel_subscriptions FOR SELECT
  USING (user_id = auth.uid());

-- Channel owner can see who subscribes (creator analytics)
CREATE POLICY "channel_subs_owner_read"
  ON channel_subscriptions FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM channels WHERE id = channel_subscriptions.channel_id
            AND owner_id = auth.uid())
  );

-- ============================================================
-- 5. PAYMENT INTENT CHECK CONSTRAINT — allow channel_subscription resource
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payment_intents_resource_type_check') THEN
    ALTER TABLE payment_intents DROP CONSTRAINT payment_intents_resource_type_check;
    ALTER TABLE payment_intents ADD CONSTRAINT payment_intents_resource_type_check
      CHECK (resource_type IN ('booking','order','ticket','video_purchase','channel_subscription'));
  END IF;
END $$;

-- ============================================================
-- 6. CREATOR EARNINGS — extend source enum
-- 013 created the table with sources (ad_revenue, tip, sponsorship). We add
-- the new monetization sources so dashboards can break them down.
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'creator_earnings_source_check') THEN
    ALTER TABLE creator_earnings DROP CONSTRAINT creator_earnings_source_check;
  END IF;
  ALTER TABLE creator_earnings ADD CONSTRAINT creator_earnings_source_check
    CHECK (source IN ('ad_revenue','tip','sponsorship','subscription','ppv','event_ticket'));
END $$;

ALTER TABLE creator_earnings
  ADD COLUMN IF NOT EXISTS resource_type TEXT,
  ADD COLUMN IF NOT EXISTS resource_id UUID,
  ADD COLUMN IF NOT EXISTS gross_cents INTEGER,
  ADD COLUMN IF NOT EXISTS platform_fee_cents INTEGER,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_charge_id TEXT;

CREATE INDEX IF NOT EXISTS idx_creator_earnings_created
  ON creator_earnings(creator_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_creator_earnings_resource
  ON creator_earnings(resource_type, resource_id);

-- ============================================================
-- 7. RLS — VIDEO PURCHASES write via service role only.
--    The webhook (admin client) inserts on Stripe success.
-- ============================================================
-- already enabled in 070; no changes needed.
