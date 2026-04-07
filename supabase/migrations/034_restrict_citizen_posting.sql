-- ============================================================
-- Hub City App — Restrict Citizens from Creating Posts/Polls/Surveys
-- Citizens can only respond to (react, comment, vote on) content.
-- Only elevated roles can create content.
-- ============================================================

-- ── Posts: only non-citizen roles can create ─────────────
DROP POLICY IF EXISTS "Authenticated users can create posts" ON posts;
DROP POLICY IF EXISTS "Users can create posts" ON posts;

CREATE POLICY "Non-citizen roles can create posts" ON posts
  FOR INSERT WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('business_owner', 'city_official', 'admin', 'content_creator', 'city_ambassador', 'chamber_admin', 'resource_provider')
    )
  );

-- ── Polls: only city_official and admin can create ───────
DROP POLICY IF EXISTS "Authenticated users can create polls" ON polls;
DROP POLICY IF EXISTS "Officials can create polls" ON polls;

CREATE POLICY "Officials can create polls" ON polls
  FOR INSERT WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('city_official', 'admin')
    )
  );

-- ── Poll Options: only city_official and admin ───────────
DROP POLICY IF EXISTS "Authenticated users can manage poll options" ON poll_options;
DROP POLICY IF EXISTS "Officials can manage poll options" ON poll_options;

CREATE POLICY "Officials can manage poll options" ON poll_options
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM polls p
      JOIN profiles pr ON pr.id = p.author_id
      WHERE p.id = poll_id
      AND p.author_id = auth.uid()
      AND pr.role IN ('city_official', 'admin')
    )
  );

-- ── Surveys: only city_official and admin can create ─────
DROP POLICY IF EXISTS "Authenticated users can create surveys" ON surveys;
DROP POLICY IF EXISTS "Officials can create surveys" ON surveys;

CREATE POLICY "Officials can create surveys" ON surveys
  FOR INSERT WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('city_official', 'admin')
    )
  );

-- ── Survey Questions: only city_official and admin ───────
DROP POLICY IF EXISTS "Authenticated users can manage questions" ON survey_questions;
DROP POLICY IF EXISTS "Officials can manage questions" ON survey_questions;

CREATE POLICY "Officials can manage questions" ON survey_questions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM surveys s
      JOIN profiles pr ON pr.id = s.author_id
      WHERE s.id = survey_id
      AND s.author_id = auth.uid()
      AND pr.role IN ('city_official', 'admin')
    )
  );

-- NOTE: Citizens can still:
-- - Vote on polls (poll_votes table)
-- - Respond to surveys (survey_responses table)
-- - React to posts (reactions table)
-- - Comment on posts (post_comments table)
-- These policies remain unchanged.
