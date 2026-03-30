-- ============================================================
-- Hub City App — City Hall: Departments & Services
-- ============================================================

-- ============================================================
-- CITY DEPARTMENTS
-- ============================================================
CREATE TABLE city_departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  phone TEXT,
  email TEXT,
  address TEXT,
  hours JSONB,
  website TEXT,
  category TEXT NOT NULL CHECK (category IN (
    'administration', 'public_safety', 'public_works',
    'community_services', 'planning', 'finance', 'legal', 'parks'
  )),
  head_name TEXT,
  head_title TEXT,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_city_departments_category ON city_departments(category);
CREATE INDEX idx_city_departments_slug ON city_departments(slug);
CREATE INDEX idx_city_departments_active ON city_departments(is_active) WHERE is_active = TRUE;

CREATE TRIGGER city_departments_updated_at
  BEFORE UPDATE ON city_departments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- CITY SERVICES
-- ============================================================
CREATE TABLE city_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES city_departments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  online_url TEXT,
  phone TEXT,
  eligibility TEXT,
  fee_description TEXT,
  is_online BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_city_services_department ON city_services(department_id);
CREATE INDEX idx_city_services_active ON city_services(is_active) WHERE is_active = TRUE;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- City Departments
ALTER TABLE city_departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "City departments are viewable by everyone"
  ON city_departments FOR SELECT USING (true);

CREATE POLICY "Admins and city officials can manage departments"
  ON city_departments FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'city_official'))
  );

-- City Services
ALTER TABLE city_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "City services are viewable by everyone"
  ON city_services FOR SELECT USING (true);

CREATE POLICY "Admins and city officials can manage services"
  ON city_services FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'city_official'))
  );

-- ============================================================
-- SEED DATA — Compton City Departments
-- ============================================================
INSERT INTO city_departments (name, slug, description, category, address, phone, email, sort_order) VALUES
(
  'City Manager''s Office',
  'city-manager',
  'The City Manager''s Office is responsible for the overall administration of city operations and implementation of City Council policies.',
  'administration',
  '205 S Willowbrook Ave, Compton, CA 90220',
  '(310) 605-5500',
  'citymanager@comptoncity.org',
  1
),
(
  'City Attorney''s Office',
  'city-attorney',
  'The City Attorney''s Office provides legal counsel to the City Council, city departments, boards, and commissions.',
  'legal',
  '205 S Willowbrook Ave, Compton, CA 90220',
  '(310) 605-5500',
  'cityattorney@comptoncity.org',
  2
),
(
  'City Clerk',
  'city-clerk',
  'The City Clerk''s Office maintains official city records, administers elections, and manages public records requests.',
  'administration',
  '205 S Willowbrook Ave, Compton, CA 90220',
  '(310) 605-5500',
  'cityclerk@comptoncity.org',
  3
),
(
  'Finance Department',
  'finance',
  'The Finance Department manages the city''s fiscal operations including budgeting, accounting, purchasing, and revenue collection.',
  'finance',
  '205 S Willowbrook Ave, Compton, CA 90220',
  '(310) 605-5500',
  'finance@comptoncity.org',
  4
),
(
  'Community Development Department',
  'community-development',
  'The Community Development Department oversees planning, building and safety, code enforcement, and housing programs.',
  'planning',
  '205 S Willowbrook Ave, Compton, CA 90220',
  '(310) 605-5500',
  'commdev@comptoncity.org',
  5
),
(
  'Public Works Department',
  'public-works',
  'The Public Works Department maintains city infrastructure including streets, water systems, sewers, and public facilities.',
  'public_works',
  '205 S Willowbrook Ave, Compton, CA 90220',
  '(310) 605-5500',
  'publicworks@comptoncity.org',
  6
),
(
  'Parks & Recreation Department',
  'parks-recreation',
  'The Parks & Recreation Department manages city parks, recreational facilities, and community programs for residents of all ages.',
  'parks',
  '205 S Willowbrook Ave, Compton, CA 90220',
  '(310) 605-5500',
  'parks@comptoncity.org',
  7
),
(
  'Fire Department',
  'fire-department',
  'The Compton Fire Department provides fire suppression, emergency medical services, and fire prevention programs to protect the community.',
  'public_safety',
  '201 S Acacia Ave, Compton, CA 90220',
  '(310) 605-5600',
  'fire@comptoncity.org',
  8
);
