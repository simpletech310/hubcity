-- =============================================
-- Polls & Surveys for City Pulse Data Collection
-- =============================================

-- ── Polls ───────────────────────────────────
CREATE TABLE polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  question text NOT NULL,
  poll_type text NOT NULL DEFAULT 'multiple_choice'
    CHECK (poll_type IN ('multiple_choice', 'temperature_check')),
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'closed')),
  total_votes integer NOT NULL DEFAULT 0,
  ends_at timestamptz,
  is_anonymous boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE poll_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid REFERENCES polls(id) ON DELETE CASCADE NOT NULL,
  label text NOT NULL,
  emoji text,
  vote_count integer NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0
);

CREATE TABLE poll_votes (
  poll_id uuid REFERENCES polls(id) ON DELETE CASCADE NOT NULL,
  option_id uuid REFERENCES poll_options(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (poll_id, user_id)
);

-- ── Surveys ─────────────────────────────────
CREATE TABLE surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'closed')),
  response_count integer NOT NULL DEFAULT 0,
  ends_at timestamptz,
  is_anonymous boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE survey_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id uuid REFERENCES surveys(id) ON DELETE CASCADE NOT NULL,
  question text NOT NULL,
  type text NOT NULL DEFAULT 'text'
    CHECK (type IN ('text', 'single_choice', 'multiple_choice', 'rating', 'scale')),
  options jsonb,
  required boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0
);

CREATE TABLE survey_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id uuid REFERENCES surveys(id) ON DELETE CASCADE NOT NULL,
  respondent_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  answers jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(survey_id, respondent_id)
);

-- ── Indexes ─────────────────────────────────
CREATE INDEX idx_polls_status ON polls(status, is_published);
CREATE INDEX idx_polls_author ON polls(author_id);
CREATE INDEX idx_poll_options_poll ON poll_options(poll_id, sort_order);
CREATE INDEX idx_poll_votes_user ON poll_votes(user_id);
CREATE INDEX idx_surveys_status ON surveys(status, is_published);
CREATE INDEX idx_surveys_author ON surveys(author_id);
CREATE INDEX idx_survey_questions_survey ON survey_questions(survey_id, sort_order);
CREATE INDEX idx_survey_responses_survey ON survey_responses(survey_id);
CREATE INDEX idx_survey_responses_user ON survey_responses(respondent_id);

-- ── RLS ─────────────────────────────────────
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;

-- Poll policies
CREATE POLICY "Anyone can read published polls" ON polls
  FOR SELECT USING (is_published = true);
CREATE POLICY "Officials can create polls" ON polls
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('city_official', 'admin'))
  );
CREATE POLICY "Authors can update own polls" ON polls
  FOR UPDATE USING (author_id = auth.uid());

CREATE POLICY "Anyone can read poll options" ON poll_options
  FOR SELECT USING (true);
CREATE POLICY "Officials can manage poll options" ON poll_options
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM polls WHERE id = poll_id AND author_id = auth.uid())
  );

CREATE POLICY "Anyone can read votes" ON poll_votes
  FOR SELECT USING (true);
CREATE POLICY "Authenticated users can vote" ON poll_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own votes" ON poll_votes
  FOR DELETE USING (auth.uid() = user_id);

-- Survey policies
CREATE POLICY "Anyone can read published surveys" ON surveys
  FOR SELECT USING (is_published = true);
CREATE POLICY "Officials can create surveys" ON surveys
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('city_official', 'admin'))
  );
CREATE POLICY "Authors can update own surveys" ON surveys
  FOR UPDATE USING (author_id = auth.uid());

CREATE POLICY "Anyone can read survey questions" ON survey_questions
  FOR SELECT USING (true);
CREATE POLICY "Officials can manage questions" ON survey_questions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM surveys WHERE id = survey_id AND author_id = auth.uid())
  );

CREATE POLICY "Users can read own responses" ON survey_responses
  FOR SELECT USING (respondent_id = auth.uid());
CREATE POLICY "Authenticated users can respond" ON survey_responses
  FOR INSERT WITH CHECK (auth.uid() = respondent_id);

-- ── Updated_at triggers ─────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER polls_updated_at BEFORE UPDATE ON polls
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER surveys_updated_at BEFORE UPDATE ON surveys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── RPC functions for atomic vote counting ──
CREATE OR REPLACE FUNCTION increment_vote_count(p_option_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE poll_options SET vote_count = vote_count + 1 WHERE id = p_option_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_vote_count(p_option_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE poll_options SET vote_count = GREATEST(vote_count - 1, 0) WHERE id = p_option_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
