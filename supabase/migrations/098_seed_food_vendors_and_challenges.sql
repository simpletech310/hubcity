-- ============================================================
-- Seed: 5 example food vendors + 10 challenges (2 per vendor)
-- ============================================================
-- These are *demo* vendors (owner_id NULL) with photos so the
-- food hub, business detail, and Explore mosaic feel populated.
-- Each vendor has 2 active food challenges so the new vendor +
-- challenge surfaces light up end-to-end.
-- ============================================================

INSERT INTO businesses (
  name, slug, category, description, address, phone, website,
  badges, is_mobile_vendor, is_published, is_featured, hours, image_urls
) VALUES

('Hub City Burger House', 'hub-city-burger-house', 'restaurant',
 'Smashburgers, fries cooked in beef tallow, and shakes. Locally owned, founded by two cousins who grew up in Compton.',
 '1820 N Long Beach Blvd, Compton, CA 90221', '(310) 555-0410', 'hubcityburgers.example.com',
 ARRAY['black_owned','locally_owned'], false, true, true,
 '{"mon":"11:00 AM - 9:00 PM","tue":"11:00 AM - 9:00 PM","wed":"11:00 AM - 9:00 PM","thu":"11:00 AM - 9:00 PM","fri":"11:00 AM - 11:00 PM","sat":"11:00 AM - 11:00 PM","sun":"12:00 PM - 8:00 PM"}'::jsonb,
 ARRAY['https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&q=80']::text[]),

('Compton Soul Wings', 'compton-soul-wings', 'restaurant',
 'Hot, lemon-pepper, garlic-parm, and house BBQ wings. Big sides: mac, greens, candied yams. Wing combos under $12.',
 '600 W Compton Blvd, Compton, CA 90220', '(310) 555-0429', 'comptonsoulwings.example.com',
 ARRAY['black_owned','locally_owned'], false, true, false,
 '{"tue":"11:30 AM - 10:00 PM","wed":"11:30 AM - 10:00 PM","thu":"11:30 AM - 10:00 PM","fri":"11:30 AM - 11:00 PM","sat":"11:30 AM - 11:00 PM","sun":"12:00 PM - 9:00 PM","mon":"Closed"}'::jsonb,
 ARRAY['https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=1200&q=80']::text[]),

('Tía Carmen Tacos', 'tia-carmen-tacos', 'restaurant',
 'Mobile food truck serving al pastor, suadero, and lengua tacos with handmade tortillas. Catch us at South Park weekends.',
 '301 E Cypress St, Compton, CA 90220', '(310) 555-0468', NULL,
 ARRAY['hispanic_owned','women_owned','locally_owned'], true, true, true,
 '{"thu":"5:00 PM - 11:00 PM","fri":"5:00 PM - 12:00 AM","sat":"12:00 PM - 12:00 AM","sun":"12:00 PM - 9:00 PM"}'::jsonb,
 ARRAY['https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=1200&q=80']::text[]),

('Sunrise Plantcake Cafe', 'sunrise-plantcake-cafe', 'restaurant',
 'Vegan brunch & dessert cafe. Vegan pancakes, chickpea benedict, oat-milk lattes, and cake-of-the-day. All made in-house.',
 '2230 N Wilmington Ave, Compton, CA 90222', '(310) 555-0501', 'sunriseplantcake.example.com',
 ARRAY['black_owned','women_owned','locally_owned','eco_friendly'], false, true, false,
 '{"wed":"7:00 AM - 3:00 PM","thu":"7:00 AM - 3:00 PM","fri":"7:00 AM - 3:00 PM","sat":"8:00 AM - 4:00 PM","sun":"8:00 AM - 4:00 PM","mon":"Closed","tue":"Closed"}'::jsonb,
 ARRAY['https://images.unsplash.com/photo-1551024506-0bccd828d307?w=1200&q=80']::text[]),

('Yamashita Ramen Bar', 'yamashita-ramen-bar', 'restaurant',
 'Tonkotsu, miso, and shoyu ramen with hand-pulled noodles. Soft-egg, char siu, and chili oil all made on premises.',
 '4101 E Compton Blvd, Compton, CA 90221', '(310) 555-0573', 'yamashitaramen.example.com',
 ARRAY['locally_owned','family_owned'], false, true, true,
 '{"tue":"11:30 AM - 10:00 PM","wed":"11:30 AM - 10:00 PM","thu":"11:30 AM - 10:00 PM","fri":"11:30 AM - 11:00 PM","sat":"11:30 AM - 11:00 PM","sun":"12:00 PM - 9:00 PM","mon":"Closed"}'::jsonb,
 ARRAY['https://images.unsplash.com/photo-1623341214825-9f4f963727da?w=1200&q=80']::text[])

ON CONFLICT (slug) DO NOTHING;


-- ============================================================
-- 10 challenges — 2 per vendor — using subqueries so the FK
-- resolves whether or not the rows above already existed.
-- ============================================================
INSERT INTO food_challenges (
  business_id, name, slug, description, image_url, challenge_type,
  rules, prize_description, start_date, end_date, is_active, created_by
)
SELECT b.id, x.name, x.slug, x.description, x.image_url, x.challenge_type::text,
       x.rules, x.prize_description, x.start_date::date, x.end_date::date, true,
       COALESCE(
         (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1),
         (SELECT id FROM profiles LIMIT 1)
       )
