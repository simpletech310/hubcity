-- ============================================================
-- Hub City App — Seed Data (Compton, CA)
-- ============================================================

-- ============================================================
-- BUSINESSES
-- ============================================================
INSERT INTO businesses (name, slug, category, description, address, district, phone, rating_avg, rating_count, vote_count, badges, is_featured, hours, menu) VALUES
(
  'Bludso''s BBQ',
  'bludsos-bbq',
  'restaurant',
  'Legendary Texas-style BBQ born right here in Compton. Kevin Bludso brings generations of pit-smoked tradition to every plate.',
  '609 N Long Beach Blvd, Compton, CA 90221',
  1,
  '(310) 637-1342',
  4.8, 342, 890,
  ARRAY['city_best', 'hub_verified'],
  true,
  '{"mon": {"open": "11:00", "close": "21:00"}, "tue": {"open": "11:00", "close": "21:00"}, "wed": {"open": "11:00", "close": "21:00"}, "thu": {"open": "11:00", "close": "21:00"}, "fri": {"open": "11:00", "close": "22:00"}, "sat": {"open": "11:00", "close": "22:00"}, "sun": {"open": "12:00", "close": "20:00"}}',
  '[{"name": "Brisket Plate", "price": 18.99, "description": "Slow-smoked 14hr brisket"}, {"name": "Rib Tips", "price": 15.99, "description": "Fall-off-the-bone tender"}, {"name": "Hot Links", "price": 12.99, "description": "House-made spicy links"}, {"name": "Combo Plate", "price": 22.99, "description": "Pick any 2 meats + 2 sides"}, {"name": "Mac & Cheese", "price": 5.99, "description": "Creamy Southern-style"}]'
),
(
  'Billionaire Burger Boyz',
  'billionaire-burger-boyz',
  'restaurant',
  'Gourmet burgers, Compton born and raised. From a backyard grill to a national brand.',
  '1445 N Long Beach Blvd, Compton, CA 90221',
  2,
  '(424) 329-4947',
  4.7, 218, 650,
  ARRAY['trending', 'hub_verified'],
  true,
  '{"mon": {"open": "11:00", "close": "21:00"}, "tue": {"open": "11:00", "close": "21:00"}, "wed": {"open": "11:00", "close": "21:00"}, "thu": {"open": "11:00", "close": "21:00"}, "fri": {"open": "11:00", "close": "22:00"}, "sat": {"open": "11:00", "close": "22:00"}, "sun": {"open": "12:00", "close": "20:00"}}',
  '[{"name": "Classic Burger", "price": 12.99, "description": "1/3 lb Angus beef"}, {"name": "Billionaire Burger", "price": 16.99, "description": "Double patty, special sauce"}, {"name": "Loaded Fries", "price": 8.99, "description": "Cheese, bacon, ranch"}]'
),
(
  'CH y LA Birria',
  'ch-y-la-birria',
  'restaurant',
  'Authentic birria tacos and consomé. The best birria in Compton, hands down.',
  '700 N Alameda St, Compton, CA 90222',
  3,
  '(323) 555-0142',
  4.9, 567, 1200,
  ARRAY['hub_verified', 'community_fav'],
  true,
  '{"thu": {"open": "10:00", "close": "18:00"}, "fri": {"open": "10:00", "close": "18:00"}, "sat": {"open": "09:00", "close": "18:00"}, "sun": {"open": "09:00", "close": "16:00"}}',
  '[{"name": "Birria Tacos (3)", "price": 12.99, "description": "With consomé for dipping"}, {"name": "Birria Quesadilla", "price": 10.99, "description": "Cheese-crusted perfection"}, {"name": "Consomé Bowl", "price": 8.99, "description": "Rich birria broth with fixings"}]'
),
(
  'Compton Cuts Barbershop',
  'compton-cuts',
  'barber',
  'Premium barbershop. Fresh cuts, hot towel shaves, and good conversation since 2005.',
  '320 W Compton Blvd, Compton, CA 90220',
  1,
  '(310) 555-0188',
  4.6, 189, 420,
  ARRAY['hub_verified'],
  false,
  '{"mon": {"open": "09:00", "close": "19:00"}, "tue": {"open": "09:00", "close": "19:00"}, "wed": {"open": "09:00", "close": "19:00"}, "thu": {"open": "09:00", "close": "19:00"}, "fri": {"open": "09:00", "close": "20:00"}, "sat": {"open": "08:00", "close": "18:00"}}',
  '[]'
),
(
  'Naka''s Broiler',
  'nakas-broiler',
  'restaurant',
  'Classic Compton burgers since 1972. A neighborhood institution.',
  '1000 E Compton Blvd, Compton, CA 90221',
  2,
  '(310) 639-7988',
  4.5, 412, 780,
  ARRAY['classic'],
  false,
  '{"mon": {"open": "10:00", "close": "22:00"}, "tue": {"open": "10:00", "close": "22:00"}, "wed": {"open": "10:00", "close": "22:00"}, "thu": {"open": "10:00", "close": "22:00"}, "fri": {"open": "10:00", "close": "23:00"}, "sat": {"open": "10:00", "close": "23:00"}, "sun": {"open": "10:00", "close": "21:00"}}',
  '[{"name": "Naka Burger", "price": 8.99, "description": "The original since 1972"}, {"name": "Pastrami Burger", "price": 10.99, "description": "Topped with hot pastrami"}]'
),
(
  'Mama''s Tamales',
  'mamas-tamales',
  'restaurant',
  'Handmade tamales from a family recipe passed down since 1985. Pork, chicken, and seasonal specials.',
  '205 S Wilmington Ave, Compton, CA 90223',
  4,
  '(310) 555-0165',
  4.8, 298, 560,
  ARRAY['community_fav'],
  false,
  '{"wed": {"open": "07:00", "close": "15:00"}, "thu": {"open": "07:00", "close": "15:00"}, "fri": {"open": "07:00", "close": "16:00"}, "sat": {"open": "07:00", "close": "16:00"}, "sun": {"open": "07:00", "close": "14:00"}}',
  '[{"name": "Pork Tamales (6)", "price": 12.00, "description": "Classic red chile pork"}, {"name": "Chicken Tamales (6)", "price": 12.00, "description": "Green chile chicken"}, {"name": "Dozen Mixed", "price": 22.00, "description": "6 pork + 6 chicken"}]'
),
(
  'Compton Auto Care',
  'compton-auto-care',
  'auto',
  'Full-service auto repair. Oil changes, brakes, transmission, and diagnostics. Family-owned.',
  '1200 S Central Ave, Compton, CA 90222',
  3,
  '(310) 555-0199',
  4.4, 156, 320,
  ARRAY['hub_verified'],
  false,
  '{"mon": {"open": "08:00", "close": "18:00"}, "tue": {"open": "08:00", "close": "18:00"}, "wed": {"open": "08:00", "close": "18:00"}, "thu": {"open": "08:00", "close": "18:00"}, "fri": {"open": "08:00", "close": "18:00"}, "sat": {"open": "09:00", "close": "14:00"}}',
  '[]'
),
(
  'Glow Beauty Studio',
  'glow-beauty-studio',
  'beauty',
  'Full-service beauty salon. Hair, nails, lashes, and skincare. Walk-ins welcome.',
  '800 W Rosecrans Ave, Compton, CA 90220',
  1,
  '(310) 555-0177',
  4.7, 234, 510,
  ARRAY['trending'],
  false,
  '{"tue": {"open": "09:00", "close": "19:00"}, "wed": {"open": "09:00", "close": "19:00"}, "thu": {"open": "09:00", "close": "19:00"}, "fri": {"open": "09:00", "close": "20:00"}, "sat": {"open": "08:00", "close": "18:00"}}',
  '[]'
);

