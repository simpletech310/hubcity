-- ============================================================
-- Food Challenges v2 — link to businesses + completions gallery
-- ============================================================
-- Adds business_id FK so challenges live under a vendor.
-- Adds challenge_completions for "I did this" submissions
-- with public photos, plus a participant_count trigger.
-- ============================================================

-- 1. Link challenges to a specific vendor
ALTER TABLE food_challenges
  ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_food_challenges_business
  ON food_challenges(business_id);

-- 2. Allow food-vendor business owners to manage their own challenges
DROP POLICY IF EXISTS "Vendors manage own challenges" ON food_challenges;
CREATE POLICY "Vendors manage own challenges" ON food_challenges
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM businesses b
      WHERE b.id = food_challenges.business_id
        AND b.owner_id = auth.uid()
        AND (b.category = 'restaurant' OR b.is_mobile_vendor = TRUE)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM businesses b
      WHERE b.id = food_challenges.business_id
        AND b.owner_id = auth.uid()
        AND (b.category = 'restaurant' OR b.is_mobile_vendor = TRUE)
    )
  );

-- 3. Completions table — one row per (challenge, user)
CREATE TABLE IF NOT EXISTS challenge_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES food_challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  photo_url TEXT,
  caption TEXT,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(challenge_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_challenge_completions_challenge
  ON challenge_completions(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_completions_user
  ON challenge_completions(user_id);

ALTER TABLE challenge_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read completions" ON challenge_completions;
CREATE POLICY "Public read completions" ON challenge_completions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "User inserts own completion" ON challenge_completions;
CREATE POLICY "User inserts own completion" ON challenge_completions
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "User deletes own completion" ON challenge_completions;
CREATE POLICY "User deletes own completion" ON challenge_completions
  FOR DELETE USING (user_id = auth.uid());

-- Vendors can also delete completions on their own challenges (moderation)
DROP POLICY IF EXISTS "Vendors moderate own challenge completions" ON challenge_completions;
CREATE POLICY "Vendors moderate own challenge completions" ON challenge_completions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM food_challenges c
      JOIN businesses b ON b.id = c.business_id
      WHERE c.id = challenge_completions.challenge_id
        AND b.owner_id = auth.uid()
    )
  );

-- 4. Trigger: bump/dec participant_count on the parent challenge
CREATE OR REPLACE FUNCTION bump_challenge_participants()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE food_challenges
      SET participant_count = participant_count + 1
      WHERE id = NEW.challenge_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE food_challenges
      SET participant_count = GREATEST(0, participant_count - 1)
      WHERE id = OLD.challenge_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS challenge_completions_bump ON challenge_completions;
CREATE TRIGGER challenge_completions_bump
  AFTER INSERT OR DELETE ON challenge_completions
  FOR EACH ROW EXECUTE FUNCTION bump_challenge_participants();
