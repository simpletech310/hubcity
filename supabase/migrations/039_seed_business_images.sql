-- 039_seed_business_images.sql
-- Add representative Unsplash images to businesses that have no images
-- Uses category-appropriate, high-quality food/business photography

-- ═══════════════════════════════════════════════
-- RESTAURANTS — Mexican / Latin
-- ═══════════════════════════════════════════════

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&h=600&fit=crop']
WHERE id = 'c8241cc5-8bee-4190-827c-e34a6ac9de32' AND image_urls = '{}'; -- Al Pollo Restaurant

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=800&h=600&fit=crop']
WHERE id = 'c68f6fdd-7c6b-4646-88ab-113f4789a5f1' AND image_urls = '{}'; -- Alma's Place

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=800&h=600&fit=crop']
WHERE id = '8c213f13-00c4-47c5-8ccf-ef6f74c59107' AND image_urls = '{}'; -- Antojitos Los Cuates

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=800&h=600&fit=crop']
WHERE id = '89277e3b-eb13-4045-a7d0-b98ddf8a87ef' AND image_urls = '{}'; -- B-B-Q & Soul (BBQ)

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=800&h=600&fit=crop']
WHERE id = 'e31cd440-2dbd-42a8-be49-1a55291e1fd3' AND image_urls = '{}'; -- Belly's Sliders & Wings (food truck)

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=600&fit=crop']
WHERE id = '6b927024-5570-4d77-94d4-34be4764c8b2' AND image_urls = '{}'; -- Billionaire Burger Boyz

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&h=600&fit=crop']
WHERE id = '3fcec7ee-f29b-4677-a8b1-b7ac942500a4' AND image_urls = '{}'; -- Billionaire Pizza Company

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1640719028782-8230f1bdc546?w=800&h=600&fit=crop']
WHERE id = '4a5f24da-d167-47a1-a7fd-947d90fcdef0' AND image_urls = '{}'; -- Birrieria Barajas (birria)

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1544025162-d76694265947?w=800&h=600&fit=crop']
WHERE id = '76344145-2d39-49f4-9a78-d64dfd429aba' AND image_urls = '{}'; -- Bludso's BBQ

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1510130113356-d14a03ddb379?w=800&h=600&fit=crop']
WHERE id = '5ac937a8-32b9-4c2a-b8ae-2798165b163e' AND image_urls = '{}'; -- Central Fish Market

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1628543108325-1c27cd7246b3?w=800&h=600&fit=crop']
WHERE id = 'd3785914-b736-4f9a-a8ba-d26b9ea43f0f' AND image_urls = '{}'; -- CH y LA Birria

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&h=600&fit=crop']
WHERE id = '849d1d85-510b-4a60-bd91-23e987402ae8' AND image_urls = '{}'; -- China Express

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=600&fit=crop']
WHERE id = 'de3044c1-6df8-41ab-a9a7-6614c8894691' AND image_urls = '{}'; -- Coffee Time Donut

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1579631542720-3a87824fff86?w=800&h=600&fit=crop']
WHERE id = '476de9ce-3f12-4f1f-8499-f7f89abaa291' AND image_urls = '{}'; -- Compton Fish Market

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1606731219412-fb946e486726?w=800&h=600&fit=crop']
WHERE id = '43256505-e480-4098-a0ad-b8fae57dbc9b' AND image_urls = '{}'; -- Compton's Original Seafood & Chicken

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1558303272-755baa26ff31?w=800&h=600&fit=crop']
WHERE id = '0f68c0b3-9558-45c4-bd84-75d1bf3a6843' AND image_urls = '{}'; -- Daily Donut House

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800&h=600&fit=crop']
WHERE id = 'f6416f07-14f4-4b83-a246-fbd20d7e9e62' AND image_urls = '{}'; -- Donut House

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1533910534207-90f31029a78e?w=800&h=600&fit=crop']
WHERE id = 'b797c3cc-2543-4072-8b7c-dbb644a1d446' AND image_urls = '{}'; -- Donut Hut

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&h=600&fit=crop']
WHERE id = '47eb7631-c14c-4f3a-9899-7d93435b739c' AND image_urls = '{}'; -- Dulce Canella (food truck, sweet)

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1562967916-eb82221dfb44?w=800&h=600&fit=crop']
WHERE id = 'eb149559-0b63-43c9-a654-165e363f2463' AND image_urls = '{}'; -- Egg Roll King

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1625398407796-82650a8c135f?w=800&h=600&fit=crop']
WHERE id = 'e9804b73-237d-4cb7-a2f7-654349228eb5' AND image_urls = '{}'; -- El Cielo Restaurant

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=800&h=600&fit=crop']
WHERE id = '11e25532-ec48-4d1e-8f73-9ea8c140ce97' AND image_urls = '{}'; -- El Pollo Dorado (chicken)

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=800&h=600&fit=crop']
WHERE id = '53b83808-ebc1-4f7b-965a-6a2a36124d18' AND image_urls = '{}'; -- El Primo Mexican Food

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1613514785940-daed07799d9b?w=800&h=600&fit=crop']
WHERE id = 'e47469c1-ebb1-46f4-a5ad-5fa085547918' AND image_urls = '{}'; -- El Super Alberto Mexican Food

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop']
WHERE id = 'f9572438-eba0-4763-9aa4-5ce0cc7e6e3d' AND image_urls = '{}'; -- Everytable (healthy bowls)

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop']
WHERE id = '3d274ffa-462e-4559-98e0-8b005c32ea3d' AND image_urls = '{}'; -- Ferraro's On The Hill

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=800&h=600&fit=crop']
WHERE id = 'f27f439e-c16f-41d1-9ae8-2d0d655298ae' AND image_urls = '{}'; -- Fishbone Seafood

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&h=600&fit=crop']
WHERE id = '6e20d4e1-2de4-4426-8d64-e4c99c3dfd6d' AND image_urls = '{}'; -- General Seafood Meats and More

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=600&fit=crop']
WHERE id = '6a82b180-f164-4063-b795-5e747b049f8d' AND image_urls = '{}'; -- Habachihana Grill Food Truck

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&h=600&fit=crop']
WHERE id = '94bda0e4-0e21-427d-9214-6e95b9017a4f' AND image_urls = '{}'; -- Hamburguesas Uruapan (burgers)

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=800&h=600&fit=crop']
WHERE id = '03fdfb77-3b86-4f84-89a4-284d66a4484e' AND image_urls = '{}'; -- Johnson Brothers BBQ

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1544025162-d76694265947?w=800&h=600&fit=crop']
WHERE id = '23252826-401c-454d-8e17-a7d6deaf6ff2' AND image_urls = '{}'; -- Kitchen's Corner BBQ

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=800&h=600&fit=crop']
WHERE id = '566a6c01-4bd2-4273-a3ac-af2a3a010ed2' AND image_urls = '{}'; -- Krab Kingz (seafood)

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1617196034183-421b4917c92d?w=800&h=600&fit=crop']
WHERE id = 'c29e7c74-183a-4802-b1e4-c880727cd98b' AND image_urls = '{}'; -- Kumi Ko

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&h=600&fit=crop']
WHERE id = 'ba2100e4-29dd-45c2-90b5-f24b022c4523' AND image_urls = '{}'; -- La Pizza Loca

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1625398407796-82650a8c135f?w=800&h=600&fit=crop']
WHERE id = '0811630d-4de9-4363-8e0c-ccd8b30a8741' AND image_urls = '{}'; -- La Quinta Real

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=800&h=600&fit=crop']
WHERE id = '47fd9af1-95f8-421e-a3e4-0d7377a6c867' AND image_urls = '{}'; -- Las Comadres #2

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=600&fit=crop']
WHERE id = 'b5315712-fa1d-4b45-85e6-a94c56ea89e9' AND image_urls = '{}'; -- Los Dogos (food truck, hot dogs)

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1613514785940-daed07799d9b?w=800&h=600&fit=crop']
WHERE id = '8116069c-4fff-4328-88de-83e63f004abb' AND image_urls = '{}'; -- Los Sombreros Restaurant

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=600&fit=crop']
WHERE id = '75ade59c-17df-4ec3-b6b2-8acaaa947287' AND image_urls = '{}'; -- Louis Burgers II

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1558303272-755baa26ff31?w=800&h=600&fit=crop']
WHERE id = '7d375b13-6dcd-410d-919d-87aa91f0c95c' AND image_urls = '{}'; -- M & T Donut Shop

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1607013251379-e6eecfffe234?w=800&h=600&fit=crop']
WHERE id = 'f98e91f2-f2d3-489b-be55-5b7813aebff9' AND image_urls = '{}'; -- Mama's Tamales

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&h=600&fit=crop']
WHERE id = '892adbc5-855f-4443-b5cc-e53a6af300bf' AND image_urls = '{}'; -- Mariscos Alex (seafood truck)

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1606731219412-fb946e486726?w=800&h=600&fit=crop']
WHERE id = 'df8b9e5e-7691-4c30-978d-b69740e2752b' AND image_urls = '{}'; -- Mariscos El Tambo

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=800&h=600&fit=crop']
WHERE id = '18d648ad-2dd2-4cb9-84d0-d26da5bdcadf' AND image_urls = '{}'; -- Mariscos Las Islas Marias

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1510130113356-d14a03ddb379?w=800&h=600&fit=crop']
WHERE id = '69af0ebe-126a-4836-87ac-7e71a78e3207' AND image_urls = '{}'; -- Matt's Fish Market

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=600&fit=crop']
WHERE id = '6ebba028-f78a-48f1-b11b-89739028e414' AND image_urls = '{}'; -- Naka's Broiler

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1617196034183-421b4917c92d?w=800&h=600&fit=crop']
WHERE id = 'f64347a7-a99a-4376-96ae-3bd0b4006058' AND image_urls = '{}'; -- ON+ON Fresh Korean Kitchen

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&h=600&fit=crop']
WHERE id = 'c66b51f8-64ef-40ee-9edf-f390d53a03ea' AND image_urls = '{}'; -- Original Taco Pete

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&h=600&fit=crop']
WHERE id = '81bbd5c6-2f29-4276-bcde-590bb56679d1' AND image_urls = '{}'; -- Phat Noodles

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&h=600&fit=crop']
WHERE id = 'a61af3f5-8264-4ecb-91aa-c306c66abb58' AND image_urls = '{}'; -- Pizza King

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=800&h=600&fit=crop']
WHERE id = '6674138a-c6e3-4d45-84ff-3fdb56f99543' AND image_urls = '{}'; -- Tacos El Cacheton

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=800&h=600&fit=crop']
WHERE id = '437163fc-7fef-4bfb-a630-32184ef9561a' AND image_urls = '{}'; -- Tacos El Guero

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&h=600&fit=crop']
WHERE id = 'd80ca748-16f8-42e4-9855-3b2c5d83add1' AND image_urls = '{}'; -- Tacos El Picoso

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&h=600&fit=crop']
WHERE id = '45062b75-a846-4db8-9273-e2d6814a8530' AND image_urls = '{}'; -- Tam's Burgers

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=600&fit=crop']
WHERE id = '279995c5-994c-49d2-84b6-1ddbb4f5e376' AND image_urls = '{}'; -- Tam's Burgers No. 23

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1613514785940-daed07799d9b?w=800&h=600&fit=crop']
WHERE id = 'b78d9c36-29fb-465e-aef4-714744cdf7be' AND image_urls = '{}'; -- Taqueria El Poblano Estilo Tijuana

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=800&h=600&fit=crop']
WHERE id = '9b42743f-fd17-47b6-a873-efa34b4ae83c' AND image_urls = '{}'; -- Taqueria La Frontera

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&h=600&fit=crop']
WHERE id = '56f6048d-7959-4d7c-aedd-066297585305' AND image_urls = '{}'; -- Tom's Jr (burgers)

