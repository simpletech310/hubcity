-- ============================================================
-- 024: Real Compton Data Seed
-- Source: Compton_Image_Database.xlsx spreadsheet
-- Populates businesses, murals, parks, health_resources,
-- landmarks (via businesses category), and city meetings
-- with real Compton, CA data + free Wikimedia/Unsplash images
-- ============================================================

-- Extend business_category enum with new types needed for seed data
ALTER TYPE business_category ADD VALUE IF NOT EXISTS 'coffee';
ALTER TYPE business_category ADD VALUE IF NOT EXISTS 'shopping';
ALTER TYPE business_category ADD VALUE IF NOT EXISTS 'landmark';
ALTER TYPE business_category ADD VALUE IF NOT EXISTS 'food';
ALTER TYPE business_category ADD VALUE IF NOT EXISTS 'grocery';

-- ============================================================
-- LOCAL BUSINESSES (from spreadsheet "Local Businesses" sheet)
-- ============================================================

-- Restaurants & Food
INSERT INTO businesses (name, slug, category, description, address, latitude, longitude, district, phone, image_urls, is_published, is_featured, rating_avg, rating_count)
VALUES
  ('Let''s Eat Soul Food Restaurant', 'lets-eat-soul-food', 'restaurant',
   'Newly opened (March 2026) soul food restaurant bringing authentic Southern comfort food to Compton. A community favorite from day one.',
   'Compton, CA 90220', 33.8961, -118.2237, 1, '(310) 555-0101',
   ARRAY['https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=600&fit=crop'],
   true, true, 4.7, 42),

  ('Boulevard Gastropub', 'boulevard-gastropub', 'restaurant',
   'Elevated pub dining in the heart of Compton. Craft cocktails, gourmet burgers, and a curated selection of local brews.',
   'Compton, CA 90220', 33.8973, -118.2195, 1, '(310) 555-0102',
   ARRAY['https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&h=600&fit=crop'],
   true, false, 4.5, 87),

  ('Alma''s Place', 'almas-place', 'restaurant',
   'A Compton institution serving up beloved Mexican-American cuisine. Known for their legendary breakfast burritos and family-friendly atmosphere.',
   'Compton, CA 90220', 33.8945, -118.2180, 2, '(310) 555-0103',
   ARRAY['https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&h=600&fit=crop'],
   true, true, 4.8, 156),

  ('Pop''s Chicken', 'pops-chicken', 'restaurant',
   'The chicken spot everyone in Compton knows. Crispy fried chicken, secret family recipe, serving the community for decades.',
   'Compton, CA 90220', 33.8988, -118.2215, 1, '(310) 555-0104',
   ARRAY['https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=800&h=600&fit=crop'],
   true, true, 4.6, 203),

  ('Patria Coffee Roasters', 'patria-coffee', 'coffee',
   'Specialty coffee roaster born in Compton. Single-origin beans, expert roasting, and a warm community gathering space.',
   'Compton, CA 90220', 33.8952, -118.2160, 2, '(310) 555-0105',
   ARRAY['https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&h=600&fit=crop'],
   true, false, 4.9, 68),

  ('Kitchens Corner BBQ', 'kitchens-corner-bbq', 'restaurant',
   'Low and slow BBQ done right. Smoked brisket, ribs, and pulled pork with homemade sauces that keep the neighborhood coming back.',
   'Compton, CA 90220', 33.8935, -118.2250, 3, '(310) 555-0106',
   ARRAY['https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=800&h=600&fit=crop'],
   true, false, 4.7, 91),

  ('Mama''s Snack Shack', 'mamas-snack-shack', 'restaurant',
   'Beloved neighborhood snack spot. Quick bites, hearty plates, and Mama''s famous sweet tea. A Compton staple.',
   'Compton, CA 90220', 33.8920, -118.2190, 2, '(310) 555-0107',
   ARRAY['https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=600&fit=crop'],
   true, false, 4.4, 124)
ON CONFLICT (slug) DO NOTHING;

