-- ============================================================
-- Hub City App — Health Resources
-- ============================================================

-- ============================================================
-- HEALTH RESOURCES
-- ============================================================
CREATE TABLE health_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL CHECK (category IN (
    'clinic', 'hospital', 'mental_health', 'dental', 'vision',
    'pharmacy', 'emergency', 'substance_abuse', 'prenatal',
    'pediatric', 'senior_care', 'insurance_help'
  )),
  organization TEXT,
  address TEXT,
  phone TEXT,
  website TEXT,
  hours JSONB,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  district INTEGER CHECK (district BETWEEN 1 AND 4),
  image_url TEXT,
  is_emergency BOOLEAN DEFAULT FALSE,
  accepts_medi_cal BOOLEAN DEFAULT FALSE,
  accepts_uninsured BOOLEAN DEFAULT FALSE,
  is_free BOOLEAN DEFAULT FALSE,
  languages TEXT[] DEFAULT '{English}',
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_health_resources_category ON health_resources(category);
CREATE INDEX idx_health_resources_published ON health_resources(is_published) WHERE is_published = TRUE;
CREATE INDEX idx_health_resources_emergency ON health_resources(is_emergency) WHERE is_emergency = TRUE;
CREATE INDEX idx_health_resources_slug ON health_resources(slug);
CREATE INDEX idx_health_resources_district ON health_resources(district);

CREATE TRIGGER health_resources_updated_at
  BEFORE UPDATE ON health_resources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE health_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published health resources are viewable by everyone"
  ON health_resources FOR SELECT USING (is_published = true);

CREATE POLICY "Admins and city officials can manage health resources"
  ON health_resources FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'city_official'))
  );

-- ============================================================
-- SEED DATA — Key Compton Health Facilities
-- ============================================================
INSERT INTO health_resources (name, slug, description, category, organization, address, phone, website, is_emergency, accepts_medi_cal, accepts_uninsured, is_free, languages) VALUES
(
  'Martin Luther King Jr. Community Hospital',
  'mlk-community-hospital',
  'Full-service community hospital providing emergency, inpatient, and outpatient care to residents of South Los Angeles and surrounding communities.',
  'hospital',
  'MLK Community Health Foundation',
  '1680 E 120th St, Los Angeles, CA 90059',
  '(424) 338-8000',
  'https://www.mlkch.org',
  TRUE,
  TRUE,
  TRUE,
  FALSE,
  '{English,Spanish}'
),
(
  'Compton Health Center',
  'compton-health-center',
  'County-operated health center providing primary care, immunizations, family planning, and preventive health services.',
  'clinic',
  'Los Angeles County Department of Health Services',
  '630 W Compton Blvd, Compton, CA 90220',
  '(310) 605-6500',
  NULL,
  FALSE,
  TRUE,
  TRUE,
  TRUE,
  '{English,Spanish}'
),
(
  'South Los Angeles Health Center',
  'south-la-health-center',
  'Community health center providing comprehensive medical, dental, and behavioral health services.',
  'clinic',
  'Los Angeles County Department of Health Services',
  '1311 W 120th St, Los Angeles, CA 90044',
  '(323) 568-4000',
  NULL,
  FALSE,
  TRUE,
  TRUE,
  TRUE,
  '{English,Spanish}'
),
(
  'Shields for Families',
  'shields-for-families',
  'Comprehensive social services including mental health counseling, substance abuse treatment, and family support programs.',
  'mental_health',
  'Shields for Families Inc.',
  '11601 S Western Ave, Los Angeles, CA 90047',
  '(323) 242-5000',
  'https://www.shieldsforfamilies.org',
  FALSE,
  TRUE,
  TRUE,
  FALSE,
  '{English,Spanish}'
),
(
  'JWCH Institute - Wesley Health Center',
  'jwch-wesley-health',
  'Federally qualified health center providing primary care, dental, behavioral health, and HIV/AIDS services to underserved communities.',
  'clinic',
  'JWCH Institute',
  '1845 N Fair Oaks Ave, Pasadena, CA 91103',
  '(323) 541-1411',
  'https://www.jwchinstitute.org',
  FALSE,
  TRUE,
  TRUE,
  FALSE,
  '{English,Spanish}'
),
(
  'Compton Family Mental Health Center',
  'compton-family-mental-health',
  'Outpatient mental health services including individual and group therapy, psychiatric evaluation, and crisis intervention for children, adolescents, and adults.',
  'mental_health',
  'Los Angeles County Department of Mental Health',
  '611 E Rosecrans Ave, Compton, CA 90221',
  '(310) 668-4439',
  NULL,
  FALSE,
  TRUE,
  TRUE,
  TRUE,
  '{English,Spanish}'
),
(
  'Medi-Cal Enrollment Assistance',
  'medi-cal-enrollment',
  'Free assistance with Medi-Cal enrollment, renewals, and navigating health insurance options for Compton residents.',
  'insurance_help',
  'City of Compton',
  '205 S Willowbrook Ave, Compton, CA 90220',
  '(310) 605-5500',
  NULL,
  FALSE,
  FALSE,
  TRUE,
  TRUE,
  '{English,Spanish}'
);