-- ═══════════════════════════════════════════════
-- BARBER SHOPS
-- ═══════════════════════════════════════════════

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1585747860019-8e9563e8a2e3?w=800&h=600&fit=crop']
WHERE id = '81525613-f6c0-4a64-b76c-45f0e4b6cba5' AND image_urls = '{}'; -- Barberizm The Shoppe

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&h=600&fit=crop']
WHERE id = '4d76aa5c-b557-4e73-8cde-1fe2129a4912' AND image_urls = '{}'; -- Compton Cuts Barbershop

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800&h=600&fit=crop']
WHERE id = '5c8dc0e2-b0b3-419e-9d50-df63085ce5c0' AND image_urls = '{}'; -- Don Juan Barber Shop

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=800&h=600&fit=crop']
WHERE id = 'e14d0519-d90e-499d-a0af-a9a7ce375a38' AND image_urls = '{}'; -- Frank's Barber Shop

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1585747860019-8e9563e8a2e3?w=800&h=600&fit=crop']
WHERE id = '6e4859d7-d1aa-4754-a867-f49c10d340ae' AND image_urls = '{}'; -- Price's Barber Shop

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&h=600&fit=crop']
WHERE id = 'e4d7e738-4228-4e3f-8505-2a89adc482b7' AND image_urls = '{}'; -- Prodigy Barber Shop

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800&h=600&fit=crop']
WHERE id = '01090da5-0341-4f78-9f4e-82f4c7346b49' AND image_urls = '{}'; -- St Julian Barber Shop

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=800&h=600&fit=crop']
WHERE id = '08e0d2c6-39a9-49c0-b69a-cff3fbab3839' AND image_urls = '{}'; -- Tolbert Barbershop

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1585747860019-8e9563e8a2e3?w=800&h=600&fit=crop']
WHERE id = '51388c3a-4ddb-4fdf-8c37-1c150047ff4b' AND image_urls = '{}'; -- Weaver's Barber Shop

