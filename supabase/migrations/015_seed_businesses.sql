-- ============================================================
-- Hub City App: Seed Compton Businesses
-- All real local businesses from directory research
-- Badges: black_owned, hispanic_owned, women_owned, veteran_owned, locally_owned
-- owner_id is NULL (linked when real owners sign up)
-- ============================================================

-- Skip chains (McDonald's, KFC, etc.) — focus on local/independent businesses

INSERT INTO businesses (name, slug, category, description, address, phone, website, badges, is_mobile_vendor, is_published, is_featured, hours, image_urls)
VALUES

-- ===================== RESTAURANTS =====================

-- MEXICAN / TAQUERIAS
('CH Y La Birria', 'ch-y-la-birria', 'restaurant',
 'Authentic Mexican birria specialist. Known for quesabirria tacos, birria bowl, ramen birria. Tacos in 10 minutes or less.',
 '909 S Central Ave, Ste 106, Compton, CA 90220', '(310) 629-2013', 'mexicanrestaurantcompton.com',
 ARRAY['hispanic_owned', 'locally_owned'], false, true, false,
 '{"tue":"10:00 AM - 8:00 PM","wed":"10:00 AM - 8:00 PM","thu":"10:00 AM - 8:00 PM","fri":"10:00 AM - 8:00 PM","sat":"10:00 AM - 8:00 PM","sun":"10:00 AM - 8:00 PM","mon":"Closed"}'::jsonb,
 ARRAY[]::text[]),

('Los Sombreros Restaurant', 'los-sombreros-restaurant', 'restaurant',
 'Traditional Mexican restaurant with breakfast and brunch options. Featured on Shop Compton and Compton Roundtable directories.',
 '609 N Long Beach Blvd, Compton, CA 90221', '(310) 763-1018', NULL,
 ARRAY['hispanic_owned', 'locally_owned'], false, true, false,
 '{"mon":"8:00 AM - 7:00 PM","tue":"8:00 AM - 7:00 PM","wed":"8:00 AM - 7:00 PM","thu":"8:00 AM - 7:00 PM","fri":"8:00 AM - 7:00 PM"}'::jsonb,
 ARRAY[]::text[]),

('Taqueria El Poblano Estilo Tijuana', 'taqueria-el-poblano', 'restaurant',
 'TJ-style asada tacos. Founded by Daniel Alonso, known as one of LA''s originals in Poblano TJ-style tacos. 5+ years in Compton, expanding.',
 '4253 E Compton Blvd, Compton, CA 90221', NULL, 'taqueriaelpoblano.com',
 ARRAY['hispanic_owned', 'locally_owned'], false, true, true,
 '{"mon":"10:00 AM - 11:00 PM","tue":"10:00 AM - 11:00 PM","wed":"10:00 AM - 11:00 PM","thu":"10:00 AM - 11:00 PM","fri":"10:00 AM - 12:00 AM","sat":"10:00 AM - 12:00 AM","sun":"10:00 AM - 11:00 PM"}'::jsonb,
 ARRAY[]::text[]),

('El Primo Mexican Food', 'el-primo-mexican-food', 'restaurant',
 'Made-from-scratch Mexican food, breakfast through dinner. Offers catering services.',
 '855 W Victoria St, Ste A3, Compton, CA 90220', NULL, 'elprimomexicanfood.com',
 ARRAY['hispanic_owned', 'locally_owned'], false, true, false,
 '{"mon":"7:00 AM - 9:00 PM","tue":"7:00 AM - 9:00 PM","wed":"7:00 AM - 9:00 PM","thu":"7:00 AM - 9:00 PM","fri":"7:00 AM - 9:00 PM","sat":"7:00 AM - 6:00 PM","sun":"9:00 AM - 6:00 PM"}'::jsonb,
 ARRAY[]::text[]),

('Antojitos Los Cuates', 'antojitos-los-cuates', 'restaurant',
 'Jalisco-style Mexican. Named one of the best taco spots in Compton by L.A. Taco. Known for tacos de requeson.',
 '1811 N Long Beach Blvd, Compton, CA 90221', '(562) 442-5103', 'antojitosloscuatesca.com',
 ARRAY['hispanic_owned', 'locally_owned'], false, true, true,
 '{"tue":"9:00 AM - 9:00 PM","wed":"9:00 AM - 9:00 PM","thu":"9:00 AM - 9:00 PM","fri":"9:00 AM - 9:00 PM","sat":"8:00 AM - 9:00 PM","sun":"8:00 AM - 9:00 PM"}'::jsonb,
 ARRAY[]::text[]),

('Birrieria Barajas', 'birrieria-barajas', 'restaurant',
 'Authentic birria. Early morning hours, popular weekend spot.',
 '4214 E Compton Blvd, Compton, CA 90220', '(331) 250-9242', NULL,
 ARRAY['hispanic_owned', 'locally_owned'], false, true, false,
 '{"tue":"7:00 AM - 2:00 PM","wed":"7:00 AM - 2:00 PM","thu":"7:00 AM - 2:00 PM","fri":"7:00 AM - 2:00 PM","sat":"7:00 AM - 5:00 PM","sun":"7:00 AM - 5:00 PM","mon":"Closed"}'::jsonb,
 ARRAY[]::text[]),

('El Pollo Dorado', 'el-pollo-dorado', 'restaurant',
 'Mexican-style rotisserie chicken plates. Local favorite for affordable chicken meals.',
 '1301 E Rosecrans Ave, Ste 110, Compton, CA 90221', '(310) 638-9886', NULL,
 ARRAY['hispanic_owned', 'locally_owned'], false, true, false,
 '{"mon":"10:00 AM - 9:00 PM","tue":"10:00 AM - 9:00 PM","wed":"10:00 AM - 9:00 PM","thu":"10:00 AM - 9:00 PM","fri":"10:00 AM - 9:00 PM"}'::jsonb,
 ARRAY[]::text[]),

('Taqueria La Frontera', 'taqueria-la-frontera', 'restaurant',
 'Traditional tacos and Mexican dishes.',
 '2100 N Santa Fe Ave, Compton, CA 90222', '(310) 933-8130', 'taquerialafronteraca.com',
 ARRAY['hispanic_owned', 'locally_owned'], false, true, false,
 '{"mon":"10:00 AM - 7:00 PM","tue":"10:00 AM - 7:00 PM","wed":"10:00 AM - 7:00 PM","thu":"10:00 AM - 7:00 PM","fri":"10:00 AM - 7:00 PM","sat":"10:00 AM - 7:00 PM","sun":"9:00 AM - 5:00 PM"}'::jsonb,
 ARRAY[]::text[]),

('El Super Alberto Mexican Food', 'el-super-alberto', 'restaurant',
 'Burritos, combo plates, late-night Mexican food.',
 '701 E Alondra Blvd, Compton, CA 90221', NULL, NULL,
 ARRAY['hispanic_owned', 'locally_owned'], false, true, false,
 '{"mon":"7:00 AM - 10:00 PM","tue":"7:00 AM - 10:00 PM","wed":"7:00 AM - 10:00 PM","thu":"7:00 AM - 10:00 PM","fri":"7:00 AM - 10:00 PM","sat":"7:00 AM - 10:00 PM","sun":"7:00 AM - 10:00 PM"}'::jsonb,
 ARRAY[]::text[]),

('Las Comadres #2', 'las-comadres-2', 'restaurant',
 'Traditional Mexican taqueria. Also has La Mirada location.',
 'Compton, CA 90221', '(310) 933-8688', 'taqueriacomadres.com',
 ARRAY['hispanic_owned', 'locally_owned'], false, true, false,
 '{"mon":"10:00 AM - 5:00 PM","tue":"10:00 AM - 5:00 PM","thu":"10:00 AM - 5:00 PM","fri":"10:00 AM - 5:00 PM","sat":"9:00 AM - 3:00 PM","sun":"9:00 AM - 2:00 PM","wed":"Closed"}'::jsonb,
 ARRAY[]::text[]),

('La Quinta Real', 'la-quinta-real', 'restaurant',
 'Mexican food with live music and nightclub atmosphere.',
 '400 E Compton Blvd, Compton, CA 90221', '(310) 635-5256', 'laquintareal.com',
 ARRAY['hispanic_owned', 'locally_owned'], false, true, false,
 '{"sat":"8:00 PM - 2:00 AM"}'::jsonb,
 ARRAY[]::text[]),

-- SALVADORAN
('El Cielo Restaurant', 'el-cielo-restaurant', 'restaurant',
 'Salvadoran cuisine. Featured on Compton Roundtable.',
 '2020 N Santa Fe Ave, Compton, CA 90221', '(424) 785-7393', 'elcielorestaurantca.com',
 ARRAY['hispanic_owned', 'locally_owned'], false, true, false,
 '{"mon":"8:00 AM - 8:00 PM","tue":"8:00 AM - 8:00 PM","wed":"8:00 AM - 8:00 PM","thu":"8:00 AM - 8:00 PM","fri":"8:00 AM - 8:00 PM","sat":"8:00 AM - 8:00 PM","sun":"8:00 AM - 8:00 PM"}'::jsonb,
 ARRAY[]::text[]),

-- ITALIAN
('Ferraro''s On The Hill', 'ferraros-on-the-hill', 'restaurant',
 'Italian pasta, pizza, calzones, salads, desserts. Dine-in, take-out, delivery, and catering.',
 '901 W Victoria St, Ste A1, Compton, CA 90220', '(310) 885-3465', 'eatatferraros.com',
 ARRAY['locally_owned'], false, true, false,
 '{"mon":"9:00 AM - 7:00 PM","tue":"9:00 AM - 7:00 PM","wed":"9:00 AM - 7:00 PM","thu":"9:00 AM - 7:00 PM","fri":"9:00 AM - 7:00 PM"}'::jsonb,
 ARRAY[]::text[]),

-- BURGERS & AMERICAN
('Billionaire Burger Boyz', 'billionaire-burger-boyz', 'restaurant',
 'Gourmet burgers, jambalaya fries, wings. Started as a food truck and grew into a brick-and-mortar. Known throughout LA.',
 '811 S Long Beach Blvd, Compton, CA 90221', '(310) 554-4116', NULL,
 ARRAY['black_owned', 'locally_owned'], false, true, true,
 '{"mon":"11:00 AM - 8:00 PM","tue":"11:00 AM - 8:00 PM","wed":"11:00 AM - 8:00 PM","thu":"11:00 AM - 8:00 PM","fri":"11:00 AM - 8:00 PM","sat":"11:00 AM - 8:00 PM","sun":"11:00 AM - 8:00 PM"}'::jsonb,
 ARRAY[]::text[]),

('Louis Burgers II', 'louis-burgers-ii', 'restaurant',
 'Cheeseburgers, chili cheese fries, pastrami sandwiches. Operating since 1984, a true Compton institution. Late-night hours.',
 '1501 E Rosecrans Ave, Compton, CA 90221', '(310) 603-9547', NULL,
 ARRAY['locally_owned'], false, true, true,
 '{"mon":"7:00 AM - 2:00 AM","tue":"7:00 AM - 2:00 AM","wed":"7:00 AM - 2:00 AM","thu":"7:00 AM - 2:00 AM","fri":"7:00 AM - 3:00 AM","sat":"7:00 AM - 3:00 AM","sun":"7:00 AM - 2:00 AM"}'::jsonb,
 ARRAY[]::text[]),

('Tam''s Burgers', 'tams-burgers-rosecrans', 'restaurant',
 'Quick-serve burgers, breakfast items, Southern California comfort food. Part of the Tam''s Burgers chain, a SoCal institution.',
 '1201 W Rosecrans Ave, Compton, CA 90222', '(310) 537-8478', NULL,
 ARRAY['locally_owned'], false, true, false,
 '{"mon":"6:00 AM - 12:00 AM","tue":"6:00 AM - 12:00 AM","wed":"6:00 AM - 12:00 AM","thu":"6:00 AM - 12:00 AM","fri":"6:00 AM - 12:00 AM"}'::jsonb,
 ARRAY[]::text[]),

('Tam''s Burgers No. 23', 'tams-burgers-23', 'restaurant',
 'Quick-serve burgers, breakfast items. Part of the Tam''s Burgers SoCal institution.',
 '303 N Alameda St, Compton, CA 90220', '(310) 639-3045', NULL,
 ARRAY['locally_owned'], false, true, false,
 '{"mon":"6:00 AM - 10:00 PM","tue":"6:00 AM - 10:00 PM","wed":"6:00 AM - 10:00 PM","thu":"6:00 AM - 10:00 PM","fri":"6:00 AM - 10:00 PM"}'::jsonb,
 ARRAY[]::text[]),

('Tom''s Jr', 'toms-jr', 'restaurant',
 'Burgers and quick-serve American food.',
 '1725 N Long Beach Blvd, Compton, CA 90221', NULL, NULL,
 ARRAY['locally_owned'], false, true, false, '{}'::jsonb, ARRAY[]::text[]),

-- SOUL FOOD
('Alma''s Place', 'almas-place', 'restaurant',
 'Fried chicken, mac and cheese, desserts. Alma is known throughout Compton as a great cook. Opened November 2016. Takeout and delivery.',
 '312 W Compton Blvd, Ste 102, Compton, CA 90220', '(424) 381-4410', 'almasplace.net',
 ARRAY['black_owned', 'women_owned', 'locally_owned'], false, true, true,
 '{"thu":"11:00 AM - 5:00 PM","fri":"11:00 AM - 5:00 PM","sat":"11:00 AM - 5:00 PM","sun":"11:00 AM - 5:00 PM"}'::jsonb,
 ARRAY[]::text[]),

('B-B-Q & Soul', 'bbq-and-soul', 'restaurant',
 'Combination of BBQ and soul food.',
 '2725 N Wilmington Ave, Compton, CA 90222', NULL, NULL,
 ARRAY['black_owned', 'locally_owned'], false, true, false, '{}'::jsonb, ARRAY[]::text[]),

-- BBQ
('Kitchen''s Corner BBQ', 'kitchens-corner-bbq', 'restaurant',
 'Smoked meats, Dino ribs, brisket. Started as a pop-up. Viral on TikTok for best BBQ in Compton.',
 '4420 E Rose St, Compton, CA 90221', NULL, 'kitchenscornerbbq.com',
 ARRAY['black_owned', 'locally_owned'], false, true, true,
 '{"thu":"11:00 AM - 7:00 PM","fri":"11:00 AM - 7:00 PM","sat":"11:00 AM - 7:00 PM","sun":"11:00 AM - 7:00 PM"}'::jsonb,
 ARRAY[]::text[]),

('Johnson Brothers BBQ', 'johnson-brothers-bbq', 'restaurant',
 'Ribs, rib tips, whole chickens, pulled pork. Offers takeout, delivery, and catering for all events.',
 '1710 E Compton Blvd, Compton, CA 90221', '(310) 933-8803', 'johnsonbrothersbbq.com',
 ARRAY['black_owned', 'locally_owned'], false, true, true,
 '{"mon":"11:00 AM - 6:00 PM","tue":"11:00 AM - 8:00 PM","wed":"11:00 AM - 8:00 PM","thu":"11:00 AM - 8:00 PM","fri":"11:00 AM - 8:00 PM","sat":"11:00 AM - 8:00 PM","sun":"12:00 PM - 6:00 PM"}'::jsonb,
 ARRAY[]::text[]),

-- SEAFOOD
('Fishbone Seafood', 'fishbone-seafood', 'restaurant',
 'Fresh fish fry, po''boys, gumbo. Fast casual format, multiple locations.',
 '162 E Compton Blvd, Unit A, Compton, CA 90220', '(310) 933-8868', 'fishboneseafood.com',
 ARRAY['black_owned', 'locally_owned'], false, true, true,
 '{"mon":"11:00 AM - 8:00 PM","tue":"11:00 AM - 8:00 PM","wed":"11:00 AM - 8:00 PM","thu":"11:00 AM - 8:00 PM","fri":"11:00 AM - 8:00 PM","sat":"11:00 AM - 8:00 PM","sun":"12:00 PM - 7:00 PM"}'::jsonb,
 ARRAY[]::text[]),

('Compton''s Original Seafood & Chicken', 'comptons-original-seafood', 'restaurant',
 'Fish fry, chicken in specialty flavors (sweet heat, hot buffalo, honey bbq, lemon pepper). Opened April 2024. Family meals available.',
 '1526 S Wilmington Ave, Compton, CA 90220', '(310) 631-8989', 'comptonsoriginalseafood.com',
 ARRAY['black_owned', 'locally_owned'], false, true, false,
 '{"tue":"11:00 AM - 6:00 PM","wed":"11:00 AM - 6:00 PM","thu":"11:00 AM - 6:00 PM","fri":"11:00 AM - 7:00 PM","sat":"11:00 AM - 7:00 PM","sun":"12:00 PM - 5:00 PM","mon":"Closed"}'::jsonb,
 ARRAY[]::text[]),

('Central Fish Market', 'central-fish-market', 'restaurant',
 'Fresh seafood market and restaurant.',
 '1724 W Rosecrans Ave, Compton, CA 90220', '(310) 537-5126', NULL,
 ARRAY['locally_owned'], false, true, false,
 '{"mon":"10:00 AM - 9:00 PM","tue":"10:00 AM - 9:00 PM","wed":"10:00 AM - 9:00 PM","thu":"10:00 AM - 9:00 PM","fri":"10:00 AM - 9:30 PM","sat":"10:00 AM - 9:30 PM"}'::jsonb,
 ARRAY[]::text[]),

('Compton Fish Market', 'compton-fish-market', 'restaurant',
 'Fresh fish and seafood market.',
 '116 N Long Beach Blvd, Compton, CA 90221', '(310) 632-1871', NULL,
 ARRAY['locally_owned'], false, true, false,
 '{"mon":"11:00 AM - 7:00 PM","tue":"11:00 AM - 7:00 PM","wed":"11:00 AM - 7:00 PM","thu":"11:00 AM - 7:00 PM","fri":"11:00 AM - 7:30 PM","sat":"11:00 AM - 7:00 PM","sun":"12:00 PM - 6:00 PM"}'::jsonb,
 ARRAY[]::text[]),

('Matt''s Fish Market', 'matts-fish-market', 'restaurant',
 'Fresh fish market with prepared food.',
 '123 N Wilmington Ave, Compton, CA 90220', NULL, NULL,
 ARRAY['locally_owned'], false, true, false, '{}'::jsonb, ARRAY[]::text[]),

('Krab Kingz', 'krab-kingz', 'restaurant',
 'Cajun-style crab and seafood boils.',
 '918 S Central Ave, Compton, CA 90220', NULL, NULL,
 ARRAY['black_owned', 'locally_owned'], false, true, false, '{}'::jsonb, ARRAY[]::text[]),

('Mariscos El Tambo', 'mariscos-el-tambo', 'restaurant',
 'Mexican-style seafood dishes.',
 '711 S Willowbrook Ave, Compton, CA 90220', NULL, NULL,
 ARRAY['hispanic_owned', 'locally_owned'], false, true, false, '{}'::jsonb, ARRAY[]::text[]),

('Mariscos Las Islas Marias', 'mariscos-las-islas-marias', 'restaurant',
 'Mexican seafood, shrimp cocktails.',
 '627 W Rosecrans Ave, Compton, CA 90222', NULL, NULL,
 ARRAY['hispanic_owned', 'locally_owned'], false, true, false, '{}'::jsonb, ARRAY[]::text[]),

('General Seafood Meats and More', 'general-seafood-meats', 'restaurant',
 'Wholesale and retail seafood and meats.',
 '15002 Avalon Blvd, Compton, CA 90220', NULL, NULL,
 ARRAY['locally_owned'], false, true, false,
 '{"mon":"7:00 AM - 4:00 PM","tue":"7:00 AM - 4:00 PM","wed":"7:00 AM - 4:00 PM","thu":"7:00 AM - 4:00 PM","fri":"7:00 AM - 4:00 PM","sat":"7:00 AM - 4:00 PM"}'::jsonb,
 ARRAY[]::text[]),

-- ASIAN / KOREAN / JAPANESE
('Kumi Ko', 'kumi-ko-sushi', 'restaurant',
 'Authentic Japanese sushi and rolls at affordable prices. Family-owned. Vegan and vegetarian options.',
 '1300 S Long Beach Blvd, Compton, CA 90221', '(310) 438-1616', 'kumikosushi.com',
 ARRAY['locally_owned'], false, true, false,
 '{"mon":"11:00 AM - 8:00 PM","tue":"11:00 AM - 8:00 PM","thu":"11:00 AM - 8:00 PM","fri":"11:00 AM - 8:30 PM","sat":"12:00 PM - 8:30 PM","wed":"Closed"}'::jsonb,
 ARRAY[]::text[]),

('ON+ON Fresh Korean Kitchen', 'on-on-korean-kitchen', 'restaurant',
 'Fresh Korean dishes. Also has a Torrance location.',
 '1795 S Alameda St, Ste 102, Compton, CA 90220', '(424) 338-6602', 'ononkitchen.com',
 ARRAY['locally_owned'], false, true, false,
 '{"mon":"10:30 AM - 9:00 PM","tue":"10:30 AM - 9:00 PM","wed":"10:30 AM - 9:00 PM","thu":"10:30 AM - 9:00 PM","fri":"10:30 AM - 9:00 PM","sat":"10:30 AM - 9:00 PM","sun":"10:30 AM - 9:00 PM"}'::jsonb,
 ARRAY[]::text[]),

('Phat Noodles', 'phat-noodles', 'restaurant',
 'Cambodian-style noodle dishes. Unique Cambodian cuisine option in Compton.',
 '104 E Compton Blvd, Compton, CA 90220', '(424) 338-6844', NULL,
 ARRAY['locally_owned'], false, true, false, '{}'::jsonb, ARRAY[]::text[]),

('China Express', 'china-express', 'restaurant',
 'Chinese takeout and delivery.',
 '855 W Victoria St, Compton, CA 90220', '(310) 631-8281', 'chinaexpresscompton.com',
 ARRAY['locally_owned'], false, true, false, '{}'::jsonb, ARRAY[]::text[]),

('Egg Roll King', 'egg-roll-king', 'restaurant',
 'Egg rolls and Chinese-American food.',
 '219 E Compton Blvd, Compton, CA 90220', '(310) 639-1707', NULL,
 ARRAY['locally_owned'], false, true, false, '{}'::jsonb, ARRAY[]::text[]),

-- PIZZA (local only)
('Billionaire Pizza Company', 'billionaire-pizza-company', 'restaurant',
 'Pizza and specialty pies.',
 '1101 E Compton Blvd, Ste A, Compton, CA 90221', '(310) 635-4876', NULL,
 ARRAY['locally_owned'], false, true, false,
 '{"tue":"12:00 PM - 8:00 PM","wed":"12:00 PM - 8:00 PM","thu":"12:00 PM - 8:00 PM","fri":"12:00 PM - 8:00 PM","sat":"12:00 PM - 8:00 PM","sun":"12:00 PM - 8:00 PM","mon":"Closed"}'::jsonb,
 ARRAY[]::text[]),

('Pizza King', 'pizza-king', 'restaurant',
 'Fresh-made pizza with perfect crust. Highly rated for quality.',
 '2500 E Alondra Blvd, Compton, CA 90221', '(310) 638-0413', 'pizzakingincompton.com',
 ARRAY['locally_owned'], false, true, false,
 '{"sun":"10:00 AM - 11:00 PM","mon":"10:00 AM - 11:00 PM","tue":"10:00 AM - 11:00 PM","wed":"10:00 AM - 11:00 PM","thu":"10:00 AM - 11:00 PM","fri":"10:00 AM - 12:00 AM","sat":"10:00 AM - 12:00 AM"}'::jsonb,
 ARRAY[]::text[]),

('La Pizza Loca', 'la-pizza-loca', 'restaurant',
 'Affordable pizza with Mexican-inspired toppings.',
 '961 S Long Beach Blvd, Compton, CA 90221', '(310) 747-6940', 'lapizzaloca.com',
 ARRAY['hispanic_owned', 'locally_owned'], false, true, false,
 '{"mon":"11:00 AM - 10:00 PM","tue":"11:00 AM - 10:00 PM","wed":"11:00 AM - 10:00 PM","thu":"11:00 AM - 10:00 PM","fri":"11:00 AM - 12:00 AM","sat":"11:00 AM - 12:00 AM","sun":"11:00 AM - 11:00 PM"}'::jsonb,
 ARRAY[]::text[]),

-- DONUTS & BAKERIES
('M & T Donut Shop', 'mt-donut-shop', 'restaurant',
 'Fresh donuts made daily. Family-owned and operated since 1978 — over 45 years serving Compton.',
 '2013 W Compton Blvd, Compton, CA 90220', NULL, 'm-and-t-donuts.square.site',
 ARRAY['black_owned', 'locally_owned'], false, true, true,
 '{"mon":"4:00 AM - 2:00 PM","tue":"4:00 AM - 2:00 PM","wed":"4:00 AM - 2:00 PM","thu":"4:00 AM - 2:00 PM","fri":"4:00 AM - 2:00 PM","sat":"4:00 AM - 2:00 PM","sun":"5:00 AM - 1:00 PM"}'::jsonb,
 ARRAY[]::text[]),

('Coffee Time Donut', 'coffee-time-donut', 'restaurant',
 'Wide variety of fresh daily donuts.',
 '1514 N Long Beach Blvd, Compton, CA 90221', NULL, NULL,
 ARRAY['locally_owned'], false, true, false,
 '{"mon":"4:30 AM - 6:00 PM","tue":"4:30 AM - 6:00 PM","wed":"4:30 AM - 6:00 PM","thu":"4:30 AM - 6:00 PM","fri":"4:30 AM - 6:00 PM","sat":"4:30 AM - 1:00 PM","sun":"4:30 AM - 1:00 PM"}'::jsonb,
 ARRAY[]::text[]),

('Daily Donut House', 'daily-donut-house', 'restaurant',
 'Donuts and sandwiches.',
 '312 W Compton Blvd, Ste 104, Compton, CA 90220', NULL, NULL,
 ARRAY['locally_owned'], false, true, false,
 '{"mon":"4:30 AM - 8:30 PM","tue":"4:30 AM - 8:30 PM","wed":"4:30 AM - 8:30 PM","thu":"4:30 AM - 8:30 PM","fri":"4:30 AM - 8:30 PM","sat":"4:30 AM - 8:30 PM","sun":"4:30 AM - 8:30 PM"}'::jsonb,
 ARRAY[]::text[]),

('Donut Hut', 'donut-hut', 'restaurant',
 'Donuts and coffee.',
 '1402 E Alondra Blvd, Compton, CA 90221', NULL, NULL,
 ARRAY['locally_owned'], false, true, false,
 '{"mon":"4:30 AM - 7:30 PM","tue":"4:30 AM - 7:30 PM","wed":"4:30 AM - 7:30 PM","thu":"4:30 AM - 7:30 PM","fri":"4:30 AM - 7:30 PM","sat":"4:30 AM - 7:30 PM","sun":"5:30 AM - 2:00 PM"}'::jsonb,
 ARRAY[]::text[]),

('Donut House', 'donut-house-atlantic', 'restaurant',
 'Donuts.',
 '14309 S Atlantic Ave, Compton, CA 90221', NULL, NULL,
 ARRAY['locally_owned'], false, true, false, '{}'::jsonb, ARRAY[]::text[]),

-- HEALTHY / SPECIALTY
('Everytable', 'everytable-compton', 'restaurant',
 'Affordable, healthy prepared meals, salads. Social enterprise focused on food equity.',
 '253 E Compton Blvd, Compton, CA 90220', '(323) 407-7690', NULL,
 ARRAY['locally_owned'], false, true, false,
 '{"mon":"8:00 AM - 8:00 PM","tue":"8:00 AM - 8:00 PM","wed":"8:00 AM - 8:00 PM","thu":"8:00 AM - 8:00 PM","fri":"8:00 AM - 8:00 PM","sun":"8:00 AM - 8:00 PM"}'::jsonb,
 ARRAY[]::text[]),

('Original Taco Pete', 'original-taco-pete', 'restaurant',
 'Soft shell tacos, taco sauce.',
 '2251 W Rosecrans Ave, Compton, CA 90222', '(562) 788-7477', 'originaltacopete.com',
 ARRAY['locally_owned'], false, true, false,
 '{"mon":"10:00 AM - 8:30 PM","tue":"10:00 AM - 8:30 PM","wed":"10:00 AM - 8:30 PM","thu":"10:00 AM - 8:30 PM","fri":"10:00 AM - 8:30 PM"}'::jsonb,
 ARRAY[]::text[]),

('Al Pollo Restaurant', 'al-pollo-restaurant', 'restaurant',
 'Chicken plates.',
 '2200 E Compton Blvd, Compton, CA 90221', NULL, NULL,
 ARRAY['locally_owned'], false, true, false, '{}'::jsonb, ARRAY[]::text[]),

-- ===================== FOOD TRUCKS =====================

('Hamburguesas Uruapan', 'hamburguesas-uruapan', 'restaurant',
 'Mexican-style burgers similar to tortas cubanas. Also has brick-and-mortar in Anaheim. Featured in The Infatuation.',
 '4625 Rosecrans Ave, Compton, CA 90221', '(562) 331-6130', NULL,
 ARRAY['hispanic_owned', 'locally_owned'], true, true, false, '{}'::jsonb, ARRAY[]::text[]),

('Los Dogos', 'los-dogos', 'restaurant',
 'Mexican-style hot dogs and hamburgers. Originally from Nayarit.',
 '15215 Atlantic Ave, Compton, CA 90221', NULL, NULL,
 ARRAY['hispanic_owned', 'locally_owned'], true, true, false, '{}'::jsonb, ARRAY[]::text[]),

('Tacos El Cacheton', 'tacos-el-cacheton', 'restaurant',
 'Authentic street tacos, fresh churros. Open late.',
 '4518 Rosecrans Ave, Compton, CA 90221', NULL, 'tacoselcacheton.shop',
 ARRAY['hispanic_owned', 'locally_owned'], true, true, false,
 '{"mon":"12:00 PM - 12:00 AM","tue":"12:00 PM - 12:00 AM","wed":"12:00 PM - 12:00 AM","thu":"12:00 PM - 12:00 AM","fri":"12:00 PM - 12:00 AM","sat":"12:00 PM - 12:00 AM","sun":"12:00 PM - 12:00 AM"}'::jsonb,
 ARRAY[]::text[]),

('Tacos El Guero', 'tacos-el-guero', 'restaurant',
 'Street tacos. Operates in Compton area.',
 'Compton, CA', NULL, NULL,
 ARRAY['hispanic_owned', 'locally_owned'], true, true, false, '{}'::jsonb, ARRAY[]::text[]),

('Tacos El Picoso', 'tacos-el-picoso', 'restaurant',
 'Spicy tacos. Operates in Compton area.',
 'Compton, CA', NULL, NULL,
 ARRAY['hispanic_owned', 'locally_owned'], true, true, false, '{}'::jsonb, ARRAY[]::text[]),

('Belly''s Sliders & Wings', 'bellys-sliders-wings', 'restaurant',
 'Sliders and wings food truck.',
 'Compton, CA', NULL, NULL,
 ARRAY['black_owned', 'locally_owned'], true, true, false, '{}'::jsonb, ARRAY[]::text[]),

('Mariscos Alex', 'mariscos-alex', 'restaurant',
 'Fresh seafood, quality meat. Mobile food truck.',
 'Compton, CA', NULL, NULL,
 ARRAY['hispanic_owned', 'locally_owned'], true, true, false, '{}'::jsonb, ARRAY[]::text[]),

('Habachihana Grill Food Truck', 'habachihana-grill', 'restaurant',
 'Hibachi-style grilled food truck.',
 'Compton, CA', NULL, NULL,
 ARRAY['locally_owned'], true, true, false, '{}'::jsonb, ARRAY[]::text[]),

('Dulce Canella', 'dulce-canella', 'restaurant',
 'Desserts and sweet treats food truck.',
 'Compton, CA', NULL, NULL,
 ARRAY['hispanic_owned', 'locally_owned'], true, true, false, '{}'::jsonb, ARRAY[]::text[]),

-- ===================== BARBER SHOPS =====================

('Barberizm The Shoppe', 'barberizm-the-shoppe', 'barber',
 'Full-service barbershop established in 2018 in downtown Compton. Specializes in all types of haircuts and styles. Featured in Voyage LA Magazine. Owner: Donald Conley.',
 '312 W Compton Blvd #101, Compton, CA 90220', '(424) 785-5566', 'barberizmtheshoppe.online',
 ARRAY['black_owned', 'locally_owned'], false, true, true,
 '{"mon":"7:00 AM - 7:00 PM","tue":"7:00 AM - 7:00 PM","wed":"7:00 AM - 7:00 PM","thu":"7:00 AM - 7:00 PM","fri":"7:00 AM - 7:00 PM","sat":"6:30 AM - 7:00 PM","sun":"10:00 AM - 3:00 PM"}'::jsonb,
 ARRAY[]::text[]),

('Compton Cuts Barbershop', 'compton-cuts', 'barber',
 'Specializes in all types of haircuts and styles. Wheelchair accessible. Private lot parking.',
 '930 N Long Beach Blvd, Compton, CA 90221', '(310) 627-9374', NULL,
 ARRAY['locally_owned'], false, true, false,
 '{"tue":"10:00 AM - 6:00 PM","wed":"10:00 AM - 6:00 PM","thu":"10:00 AM - 6:00 PM","fri":"10:00 AM - 6:30 PM","sat":"8:00 AM - 3:00 PM"}'::jsonb,
 ARRAY[]::text[]),

('Tolbert Barbershop', 'tolbert-barbershop', 'barber',
 'Established local barbershop serving the Compton community.',
 '490 W Compton Blvd, Compton, CA 90220', '(310) 632-2666', NULL,
 ARRAY['black_owned', 'locally_owned'], false, true, false, '{}'::jsonb, ARRAY[]::text[]),

('St Julian Barber Shop', 'st-julian-barber-shop', 'barber',
 'Full-service barbershop on Long Beach Blvd.',
 '107 N Long Beach Blvd, Compton, CA 90221', '(424) 785-5693', NULL,
 ARRAY['locally_owned'], false, true, false,
 '{"tue":"9:00 AM - 6:00 PM","wed":"9:00 AM - 6:00 PM","thu":"9:00 AM - 6:00 PM","fri":"9:00 AM - 6:30 PM","sat":"9:30 AM - 7:00 PM"}'::jsonb,
 ARRAY[]::text[]),

('Don Juan Barber Shop', 'don-juan-barber-shop', 'barber',
 'Haircuts, shaves, and combos.',
 '1609 E Compton Blvd, Compton, CA 90221', '(310) 747-0235', NULL,
 ARRAY['hispanic_owned', 'locally_owned'], false, true, false, '{}'::jsonb, ARRAY[]::text[]),

('Prodigy Barber Shop', 'prodigy-barber-shop', 'barber',
 'Local barbershop on East Compton Blvd.',
 '4257 E Compton Blvd, Compton, CA 90221', '(562) 650-1342', NULL,
 ARRAY['locally_owned'], false, true, false, '{}'::jsonb, ARRAY[]::text[]),

('Frank''s Barber Shop', 'franks-barber-shop', 'barber',
 'Long-standing local barbershop.',
 '661 W Compton Blvd, Compton, CA 90220', '(310) 632-0553', NULL,
 ARRAY['locally_owned'], false, true, false,
 '{"mon":"8:30 AM - 5:00 PM","tue":"8:30 AM - 5:00 PM","wed":"8:30 AM - 5:00 PM","thu":"8:30 AM - 5:00 PM","fri":"8:30 AM - 5:00 PM","sat":"8:30 AM - 5:00 PM"}'::jsonb,
 ARRAY[]::text[]),

('Price''s Barber Shop', 'prices-barber-shop', 'barber',
 'Established barbershop in west Compton.',
 '2105 W Compton Blvd, Compton, CA 90220', '(310) 637-5311', NULL,
 ARRAY['black_owned', 'locally_owned'], false, true, false, '{}'::jsonb, ARRAY[]::text[]),

('Weaver''s Barber Shop', 'weavers-barber-shop', 'barber',
 'Local neighborhood barbershop.',
 '215 N Central Ave, Compton, CA 90220', NULL, NULL,
 ARRAY['black_owned', 'locally_owned'], false, true, false, '{}'::jsonb, ARRAY[]::text[]),

-- ===================== BEAUTY =====================

('Torres Beauty Salon', 'torres-beauty-salon', 'beauty',
 'Full-service beauty salon and barber shop offering hair styling, cuts, and beauty treatments.',
 '1708 W Compton Blvd, Compton, CA 90220', '(310) 669-8015', 'torresbarberbeautysalon.com',
 ARRAY['hispanic_owned', 'locally_owned'], false, true, false,
 '{"mon":"8:00 AM - 8:00 PM","tue":"8:00 AM - 8:00 PM","wed":"8:00 AM - 8:00 PM","thu":"8:00 AM - 8:00 PM","fri":"8:00 AM - 8:00 PM","sat":"8:00 AM - 6:00 PM","sun":"8:00 AM - 5:00 PM"}'::jsonb,
 ARRAY[]::text[]),

('Guadalajara Beauty Salon', 'guadalajara-beauty-salon', 'beauty',
 'Popular hair salon with strong local reviews.',
 '1811 E Alondra Blvd, Compton, CA 90221', '(310) 762-1770', NULL,
 ARRAY['hispanic_owned', 'locally_owned'], false, true, false,
 '{"mon":"10:00 AM - 6:00 PM","wed":"10:00 AM - 6:00 PM","thu":"10:00 AM - 6:00 PM","fri":"10:00 AM - 6:00 PM","sat":"8:00 AM - 6:00 PM","sun":"9:00 AM - 3:00 PM","tue":"Closed"}'::jsonb,
 ARRAY[]::text[]),

('Amore Beauty Lounge', 'amore-beauty-lounge', 'beauty',
 'Full-service beauty lounge: manicures, pedicures, eyebrow waxing, makeup application for men and women.',
 '1322 E Alondra Blvd, Compton, CA 90221', '(424) 785-8633', 'amorebeautyloungecompton.com',
 ARRAY['locally_owned'], false, true, false,
 '{"mon":"9:00 AM - 7:00 PM","tue":"9:00 AM - 7:00 PM","wed":"9:00 AM - 7:00 PM","thu":"9:00 AM - 7:00 PM","fri":"9:00 AM - 7:00 PM","sat":"9:00 AM - 7:00 PM","sun":"9:00 AM - 6:00 PM"}'::jsonb,
 ARRAY[]::text[]),

('Nails on LA', 'nails-on-la', 'beauty',
 'Nail salon with 164+ reviews on Yelp.',
 '1820 N Long Beach Blvd, Suite J, Compton, CA 90221', '(310) 635-1719', NULL,
 ARRAY['locally_owned'], false, true, false, '{}'::jsonb, ARRAY[]::text[]),

('Hair Experience by Rhona', 'hair-experience-by-rhona', 'beauty',
 'Specialized hair styling services.',
 '1236 E Compton Blvd, Compton, CA 90220', NULL, NULL,
 ARRAY['black_owned', 'women_owned', 'locally_owned'], false, true, false, '{}'::jsonb, ARRAY[]::text[]),

('Jalisco''s Beauty Salon', 'jaliscos-beauty-salon', 'beauty',
 'Full-service beauty salon.',
 '1633 E Compton Blvd, Compton, CA 90221', NULL, NULL,
 ARRAY['hispanic_owned', 'locally_owned'], false, true, false, '{}'::jsonb, ARRAY[]::text[]),

-- ===================== AUTO =====================

('Jump-Start Auto Mechanic', 'jump-start-auto', 'auto',
 'Full-service auto mechanic. 4.9/5 stars. Brakes, oil, transmission, alignment, electrical, coolant.',
 '522 W Compton Blvd, Compton, CA 90220', '(310) 604-4775', NULL,
 ARRAY['locally_owned'], false, true, false,
 '{"mon":"8:00 AM - 5:00 PM","tue":"8:00 AM - 5:00 PM","wed":"8:00 AM - 5:00 PM","thu":"8:00 AM - 5:00 PM","fri":"8:00 AM - 5:00 PM","sat":"8:00 AM - 5:00 PM"}'::jsonb,
 ARRAY[]::text[]),

('Lopez Auto Service & Tires', 'lopez-auto-service', 'auto',
 'Tire sales/repair, wheel repair, wheel alignment, general auto. 4.7/5 stars. Two locations.',
 '1903 E Alondra Blvd, Compton, CA 90221', '(562) 843-9362', NULL,
 ARRAY['hispanic_owned', 'locally_owned'], false, true, false,
 '{"mon":"8:30 AM - 6:00 PM","tue":"8:30 AM - 6:00 PM","wed":"8:30 AM - 6:00 PM","thu":"8:30 AM - 6:00 PM","fri":"8:30 AM - 6:00 PM","sat":"8:30 AM - 5:00 PM","sun":"9:00 AM - 2:00 PM"}'::jsonb,
 ARRAY[]::text[]),

('Eddie''s Mufflers', 'eddies-mufflers', 'auto',
 'Exhaust system upgrades, general auto repair, muffler installation. 126+ reviews.',
 '1620 N Long Beach Blvd, Compton, CA 90221', '(310) 635-8409', NULL,
 ARRAY['hispanic_owned', 'locally_owned'], false, true, false,
 '{"mon":"9:00 AM - 7:00 PM","tue":"9:00 AM - 7:00 PM","wed":"9:00 AM - 7:00 PM","thu":"9:00 AM - 7:00 PM","fri":"9:00 AM - 7:00 PM","sat":"9:00 AM - 7:00 PM"}'::jsonb,
 ARRAY[]::text[]),

('Carrillo Body Shop & Mufflers', 'carrillo-body-shop', 'auto',
 'Paint restorations, collision repair, muffler installations, and body work.',
 '1515 S Alameda St, Compton, CA 90220', '(310) 940-6792', 'comptonbodyshop.com',
 ARRAY['hispanic_owned', 'locally_owned'], false, true, false,
 '{"mon":"8:00 AM - 5:00 PM","tue":"8:00 AM - 5:00 PM","wed":"8:00 AM - 5:00 PM","thu":"8:00 AM - 5:00 PM","fri":"8:00 AM - 5:00 PM","sat":"8:00 AM - 3:00 PM"}'::jsonb,
 ARRAY[]::text[]),

-- ===================== SERVICES =====================

('Compton Car Studio Express Car Wash', 'compton-car-studio', 'services',
 'Newest single tunnel express car wash in Compton. State-of-the-art automated system. Clean car in under 5 minutes.',
 '305 N Long Beach Blvd, Compton, CA 90221', '(310) 933-8524', NULL,
 ARRAY['locally_owned'], false, true, false, '{}'::jsonb, ARRAY[]::text[]),

('Flo''s Express Car Wash', 'flos-express-car-wash', 'services',
 'Top-rated car wash with express packages and Unlimited Club membership tiers.',
 '4119 E Compton Blvd, Compton, CA 90221', '(424) 279-1021', 'flosexpress.com',
 ARRAY['locally_owned'], false, true, false, '{}'::jsonb, ARRAY[]::text[]),

('Courtesy Cleaners', 'courtesy-cleaners', 'services',
 'Full-service dry cleaning and laundry.',
 '1725 E Compton Blvd, Compton, CA 90221', '(310) 631-3713', NULL,
 ARRAY['locally_owned'], false, true, false,
 '{"mon":"8:00 AM - 7:00 PM","tue":"8:00 AM - 7:00 PM","wed":"8:00 AM - 7:00 PM","thu":"8:00 AM - 7:00 PM","fri":"8:00 AM - 7:00 PM","sat":"7:00 AM - 6:00 PM"}'::jsonb,
 ARRAY[]::text[]),

('Unlimited Tax Solutions', 'unlimited-tax-solutions', 'services',
 'Tax planning & prep, audit representation, bookkeeping, CPA services, payroll.',
 '1101 E Compton Blvd, Unit D, Compton, CA 90221', '(562) 363-2002', 'unlimitedtaxsolutions.com',
 ARRAY['locally_owned'], false, true, false,
 '{"mon":"6:00 AM - 6:00 PM","tue":"6:00 AM - 6:00 PM","wed":"6:00 AM - 6:00 PM","thu":"6:00 AM - 6:00 PM","fri":"6:00 AM - 6:00 PM"}'::jsonb,
 ARRAY[]::text[]),

('Community Lawyers, Inc.', 'community-lawyers', 'services',
 'Nonprofit legal advocacy. Monthly clinics in immigration law, special education law, tenants rights, and family law.',
 '1216 E Compton Blvd, Compton, CA 90221', '(310) 635-8181', 'community-lawyers.org',
 ARRAY['locally_owned'], false, true, false,
 '{"mon":"10:00 AM - 5:00 PM","tue":"10:00 AM - 5:00 PM","wed":"10:00 AM - 5:00 PM","thu":"10:00 AM - 5:00 PM","fri":"10:00 AM - 5:00 PM"}'::jsonb,
 ARRAY[]::text[]),

-- ===================== HEALTH =====================

('Babes of Wellness', 'babes-of-wellness', 'health',
 'First all-women''s queer wellness gym in South LA. Yoga, pilates, strength training, sound baths. Featured on NBC Los Angeles.',
 '855 W Victoria St, Unit D, Compton, CA 90220', '(213) 315-6808', 'babesofwellness.com',
 ARRAY['hispanic_owned', 'women_owned', 'locally_owned'], false, true, true,
 '{"mon":"6:00 AM - 11:00 AM, 5:00 PM - 8:00 PM","tue":"6:00 AM - 11:00 AM, 5:00 PM - 8:00 PM","wed":"6:00 AM - 11:00 AM, 5:00 PM - 8:00 PM","thu":"6:00 AM - 11:00 AM, 5:00 PM - 8:00 PM","fri":"6:00 AM - 11:00 AM, 5:00 PM - 8:00 PM","sat":"7:00 AM - 11:00 AM","sun":"7:00 AM - 11:00 AM"}'::jsonb,
 ARRAY[]::text[]),

('ROADS Community Care Clinic', 'roads-community-care', 'health',
 'Full range of medical, dental, and behavioral health services. Primary care, pediatrics, women''s health, prenatal care. Nonprofit.',
 '121 S Long Beach Blvd, Compton, CA 90221', '(310) 627-5850', 'roadsfoundation.org',
 ARRAY['locally_owned'], false, true, false,
 '{"mon":"9:00 AM - 5:00 PM","tue":"9:00 AM - 5:00 PM","wed":"9:00 AM - 5:00 PM","thu":"9:00 AM - 5:00 PM","fri":"9:00 AM - 5:00 PM"}'::jsonb,
 ARRAY[]::text[]),

('West Alondra Medical Pharmacy', 'west-alondra-pharmacy', 'health',
 'Independent local pharmacy offering prescription services.',
 '1410 W Alondra Blvd, Compton, CA 90220', '(310) 631-8674', NULL,
 ARRAY['locally_owned'], false, true, false,
 '{"mon":"10:00 AM - 6:00 PM","tue":"10:00 AM - 6:00 PM","wed":"10:00 AM - 6:00 PM","thu":"10:00 AM - 6:00 PM","fri":"10:00 AM - 6:00 PM"}'::jsonb,
 ARRAY[]::text[]),

-- ===================== RETAIL =====================

('Made in Compton Store', 'made-in-compton', 'retail',
 'Trendy streetwear and drink accessories. T-shirts, hoodies, custom items reflecting Compton heritage.',
 '906 S Willowbrook Ave, Compton, CA 90220', '(424) 232-3389', 'micpt.com',
 ARRAY['black_owned', 'locally_owned'], false, true, true,
 '{"mon":"8:00 AM - 5:00 PM","tue":"8:00 AM - 5:00 PM","wed":"8:00 AM - 5:00 PM","thu":"8:00 AM - 5:00 PM","fri":"8:00 AM - 5:00 PM","sat":"8:00 AM - 5:00 PM","sun":"8:00 AM - 5:00 PM"}'::jsonb,
 ARRAY[]::text[]),

('Denim Exchange', 'denim-exchange', 'retail',
 'Brand-name casual wear, shoes, and accessories. Streetwear culture focus.',
 '200 Towne Center Dr, Compton, CA 90220', '(310) 609-3310', 'denimexchangeusa.com',
 ARRAY['locally_owned'], false, true, false,
 '{"sun":"11:00 AM - 7:00 PM","mon":"11:00 AM - 7:00 PM","tue":"11:00 AM - 7:00 PM","wed":"11:00 AM - 7:00 PM","thu":"11:00 AM - 7:00 PM","fri":"11:00 AM - 8:00 PM","sat":"11:00 AM - 8:00 PM"}'::jsonb,
 ARRAY[]::text[]),

('Compton Proud Studios', 'compton-proud-studios', 'retail',
 'Screen printing and custom apparel services.',
 '931 E Rosecrans Ave, Compton, CA 90221', NULL, 'comptonproud.com',
 ARRAY['black_owned', 'locally_owned'], false, true, false, '{}'::jsonb, ARRAY[]::text[]),

('Compton Streetwear', 'compton-streetwear', 'retail',
 'Screen printing and T-shirt printing plus streetwear retail. 1900+ photos on Yelp.',
 '4907 E San Carlos St, Compton, CA 90221', NULL, NULL,
 ARRAY['locally_owned'], false, true, false,
 '{"mon":"7:00 AM - 7:00 PM","tue":"7:00 AM - 7:00 PM","wed":"7:00 AM - 7:00 PM","thu":"7:00 AM - 7:00 PM","fri":"7:00 AM - 7:00 PM","sat":"7:00 AM - 7:00 PM","sun":"7:00 AM - 7:00 PM"}'::jsonb,
 ARRAY[]::text[]),

-- ===================== ENTERTAINMENT / OTHER =====================

('Compton Flower Shop', 'compton-flower-shop', 'other',
 'Full-service florist with flower delivery.',
 '400 N Long Beach Blvd, Compton, CA 90221', '(562) 306-9836', 'comptonflowershop.com',
 ARRAY['locally_owned'], false, true, false,
 '{"mon":"8:00 AM - 8:00 PM","tue":"8:00 AM - 8:00 PM","wed":"8:00 AM - 8:00 PM","thu":"8:00 AM - 8:00 PM","fri":"8:00 AM - 8:00 PM","sat":"8:00 AM - 8:00 PM","sun":"8:00 AM - 3:00 PM"}'::jsonb,
 ARRAY[]::text[]),

('Compton Nursery & Florist', 'compton-nursery-florist', 'other',
 'Florist, nursery plants, exotic plants, wedding flowers, flower arrangements, and delivery.',
 '1801 E Rosecrans Ave, Compton, CA 90221', '(310) 894-0698', NULL,
 ARRAY['locally_owned'], false, true, false,
 '{"mon":"9:00 AM - 7:00 PM","tue":"9:00 AM - 7:00 PM","wed":"9:00 AM - 7:00 PM","thu":"9:00 AM - 7:00 PM","fri":"9:00 AM - 7:00 PM","sat":"9:00 AM - 7:00 PM","sun":"9:00 AM - 5:00 PM"}'::jsonb,
 ARRAY[]::text[]),

('Blake''s Loan & Jewelry', 'blakes-loan-jewelry', 'other',
 'Cash loans on most anything of value. Over 60 years in business.',
 '407 W Compton Blvd, Compton, CA 90220', '(323) 774-0940', NULL,
 ARRAY['locally_owned'], false, true, false,
 '{"mon":"9:00 AM - 6:00 PM","tue":"9:00 AM - 6:00 PM","wed":"9:00 AM - 6:00 PM","thu":"9:00 AM - 6:00 PM","fri":"9:00 AM - 6:00 PM","sat":"9:00 AM - 5:00 PM"}'::jsonb,
 ARRAY[]::text[]),

('L.A. Estates Realty', 'la-estates-realty', 'services',
 'Real estate services.',
 'Compton, CA', NULL, NULL,
 ARRAY['black_owned', 'locally_owned'], false, true, false, '{}'::jsonb, ARRAY[]::text[]),

('Lean Black, LLC', 'lean-black-llc', 'services',
 'Business services.',
 'Compton, CA', NULL, NULL,
 ARRAY['black_owned', 'locally_owned'], false, true, false, '{}'::jsonb, ARRAY[]::text[]),

('One Stop Universal Auto Care', 'one-stop-auto-care', 'auto',
 'Electronics and consumer electronics repair services.',
 'Compton, CA', NULL, NULL,
 ARRAY['black_owned', 'locally_owned'], false, true, false, '{}'::jsonb, ARRAY[]::text[])

ON CONFLICT (slug) DO NOTHING;
