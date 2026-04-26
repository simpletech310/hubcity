-- ============================================================
-- Seed: 5 example food vendors + 10 challenges (2 per vendor)
-- ============================================================
-- IMPORTANT: This file is paste-safe. It avoids
--   * table.column references like b.id (some chat clients
--     auto-link those into markdown URLs and break the paste)
--   * example.com URLs (same reason)
-- Uses inline subqueries instead of JOIN aliases.
-- ============================================================

INSERT INTO businesses (
  name, slug, category, description, address, phone, website,
  badges, is_mobile_vendor, is_published, is_featured, hours, image_urls
) VALUES

('Hub City Burger House', 'hub-city-burger-house', 'restaurant',
 'Smashburgers, fries cooked in beef tallow, and shakes. Locally owned, founded by two cousins who grew up in Compton.',
 '1820 N Long Beach Blvd, Compton, CA 90221', '(310) 555-0410', NULL,
 ARRAY['black_owned','locally_owned'], false, true, true,
 '{"mon":"11:00 AM - 9:00 PM","tue":"11:00 AM - 9:00 PM","wed":"11:00 AM - 9:00 PM","thu":"11:00 AM - 9:00 PM","fri":"11:00 AM - 11:00 PM","sat":"11:00 AM - 11:00 PM","sun":"12:00 PM - 8:00 PM"}'::jsonb,
 ARRAY['https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&q=80']::text[]),

('Compton Soul Wings', 'compton-soul-wings', 'restaurant',
 'Hot, lemon-pepper, garlic-parm, and house BBQ wings. Big sides: mac, greens, candied yams. Wing combos under $12.',
 '600 W Compton Blvd, Compton, CA 90220', '(310) 555-0429', NULL,
 ARRAY['black_owned','locally_owned'], false, true, false,
 '{"tue":"11:30 AM - 10:00 PM","wed":"11:30 AM - 10:00 PM","thu":"11:30 AM - 10:00 PM","fri":"11:30 AM - 11:00 PM","sat":"11:30 AM - 11:00 PM","sun":"12:00 PM - 9:00 PM","mon":"Closed"}'::jsonb,
 ARRAY['https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=1200&q=80']::text[]),

('Tia Carmen Tacos', 'tia-carmen-tacos', 'restaurant',
 'Mobile food truck serving al pastor, suadero, and lengua tacos with handmade tortillas. Catch us at South Park weekends.',
 '301 E Cypress St, Compton, CA 90220', '(310) 555-0468', NULL,
 ARRAY['hispanic_owned','women_owned','locally_owned'], true, true, true,
 '{"thu":"5:00 PM - 11:00 PM","fri":"5:00 PM - 12:00 AM","sat":"12:00 PM - 12:00 AM","sun":"12:00 PM - 9:00 PM"}'::jsonb,
 ARRAY['https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=1200&q=80']::text[]),

('Sunrise Plantcake Cafe', 'sunrise-plantcake-cafe', 'restaurant',
 'Vegan brunch and dessert cafe. Vegan pancakes, chickpea benedict, oat-milk lattes, and cake-of-the-day. All made in-house.',
 '2230 N Wilmington Ave, Compton, CA 90222', '(310) 555-0501', NULL,
 ARRAY['black_owned','women_owned','locally_owned','eco_friendly'], false, true, false,
 '{"wed":"7:00 AM - 3:00 PM","thu":"7:00 AM - 3:00 PM","fri":"7:00 AM - 3:00 PM","sat":"8:00 AM - 4:00 PM","sun":"8:00 AM - 4:00 PM","mon":"Closed","tue":"Closed"}'::jsonb,
 ARRAY['https://images.unsplash.com/photo-1551024506-0bccd828d307?w=1200&q=80']::text[]),

('Yamashita Ramen Bar', 'yamashita-ramen-bar', 'restaurant',
 'Tonkotsu, miso, and shoyu ramen with hand-pulled noodles. Soft-egg, char siu, and chili oil all made on premises.',
 '4101 E Compton Blvd, Compton, CA 90221', '(310) 555-0573', NULL,
 ARRAY['locally_owned','family_owned'], false, true, true,
 '{"tue":"11:30 AM - 10:00 PM","wed":"11:30 AM - 10:00 PM","thu":"11:30 AM - 10:00 PM","fri":"11:30 AM - 11:00 PM","sat":"11:30 AM - 11:00 PM","sun":"12:00 PM - 9:00 PM","mon":"Closed"}'::jsonb,
 ARRAY['https://images.unsplash.com/photo-1623341214825-9f4f963727da?w=1200&q=80']::text[])

