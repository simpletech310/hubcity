-- ============================================================
-- 025: City Council & School Accounts
-- Creates auth users, profiles, channels, posts, and school admin
-- links for Compton City Council members and key schools.
-- ============================================================

-- ============================================================
-- CITY COUNCIL AUTH USERS + PROFILES
-- ============================================================

-- Mayor Emma Sharif
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous, created_at, updated_at)
VALUES (
  'a1000001-0001-4000-8000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'mayor.sharif@hubcity.app',
  crypt('HubCity2026!Council', gen_salt('bf')),
  NOW(), '{"provider":"email","providers":["email"]}'::jsonb,
  '{"display_name":"Emma Sharif"}'::jsonb,
  false, false, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, display_name, handle, avatar_url, bio, role, district, verification_status, city, state, zip, created_at)
VALUES (
  'a1000001-0001-4000-8000-000000000001',
  'Mayor Emma Sharif',
  'mayor_sharif',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face',
  'Mayor of the City of Compton. Serving all districts. Committed to transparency, economic development, and community empowerment. #HubCity #ComptonRising',
  'city_official', NULL, 'verified', 'Compton', 'CA', '90220', NOW()
) ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  handle = EXCLUDED.handle,
  bio = EXCLUDED.bio,
  role = EXCLUDED.role,
  verification_status = EXCLUDED.verification_status;

-- Council Member Deidre Duhart — District 1
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous, created_at, updated_at)
VALUES (
  'a1000001-0002-4000-8000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'council.duhart@hubcity.app',
  crypt('HubCity2026!Council', gen_salt('bf')),
  NOW(), '{"provider":"email","providers":["email"]}'::jsonb,
  '{"display_name":"Deidre Duhart"}'::jsonb,
  false, false, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, display_name, handle, avatar_url, bio, role, district, verification_status, city, state, zip, created_at)
VALUES (
  'a1000001-0002-4000-8000-000000000002',
  'Deidre Duhart',
  'council_duhart',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face',
  'Compton City Council Member — District 1. Fighting for better infrastructure, public safety, and youth programs in our neighborhoods.',
  'city_official', 1, 'verified', 'Compton', 'CA', '90220', NOW()
) ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  handle = EXCLUDED.handle,
  bio = EXCLUDED.bio,
  role = EXCLUDED.role,
  district = EXCLUDED.district,
  verification_status = EXCLUDED.verification_status;

-- Council Member Andre Spicer — District 2
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous, created_at, updated_at)
VALUES (
  'a1000001-0003-4000-8000-000000000003',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'council.spicer@hubcity.app',
  crypt('HubCity2026!Council', gen_salt('bf')),
  NOW(), '{"provider":"email","providers":["email"]}'::jsonb,
  '{"display_name":"Andre Spicer"}'::jsonb,
  false, false, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, display_name, handle, avatar_url, bio, role, district, verification_status, city, state, zip, created_at)
VALUES (
  'a1000001-0003-4000-8000-000000000003',
  'Andre Spicer',
  'council_spicer',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
  'Compton City Council — District 2. Focused on economic growth, small business support, and building a stronger Hub City for everyone. Born and raised in Compton. 💪🏾',
  'city_official', 2, 'verified', 'Compton', 'CA', '90220', NOW()
) ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  handle = EXCLUDED.handle,
  bio = EXCLUDED.bio,
  role = EXCLUDED.role,
  district = EXCLUDED.district,
  verification_status = EXCLUDED.verification_status;

-- Council Member Jonathan Bowers — District 3
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous, created_at, updated_at)
VALUES (
  'a1000001-0004-4000-8000-000000000004',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'council.bowers@hubcity.app',
  crypt('HubCity2026!Council', gen_salt('bf')),
  NOW(), '{"provider":"email","providers":["email"]}'::jsonb,
  '{"display_name":"Jonathan Bowers"}'::jsonb,
  false, false, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, display_name, handle, avatar_url, bio, role, district, verification_status, city, state, zip, created_at)
VALUES (
  'a1000001-0004-4000-8000-000000000004',
  'Jonathan Bowers',
  'council_bowers',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
  'Compton City Council — District 3. Working to bring new investment, safer streets, and more green spaces to our community. #ComptonForward',
  'city_official', 3, 'verified', 'Compton', 'CA', '90220', NOW()
) ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  handle = EXCLUDED.handle,
  bio = EXCLUDED.bio,
  role = EXCLUDED.role,
  district = EXCLUDED.district,
  verification_status = EXCLUDED.verification_status;