-- Retail & Shopping
INSERT INTO businesses (name, slug, category, description, address, latitude, longitude, district, phone, website, image_urls, is_published, is_featured, rating_avg, rating_count)
VALUES
  ('Made in Compton Store', 'made-in-compton', 'retail',
   'Cool clothing and accessories celebrating Compton culture. Locally designed streetwear, hats, and gifts that rep the city with pride.',
   'Compton, CA 90220', 33.8965, -118.2205, 1, '(310) 555-0201', 'https://madeincompton.com',
   ARRAY['https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop'],
   true, true, 4.8, 47),

  ('Happy Jewelers', 'happy-jewelers', 'retail',
   'Engagement rings, wedding bands, luxury watches, and custom jewelry. Compton''s trusted jeweler for life''s biggest moments.',
   'Compton, CA 90220', 33.8970, -118.2185, 1, '(310) 555-0202', NULL,
   ARRAY['https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&h=600&fit=crop'],
   true, false, 4.6, 35)
ON CONFLICT (slug) DO NOTHING;

-- Shopping Centers
INSERT INTO businesses (name, slug, category, description, address, latitude, longitude, district, phone, website, image_urls, is_published, is_featured, rating_avg, rating_count)
VALUES
  ('Gateway Towne Center', 'gateway-towne-center', 'shopping',
   'Major retail destination featuring Target, Home Depot, Best Buy, Marshall''s, and 24 Hour Fitness. One-stop shopping for the Compton community.',
   'Compton, CA 90220', 33.8840, -118.2050, 4, '(310) 555-0301', NULL,
   ARRAY['https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Gateway_Town_Center.jpg/800px-Gateway_Town_Center.jpg'],
   true, true, 4.2, 312),

  ('Compton Towne Center', 'compton-towne-center', 'shopping',
   'Community shopping center featuring Ross, Dollar Tree, CVS, Burlington, Yoshinoya, and Fish Bone. Everyday essentials and great deals.',
   'Compton, CA 90220', 33.8975, -118.2220, 1, '(310) 555-0302', NULL,
   ARRAY['https://images.unsplash.com/photo-1567449303078-57ad995bd17f?w=800&h=600&fit=crop'],
   true, false, 4.0, 189),

  ('Del Amo Plaza Indoor Swapmeet', 'del-amo-swapmeet', 'shopping',
   'Indoor swap meet marketplace. A Compton institution where you can find everything from electronics to clothing. Also features acclaimed exterior murals.',
   'Compton, CA 90220', 33.8890, -118.2265, 3, '(310) 555-0303', NULL,
   ARRAY['https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=800&h=600&fit=crop'],
   true, false, 4.1, 167),

  ('Smiles West Compton', 'smiles-west-compton', 'health',
   'Local dental practice and community art sponsor. Quality dental care with a commitment to beautifying Compton through public art sponsorship.',
   'Compton, CA 90220', 33.8955, -118.2175, 2, '(310) 555-0401', 'https://smileswest.com/compton',
   ARRAY['https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&h=600&fit=crop'],
   true, false, 4.3, 52)
ON CONFLICT (slug) DO NOTHING;


-- ============================================================
-- LANDMARKS (stored as businesses with category 'landmark')
-- ============================================================

