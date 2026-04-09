-- ============================================================
-- 044: Seed Council Tracker Data
-- Populates civic_officials, flags, votes, roll calls,
-- manager actions, and accountability vectors for city council.
-- ============================================================

-- ============================================================
-- CITY MANAGER — New auth user + profile
-- ============================================================
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous, created_at, updated_at)
VALUES (
  'a1000001-0006-4000-8000-000000000006',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'citymanager.hopkins@hubcity.app',
  crypt('HubCity2026!Admin', gen_salt('bf')),
  NOW(), '{"provider":"email","providers":["email"]}'::jsonb,
  '{"display_name":"Willie A. Hopkins"}'::jsonb,
  false, false, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, display_name, handle, avatar_url, bio, role, district, verification_status, city, state, zip, created_at)
VALUES (
  'a1000001-0006-4000-8000-000000000006',
  'Willie A. Hopkins',
  'citymanager_hopkins',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
  'City Manager of Compton. Appointed by City Council. Chief administrative officer responsible for day-to-day operations, budget oversight, and executing council decisions.',
  'city_official', NULL, 'verified', 'Compton', 'CA', '90220', NOW()
) ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  handle = EXCLUDED.handle,
  bio = EXCLUDED.bio,
  role = EXCLUDED.role,
  verification_status = EXCLUDED.verification_status;

-- ============================================================
-- CIVIC OFFICIALS — Council + City Manager
-- ============================================================