-- Council Member Lillie P. Darden — District 4
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous, created_at, updated_at)
VALUES (
  'a1000001-0005-4000-8000-000000000005',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'council.darden@hubcity.app',
  crypt('HubCity2026!Council', gen_salt('bf')),
  NOW(), '{"provider":"email","providers":["email"]}'::jsonb,
  '{"display_name":"Lillie P. Darden"}'::jsonb,
  false, false, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, display_name, handle, avatar_url, bio, role, district, verification_status, city, state, zip, created_at)
VALUES (
  'a1000001-0005-4000-8000-000000000005',
  'Lillie P. Darden',
  'council_darden',
  'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=200&h=200&fit=crop&crop=face',
  'Compton City Council — District 4. Dedicated to senior services, youth mentorship, and cultural preservation. Compton is home. 🏛️',
  'city_official', 4, 'verified', 'Compton', 'CA', '90220', NOW()
) ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  handle = EXCLUDED.handle,
  bio = EXCLUDED.bio,
  role = EXCLUDED.role,
  district = EXCLUDED.district,
  verification_status = EXCLUDED.verification_status;


-- ============================================================
-- SCHOOL AUTH USERS + PROFILES
-- ============================================================

-- Compton High School account
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous, created_at, updated_at)
VALUES (
  'b2000001-0001-4000-8000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'compton.high@hubcity.app',
  crypt('HubCity2026!School', gen_salt('bf')),
  NOW(), '{"provider":"email","providers":["email"]}'::jsonb,
  '{"display_name":"Compton High School"}'::jsonb,
  false, false, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, display_name, handle, avatar_url, bio, role, verification_status, city, state, zip, created_at)
VALUES (
  'b2000001-0001-4000-8000-000000000001',
  'Compton High School',
  'compton_high',
  'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=200&h=200&fit=crop',
  'Official account of Compton High School — Home of the Tarbabes! 🏈 Since 1896. Where Champions Are Made. #GoTarbabes #ComptonHigh',
  'city_official', 'verified', 'Compton', 'CA', '90220', NOW()
) ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  handle = EXCLUDED.handle,
  bio = EXCLUDED.bio,
  role = EXCLUDED.role,
  verification_status = EXCLUDED.verification_status;

-- Dominguez High School account
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous, created_at, updated_at)
VALUES (
  'b2000001-0002-4000-8000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'dominguez.high@hubcity.app',
  crypt('HubCity2026!School', gen_salt('bf')),
  NOW(), '{"provider":"email","providers":["email"]}'::jsonb,
  '{"display_name":"Dominguez High School"}'::jsonb,
  false, false, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, display_name, handle, avatar_url, bio, role, verification_status, city, state, zip, created_at)
VALUES (
  'b2000001-0002-4000-8000-000000000002',
  'Dominguez High School',
  'dominguez_high',
  'https://images.unsplash.com/photo-1562774053-701939374585?w=200&h=200&fit=crop',
  'Official account of Dominguez High School — Home of the Dons! 🏆 Excellence Through Unity since 1952. #GoDons',
  'city_official', 'verified', 'Compton', 'CA', '90221', NOW()
) ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  handle = EXCLUDED.handle,
  bio = EXCLUDED.bio,
  role = EXCLUDED.role,
  verification_status = EXCLUDED.verification_status;

-- Centennial High School account
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous, created_at, updated_at)
VALUES (
  'b2000001-0003-4000-8000-000000000003',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'centennial.high@hubcity.app',
  crypt('HubCity2026!School', gen_salt('bf')),
  NOW(), '{"provider":"email","providers":["email"]}'::jsonb,
  '{"display_name":"Centennial High School"}'::jsonb,
  false, false, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, display_name, handle, avatar_url, bio, role, verification_status, city, state, zip, created_at)
VALUES (
  'b2000001-0003-4000-8000-000000000003',
  'Centennial High School',
  'centennial_high',
  'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=200&h=200&fit=crop',
  'Official account of Centennial High School — Home of the Apaches! 🏀 Building Tomorrow''s Leaders since 1954. #GoApaches',
  'city_official', 'verified', 'Compton', 'CA', '90222', NOW()
) ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  handle = EXCLUDED.handle,
  bio = EXCLUDED.bio,
  role = EXCLUDED.role,
  verification_status = EXCLUDED.verification_status;

