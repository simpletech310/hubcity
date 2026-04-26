-- ============================================================
-- Seed example resources across all categories
-- ============================================================
-- Provides realistic example resources (housing, jobs, food,
-- youth, education, health, legal, senior, veterans, utilities)
-- so the public browse page and apply flow are populated for
-- demos and v1 launch. Each resource has a photo, custom
-- application fields (including a photo upload), spots, and a
-- deadline so the full Resource Account flow is exercisable.
-- ============================================================

INSERT INTO resources (
  name, slug, organization, category, description, eligibility,
  match_tags, status, deadline, is_free, address, phone, website,
  hours, district, image_url, is_published, accepts_applications,
  application_fields, max_spots, contact_email, contact_name
) VALUES

-- ── HOUSING — for-rent listing ──────────────────────────
(
  'Affordable 2BR Apartment — Wilmington Ave',
  'affordable-2br-wilmington',
  'Compton Community Housing',
  'housing',
  'Newly renovated 2-bedroom apartment in District 2. Includes water and trash. Section 8 vouchers welcomed. Quiet building near MLK Park.',
  'Household income up to 60% AMI. References required.',
  ARRAY['rent','section-8','2-bedroom']::text[],
  'open',
  (CURRENT_DATE + INTERVAL '30 days')::date,
  false,
  '1402 N Wilmington Ave, Compton, CA 90220',
  '(310) 555-0142',
  'https://example.org/housing',
  'Tours by appointment Mon–Sat',
  2,
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80',
  true,
  true,
  '[
    {"name":"household_size","label":"Household Size","type":"number","required":true,"placeholder":"e.g. 3"},
    {"name":"monthly_income","label":"Monthly Household Income (USD)","type":"number","required":true,"placeholder":"e.g. 3200"},
    {"name":"voucher","label":"Do you have a Section 8 voucher?","type":"select","required":true,"options":["Yes","No","In progress"]},
    {"name":"move_in_date","label":"Earliest move-in date","type":"text","required":true,"placeholder":"YYYY-MM-DD"},
    {"name":"id_photo","label":"Photo ID","type":"file","required":true,"placeholder":"Upload a photo of your ID"},
    {"name":"notes","label":"Anything else we should know?","type":"textarea","required":false}
  ]'::jsonb,
  4,
  'housing@example.org',
  'Marisol Ortega'
),

-- ── HOUSING — finder program ────────────────────────────
(
  'Pathways Home — Rapid Rehousing',
  'pathways-home-rehousing',
  'LA County Housing Authority',
  'housing',
  'Short-term rental assistance and housing navigation for households experiencing homelessness or at imminent risk. Includes case management and security deposit support.',
  'Currently homeless or with eviction notice. Compton residents prioritized.',
  ARRAY['homelessness','rental-assistance','case-management']::text[],
  'open',
  NULL,
  true,
  '700 W Compton Blvd, Compton, CA 90220',
  '(310) 555-0177',
  'https://example.org/pathways',
  'Mon–Fri 9–5',
  1,
  'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&q=80',
  true,
  true,
  '[
    {"name":"current_situation","label":"Describe your current housing situation","type":"textarea","required":true},
    {"name":"household_size","label":"Household size","type":"number","required":true},
    {"name":"eviction_notice","label":"Do you have an eviction notice?","type":"select","required":true,"options":["Yes","No"]},
    {"name":"eviction_doc","label":"Upload eviction notice (if any)","type":"file","required":false},
    {"name":"contact_phone","label":"Best phone to reach you","type":"phone","required":true}
  ]'::jsonb,
  25,
  'pathways@example.org',
  'Devon Carter'
),

-- ── JOBS ────────────────────────────────────────────────
(
  'Compton Workforce Apprenticeship — Solar Install',
  'compton-solar-apprenticeship',
  'SoCal Workforce Partnership',
  'jobs',
  '12-week paid apprenticeship installing residential solar. Earn while you learn. Tools and PPE provided. Pathway to full union employment after completion.',
  '18+, valid CA ID, ability to lift 50 lbs. No prior experience needed.',
  ARRAY['paid','green-jobs','apprenticeship']::text[],
  'open',
  (CURRENT_DATE + INTERVAL '21 days')::date,
  true,
  '2300 N Alameda St, Compton, CA 90222',
  '(310) 555-0198',
  'https://example.org/jobs',
  'Orientations Tuesdays 10am',
  3,
  'https://images.unsplash.com/photo-1559302504-64aae6ca6b6d?w=1200&q=80',
  true,
  true,
  '[
    {"name":"age","label":"Age","type":"number","required":true},
    {"name":"resume","label":"Resume (PDF)","type":"file","required":false,"placeholder":"Upload your resume"},
    {"name":"availability","label":"Available start date","type":"text","required":true,"placeholder":"YYYY-MM-DD"},
    {"name":"transport","label":"Reliable transportation?","type":"select","required":true,"options":["Yes","No","Public transit"]},
    {"name":"experience","label":"Tell us why you want this role","type":"textarea","required":true}
  ]'::jsonb,
  20,
  'apprentice@example.org',
  'Lena Rodriguez'
),

