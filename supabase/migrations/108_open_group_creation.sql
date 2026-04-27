-- ============================================================
-- Hub City App — Open community group creation to citizens
-- ============================================================
-- Migration 047 limited community_groups INSERT to non-citizen
-- roles only. We're loosening that here so any authenticated
-- user can spin up a community group ("Hustlers", "Compton Run
-- Club", etc.) without an admin being involved.
--
-- The created_by + admin policies stay; only INSERT is opened.
-- ============================================================

DROP POLICY IF EXISTS "Authenticated users can create groups" ON community_groups;
DROP POLICY IF EXISTS "Officials can create groups" ON community_groups;
DROP POLICY IF EXISTS "Non-citizen roles can create groups" ON community_groups;

CREATE POLICY "Authenticated users can create groups" ON community_groups
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = created_by
  );