-- Compton College account
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous, created_at, updated_at)
VALUES (
  'b2000001-0004-4000-8000-000000000004',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'compton.college@hubcity.app',
  crypt('HubCity2026!School', gen_salt('bf')),
  NOW(), '{"provider":"email","providers":["email"]}'::jsonb,
  '{"display_name":"Compton College"}'::jsonb,
  false, false, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, display_name, handle, avatar_url, bio, role, verification_status, city, state, zip, created_at)
VALUES (
  'b2000001-0004-4000-8000-000000000004',
  'Compton College',
  'compton_college',
  'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=200&h=200&fit=crop',
  'Official Compton College account. Empowering the next generation since 1927. Transfer programs, career training, and community education. 🎓 #ComptonCollege',
  'city_official', 'verified', 'Compton', 'CA', '90221', NOW()
) ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  handle = EXCLUDED.handle,
  bio = EXCLUDED.bio,
  role = EXCLUDED.role,
  verification_status = EXCLUDED.verification_status;


-- ============================================================
-- CHANNELS (one for each council member + school)
-- ============================================================

-- Council Channels
INSERT INTO channels (id, name, slug, description, type, avatar_url, banner_url, owner_id, is_verified, is_active, follower_count)
VALUES
  ('c3000001-0001-4000-8000-000000000001',
   'Mayor Emma Sharif', 'mayor-sharif',
   'Official channel of Compton Mayor Emma Sharif. City updates, policy announcements, community events, and behind-the-scenes at City Hall.',
   'city',
   'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face',
   'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=1200&h=400&fit=crop',
   'a1000001-0001-4000-8000-000000000001', true, true, 1247),

  ('c3000001-0002-4000-8000-000000000002',
   'Council — District 1', 'council-district-1',
   'Official channel of District 1 Council Member Deidre Duhart. Infrastructure updates, public safety, and youth programs.',
   'city',
   'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face',
   'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=1200&h=400&fit=crop',
   'a1000001-0002-4000-8000-000000000002', true, true, 543),

  ('c3000001-0003-4000-8000-000000000003',
   'Council — District 2', 'council-district-2',
   'Official channel of District 2 Council Member Andre Spicer. Economic development, small business advocacy, and community building.',
   'city',
   'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
   'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&h=400&fit=crop',
   'a1000001-0003-4000-8000-000000000003', true, true, 672),

  ('c3000001-0004-4000-8000-000000000004',
   'Council — District 3', 'council-district-3',
   'Official channel of District 3 Council Member Jonathan Bowers. Green spaces, public investment, and safer streets for Compton.',
   'city',
   'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
   'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1200&h=400&fit=crop',
   'a1000001-0004-4000-8000-000000000004', true, true, 489),

  ('c3000001-0005-4000-8000-000000000005',
   'Council — District 4', 'council-district-4',
   'Official channel of District 4 Council Member Lillie P. Darden. Senior services, mentorship, and cultural preservation.',
   'city',
   'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=200&h=200&fit=crop&crop=face',
   'https://images.unsplash.com/photo-1514924013411-cbf25faa35bb?w=1200&h=400&fit=crop',
   'a1000001-0005-4000-8000-000000000005', true, true, 411)
ON CONFLICT (slug) DO NOTHING;

-- School Channels
INSERT INTO channels (id, name, slug, description, type, avatar_url, banner_url, owner_id, is_verified, is_active, follower_count)
VALUES
  ('c3000002-0001-4000-8000-000000000001',
   'Compton High School', 'compton-high',
   'Official channel of Compton High School — Tarbabes! Game highlights, campus news, student spotlights, and school events.',
   'school',
   'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=200&h=200&fit=crop',
   'https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=1200&h=400&fit=crop',
   'b2000001-0001-4000-8000-000000000001', true, true, 2134),

  ('c3000002-0002-4000-8000-000000000002',
   'Dominguez High School', 'dominguez-high',
   'Official Dominguez High School channel — Home of the Dons! Track & field highlights, school news, and campus life.',
   'school',
   'https://images.unsplash.com/photo-1562774053-701939374585?w=200&h=200&fit=crop',
   'https://images.unsplash.com/photo-1461896836934-bd45ba5291f7?w=1200&h=400&fit=crop',
   'b2000001-0002-4000-8000-000000000002', true, true, 1876),

  ('c3000002-0003-4000-8000-000000000003',
   'Centennial High School', 'centennial-high',
   'Official Centennial High School channel — Go Apaches! Basketball, Health Sciences Academy updates, and community events.',
   'school',
   'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=200&h=200&fit=crop',
   'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1200&h=400&fit=crop',
   'b2000001-0003-4000-8000-000000000003', true, true, 1543),

  ('c3000002-0004-4000-8000-000000000004',
   'Compton College', 'compton-college-channel',
   'Official Compton College channel. Campus news, student success stories, registration info, athletics, and community education.',
   'school',
   'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=200&h=200&fit=crop',
   'https://images.unsplash.com/photo-1562774053-701939374585?w=1200&h=400&fit=crop',
   'b2000001-0004-4000-8000-000000000004', true, true, 3210)
