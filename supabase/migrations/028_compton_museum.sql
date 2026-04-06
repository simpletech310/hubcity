-- ============================================================
-- Hub City App — The Compton Museum
-- Digital cultural institution for Compton heritage
-- ============================================================

-- ============================================================
-- MUSEUM EXHIBITS — Curated themed collections
-- ============================================================
CREATE TABLE IF NOT EXISTS museum_exhibits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  subtitle TEXT,
  description TEXT,
  cover_image_url TEXT,
  curator_note TEXT,
  era TEXT,
  tags TEXT[] DEFAULT '{}',
  is_featured BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exhibits_slug ON museum_exhibits(slug);
CREATE INDEX IF NOT EXISTS idx_exhibits_featured ON museum_exhibits(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_exhibits_published ON museum_exhibits(is_published) WHERE is_published = TRUE;
CREATE INDEX IF NOT EXISTS idx_exhibits_tags ON museum_exhibits USING GIN(tags);

-- ============================================================
-- GALLERY ITEMS — Artworks, photos, artifacts, documents
-- ============================================================
CREATE TABLE IF NOT EXISTS gallery_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  item_type TEXT NOT NULL DEFAULT 'artwork'
    CHECK (item_type IN ('artwork', 'photo', 'artifact', 'document', 'poster')),
  image_urls TEXT[] NOT NULL DEFAULT '{}',
  artist_name TEXT,
  artist_id UUID REFERENCES profiles(id),
  year_created TEXT,
  medium TEXT,
  dimensions TEXT,
  provenance TEXT,
  exhibit_id UUID REFERENCES museum_exhibits(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}',
  is_published BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gallery_slug ON gallery_items(slug);
CREATE INDEX IF NOT EXISTS idx_gallery_exhibit ON gallery_items(exhibit_id);
CREATE INDEX IF NOT EXISTS idx_gallery_type ON gallery_items(item_type);
CREATE INDEX IF NOT EXISTS idx_gallery_published ON gallery_items(is_published) WHERE is_published = TRUE;
CREATE INDEX IF NOT EXISTS idx_gallery_tags ON gallery_items USING GIN(tags);

-- ============================================================
-- NOTABLE PEOPLE — Compton figures past and present
-- ============================================================
CREATE TABLE IF NOT EXISTS notable_people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  title TEXT,
  bio TEXT,
  birth_year INTEGER,
  death_year INTEGER,
  category TEXT NOT NULL DEFAULT 'other'
    CHECK (category IN ('music', 'sports', 'politics', 'activism', 'arts', 'business', 'education', 'other')),
  portrait_url TEXT,
  image_urls TEXT[] DEFAULT '{}',
  notable_achievements TEXT[] DEFAULT '{}',
  external_links JSONB DEFAULT '{}',
  era TEXT,
  exhibit_id UUID REFERENCES museum_exhibits(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}',
  is_published BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_people_slug ON notable_people(slug);
CREATE INDEX IF NOT EXISTS idx_people_category ON notable_people(category);
CREATE INDEX IF NOT EXISTS idx_people_exhibit ON notable_people(exhibit_id);
CREATE INDEX IF NOT EXISTS idx_people_published ON notable_people(is_published) WHERE is_published = TRUE;
CREATE INDEX IF NOT EXISTS idx_people_tags ON notable_people USING GIN(tags);

-- ============================================================
-- LIBRARY ITEMS — Books, articles, documentaries, archives
-- ============================================================
CREATE TABLE IF NOT EXISTS library_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  author TEXT,
  description TEXT,
  item_type TEXT NOT NULL DEFAULT 'book'
    CHECK (item_type IN ('book', 'article', 'documentary', 'academic', 'archive')),
  cover_image_url TEXT,
  isbn TEXT,
  year_published INTEGER,
  publisher TEXT,
  external_url TEXT,
  exhibit_id UUID REFERENCES museum_exhibits(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}',
  is_published BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_library_slug ON library_items(slug);
CREATE INDEX IF NOT EXISTS idx_library_type ON library_items(item_type);
CREATE INDEX IF NOT EXISTS idx_library_published ON library_items(is_published) WHERE is_published = TRUE;
CREATE INDEX IF NOT EXISTS idx_library_tags ON library_items USING GIN(tags);

-- ============================================================
-- EXTEND EXISTING TABLES
-- ============================================================

-- Add museum channel type
ALTER TABLE channels DROP CONSTRAINT IF EXISTS channels_type_check;
ALTER TABLE channels ADD CONSTRAINT channels_type_check
  CHECK (type IN ('school', 'city', 'organization', 'media', 'community', 'museum'));

-- Museum discussion topic on posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS museum_topic TEXT;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Museum Exhibits
ALTER TABLE museum_exhibits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published exhibits are viewable by everyone"
  ON museum_exhibits FOR SELECT USING (is_published = true);

CREATE POLICY "Admins can manage all exhibits"
  ON museum_exhibits FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'city_official'))
  );

-- Gallery Items
ALTER TABLE gallery_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published gallery items are viewable by everyone"
  ON gallery_items FOR SELECT USING (is_published = true);

CREATE POLICY "Admins can manage all gallery items"
  ON gallery_items FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'city_official'))
  );

-- Notable People
ALTER TABLE notable_people ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published notable people are viewable by everyone"
  ON notable_people FOR SELECT USING (is_published = true);

CREATE POLICY "Admins can manage all notable people"
  ON notable_people FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'city_official'))
  );

-- Library Items
ALTER TABLE library_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published library items are viewable by everyone"
  ON library_items FOR SELECT USING (is_published = true);

CREATE POLICY "Admins can manage all library items"
  ON library_items FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'city_official'))
  );
