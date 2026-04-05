-- Culture & Parks

CREATE TABLE IF NOT EXISTS murals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  artist_name TEXT,
  artist_id UUID REFERENCES profiles(id),
  description TEXT,
  image_urls TEXT[],
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  address TEXT,
  district INTEGER,
  year_created INTEGER,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE murals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read published murals" ON murals FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can manage murals" ON murals FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'city_official'))
);

CREATE TABLE IF NOT EXISTS parks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  address TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  district INTEGER,
  amenities TEXT[],
  hours JSONB,
  phone TEXT,
  image_urls TEXT[],
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE parks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read published parks" ON parks FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can manage parks" ON parks FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'city_official'))
);

CREATE TABLE IF NOT EXISTS park_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  park_id UUID REFERENCES parks(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  age_range TEXT,
  schedule TEXT,
  fee TEXT,
  registration_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE park_programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active programs" ON park_programs FOR SELECT USING (is_active = true);

-- Featured stories columns on posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_featured_story BOOLEAN DEFAULT FALSE;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS story_title TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS story_image_url TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS read_time_minutes INTEGER;

-- District engagement tracking
CREATE TABLE IF NOT EXISTS district_engagement (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  district INTEGER NOT NULL,
  engagement_points INTEGER DEFAULT 0,
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, district)
);

ALTER TABLE district_engagement ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own engagement" ON district_engagement FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Anyone can read district stats" ON district_engagement FOR SELECT USING (true);