ON CONFLICT (slug) DO NOTHING;


-- ============================================================
-- SCHOOL ADMIN LINKS
-- ============================================================

INSERT INTO school_admins (school_id, user_id, role, title)
VALUES
  ((SELECT id FROM schools WHERE slug = 'compton-high-school'), 'b2000001-0001-4000-8000-000000000001', 'admin', 'School Account'),
  ((SELECT id FROM schools WHERE slug = 'dominguez-high-school'), 'b2000001-0002-4000-8000-000000000002', 'admin', 'School Account'),
  ((SELECT id FROM schools WHERE slug = 'centennial-high-school'), 'b2000001-0003-4000-8000-000000000003', 'admin', 'School Account'),
  ((SELECT id FROM schools WHERE slug = 'compton-college'), 'b2000001-0004-4000-8000-000000000004', 'admin', 'School Account')
ON CONFLICT (school_id, user_id) DO NOTHING;


-- ============================================================
-- COUNCIL POSTS (Pulse feed content)
-- ============================================================

-- Mayor Emma Sharif posts
INSERT INTO posts (author_id, body, hashtags, is_published, is_pinned, like_count, comment_count, reaction_counts, created_at)
VALUES
  ('a1000001-0001-4000-8000-000000000001',
   'Excited to announce that the FY 2026-27 budget workshop is scheduled for April 15 at City Hall. We''re prioritizing youth programs, street improvements, and public safety. Your voice matters — public comment is open. See you there! 🏛️',
   ARRAY['#ComptonBudget', '#CityHall', '#PublicComment'],
   true, true, 87, 23,
   '{"heart": 42, "fire": 18, "clap": 27}'::jsonb,
   NOW() - INTERVAL '2 hours'),

  ('a1000001-0001-4000-8000-000000000001',
   'Had an incredible morning at the Spring Park Cleanup Day at Wilson Park. Over 150 volunteers came out! This is what community looks like. Thank you Compton. 💚🌳',
   ARRAY['#ComptonCleanup', '#WilsonPark', '#Community'],
   true, false, 134, 31,
   '{"heart": 68, "fire": 32, "clap": 34}'::jsonb,
   NOW() - INTERVAL '1 day'),

  ('a1000001-0001-4000-8000-000000000001',
   'Compton, we just secured $4.2 million in state funding for the Long Beach Boulevard Corridor improvement project. New sidewalks, lighting, bike lanes, and tree planting coming to District 2. This is the investment our city deserves. 🎉',
   ARRAY['#ComptonInvestment', '#Infrastructure', '#LongBeachBlvd'],
   true, false, 256, 67,
   '{"heart": 98, "fire": 87, "clap": 71}'::jsonb,
   NOW() - INTERVAL '3 days');