ON CONFLICT (slug) DO NOTHING;


-- ============================================================
-- 10 challenges — 2 per vendor — written as straight INSERTs
-- with inline subqueries so no table aliases (b.id / x.name)
-- get auto-linkified during a copy/paste.
-- ============================================================

-- Hub City Burger House
INSERT INTO food_challenges (
  business_id, name, slug, description, image_url, challenge_type,
  rules, prize_description, start_date, end_date, is_active, created_by
) VALUES
((SELECT id FROM businesses WHERE slug = 'hub-city-burger-house'),
 'The Quad Buster', 'quad-buster',
 'Eat the Quad Buster — 4 smash patties, 4 cheese slices, bacon, fries, and a shake — in 25 minutes.',
 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=1200&q=80',
 'eating',
 'No bathroom breaks. Burger, fries, and shake must all be finished. Hands-only.',
 'Free t-shirt + your photo on the wall + your next visit on the house.',
 CURRENT_DATE, CURRENT_DATE + INTERVAL '60 days', true,
 COALESCE((SELECT id FROM profiles WHERE role = 'admin' LIMIT 1),
          (SELECT id FROM profiles LIMIT 1))),
((SELECT id FROM businesses WHERE slug = 'hub-city-burger-house'),
 'Burger Passport', 'hub-city-burger-passport',
 'Try every burger on the menu (8 total) over 60 days. Get a stamp each visit.',
 'https://images.unsplash.com/photo-1550317138-10000687a72b?w=1200&q=80',
 'collection',
 'One stamp per visit. Show staff your passport. Keep your receipts.',
 'Limited-edition Hub City hoodie + a free combo on completion.',
 CURRENT_DATE, CURRENT_DATE + INTERVAL '60 days', true,
 COALESCE((SELECT id FROM profiles WHERE role = 'admin' LIMIT 1),
          (SELECT id FROM profiles LIMIT 1)))
ON CONFLICT (slug) DO NOTHING;

-- Compton Soul Wings
INSERT INTO food_challenges (
  business_id, name, slug, description, image_url, challenge_type,
  rules, prize_description, start_date, end_date, is_active, created_by
) VALUES
((SELECT id FROM businesses WHERE slug = 'compton-soul-wings'),
 'Reaper Wing Dare', 'reaper-wing-dare',
 'Finish 10 Carolina-Reaper hot wings in 8 minutes — no drinks, no napkin, no mercy.',
 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=1200&q=80',
 'eating',
 'No drinks during the challenge. No bathroom break. No bones left uneaten.',
 'Reaper Wall photo + free 10-piece on your next visit.',
 CURRENT_DATE, CURRENT_DATE + INTERVAL '45 days', true,
 COALESCE((SELECT id FROM profiles WHERE role = 'admin' LIMIT 1),
          (SELECT id FROM profiles LIMIT 1))),
((SELECT id FROM businesses WHERE slug = 'compton-soul-wings'),
 'Sauce Tour', 'soul-wings-sauce-tour',
 'Try all 6 sauces (lemon-pepper, hot, BBQ, garlic-parm, mango habanero, honey-gold) and post your ranking.',
 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=1200&q=80',
 'photo',
 'Photo of each sauce required. Caption with your ranking.',
 '$25 gift card + featured on our IG.',
 CURRENT_DATE, CURRENT_DATE + INTERVAL '90 days', true,
 COALESCE((SELECT id FROM profiles WHERE role = 'admin' LIMIT 1),
          (SELECT id FROM profiles LIMIT 1)))
ON CONFLICT (slug) DO NOTHING;

-- Tia Carmen Tacos
INSERT INTO food_challenges (
  business_id, name, slug, description, image_url, challenge_type,
  rules, prize_description, start_date, end_date, is_active, created_by
) VALUES
((SELECT id FROM businesses WHERE slug = 'tia-carmen-tacos'),
 'Trompo Tower', 'tia-carmen-trompo-tower',
 'Eat 12 al pastor tacos in 30 minutes. Fresh off the trompo, our handmade tortillas.',
 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=1200&q=80',
 'eating',
 'Tortillas, meat, and toppings all eaten. Salsas of your choice.',
 'Free 5-taco plate every Friday for a month.',
 CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', true,
 COALESCE((SELECT id FROM profiles WHERE role = 'admin' LIMIT 1),
          (SELECT id FROM profiles LIMIT 1))),
