-- ============================================================
-- Migration 027: City Ambassador Role & Seed Accounts
-- Adds city_ambassador role for community advocates
-- ============================================================

-- Add city_ambassador to user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'city_ambassador';

-- ============================================================
-- Create 8 City Ambassador accounts
-- These are engaged community members who advocate for Compton
-- ============================================================

-- 1. Marcus "Big Marc" Thompson — Community Organizer, District 1
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, role, aud, created_at, updated_at)
VALUES (
  'a4000001-0001-4000-8000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'marcus.thompson@hubcity.com',
  crypt('HubCity2024!', gen_salt('bf')),
  NOW(),
  '{"full_name": "Marcus Thompson"}',
  'authenticated', 'authenticated', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
VALUES (
  'a4000001-0001-4000-8000-000000000001',
  'a4000001-0001-4000-8000-000000000001',
  'a4000001-0001-4000-8000-000000000001',
  'email',
  jsonb_build_object('sub', 'a4000001-0001-4000-8000-000000000001', 'email', 'marcus.thompson@hubcity.com'),
  NOW(), NOW(), NOW()
) ON CONFLICT DO NOTHING;

INSERT INTO profiles (id, display_name, handle, bio, role, district, verification_status)
VALUES (
  'a4000001-0001-4000-8000-000000000001',
  'Marcus Thompson',
  'bigmarc_compton',
  'Community organizer & youth mentor. Born and raised in Compton. Building bridges between neighborhoods. #HubCity4Life',
  'city_ambassador', 1, 'verified'
) ON CONFLICT (id) DO UPDATE SET role = 'city_ambassador', verification_status = 'verified';

INSERT INTO channels (id, owner_id, name, slug, description, type, is_verified, is_active, follower_count)
VALUES (
  'c4000001-0001-4000-8000-000000000001',
  'a4000001-0001-4000-8000-000000000001',
  'Big Marc Community',
  'bigmarc-community',
  'Community organizing, youth mentoring, and neighborhood advocacy in District 1',
  'community', true, true, 245
) ON CONFLICT (id) DO NOTHING;

-- 2. Jasmine Reyes — Environmental Advocate, District 2
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, role, aud, created_at, updated_at)
VALUES (
  'a4000001-0002-4000-8000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'jasmine.reyes@hubcity.com',
  crypt('HubCity2024!', gen_salt('bf')),
  NOW(),
  '{"full_name": "Jasmine Reyes"}',
  'authenticated', 'authenticated', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
VALUES (
  'a4000001-0002-4000-8000-000000000002',
  'a4000001-0002-4000-8000-000000000002',
  'a4000001-0002-4000-8000-000000000002',
  'email',
  jsonb_build_object('sub', 'a4000001-0002-4000-8000-000000000002', 'email', 'jasmine.reyes@hubcity.com'),
  NOW(), NOW(), NOW()
) ON CONFLICT DO NOTHING;

INSERT INTO profiles (id, display_name, handle, bio, role, district, verification_status)
VALUES (
  'a4000001-0002-4000-8000-000000000002',
  'Jasmine Reyes',
  'jasmine_green_compton',
  'Environmental justice advocate. Fighting for clean air & green spaces in Compton. Founder of Compton Green Initiative.',
  'city_ambassador', 2, 'verified'
) ON CONFLICT (id) DO UPDATE SET role = 'city_ambassador', verification_status = 'verified';

INSERT INTO channels (id, owner_id, name, slug, description, type, is_verified, is_active, follower_count)
VALUES (
  'c4000001-0002-4000-8000-000000000002',
  'a4000001-0002-4000-8000-000000000002',
  'Compton Green Initiative',
  'compton-green',
  'Environmental advocacy, tree plantings, community garden updates, and clean air campaigns',
  'community', true, true, 412
) ON CONFLICT (id) DO NOTHING;

-- 3. DeShawn Williams — Youth Sports & Education, District 3
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, role, aud, created_at, updated_at)
VALUES (
  'a4000001-0003-4000-8000-000000000003',
  '00000000-0000-0000-0000-000000000000',
  'deshawn.williams@hubcity.com',
  crypt('HubCity2024!', gen_salt('bf')),
  NOW(),
  '{"full_name": "DeShawn Williams"}',
  'authenticated', 'authenticated', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
VALUES (
  'a4000001-0003-4000-8000-000000000003',
  'a4000001-0003-4000-8000-000000000003',
  'a4000001-0003-4000-8000-000000000003',
  'email',
  jsonb_build_object('sub', 'a4000001-0003-4000-8000-000000000003', 'email', 'deshawn.williams@hubcity.com'),
  NOW(), NOW(), NOW()
) ON CONFLICT DO NOTHING;

INSERT INTO profiles (id, display_name, handle, bio, role, district, verification_status)
VALUES (
  'a4000001-0003-4000-8000-000000000003',
  'DeShawn Williams',
  'coach_deshawn',
  'Youth basketball coach & education advocate. Keeping kids on the court and in the classroom. Compton born, Compton proud.',
  'city_ambassador', 3, 'verified'
) ON CONFLICT (id) DO UPDATE SET role = 'city_ambassador', verification_status = 'verified';

INSERT INTO channels (id, owner_id, name, slug, description, type, is_verified, is_active, follower_count)
VALUES (
  'c4000001-0003-4000-8000-000000000003',
  'a4000001-0003-4000-8000-000000000003',
  'Compton Youth Sports',
  'compton-youth-sports',
  'Youth basketball leagues, tournaments, educational workshops, and mentoring in District 3',
  'community', true, true, 580
) ON CONFLICT (id) DO NOTHING;

-- 4. Patricia "Ms. Pat" Jenkins — Senior Advocate, District 4
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, role, aud, created_at, updated_at)
VALUES (
  'a4000001-0004-4000-8000-000000000004',
  '00000000-0000-0000-0000-000000000000',
  'patricia.jenkins@hubcity.com',
  crypt('HubCity2024!', gen_salt('bf')),
  NOW(),
  '{"full_name": "Patricia Jenkins"}',
  'authenticated', 'authenticated', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
VALUES (
  'a4000001-0004-4000-8000-000000000004',
  'a4000001-0004-4000-8000-000000000004',
  'a4000001-0004-4000-8000-000000000004',
  'email',
  jsonb_build_object('sub', 'a4000001-0004-4000-8000-000000000004', 'email', 'patricia.jenkins@hubcity.com'),
  NOW(), NOW(), NOW()
) ON CONFLICT DO NOTHING;

INSERT INTO profiles (id, display_name, handle, bio, role, district, verification_status)
VALUES (
  'a4000001-0004-4000-8000-000000000004',
  'Patricia Jenkins',
  'mspat_compton',
  '40 years in Compton. Senior advocate, neighborhood watch captain, and church leader. Our elders are our treasure.',
  'city_ambassador', 4, 'verified'
) ON CONFLICT (id) DO UPDATE SET role = 'city_ambassador', verification_status = 'verified';

INSERT INTO channels (id, owner_id, name, slug, description, type, is_verified, is_active, follower_count)
VALUES (
  'c4000001-0004-4000-8000-000000000004',
  'a4000001-0004-4000-8000-000000000004',
  'Compton Seniors Network',
  'compton-seniors',
  'Senior resources, neighborhood watch updates, community events for our elders in District 4',
  'community', true, true, 320
) ON CONFLICT (id) DO NOTHING;

-- 5. Carlos Mendoza — Small Business Champion, District 1
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, role, aud, created_at, updated_at)
VALUES (
  'a4000001-0005-4000-8000-000000000005',
  '00000000-0000-0000-0000-000000000000',
  'carlos.mendoza@hubcity.com',
  crypt('HubCity2024!', gen_salt('bf')),
  NOW(),
  '{"full_name": "Carlos Mendoza"}',
  'authenticated', 'authenticated', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
VALUES (
  'a4000001-0005-4000-8000-000000000005',
  'a4000001-0005-4000-8000-000000000005',
  'a4000001-0005-4000-8000-000000000005',
  'email',
  jsonb_build_object('sub', 'a4000001-0005-4000-8000-000000000005', 'email', 'carlos.mendoza@hubcity.com'),
  NOW(), NOW(), NOW()
) ON CONFLICT DO NOTHING;

INSERT INTO profiles (id, display_name, handle, bio, role, district, verification_status)
VALUES (
  'a4000001-0005-4000-8000-000000000005',
  'Carlos Mendoza',
  'carlos_biz_compton',
  'Helping Compton small businesses thrive. Free workshops, networking events, and advocacy. Shop local, build local.',
  'city_ambassador', 1, 'verified'
) ON CONFLICT (id) DO UPDATE SET role = 'city_ambassador', verification_status = 'verified';

INSERT INTO channels (id, owner_id, name, slug, description, type, is_verified, is_active, follower_count)
VALUES (
  'c4000001-0005-4000-8000-000000000005',
  'a4000001-0005-4000-8000-000000000005',
  'Compton Business Network',
  'compton-biz-network',
  'Small business workshops, networking events, and advocacy for Compton entrepreneurs',
  'community', true, true, 675
) ON CONFLICT (id) DO NOTHING;

-- 6. Aaliyah Brown — Arts & Culture, District 2
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, role, aud, created_at, updated_at)
VALUES (
  'a4000001-0006-4000-8000-000000000006',
  '00000000-0000-0000-0000-000000000000',
  'aaliyah.brown@hubcity.com',
  crypt('HubCity2024!', gen_salt('bf')),
  NOW(),
  '{"full_name": "Aaliyah Brown"}',
  'authenticated', 'authenticated', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
VALUES (
  'a4000001-0006-4000-8000-000000000006',
  'a4000001-0006-4000-8000-000000000006',
  'a4000001-0006-4000-8000-000000000006',
  'email',
  jsonb_build_object('sub', 'a4000001-0006-4000-8000-000000000006', 'email', 'aaliyah.brown@hubcity.com'),
  NOW(), NOW(), NOW()
) ON CONFLICT DO NOTHING;

INSERT INTO profiles (id, display_name, handle, bio, role, district, verification_status)
VALUES (
  'a4000001-0006-4000-8000-000000000006',
  'Aaliyah Brown',
  'aaliyah_arts',
  'Muralist, poet, and cultural advocate. Compton has the richest art scene in LA and I am here to prove it.',
  'city_ambassador', 2, 'verified'
) ON CONFLICT (id) DO UPDATE SET role = 'city_ambassador', verification_status = 'verified';

INSERT INTO channels (id, owner_id, name, slug, description, type, is_verified, is_active, follower_count)
VALUES (
  'c4000001-0006-4000-8000-000000000006',
  'a4000001-0006-4000-8000-000000000006',
  'Compton Arts & Culture',
  'compton-arts',
  'Murals, poetry, music, gallery openings, and cultural events celebrating Compton creativity',
  'community', true, true, 890
) ON CONFLICT (id) DO NOTHING;

-- 7. Robert "Rob" Taylor — Public Safety Advocate, District 3
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, role, aud, created_at, updated_at)
VALUES (
  'a4000001-0007-4000-8000-000000000007',
  '00000000-0000-0000-0000-000000000000',
  'robert.taylor@hubcity.com',
  crypt('HubCity2024!', gen_salt('bf')),
  NOW(),
  '{"full_name": "Robert Taylor"}',
  'authenticated', 'authenticated', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
VALUES (
  'a4000001-0007-4000-8000-000000000007',
  'a4000001-0007-4000-8000-000000000007',
  'a4000001-0007-4000-8000-000000000007',
  'email',
  jsonb_build_object('sub', 'a4000001-0007-4000-8000-000000000007', 'email', 'robert.taylor@hubcity.com'),
  NOW(), NOW(), NOW()
) ON CONFLICT DO NOTHING;

INSERT INTO profiles (id, display_name, handle, bio, role, district, verification_status)
VALUES (
  'a4000001-0007-4000-8000-000000000007',
  'Robert Taylor',
  'rob_safety_compton',
  'Retired firefighter turned community safety advocate. Violence prevention, emergency preparedness, and neighborhood watch leader.',
  'city_ambassador', 3, 'verified'
) ON CONFLICT (id) DO UPDATE SET role = 'city_ambassador', verification_status = 'verified';

INSERT INTO channels (id, owner_id, name, slug, description, type, is_verified, is_active, follower_count)
VALUES (
  'c4000001-0007-4000-8000-000000000007',
  'a4000001-0007-4000-8000-000000000007',
  'Compton Safe Streets',
  'compton-safe-streets',
  'Community safety updates, neighborhood watch coordination, and emergency preparedness in District 3',
  'community', true, true, 450
) ON CONFLICT (id) DO NOTHING;

-- 8. Maria Santos — Health & Wellness, District 4
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, role, aud, created_at, updated_at)
VALUES (
  'a4000001-0008-4000-8000-000000000008',
  '00000000-0000-0000-0000-000000000000',
  'maria.santos@hubcity.com',
  crypt('HubCity2024!', gen_salt('bf')),
  NOW(),
  '{"full_name": "Maria Santos"}',
  'authenticated', 'authenticated', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
VALUES (
  'a4000001-0008-4000-8000-000000000008',
  'a4000001-0008-4000-8000-000000000008',
  'a4000001-0008-4000-8000-000000000008',
  'email',
  jsonb_build_object('sub', 'a4000001-0008-4000-8000-000000000008', 'email', 'maria.santos@hubcity.com'),
  NOW(), NOW(), NOW()
) ON CONFLICT DO NOTHING;

INSERT INTO profiles (id, display_name, handle, bio, role, district, verification_status)
VALUES (
  'a4000001-0008-4000-8000-000000000008',
  'Maria Santos',
  'maria_wellness',
  'Community health worker & wellness advocate. Free health screenings, nutrition workshops, and mental health resources for Compton families.',
  'city_ambassador', 4, 'verified'
) ON CONFLICT (id) DO UPDATE SET role = 'city_ambassador', verification_status = 'verified';

INSERT INTO channels (id, owner_id, name, slug, description, type, is_verified, is_active, follower_count)
VALUES (
  'c4000001-0008-4000-8000-000000000008',
  'a4000001-0008-4000-8000-000000000008',
  'Compton Health & Wellness',
  'compton-health-wellness',
  'Free health screenings, nutrition workshops, mental health resources, and wellness events',
  'community', true, true, 520
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Seed posts for ambassadors
-- ============================================================

-- Marcus Thompson posts
INSERT INTO posts (author_id, body, is_published, created_at) VALUES
('a4000001-0001-4000-8000-000000000001', 'Just wrapped up our Saturday morning neighborhood cleanup on Wilmington Ave! 47 volunteers showed up. Compton, you never disappoint. Next one is April 19th — who is in? #ComptonCleanup #District1', true, NOW() - interval '2 days'),
('a4000001-0001-4000-8000-000000000001', 'Proud to announce our Youth Leadership Academy graduates this week. 22 young leaders ready to make their mark. The future of Compton is in good hands. #ComptonYouth', true, NOW() - interval '5 days');

-- Jasmine Reyes posts
INSERT INTO posts (author_id, body, is_published, created_at) VALUES
('a4000001-0002-4000-8000-000000000002', 'Air quality update: AQI in Compton today is 42 (Good). Remember, our community fought hard for the new air monitoring stations. Knowledge is power. #CleanAirCompton', true, NOW() - interval '1 day'),
('a4000001-0002-4000-8000-000000000002', 'We planted 50 new trees along Rosecrans this weekend! Each tree removes up to 48 lbs of CO2 per year. In 10 years, that is 24,000 lbs of cleaner air for our community. #ComptonGreen', true, NOW() - interval '4 days');

-- DeShawn Williams posts
INSERT INTO posts (author_id, body, is_published, created_at) VALUES
('a4000001-0003-4000-8000-000000000003', 'Basketball clinic this Saturday at MLK Park! Free for all kids ages 8-16. We are teaching fundamentals AND life skills. Drop-ins welcome. See you on the court! #ComptonBasketball', true, NOW() - interval '1 day'),
('a4000001-0003-4000-8000-000000000003', 'Shoutout to our kids who made the honor roll this semester while staying active in youth sports. Balancing books and basketball — that is the real game. Proud of every single one of you.', true, NOW() - interval '6 days');

-- Patricia Jenkins posts
INSERT INTO posts (author_id, body, is_published, created_at) VALUES
('a4000001-0004-4000-8000-000000000004', 'Reminder: Senior resource fair this Thursday at the Compton Community Center. Free blood pressure checks, Medicare assistance, and legal aid. Bring your neighbors! #ComptonSeniors', true, NOW() - interval '3 days'),
('a4000001-0004-4000-8000-000000000004', 'Neighborhood watch meeting last night was our biggest yet — 35 residents from District 4. When we look out for each other, everyone is safer. #ComptonStrong', true, NOW() - interval '7 days');

-- Carlos Mendoza posts
INSERT INTO posts (author_id, body, is_published, created_at) VALUES
('a4000001-0005-4000-8000-000000000005', 'Free business workshop next Tuesday: "How to Get Your Compton Business Online." We will cover websites, social media, and getting on Hub City. All local entrepreneurs welcome! #ShopCompton', true, NOW() - interval '2 days'),
('a4000001-0005-4000-8000-000000000005', 'Just visited 5 new small businesses on Long Beach Blvd this week. The entrepreneurial spirit in Compton is ALIVE. Support your local spots — they are your neighbors. #ComptonBiz', true, NOW() - interval '5 days');

-- Aaliyah Brown posts
INSERT INTO posts (author_id, body, is_published, created_at) VALUES
('a4000001-0006-4000-8000-000000000006', 'New mural going up on Compton Blvd & Central — celebrating 50 years of Compton hip-hop history. Stop by this weekend to watch the artists work! #ComptonArt #ComptonCulture', true, NOW() - interval '1 day'),
('a4000001-0006-4000-8000-000000000006', 'Poetry night at the Compton Community Center was MAGIC. 15 performers, standing room only. Compton has the most talented artists in LA, period. Next one is May 2nd. #ComptonPoetry', true, NOW() - interval '4 days');

-- Robert Taylor posts
INSERT INTO posts (author_id, body, is_published, created_at) VALUES
('a4000001-0007-4000-8000-000000000007', 'Emergency preparedness tip: Every household should have a 72-hour kit — water, food, flashlight, first aid, copies of important documents. Do not wait for an emergency. Prepare now. #ComptonReady', true, NOW() - interval '2 days'),
('a4000001-0007-4000-8000-000000000007', 'Great turnout at tonight''s community safety walk through District 3. When neighbors walk together, we send a message: this is OUR community. Next walk is Friday 6 PM at Gonzales Park.', true, NOW() - interval '6 days');

-- Maria Santos posts
INSERT INTO posts (author_id, body, is_published, created_at) VALUES
('a4000001-0008-4000-8000-000000000008', 'Free health screening results from last Saturday: we checked 120 Compton residents for blood pressure, diabetes, and cholesterol. 23 referrals made. Early detection saves lives! #ComptonHealth', true, NOW() - interval '3 days'),
('a4000001-0008-4000-8000-000000000008', 'Mental health matters. Our free bilingual counseling sessions at Martin Luther King Jr. Community Hospital continue every Wednesday. No insurance needed. You are not alone. #ComptonWellness', true, NOW() - interval '5 days');