-- Andre Spicer posts
INSERT INTO posts (author_id, body, hashtags, is_published, like_count, comment_count, reaction_counts, created_at)
VALUES
  ('a1000001-0003-4000-8000-000000000003',
   'Just wrapped up a productive meeting with small business owners on Long Beach Blvd. We''re rolling out the Hub City Small Business Grant — $5,000-$25,000 for qualifying Compton businesses. Applications open next week. Let''s grow together! 💰',
   ARRAY['#SmallBusiness', '#ComptonGrows', '#District2'],
   true, 145, 38,
   '{"heart": 56, "fire": 45, "clap": 44}'::jsonb,
   NOW() - INTERVAL '4 hours'),

  ('a1000001-0003-4000-8000-000000000003',
   'Proud to see Patria Coffee Roasters thriving on Long Beach Blvd. Stop by and support local — best coffee in the Hub City, no debate. ☕️ #ShopCompton',
   ARRAY['#ShopCompton', '#PatriaCoffee', '#SupportLocal'],
   true, 98, 15,
   '{"heart": 45, "fire": 28, "clap": 25}'::jsonb,
   NOW() - INTERVAL '2 days'),

  ('a1000001-0003-4000-8000-000000000003',
   'Tonight''s City Council meeting recap: ✅ Approved new crosswalks on Compton Blvd ✅ Extended rec center hours at Lueders Park ✅ New mural project approved for Del Amo corridor. Your government is working. Stay engaged, Compton. 🏛️',
   ARRAY['#CouncilUpdate', '#Compton', '#CivicEngagement'],
   true, 112, 29,
   '{"heart": 38, "fire": 42, "clap": 32}'::jsonb,
   NOW() - INTERVAL '5 days');

-- Deidre Duhart posts
INSERT INTO posts (author_id, body, hashtags, is_published, like_count, comment_count, reaction_counts, created_at)
VALUES
  ('a1000001-0002-4000-8000-000000000002',
   'District 1 update: New LED streetlights are being installed on Willowbrook Ave and Compton Blvd this week. Better visibility, safer streets, lower energy costs. Progress! 💡',
   ARRAY['#District1', '#PublicSafety', '#Compton'],
   true, 76, 12,
   '{"heart": 30, "fire": 22, "clap": 24}'::jsonb,
   NOW() - INTERVAL '6 hours'),

  ('a1000001-0002-4000-8000-000000000002',
   'Reminder: The Community Safety Town Hall is April 24 at 6 PM in City Hall Council Chambers. Sheriff''s station updates, neighborhood watch expansion, and youth diversion programs. Your input shapes our safety plan. 🤝',
   ARRAY['#SafetyTownHall', '#District1', '#NeighborhoodWatch'],
   true, 54, 19,
   '{"heart": 22, "fire": 15, "clap": 17}'::jsonb,
   NOW() - INTERVAL '1 day');

-- Jonathan Bowers posts
INSERT INTO posts (author_id, body, hashtags, is_published, like_count, comment_count, reaction_counts, created_at)
VALUES
  ('a1000001-0004-4000-8000-000000000004',
   'Big news for District 3: Gonzales Park is getting a $1.8M renovation! New playground, upgraded basketball courts, community garden, and ADA-accessible pathways. Construction starts this summer. Our parks deserve the best. 🌿🏀',
   ARRAY['#GonzalesPark', '#District3', '#ParkRenovation'],
   true, 167, 41,
   '{"heart": 72, "fire": 48, "clap": 47}'::jsonb,
   NOW() - INTERVAL '8 hours'),

  ('a1000001-0004-4000-8000-000000000004',
   'Visited the Compton/Woodley Airport today — one of the oldest airports in LA County, opened in 1924. Working with FAA on improvements to keep this historic asset thriving. Aviation history lives in Compton. ✈️',
   ARRAY['#ComptonAirport', '#District3', '#AvHistory'],
   true, 89, 17,
   '{"heart": 34, "fire": 28, "clap": 27}'::jsonb,
   NOW() - INTERVAL '3 days');

-- Lillie P. Darden posts
INSERT INTO posts (author_id, body, hashtags, is_published, like_count, comment_count, reaction_counts, created_at)
VALUES
  ('a1000001-0005-4000-8000-000000000005',
   'Our seniors are the backbone of Compton. Hosted our monthly Senior Social at Lueders Park today — lunch, games, health screenings, and lots of laughter. If you have a senior loved one who could use community, reach out to my office. ❤️',
   ARRAY['#SeniorServices', '#District4', '#ComptonCares'],
   true, 93, 22,
   '{"heart": 52, "fire": 18, "clap": 23}'::jsonb,
   NOW() - INTERVAL '5 hours'),

  ('a1000001-0005-4000-8000-000000000005',
   'The Heritage House (built 1869!) is getting a fresh preservation treatment this month. Compton''s oldest building and a California Historical Landmark. Our history matters. Come visit at Willowbrook Ave & Myrrh St. 🏠',
   ARRAY['#HeritageHouse', '#ComptonHistory', '#Preservation'],
   true, 118, 26,
   '{"heart": 58, "fire": 30, "clap": 30}'::jsonb,
   NOW() - INTERVAL '2 days');