-- ── FOOD ────────────────────────────────────────────────
(
  'Compton Food Box — Weekly Groceries',
  'compton-food-box',
  'South LA Food Coalition',
  'food',
  'Free weekly box of fresh produce, dairy, and pantry staples. No paperwork beyond signup. Delivery available for seniors and disabled residents.',
  'Open to all Compton residents. No income limit.',
  ARRAY['groceries','free','delivery']::text[],
  'open',
  NULL,
  true,
  '512 W Rosecrans Ave, Compton, CA 90222',
  '(310) 555-0163',
  'https://example.org/food-box',
  'Pickup Sat 9am–1pm',
  4,
  'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&q=80',
  true,
  true,
  '[
    {"name":"household_size","label":"Household size","type":"number","required":true},
    {"name":"delivery","label":"Need delivery?","type":"select","required":true,"options":["No, I will pick up","Yes — senior 65+","Yes — disabled","Yes — other"]},
    {"name":"address","label":"Delivery address (if applicable)","type":"text","required":false},
    {"name":"dietary","label":"Dietary restrictions","type":"textarea","required":false}
  ]'::jsonb,
  150,
  'foodbox@example.org',
  'Kim Nguyen'
),

-- ── YOUTH ───────────────────────────────────────────────
(
  'Compton Youth Coding Camp — Summer 2026',
  'compton-youth-coding-camp',
  'Code City Compton',
  'youth',
  '6-week summer coding camp for ages 10–17. Build games, websites, and apps. Free Chromebooks loaned for the program. Lunch included daily.',
  'Ages 10–17. Compton residents prioritized.',
  ARRAY['summer','tech','free-lunch']::text[],
  'open',
  (CURRENT_DATE + INTERVAL '45 days')::date,
  true,
  '600 N Alameda St, Compton, CA 90220',
  '(310) 555-0211',
  'https://example.org/code-camp',
  'Mon–Fri 9am–3pm, Jun 23 – Aug 1',
  1,
  'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&q=80',
  true,
  true,
  '[
    {"name":"child_name","label":"Child''s full name","type":"text","required":true},
    {"name":"child_age","label":"Child''s age","type":"number","required":true},
    {"name":"grade","label":"Grade entering Fall 2026","type":"text","required":true},
    {"name":"parent_name","label":"Parent/Guardian name","type":"text","required":true},
    {"name":"parent_phone","label":"Parent/Guardian phone","type":"phone","required":true},
    {"name":"experience","label":"Has your child used a computer before?","type":"select","required":true,"options":["Never","A little","Comfortable","Already codes"]},
    {"name":"photo","label":"Recent photo of child (optional)","type":"file","required":false}
  ]'::jsonb,
  30,
  'camp@example.org',
  'Aisha Brooks'
),

-- ── EDUCATION ───────────────────────────────────────────
(
  'GED Prep & Exam Prep — Free Tutoring',
  'ged-prep-free-tutoring',
  'Compton Adult Learning Center',
  'education',
  'Free GED preparation classes, exam fees covered. Twice-weekly tutoring with certified instructors. Childcare available on-site.',
  '18+ without a high school diploma.',
  ARRAY['ged','tutoring','adult-ed']::text[],
  'open',
  NULL,
  true,
  '1100 N Bullis Rd, Compton, CA 90221',
  '(310) 555-0190',
  'https://example.org/ged',
  'Tue/Thu 6pm–8:30pm',
  2,
  'https://images.unsplash.com/photo-1513258496099-48168024aec0?w=1200&q=80',
  true,
  true,
  '[
    {"name":"last_grade","label":"Last grade completed","type":"text","required":true},
    {"name":"goal","label":"Why do you want a GED?","type":"textarea","required":true},
    {"name":"childcare","label":"Need on-site childcare?","type":"select","required":true,"options":["No","Yes — 1 child","Yes — 2+ children"]}
  ]'::jsonb,
  40,
  'ged@example.org',
  'Marcus Hill'
),

-- ── HEALTH ──────────────────────────────────────────────
(
  'Free Community Dental Day',
  'free-community-dental-day',
  'MLK Community Hospital',
  'health',
  'Free cleanings, exams, and basic fillings for uninsured residents. Bilingual staff. Walk-ins welcome but appointments preferred.',
  'Uninsured Compton residents 18+.',
  ARRAY['dental','free','uninsured']::text[],
  'upcoming',
  (CURRENT_DATE + INTERVAL '14 days')::date,
  true,
  '1680 E 120th St, Los Angeles, CA 90059',
  '(310) 555-0125',
  'https://example.org/dental-day',
  'Saturday 8am–4pm',
  3,
  'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=1200&q=80',
  true,
  true,
  '[
    {"name":"insurance","label":"Do you have dental insurance?","type":"select","required":true,"options":["No","Yes"]},
    {"name":"last_visit","label":"When was your last dental visit?","type":"text","required":false},
    {"name":"concerns","label":"Pain or concerns?","type":"textarea","required":false}
  ]'::jsonb,
  100,
  'dental@example.org',
  'Dr. Patricia Lee'
),