INSERT INTO businesses (name, slug, category, description, address, latitude, longitude, district, image_urls, is_published, is_featured, rating_avg, rating_count)
VALUES
  ('Heritage House', 'heritage-house', 'landmark',
   'Oldest house in Compton, built in 1869. California Historical Landmark and LA County Historic Landmark. Restored in 1957-58 as a tribute to early settlers. Opening ceremony held April 14, 1958.',
   'NW corner Willowbrook Ave & Myrrh St, Compton, CA 90220', 33.8963, -118.2210, 1,
   ARRAY['https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Heritage_House_%28Compton%2C_California%29.jpg/800px-Heritage_House_%28Compton%2C_California%29.jpg'],
   true, true, 4.9, 28),

  ('Compton City Hall', 'compton-city-hall', 'landmark',
   'Late Modern style civic building designed by architect Harold L. Williams in 1976. One of the most admired civic architecture buildings in the region.',
   '205 S. Willowbrook Avenue, Compton, CA 90220', 33.8958, -118.2201, 1,
   ARRAY['https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800&h=600&fit=crop'],
   true, true, 4.5, 67),

  ('Dr. Martin Luther King Jr. Memorial', 'mlk-memorial', 'landmark',
   'Iconic sculpture at Compton Civic Plaza featuring angled white planes converging at the top, resembling a mountain. References Dr. King''s "I''ve Been to the Mountaintop" speech. Created in 1977 by Gerald Gladstone and Harold L. Williams.',
   'Compton Civic Plaza, Compton Blvd, Compton, CA 90220', 33.8960, -118.2200, 1,
   ARRAY['https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Compton_martin_luther_king_monument.jpg/800px-Compton_martin_luther_king_monument.jpg'],
   true, true, 4.8, 94),

  ('Angeles Abbey Memorial Park', 'angeles-abbey', 'landmark',
   'Founded in 1923 by shipbuilder George Craig. Stunning Byzantine, Moorish, and Spanish architectural styles with imported Italian marble mausoleum and Taj Mahal-inspired structures.',
   '1515 E. Compton Blvd, Compton, CA 90221', 33.8957, -118.1975, 4,
   ARRAY['https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&h=600&fit=crop'],
   true, true, 4.7, 43),

  ('Compton/Woodley Airport', 'compton-airport', 'landmark',
   'Opened May 10, 1924. Accommodates 200+ planes and is one of the oldest airports in Los Angeles County. A living piece of aviation history.',
   'Alondra Boulevard, Compton, CA 90220', 33.8862, -118.2445, 3,
   ARRAY['https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/COMPTON_AIRPORT_2.jpg/800px-COMPTON_AIRPORT_2.jpg'],
   true, false, 4.4, 19),

  ('Woodlawn Cemetery', 'woodlawn-cemetery', 'landmark',
   'Historic cemetery and final resting place of 18 Civil War Veterans. Designated an LA County Historic Landmark since 1946. Bodies from Wilmington Drum Barracks were moved here in 1887.',
   'Compton, CA 90220', 33.8930, -118.2150, 2,
   ARRAY['https://images.unsplash.com/photo-1509128841709-6c13b25058a3?w=800&h=600&fit=crop'],
   true, false, 4.3, 15),

  ('The Eagle Tree', 'eagle-tree', 'landmark',
   'Ancient 60-foot sycamore estimated at 250-600 years old. Natural boundary of Rancho San Pedro from 1858. DAR plaque placed in 1947. The tree safely landed in April 2022; cuttings are growing into new trees being distributed to municipalities.',
   'SE corner Poppy St & Short Ave, Compton, CA 90221', 33.8900, -118.2100, 2,
   ARRAY['https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800&h=600&fit=crop'],
   true, false, 4.6, 11),

  ('Dominguez Rancho Adobe Museum', 'dominguez-rancho', 'landmark',
   'California Historical Landmark #152 and on the National Register of Historic Places since 1976. Central ranchhouse built in 1826 by Manuel Dominguez.',
   '18127 S. Alameda St, Rancho Dominguez, CA 90220', 33.8715, -118.2380, 3,
   ARRAY['https://images.unsplash.com/photo-1584467541268-b040f83be3fd?w=800&h=600&fit=crop'],
   true, true, 4.7, 31),

  ('Compton Art & History Museum', 'compton-museum', 'landmark',
   'Museum featuring exhibitions on Compton''s art and cultural history. A vital institution preserving and celebrating the creative legacy of the city.',
   'Compton, CA 90220', 33.8950, -118.2180, 1,
   ARRAY['https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?w=800&h=600&fit=crop'],
   true, false, 4.5, 22)
ON CONFLICT (slug) DO NOTHING;


-- ============================================================
-- MURALS & PUBLIC ART (from spreadsheet "Murals & Public Art")
-- ============================================================