-- Mayor Emma Sharif
INSERT INTO civic_officials (id, profile_id, official_type, name, title, district, party, in_office_since, term_expires, running_for, is_voting_member, photo_url, background, metadata)
VALUES (
  'c0000001-0001-4000-8000-000000000001',
  'a1000001-0001-4000-8000-000000000001',
  'mayor',
  'Emma Sharif',
  'Mayor',
  NULL,
  'Non-Partisan (D-aligned)',
  '2022',
  '2026',
  'Mayor (2026)',
  true,
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face',
  'Mayor of the City of Compton. Serves all four districts citywide. Committed to transparency, economic development, and community empowerment.',
  '{"scope": "citywide"}'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- Deidre Duhart — District 1
INSERT INTO civic_officials (id, profile_id, official_type, name, title, district, party, in_office_since, term_expires, running_for, is_voting_member, photo_url, background)
VALUES (
  'c0000001-0002-4000-8000-000000000002',
  'a1000001-0002-4000-8000-000000000002',
  'council_member',
  'Deidre Duhart',
  'Councilmember',
  1,
  'Non-Partisan',
  'Appointed',
  NULL,
  'N/A',
  true,
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face',
  'Compton City Council Member representing District 1 (Northwest). Appointed to fill vacancy. Fighting for better infrastructure, public safety, and youth programs.'
) ON CONFLICT (id) DO NOTHING;

-- Andre Spicer — District 2
INSERT INTO civic_officials (id, profile_id, official_type, name, title, district, party, in_office_since, term_expires, running_for, is_voting_member, photo_url, background)
VALUES (
  'c0000001-0003-4000-8000-000000000003',
  'a1000001-0003-4000-8000-000000000003',
  'council_member',
  'Andre Spicer',
  'Councilmember',
  2,
  'Non-Partisan (D-aligned)',
  'Court-appointed (replaced Isaac Galvan)',
  '2026',
  'Mayor (2026)',
  true,
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face',
  'Compton City Council Member representing District 2 (Northeast). Court-appointed to replace Isaac Galvan. Running for Mayor in 2026.'
) ON CONFLICT (id) DO NOTHING;

-- Jonathan Bowers — District 3
INSERT INTO civic_officials (id, profile_id, official_type, name, title, district, party, in_office_since, term_expires, running_for, is_voting_member, photo_url, background)
VALUES (
  'c0000001-0004-4000-8000-000000000004',
  'a1000001-0004-4000-8000-000000000004',
  'council_member',
  'Jonathan Bowers',
  'Councilmember',
  3,
  'Non-Partisan',
  'Elected',
  '2026',
  'Re-election District 3 (2026)',
  true,
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
  'Compton City Council Member representing District 3 (Southeast). Elected to office. Championed city charter court case. Running for re-election in 2026.'
) ON CONFLICT (id) DO NOTHING;

-- Lillie Darden — District 4
INSERT INTO civic_officials (id, profile_id, official_type, name, title, district, party, in_office_since, term_expires, running_for, is_voting_member, photo_url, background)
VALUES (
  'c0000001-0005-4000-8000-000000000005',
  'a1000001-0005-4000-8000-000000000005',
  'council_member',
  'Lillie Darden',
  'Councilmember',
  4,
  'Non-Partisan',
  'Appointed',
  NULL,
  'N/A',
  true,
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face',
  'Compton City Council Member representing District 4 (Southwest). Appointed to fill vacancy.'
) ON CONFLICT (id) DO NOTHING;

-- Willie A. Hopkins — City Manager
INSERT INTO civic_officials (id, profile_id, official_type, name, title, district, party, in_office_since, running_for, is_voting_member, photo_url, background)
VALUES (
  'c0000001-0006-4000-8000-000000000006',
  'a1000001-0006-4000-8000-000000000006',
  'city_manager',
  'Willie A. Hopkins',
  'City Manager',
  NULL,
  'N/A — Administrative',
  'Appointed by Council',
  'N/A (not elected)',
  false,
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
  'City Manager of Compton. Appointed by City Council. The most powerful operational figure in city government. Controls the agenda, hires and fires department heads, manages all contracts, executes council decisions, and oversees the city budget.'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- OFFICIAL FLAGS
-- ============================================================

-- Mayor Sharif flags
INSERT INTO official_flags (official_id, flag_type, title, description, severity) VALUES
  ('c0000001-0001-4000-8000-000000000001', 'investigation', 'FPPC Investigation (ARPA Hero Pay)', 'Fair Political Practices Commission opened investigation into Sharif over ARPA Hero Pay self-payment despite $600/month charter salary cap.', 'critical'),
  ('c0000001-0001-4000-8000-000000000001', 'lawsuit', 'Filed legal action against Spicer ballot designation', 'Mayor Sharif filed legal action challenging Councilman Spicer''s ballot designation for the 2026 mayoral race.', 'warning');

-- Duhart flags
INSERT INTO official_flags (official_id, flag_type, title, description, severity) VALUES
  ('c0000001-0002-4000-8000-000000000002', 'info', 'Appointed, not elected', 'Councilmember Duhart was appointed to fill a vacancy rather than winning an election.', 'info');

-- Spicer flags
INSERT INTO official_flags (official_id, flag_type, title, description, severity) VALUES
  ('c0000001-0003-4000-8000-000000000003', 'investigation', 'DA reviewing credit card misuse complaint', 'Los Angeles County District Attorney reviewing complaint of city credit card misuse for personal purchases.', 'critical'),
  ('c0000001-0003-4000-8000-000000000003', 'fiscal', '$90K campaign donation from Dr. Dre', 'Received $90,000 campaign donation from Andre "Dr. Dre" Young for mayoral campaign.', 'warning'),
  ('c0000001-0003-4000-8000-000000000003', 'ethics', 'Paid self $6K from campaign funds', 'Used campaign funds to pay himself $6,000 in personal payments.', 'critical'),
  ('c0000001-0003-4000-8000-000000000003', 'fiscal', 'Credit card used for personal purchases', 'City-issued Cal-Card credit card reportedly used for Walmart, Amazon, Uber, and rapper travel expenses — violating the travel/training-only restriction.', 'critical');

-- Bowers flags
INSERT INTO official_flags (official_id, flag_type, title, description, severity) VALUES
  ('c0000001-0004-4000-8000-000000000004', 'fiscal', 'Also received ARPA Hero Pay', 'Councilmember Bowers also received ARPA Hero Pay despite federal rules prohibiting elected officials from self-payment.', 'warning'),
  ('c0000001-0004-4000-8000-000000000004', 'info', 'Championed city charter court case vs City Attorney', 'Led effort to challenge City Attorney''s authority, resulting in court ruling confirming City Manager and Council control the agenda.', 'info');

-- Darden flags
INSERT INTO official_flags (official_id, flag_type, title, description, severity) VALUES
  ('c0000001-0005-4000-8000-000000000005', 'info', 'Appointed, not elected', 'Councilmember Darden was appointed to fill a vacancy rather than winning an election.', 'info'),
  ('c0000001-0005-4000-8000-000000000005', 'fiscal', 'Also received ARPA Hero Pay', 'Received ARPA Hero Pay despite federal rules prohibiting elected officials from self-payment.', 'warning'),
  ('c0000001-0005-4000-8000-000000000005', 'ethics', 'Co-voted with Sharif to appoint Perrodin as City Attorney', 'Co-voted with Mayor Sharif to appoint Eric Perrodin as City Attorney, a controversial decision.', 'info');

-- City Manager Hopkins flags
INSERT INTO official_flags (official_id, flag_type, title, description, severity) VALUES
  ('c0000001-0006-4000-8000-000000000006', 'fiscal', 'City on State Auditor High Risk list since 2019', 'The California State Auditor placed Compton on its High Risk list in 2019 for financial conditions and administrative deficiencies. Designation has NOT been removed as of October 2025 under Hopkins'' watch.', 'critical'),
  ('c0000001-0006-4000-8000-000000000006', 'ethics', 'Court confirmed his agenda control power', 'Superior Court Judge Chalfant confirmed the City Manager has ultimate control over the city agenda alongside the council (Perrodin case).', 'info'),
  ('c0000001-0006-4000-8000-000000000006', 'ethics', 'Created MLDC position delaying Measure CA', 'Created the Municipal Law Division Chief position filled by consultant Janene MacIntyre at $12,000/month, which residents allege delayed implementation of voter-approved Measure CA.', 'critical'),
  ('c0000001-0006-4000-8000-000000000006', 'fiscal', 'Cal-Card safekeeping provisions not enforced', 'Failed to enforce the safekeeping provisions of the Cal-Card program, leaving cards in permanent possession of council members instead of a designated account manager.', 'warning'),
  ('c0000001-0006-4000-8000-000000000006', 'ethics', 'Withheld credit card statements', 'Withheld credit card statements for November 2025 through January 2026 citing an ongoing investigation, despite California Public Records Act requirements.', 'warning');

-- ============================================================
-- COUNCIL VOTES
-- ============================================================

-- Vote 1: ARPA Hero Pay
INSERT INTO council_votes (id, title, description, category, vote_date, result, vote_tally, impact_level, aftermath) VALUES
  ('a0000001-0001-4000-8000-000000000001',
   'Resolution 25,634 — ARPA Hero Pay for Essential Workers',
   'Authorized payment of up to $15,000 per unclassified employee (including elected officials) from American Rescue Plan Act funds as Essential Worker Premium Pay. Federal rules specifically prohibit elected officials from using ARPA to pay themselves premium pay.',
   'finance_budget', 'May 2022', 'passed', 'Passed 4-0', 'high',
   'FPPC opened investigation into Sharif. All officials took the pay despite $600/month charter salary cap.');

-- Vote 2: Cal-Card Program
INSERT INTO council_votes (id, title, description, category, vote_date, result, vote_tally, impact_level, aftermath) VALUES
  ('a0000001-0002-4000-8000-000000000002',
   'Resolution 26,168 — Cal-Card Purchasing Card Program',
   'Authorized City Manager to establish purchasing card accounts through California''s Cal-Card Program. Section 6 restricted elected officials to travel and training use only, with cards to be held by a designated account manager when not in use.',
   'finance_budget', 'Dec 3, 2024', 'passed', 'Passed unanimously', 'medium',
   'Spicer subsequently used card for in-town purchases (Walmart, Amazon, Uber, rapper travel). City Manager cancelled all cards. DA complaint filed Dec 2025.');

-- Vote 3: Measure CA
INSERT INTO council_votes (id, title, description, category, vote_date, result, vote_tally, impact_level, aftermath) VALUES
  ('a0000001-0003-4000-8000-000000000003',
   'Measure CA — City Attorney Appointed Position Amendment',
   'Charter amendment to replace elected City Attorney with an appointed 10-year municipal law firm. Council placed this on the ballot for voters.',
   'governance_reform', 'Nov 5, 2024', 'placed_on_ballot', 'Approved by ~60% of voters', 'high',
   'Implementation stalled. As of April 2026, no 10-year law firm appointed. MLDC consultant Janene MacIntyre still operating in interim role despite voter mandate.');

-- Vote 4: MLDC Position
INSERT INTO council_votes (id, title, description, category, vote_date, result, vote_tally, impact_level, aftermath) VALUES
  ('a0000001-0004-4000-8000-000000000004',
   'Creation of Municipal Law Division Chief (MLDC) Position',
   'City Council voted to create a temporary legal position (MLDC) as interim replacement for elected City Attorney, filled by consultant Janene MacIntyre at up to $12,000/month ($368/hour). Was supposed to be a 90-day assignment.',
   'governance_reform', 'Jul 2025', 'passed', 'Passed', 'high',
   'MacIntyre still in role as of early 2026, well past 90-day term. Assigned Spicer credit card investigation to firm with existing city ties. Residents allege this delays Measure CA implementation.');

-- Vote 5: Perrodin Resignation
INSERT INTO council_votes (id, title, description, category, vote_date, result, vote_tally, impact_level, aftermath) VALUES
  ('a0000001-0005-4000-8000-000000000005',
   'Accept Resignation of City Attorney Eric Perrodin',
   'Formal vote to file and receive the resignation of elected City Attorney Eric Perrodin, effective Dec 8, 2025. Included controversial $200,000 settlement to resolve mutual lawsuits between Perrodin and the City.',
   'governance_reform', 'Jan 27, 2026', 'passed', 'Passed unanimously', 'high',
   'Perrodin became last elected City Attorney in Compton history. Taxpayers outraged over $200K payout. $70M in legal fees departed City Hall 2016-2025 with no public disclosure.');

-- Vote 6: Budget Amendment
INSERT INTO council_votes (id, title, description, category, vote_date, result, vote_tally, impact_level, aftermath) VALUES
  ('a0000001-0006-4000-8000-000000000006',
   'FY 2025-2026 Budget Amendment — Accept Federal Funds',
   'Resolution 25,812 rescinded and re-adopted to amend FY 2025-2026 budget for acceptance and appropriation of U.S. federal grant funds.',
   'finance_budget', 'Oct 2025', 'passed', 'Passed', 'medium',
   'City remains on California State Auditor High Risk list since 2019.');

-- ============================================================
-- COUNCIL VOTE ROLL CALLS
-- ============================================================

-- Vote 1: ARPA Hero Pay (May 2022)
INSERT INTO council_vote_rolls (vote_id, official_id, position, notes) VALUES
  ('a0000001-0001-4000-8000-000000000001', 'c0000001-0001-4000-8000-000000000001', 'aye', NULL),
  ('a0000001-0001-4000-8000-000000000001', 'c0000001-0003-4000-8000-000000000003', 'na', 'Galvan voted — Spicer not yet on council'),
  ('a0000001-0001-4000-8000-000000000001', 'c0000001-0004-4000-8000-000000000004', 'aye', NULL),
  ('a0000001-0001-4000-8000-000000000001', 'c0000001-0005-4000-8000-000000000005', 'aye', NULL),
  ('a0000001-0001-4000-8000-000000000001', 'c0000001-0002-4000-8000-000000000002', 'na', 'Not yet appointed');

-- Vote 2: Cal-Card (Dec 2024)
INSERT INTO council_vote_rolls (vote_id, official_id, position) VALUES
  ('a0000001-0002-4000-8000-000000000002', 'c0000001-0001-4000-8000-000000000001', 'aye'),
  ('a0000001-0002-4000-8000-000000000002', 'c0000001-0003-4000-8000-000000000003', 'aye'),
  ('a0000001-0002-4000-8000-000000000002', 'c0000001-0004-4000-8000-000000000004', 'aye'),
  ('a0000001-0002-4000-8000-000000000002', 'c0000001-0005-4000-8000-000000000005', 'aye'),
  ('a0000001-0002-4000-8000-000000000002', 'c0000001-0002-4000-8000-000000000002', 'aye');

-- Vote 3: Measure CA (Nov 2024)
INSERT INTO council_vote_rolls (vote_id, official_id, position, notes) VALUES
  ('a0000001-0003-4000-8000-000000000003', 'c0000001-0001-4000-8000-000000000001', 'placed_on_ballot', 'Supported'),
  ('a0000001-0003-4000-8000-000000000003', 'c0000001-0003-4000-8000-000000000003', 'placed_on_ballot', NULL),
  ('a0000001-0003-4000-8000-000000000003', 'c0000001-0004-4000-8000-000000000004', 'placed_on_ballot', NULL),
  ('a0000001-0003-4000-8000-000000000003', 'c0000001-0005-4000-8000-000000000005', 'placed_on_ballot', NULL),
  ('a0000001-0003-4000-8000-000000000003', 'c0000001-0002-4000-8000-000000000002', 'placed_on_ballot', NULL);

-- Vote 4: MLDC (Jul 2025)
INSERT INTO council_vote_rolls (vote_id, official_id, position, notes) VALUES
  ('a0000001-0004-4000-8000-000000000004', 'c0000001-0001-4000-8000-000000000001', 'aye', NULL),
  ('a0000001-0004-4000-8000-000000000004', 'c0000001-0003-4000-8000-000000000003', 'aye', 'Publicly praised MacIntyre'),
  ('a0000001-0004-4000-8000-000000000004', 'c0000001-0004-4000-8000-000000000004', 'aye', NULL),
  ('a0000001-0004-4000-8000-000000000004', 'c0000001-0005-4000-8000-000000000005', 'aye', NULL),
  ('a0000001-0004-4000-8000-000000000004', 'c0000001-0002-4000-8000-000000000002', 'aye', NULL);

-- Vote 5: Perrodin Resignation (Jan 2026)
INSERT INTO council_vote_rolls (vote_id, official_id, position) VALUES
  ('a0000001-0005-4000-8000-000000000005', 'c0000001-0001-4000-8000-000000000001', 'aye'),
  ('a0000001-0005-4000-8000-000000000005', 'c0000001-0003-4000-8000-000000000003', 'aye'),
  ('a0000001-0005-4000-8000-000000000005', 'c0000001-0004-4000-8000-000000000004', 'aye'),
  ('a0000001-0005-4000-8000-000000000005', 'c0000001-0005-4000-8000-000000000005', 'aye'),
  ('a0000001-0005-4000-8000-000000000005', 'c0000001-0002-4000-8000-000000000002', 'aye');

-- Vote 6: Budget Amendment (Oct 2025)
INSERT INTO council_vote_rolls (vote_id, official_id, position) VALUES
  ('a0000001-0006-4000-8000-000000000006', 'c0000001-0001-4000-8000-000000000001', 'aye'),
  ('a0000001-0006-4000-8000-000000000006', 'c0000001-0003-4000-8000-000000000003', 'aye'),
  ('a0000001-0006-4000-8000-000000000006', 'c0000001-0004-4000-8000-000000000004', 'aye'),
  ('a0000001-0006-4000-8000-000000000006', 'c0000001-0005-4000-8000-000000000005', 'aye'),
  ('a0000001-0006-4000-8000-000000000006', 'c0000001-0002-4000-8000-000000000002', 'aye');

-- ============================================================
-- CITY MANAGER ACTIONS
-- ============================================================
INSERT INTO manager_actions (official_id, title, description, action_type, action_date, impact_level, outcome, accountability_notes) VALUES
  ('c0000001-0006-4000-8000-000000000006',
   'Established Cal-Card Purchasing Card Program',
   'Implemented city credit card accounts through California''s Cal-Card Program per Resolution 26,168. Cards were supposed to be held by a designated account manager and only distributed to elected officials for pre-approved travel/training.',
   'policy_implementation', 'Dec 3, 2024', 'high',
   'Cards were left in permanent possession of council members instead of safeguarded. Led directly to the Spicer misuse scandal.',
   'Failed to enforce the safekeeping provisions of the program he was authorized to manage.'),
  ('c0000001-0006-4000-8000-000000000006',
   'Cancelled All Cal-Card Credit Cards',
   'After public outrage over Councilman Spicer''s credit card charges surfaced at council meetings, City Manager Willie Hopkins cancelled all Cal-Card accounts across the city.',
   'corrective_action', 'Late 2025', 'medium',
   'Stopped further misuse. But action came only after public pressure — not from internal controls detecting the problem.',
   'Reactive, not proactive. Residents and activists discovered the misuse, not administration oversight.'),
  ('c0000001-0006-4000-8000-000000000006',
   'Created Municipal Law Division Chief (MLDC) Position',
   'Created a temporary legal position to serve as interim replacement for elected City Attorney. Hired consultant Janene MacIntyre at up to $12,000/month ($368/hour) for a 90-day assignment.',
   'hiring_appointment', 'Jul 2025', 'high',
   'MacIntyre remained in the role well past 90 days into 2026. Position was not elected or appointed by council. She was later listed under the city council budget despite being hired by the City Manager.',
   'Created a position that confused the public and delayed Measure CA implementation. No clear termination date enforced.'),
  ('c0000001-0006-4000-8000-000000000006',
   'Authorized 90-Day MLDC Assignment to MacIntyre',
   'Assistant City Manager Trephenia Simmons (now retired) authorized MacIntyre''s temporary 90-day assignment from September through December 8, 2025, under the City Manager''s office.',
   'hiring_appointment', 'Aug 2025', 'medium',
   'MacIntyre remained past December 2025. Was later reassigned to report to city council budget without a council vote to appoint her.',
   'Assignment extended without clear council authorization. Reporting structure changed without transparency.'),
  ('c0000001-0006-4000-8000-000000000006',
   'Managed Agenda During City Attorney Transition',
   'As confirmed by Superior Court Judge Chalfant, the City Manager has ultimate control over the city agenda alongside the council. Hopkins managed the agenda through the contentious period of Perrodin''s departure and the Measure CA transition.',
   'agenda_control', '2025-2026', 'high',
   'Court confirmed City Manager and council — not the City Attorney — control the agenda. But critics argue Hopkins has used agenda control to delay appointing the 10-year law firm mandated by Measure CA voters.',
   'Agenda power is legitimate per court ruling, but must be exercised to implement voter mandates, not delay them.'),
  ('c0000001-0006-4000-8000-000000000006',
   'Presentation on Legal Liabilities & Settlements (2016-2025)',
   'MLDC Janene MacIntyre (reporting under City Manager''s direction) presented findings that nearly $70 million in legal fees departed City Hall between 2016-2025 with no public disclosure.',
   'financial_disclosure', 'Dec 9, 2025', 'high',
   '$70M in legal costs exposed publicly for the first time. Raised serious questions about financial oversight during prior administrations and the role of the former City Attorney.',
   'Important transparency moment, but also raised questions about why the City Manager''s office didn''t flag this sooner given its budget oversight role.'),
  ('c0000001-0006-4000-8000-000000000006',
   'Withheld Cal-Card Statements Citing Ongoing Investigation',
   'Credit card statements for November 2025 through January 2026 were not made available to the public via the City Clerk''s website. The administration cited an ongoing investigation into Spicer''s card usage.',
   'records_transparency', 'Nov-Dec 2025', 'medium',
   'Statements from January-October 2025 were available, but the most recent months — rumored to contain additional problematic charges — were withheld. Residents accused the administration of a cover-up.',
   'California Public Records Act generally requires disclosure. Ongoing investigation exemption is narrow. Public has a right to these records.'),
  ('c0000001-0006-4000-8000-000000000006',
   'City Remains on California State Auditor High Risk List',
   'The California State Auditor first placed Compton on its High Risk list in 2019 due to financial conditions, financial stability concerns, and administrative deficiencies. As of October 2025, the designation has NOT been removed despite claimed progress.',
   'audit_oversight', '2019-Present', 'high',
   'State Auditor Grant Parks acknowledged some steps in the right direction but kept the designation. This means ongoing state scrutiny of Compton''s financial management under Hopkins'' administration.',
   'City Manager is the chief administrative officer responsible for day-to-day operations and financial management. Continued High Risk status reflects on his stewardship.');

-- ============================================================
-- ACCOUNTABILITY VECTORS (Council Scope)
-- ============================================================
INSERT INTO accountability_vectors (name, slug, description, icon, watch_for, applies_to, sort_order) VALUES
  ('Fiscal Accountability', 'fiscal-accountability',
   'How do they vote on budgets, spending, contracts? Do they support audits and transparency?',
   'dollar-sign',
   ARRAY['Voting to approve spending that benefits themselves', 'Support or opposition to independent financial audits', 'Patterns of approving no-bid contracts', 'Responsiveness to State Auditor High Risk findings'],
   ARRAY['mayor', 'council_member', 'city_manager'], 1),
  ('Governance & Reform', 'governance-reform',
   'Do they support structural reforms or protect the status quo?',
   'scale',
   ARRAY['Speed of implementing voter-approved measures (e.g., Measure CA)', 'Support for appointed vs. elected positions', 'Willingness to challenge charter violations', 'Delays or obstruction of reform implementation'],
   ARRAY['mayor', 'council_member', 'city_manager'], 2),
  ('Ethical Conduct', 'ethical-conduct',
   'Personal integrity, conflicts of interest, use of public resources.',
   'search',
   ARRAY['Self-dealing votes (voting on own compensation)', 'Misuse of city-issued credit cards or resources', 'Campaign finance irregularities (FPPC complaints)', 'Nepotism or favoritism in appointments'],
   ARRAY['mayor', 'council_member', 'city_manager'], 3),
  ('Public Safety & Services', 'public-safety',
   'Votes on policing, fire, infrastructure, code enforcement.',
   'shield',
   ARRAY['Budget allocations to LA County Sheriff contract', 'Fire department funding and staffing', 'Code enforcement and illegal dumping response', 'Homeless outreach funding'],
   ARRAY['mayor', 'council_member', 'city_manager'], 4),
  ('Community Development', 'community-development',
   'Housing, economic development, CDBG/HOME fund allocation.',
   'building',
   ARRAY['CDBG and HOME fund reallocation decisions', 'Affordable housing project approvals', 'Business licensing and cannabis regulation', 'General Plan and zoning updates'],
   ARRAY['mayor', 'council_member', 'city_manager'], 5),
  ('Transparency & Engagement', 'transparency-engagement',
   'Open government, public records, community access.',
   'megaphone',
   ARRAY['Responsiveness to public records requests', 'Brown Act compliance (proper meeting notices)', 'Treatment of public commenters at meetings', 'Availability of credit card statements and financial records'],
   ARRAY['mayor', 'council_member', 'city_manager'], 6),
  ('Electoral Integrity', 'electoral-integrity',
   'How they handle elections, ballot designations, campaign conduct.',
   'vote',
   ARRAY['Accuracy of ballot designations', 'Campaign finance compliance and disclosure', 'Use of public office to benefit campaign', 'Appointed vs. elected officials ratio'],
   ARRAY['mayor', 'council_member'], 7);