-- ============================================================
-- SCHOOL POSTS (Pulse feed content)
-- ============================================================

-- Compton High School posts
INSERT INTO posts (author_id, body, hashtags, school_id, is_published, like_count, comment_count, reaction_counts, created_at)
VALUES
  ('b2000001-0001-4000-8000-000000000001',
   '🏈 GAME DAY! Compton Tarbabes vs. Dominguez Dons this Friday at 7 PM! Come out and support your team. Student section is gonna be LOUD. Let''s pack those stands! #GoTarbabes',
   ARRAY['#GoTarbabes', '#ComptonHigh', '#Football', '#GameDay'],
   (SELECT id FROM schools WHERE slug = 'compton-high-school'),
   true, 234, 67,
   '{"heart": 45, "fire": 112, "clap": 77}'::jsonb,
   NOW() - INTERVAL '3 hours'),

  ('b2000001-0001-4000-8000-000000000001',
   'Congratulations to our STEM Magnet students who took 1st place at the LA County Science Fair! 🧪🏆 Ariana M. won for her water filtration project and Marcus T. for his AI-powered recycling sorter. Compton innovation at its finest!',
   ARRAY['#STEM', '#ComptonHigh', '#ScienceFair', '#ComptonPride'],
   (SELECT id FROM schools WHERE slug = 'compton-high-school'),
   true, 312, 45,
   '{"heart": 134, "fire": 98, "clap": 80}'::jsonb,
   NOW() - INTERVAL '1 day'),

  ('b2000001-0001-4000-8000-000000000001',
   '📚 Registration for Summer Bridge Program is now open! Free academic enrichment for incoming 9th graders. Math, English, science + college prep workshops. Spots fill up fast → Link in bio. #ComptonHighSummer',
   ARRAY['#SummerBridge', '#ComptonHigh', '#Education'],
   (SELECT id FROM schools WHERE slug = 'compton-high-school'),
   true, 89, 23,
   '{"heart": 34, "fire": 22, "clap": 33}'::jsonb,
   NOW() - INTERVAL '2 days');

-- Dominguez High School posts
INSERT INTO posts (author_id, body, hashtags, school_id, is_published, like_count, comment_count, reaction_counts, created_at)
VALUES
  ('b2000001-0002-4000-8000-000000000002',
   '🏆 TRACK & FIELD UPDATE: Our boys 4x400 relay team just broke the school record at the CIF Prelims! 3:14.2 🔥 Finals next Saturday. These young men are putting in WORK. #DonsTrack #CIF',
   ARRAY['#DonsTrack', '#CIF', '#DominguezHigh', '#TrackAndField'],
   (SELECT id FROM schools WHERE slug = 'dominguez-high-school'),
   true, 278, 52,
   '{"heart": 67, "fire": 134, "clap": 77}'::jsonb,
   NOW() - INTERVAL '5 hours'),

  ('b2000001-0002-4000-8000-000000000002',
   'Dominguez Visual Arts students unveiled their community mural on the south wall of the gym today. Months of planning and painting by 30+ students. Come see it in person — you''ll be blown away. 🎨 #DonsArt',
   ARRAY['#DonsArt', '#DominguezHigh', '#Mural', '#StudentArt'],
   (SELECT id FROM schools WHERE slug = 'dominguez-high-school'),
   true, 198, 34,
   '{"heart": 89, "fire": 56, "clap": 53}'::jsonb,
   NOW() - INTERVAL '1 day'),

  ('b2000001-0002-4000-8000-000000000002',
   'CTE Robotics Pathway students are heading to the FIRST Robotics regional championship! 🤖 Team "Don Bots" qualified after an undefeated qualifying round. Engineering the future, one robot at a time.',
   ARRAY['#DonBots', '#Robotics', '#DominguezHigh', '#FIRST'],
   (SELECT id FROM schools WHERE slug = 'dominguez-high-school'),
   true, 156, 28,
   '{"heart": 54, "fire": 67, "clap": 35}'::jsonb,
   NOW() - INTERVAL '4 days');

