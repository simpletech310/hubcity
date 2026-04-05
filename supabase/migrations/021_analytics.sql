-- Analytics: views, daily metrics, shares

CREATE TABLE IF NOT EXISTS content_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL,
  content_id UUID NOT NULL,
  user_id UUID REFERENCES profiles(id),
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_views_content ON content_views(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_views_date ON content_views(created_at);

ALTER TABLE content_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read views" ON content_views FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Anyone can insert views" ON content_views FOR INSERT WITH CHECK (true);

CREATE TABLE IF NOT EXISTS daily_metrics (
  date DATE NOT NULL,
  metric_type TEXT NOT NULL,
  metric_value NUMERIC,
  district INTEGER,
  PRIMARY KEY (date, metric_type, district)
);

ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read metrics" ON daily_metrics FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS content_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT,
  content_id UUID,
  shared_by UUID REFERENCES profiles(id),
  share_method TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE content_shares ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert shares" ON content_shares FOR INSERT WITH CHECK (shared_by = auth.uid());