-- ═══════════════════════════════════════════════
-- RETAIL
-- ═══════════════════════════════════════════════

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop']
WHERE id = '86a4921c-597b-44aa-8d66-6bddc1f33c54' AND image_urls = '{}'; -- Compton Proud Studios

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&h=600&fit=crop']
WHERE id = 'fe7a40c8-727b-43b1-b667-2f6e52ab62f0' AND image_urls = '{}'; -- Compton Streetwear

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1558171813-01342dfc7d3f?w=800&h=600&fit=crop']
WHERE id = '944c3d80-8389-4452-b1fe-b9a6eae64825' AND image_urls = '{}'; -- Denim Exchange

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800&h=600&fit=crop']
WHERE id = '74d1ee2c-185c-4caf-819b-f4bbfe705853' AND image_urls = '{}'; -- Made in Compton Store

-- ═══════════════════════════════════════════════
-- SERVICES
-- ═══════════════════════════════════════════════

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&h=600&fit=crop']
WHERE id = '8bd92021-2009-4849-9777-94e320a1fb70' AND image_urls = '{}'; -- Community Lawyers, Inc.

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1520340356584-f9166066d194?w=800&h=600&fit=crop']
WHERE id = '8c54a60a-244f-47eb-a3c2-6165a8d4d8ab' AND image_urls = '{}'; -- Compton Car Studio Express Car Wash

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=800&h=600&fit=crop']
WHERE id = 'b74b2c3c-85ae-4415-86d0-729ef4490908' AND image_urls = '{}'; -- Courtesy Cleaners

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1520340356584-f9166066d194?w=800&h=600&fit=crop']
WHERE id = '3780b764-d6ea-48bc-8e07-ff4f79f995ac' AND image_urls = '{}'; -- Flo's Express Car Wash

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop']
WHERE id = '96293e77-2431-4a33-b1f1-c074bdb96ee4' AND image_urls = '{}'; -- L.A. Estates Realty

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop']
WHERE id = 'd2b61dfd-6c5f-4369-a1f7-80f8fa2c101f' AND image_urls = '{}'; -- Lean Black, LLC

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=600&fit=crop']
WHERE id = '28b7cffe-2eae-4f42-b315-4f453d071761' AND image_urls = '{}'; -- Unlimited Tax Solutions