-- Centennial High School posts
INSERT INTO posts (author_id, body, hashtags, school_id, is_published, like_count, comment_count, reaction_counts, created_at)
VALUES
  ('b2000001-0003-4000-8000-000000000003',
   '🏀 APACHES WIN! 78-65 over Lynwood in the league opener! Jaylen W. dropped 28 points and 8 assists. The gym was ROCKING. Next game Wednesday at home. Pull up! #GoApaches #Basketball',
   ARRAY['#GoApaches', '#Basketball', '#CentennialHigh', '#GameRecap'],
   (SELECT id FROM schools WHERE slug = 'centennial-high-school'),
   true, 321, 78,
   '{"heart": 56, "fire": 156, "clap": 109}'::jsonb,
   NOW() - INTERVAL '6 hours'),

  ('b2000001-0003-4000-8000-000000000003',
   'Health Sciences Academy spotlight: 12 of our seniors got accepted into nursing programs across California! 🩺 These students completed 200+ clinical hours while maintaining 3.5+ GPAs. The future of healthcare is from Compton.',
   ARRAY['#HealthSciences', '#CentennialHigh', '#NursingSchool', '#ComptonPride'],
   (SELECT id FROM schools WHERE slug = 'centennial-high-school'),
   true, 267, 41,
   '{"heart": 123, "fire": 78, "clap": 66}'::jsonb,
   NOW() - INTERVAL '2 days'),

  ('b2000001-0003-4000-8000-000000000003',
   '📅 Spring Dance is April 18! Tickets on sale now in the student store — $15 presale, $20 at the door. Theme: "Compton Nights" ✨ DJ sets, photo booth, and food trucks. Don''t miss it!',
   ARRAY['#SpringDance', '#CentennialHigh', '#ComptonNights'],
   (SELECT id FROM schools WHERE slug = 'centennial-high-school'),
   true, 145, 56,
   '{"heart": 67, "fire": 45, "clap": 33}'::jsonb,
   NOW() - INTERVAL '3 days');

-- Compton College posts
INSERT INTO posts (author_id, body, hashtags, school_id, is_published, like_count, comment_count, reaction_counts, created_at)
VALUES
  ('b2000001-0004-4000-8000-000000000004',
   '🎓 Fall 2026 registration opens May 1! Over 50 transfer programs, career training certificates, and free tuition for qualifying students through the Compton College Promise. Your future starts here.',
   ARRAY['#ComptonCollege', '#Registration', '#CollegePromise', '#FreeTuition'],
   (SELECT id FROM schools WHERE slug = 'compton-college'),
   true, 189, 34,
   '{"heart": 78, "fire": 56, "clap": 55}'::jsonb,
   NOW() - INTERVAL '4 hours'),

  ('b2000001-0004-4000-8000-000000000004',
   'Our Nursing program just received full accreditation renewal! 95% NCLEX pass rate — highest in the district. 🩺 Applications for the Fall cohort close May 15. Don''t sleep on this opportunity.',
   ARRAY['#NursingProgram', '#ComptonCollege', '#NCLEX', '#Healthcare'],
   (SELECT id FROM schools WHERE slug = 'compton-college'),
   true, 234, 29,
   '{"heart": 112, "fire": 67, "clap": 55}'::jsonb,
   NOW() - INTERVAL '1 day'),

  ('b2000001-0004-4000-8000-000000000004',
   'Transfer success story: Compton College → UCLA → Goldman Sachs. Alumni Marcus Johnson (Class of ''22) just landed a full-time analyst position. From the Hub City to Wall Street. The blueprint is HERE. 🎯',
   ARRAY['#TransferSuccess', '#ComptonCollege', '#UCLA', '#Alumni'],
   (SELECT id FROM schools WHERE slug = 'compton-college'),
   true, 456, 87,
   '{"heart": 198, "fire": 167, "clap": 91}'::jsonb,
   NOW() - INTERVAL '3 days'),

  ('b2000001-0004-4000-8000-000000000004',
   'Free community workshops this month at Compton College: 📊 Financial Literacy (April 10) 💻 Intro to Coding (April 12) 📝 Resume Building (April 17). Open to ALL Compton residents. No enrollment needed. Walk in!',
   ARRAY['#CommunityWorkshops', '#ComptonCollege', '#FreeClasses'],
   (SELECT id FROM schools WHERE slug = 'compton-college'),
   true, 167, 45,
   '{"heart": 56, "fire": 67, "clap": 44}'::jsonb,
   NOW() - INTERVAL '5 days');