-- ── LEGAL ───────────────────────────────────────────────
(
  'Free Legal Clinic — Tenant Rights',
  'free-legal-clinic-tenant',
  'LA Legal Aid Foundation',
  'legal',
  'Free 30-minute consultations with attorneys for tenants facing eviction, habitability issues, or rent increases.',
  'LA County renters. Bring lease and any notices received.',
  ARRAY['eviction','tenant-rights','free-legal']::text[],
  'open',
  NULL,
  true,
  '205 S Willowbrook Ave, Compton, CA 90220',
  '(310) 555-0166',
  'https://example.org/legal',
  'Wed 10am–4pm',
  1,
  'https://images.unsplash.com/photo-1589994965851-a8f479c573a9?w=1200&q=80',
  true,
  true,
  '[
    {"name":"issue","label":"Briefly describe your legal issue","type":"textarea","required":true},
    {"name":"notice","label":"Have you received any written notices?","type":"select","required":true,"options":["No","3-day notice","30-day notice","Eviction summons","Other"]},
    {"name":"notice_doc","label":"Upload notice (if any)","type":"file","required":false},
    {"name":"language","label":"Preferred language","type":"select","required":false,"options":["English","Spanish","Other"]}
  ]'::jsonb,
  20,
  'legal@example.org',
  'Atty. Rachel Kim'
),

-- ── SENIOR ──────────────────────────────────────────────
(
  'Senior Wellness & Hot Lunch Program',
  'senior-wellness-hot-lunch',
  'Compton Senior Center',
  'senior',
  'Daily hot lunch, gentle exercise classes, blood pressure checks, and social activities for adults 60+. Transportation available.',
  'Adults 60+.',
  ARRAY['lunch','exercise','social']::text[],
  'open',
  NULL,
  true,
  '301 N Tamarind Ave, Compton, CA 90220',
  '(310) 555-0134',
  'https://example.org/senior',
  'Mon–Fri 10am–2pm',
  2,
  'https://images.unsplash.com/photo-1573497019418-b400bb3ab074?w=1200&q=80',
  true,
  true,
  '[
    {"name":"birth_year","label":"Year of birth","type":"number","required":true},
    {"name":"transport","label":"Need transportation?","type":"select","required":true,"options":["No","Yes — pickup","Yes — bus pass"]},
    {"name":"emergency_contact","label":"Emergency contact name & phone","type":"text","required":true},
    {"name":"dietary","label":"Dietary restrictions","type":"textarea","required":false}
  ]'::jsonb,
  60,
  'senior@example.org',
  'Gloria Washington'
),

-- ── VETERANS ────────────────────────────────────────────
(
  'Veterans Resource Connect',
  'veterans-resource-connect',
  'Compton VFW Post 5394',
  'veterans',
  'One-stop help with VA benefits, healthcare enrollment, housing, and employment. Walk-ins welcome.',
  'Veterans of any era. DD-214 helpful but not required.',
  ARRAY['va-benefits','employment','housing']::text[],
  'open',
  NULL,
  true,
  '14318 S Atlantic Ave, Compton, CA 90221',
  '(310) 555-0188',
  'https://example.org/vets',
  'Tue & Thu 9am–3pm',
  4,
  'https://images.unsplash.com/photo-1533069027836-fa937181a8ce?w=1200&q=80',
  true,
  true,
  '[
    {"name":"era","label":"Era of service","type":"select","required":true,"options":["Vietnam","Gulf War","Post-9/11","Other"]},
    {"name":"branch","label":"Branch","type":"select","required":true,"options":["Army","Navy","Marines","Air Force","Coast Guard","Space Force"]},
    {"name":"need","label":"What do you need help with?","type":"textarea","required":true},
    {"name":"dd214","label":"Upload DD-214 (optional)","type":"file","required":false}
  ]'::jsonb,
  NULL,
  'vets@example.org',
  'Sgt. Maj. James Carter (ret.)'
),

-- ── UTILITIES ───────────────────────────────────────────
(
  'LADWP Bill Assistance — EZ-SAVE',
  'ladwp-ez-save',
  'LA Department of Water & Power',
  'utilities',
  'Up to $14/month off your DWP bill for income-eligible households. Quick application — 5 minutes.',
  'Household income at or below 200% federal poverty line.',
  ARRAY['utility-help','discount','income-based']::text[],
  'open',
  NULL,
  true,
  'Online application',
  '1-800-555-0117',
  'https://example.org/ezsave',
  '24/7 online',
  NULL,
  'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=1200&q=80',
  true,
  true,
  '[
    {"name":"account_number","label":"DWP account number","type":"text","required":true},
    {"name":"household_size","label":"Household size","type":"number","required":true},
    {"name":"annual_income","label":"Annual household income","type":"number","required":true},
    {"name":"income_proof","label":"Upload proof of income","type":"file","required":true,"placeholder":"Pay stub, tax return, or benefits letter"}
  ]'::jsonb,
  NULL,
  'ezsave@example.org',
  'Customer Service'
)

ON CONFLICT (slug) DO NOTHING;
