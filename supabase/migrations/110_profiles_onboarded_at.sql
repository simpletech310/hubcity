-- ============================================================
-- Hub City App — Track citizen onboarding completion
-- ============================================================
-- New signups land on /onboarding for a 3-step flow (interests,
-- follow 5 creators, set city). Once they finish, we stamp
-- `onboarded_at`. Existing users are backfilled with their
-- created_at so they don't get redirected back through the flow.
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onboarded_at TIMESTAMPTZ;

UPDATE profiles
  SET onboarded_at = COALESCE(created_at, NOW())
  WHERE onboarded_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_onboarded_at
  ON profiles (onboarded_at)
  WHERE onboarded_at IS NULL;
