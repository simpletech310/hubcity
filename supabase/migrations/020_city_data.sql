-- City data: meetings, transit, cache

CREATE TABLE IF NOT EXISTS city_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  meeting_type TEXT NOT NULL CHECK (meeting_type IN ('council', 'planning', 'budget', 'special')),
  description TEXT,
  date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  location TEXT,
  agenda_url TEXT,
  minutes_url TEXT,
  livestream_id UUID,
  is_public_comment_open BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE city_meetings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read meetings" ON city_meetings FOR SELECT USING (true);
CREATE POLICY "Officials can manage meetings" ON city_meetings FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'city_official'))
);

CREATE TABLE IF NOT EXISTS transit_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  route_name TEXT,
  route_type TEXT CHECK (route_type IN ('bus', 'rail')),
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  gtfs_stop_id TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE transit_stops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read transit stops" ON transit_stops FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS city_data_cache (
  key TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);