-- ============================================================
-- EVENTS
-- ============================================================
INSERT INTO events (title, slug, category, description, start_date, start_time, end_date, end_time, location_name, address, district, rsvp_count, is_featured) VALUES
(
  'Compton Christmas Parade',
  'compton-christmas-parade-2025',
  'community',
  'Join thousands of Compton residents for the annual Christmas Parade down Compton Blvd. Floats, marching bands, local performers, and Santa Claus! Free event for all ages.',
  '2025-12-14', '10:00', '2025-12-14', '14:00',
  'Compton Blvd',
  'Compton Blvd (Wilmington Ave to Central Ave), Compton, CA',
  1, 1240, true
),
(
  'Friday Night Football — Compton vs Dominguez',
  'friday-night-football',
  'sports',
  'Weekly high school football under the lights. Compton Tarbabes take on Dominguez Dons. Concessions available.',
  '2025-12-13', '19:00', '2025-12-13', '21:30',
  'Compton High Stadium',
  '601 S Acacia Ave, Compton, CA 90220',
  2, 890, true
),
(
  'Mural Walk: Art of Compton Tour',
  'mural-walk-art-tour',
  'culture',
  'Guided walking tour of Compton''s most stunning murals and street art. Learn the stories behind the art and the artists. 2-hour walking tour.',
  '2025-12-21', '11:00', '2025-12-21', '13:00',
  'Downtown Compton',
  'Meet at Compton City Hall, 205 S Willowbrook Ave',
  1, 320, false
),
(
  'City Council Meeting',
  'city-council-dec-2025',
  'city',
  'Regular city council meeting. Public comment period available. Agenda includes budget review, public safety updates, and infrastructure proposals.',
  '2025-12-17', '18:00', '2025-12-17', '21:00',
  'City Hall Council Chambers',
  '205 S Willowbrook Ave, Compton, CA 90220',
  NULL, 156, false
),
(
  'Youth Basketball League Signup',
  'youth-basketball-signup',
  'youth',
  'Registration for the Compton Parks & Recreation winter basketball league. Ages 8-17. Season runs January through March. Free for Compton residents.',
  '2026-01-05', '09:00', '2026-01-05', '15:00',
  'Lueders Park Community Center',
  '1500 E Greenleaf Blvd, Compton, CA 90221',
  3, 210, false
),
(
  'New Year''s Community Celebration',
  'new-years-celebration-2026',
  'community',
  'Ring in 2026 with your Compton neighbors! Live DJ, food trucks, kids zone, and fireworks at midnight. Free admission.',
  '2025-12-31', '20:00', '2026-01-01', '01:00',
  'Wilson Park',
  '515 W Greenleaf Blvd, Compton, CA 90220',
  1, 2100, true
),
(
  'Small Business Workshop: Digital Marketing',
  'small-business-digital-marketing',
  'community',
  'Free workshop for Compton business owners. Learn social media marketing, Google My Business optimization, and email marketing basics.',
  '2026-01-10', '10:00', '2026-01-10', '13:00',
  'Compton Chamber of Commerce',
  '700 N Bullis Rd, Compton, CA 90221',
  2, 85, false
),
(
  'Martin Luther King Jr. Day Parade',
  'mlk-day-parade-2026',
  'culture',
  'Annual MLK Day parade and celebration. Honoring Dr. King''s legacy with music, speakers, and community unity.',
  '2026-01-20', '10:00', '2026-01-20', '14:00',
  'Compton Blvd',
  'Compton Blvd, Compton, CA',
  NULL, 1800, true
);

