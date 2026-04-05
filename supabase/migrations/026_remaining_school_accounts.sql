-- ============================================================
-- 026: Remaining School Accounts
-- Creates auth users, profiles, channels, school_admin links,
-- and seed posts for all remaining Compton schools.
-- ============================================================

-- ============================================================
-- LYNWOOD HIGH SCHOOL
-- ============================================================
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous, created_at, updated_at)
VALUES ('b2000001-0010-4000-8000-000000000010', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'lynwood.high@hubcity.app', crypt('HubCity2026!School', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{"display_name":"Lynwood High School"}'::jsonb, false, false, NOW(), NOW()) ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, display_name, handle, avatar_url, bio, role, verification_status, city, state, zip)
VALUES ('b2000001-0010-4000-8000-000000000010', 'Lynwood High School', 'lynwood_high',
  'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=200&h=200&fit=crop',
  'Official Lynwood High School account — Home of the Knights! 🛡️ Knights Rise Together since 1940. Award-winning marching band & diverse programs. #GoKnights',
  'city_official', 'verified', 'Lynwood', 'CA', '90262')
ON CONFLICT (id) DO UPDATE SET display_name=EXCLUDED.display_name, handle=EXCLUDED.handle, bio=EXCLUDED.bio, role=EXCLUDED.role, verification_status=EXCLUDED.verification_status;

INSERT INTO channels (id, name, slug, description, type, avatar_url, owner_id, is_verified, is_active, follower_count)
VALUES ('c3000002-0010-4000-8000-000000000010', 'Lynwood High School', 'lynwood-high',
  'Official Lynwood High School channel — Knights! Marching band highlights, campus news, and school events.',
  'school', 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=200&h=200&fit=crop',
  'b2000001-0010-4000-8000-000000000010', true, true, 1650)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO school_admins (school_id, user_id, role, title)
VALUES ((SELECT id FROM schools WHERE slug='lynwood-high-school'), 'b2000001-0010-4000-8000-000000000010', 'admin', 'School Account')
ON CONFLICT (school_id, user_id) DO NOTHING;

INSERT INTO posts (author_id, body, hashtags, school_id, is_published, like_count, comment_count, reaction_counts, created_at) VALUES
('b2000001-0010-4000-8000-000000000010', '🎵 LYNWOOD MARCHING BAND takes FIRST PLACE at the LA County Band Review! Our musicians brought the ENERGY and the judges couldn''t deny it. So proud of these students! #GoKnights #MarchingBand', ARRAY['#GoKnights', '#MarchingBand', '#LynwoodHigh'], (SELECT id FROM schools WHERE slug='lynwood-high-school'), true, 287, 54, '{"heart": 98, "fire": 112, "clap": 77}'::jsonb, NOW() - INTERVAL '4 hours'),
('b2000001-0010-4000-8000-000000000010', 'Engineering Pathway students presented their capstone projects today — solar-powered phone chargers, automated plant watering systems, and a drone delivery prototype. The future is being built at Lynwood High! 🔧', ARRAY['#Engineering', '#LynwoodHigh', '#STEM'], (SELECT id FROM schools WHERE slug='lynwood-high-school'), true, 156, 28, '{"heart": 67, "fire": 56, "clap": 33}'::jsonb, NOW() - INTERVAL '2 days'),
('b2000001-0010-4000-8000-000000000010', '📚 AP Exam prep sessions start next week! Free after-school tutoring Mon-Thu in the library. Snacks provided. Let''s get those 4s and 5s, Knights! #APExams #LynwoodHigh', ARRAY['#APExams', '#LynwoodHigh', '#CollegeReady'], (SELECT id FROM schools WHERE slug='lynwood-high-school'), true, 89, 19, '{"heart": 34, "fire": 28, "clap": 27}'::jsonb, NOW() - INTERVAL '3 days');

-- ============================================================
-- MIDDLE SCHOOLS
-- ============================================================

-- Walton Middle School
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous, created_at, updated_at)
VALUES ('b2000001-0020-4000-8000-000000000020', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'walton.middle@hubcity.app', crypt('HubCity2026!School', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{"display_name":"Walton Middle School"}'::jsonb, false, false, NOW(), NOW()) ON CONFLICT (id) DO NOTHING;
INSERT INTO profiles (id, display_name, handle, avatar_url, bio, role, verification_status, city, state, zip)
VALUES ('b2000001-0020-4000-8000-000000000020', 'Walton Middle School', 'walton_middle',
  'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=200&h=200&fit=crop',
  'Official Walton Middle School — Home of the Warriors! ⚔️ Preparing Warriors for the Future. AVID school of distinction. #WaltonWarriors',
  'city_official', 'verified', 'Compton', 'CA', '90220')
ON CONFLICT (id) DO UPDATE SET display_name=EXCLUDED.display_name, handle=EXCLUDED.handle, bio=EXCLUDED.bio, role=EXCLUDED.role, verification_status=EXCLUDED.verification_status;
INSERT INTO channels (id, name, slug, description, type, avatar_url, owner_id, is_verified, is_active, follower_count)
VALUES ('c3000002-0020-4000-8000-000000000020', 'Walton Middle School', 'walton-middle', 'Official Walton Middle School channel — Warriors! School news, AVID updates, and student achievements.', 'school', 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=200&h=200&fit=crop', 'b2000001-0020-4000-8000-000000000020', true, true, 876)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO school_admins (school_id, user_id, role, title) VALUES ((SELECT id FROM schools WHERE slug='walton-middle-school'), 'b2000001-0020-4000-8000-000000000020', 'admin', 'School Account') ON CONFLICT (school_id, user_id) DO NOTHING;
INSERT INTO posts (author_id, body, hashtags, school_id, is_published, like_count, comment_count, reaction_counts, created_at) VALUES
('b2000001-0020-4000-8000-000000000020', '🏆 Walton Warriors AVID students visited UCLA today! 45 students toured campus, met admissions counselors, and ate lunch in the dining hall. College dreams are becoming real plans. #AVIDWorks #WaltonWarriors', ARRAY['#AVIDWorks', '#WaltonWarriors', '#CollegeTrip'], (SELECT id FROM schools WHERE slug='walton-middle-school'), true, 178, 34, '{"heart": 78, "fire": 56, "clap": 44}'::jsonb, NOW() - INTERVAL '5 hours'),
('b2000001-0020-4000-8000-000000000020', 'Science Fair winners announced! 🧪 1st place: Aaliyah J. (water quality testing), 2nd: Marcus D. (solar oven), 3rd: Sofia R. (plant growth experiment). These Warriors are SCIENTISTS! 🔬', ARRAY['#ScienceFair', '#WaltonWarriors', '#STEM'], (SELECT id FROM schools WHERE slug='walton-middle-school'), true, 134, 22, '{"heart": 56, "fire": 45, "clap": 33}'::jsonb, NOW() - INTERVAL '2 days');

-- Whaley Middle School
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous, created_at, updated_at)
VALUES ('b2000001-0021-4000-8000-000000000021', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'whaley.middle@hubcity.app', crypt('HubCity2026!School', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{"display_name":"Whaley Middle School"}'::jsonb, false, false, NOW(), NOW()) ON CONFLICT (id) DO NOTHING;
INSERT INTO profiles (id, display_name, handle, avatar_url, bio, role, verification_status, city, state, zip)
VALUES ('b2000001-0021-4000-8000-000000000021', 'Whaley Middle School', 'whaley_middle',
  'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=200&h=200&fit=crop',
  'Official Whaley Middle School — Wildcats Lead the Way! 🐾 Academics, athletics, and arts. Compton Unified School District. #WhaleyWildcats',
  'city_official', 'verified', 'Compton', 'CA', '90220')
ON CONFLICT (id) DO UPDATE SET display_name=EXCLUDED.display_name, handle=EXCLUDED.handle, bio=EXCLUDED.bio, role=EXCLUDED.role, verification_status=EXCLUDED.verification_status;
INSERT INTO channels (id, name, slug, description, type, avatar_url, owner_id, is_verified, is_active, follower_count)
VALUES ('c3000002-0021-4000-8000-000000000021', 'Whaley Middle School', 'whaley-middle', 'Official Whaley Middle School channel — Wildcats! School updates, sports, and student spotlights.', 'school', 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=200&h=200&fit=crop', 'b2000001-0021-4000-8000-000000000021', true, true, 743)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO school_admins (school_id, user_id, role, title) VALUES ((SELECT id FROM schools WHERE slug='whaley-middle-school'), 'b2000001-0021-4000-8000-000000000021', 'admin', 'School Account') ON CONFLICT (school_id, user_id) DO NOTHING;
INSERT INTO posts (author_id, body, hashtags, school_id, is_published, like_count, comment_count, reaction_counts, created_at) VALUES
('b2000001-0021-4000-8000-000000000021', '🏀 Wildcats basketball won the district championship! 48-39 over Roosevelt. Coach Miller and the team put in incredible work this season. Celebrate with us at the school assembly Friday! #WhaleyWildcats', ARRAY['#WhaleyWildcats', '#Basketball', '#Champions'], (SELECT id FROM schools WHERE slug='whaley-middle-school'), true, 198, 45, '{"heart": 67, "fire": 78, "clap": 53}'::jsonb, NOW() - INTERVAL '7 hours'),
('b2000001-0021-4000-8000-000000000021', 'Art show this Thursday! 🎨 Over 100 student artworks on display in the cafeteria from 5-7 PM. Refreshments provided. Come support our young artists! #WildcatArt #WhaleyMiddle', ARRAY['#WildcatArt', '#WhaleyMiddle', '#StudentArt'], (SELECT id FROM schools WHERE slug='whaley-middle-school'), true, 112, 19, '{"heart": 56, "fire": 28, "clap": 28}'::jsonb, NOW() - INTERVAL '1 day');

-- Davis Middle School
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous, created_at, updated_at)
VALUES ('b2000001-0022-4000-8000-000000000022', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'davis.middle@hubcity.app', crypt('HubCity2026!School', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{"display_name":"Davis Middle School"}'::jsonb, false, false, NOW(), NOW()) ON CONFLICT (id) DO NOTHING;
INSERT INTO profiles (id, display_name, handle, avatar_url, bio, role, verification_status, city, state, zip)
VALUES ('b2000001-0022-4000-8000-000000000022', 'Davis Middle School', 'davis_middle',
  'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=200&h=200&fit=crop',
  'Official Davis Middle School — Where Dragons Soar! 🐉 Excellence in academics and character. Compton Unified. #DavisDragons',
  'city_official', 'verified', 'Compton', 'CA', '90220')
ON CONFLICT (id) DO UPDATE SET display_name=EXCLUDED.display_name, handle=EXCLUDED.handle, bio=EXCLUDED.bio, role=EXCLUDED.role, verification_status=EXCLUDED.verification_status;
INSERT INTO channels (id, name, slug, description, type, avatar_url, owner_id, is_verified, is_active, follower_count)
VALUES ('c3000002-0022-4000-8000-000000000022', 'Davis Middle School', 'davis-middle', 'Official Davis Middle School channel — Dragons! Academics, events, and student life.', 'school', 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=200&h=200&fit=crop', 'b2000001-0022-4000-8000-000000000022', true, true, 654)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO school_admins (school_id, user_id, role, title) VALUES ((SELECT id FROM schools WHERE slug='davis-middle-school'), 'b2000001-0022-4000-8000-000000000022', 'admin', 'School Account') ON CONFLICT (school_id, user_id) DO NOTHING;
INSERT INTO posts (author_id, body, hashtags, school_id, is_published, like_count, comment_count, reaction_counts, created_at) VALUES
('b2000001-0022-4000-8000-000000000022', 'Dragons Coding Club built their first mobile app! 📱 A homework tracker that sends reminders and lets students share study notes. These 7th graders are the future of tech! #DavisDragons #Coding', ARRAY['#DavisDragons', '#Coding', '#TechKids'], (SELECT id FROM schools WHERE slug='davis-middle-school'), true, 145, 27, '{"heart": 56, "fire": 48, "clap": 41}'::jsonb, NOW() - INTERVAL '6 hours'),
('b2000001-0022-4000-8000-000000000022', '📖 Read-a-Thon results are in! Davis Dragons read 12,847 books this semester — a NEW SCHOOL RECORD! Top reader: Jayden M. with 156 books. Reading is power! 📚🔥', ARRAY['#ReadAThon', '#DavisDragons', '#LiteracyMatters'], (SELECT id FROM schools WHERE slug='davis-middle-school'), true, 167, 31, '{"heart": 78, "fire": 45, "clap": 44}'::jsonb, NOW() - INTERVAL '3 days');

-- Roosevelt Middle School
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous, created_at, updated_at)
VALUES ('b2000001-0023-4000-8000-000000000023', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'roosevelt.middle@hubcity.app', crypt('HubCity2026!School', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{"display_name":"Roosevelt Middle School"}'::jsonb, false, false, NOW(), NOW()) ON CONFLICT (id) DO NOTHING;
INSERT INTO profiles (id, display_name, handle, avatar_url, bio, role, verification_status, city, state, zip)
VALUES ('b2000001-0023-4000-8000-000000000023', 'Roosevelt Middle School', 'roosevelt_middle',
  'https://images.unsplash.com/photo-1588072432836-e10032774350?w=200&h=200&fit=crop',
  'Official Roosevelt Middle School — Riders of Excellence! 🐎 Strong academics, character development, and community pride. #RooseveltRiders',
  'city_official', 'verified', 'Compton', 'CA', '90221')
ON CONFLICT (id) DO UPDATE SET display_name=EXCLUDED.display_name, handle=EXCLUDED.handle, bio=EXCLUDED.bio, role=EXCLUDED.role, verification_status=EXCLUDED.verification_status;
INSERT INTO channels (id, name, slug, description, type, avatar_url, owner_id, is_verified, is_active, follower_count)
VALUES ('c3000002-0023-4000-8000-000000000023', 'Roosevelt Middle School', 'roosevelt-middle', 'Official Roosevelt Middle School channel — Rough Riders! Sports, academics, and school news.', 'school', 'https://images.unsplash.com/photo-1588072432836-e10032774350?w=200&h=200&fit=crop', 'b2000001-0023-4000-8000-000000000023', true, true, 589)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO school_admins (school_id, user_id, role, title) VALUES ((SELECT id FROM schools WHERE slug='roosevelt-middle-school'), 'b2000001-0023-4000-8000-000000000023', 'admin', 'School Account') ON CONFLICT (school_id, user_id) DO NOTHING;
INSERT INTO posts (author_id, body, hashtags, school_id, is_published, like_count, comment_count, reaction_counts, created_at) VALUES
('b2000001-0023-4000-8000-000000000023', '⚽ Roosevelt Rough Riders soccer team is headed to the playoffs! Undefeated in league play (8-0-2). Game is Saturday at 10 AM — come cheer us on! #RidersUp #Soccer', ARRAY['#RidersUp', '#Soccer', '#RooseveltMiddle'], (SELECT id FROM schools WHERE slug='roosevelt-middle-school'), true, 134, 28, '{"heart": 45, "fire": 56, "clap": 33}'::jsonb, NOW() - INTERVAL '8 hours'),
('b2000001-0023-4000-8000-000000000023', 'Character counts! 🌟 This month''s Roosevelt Role Models: Isaiah P. (kindness), Destiny M. (perseverance), and Carlos G. (leadership). Proud of these Riders showing what excellence looks like.', ARRAY['#RooseveltRiders', '#CharacterMatters', '#RoleModels'], (SELECT id FROM schools WHERE slug='roosevelt-middle-school'), true, 112, 18, '{"heart": 67, "fire": 22, "clap": 23}'::jsonb, NOW() - INTERVAL '2 days');

-- Bunche Middle School
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous, created_at, updated_at)
VALUES ('b2000001-0024-4000-8000-000000000024', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'bunche.middle@hubcity.app', crypt('HubCity2026!School', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{"display_name":"Bunche Middle School"}'::jsonb, false, false, NOW(), NOW()) ON CONFLICT (id) DO NOTHING;
INSERT INTO profiles (id, display_name, handle, avatar_url, bio, role, verification_status, city, state, zip)
VALUES ('b2000001-0024-4000-8000-000000000024', 'Bunche Middle School', 'bunche_middle',
  'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=200&h=200&fit=crop',
  'Official Bunche Middle School — Bears Build Bright Futures! 🐻 Named after Nobel Peace Prize winner Ralph Bunche. #BuncheBears',
  'city_official', 'verified', 'Compton', 'CA', '90220')
ON CONFLICT (id) DO UPDATE SET display_name=EXCLUDED.display_name, handle=EXCLUDED.handle, bio=EXCLUDED.bio, role=EXCLUDED.role, verification_status=EXCLUDED.verification_status;
INSERT INTO channels (id, name, slug, description, type, avatar_url, owner_id, is_verified, is_active, follower_count)
VALUES ('c3000002-0024-4000-8000-000000000024', 'Bunche Middle School', 'bunche-middle', 'Official Bunche Middle School channel — Bears! School events, academics, and community.', 'school', 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=200&h=200&fit=crop', 'b2000001-0024-4000-8000-000000000024', true, true, 512)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO school_admins (school_id, user_id, role, title) VALUES ((SELECT id FROM schools WHERE slug='bunche-middle-school'), 'b2000001-0024-4000-8000-000000000024', 'admin', 'School Account') ON CONFLICT (school_id, user_id) DO NOTHING;
INSERT INTO posts (author_id, body, hashtags, school_id, is_published, like_count, comment_count, reaction_counts, created_at) VALUES
('b2000001-0024-4000-8000-000000000024', '📝 Bunche Bears spelling bee champion Amara W. is headed to the district finals! She spelled "perseverance" to clinch the win. How fitting! Good luck Amara! 🐻✨ #BuncheBears #SpellingBee', ARRAY['#BuncheBears', '#SpellingBee', '#BuncheMiddle'], (SELECT id FROM schools WHERE slug='bunche-middle-school'), true, 145, 32, '{"heart": 67, "fire": 38, "clap": 40}'::jsonb, NOW() - INTERVAL '9 hours'),
('b2000001-0024-4000-8000-000000000024', 'Community garden update! 🌱 Our 6th graders planted tomatoes, peppers, and herbs in the Bunche Bears Garden. Fresh produce will go to families in need through the school food pantry. Growing food, growing hearts. ❤️', ARRAY['#BuncheBears', '#CommunityGarden', '#GrowingGood'], (SELECT id FROM schools WHERE slug='bunche-middle-school'), true, 167, 24, '{"heart": 89, "fire": 34, "clap": 44}'::jsonb, NOW() - INTERVAL '3 days');

-- Willowbrook Middle School
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous, created_at, updated_at)
VALUES ('b2000001-0025-4000-8000-000000000025', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'willowbrook.middle@hubcity.app', crypt('HubCity2026!School', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{"display_name":"Willowbrook Middle School"}'::jsonb, false, false, NOW(), NOW()) ON CONFLICT (id) DO NOTHING;
INSERT INTO profiles (id, display_name, handle, avatar_url, bio, role, verification_status, city, state, zip)
VALUES ('b2000001-0025-4000-8000-000000000025', 'Willowbrook Middle School', 'willowbrook_middle',
  'https://images.unsplash.com/photo-1580894894513-541e068a3e2b?w=200&h=200&fit=crop',
  'Official Willowbrook Middle School — Wolves Run Together! 🐺 Strong academics and stronger community. #WillowbrookWolves',
  'city_official', 'verified', 'Compton', 'CA', '90222')
ON CONFLICT (id) DO UPDATE SET display_name=EXCLUDED.display_name, handle=EXCLUDED.handle, bio=EXCLUDED.bio, role=EXCLUDED.role, verification_status=EXCLUDED.verification_status;
INSERT INTO channels (id, name, slug, description, type, avatar_url, owner_id, is_verified, is_active, follower_count)
VALUES ('c3000002-0025-4000-8000-000000000025', 'Willowbrook Middle School', 'willowbrook-middle', 'Official Willowbrook Middle School channel — Wolves! Campus life, sports, and school news.', 'school', 'https://images.unsplash.com/photo-1580894894513-541e068a3e2b?w=200&h=200&fit=crop', 'b2000001-0025-4000-8000-000000000025', true, true, 478)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO school_admins (school_id, user_id, role, title) VALUES ((SELECT id FROM schools WHERE slug='willowbrook-middle-school'), 'b2000001-0025-4000-8000-000000000025', 'admin', 'School Account') ON CONFLICT (school_id, user_id) DO NOTHING;
INSERT INTO posts (author_id, body, hashtags, school_id, is_published, like_count, comment_count, reaction_counts, created_at) VALUES
('b2000001-0025-4000-8000-000000000025', '🐺 WOLVES TRACK MEET RESULTS: Our 8th grade relay team took gold and broke the school record! Mia, Jasmine, DeAndre, and TJ ran a 4x100 in 49.2 seconds. The pack runs FAST! #WillowbrookWolves #Track', ARRAY['#WillowbrookWolves', '#Track', '#SchoolRecord'], (SELECT id FROM schools WHERE slug='willowbrook-middle-school'), true, 156, 29, '{"heart": 56, "fire": 67, "clap": 33}'::jsonb, NOW() - INTERVAL '10 hours'),
('b2000001-0025-4000-8000-000000000025', 'Career Day was a huge success! 🎤 35 professionals from Compton visited to share their stories — firefighters, nurses, engineers, artists, and entrepreneurs. Our Wolves can be ANYTHING. Thank you to all volunteers!', ARRAY['#CareerDay', '#WillowbrookWolves', '#FutureLeaders'], (SELECT id FROM schools WHERE slug='willowbrook-middle-school'), true, 134, 21, '{"heart": 67, "fire": 34, "clap": 33}'::jsonb, NOW() - INTERVAL '2 days');

-- ============================================================
-- ELEMENTARY SCHOOLS
-- ============================================================

-- Tibby Elementary
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous, created_at, updated_at)
VALUES ('b2000001-0030-4000-8000-000000000030', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'tibby.elementary@hubcity.app', crypt('HubCity2026!School', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{"display_name":"Tibby Elementary"}'::jsonb, false, false, NOW(), NOW()) ON CONFLICT (id) DO NOTHING;
INSERT INTO profiles (id, display_name, handle, avatar_url, bio, role, verification_status, city, state, zip)
VALUES ('b2000001-0030-4000-8000-000000000030', 'Tibby Elementary', 'tibby_elementary',
  'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=200&h=200&fit=crop',
  'Official Tibby Elementary — Little Tigers, Big Dreams! 🐯 Nurturing young minds in Compton since day one. #TibbyTigers',
  'city_official', 'verified', 'Compton', 'CA', '90220')
ON CONFLICT (id) DO UPDATE SET display_name=EXCLUDED.display_name, handle=EXCLUDED.handle, bio=EXCLUDED.bio, role=EXCLUDED.role, verification_status=EXCLUDED.verification_status;
INSERT INTO channels (id, name, slug, description, type, avatar_url, owner_id, is_verified, is_active, follower_count)
VALUES ('c3000002-0030-4000-8000-000000000030', 'Tibby Elementary', 'tibby-elementary', 'Official Tibby Elementary channel — Tigers! School events, student achievements, and parent updates.', 'school', 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=200&h=200&fit=crop', 'b2000001-0030-4000-8000-000000000030', true, true, 423)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO school_admins (school_id, user_id, role, title) VALUES ((SELECT id FROM schools WHERE slug='tibby-elementary'), 'b2000001-0030-4000-8000-000000000030', 'admin', 'School Account') ON CONFLICT (school_id, user_id) DO NOTHING;
INSERT INTO posts (author_id, body, hashtags, school_id, is_published, like_count, comment_count, reaction_counts, created_at) VALUES
('b2000001-0030-4000-8000-000000000030', '🐯 Tibby Tigers had an AMAZING field trip to the California Science Center! The kids loved the space shuttle Endeavour and the tide pool exhibit. Learning comes alive outside the classroom! #TibbyTigers #FieldTrip', ARRAY['#TibbyTigers', '#FieldTrip', '#ScienceCenter'], (SELECT id FROM schools WHERE slug='tibby-elementary'), true, 198, 42, '{"heart": 98, "fire": 45, "clap": 55}'::jsonb, NOW() - INTERVAL '5 hours'),
('b2000001-0030-4000-8000-000000000030', 'Kindergarten graduation rehearsal is SO CUTE 🎓😭 These little tigers have grown so much this year. Ceremony is June 5 at 10 AM. Bring tissues! #TibbyTigers #KinderGrad', ARRAY['#TibbyTigers', '#KinderGrad', '#ProudSchool'], (SELECT id FROM schools WHERE slug='tibby-elementary'), true, 234, 56, '{"heart": 134, "fire": 45, "clap": 55}'::jsonb, NOW() - INTERVAL '1 day');

-- Dickison Elementary
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous, created_at, updated_at)
VALUES ('b2000001-0031-4000-8000-000000000031', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'dickison.elementary@hubcity.app', crypt('HubCity2026!School', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{"display_name":"Dickison Elementary"}'::jsonb, false, false, NOW(), NOW()) ON CONFLICT (id) DO NOTHING;
INSERT INTO profiles (id, display_name, handle, avatar_url, bio, role, verification_status, city, state, zip)
VALUES ('b2000001-0031-4000-8000-000000000031', 'Dickison Elementary', 'dickison_elementary',
  'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=200&h=200&fit=crop',
  'Official Dickison Elementary — Diving Into Learning! 🐬 Where Dolphins swim toward success every day. #DickisonDolphins',
  'city_official', 'verified', 'Compton', 'CA', '90220')
ON CONFLICT (id) DO UPDATE SET display_name=EXCLUDED.display_name, handle=EXCLUDED.handle, bio=EXCLUDED.bio, role=EXCLUDED.role, verification_status=EXCLUDED.verification_status;
INSERT INTO channels (id, name, slug, description, type, avatar_url, owner_id, is_verified, is_active, follower_count)
VALUES ('c3000002-0031-4000-8000-000000000031', 'Dickison Elementary', 'dickison-elementary', 'Official Dickison Elementary channel — Dolphins! School updates and student highlights.', 'school', 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=200&h=200&fit=crop', 'b2000001-0031-4000-8000-000000000031', true, true, 389)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO school_admins (school_id, user_id, role, title) VALUES ((SELECT id FROM schools WHERE slug='dickison-elementary'), 'b2000001-0031-4000-8000-000000000031', 'admin', 'School Account') ON CONFLICT (school_id, user_id) DO NOTHING;
INSERT INTO posts (author_id, body, hashtags, school_id, is_published, like_count, comment_count, reaction_counts, created_at) VALUES
('b2000001-0031-4000-8000-000000000031', '📚 Dickison Dolphins reading challenge complete! Our 3rd graders read 5,000 books this month! Special shoutout to Mrs. Johnson''s class who read 800 books alone. Reading champions! 🐬📖', ARRAY['#DickisonDolphins', '#ReadingChallenge', '#Literacy'], (SELECT id FROM schools WHERE slug='dickison-elementary'), true, 145, 28, '{"heart": 78, "fire": 34, "clap": 33}'::jsonb, NOW() - INTERVAL '7 hours'),
('b2000001-0031-4000-8000-000000000031', 'Family Math Night was a blast! 🧮 Parents and students solved puzzles, played math games, and won prizes together. Education is a family affair at Dickison! #DolphinsMath', ARRAY['#DickisonDolphins', '#DolphinsMath', '#FamilyNight'], (SELECT id FROM schools WHERE slug='dickison-elementary'), true, 112, 19, '{"heart": 56, "fire": 28, "clap": 28}'::jsonb, NOW() - INTERVAL '3 days');

-- Anderson Elementary
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous, created_at, updated_at)
VALUES ('b2000001-0032-4000-8000-000000000032', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'anderson.elementary@hubcity.app', crypt('HubCity2026!School', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{"display_name":"Anderson Elementary"}'::jsonb, false, false, NOW(), NOW()) ON CONFLICT (id) DO NOTHING;
INSERT INTO profiles (id, display_name, handle, avatar_url, bio, role, verification_status, city, state, zip)
VALUES ('b2000001-0032-4000-8000-000000000032', 'Anderson Elementary', 'anderson_elementary',
  'https://images.unsplash.com/photo-1580894894513-541e068a3e2b?w=200&h=200&fit=crop',
  'Official Anderson Elementary — Eagles Soar High! 🦅 Building confident learners and community leaders. #AndersonEagles',
  'city_official', 'verified', 'Compton', 'CA', '90221')
ON CONFLICT (id) DO UPDATE SET display_name=EXCLUDED.display_name, handle=EXCLUDED.handle, bio=EXCLUDED.bio, role=EXCLUDED.role, verification_status=EXCLUDED.verification_status;
INSERT INTO channels (id, name, slug, description, type, avatar_url, owner_id, is_verified, is_active, follower_count)
VALUES ('c3000002-0032-4000-8000-000000000032', 'Anderson Elementary', 'anderson-elementary', 'Official Anderson Elementary channel — Eagles! Parent updates, events, and student spotlights.', 'school', 'https://images.unsplash.com/photo-1580894894513-541e068a3e2b?w=200&h=200&fit=crop', 'b2000001-0032-4000-8000-000000000032', true, true, 356)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO school_admins (school_id, user_id, role, title) VALUES ((SELECT id FROM schools WHERE slug='anderson-elementary'), 'b2000001-0032-4000-8000-000000000032', 'admin', 'School Account') ON CONFLICT (school_id, user_id) DO NOTHING;
INSERT INTO posts (author_id, body, hashtags, school_id, is_published, like_count, comment_count, reaction_counts, created_at) VALUES
('b2000001-0032-4000-8000-000000000032', '🦅 Anderson Eagles had their annual Talent Show today! Dancing, singing, poetry, and even a magic act. These kids are TALENTED. Video highlights coming to our channel soon! #AndersonEagles #TalentShow', ARRAY['#AndersonEagles', '#TalentShow', '#ComptonKids'], (SELECT id FROM schools WHERE slug='anderson-elementary'), true, 167, 35, '{"heart": 78, "fire": 45, "clap": 44}'::jsonb, NOW() - INTERVAL '4 hours');

-- Emerson Elementary
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous, created_at, updated_at)
VALUES ('b2000001-0033-4000-8000-000000000033', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'emerson.elementary@hubcity.app', crypt('HubCity2026!School', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{"display_name":"Emerson Elementary"}'::jsonb, false, false, NOW(), NOW()) ON CONFLICT (id) DO NOTHING;
INSERT INTO profiles (id, display_name, handle, avatar_url, bio, role, verification_status, city, state, zip)
VALUES ('b2000001-0033-4000-8000-000000000033', 'Emerson Elementary', 'emerson_elementary',
  'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=200&h=200&fit=crop',
  'Official Emerson Elementary — Every Child a Star! ⭐ Where curiosity meets excellence. Compton Unified. #EmersonStars',
  'city_official', 'verified', 'Compton', 'CA', '90221')
ON CONFLICT (id) DO UPDATE SET display_name=EXCLUDED.display_name, handle=EXCLUDED.handle, bio=EXCLUDED.bio, role=EXCLUDED.role, verification_status=EXCLUDED.verification_status;
INSERT INTO channels (id, name, slug, description, type, avatar_url, owner_id, is_verified, is_active, follower_count)
VALUES ('c3000002-0033-4000-8000-000000000033', 'Emerson Elementary', 'emerson-elementary', 'Official Emerson Elementary channel — Stars! School events and learning updates.', 'school', 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=200&h=200&fit=crop', 'b2000001-0033-4000-8000-000000000033', true, true, 298)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO school_admins (school_id, user_id, role, title) VALUES ((SELECT id FROM schools WHERE slug='emerson-elementary'), 'b2000001-0033-4000-8000-000000000033', 'admin', 'School Account') ON CONFLICT (school_id, user_id) DO NOTHING;
INSERT INTO posts (author_id, body, hashtags, school_id, is_published, like_count, comment_count, reaction_counts, created_at) VALUES
('b2000001-0033-4000-8000-000000000033', '⭐ Emerson Stars Math Olympiad team placed 2nd in the district! These 5th graders solved problems that would stump most adults. So proud of our mathletes! #EmersonStars #MathOlympiad', ARRAY['#EmersonStars', '#MathOlympiad', '#SmartKids'], (SELECT id FROM schools WHERE slug='emerson-elementary'), true, 134, 23, '{"heart": 56, "fire": 42, "clap": 36}'::jsonb, NOW() - INTERVAL '6 hours');

-- Washington Elementary
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous, created_at, updated_at)
VALUES ('b2000001-0034-4000-8000-000000000034', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'washington.elementary@hubcity.app', crypt('HubCity2026!School', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{"display_name":"Washington Elementary"}'::jsonb, false, false, NOW(), NOW()) ON CONFLICT (id) DO NOTHING;
INSERT INTO profiles (id, display_name, handle, avatar_url, bio, role, verification_status, city, state, zip)
VALUES ('b2000001-0034-4000-8000-000000000034', 'Washington Elementary', 'washington_elementary',
  'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=200&h=200&fit=crop',
  'Official Washington Elementary — Where Lions Learn to Lead! 🦁 Building leaders one lesson at a time. #WashingtonLions',
  'city_official', 'verified', 'Compton', 'CA', '90220')
ON CONFLICT (id) DO UPDATE SET display_name=EXCLUDED.display_name, handle=EXCLUDED.handle, bio=EXCLUDED.bio, role=EXCLUDED.role, verification_status=EXCLUDED.verification_status;
INSERT INTO channels (id, name, slug, description, type, avatar_url, owner_id, is_verified, is_active, follower_count)
VALUES ('c3000002-0034-4000-8000-000000000034', 'Washington Elementary', 'washington-elementary', 'Official Washington Elementary channel — Lions! Parent news, events, and student celebrations.', 'school', 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=200&h=200&fit=crop', 'b2000001-0034-4000-8000-000000000034', true, true, 312)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO school_admins (school_id, user_id, role, title) VALUES ((SELECT id FROM schools WHERE slug='washington-elementary'), 'b2000001-0034-4000-8000-000000000034', 'admin', 'School Account') ON CONFLICT (school_id, user_id) DO NOTHING;
INSERT INTO posts (author_id, body, hashtags, school_id, is_published, like_count, comment_count, reaction_counts, created_at) VALUES
('b2000001-0034-4000-8000-000000000034', '🦁 Washington Lions had their spring garden harvest! 🥕🥬 Students grew carrots, lettuce, and strawberries. Every class got to take some home. Farm-to-table starts in kindergarten! #WashingtonLions #SchoolGarden', ARRAY['#WashingtonLions', '#SchoolGarden', '#GrowYourOwn'], (SELECT id FROM schools WHERE slug='washington-elementary'), true, 178, 34, '{"heart": 89, "fire": 45, "clap": 44}'::jsonb, NOW() - INTERVAL '3 hours');

-- McKinley Elementary
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous, created_at, updated_at)
VALUES ('b2000001-0035-4000-8000-000000000035', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'mckinley.elementary@hubcity.app', crypt('HubCity2026!School', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{"display_name":"McKinley Elementary"}'::jsonb, false, false, NOW(), NOW()) ON CONFLICT (id) DO NOTHING;
INSERT INTO profiles (id, display_name, handle, avatar_url, bio, role, verification_status, city, state, zip)
VALUES ('b2000001-0035-4000-8000-000000000035', 'McKinley Elementary', 'mckinley_elementary',
  'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=200&h=200&fit=crop',
  'Official McKinley Elementary — Mustangs Gallop Toward Success! 🐴 Strong readers, strong thinkers, strong community. #McKinleyMustangs',
  'city_official', 'verified', 'Compton', 'CA', '90220')
ON CONFLICT (id) DO UPDATE SET display_name=EXCLUDED.display_name, handle=EXCLUDED.handle, bio=EXCLUDED.bio, role=EXCLUDED.role, verification_status=EXCLUDED.verification_status;
INSERT INTO channels (id, name, slug, description, type, avatar_url, owner_id, is_verified, is_active, follower_count)
VALUES ('c3000002-0035-4000-8000-000000000035', 'McKinley Elementary', 'mckinley-elementary', 'Official McKinley Elementary channel — Mustangs! School updates, events, and learning fun.', 'school', 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=200&h=200&fit=crop', 'b2000001-0035-4000-8000-000000000035', true, true, 267)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO school_admins (school_id, user_id, role, title) VALUES ((SELECT id FROM schools WHERE slug='mckinley-elementary'), 'b2000001-0035-4000-8000-000000000035', 'admin', 'School Account') ON CONFLICT (school_id, user_id) DO NOTHING;
INSERT INTO posts (author_id, body, hashtags, school_id, is_published, like_count, comment_count, reaction_counts, created_at) VALUES
('b2000001-0035-4000-8000-000000000035', '🐴 McKinley Mustangs book fair raised $2,300 for new classroom libraries! Every kid got to pick a free book to take home. Reading changes lives, and our community showed UP. Thank you! #McKinleyMustangs #BookFair', ARRAY['#McKinleyMustangs', '#BookFair', '#ReadingMatters'], (SELECT id FROM schools WHERE slug='mckinley-elementary'), true, 156, 28, '{"heart": 78, "fire": 34, "clap": 44}'::jsonb, NOW() - INTERVAL '8 hours');

-- Bursch Elementary
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous, created_at, updated_at)
VALUES ('b2000001-0036-4000-8000-000000000036', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'bursch.elementary@hubcity.app', crypt('HubCity2026!School', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{"display_name":"Bursch Elementary"}'::jsonb, false, false, NOW(), NOW()) ON CONFLICT (id) DO NOTHING;
INSERT INTO profiles (id, display_name, handle, avatar_url, bio, role, verification_status, city, state, zip)
VALUES ('b2000001-0036-4000-8000-000000000036', 'Bursch Elementary', 'bursch_elementary',
  'https://images.unsplash.com/photo-1588072432836-e10032774350?w=200&h=200&fit=crop',
  'Official Bursch Elementary — Bobcats Building Bright Futures! 🐱 STEAM-focused learning in Compton. #BurschBobcats',
  'city_official', 'verified', 'Compton', 'CA', '90221')
ON CONFLICT (id) DO UPDATE SET display_name=EXCLUDED.display_name, handle=EXCLUDED.handle, bio=EXCLUDED.bio, role=EXCLUDED.role, verification_status=EXCLUDED.verification_status;
INSERT INTO channels (id, name, slug, description, type, avatar_url, owner_id, is_verified, is_active, follower_count)
VALUES ('c3000002-0036-4000-8000-000000000036', 'Bursch Elementary', 'bursch-elementary', 'Official Bursch Elementary channel — Bobcats! STEAM projects, school events, and parent resources.', 'school', 'https://images.unsplash.com/photo-1588072432836-e10032774350?w=200&h=200&fit=crop', 'b2000001-0036-4000-8000-000000000036', true, true, 234)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO school_admins (school_id, user_id, role, title) VALUES ((SELECT id FROM schools WHERE slug='bursch-elementary'), 'b2000001-0036-4000-8000-000000000036', 'admin', 'School Account') ON CONFLICT (school_id, user_id) DO NOTHING;
INSERT INTO posts (author_id, body, hashtags, school_id, is_published, like_count, comment_count, reaction_counts, created_at) VALUES
('b2000001-0036-4000-8000-000000000036', '🔬 Bursch Bobcats STEAM Fair was incredible! 2nd graders built bridges from popsicle sticks that held 15+ pounds. 4th graders coded robots to navigate mazes. Innovation starts YOUNG! #BurschBobcats #STEAM', ARRAY['#BurschBobcats', '#STEAM', '#YoungInnovators'], (SELECT id FROM schools WHERE slug='bursch-elementary'), true, 145, 26, '{"heart": 67, "fire": 45, "clap": 33}'::jsonb, NOW() - INTERVAL '5 hours');

-- Mayo Elementary
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous, created_at, updated_at)
VALUES ('b2000001-0037-4000-8000-000000000037', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'mayo.elementary@hubcity.app', crypt('HubCity2026!School', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{"display_name":"Mayo Elementary"}'::jsonb, false, false, NOW(), NOW()) ON CONFLICT (id) DO NOTHING;
INSERT INTO profiles (id, display_name, handle, avatar_url, bio, role, verification_status, city, state, zip)
VALUES ('b2000001-0037-4000-8000-000000000037', 'Mayo Elementary', 'mayo_elementary',
  'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=200&h=200&fit=crop',
  'Official Mayo Elementary — Hawks Take Flight! 🦅 Lifting every student to new heights. Compton Unified. #MayoHawks',
  'city_official', 'verified', 'Compton', 'CA', '90220')
ON CONFLICT (id) DO UPDATE SET display_name=EXCLUDED.display_name, handle=EXCLUDED.handle, bio=EXCLUDED.bio, role=EXCLUDED.role, verification_status=EXCLUDED.verification_status;
INSERT INTO channels (id, name, slug, description, type, avatar_url, owner_id, is_verified, is_active, follower_count)
VALUES ('c3000002-0037-4000-8000-000000000037', 'Mayo Elementary', 'mayo-elementary', 'Official Mayo Elementary channel — Hawks! Campus highlights and parent news.', 'school', 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=200&h=200&fit=crop', 'b2000001-0037-4000-8000-000000000037', true, true, 245)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO school_admins (school_id, user_id, role, title) VALUES ((SELECT id FROM schools WHERE slug='mayo-elementary'), 'b2000001-0037-4000-8000-000000000037', 'admin', 'School Account') ON CONFLICT (school_id, user_id) DO NOTHING;
INSERT INTO posts (author_id, body, hashtags, school_id, is_published, like_count, comment_count, reaction_counts, created_at) VALUES
('b2000001-0037-4000-8000-000000000037', '🦅 Mayo Hawks Field Day was SO much fun! Relay races, sack races, tug-of-war, and a water balloon toss. Smiles everywhere. These memories last forever! 💛 #MayoHawks #FieldDay', ARRAY['#MayoHawks', '#FieldDay', '#SchoolFun'], (SELECT id FROM schools WHERE slug='mayo-elementary'), true, 189, 38, '{"heart": 98, "fire": 45, "clap": 46}'::jsonb, NOW() - INTERVAL '6 hours');

-- Kelly Elementary
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous, created_at, updated_at)
VALUES ('b2000001-0038-4000-8000-000000000038', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'kelly.elementary@hubcity.app', crypt('HubCity2026!School', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{"display_name":"Kelly Elementary"}'::jsonb, false, false, NOW(), NOW()) ON CONFLICT (id) DO NOTHING;
INSERT INTO profiles (id, display_name, handle, avatar_url, bio, role, verification_status, city, state, zip)
VALUES ('b2000001-0038-4000-8000-000000000038', 'Kelly Elementary', 'kelly_elementary',
  'https://images.unsplash.com/photo-1580894894513-541e068a3e2b?w=200&h=200&fit=crop',
  'Official Kelly Elementary — Little Knights, Big Hearts! 🛡️ Character, kindness, and curiosity every day. #KellyKnights',
  'city_official', 'verified', 'Compton', 'CA', '90220')
ON CONFLICT (id) DO UPDATE SET display_name=EXCLUDED.display_name, handle=EXCLUDED.handle, bio=EXCLUDED.bio, role=EXCLUDED.role, verification_status=EXCLUDED.verification_status;
INSERT INTO channels (id, name, slug, description, type, avatar_url, owner_id, is_verified, is_active, follower_count)
VALUES ('c3000002-0038-4000-8000-000000000038', 'Kelly Elementary', 'kelly-elementary', 'Official Kelly Elementary channel — Knights! School life, events, and student stories.', 'school', 'https://images.unsplash.com/photo-1580894894513-541e068a3e2b?w=200&h=200&fit=crop', 'b2000001-0038-4000-8000-000000000038', true, true, 278)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO school_admins (school_id, user_id, role, title) VALUES ((SELECT id FROM schools WHERE slug='kelly-elementary'), 'b2000001-0038-4000-8000-000000000038', 'admin', 'School Account') ON CONFLICT (school_id, user_id) DO NOTHING;
INSERT INTO posts (author_id, body, hashtags, school_id, is_published, like_count, comment_count, reaction_counts, created_at) VALUES
('b2000001-0038-4000-8000-000000000038', '🛡️ Kelly Knights kindness week! Students wrote 500+ thank-you notes to community helpers — firefighters, crossing guards, lunch staff, and janitors. Big hearts live here! ❤️ #KellyKnights #KindnessWeek', ARRAY['#KellyKnights', '#KindnessWeek', '#BigHearts'], (SELECT id FROM schools WHERE slug='kelly-elementary'), true, 212, 45, '{"heart": 112, "fire": 45, "clap": 55}'::jsonb, NOW() - INTERVAL '4 hours');

-- Jefferson Elementary
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous, created_at, updated_at)
VALUES ('b2000001-0039-4000-8000-000000000039', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'jefferson.elementary@hubcity.app', crypt('HubCity2026!School', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{"display_name":"Jefferson Elementary"}'::jsonb, false, false, NOW(), NOW()) ON CONFLICT (id) DO NOTHING;
INSERT INTO profiles (id, display_name, handle, avatar_url, bio, role, verification_status, city, state, zip)
VALUES ('b2000001-0039-4000-8000-000000000039', 'Jefferson Elementary', 'jefferson_elementary',
  'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=200&h=200&fit=crop',
  'Official Jefferson Elementary — Jaguars on the Prowl for Knowledge! 🐆 Excellence and exploration every day. #JeffersonJaguars',
  'city_official', 'verified', 'Compton', 'CA', '90220')
ON CONFLICT (id) DO UPDATE SET display_name=EXCLUDED.display_name, handle=EXCLUDED.handle, bio=EXCLUDED.bio, role=EXCLUDED.role, verification_status=EXCLUDED.verification_status;
INSERT INTO channels (id, name, slug, description, type, avatar_url, owner_id, is_verified, is_active, follower_count)
VALUES ('c3000002-0039-4000-8000-000000000039', 'Jefferson Elementary', 'jefferson-elementary', 'Official Jefferson Elementary channel — Jaguars! Academics, events, and school community.', 'school', 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=200&h=200&fit=crop', 'b2000001-0039-4000-8000-000000000039', true, true, 256)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO school_admins (school_id, user_id, role, title) VALUES ((SELECT id FROM schools WHERE slug='jefferson-elementary'), 'b2000001-0039-4000-8000-000000000039', 'admin', 'School Account') ON CONFLICT (school_id, user_id) DO NOTHING;
INSERT INTO posts (author_id, body, hashtags, school_id, is_published, like_count, comment_count, reaction_counts, created_at) VALUES
('b2000001-0039-4000-8000-000000000039', '🐆 Jefferson Jaguars Cultural Heritage Day was beautiful! Students shared food, music, and stories from their families'' cultures. We celebrated Mexico, Nigeria, El Salvador, the Philippines, and more. Diversity is our strength! 🌎', ARRAY['#JeffersonJaguars', '#CulturalHeritage', '#Diversity'], (SELECT id FROM schools WHERE slug='jefferson-elementary'), true, 198, 42, '{"heart": 98, "fire": 48, "clap": 52}'::jsonb, NOW() - INTERVAL '7 hours');
