-- ============================================================
-- Self-elect resource_provider role via SECURITY DEFINER RPC
-- ============================================================
-- Provides a controlled path for any authenticated citizen to
-- upgrade themselves to a resource_provider account so they can
-- post community resources (housing, jobs, food, youth, etc.).
--
-- NOTE: The pre-existing "Users can update own profile" policy
-- (migration 001) has no WITH CHECK clause and technically
-- permits arbitrary self-role mutation today. Hardening that
-- policy is a separate security task; this migration adds the
-- explicit, auditable transition for the Resource Account flow.
-- ============================================================

CREATE OR REPLACE FUNCTION public.become_resource_provider(
  org_name TEXT DEFAULT NULL,
  org_phone TEXT DEFAULT NULL,
  org_website TEXT DEFAULT NULL,
  org_mission TEXT DEFAULT NULL
)
RETURNS profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_role user_role;
  updated_profile profiles;
  social_payload JSONB;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  SELECT role INTO current_role FROM profiles WHERE id = auth.uid();

  IF current_role IS NULL THEN
    RAISE EXCEPTION 'Profile not found' USING ERRCODE = 'P0002';
  END IF;

  -- Allow upgrade only from citizen or no-op for an existing provider.
  -- Block accidental downgrade from elevated roles (admin, etc.).
  IF current_role NOT IN ('citizen', 'resource_provider') THEN
    RAISE EXCEPTION 'Cannot upgrade from role %', current_role USING ERRCODE = '42501';
  END IF;

  social_payload := COALESCE(
    (SELECT social_links FROM profiles WHERE id = auth.uid()),
    '{}'::jsonb
  );
  IF org_website IS NOT NULL AND length(trim(org_website)) > 0 THEN
    social_payload := social_payload || jsonb_build_object('website', org_website);
  END IF;

  UPDATE profiles
  SET
    role = 'resource_provider',
    display_name = COALESCE(NULLIF(trim(org_name), ''), display_name),
    bio = COALESCE(NULLIF(trim(org_mission), ''), bio),
    social_links = social_payload,
    updated_at = NOW()
  WHERE id = auth.uid()
  RETURNING * INTO updated_profile;

  RETURN updated_profile;
END;
$$;

REVOKE ALL ON FUNCTION public.become_resource_provider(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.become_resource_provider(TEXT, TEXT, TEXT, TEXT) TO authenticated;