-- ============================================================
-- RESOURCES
-- ============================================================
INSERT INTO resources (name, slug, organization, category, description, eligibility, match_tags, status, deadline, is_free, address, phone, website, hours) VALUES
(
  'Small Business Microgrant Program',
  'small-business-microgrant',
  'City of Compton',
  'business',
  'Up to $10,000 grants for Compton-based small businesses. No repayment required. Funds for equipment, inventory, marketing, rent, or technology.',
  'Must be a Compton-based business operating for at least 6 months. Annual revenue under $500K. Must have valid business license.',
  ARRAY['business_owner', 'compton_resident'],
  'open',
  '2026-01-31',
  true,
  'Compton City Hall, 205 S Willowbrook Ave',
  '(310) 605-5500',
  'compton.gov/grants',
  'Mon-Fri 8AM-5PM'
),
(
  'Crystal Stairs Head Start',
  'crystal-stairs-head-start',
  'Crystal Stairs Inc.',
  'youth',
  'Free early childhood education and childcare for qualifying families with children ages 3-5. Comprehensive development program including nutrition and health services.',
  'Income-eligible families with children ages 3-5 in the Compton area.',
  ARRAY['has_children', 'ages_3_5', 'low_income'],
  'open',
  NULL,
  true,
  '5110 Goldleaf Circle, Suite 150, Compton, CA 90220',
  '(323) 421-1414',
  'crystalstairs.org',
  'Mon-Fri 6:30AM-6PM'
),
(
  'MLK Community Health Center',
  'mlk-community-health',
  'Martin Luther King Jr. Community Hospital',
  'health',
  'Free and low-cost primary care, dental, and mental health services. Walk-ins welcome. Serving the Compton community since 1972.',
  'Open to all residents. Sliding scale fees based on income. No insurance required.',
  ARRAY['uninsured', 'low_income', 'health_need'],
  'open',
  NULL,
  true,
  '1680 E 120th St, Los Angeles, CA 90059',
  '(424) 338-8000',
  'mlkch.org',
  'Mon-Fri 8AM-5PM, Urgent Care 24/7'
),
(
  'CareerLink Job Training Program',
  'careerlink-job-training',
  'Compton WorkSource Center',
  'jobs',
  'Free job training programs in technology, healthcare, skilled trades, and customer service. Includes resume workshops, interview prep, and job placement assistance.',
  'Must be 18+. Compton residents receive priority. No prior experience required for most programs.',
  ARRAY['job_seeker', 'career_change', 'unemployed'],
  'open',
  NULL,
  true,
  '700 N Bullis Rd, Suite 101, Compton, CA 90221',
  '(310) 764-3981',
  'ajcc.lacounty.gov',
  'Mon-Fri 8AM-5PM'
),
(
  'Emergency Housing Assistance',
  'emergency-housing',
  'Compton Housing Authority',
  'housing',
  'Rental assistance, security deposit help, and emergency shelter referrals for qualifying residents facing housing instability.',
  'Must be a Compton resident facing imminent housing loss. Income verification required.',
  ARRAY['renter', 'low_income', 'housing_need', 'emergency'],
  'limited',
  NULL,
  true,
  '600 N Alameda St, Compton, CA 90221',
  '(310) 605-5600',
  'comptoncity.org/housing',
  'Mon-Fri 8AM-5PM'
),
(
  'CalFresh Food Assistance',
  'calfresh-food-assistance',
  'LA County DPSS',
  'food',
  'Monthly food benefits (EBT card) for eligible families. Easy online application. Benefits typically start within 30 days.',
  'Based on household size and income. Most households under 200% federal poverty level qualify.',
  ARRAY['low_income', 'family', 'food_need'],
  'open',
  NULL,
  true,
  '211 E Alondra Blvd, Compton, CA 90220',
  '(866) 613-3777',
  'benefitscal.com',
  'Mon-Fri 7:30AM-5PM'
),
(
  'Compton Youth Activities League',
  'compton-youth-league',
  'City of Compton Parks & Recreation',
  'youth',
  'Free after-school and weekend sports programs for youth ages 6-17. Basketball, football, soccer, track, and mentorship programs.',
  'Must be ages 6-17. Compton residents get priority enrollment.',
  ARRAY['has_children', 'youth', 'sports'],
  'open',
  NULL,
  true,
  'Lueders Park, 1500 E Greenleaf Blvd, Compton, CA 90221',
  '(310) 605-5620',
  'comptoncity.org/parks',
  'Mon-Sat, varies by program'
),
(
  'Free Legal Aid Clinic',
  'free-legal-aid',
  'Legal Aid Foundation of LA',
  'legal',
  'Free legal consultations for low-income residents. Immigration, housing disputes, family law, and expungement services.',
  'Must meet income guidelines (generally under 200% federal poverty level).',
  ARRAY['low_income', 'legal_need', 'immigration'],
  'open',
  NULL,
  true,
  'Compton Courthouse, 200 W Compton Blvd',
  '(800) 399-4529',
  'lafla.org',
  'Walk-in clinics: Tue & Thu 9AM-12PM'
),
(
  'Senior Services & Meals Program',
  'senior-services',
  'City of Compton',
  'senior',
  'Daily hot meals, transportation assistance, social activities, and wellness programs for Compton seniors 60+.',
  'Must be 60 years or older. Compton resident.',
  ARRAY['senior', 'age_60_plus'],
  'open',
  NULL,
  true,
  'Compton Senior Center, 611 E Compton Blvd',
  '(310) 605-5630',
  'comptoncity.org/seniors',
  'Mon-Fri 8AM-4PM'
),
(
  'GED & Adult Education Classes',
  'ged-adult-education',
  'Compton Adult School',
  'education',
  'Free GED preparation, ESL classes, computer literacy, and vocational training for adults. Day and evening classes available.',
  'Must be 18+. Open to all residents regardless of immigration status.',
  ARRAY['adult_learner', 'esl', 'education'],
  'open',
  NULL,
  true,
  '1104 E Rosecrans Ave, Compton, CA 90221',
  '(310) 639-4321',
  'compton.k12.ca.us/adult',
  'Mon-Thu 8AM-8PM, Fri 8AM-3PM'
);

-- ============================================================
-- POSTS (City Pulse feed)
-- ============================================================
-- Note: These use a placeholder author_id since we don't have real admin users yet.
-- In production, these would be created by authenticated admin/official users.