-- ═══════════════════════════════════════════════
-- AUTO
-- ═══════════════════════════════════════════════

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&h=600&fit=crop']
WHERE id = '4f116a57-b36c-4cf6-9a78-6a8e165db4cd' AND image_urls = '{}'; -- Carrillo Body Shop & Mufflers

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&h=600&fit=crop']
WHERE id = 'a3a76bec-bb65-4fcd-80ee-d13108102f3e' AND image_urls = '{}'; -- Compton Auto Care

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&h=600&fit=crop']
WHERE id = '8b7f5013-2f0d-43cb-a77d-71a80325bec9' AND image_urls = '{}'; -- Eddie's Mufflers

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&h=600&fit=crop']
WHERE id = '748cf884-abe5-4bf4-b25c-76dcc1c35352' AND image_urls = '{}'; -- Jump-Start Auto Mechanic

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&h=600&fit=crop']
WHERE id = 'f705b208-57a5-44bf-9abf-8aa0eaa468d1' AND image_urls = '{}'; -- Lopez Auto Service & Tires

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&h=600&fit=crop']
WHERE id = 'f08fb7c5-b9a5-477c-be45-52d3ef24518a' AND image_urls = '{}'; -- One Stop Universal Auto Care

-- ═══════════════════════════════════════════════
-- HEALTH
-- ═══════════════════════════════════════════════

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=600&fit=crop']
WHERE id = '247fc6b7-f736-47de-bd98-643dd4eb25f0' AND image_urls = '{}'; -- Babes of Wellness

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&h=600&fit=crop']
WHERE id = 'e5778f7c-ccb5-4773-88ae-41886985a126' AND image_urls = '{}'; -- ROADS Community Care Clinic

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800&h=600&fit=crop']
WHERE id = 'aa7cb092-9880-4c37-b5cb-cecc6c718d85' AND image_urls = '{}'; -- West Alondra Medical Pharmacy