((SELECT id FROM businesses WHERE slug = 'tia-carmen-tacos'),
 'Salsa Photo Quest', 'tia-carmen-salsa-photo-quest',
 'Snap a photo with each of our 4 house salsas (verde, roja, habanero, avocado-cilantro).',
 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=1200&q=80',
 'photo',
 'One photo per salsa. Caption tells which is your favorite.',
 'Salsa Champ t-shirt + a free order of agua fresca.',
 CURRENT_DATE, CURRENT_DATE + INTERVAL '60 days', true,
 COALESCE((SELECT id FROM profiles WHERE role = 'admin' LIMIT 1),
          (SELECT id FROM profiles LIMIT 1)))
ON CONFLICT (slug) DO NOTHING;

-- Sunrise Plantcake Cafe
INSERT INTO food_challenges (
  business_id, name, slug, description, image_url, challenge_type,
  rules, prize_description, start_date, end_date, is_active, created_by
) VALUES
((SELECT id FROM businesses WHERE slug = 'sunrise-plantcake-cafe'),
 'Stack of Five', 'sunrise-stack-of-five',
 'Eat our 5-stack vegan pancake tower with maple, berries, and whipped coconut cream in 20 minutes.',
 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=1200&q=80',
 'eating',
 'Toppings included. Coffee + water OK.',
 'Free brunch for two.',
 CURRENT_DATE, CURRENT_DATE + INTERVAL '45 days', true,
 COALESCE((SELECT id FROM profiles WHERE role = 'admin' LIMIT 1),
          (SELECT id FROM profiles LIMIT 1))),
((SELECT id FROM businesses WHERE slug = 'sunrise-plantcake-cafe'),
 'Cake of the Day Tour', 'sunrise-cake-tour',
 'Try a slice of every Cake of the Day for 7 days in a row. Post a photo each visit.',
 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=1200&q=80',
 'photo',
 'One photo per visit (with date stamp). 7 consecutive days.',
 'A whole birthday cake (8 inch) on the house.',
 CURRENT_DATE, CURRENT_DATE + INTERVAL '90 days', true,
 COALESCE((SELECT id FROM profiles WHERE role = 'admin' LIMIT 1),
          (SELECT id FROM profiles LIMIT 1)))
ON CONFLICT (slug) DO NOTHING;

-- Yamashita Ramen Bar
INSERT INTO food_challenges (
  business_id, name, slug, description, image_url, challenge_type,
  rules, prize_description, start_date, end_date, is_active, created_by
) VALUES
((SELECT id FROM businesses WHERE slug = 'yamashita-ramen-bar'),
 'Spicy Tonkotsu Inferno', 'yamashita-spicy-tonkotsu-inferno',
 'Finish a level-5 spicy tonkotsu (broth and noodles) in 15 minutes.',
 'https://images.unsplash.com/photo-1623341214825-9f4f963727da?w=1200&q=80',
 'eating',
 'Broth must be drunk to last drop. No swapping out toppings.',
 'Limited Inferno Survivor hat + a free standard ramen.',
 CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', true,
 COALESCE((SELECT id FROM profiles WHERE role = 'admin' LIMIT 1),
          (SELECT id FROM profiles LIMIT 1))),
((SELECT id FROM businesses WHERE slug = 'yamashita-ramen-bar'),
 'Ramen Passport', 'yamashita-ramen-passport',
 'Try all 6 of our ramen styles (tonkotsu, miso, shoyu, shio, tantanmen, vegan-shiitake) over 60 days.',
 'https://images.unsplash.com/photo-1557872943-16a5ac26437e?w=1200&q=80',
 'collection',
 'Show staff your passport each visit. One stamp per ramen style.',
 'A fully stamped passport gets you a free chashu donburi.',
 CURRENT_DATE, CURRENT_DATE + INTERVAL '60 days', true,
 COALESCE((SELECT id FROM profiles WHERE role = 'admin' LIMIT 1),
          (SELECT id FROM profiles LIMIT 1)))
ON CONFLICT (slug) DO NOTHING;
