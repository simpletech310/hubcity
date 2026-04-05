-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_posts_published ON posts(created_at DESC) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_events_published ON events(start_date) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_businesses_category ON businesses(category) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_issues_status ON city_issues(status, district);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id) WHERE is_read = false;

-- i18n columns
ALTER TABLE city_alerts ADD COLUMN IF NOT EXISTS title_es TEXT;
ALTER TABLE city_alerts ADD COLUMN IF NOT EXISTS body_es TEXT;
ALTER TABLE city_meetings ADD COLUMN IF NOT EXISTS title_es TEXT;
ALTER TABLE city_meetings ADD COLUMN IF NOT EXISTS description_es TEXT;
