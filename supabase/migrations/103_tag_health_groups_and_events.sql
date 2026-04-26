-- ============================================================
-- Tag existing groups as health/fitness + seed example
-- health-tagged events so /health has live content.
-- ============================================================
-- Paste-safe (no dot-aliases, no example.com URLs).
-- Idempotent: array merges go through DISTINCT unnest, so
-- re-running won't duplicate tags. Events use ON CONFLICT DO
-- NOTHING on slug.
-- ============================================================

-- 1. Tag matching community groups with health + fitness tags.
--    Matches any group whose name suggests fitness/wellness
--    (run club, running, walk, yoga, boxing, gym, pilates,
--    fitness, zumba, cycle/cycling, hike/hiking).
UPDATE community_groups
SET tags = ARRAY(
  SELECT DISTINCT unnest(tags || ARRAY['health','fitness']::text[])
)
WHERE
  name ILIKE '%run club%'
  OR name ILIKE '%running%'
  OR name ILIKE '%walk%'
  OR name ILIKE '%yoga%'
  OR name ILIKE '%boxing%'
  OR name ILIKE '%gym%'
  OR name ILIKE '%pilates%'
  OR name ILIKE '%fitness%'
  OR name ILIKE '%zumba%'
  OR name ILIKE '%cycle%'
  OR name ILIKE '%cycling%'
  OR name ILIKE '%hike%'
  OR name ILIKE '%hiking%';

-- 2. Tag matching community groups as mental_health (wellness, meditation, support groups).
UPDATE community_groups
SET tags = ARRAY(
  SELECT DISTINCT unnest(tags || ARRAY['health','mental_health']::text[])
)
WHERE
  name ILIKE '%wellness%'
  OR name ILIKE '%meditation%'
  OR name ILIKE '%mindful%'
  OR name ILIKE '%mental health%'
  OR name ILIKE '%support group%'
  OR name ILIKE '%therapy%';

-- 3. Tag existing events whose title suggests health/wellness as 'health'.
UPDATE events
SET tags = ARRAY(
  SELECT DISTINCT unnest(tags || ARRAY['health']::text[])
)
WHERE
  title ILIKE '%health%'
  OR title ILIKE '%wellness%'
  OR title ILIKE '%clinic%'
  OR title ILIKE '%vaccin%'
  OR title ILIKE '%screening%'
  OR title ILIKE '%medical%'
  OR title ILIKE '%blood drive%'
  OR title ILIKE '%dental%';

-- 4. Tag existing events whose title suggests fitness as 'fitness' + 'health'.
UPDATE events
SET tags = ARRAY(
  SELECT DISTINCT unnest(tags || ARRAY['health','fitness']::text[])
)
WHERE
  title ILIKE '%5k%'
  OR title ILIKE '%10k%'
  OR title ILIKE '%marathon%'
  OR title ILIKE '%run%'
  OR title ILIKE '%fitness%'
  OR title ILIKE '%yoga%'
  OR title ILIKE '%walk%'
  OR title ILIKE '%boxing%';

-- 5. Tag existing events whose title suggests mental health.
UPDATE events
SET tags = ARRAY(
  SELECT DISTINCT unnest(tags || ARRAY['health','mental_health']::text[])
)
WHERE
  title ILIKE '%mental%'
  OR title ILIKE '%mindful%'
  OR title ILIKE '%meditation%'
  OR title ILIKE '%therapy%'
  OR title ILIKE '%support group%';

-- 6. Seed a handful of explicit health events so /health has
--    something to show even on a fresh DB. Date-window: from
--    today out 60 days. Re-runnable via ON CONFLICT (slug).
INSERT INTO events (
  title, slug, description, category, tags,
  start_date, start_time, end_date, end_time,
  location_name, address, district, image_url,
  is_published, is_featured, is_ticketed,
  rsvp_count, visibility
) VALUES

('Spring Community Blood Drive', 'spring-community-blood-drive',
 'Give the gift of life. Walk-ins welcome, appointments preferred. Free snacks and a t-shirt for all donors.',
 'community', ARRAY['health']::text[],
 (CURRENT_DATE + INTERVAL '14 days')::date, '09:00', NULL, '15:00',
 'Compton City Hall', '205 S Willowbrook Ave, Compton, CA 90220', 1,
 'https://images.unsplash.com/photo-1615461066159-fea0960485d5?w=1200&q=80',
 TRUE, TRUE, FALSE, 0, 'public'),

('Compton Health and Wellness Fair', 'compton-health-wellness-fair',
 'Free screenings, dental checkups, vision tests, mental health resources, and family activities. Open to all Compton residents.',
 'community', ARRAY['health','mental_health']::text[],
 (CURRENT_DATE + INTERVAL '21 days')::date, '10:00', NULL, '16:00',
 'Compton College', '1111 E Artesia Blvd, Compton, CA 90221', 4,
 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=1200&q=80',
 TRUE, TRUE, FALSE, 0, 'public'),

('Compton Strong 5K Run/Walk', 'compton-strong-5k-spring',
 'Annual community 5K through historic Compton. All ages and abilities. Finisher medals for everyone.',
 'sports', ARRAY['health','fitness']::text[],
 (CURRENT_DATE + INTERVAL '28 days')::date, '07:00', NULL, '10:00',
 'Wilson Park', 'Wilson Park, Compton, CA', 1,
 'https://images.unsplash.com/photo-1530137073521-28cda9e9b39c?w=1200&q=80',
 TRUE, FALSE, FALSE, 0, 'public'),

('Mental Wellness Workshop', 'mental-wellness-workshop-spring',
 'Free workshop on stress management, mindfulness, and community support resources. Light refreshments served.',
 'community', ARRAY['health','mental_health']::text[],
 (CURRENT_DATE + INTERVAL '7 days')::date, '14:00', NULL, '16:00',
 'Compton Library', '240 W Compton Blvd, Compton, CA 90220', 1,
 'https://images.unsplash.com/photo-1573497019418-b400bb3ab074?w=1200&q=80',
 TRUE, FALSE, FALSE, 0, 'public'),

('Free Vaccination Clinic', 'free-vaccination-clinic-spring',
 'Flu shots, COVID boosters, and routine vaccinations. No insurance needed. All ages welcome. Bilingual staff.',
 'community', ARRAY['health']::text[],
 (CURRENT_DATE + INTERVAL '10 days')::date, '10:00', NULL, '14:00',
 'MLK Community Hospital', '1680 E 120th St, Los Angeles, CA 90059', 3,
 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=1200&q=80',
 TRUE, FALSE, FALSE, 0, 'public'),

('Yoga in the Park', 'yoga-in-the-park-spring',
 'Free outdoor yoga session. Beginner-friendly. Bring a mat or towel; we provide the good vibes.',
 'community', ARRAY['health','fitness']::text[],
 (CURRENT_DATE + INTERVAL '4 days')::date, '08:00', NULL, '09:30',
 'Gonzales Park', 'Gonzales Park, Compton, CA', 2,
 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=1200&q=80',
 TRUE, FALSE, FALSE, 0, 'public'),

('Free Community Dental Day', 'free-community-dental-day-spring',
 'Cleanings, exams, and basic fillings for uninsured residents. Bilingual staff. Walk-ins welcome but appointments preferred.',
 'community', ARRAY['health']::text[],
 (CURRENT_DATE + INTERVAL '35 days')::date, '08:00', NULL, '16:00',
 'MLK Community Hospital', '1680 E 120th St, Los Angeles, CA 90059', 3,
 'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=1200&q=80',
 TRUE, FALSE, FALSE, 0, 'public')

ON CONFLICT (slug) DO NOTHING;