-- ═══════════════════════════════════════════════
-- BEAUTY
-- ═══════════════════════════════════════════════

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&h=600&fit=crop']
WHERE id = '9f504b85-be44-49d2-ae99-fb26eae2f1ec' AND image_urls = '{}'; -- Amore Beauty Lounge

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&h=600&fit=crop']
WHERE id = '578ebfa2-e115-4de2-867f-df59660341f8' AND image_urls = '{}'; -- Glow Beauty Studio

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&h=600&fit=crop']
WHERE id = '5fc73551-1fd6-44cd-b877-cc25e07fead1' AND image_urls = '{}'; -- Guadalajara Beauty Salon

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&h=600&fit=crop']
WHERE id = 'a4b349d0-3214-4d17-bed1-c278c95e9c26' AND image_urls = '{}'; -- Hair Experience by Rhona

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&h=600&fit=crop']
WHERE id = '9e12c5ff-d801-49c0-bf1a-3fde80973878' AND image_urls = '{}'; -- Jalisco's Beauty Salon

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&h=600&fit=crop']
WHERE id = '89ad3e83-5905-44b6-b8bc-9a6b45988678' AND image_urls = '{}'; -- Nails on LA

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&h=600&fit=crop']
WHERE id = 'e80f3cb3-69b8-4a72-9b3b-df42bdb1fe32' AND image_urls = '{}'; -- Torres Beauty Salon

-- ═══════════════════════════════════════════════
-- OTHER (Jewelry, Flowers, etc.)
-- ═══════════════════════════════════════════════

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&h=600&fit=crop']
WHERE id = '90337943-150d-4f6b-a9c2-0ab5bc9769de' AND image_urls = '{}'; -- Blake's Loan & Jewelry

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=800&h=600&fit=crop']
WHERE id = 'ce6577de-4295-4758-bd3b-728af0d27075' AND image_urls = '{}'; -- Compton Flower Shop

UPDATE businesses SET image_urls = ARRAY['https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=600&fit=crop']
WHERE id = '2f6cd0c6-01a0-4bef-b9af-2b1ee64cf4ee' AND image_urls = '{}'; -- Compton Nursery & Florist
