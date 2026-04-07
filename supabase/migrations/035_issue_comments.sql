-- Issue comments / updates timeline
CREATE TABLE IF NOT EXISTS city_issue_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES city_issues(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  is_official BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups by issue
CREATE INDEX idx_issue_comments_issue_id ON city_issue_comments(issue_id);
CREATE INDEX idx_issue_comments_created ON city_issue_comments(issue_id, created_at);

-- RLS
ALTER TABLE city_issue_comments ENABLE ROW LEVEL SECURITY;

-- Anyone can read comments
CREATE POLICY "Anyone can read issue comments"
  ON city_issue_comments FOR SELECT
  USING (true);

-- Authenticated users can insert their own comments
CREATE POLICY "Authenticated users can insert own comments"
  ON city_issue_comments FOR INSERT
  WITH CHECK (auth.uid() = author_id);
