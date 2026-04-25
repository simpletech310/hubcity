-- 02-wipe-db.sql
-- Truncate every public-schema application table EXCEPT reference data.
-- Bypass FK ordering by switching to replica role for the duration.
--
-- Reference tables that are KEPT (these were seeded by migrations and we
-- want to preserve them so the seed scripts can reference them):
--   cities, audio_genres, culture_categories, feature_flags,
--   zip_to_trustee_area, school_districts, business_types
--
-- Final step also clears auth.users so we can re-seed users from scratch.

BEGIN;

SET session_replication_role = replica;

DO $$
DECLARE
  t record;
  keep text[] := ARRAY[
    'cities',
    'audio_genres',
    'culture_categories',
    'feature_flags',
    'zip_to_trustee_area',
    'school_districts',
    'business_types',
    'spatial_ref_sys'
  ];
BEGIN
  FOR t IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename <> ALL(keep)
    ORDER BY tablename
  LOOP
    EXECUTE format('TRUNCATE TABLE public.%I RESTART IDENTITY CASCADE', t.tablename);
  END LOOP;
END $$;

-- Clear auth.users (Supabase auth schema). Profiles cascade is already done
-- above; this just removes the auth records themselves.
DELETE FROM auth.users;

-- Clear realtime / storage object metadata won't happen here — handled by
-- the empty-buckets script.

SET session_replication_role = origin;

COMMIT;

-- Sanity report.
SELECT 'profiles' tbl, count(*) n FROM public.profiles
UNION ALL SELECT 'channels', count(*) FROM public.channels
UNION ALL SELECT 'channel_videos', count(*) FROM public.channel_videos
UNION ALL SELECT 'businesses', count(*) FROM public.businesses
UNION ALL SELECT 'posts', count(*) FROM public.posts
UNION ALL SELECT 'events', count(*) FROM public.events
UNION ALL SELECT 'reels', count(*) FROM public.reels
UNION ALL SELECT 'cities (kept)', count(*) FROM public.cities
UNION ALL SELECT 'auth.users', count(*) FROM auth.users;
