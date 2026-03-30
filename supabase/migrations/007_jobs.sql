-- ============================================================
-- Hub City App — Jobs: Listings & Applications
-- ============================================================

-- ============================================================
-- JOB LISTINGS
-- ============================================================
CREATE TABLE job_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT,
  job_type TEXT NOT NULL CHECK (job_type IN ('full_time', 'part_time', 'contract', 'seasonal', 'internship')),
  salary_min NUMERIC(10,2),
  salary_max NUMERIC(10,2),
  salary_type TEXT CHECK (salary_type IN ('hourly', 'salary', 'commission', 'tips')),
  location TEXT,
  is_remote BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  application_deadline DATE,
  contact_email TEXT,
  contact_phone TEXT,
  views_count INTEGER DEFAULT 0,
  application_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_job_listings_business ON job_listings(business_id);
CREATE INDEX idx_job_listings_active ON job_listings(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_job_listings_type ON job_listings(job_type);
CREATE INDEX idx_job_listings_slug ON job_listings(slug);
CREATE INDEX idx_job_listings_deadline ON job_listings(application_deadline) WHERE application_deadline IS NOT NULL;

CREATE TRIGGER job_listings_updated_at
  BEFORE UPDATE ON job_listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- JOB APPLICATIONS
-- ============================================================
CREATE TABLE job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_listing_id UUID NOT NULL REFERENCES job_listings(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  is_us_citizen BOOLEAN DEFAULT FALSE,
  is_compton_resident BOOLEAN DEFAULT FALSE,
  resume_url TEXT,
  references_text TEXT,
  cover_note TEXT,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'reviewing', 'interview', 'offered', 'rejected', 'withdrawn')),
  reviewed_at TIMESTAMPTZ,
  reviewer_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_listing_id, applicant_id)
);

CREATE INDEX idx_job_applications_listing ON job_applications(job_listing_id);
CREATE INDEX idx_job_applications_applicant ON job_applications(applicant_id);
CREATE INDEX idx_job_applications_status ON job_applications(status);

CREATE TRIGGER job_applications_updated_at
  BEFORE UPDATE ON job_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Job Listings
ALTER TABLE job_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active job listings are viewable by everyone"
  ON job_listings FOR SELECT USING (is_active = true);

CREATE POLICY "Business owners can insert their own listings"
  ON job_listings FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM businesses WHERE id = business_id AND owner_id = auth.uid())
  );

CREATE POLICY "Business owners can update their own listings"
  ON job_listings FOR UPDATE USING (
    EXISTS (SELECT 1 FROM businesses WHERE id = business_id AND owner_id = auth.uid())
  );

CREATE POLICY "Business owners can delete their own listings"
  ON job_listings FOR DELETE USING (
    EXISTS (SELECT 1 FROM businesses WHERE id = business_id AND owner_id = auth.uid())
  );

CREATE POLICY "Admins can manage all job listings"
  ON job_listings FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'city_official'))
  );

-- Job Applications
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Applicants can insert their own applications"
  ON job_applications FOR INSERT WITH CHECK (auth.uid() = applicant_id);

CREATE POLICY "Applicants can view their own applications"
  ON job_applications FOR SELECT USING (auth.uid() = applicant_id);

CREATE POLICY "Business owners can view applications for their listings"
  ON job_applications FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM job_listings jl
      JOIN businesses b ON b.id = jl.business_id
      WHERE jl.id = job_listing_id AND b.owner_id = auth.uid()
    )
  );

CREATE POLICY "Business owners can update applications for their listings"
  ON job_applications FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM job_listings jl
      JOIN businesses b ON b.id = jl.business_id
      WHERE jl.id = job_listing_id AND b.owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all applications"
  ON job_applications FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'city_official'))
  );