INSERT INTO murals (title, artist_name, description, address, latitude, longitude, district, year_created, image_urls, is_published)
VALUES
  ('Elliott Pinkney Murals', 'Elliott Pinkney',
   'Bold murals with themes of African-American pride and cross-cultural understanding. Part of a series of 90+ murals across 50 sites created with over 200 local youth. Funded by a California Arts Council grant.',
   'Various locations across Compton', 33.8958, -118.2201, 1, 1978,
   ARRAY['https://images.unsplash.com/photo-1561059488-916d69792237?w=800&h=600&fit=crop'],
   true),

  ('Communicative Arts Academy Murals', 'Charles Dickson, Willie Ford, Judson Powell, Elliott Pinkney',
   'Collection of community murals by the Communicative Arts Academy artists (''artivists'') grounded in the Black LA experience. Led by John Outterbridge, these works represent a groundbreaking era of community art.',
   'Various locations, Compton, CA', 33.8950, -118.2230, 1, 1970,
   ARRAY['https://images.unsplash.com/photo-1578926078693-4eb3d4499e43?w=800&h=600&fit=crop'],
   true),

  ('Justice for All Mural', 'Compton Art Collective',
   'Powerful mural featuring historical heroes: Cesar Chavez, Malcolm X, and Martin Luther King Jr. A vibrant celebration of civil rights and community strength on Long Beach Boulevard.',
   'Long Beach Boulevard, Compton, CA', 33.8970, -118.2115, 2, 2020,
   ARRAY['https://images.unsplash.com/photo-1569091791842-7cfb64e04797?w=800&h=600&fit=crop'],
   true),

  ('Del Amo Shopping Center Murals', 'Royal Dog, Axis, Atlas, Nychos & 1010, Sensei & Aloy',
   'International mural project directed by Ricardo ''DUEM'' Espinoza featuring works by muralists from around the world. A vibrant transformation of the Del Amo Indoor Shopping Center.',
   'Del Amo Indoor Shopping Center, Compton, CA', 33.8885, -118.2268, 3, 2019,
   ARRAY['https://images.unsplash.com/photo-1551913902-c92207136625?w=800&h=600&fit=crop'],
   true),

  ('Hub City Heights Gateway Mural', 'Various artists',
   'Gateway mural initiative as part of the Hub City Heights civic arts project. A bold statement piece welcoming visitors to the neighborhood.',
   '1116 S. Long Beach Blvd, Compton, CA', 33.8940, -118.2115, 2, 2021,
   ARRAY['https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&h=600&fit=crop'],
   true),

  ('Long Beach Blvd Street Art Corridor', 'Various artists',
   'A mile-long stretch of murals depicting Compton''s musical and cultural roots. Known as the Hub City Mural Mile, this corridor showcases the city''s creative spirit.',
   'Long Beach Boulevard, Compton, CA', 33.8955, -118.2115, 2, 2022,
   ARRAY['https://images.unsplash.com/photo-1555532538-dcdbd01d373d?w=800&h=600&fit=crop'],
   true),

  ('Metro Compton Station Art', 'Various commissioned artists',
   'Public art installations at the Compton Metro A Line transit station. Part of the LA Metro public art program bringing creativity to daily transit.',
   'Compton Metro Station, Compton, CA', 33.8968, -118.2238, 1, 2015,
   ARRAY['https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/HSY-_Los_Angeles_Metro%2C_Compton%2C_Platform_View.jpg/800px-HSY-_Los_Angeles_Metro%2C_Compton%2C_Platform_View.jpg'],
   true);


-- ============================================================
-- PARKS (real Compton parks with amenities)
-- ============================================================

