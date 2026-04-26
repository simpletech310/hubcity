-- ============================================================
-- Seed local health resources across every subtype
-- ============================================================
-- Paste-safe: no table-alias dot-notation, no example.com URLs.
-- Idempotent: ON CONFLICT (slug) DO NOTHING.
-- ============================================================

INSERT INTO health_resources (
  name, slug, description, category, organization,
  address, phone, website, image_url,
  is_emergency, accepts_medi_cal, accepts_uninsured, is_free,
  languages, district, is_published
) VALUES

-- ── HOSPITALS ───────────────────────────────────────────
('MLK Community Hospital', 'mlk-community-hospital',
 'Full-service community hospital with emergency room, inpatient care, and outpatient specialty clinics serving South LA and Compton.',
 'hospital', 'MLK Community Healthcare',
 '1680 E 120th St, Los Angeles, CA 90059', '(424) 338-8000', 'mlkch.org',
 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=1200&q=80',
 TRUE, TRUE, TRUE, FALSE,
 ARRAY['English','Spanish']::text[], 3, TRUE),

('Compton Memorial Health Center', 'compton-memorial-health-center',
 'Acute-care hospital with 24/7 emergency department, surgical services, and labor & delivery.',
 'hospital', 'Compton Memorial',
 '4101 Atlantic Ave, Long Beach, CA 90807', '(562) 933-2000', NULL,
 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=1200&q=80',
 TRUE, TRUE, TRUE, FALSE,
 ARRAY['English','Spanish']::text[], 4, TRUE),

-- ── CLINICS ─────────────────────────────────────────────
('Compton Health Center', 'compton-health-center',
 'Federally qualified community health center providing primary care, women''s health, and chronic disease management on a sliding scale.',
 'clinic', 'LA County DHS',
 '300 N Pleasant Way, Compton, CA 90220', '(310) 537-3300', 'dhs.lacounty.gov',
 'https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?w=1200&q=80',
 FALSE, TRUE, TRUE, TRUE,
 ARRAY['English','Spanish']::text[], 1, TRUE),

('South LA Family Health Clinic', 'south-la-family-health-clinic',
 'Bilingual primary care clinic offering same-day appointments, immunizations, and chronic care.',
 'clinic', 'South Central Family Health',
 '4920 S Avalon Blvd, Los Angeles, CA 90011', '(323) 908-4222', NULL,
 'https://images.unsplash.com/photo-1666214280391-8ff5bd3c0bf0?w=1200&q=80',
 FALSE, TRUE, TRUE, FALSE,
 ARRAY['English','Spanish']::text[], 2, TRUE),

-- ── MENTAL HEALTH ───────────────────────────────────────
('Compton Mental Health Center', 'compton-mental-health-center',
 'Outpatient mental health services for adults and youth. Therapy, psychiatric meds, and crisis support.',
 'mental_health', 'LA County DMH',
 '921 N Bullis Rd, Compton, CA 90221', '(310) 668-8350', 'dmh.lacounty.gov',
 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=1200&q=80',
 FALSE, TRUE, TRUE, TRUE,
 ARRAY['English','Spanish']::text[], 1, TRUE),

('Didi Hirsch Mental Health Services', 'didi-hirsch-mental-health',
 '24/7 suicide prevention crisis line plus walk-in counseling and therapy. Sliding-scale fees.',
 'mental_health', 'Didi Hirsch',
 '4760 S Sepulveda Blvd, Culver City, CA 90230', '(310) 895-2300', 'didihirsch.org',
 'https://images.unsplash.com/photo-1573497019418-b400bb3ab074?w=1200&q=80',
 FALSE, TRUE, TRUE, FALSE,
 ARRAY['English','Spanish','Korean']::text[], NULL, TRUE),

-- ── DENTAL ──────────────────────────────────────────────
('Compton Family Dental', 'compton-family-dental',
 'General dentistry, cleanings, fillings, and pediatric dental services. Most insurance accepted including Medi-Cal.',
 'dental', 'Compton Family Dental',
 '420 W Compton Blvd, Compton, CA 90220', '(310) 632-0250', NULL,
 'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=1200&q=80',
 FALSE, TRUE, TRUE, FALSE,
 ARRAY['English','Spanish']::text[], 1, TRUE),

-- ── VISION ──────────────────────────────────────────────
('Compton Vision Center', 'compton-vision-center',
 'Eye exams, prescription glasses, contact lenses. Same-day glasses available. Walk-ins welcome.',
 'vision', 'Compton Vision Center',
 '1100 N Long Beach Blvd, Compton, CA 90221', '(310) 537-7700', NULL,
 'https://images.unsplash.com/photo-1582142306909-195724d33ffc?w=1200&q=80',
 FALSE, TRUE, TRUE, FALSE,
 ARRAY['English','Spanish']::text[], 2, TRUE),