FROM (VALUES

-- ── Hub City Burger House ────────────────────────────
('hub-city-burger-house',
 'The Quad Buster',
 'quad-buster',
 'Eat the Quad Buster — 4 smash patties, 4 cheese slices, bacon, fries, and a shake — in 25 minutes.',
 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=1200&q=80',
 'eating',
 'No bathroom breaks. Burger, fries, and shake must all be finished. Hands-only.',
 'Free t-shirt + your photo on the wall + your next visit on the house.',
 (CURRENT_DATE)::text, (CURRENT_DATE + INTERVAL '60 days')::text),

('hub-city-burger-house',
 'Burger Passport',
 'hub-city-burger-passport',
 'Try every burger on the menu (8 total) over 60 days. Get a stamp each visit.',
 'https://images.unsplash.com/photo-1550317138-10000687a72b?w=1200&q=80',
 'collection',
 'One stamp per visit. Show staff your passport. Keep your receipts.',
 'Limited-edition Hub City hoodie + a free combo on completion.',
 (CURRENT_DATE)::text, (CURRENT_DATE + INTERVAL '60 days')::text),

-- ── Compton Soul Wings ───────────────────────────────
('compton-soul-wings',
 'Reaper Wing Dare',
 'reaper-wing-dare',
 'Finish 10 Carolina-Reaper hot wings in 8 minutes — no drinks, no napkin, no mercy.',
 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=1200&q=80',
 'eating',
 'No drinks during the challenge. No bathroom break. No bones left uneaten.',
 'Reaper Wall photo + free 10-piece on your next visit.',
 (CURRENT_DATE)::text, (CURRENT_DATE + INTERVAL '45 days')::text),

('compton-soul-wings',
 'Sauce Tour',
 'soul-wings-sauce-tour',
 'Try all 6 sauces (lemon-pepper, hot, BBQ, garlic-parm, mango habanero, honey-gold) and post your ranking.',
 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=1200&q=80',
 'photo',
 'Photo of each sauce required. Caption with your ranking.',
 '$25 gift card + featured on our IG.',
 (CURRENT_DATE)::text, (CURRENT_DATE + INTERVAL '90 days')::text),

-- ── Tía Carmen Tacos ─────────────────────────────────
('tia-carmen-tacos',
 'Trompo Tower',
 'tia-carmen-trompo-tower',
 'Eat 12 al pastor tacos in 30 minutes. Fresh off the trompo, our handmade tortillas.',
 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=1200&q=80',
 'eating',
 'Tortillas, meat, and toppings all eaten. Salsas of your choice.',
 'Free 5-taco plate every Friday for a month.',
 (CURRENT_DATE)::text, (CURRENT_DATE + INTERVAL '30 days')::text),

('tia-carmen-tacos',
 'Salsa Photo Quest',
 'tia-carmen-salsa-photo-quest',
 'Snap a photo with each of our 4 house salsas (verde, roja, habanero, avocado-cilantro).',
 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=1200&q=80',
 'photo',
 'One photo per salsa. Caption tells which is your favorite.',
 '"Salsa Champ" t-shirt + a free order of agua fresca.',
 (CURRENT_DATE)::text, (CURRENT_DATE + INTERVAL '60 days')::text),

-- ── Sunrise Plantcake Cafe ───────────────────────────
('sunrise-plantcake-cafe',
 'Stack of Five',
 'sunrise-stack-of-five',
 'Eat our 5-stack vegan pancake tower with maple, berries, and whipped coconut cream in 20 minutes.',
 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=1200&q=80',
 'eating',
 'Toppings included. Coffee + water OK.',
 'Free brunch for two.',
 (CURRENT_DATE)::text, (CURRENT_DATE + INTERVAL '45 days')::text),

('sunrise-plantcake-cafe',
 'Cake of the Day Tour',
 'sunrise-cake-tour',
 'Try a slice of every Cake of the Day for 7 days in a row. Post a photo each visit.',
 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=1200&q=80',
 'photo',
 'One photo per visit (with date stamp). 7 consecutive days.',
 'A whole birthday cake (8") on the house.',
 (CURRENT_DATE)::text, (CURRENT_DATE + INTERVAL '90 days')::text),

-- ── Yamashita Ramen Bar ──────────────────────────────
('yamashita-ramen-bar',
 'Spicy Tonkotsu Inferno',
 'yamashita-spicy-tonkotsu-inferno',
 'Finish a level-5 spicy tonkotsu (broth & noodles) in 15 minutes.',
 'https://images.unsplash.com/photo-1623341214825-9f4f963727da?w=1200&q=80',
 'eating',
 'Broth must be drunk to last drop. No swapping out toppings.',
 'Limited "Inferno Survivor" hat + a free standard ramen.',
 (CURRENT_DATE)::text, (CURRENT_DATE + INTERVAL '30 days')::text),

('yamashita-ramen-bar',
 'Ramen Passport',
 'yamashita-ramen-passport',
 'Try all 6 of our ramen styles (tonkotsu, miso, shoyu, shio, tantanmen, vegan-shiitake) over 60 days.',
 'https://images.unsplash.com/photo-1557872943-16a5ac26437e?w=1200&q=80',
 'collection',
 'Show staff your passport each visit. One stamp per ramen style.',
 'A fully stamped passport gets you a free chashu donburi.',
 (CURRENT_DATE)::text, (CURRENT_DATE + INTERVAL '60 days')::text)

) AS x(business_slug, name, slug, description, image_url, challenge_type, rules, prize_description, start_date, end_date)
JOIN businesses b ON b.slug = x.business_slug
ON CONFLICT (slug) DO NOTHING;
