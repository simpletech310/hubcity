-- ============================================================
-- Hub City App — Fix Event & Group Creation Permissions
-- Allow all non-citizen roles to create events and groups
-- ============================================================

-- ── Events: expand INSERT to all non-citizen roles ──────────

-- First, drop the existing admin-only ALL policy for events
-- (it covers INSERT but only for admin/city_official)
-- We keep the ALL policy for admins but ADD a separate INSERT policy
-- for other elevated roles.

DROP POLICY IF EXISTS "Non-citizen roles can create events" ON events;

CREATE POLICY "Non-citizen roles can create events" ON events
  FOR INSERT WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN (
        'business_owner',
        'city_official',
        'admin',
        'content_creator',
        'city_ambassador',
        'chamber_admin',
        'resource_provider',
        'school_trustee'
      )
    )
  );

-- Also allow creators to update their own events
DROP POLICY IF EXISTS "Creators can update own events" ON events;

CREATE POLICY "Creators can update own events" ON events
  FOR UPDATE USING (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN (
        'business_owner',
        'city_official',
        'admin',
        'content_creator',
        'city_ambassador',
        'chamber_admin',
        'resource_provider',
        'school_trustee'
      )
    )
  );

-- ── Groups: expand INSERT to all non-citizen roles ──────────

DROP POLICY IF EXISTS "Authenticated users can create groups" ON community_groups;
DROP POLICY IF EXISTS "Non-citizen roles can create groups" ON community_groups;

CREATE POLICY "Non-citizen roles can create groups" ON community_groups
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN (
        'business_owner',
        'city_official',
        'admin',
        'content_creator',
        'city_ambassador',
        'chamber_admin',
        'resource_provider',
        'school_trustee'
      )
    )
  );