-- ── PHARMACY ────────────────────────────────────────────
('CVS Pharmacy — Compton', 'cvs-pharmacy-compton',
 'Pharmacy with free flu shots, COVID vaccines, and most prescriptions filled in 30 minutes.',
 'pharmacy', 'CVS Health',
 '601 W Compton Blvd, Compton, CA 90220', '(310) 763-0560', 'cvs.com',
 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=1200&q=80',
 FALSE, TRUE, TRUE, FALSE,
 ARRAY['English','Spanish']::text[], 1, TRUE),

('Walgreens — Long Beach Blvd', 'walgreens-long-beach-blvd',
 '24-hour pharmacy with drive-through, vaccinations, and immunizations for all ages.',
 'pharmacy', 'Walgreens',
 '1701 N Long Beach Blvd, Compton, CA 90221', '(310) 605-1340', 'walgreens.com',
 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=1200&q=80',
 FALSE, TRUE, TRUE, FALSE,
 ARRAY['English','Spanish']::text[], 2, TRUE),

-- ── SUBSTANCE ABUSE ─────────────────────────────────────
('Tarzana Treatment Centers — Compton', 'tarzana-treatment-compton',
 'Outpatient substance use disorder treatment, MAT (methadone/buprenorphine), and recovery support.',
 'substance_abuse', 'Tarzana Treatment Centers',
 '2509 Pacific Coast Hwy, Lomita, CA 90717', '(310) 326-4357', 'tarzanatc.org',
 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=1200&q=80',
 FALSE, TRUE, TRUE, TRUE,
 ARRAY['English','Spanish']::text[], NULL, TRUE),

-- ── PRENATAL ────────────────────────────────────────────
('Compton OB-GYN & Prenatal Care', 'compton-prenatal-care',
 'Comprehensive prenatal care, labor & delivery support, and postpartum services. Medi-Cal accepted.',
 'prenatal', 'Compton OB-GYN Associates',
 '305 N Tamarind Ave, Compton, CA 90220', '(310) 537-1100', NULL,
 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=1200&q=80',
 FALSE, TRUE, TRUE, FALSE,
 ARRAY['English','Spanish']::text[], 1, TRUE),

-- ── PEDIATRIC ───────────────────────────────────────────
('Compton Children''s Health', 'compton-childrens-health',
 'Pediatric primary care for kids 0–18. Well-child visits, vaccines, sick visits, school physicals.',
 'pediatric', 'Compton Children''s Clinic',
 '650 N Wilmington Ave, Compton, CA 90220', '(310) 632-2000', NULL,
 'https://images.unsplash.com/photo-1581595220892-b0739db3ba8c?w=1200&q=80',
 FALSE, TRUE, TRUE, FALSE,
 ARRAY['English','Spanish']::text[], 2, TRUE),

-- ── SENIOR CARE ─────────────────────────────────────────
('Compton Senior Health Center', 'compton-senior-health-center',
 'Geriatric primary care, memory care evaluations, and caregiver support for adults 60+.',
 'senior_care', 'LA County Aging & Disabilities',
 '301 N Tamarind Ave, Compton, CA 90220', '(310) 605-3050', 'aging.lacounty.gov',
 'https://images.unsplash.com/photo-1573497019418-b400bb3ab074?w=1200&q=80',
 FALSE, TRUE, TRUE, TRUE,
 ARRAY['English','Spanish']::text[], 2, TRUE),

-- ── INSURANCE HELP / EMERGENCY ──────────────────────────
('Covered California Enrollment — Compton', 'covered-california-compton',
 'Free enrollment help for Covered California, Medi-Cal, and other low-cost health plans.',
 'insurance_help', 'LA Health Initiative',
 '700 N Bullis Rd, Compton, CA 90221', '(310) 605-7000', 'coveredca.com',
 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1200&q=80',
 FALSE, TRUE, TRUE, TRUE,
 ARRAY['English','Spanish']::text[], 1, TRUE),

('911 Emergency / Compton Fire & EMS', '911-compton-emergency',
 'Dial 911 for life-threatening emergencies. Compton Fire Department provides EMS response.',
 'emergency', 'Compton Fire Department',
 '203 S Willowbrook Ave, Compton, CA 90220', '911', NULL,
 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=1200&q=80',
 TRUE, TRUE, TRUE, TRUE,
 ARRAY['English','Spanish']::text[], 1, TRUE)

ON CONFLICT (slug) DO NOTHING;
