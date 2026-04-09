-- ============================================================
-- 045: Seed CUSD (Compton Unified School District) Tracker Data
-- Populates auth users, profiles, civic_officials, flags,
-- board actions, and accountability vectors for school board.
-- ============================================================

-- ============================================================
-- AUTH USERS — 7 Trustees + 1 Superintendent
-- ============================================================

-- Trustee 1: Denzell Perry (Area A)
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous, created_at, updated_at)
VALUES (
  'b2000001-0001-4000-8000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'trustee.perry@hubcity.app',
  crypt('HubCity2026!School', gen_salt('bf')),
  NOW(), '{"provider":"email","providers":["email"]}'::jsonb,
  '{"display_name":"Denzell Perry"}'::jsonb,
  false, false, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- Trustee 2: Dr. Ayanna E. Davis (Area B)
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous, created_at, updated_at)
VALUES (
  'b2000001-0002-4000-8000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'trustee.davis@hubcity.app',
  crypt('HubCity2026!School', gen_salt('bf')),
  NOW(), '{"provider":"email","providers":["email"]}'::jsonb,
  '{"display_name":"Dr. Ayanna E. Davis"}'::jsonb,
  false, false, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- Trustee 3: Micah Ali (Area C)
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous, created_at, updated_at)
VALUES (
  'b2000001-0003-4000-8000-000000000003',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'trustee.ali@hubcity.app',
  crypt('HubCity2026!School', gen_salt('bf')),
  NOW(), '{"provider":"email","providers":["email"]}'::jsonb,
  '{"display_name":"Micah Ali"}'::jsonb,
  false, false, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- Trustee 4: Michael Hooper (Area D)
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous, created_at, updated_at)
VALUES (
  'b2000001-0004-4000-8000-000000000004',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'trustee.hooper@hubcity.app',
  crypt('HubCity2026!School', gen_salt('bf')),
  NOW(), '{"provider":"email","providers":["email"]}'::jsonb,
  '{"display_name":"Michael Hooper"}'::jsonb,
  false, false, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- Trustee 5: Alma Taylor-Pleasant (Area E)
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous, created_at, updated_at)
VALUES (
  'b2000001-0005-4000-8000-000000000005',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'trustee.taylor@hubcity.app',
  crypt('HubCity2026!School', gen_salt('bf')),
  NOW(), '{"provider":"email","providers":["email"]}'::jsonb,
  '{"display_name":"Alma Taylor-Pleasant"}'::jsonb,
  false, false, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- Trustee 6: Sandra Moss (Area F)
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous, created_at, updated_at)
VALUES (
  'b2000001-0006-4000-8000-000000000006',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'trustee.moss@hubcity.app',
  crypt('HubCity2026!School', gen_salt('bf')),
  NOW(), '{"provider":"email","providers":["email"]}'::jsonb,
  '{"display_name":"Sandra Moss"}'::jsonb,
  false, false, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- Trustee 7: Satra D. Zurita (Area G)
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous, created_at, updated_at)
VALUES (
  'b2000001-0007-4000-8000-000000000007',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'trustee.zurita@hubcity.app',
  crypt('HubCity2026!School', gen_salt('bf')),
  NOW(), '{"provider":"email","providers":["email"]}'::jsonb,
  '{"display_name":"Satra D. Zurita"}'::jsonb,
  false, false, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- Superintendent: Dr. Darin Brawley
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous, created_at, updated_at)
VALUES (
  'b2000001-0008-4000-8000-000000000008',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'superintendent.brawley@hubcity.app',
  crypt('HubCity2026!School', gen_salt('bf')),
  NOW(), '{"provider":"email","providers":["email"]}'::jsonb,
  '{"display_name":"Dr. Darin Brawley"}'::jsonb,
  false, false, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- PROFILES — 7 Trustees + 1 Superintendent
-- ============================================================

INSERT INTO profiles (id, display_name, handle, avatar_url, bio, role, district, verification_status, city, state, zip, created_at)
VALUES (
  'b2000001-0001-4000-8000-000000000001',
  'Denzell Perry',
  'trustee_perry',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
  'CUSD Trustee, Area A. Compton native. Head of HR for H&M West Coast. First-gen college grad. Former Board President 2023-24.',
  'school_trustee', NULL, 'verified', 'Compton', 'CA', '90220', NOW()
) ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  handle = EXCLUDED.handle,
  bio = EXCLUDED.bio,
  role = EXCLUDED.role,
  verification_status = EXCLUDED.verification_status;

INSERT INTO profiles (id, display_name, handle, avatar_url, bio, role, district, verification_status, city, state, zip, created_at)
VALUES (
  'b2000001-0002-4000-8000-000000000002',
  'Dr. Ayanna E. Davis',
  'trustee_davis',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face',
  'CUSD Trustee, Area B. Ed.D. from USC Rossier. 27 years in education. CA Democratic Party Delegate for 64th Assembly District.',
  'school_trustee', NULL, 'verified', 'Compton', 'CA', '90221', NOW()
) ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  handle = EXCLUDED.handle,
  bio = EXCLUDED.bio,
  role = EXCLUDED.role,
  verification_status = EXCLUDED.verification_status;

INSERT INTO profiles (id, display_name, handle, avatar_url, bio, role, district, verification_status, city, state, zip, created_at)
VALUES (
  'b2000001-0003-4000-8000-000000000003',
  'Micah Ali',
  'trustee_ali',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face',
  'CUSD Board President, Area C. Longest-serving President in CUSD history. MA in Education from Loyola Marymount. Led district turnaround from state receivership.',
  'school_trustee', NULL, 'verified', 'Compton', 'CA', '90221', NOW()
) ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  handle = EXCLUDED.handle,
  bio = EXCLUDED.bio,
  role = EXCLUDED.role,
  verification_status = EXCLUDED.verification_status;

INSERT INTO profiles (id, display_name, handle, avatar_url, bio, role, district, verification_status, city, state, zip, created_at)
VALUES (
  'b2000001-0004-4000-8000-000000000004',
  'Michael Hooper',
  'trustee_hooper',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
  'CUSD Vice President, Area D. LA County Social Worker. MSW from Cal State Long Beach. Former PepsiCo Key Account Manager. Former foster youth.',
  'school_trustee', NULL, 'verified', 'Compton', 'CA', '90221', NOW()
) ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  handle = EXCLUDED.handle,
  bio = EXCLUDED.bio,
  role = EXCLUDED.role,
  verification_status = EXCLUDED.verification_status;

INSERT INTO profiles (id, display_name, handle, avatar_url, bio, role, district, verification_status, city, state, zip, created_at)
VALUES (
  'b2000001-0005-4000-8000-000000000005',
  'Alma Taylor-Pleasant',
  'trustee_taylor',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face',
  'CUSD Trustee, Area E. Compton native. 36 years with City of Compton recreation services. Creator of Cooking with Alma program.',
  'school_trustee', NULL, 'verified', 'Compton', 'CA', '90222', NOW()
) ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  handle = EXCLUDED.handle,
  bio = EXCLUDED.bio,
  role = EXCLUDED.role,
  verification_status = EXCLUDED.verification_status;

INSERT INTO profiles (id, display_name, handle, avatar_url, bio, role, district, verification_status, city, state, zip, created_at)
VALUES (
  'b2000001-0006-4000-8000-000000000006',
  'Sandra Moss',
  'trustee_moss',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face',
  'CUSD Trustee, Area F. MPA from National University. 22+ years with LA County Probation Dept. Founded Rites of Passage mentoring program.',
  'school_trustee', NULL, 'verified', 'Compton', 'CA', '90222', NOW()
) ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  handle = EXCLUDED.handle,
  bio = EXCLUDED.bio,
  role = EXCLUDED.role,
  verification_status = EXCLUDED.verification_status;

INSERT INTO profiles (id, display_name, handle, avatar_url, bio, role, district, verification_status, city, state, zip, created_at)
VALUES (
  'b2000001-0007-4000-8000-000000000007',
  'Satra D. Zurita',
  'trustee_zurita',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face',
  'CUSD Clerk of the Board, Area G. Third-generation Compton resident. Compton High alumna. Also serves as Compton City Clerk.',
  'school_trustee', NULL, 'verified', 'Compton', 'CA', '90222', NOW()
) ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  handle = EXCLUDED.handle,
  bio = EXCLUDED.bio,
  role = EXCLUDED.role,
  verification_status = EXCLUDED.verification_status;

INSERT INTO profiles (id, display_name, handle, avatar_url, bio, role, district, verification_status, city, state, zip, created_at)
VALUES (
  'b2000001-0008-4000-8000-000000000008',
  'Dr. Darin Brawley',
  'superintendent_brawley',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
  'Superintendent of Compton Unified School District since 2012. Led dramatic turnaround including two National Blue Ribbon schools and multiple CA Distinguished School awards.',
  'city_official', NULL, 'verified', 'Compton', 'CA', '90221', NOW()
) ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  handle = EXCLUDED.handle,
  bio = EXCLUDED.bio,
  role = EXCLUDED.role,
  verification_status = EXCLUDED.verification_status;

-- ============================================================
-- CIVIC OFFICIALS — 7 Trustees + 1 Superintendent
-- ============================================================

-- Denzell Perry — Area A
INSERT INTO civic_officials (id, profile_id, official_type, name, title, trustee_area, party, in_office_since, term_expires, is_voting_member, photo_url, background, geography, communities, schools)
VALUES (
  'd3000001-0001-4000-8000-000000000001',
  'b2000001-0001-4000-8000-000000000001',
  'school_trustee',
  'Denzell Perry',
  'LA County School Trustees Rep',
  'A',
  'Non-Partisan',
  '2022',
  '2026',
  true,
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
  'Compton native. Attended Lincoln Magnet Elem, Enterprise MS, Dominguez HS. Head of HR for H&M West Coast. First-gen college grad from Menlo College. Honored by President Obama for community service. PhD candidate in HR Management. Former Board President 2023-24. Defeated LaQuisha Anderson and Adrian Cleveland in 2022.',
  'Western Compton / Dominguez HS zone',
  ARRAY['West Compton neighborhoods near Dominguez High attendance area'],
  ARRAY['Dominguez High School', 'Dickison Elementary', 'Kennedy Elementary', 'Laurel Elementary', 'Davis Middle School']
) ON CONFLICT (id) DO NOTHING;

-- Dr. Ayanna E. Davis — Area B
INSERT INTO civic_officials (id, profile_id, official_type, name, title, trustee_area, party, in_office_since, term_expires, is_voting_member, photo_url, background, geography, communities, schools)
VALUES (
  'd3000001-0002-4000-8000-000000000002',
  'b2000001-0002-4000-8000-000000000002',
  'school_trustee',
  'Dr. Ayanna E. Davis',
  'Legislative Representative',
  'B',
  'Non-Partisan',
  '2022',
  '2026',
  true,
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face',
  'Lifelong Compton resident. Ed.D. from USC Rossier School of Education. 27 years in education. Vice President of SoCal chapter, CA Association for Education of Young Children. CA Democratic Party Delegate for 64th Assembly District. Won uncontested in 2022.',
  'North Compton / Willowbrook border',
  ARRAY['Compton', 'Willowbrook', 'Watts-adjacent communities'],
  ARRAY['Willowbrook Middle School', 'Carver Elementary', 'McNair Elementary', 'Tibby Elementary', 'Whaley Middle School']
) ON CONFLICT (id) DO NOTHING;

-- Micah Ali — Area C (Board President)
INSERT INTO civic_officials (id, profile_id, official_type, name, title, trustee_area, party, in_office_since, term_expires, is_voting_member, photo_url, background, geography, communities, schools)
VALUES (
  'd3000001-0003-4000-8000-000000000003',
  'b2000001-0003-4000-8000-000000000003',
  'board_president',
  'Micah Ali',
  'Board President',
  'C',
  'Non-Partisan',
  '18+ years (longest-serving President in CUSD history)',
  '2028',
  true,
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face',
  'Born and raised in Compton. MA in Education from Loyola Marymount. Led district turnaround from state receivership. NSBA CUBE Chair. Founded CA Association of Black School Educators.',
  'Central-East Compton',
  ARRAY['Central Compton residential neighborhoods (90221)'],
  ARRAY['Compton High School', 'Compton Early College HS', 'Emerson Elementary', 'Roosevelt Elementary', 'Foster Elementary']
) ON CONFLICT (id) DO NOTHING;

-- Michael Hooper — Area D (Vice President)
INSERT INTO civic_officials (id, profile_id, official_type, name, title, trustee_area, party, in_office_since, term_expires, is_voting_member, photo_url, background, geography, communities, schools)
VALUES (
  'd3000001-0004-4000-8000-000000000004',
  'b2000001-0004-4000-8000-000000000004',
  'board_vp',
  'Michael Hooper',
  'Vice President',
  'D',
  'Non-Partisan',
  '2024',
  '2028',
  true,
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
  'Compton native, CUSD product. LA County Social Worker (child welfare). MSW from Cal State Long Beach. Former PepsiCo Key Account Manager (18 years). Former foster youth. Defeated incumbent Charles Davis in 2024.',
  'Central Compton',
  ARRAY['Central Compton (90221)', 'Alondra/Compton Blvd corridor'],
  ARRAY['Mayo Elementary', 'Clinton Elementary', 'Kelly Elementary', 'Chavez Continuation HS', 'CATI']
) ON CONFLICT (id) DO NOTHING;

-- Alma Taylor-Pleasant — Area E
INSERT INTO civic_officials (id, profile_id, official_type, name, title, trustee_area, party, in_office_since, term_expires, is_voting_member, photo_url, background, geography, communities, schools)
VALUES (
  'd3000001-0005-4000-8000-000000000005',
  'b2000001-0005-4000-8000-000000000005',
  'school_trustee',
  'Alma Taylor-Pleasant',
  'Member',
  'E',
  'Non-Partisan',
  'Long-serving (re-elected 2022)',
  '2026',
  true,
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face',
  'Compton native. 36 years with City of Compton — recreation activity specialist at Dollarhide Community Center. Created Cooking with Alma program.',
  'South-Central Compton / Dollarhide & Kelly Park area',
  ARRAY['South Compton', 'Kelly Park', 'Dollarhide neighborhoods', 'Carson border'],
  ARRAY['Centennial High School', 'Bursch Elementary', 'McKinley Elementary', 'Bunche Middle School', 'Bunche Elementary']
) ON CONFLICT (id) DO NOTHING;

-- Sandra Moss — Area F
INSERT INTO civic_officials (id, profile_id, official_type, name, title, trustee_area, party, in_office_since, term_expires, is_voting_member, photo_url, background, geography, communities, schools)
VALUES (
  'd3000001-0006-4000-8000-000000000006',
  'b2000001-0006-4000-8000-000000000006',
  'school_trustee',
  'Sandra Moss',
  'Member',
  'F',
  'Non-Partisan',
  '2020',
  '2028',
  true,
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face',
  '15-year Compton resident. MPA from National University. 22+ years with LA County Probation Dept. Founded Rites of Passage mentoring program. Won uncontested in 2024.',
  'East Compton (90222 zone)',
  ARRAY['East Compton residential neighborhoods'],
  ARRAY['Anderson Elementary', 'Jefferson Elementary', 'Longfellow Elementary', 'King Elementary', 'Rosecrans Elementary']
) ON CONFLICT (id) DO NOTHING;

-- Satra D. Zurita — Area G (Clerk of the Board)
INSERT INTO civic_officials (id, profile_id, official_type, name, title, trustee_area, party, in_office_since, term_expires, is_voting_member, photo_url, background, geography, communities, schools, dual_role)
VALUES (
  'd3000001-0007-4000-8000-000000000007',
  'b2000001-0007-4000-8000-000000000007',
  'board_clerk',
  'Satra D. Zurita',
  'Clerk of the Board',
  'G',
  'Non-Partisan',
  '~20 years (longest-serving Trustee)',
  'June 2026 UP FOR ELECTION',
  true,
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face',
  'Third-generation Compton resident. Compton High alumna. Board President (4 terms), Clerk (2 terms), VP (5 terms). Led effort to open Compton Early College HS.',
  'Widest area: Compton to North Carson + unincorporated communities',
  ARRAY['East Rancho Dominguez', 'Enterprise', 'Mona Park', 'Rosewood', 'Stevenson Village', 'West Rancho Dominguez', 'Willowbrook'],
  ARRAY['Enterprise Middle School', 'Washington Elementary', 'Compton Adult School', 'Compton Virtual Academy'],
  'Also: Compton City Clerk'
) ON CONFLICT (id) DO NOTHING;

-- Dr. Darin Brawley — Superintendent
INSERT INTO civic_officials (id, profile_id, official_type, name, title, trustee_area, party, in_office_since, is_voting_member, photo_url, background)
VALUES (
  'd3000001-0008-4000-8000-000000000008',
  'b2000001-0008-4000-8000-000000000008',
  'superintendent',
  'Dr. Darin Brawley',
  'Superintendent',
  NULL,
  'N/A — Administrative',
  '2012',
  false,
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
  'Led dramatic turnaround: two National Blue Ribbon schools, multiple CA Distinguished School awards, Title I recognition, pulled district from brink of state receivership.'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- OFFICIAL FLAGS — Zurita only
-- ============================================================

INSERT INTO official_flags (official_id, flag_type, title, description, severity) VALUES
  ('d3000001-0007-4000-8000-000000000007', 'dual_role',
   'DUAL ROLE: Also serves as Compton City Clerk',
   'Satra Zurita simultaneously serves as CUSD Clerk of the Board and Compton City Clerk. This dual role creates potential conflicts of interest between city government and school district governance.',
   'warning'),
  ('d3000001-0007-4000-8000-000000000007', 'info',
   'Facing challenger Lynne Boone for City Clerk seat in June 2026 election',
   NULL, 'info'),
  ('d3000001-0007-4000-8000-000000000007', 'info',
   'Sister Janna Zurita is a Compton City Councilwoman — family has deep political ties',
   NULL, 'info');

-- ============================================================
-- BOARD ACTIONS — 8 records
-- ============================================================

-- 1. Measure S
INSERT INTO board_actions (id, title, description, category, action_date, result, impact_level, outcome) VALUES
  ('ba000001-0001-4000-8000-000000000001',
   'Measure S — $350M School Facilities Bond',
   'Voter-approved bond measure to fund major school construction and modernization projects across CUSD.',
   'facilities_bond', '2015', 'approved', 'high',
   'Funded the $232M new Compton High School campus (opened 2025), including Dr. Dre''s $10M performing arts center.')
ON CONFLICT (id) DO NOTHING;

-- 2. Measure CC
INSERT INTO board_actions (id, title, description, category, action_date, result, impact_level, outcome) VALUES
  ('ba000001-0002-4000-8000-000000000002',
   'Measure CC — $200M School Improvements Bond',
   'Bond measure for continued school facility improvements and modernization across CUSD.',
   'facilities_bond', 'Nov 2024', 'approved', 'high',
   'Approved by voters. Levies $20 per $100,000 assessed valuation.')
ON CONFLICT (id) DO NOTHING;

-- 3. New Compton High School Ribbon Cutting
INSERT INTO board_actions (id, title, description, category, action_date, result, impact_level, outcome) VALUES
  ('ba000001-0003-4000-8000-000000000003',
   'New Compton High School Ribbon Cutting',
   'Official opening ceremony for the new $232M Compton High School campus, the flagship project of Measure S.',
   'facilities_bond', 'May 2025', 'informational', 'high',
   '1,800 students welcomed August 2025.')
ON CONFLICT (id) DO NOTHING;

-- 4. Electric School Bus Fleet
INSERT INTO board_actions (id, title, description, category, action_date, result, impact_level, outcome) VALUES
  ('ba000001-0004-4000-8000-000000000004',
   'Electric School Bus Fleet — EPA Clean School Bus Program',
   'District participation in the EPA Clean School Bus Program to transition fleet from diesel to electric buses.',
   'transportation', '2022-2025', 'approved', 'medium',
   'First 25 electric buses debuted March 2025 — 43% of the district''s 58-bus fleet.')
ON CONFLICT (id) DO NOTHING;

-- 5. LCAP Approval
INSERT INTO board_actions (id, title, description, category, action_date, result, impact_level, outcome) VALUES
  ('ba000001-0005-4000-8000-000000000005',
   'LCAP (Local Control Accountability Plan) Approval',
   'Annual approval of the district''s Local Control Accountability Plan, which guides spending priorities and student outcome goals.',
   'budget_academics', '2025-2026', 'approved', 'high',
   'Guides hundreds of millions in spending priorities for student outcomes.')
ON CONFLICT (id) DO NOTHING;

-- 6. Transition to By-District Elections
INSERT INTO board_actions (id, title, description, category, action_date, result, impact_level, outcome) VALUES
  ('ba000001-0006-4000-8000-000000000006',
   'Transition from At-Large to By-District Elections',
   'Board voted to change the trustee election system from at-large (citywide) to by-district (area-based) representation.',
   'governance', '2019', 'approved', 'high',
   'All 7 trustee seats now elected by district.')
ON CONFLICT (id) DO NOTHING;

-- 7. Board Officer Elections
INSERT INTO board_actions (id, title, description, category, action_date, result, impact_level, outcome) VALUES
  ('ba000001-0007-4000-8000-000000000007',
   '2025-2026 Board Officer Elections',
   'Annual election of board officers including President, Vice President, and Clerk.',
   'governance', 'Jul 2025', 'approved', 'low',
   'Continuation of established leadership.')
ON CONFLICT (id) DO NOTHING;

-- 8. CA Distinguished Schools
INSERT INTO board_actions (id, title, description, category, action_date, result, impact_level, outcome) VALUES
  ('ba000001-0008-4000-8000-000000000008',
   '5 CUSD Schools Named California Distinguished Schools',
   'Five CUSD schools received the prestigious California Distinguished Schools designation, recognizing academic excellence.',
   'academics', '2026', 'informational', 'medium',
   'Reflects district''s academic turnaround.')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- ACCOUNTABILITY VECTORS (School Board Scope)
-- ============================================================

INSERT INTO accountability_vectors (name, slug, description, icon, watch_for, applies_to, sort_order) VALUES
  ('Academic Performance', 'school-academic',
   'Student achievement trends, graduation rates, college readiness, and school recognition.',
   'book',
   ARRAY['CAASPP proficiency trends', 'Graduation rates', 'A-G completion rates', 'Dual enrollment rates', 'Distinguished School count'],
   ARRAY['school_trustee', 'board_president', 'board_vp', 'board_clerk', 'board_member', 'superintendent'], 10),
  ('Fiscal Stewardship', 'school-fiscal',
   'Bond spending accountability, budget alignment, audits, and administrative compensation.',
   'dollar-sign',
   ARRAY['Bond spending vs plan', 'LCAP expenditure alignment', 'Audit findings', 'Reserve levels', 'Admin compensation'],
   ARRAY['school_trustee', 'board_president', 'board_vp', 'board_clerk', 'board_member', 'superintendent'], 11),
  ('Facilities & Infrastructure', 'school-facilities',
   'School construction, modernization, transportation fleet, and maintenance.',
   'building',
   ARRAY['Compton High completion', 'Centennial High rebuild', 'Electric bus fleet', 'Deferred maintenance', 'Built by Compton metrics'],
   ARRAY['school_trustee', 'board_president', 'board_vp', 'board_clerk', 'board_member', 'superintendent'], 12),
  ('Equity & Access', 'school-equity',
   'Equitable resource distribution, special populations support, and access to opportunity.',
   'scale',
   ARRAY['LCFF fund spending', 'EL reclassification rates', 'Foster youth outcomes', 'Special ed compliance', 'Chronic absenteeism'],
   ARRAY['school_trustee', 'board_president', 'board_vp', 'board_clerk', 'board_member', 'superintendent'], 13),
  ('Community Engagement', 'school-community',
   'Parent and community input, advisory committees, and partnerships.',
   'users',
   ARRAY['LCAP input sessions', 'Parent advisory committees', 'Community partnerships', 'Public comment policies'],
   ARRAY['school_trustee', 'board_president', 'board_vp', 'board_clerk', 'board_member', 'superintendent'], 14),
  ('Governance & Transparency', 'school-governance',
   'Board operations, open meeting compliance, superintendent oversight, and trustee accountability.',
   'search',
   ARRAY['Zurita dual-role', 'BoardDocs accessibility', 'Brown Act compliance', 'Superintendent eval', 'Trustee attendance'],
   ARRAY['school_trustee', 'board_president', 'board_vp', 'board_clerk', 'board_member', 'superintendent'], 15)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- TRUSTEE AREA SCHOOLS MAPPING
-- ============================================================

-- Area A — Perry
INSERT INTO trustee_area_schools (trustee_area, school_name) VALUES
  ('A', 'Dominguez High School'),
  ('A', 'Dickison Elementary'),
  ('A', 'Kennedy Elementary'),
  ('A', 'Laurel Elementary'),
  ('A', 'Davis Middle School')
ON CONFLICT DO NOTHING;

-- Area B — Davis
INSERT INTO trustee_area_schools (trustee_area, school_name) VALUES
  ('B', 'Willowbrook Middle School'),
  ('B', 'Carver Elementary'),
  ('B', 'McNair Elementary'),
  ('B', 'Tibby Elementary'),
  ('B', 'Whaley Middle School')
ON CONFLICT DO NOTHING;

-- Area C — Ali
INSERT INTO trustee_area_schools (trustee_area, school_name) VALUES
  ('C', 'Compton High School'),
  ('C', 'Compton Early College HS'),
  ('C', 'Emerson Elementary'),
  ('C', 'Roosevelt Elementary'),
  ('C', 'Foster Elementary')
ON CONFLICT DO NOTHING;

-- Area D — Hooper
INSERT INTO trustee_area_schools (trustee_area, school_name) VALUES
  ('D', 'Mayo Elementary'),
  ('D', 'Clinton Elementary'),
  ('D', 'Kelly Elementary'),
  ('D', 'Chavez Continuation HS'),
  ('D', 'CATI')
ON CONFLICT DO NOTHING;

-- Area E — Taylor-Pleasant
INSERT INTO trustee_area_schools (trustee_area, school_name) VALUES
  ('E', 'Centennial High School'),
  ('E', 'Bursch Elementary'),
  ('E', 'McKinley Elementary'),
  ('E', 'Bunche Middle School'),
  ('E', 'Bunche Elementary')
ON CONFLICT DO NOTHING;

-- Area F — Moss
INSERT INTO trustee_area_schools (trustee_area, school_name) VALUES
  ('F', 'Anderson Elementary'),
  ('F', 'Jefferson Elementary'),
  ('F', 'Longfellow Elementary'),
  ('F', 'King Elementary'),
  ('F', 'Rosecrans Elementary')
ON CONFLICT DO NOTHING;

-- Area G — Zurita
INSERT INTO trustee_area_schools (trustee_area, school_name) VALUES
  ('G', 'Enterprise Middle School'),
  ('G', 'Washington Elementary'),
  ('G', 'Compton Adult School'),
  ('G', 'Compton Virtual Academy')
ON CONFLICT DO NOTHING;
