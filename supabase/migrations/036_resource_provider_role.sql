-- Add resource_provider to user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'resource_provider';

-- Update RLS policies so resource_providers can manage their own resources
DROP POLICY IF EXISTS "Resource providers can create resources" ON resources;
CREATE POLICY "Resource providers can create resources" ON resources
  FOR INSERT WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('city_official', 'admin', 'city_ambassador', 'resource_provider')
    )
  );

DROP POLICY IF EXISTS "Resource providers can update own resources" ON resources;
CREATE POLICY "Resource providers can update own resources" ON resources
  FOR UPDATE USING (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('city_official', 'admin', 'city_ambassador', 'resource_provider')
    )
  );

-- Resource providers can view applications for their own resources
DROP POLICY IF EXISTS "Resource providers can view own applications" ON grant_applications;
CREATE POLICY "Resource providers can view own applications" ON grant_applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM resources r
      WHERE r.id = resource_id
      AND r.created_by = auth.uid()
    )
    OR applicant_id = auth.uid()
  );

-- Resource providers can update applications for their own resources
DROP POLICY IF EXISTS "Resource providers can update own applications" ON grant_applications;
CREATE POLICY "Resource providers can update own applications" ON grant_applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM resources r
      WHERE r.id = resource_id
      AND r.created_by = auth.uid()
    )
  );

-- Add capacity fields to resources
ALTER TABLE resources ADD COLUMN IF NOT EXISTS max_spots INTEGER;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS filled_spots INTEGER DEFAULT 0;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS provider_notes TEXT;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS contact_name TEXT;

-- Add more statuses to grant_applications
ALTER TABLE grant_applications DROP CONSTRAINT IF EXISTS grant_applications_status_check;
-- The status column might be text or have a check - let's just ensure it works with text values
-- Status values: submitted, under_review, approved, denied, waitlisted, referred, enrolled, completed, withdrawn

-- Add tracking fields to grant_applications
ALTER TABLE grant_applications ADD COLUMN IF NOT EXISTS status_note TEXT;
ALTER TABLE grant_applications ADD COLUMN IF NOT EXISTS referred_to TEXT;
ALTER TABLE grant_applications ADD COLUMN IF NOT EXISTS follow_up_date DATE;
ALTER TABLE grant_applications ADD COLUMN IF NOT EXISTS internal_notes TEXT;