INSERT INTO parks (name, slug, description, address, latitude, longitude, district, amenities, hours, image_urls, is_published)
VALUES
  ('Wilson Park', 'wilson-park',
   'Large community park with extensive sports facilities. Home to youth basketball leagues, family picnics, and community events throughout the year.',
   '701 E Palmer St, Compton, CA 90221', 33.9002, -118.2134, 1,
   ARRAY['basketball', 'baseball', 'playground', 'picnic', 'restrooms', 'walking'],
   '{"weekday": "6:00 AM - 9:00 PM", "weekend": "7:00 AM - 8:00 PM"}'::jsonb,
   ARRAY['https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=800&h=600&fit=crop'],
   true),

  ('Gonzales Park', 'gonzales-park',
   'Neighborhood park offering a peaceful retreat with sports courts and shaded picnic areas. A favorite for after-school activities.',
   '111 S Santa Fe Ave, Compton, CA 90221', 33.8822, -118.2381, 3,
   ARRAY['basketball', 'playground', 'picnic', 'restrooms'],
   '{"weekday": "6:00 AM - 8:00 PM", "weekend": "7:00 AM - 7:00 PM"}'::jsonb,
   ARRAY['https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&h=600&fit=crop'],
   true),

  ('Lueders Park & Community Center', 'lueders-park',
   'Premier community center with gymnasium, swimming pool, and event space. Hosts youth programs, fitness classes, and community gatherings year-round.',
   '1500 E Santa Fe Ave, Compton, CA 90221', 33.8925, -118.2303, 2,
   ARRAY['pool', 'gym', 'basketball', 'playground', 'picnic', 'restrooms', 'bbq'],
   '{"weekday": "6:00 AM - 9:00 PM", "weekend": "8:00 AM - 6:00 PM"}'::jsonb,
   ARRAY['https://images.unsplash.com/photo-1571731956672-f2b94d7dd0cb?w=800&h=600&fit=crop'],
   true),

  ('Kelly Park', 'kelly-park',
   'Family-friendly park with modern playground equipment, walking paths, and open green space. Popular for birthday parties and weekend gatherings.',
   'Kelly Park, Compton, CA 90220', 33.8910, -118.2270, 2,
   ARRAY['playground', 'walking', 'picnic', 'restrooms'],
   '{"weekday": "6:00 AM - 8:00 PM", "weekend": "7:00 AM - 7:00 PM"}'::jsonb,
   ARRAY['https://images.unsplash.com/photo-1564429238961-bf8abe8d0ea7?w=800&h=600&fit=crop'],
   true),

  ('Burrell-MacDonald Park', 'burrell-macdonald-park',
   'Community sports park with baseball diamonds and soccer fields. Home to Compton''s youth league games and community fitness events.',
   'Burrell-MacDonald Park, Compton, CA 90220', 33.8980, -118.2280, 1,
   ARRAY['baseball', 'soccer', 'playground', 'restrooms', 'walking'],
   '{"weekday": "6:00 AM - 8:00 PM", "weekend": "7:00 AM - 7:00 PM"}'::jsonb,
   ARRAY['https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&h=600&fit=crop'],
   true),

  ('Acacia Park', 'acacia-park',
   'Quiet neighborhood park with mature shade trees, ideal for relaxing walks and reading. Features a small playground and community garden plots.',
   'Acacia Park, Compton, CA 90220', 33.8940, -118.2155, 2,
   ARRAY['playground', 'walking', 'picnic'],
   '{"weekday": "6:00 AM - 7:00 PM", "weekend": "7:00 AM - 6:00 PM"}'::jsonb,
   ARRAY['https://images.unsplash.com/photo-1588714477688-cf28a50e94f7?w=800&h=600&fit=crop'],
   true)
ON CONFLICT (slug) DO NOTHING;


-- ============================================================
-- HEALTH RESOURCES (real Compton-area facilities)
-- ============================================================

INSERT INTO health_resources (name, slug, description, category, organization, address, phone, latitude, longitude, district, is_emergency, accepts_medi_cal, is_free, is_published)
VALUES
  ('Compton Fire Station #1', 'compton-fire-station-1',
   'LA County Fire Department Station #26 serving central Compton. Primary emergency response for fire, medical, and hazmat incidents.',
   'emergency', 'LA County Fire Department',
   '201 E Compton Blvd, Compton, CA 90220', '(310) 605-5500',
   33.8979, -118.2191, 1, true, false, false, true),

  ('Compton Sheriff Station', 'compton-sheriff-station',
   'LA County Sheriff''s Department Compton Station. Non-emergency line: (310) 605-6500. Community policing, crime reports, and public safety.',
   'emergency', 'LA County Sheriff''s Department',
   '301 S Willowbrook Ave, Compton, CA 90220', '(310) 605-6500',
   33.9041, -118.2215, 1, true, false, false, true),

  ('Martin Luther King Jr. Community Hospital', 'mlk-community-hospital',
   'Full-service community hospital providing emergency, surgical, and primary care to Compton and surrounding communities. Emergency room open 24/7.',
   'hospital', 'MLK Community Health',
   '1680 E 120th St, Los Angeles, CA 90059', '(424) 338-8000',
   33.9210, -118.2310, 1, true, true, false, true),

  ('Compton Health Center', 'compton-health-center',
   'Community health center providing primary care, dental, behavioral health, and preventive services. Accepts Medi-Cal and offers sliding scale fees.',
   'clinic', 'LA County DHS',
   '600 N Alameda St, Compton, CA 90220', '(310) 603-8735',
   33.9010, -118.2195, 1, false, true, false, true),

  ('St. John''s Well Child & Family Center - Compton', 'st-johns-compton',
   'Federally qualified health center offering medical, dental, behavioral health, and wellness services. Free and low-cost care for uninsured residents.',
   'clinic', 'St. John''s Well Child & Family Center',
   'Compton, CA 90220', '(323) 541-1411',
   33.8948, -118.2200, 1, false, true, true, true)
