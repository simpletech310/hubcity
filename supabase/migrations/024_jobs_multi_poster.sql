-- ============================================================
-- Hub City App — Jobs: Multi-Poster Support
-- Allows businesses, schools, city officials, and ambassadors
-- to post job and volunteer opportunities
-- ============================================================

-- New columns on job_listings
ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS posted_by UUID REFERENCES profiles(id);
ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS organization_name TEXT;
ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS organization_type TEXT CHECK (organization_type IN ('business', 'school', 'city'));

-- Make business_id nullable for non-business posters
ALTER TABLE job_listings ALTER COLUMN business_id DROP NOT NULL;

-- Add 'volunteer' to job_type CHECK constraint
ALTER TABLE job_listings DROP CONSTRAINT IF EXISTS job_listings_job_type_check;
ALTER TABLE job_listings ADD CONSTRAINT job_listings_job_type_check
  CHECK (job_type IN ('full_time', 'part_time', 'contract', 'seasonal', 'internship', 'volunteer'));

-- Backfill posted_by from existing business listings
UPDATE job_listings jl
SET posted_by = b.owner_id
FROM businesses b
WHERE jl.business_id = b.id AND jl.posted_by IS NULL;

-- Backfill organization_name and organization_type for existing listings
UPDATE job_listings jl
SET organization_name = b.name, organization_type = 'business'
FROM businesses b
WHERE jl.business_id = b.id AND jl.organization_name IS NULL;

-- Index for poster lookups
CREATE INDEX IF NOT EXISTS idx_job_listings_posted_by ON job_listings(posted_by);

-- ============================================================
-- Updated RLS Policies for job_listings
-- ============================================================

-- Drop old business-only insert/update/delete policies
DROP POLICY IF EXISTS "Business owners can insert their own listings" ON job_listings;
DROP POLICY IF EXISTS "Business owners can update their own listings" ON job_listings;
DROP POLICY IF EXISTS "Business owners can delete their own listings" ON job_listings;

-- New: any allowed role can insert if they set posted_by = their uid
CREATE POLICY "Authorized users can insert job listings"
  ON job_listings FOR INSERT WITH CHECK (
    auth.uid() = posted_by AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('business_owner', 'admin', 'city_official', 'city_ambassador'))
  );

-- New: poster can update their own listings
CREATE POLICY "Posters can update their own listings"
  ON job_listings FOR UPDATE USING (auth.uid() = posted_by);

-- New: poster can delete their own listings
CREATE POLICY "Posters can delete their own listings"
  ON job_listings FOR DELETE USING (auth.uid() = posted_by);

-- ============================================================
-- Updated RLS Policies for job_applications
-- ============================================================

-- Drop old business-owner-only application policies
DROP POLICY IF EXISTS "Business owners can view applications for their listings" ON job_applications;
DROP POLICY IF EXISTS "Business owners can update applications for their listings" ON job_applications;

-- New: poster can view applications for their listings
CREATE POLICY "Posters can view applications for their listings"
  ON job_applications FOR SELECT USING (
    EXISTS (SELECT 1 FROM job_listings WHERE id = job_listing_id AND posted_by = auth.uid())
  );

-- New: poster can update applications for their listings
CREATE POLICY "Posters can update applications for their listings"
  ON job_applications FOR UPDATE USING (
    EXISTS (SELECT 1 FROM job_listings WHERE id = job_listing_id AND posted_by = auth.uid())
  );