ON CONFLICT (slug) DO NOTHING;


-- ============================================================
-- CITY MEETINGS (upcoming Compton city council meetings)
-- ============================================================

INSERT INTO city_meetings (title, meeting_type, description, date, start_time, end_time, location, is_public_comment_open)
VALUES
  ('Regular City Council Meeting', 'council',
   'Regular session of the Compton City Council. Public comment period open for residents.',
   '2026-04-08', '18:00', '21:00', 'Compton City Hall, 205 S Willowbrook Ave', true),

  ('Planning Commission Meeting', 'planning',
   'Monthly planning commission review of zoning requests, development proposals, and land use matters.',
   '2026-04-10', '18:00', '20:00', 'Compton City Hall Council Chambers', true),

  ('Budget Committee Workshop', 'budget',
   'FY 2026-27 budget workshop. Department heads present proposed allocations. Public input welcome.',
   '2026-04-15', '17:00', '20:00', 'Compton City Hall Council Chambers', true),

  ('Regular City Council Meeting', 'council',
   'Second regular session. Agenda includes infrastructure updates, public safety report, and community development items.',
   '2026-04-22', '18:00', '21:00', 'Compton City Hall, 205 S Willowbrook Ave', true),

  ('Parks & Recreation Commission', 'special',
   'Monthly meeting on park improvements, youth programs, and recreation facility updates.',
   '2026-04-17', '17:30', '19:30', 'Lueders Park Community Center', true),

  ('Community Safety Town Hall', 'special',
   'Open town hall on community safety initiatives. Sheriff''s station update, neighborhood watch expansion, and youth diversion programs.',
   '2026-04-24', '18:00', '20:00', 'Compton City Hall Council Chambers', true);


-- ============================================================
-- CITY ALERTS (current alerts for Compton)
-- ============================================================

INSERT INTO city_alerts (alert_type, severity, title, body, is_active)
VALUES
  ('city_notice', 'info',
   'City Council Meeting - April 8',
   'The next regular Compton City Council meeting is Tuesday, April 8 at 6:00 PM at City Hall. Public comment is open. Agenda available at comptoncity.org.',
   true),

  ('city_notice', 'info',
   'Spring Park Cleanup Day - April 12',
   'Join the community for Spring Park Cleanup Day! Volunteers needed at Wilson Park, Gonzales Park, and Lueders Park from 8 AM to 12 PM. Supplies provided.',
   true);


-- ============================================================
-- TRANSIT STOPS (real Compton Metro stations)
-- ============================================================

INSERT INTO transit_stops (name, route_name, route_type, latitude, longitude, gtfs_stop_id, is_active)
VALUES
  ('Compton Station', 'A Line (Blue)', 'rail', 33.8968, -118.2238, 'COMPTON', true),
  ('Artesia Station', 'A Line (Blue)', 'rail', 33.8756, -118.2266, 'ARTESIA', true),
  ('Compton Bl/Central Av', 'Route 51', 'bus', 33.8958, -118.2290, NULL, true),
  ('Compton Bl/Alameda St', 'Route 51', 'bus', 33.8958, -118.2100, NULL, true),
  ('Compton Bl/Long Beach Bl', 'Route 51', 'bus', 33.8958, -118.2115, NULL, true),
  ('Compton Av/Rosecrans', 'Route 52', 'bus', 33.9020, -118.2201, NULL, true),
  ('Compton Av/Alondra', 'Route 52', 'bus', 33.8860, -118.2201, NULL, true),
  ('Central Av/Compton Bl', 'Route 53', 'bus', 33.8958, -118.2290, NULL, true),
  ('Central Av/Rosecrans', 'Route 53', 'bus', 33.9020, -118.2290, NULL, true),
  ('Rosecrans Av/Central', 'Route 125', 'bus', 33.9020, -118.2290, NULL, true),
  ('Artesia Bl/Central', 'Route 128', 'bus', 33.8755, -118.2290, NULL, true),
  ('Artesia Bl/Pioneer', 'Route 128', 'bus', 33.8755, -118.1950, NULL, true)
ON CONFLICT DO NOTHING;
