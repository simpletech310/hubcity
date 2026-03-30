-- ============================================================
-- Hub City App: Seed Menu Items for Compton Restaurants
-- Prices in cents. Based on directory research + typical pricing.
-- ============================================================

-- ===================== BILLIONAIRE BURGER BOYZ =====================
INSERT INTO menu_items (business_id, name, description, price, category, sort_order) VALUES
('6b927024-5570-4d77-94d4-34be4764c8b2', 'Classic Burger', 'Handcrafted gourmet burger with lettuce, tomato, onion, pickles', 1299, 'Burgers', 1),
('6b927024-5570-4d77-94d4-34be4764c8b2', 'BBB Double Stack', 'Double patty with American cheese, caramelized onions, BBB sauce', 1599, 'Burgers', 2),
('6b927024-5570-4d77-94d4-34be4764c8b2', 'Grilled Shrimp Burger', 'Seasoned grilled shrimp patty on a brioche bun', 1699, 'Burgers', 3),
('6b927024-5570-4d77-94d4-34be4764c8b2', 'Fried Lobster Tail Burger', 'Crispy fried lobster tail with special sauce on brioche', 1999, 'Burgers', 4),
('6b927024-5570-4d77-94d4-34be4764c8b2', 'Vegan Burger', 'Plant-based patty with all the fixings', 1399, 'Burgers', 5),
('6b927024-5570-4d77-94d4-34be4764c8b2', 'The Daddy Collection', '4 fried wings + 2 BBQ sliders + onion straws + jambalaya fries', 2499, 'Combos', 6),
('6b927024-5570-4d77-94d4-34be4764c8b2', 'Jambalaya Fries', 'Seasoned fries loaded with jambalaya flavors', 899, 'Sides', 7),
('6b927024-5570-4d77-94d4-34be4764c8b2', 'Onion Straws', 'Crispy fried onion straws', 599, 'Sides', 8),
('6b927024-5570-4d77-94d4-34be4764c8b2', 'BBQ Sliders (3pc)', 'Three mini BBQ sliders', 1099, 'Sliders', 9),
('6b927024-5570-4d77-94d4-34be4764c8b2', 'Fried Wings (6pc)', 'Crispy fried chicken wings with your choice of sauce', 1199, 'Wings', 10),
('6b927024-5570-4d77-94d4-34be4764c8b2', 'Fried Wings (10pc)', 'Crispy fried chicken wings with your choice of sauce', 1899, 'Wings', 11),

-- ===================== CH Y LA BIRRIA =====================
('d3785914-b736-4f9a-a8ba-d26b9ea43f0f', 'Quesabirria Tacos (3pc)', 'Birria-dipped tortillas filled with tender birria meat and melted cheese, served with consomé', 1399, 'Tacos', 1),
('d3785914-b736-4f9a-a8ba-d26b9ea43f0f', 'Birria Bowl', 'Tender birria meat over rice with toppings', 1299, 'Bowls', 2),
('d3785914-b736-4f9a-a8ba-d26b9ea43f0f', 'Plato de Birria', 'Full plate of birria with rice, beans, and tortillas', 1499, 'Plates', 3),
('d3785914-b736-4f9a-a8ba-d26b9ea43f0f', 'Vaso de Birria', 'Cup of rich birria consomé', 799, 'Soups', 4),
('d3785914-b736-4f9a-a8ba-d26b9ea43f0f', 'Ramen Birria', 'Birria-infused ramen noodle soup', 1399, 'Soups', 5),
('d3785914-b736-4f9a-a8ba-d26b9ea43f0f', 'Mulita', 'Double tortilla stuffed with birria and cheese', 599, 'Tacos', 6),
('d3785914-b736-4f9a-a8ba-d26b9ea43f0f', 'Torta de Birria', 'Birria sandwich on a toasted bolillo roll', 1099, 'Sandwiches', 7),
('d3785914-b736-4f9a-a8ba-d26b9ea43f0f', 'Carne en su Jugo', 'Beef stewed in its own juices with beans and bacon', 1399, 'Plates', 8),

-- ===================== TAQUERIA EL POBLANO =====================
('b78d9c36-29fb-465e-aef4-714744cdf7be', 'Taco de Asada', 'TJ-style grilled carne asada street taco', 350, 'Tacos', 1),
('b78d9c36-29fb-465e-aef4-714744cdf7be', 'Taco de Pastor', 'Marinated pork al pastor taco', 350, 'Tacos', 2),
('b78d9c36-29fb-465e-aef4-714744cdf7be', 'Taco de Pollo', 'Grilled chicken taco', 350, 'Tacos', 3),
('b78d9c36-29fb-465e-aef4-714744cdf7be', 'Carne Asada Plate', 'Grilled asada with rice, beans, and tortillas', 1499, 'Plates', 4),
('b78d9c36-29fb-465e-aef4-714744cdf7be', 'Burrito de Asada', 'Large flour tortilla stuffed with carne asada, rice, beans', 1199, 'Burritos', 5),
('b78d9c36-29fb-465e-aef4-714744cdf7be', 'Quesadilla', 'Large flour tortilla with melted cheese and your choice of meat', 999, 'Quesadillas', 6),
('b78d9c36-29fb-465e-aef4-714744cdf7be', 'Mulita de Asada', 'Double corn tortilla with asada and cheese', 499, 'Tacos', 7),
('b78d9c36-29fb-465e-aef4-714744cdf7be', 'Nachos Supreme', 'Chips loaded with meat, cheese, guacamole, sour cream', 1099, 'Sides', 8),

-- ===================== EL PRIMO MEXICAN FOOD =====================
('53b83808-ebc1-4f7b-965a-6a2a36124d18', 'Chilaquiles', 'Crispy tortilla chips in salsa verde or roja with egg, cheese, sour cream', 1099, 'Breakfast', 1),
('53b83808-ebc1-4f7b-965a-6a2a36124d18', 'Breakfast Burrito', 'Eggs, cheese, potatoes, and your choice of meat', 999, 'Breakfast', 2),
('53b83808-ebc1-4f7b-965a-6a2a36124d18', 'Burrito Supreme', 'Large burrito with rice, beans, meat, cheese, guacamole', 1299, 'Burritos', 3),
('53b83808-ebc1-4f7b-965a-6a2a36124d18', 'Fajitas (Chicken or Steak)', 'Sizzling fajitas with peppers, onions, rice, beans, tortillas', 1599, 'Plates', 4),
('53b83808-ebc1-4f7b-965a-6a2a36124d18', 'Mariscos Plate', 'Seafood plate with rice and salad', 1699, 'Plates', 5),
('53b83808-ebc1-4f7b-965a-6a2a36124d18', 'Torta', 'Mexican sandwich on a toasted bolillo', 999, 'Sandwiches', 6),
('53b83808-ebc1-4f7b-965a-6a2a36124d18', 'Combo Plate', 'Choose 2: taco, enchilada, tamale, chile relleno with rice and beans', 1299, 'Plates', 7),

-- ===================== ANTOJITOS LOS CUATES =====================
('8c213f13-00c4-47c5-8ccf-ef6f74c59107', 'Tacos Dorados de Requeson (4pc)', 'Four fried tacos filled with Mexican ricotta cheese', 1099, 'Tacos', 1),
('8c213f13-00c4-47c5-8ccf-ef6f74c59107', 'Tacos Dorados de Papa (4pc)', 'Four fried potato tacos', 999, 'Tacos', 2),
('8c213f13-00c4-47c5-8ccf-ef6f74c59107', 'Sopes (3pc)', 'Thick corn masa topped with beans, meat, lettuce, cheese, cream', 999, 'Antojitos', 3),
('8c213f13-00c4-47c5-8ccf-ef6f74c59107', 'Gorditas (2pc)', 'Thick corn pockets stuffed with your choice of filling', 899, 'Antojitos', 4),
('8c213f13-00c4-47c5-8ccf-ef6f74c59107', 'Pozole', 'Traditional hominy soup with pork', 1199, 'Soups', 5),
('8c213f13-00c4-47c5-8ccf-ef6f74c59107', 'Enchiladas (3pc)', 'Corn tortillas rolled with chicken, topped with salsa and cheese', 1199, 'Plates', 6),

-- ===================== BIRRIERIA BARAJAS =====================
('4a5f24da-d167-47a1-a7fd-947d90fcdef0', 'Birria Plate', 'Authentic birria with rice, beans, tortillas, and consomé', 1499, 'Plates', 1),
('4a5f24da-d167-47a1-a7fd-947d90fcdef0', 'Birria Tacos (3pc)', 'Three birria tacos with consomé for dipping', 1199, 'Tacos', 2),
('4a5f24da-d167-47a1-a7fd-947d90fcdef0', 'Consomé (Large)', 'Large bowl of rich birria broth', 899, 'Soups', 3),
('4a5f24da-d167-47a1-a7fd-947d90fcdef0', 'Quesabirria (3pc)', 'Cheese and birria melted in crispy tortillas with consomé', 1399, 'Tacos', 4),

-- ===================== ALMA'S PLACE (Soul Food) =====================
('c68f6fdd-7c6b-4646-88ab-113f4789a5f1', 'Fried Chicken (2pc)', 'Golden fried chicken pieces', 999, 'Entrees', 1),
('c68f6fdd-7c6b-4646-88ab-113f4789a5f1', 'Fried Chicken (3pc)', 'Golden fried chicken pieces', 1299, 'Entrees', 2),
('c68f6fdd-7c6b-4646-88ab-113f4789a5f1', 'Chicken Peach Cobbler Pancakes', 'Signature dish: fried chicken with peach cobbler pancakes', 1499, 'Breakfast', 3),
('c68f6fdd-7c6b-4646-88ab-113f4789a5f1', 'Mac and Cheese', 'Creamy homemade mac and cheese', 599, 'Sides', 4),
('c68f6fdd-7c6b-4646-88ab-113f4789a5f1', 'Collard Greens', 'Slow-cooked Southern-style collard greens', 499, 'Sides', 5),
('c68f6fdd-7c6b-4646-88ab-113f4789a5f1', 'Red Beans and Rice', 'Classic red beans over white rice', 599, 'Sides', 6),
('c68f6fdd-7c6b-4646-88ab-113f4789a5f1', 'Yams', 'Sweet candied yams', 499, 'Sides', 7),
('c68f6fdd-7c6b-4646-88ab-113f4789a5f1', 'Potato Salad', 'Homemade Southern potato salad', 499, 'Sides', 8),
('c68f6fdd-7c6b-4646-88ab-113f4789a5f1', 'Cornbread Muffins (2pc)', 'Fresh-baked cornbread muffins', 399, 'Sides', 9),
('c68f6fdd-7c6b-4646-88ab-113f4789a5f1', 'Soul Food Combo Plate', 'Choice of meat with 2 sides and cornbread', 1499, 'Combos', 10),

-- ===================== KITCHEN'S CORNER BBQ =====================
('23252826-401c-454d-8e17-a7d6deaf6ff2', 'Brisket Plate', 'Slow-smoked brisket with 2 sides', 1899, 'Plates', 1),
('23252826-401c-454d-8e17-a7d6deaf6ff2', 'Dino Ribs', 'Massive beef ribs, slow-smoked', 2499, 'Plates', 2),
('23252826-401c-454d-8e17-a7d6deaf6ff2', 'Rib Tips Plate', 'Smoked rib tips with 2 sides', 1699, 'Plates', 3),
('23252826-401c-454d-8e17-a7d6deaf6ff2', 'Pulled Pork Plate', 'Smoked pulled pork with 2 sides', 1599, 'Plates', 4),
('23252826-401c-454d-8e17-a7d6deaf6ff2', 'BBQ Mac and Cheese', 'Creamy mac topped with smoked meat', 899, 'Sides', 5),
('23252826-401c-454d-8e17-a7d6deaf6ff2', 'Collard Greens', 'Southern-style collard greens', 599, 'Sides', 6),
('23252826-401c-454d-8e17-a7d6deaf6ff2', 'Brisket Sandwich', 'Smoked brisket on a toasted bun', 1499, 'Sandwiches', 7),

-- ===================== JOHNSON BROTHERS BBQ =====================
('03fdfb77-3b86-4f84-89a4-284d66a4484e', 'Ribs (Half Slab)', 'Slow-smoked pork ribs', 1699, 'Ribs', 1),
('03fdfb77-3b86-4f84-89a4-284d66a4484e', 'Ribs (Full Slab)', 'Full slab of slow-smoked pork ribs', 2699, 'Ribs', 2),
('03fdfb77-3b86-4f84-89a4-284d66a4484e', 'Rib Tips', 'Smoked and sauced rib tips', 1499, 'Ribs', 3),
('03fdfb77-3b86-4f84-89a4-284d66a4484e', 'Whole Chicken', 'Whole smoked chicken', 1499, 'Chicken', 4),
('03fdfb77-3b86-4f84-89a4-284d66a4484e', 'Wings (10pc)', 'BBQ smoked wings', 1299, 'Wings', 5),
('03fdfb77-3b86-4f84-89a4-284d66a4484e', 'Pulled Pork Fries', 'Fries loaded with pulled pork and BBQ sauce', 1199, 'Sides', 6),
('03fdfb77-3b86-4f84-89a4-284d66a4484e', 'BBQ Beans', 'Slow-cooked BBQ baked beans', 499, 'Sides', 7),
('03fdfb77-3b86-4f84-89a4-284d66a4484e', 'Potato Salad', 'Homemade potato salad', 499, 'Sides', 8),

-- ===================== FISHBONE SEAFOOD =====================
('f27f439e-c16f-41d1-9ae8-2d0d655298ae', 'Fried Fish Plate (Catfish)', 'Golden fried catfish with fries and coleslaw', 1399, 'Fish Fry', 1),
('f27f439e-c16f-41d1-9ae8-2d0d655298ae', 'Fried Fish Plate (Tilapia)', 'Golden fried tilapia with fries and coleslaw', 1299, 'Fish Fry', 2),
('f27f439e-c16f-41d1-9ae8-2d0d655298ae', 'Grilled Salmon Salad', 'Fresh grilled salmon over mixed greens', 1599, 'Salads', 3),
('f27f439e-c16f-41d1-9ae8-2d0d655298ae', 'Grilled Shrimp Salad', 'Seasoned grilled shrimp over mixed greens', 1499, 'Salads', 4),
('f27f439e-c16f-41d1-9ae8-2d0d655298ae', 'Shrimp Po''Boy', 'Fried shrimp on a toasted French roll with remoulade', 1299, 'Po''Boys', 5),
('f27f439e-c16f-41d1-9ae8-2d0d655298ae', 'Catfish Po''Boy', 'Fried catfish on a toasted French roll', 1199, 'Po''Boys', 6),
('f27f439e-c16f-41d1-9ae8-2d0d655298ae', 'Gumbo (Bowl)', 'Hearty seafood gumbo with rice', 1199, 'Soups', 7),
('f27f439e-c16f-41d1-9ae8-2d0d655298ae', 'Family Meal (Feeds 4)', 'Choice of fish with large sides of fries, coleslaw, bread', 3999, 'Family Meals', 8),

-- ===================== COMPTON'S ORIGINAL SEAFOOD & CHICKEN =====================
('43256505-e480-4098-a0ad-b8fae57dbc9b', 'Fried Shrimp Plate', 'Golden fried shrimp with fries and coleslaw', 1399, 'Seafood', 1),
('43256505-e480-4098-a0ad-b8fae57dbc9b', 'Fried Fish Plate', 'Fresh fried fish with fries and coleslaw', 1299, 'Seafood', 2),
('43256505-e480-4098-a0ad-b8fae57dbc9b', 'Fried Oysters', 'Crispy fried oysters with dipping sauce', 1399, 'Seafood', 3),
('43256505-e480-4098-a0ad-b8fae57dbc9b', 'Sweet Heat Chicken', 'Fried chicken with sweet heat glaze', 1199, 'Chicken', 4),
('43256505-e480-4098-a0ad-b8fae57dbc9b', 'Hot Buffalo Chicken', 'Fried chicken tossed in buffalo sauce', 1199, 'Chicken', 5),
('43256505-e480-4098-a0ad-b8fae57dbc9b', 'Honey BBQ Chicken', 'Fried chicken glazed in honey BBQ', 1199, 'Chicken', 6),
('43256505-e480-4098-a0ad-b8fae57dbc9b', 'Lemon Pepper Chicken', 'Fried chicken with lemon pepper seasoning', 1199, 'Chicken', 7),
('43256505-e480-4098-a0ad-b8fae57dbc9b', 'Hush Puppies', 'Crispy cornmeal hush puppies', 499, 'Sides', 8),
('43256505-e480-4098-a0ad-b8fae57dbc9b', 'Family Meal', 'Mixed fish and chicken with sides for the family', 3499, 'Family Meals', 9),

-- ===================== KUMI KO (Japanese) =====================
('c29e7c74-183a-4802-b1e4-c880727cd98b', 'California Roll', 'Crab, avocado, cucumber roll', 899, 'Rolls', 1),
('c29e7c74-183a-4802-b1e4-c880727cd98b', 'Spicy Tuna Roll', 'Spicy tuna with cucumber', 999, 'Rolls', 2),
('c29e7c74-183a-4802-b1e4-c880727cd98b', 'Rainbow Roll', 'California roll topped with assorted sashimi', 1399, 'Special Rolls', 3),
('c29e7c74-183a-4802-b1e4-c880727cd98b', 'Dragon Roll', 'Shrimp tempura topped with eel and avocado', 1499, 'Special Rolls', 4),
('c29e7c74-183a-4802-b1e4-c880727cd98b', 'Sashimi Plate', 'Assorted fresh sashimi', 1699, 'Sashimi', 5),
('c29e7c74-183a-4802-b1e4-c880727cd98b', 'Chicken Teriyaki', 'Grilled chicken with teriyaki sauce, rice, salad', 1299, 'Entrees', 6),
('c29e7c74-183a-4802-b1e4-c880727cd98b', 'Tempura Udon', 'Udon noodle soup with shrimp tempura', 1299, 'Noodles', 7),
('c29e7c74-183a-4802-b1e4-c880727cd98b', 'Edamame', 'Steamed soybean pods with sea salt', 599, 'Appetizers', 8),
('c29e7c74-183a-4802-b1e4-c880727cd98b', 'Miso Soup', 'Traditional Japanese miso soup', 399, 'Soups', 9),

-- ===================== ON+ON KOREAN KITCHEN =====================
('f64347a7-a99a-4376-96ae-3bd0b4006058', 'Bibimbap', 'Rice bowl with mixed vegetables, egg, and gochujang sauce', 1299, 'Bowls', 1),
('f64347a7-a99a-4376-96ae-3bd0b4006058', 'Bulgogi Plate', 'Marinated grilled beef with rice and banchan', 1499, 'Plates', 2),
('f64347a7-a99a-4376-96ae-3bd0b4006058', 'Spicy Pork Plate', 'Gochujang marinated pork with rice and banchan', 1399, 'Plates', 3),
('f64347a7-a99a-4376-96ae-3bd0b4006058', 'Korean Fried Chicken', 'Crispy Korean-style fried chicken', 1299, 'Chicken', 4),
('f64347a7-a99a-4376-96ae-3bd0b4006058', 'Japchae', 'Sweet potato glass noodles with vegetables', 1199, 'Noodles', 5),
('f64347a7-a99a-4376-96ae-3bd0b4006058', 'Kimchi Fried Rice', 'Fried rice with kimchi, egg, and your choice of protein', 1199, 'Rice', 6),
('f64347a7-a99a-4376-96ae-3bd0b4006058', 'Tteokbokki', 'Spicy rice cakes in gochujang sauce', 999, 'Appetizers', 7),

-- ===================== LOUIS BURGERS II =====================
('75ade59c-17df-4ec3-b6b2-8acaaa947287', 'Cheeseburger', 'Classic cheeseburger with all the fixings', 699, 'Burgers', 1),
('75ade59c-17df-4ec3-b6b2-8acaaa947287', 'Double Cheeseburger', 'Double patty cheeseburger', 899, 'Burgers', 2),
('75ade59c-17df-4ec3-b6b2-8acaaa947287', 'Pastrami Sandwich', 'Hot pastrami on a toasted roll', 999, 'Sandwiches', 3),
('75ade59c-17df-4ec3-b6b2-8acaaa947287', 'Pastrami Burger', 'Burger topped with hot pastrami and cheese', 1099, 'Burgers', 4),
('75ade59c-17df-4ec3-b6b2-8acaaa947287', 'Chili Cheese Fries', 'Fries loaded with chili and melted cheese', 699, 'Sides', 5),
('75ade59c-17df-4ec3-b6b2-8acaaa947287', 'Regular Fries', 'Crispy golden fries', 399, 'Sides', 6),
('75ade59c-17df-4ec3-b6b2-8acaaa947287', 'Onion Rings', 'Crispy battered onion rings', 499, 'Sides', 7),

-- ===================== FERRARO'S ON THE HILL =====================
('3d274ffa-462e-4559-98e0-8b005c32ea3d', 'Spaghetti & Meatballs', 'Classic spaghetti with house-made meatballs and marinara', 1399, 'Pasta', 1),
('3d274ffa-462e-4559-98e0-8b005c32ea3d', 'Chicken Parmesan', 'Breaded chicken cutlet with marinara and mozzarella over pasta', 1599, 'Pasta', 2),
('3d274ffa-462e-4559-98e0-8b005c32ea3d', 'Fettuccine Alfredo', 'Fettuccine in creamy alfredo sauce', 1399, 'Pasta', 3),
('3d274ffa-462e-4559-98e0-8b005c32ea3d', 'Margherita Pizza', 'Fresh mozzarella, tomato, basil on thin crust', 1299, 'Pizza', 4),
('3d274ffa-462e-4559-98e0-8b005c32ea3d', 'Pepperoni Pizza', 'Classic pepperoni on house-made crust', 1299, 'Pizza', 5),
('3d274ffa-462e-4559-98e0-8b005c32ea3d', 'Calzone', 'Folded pizza dough stuffed with ricotta, mozzarella, and your choice of filling', 1399, 'Pizza', 6),
('3d274ffa-462e-4559-98e0-8b005c32ea3d', 'Caesar Salad', 'Romaine lettuce with caesar dressing, croutons, parmesan', 999, 'Salads', 7),
('3d274ffa-462e-4559-98e0-8b005c32ea3d', 'Tiramisu', 'Classic Italian tiramisu', 799, 'Desserts', 8),

-- ===================== PIZZA KING =====================
('a61af3f5-8264-4ecb-91aa-c306c66abb58', 'Cheese Pizza (Large)', 'Fresh-made cheese pizza with perfect crust', 1299, 'Pizza', 1),
('a61af3f5-8264-4ecb-91aa-c306c66abb58', 'Pepperoni Pizza (Large)', 'Pepperoni on fresh-made crust', 1499, 'Pizza', 2),
('a61af3f5-8264-4ecb-91aa-c306c66abb58', 'Supreme Pizza (Large)', 'Loaded with pepperoni, sausage, peppers, onions, olives, mushrooms', 1699, 'Pizza', 3),
('a61af3f5-8264-4ecb-91aa-c306c66abb58', 'Meat Lovers Pizza (Large)', 'Pepperoni, sausage, ham, bacon on fresh crust', 1699, 'Pizza', 4),
('a61af3f5-8264-4ecb-91aa-c306c66abb58', 'Wings (10pc)', 'Chicken wings with your choice of sauce', 1199, 'Wings', 5),
('a61af3f5-8264-4ecb-91aa-c306c66abb58', 'Garlic Bread', 'Toasted garlic bread with butter', 499, 'Sides', 6),

-- ===================== KRAB KINGZ =====================
('566a6c01-4bd2-4273-a3ac-af2a3a010ed2', 'Snow Crab Legs (1 lb)', 'Cajun-seasoned snow crab legs', 2499, 'Crab', 1),
('566a6c01-4bd2-4273-a3ac-af2a3a010ed2', 'King Crab Legs (1 lb)', 'Cajun-seasoned king crab legs', 3999, 'Crab', 2),
('566a6c01-4bd2-4273-a3ac-af2a3a010ed2', 'Shrimp Boil (1 lb)', 'Cajun shrimp boil with corn and potatoes', 1699, 'Boils', 3),
('566a6c01-4bd2-4273-a3ac-af2a3a010ed2', 'Combo Boil', 'Shrimp, crab, sausage, corn, potatoes in Cajun butter', 2999, 'Boils', 4),
('566a6c01-4bd2-4273-a3ac-af2a3a010ed2', 'Lobster Tail', 'Cajun-seasoned lobster tail', 2499, 'Seafood', 5),
('566a6c01-4bd2-4273-a3ac-af2a3a010ed2', 'Cajun Fries', 'Seasoned Cajun fries', 599, 'Sides', 6),

-- ===================== EL CIELO (Salvadoran) =====================
('e9804b73-237d-4cb7-a2f7-654349228eb5', 'Pupusas (3pc)', 'Traditional Salvadoran stuffed corn masa with curtido and salsa', 999, 'Pupusas', 1),
('e9804b73-237d-4cb7-a2f7-654349228eb5', 'Pupusa de Queso', 'Cheese-filled pupusa', 350, 'Pupusas', 2),
('e9804b73-237d-4cb7-a2f7-654349228eb5', 'Pupusa de Chicharron', 'Pork and cheese pupusa', 399, 'Pupusas', 3),
('e9804b73-237d-4cb7-a2f7-654349228eb5', 'Pupusa Revuelta', 'Mixed filling: cheese, beans, chicharron', 399, 'Pupusas', 4),
('e9804b73-237d-4cb7-a2f7-654349228eb5', 'Platano Frito con Crema', 'Fried sweet plantain with Salvadoran cream', 699, 'Sides', 5),
('e9804b73-237d-4cb7-a2f7-654349228eb5', 'Yuca Frita', 'Fried cassava with curtido', 799, 'Sides', 6),
('e9804b73-237d-4cb7-a2f7-654349228eb5', 'Pollo Guisado Plate', 'Stewed chicken with rice, beans, salad, tortillas', 1299, 'Plates', 7),
('e9804b73-237d-4cb7-a2f7-654349228eb5', 'Carne Asada Plate', 'Grilled steak with rice, beans, salad, tortillas', 1499, 'Plates', 8),

-- ===================== HAMBURGUESAS URUAPAN (Food Truck) =====================
('94bda0e4-0e21-427d-9214-6e95b9017a4f', 'Hamburguesa Sencilla', 'Single patty Mexican-style burger with all toppings', 799, 'Burgers', 1),
('94bda0e4-0e21-427d-9214-6e95b9017a4f', 'Hamburguesa Doble', 'Double patty with cheese, ham, bacon, hot dog, avocado, pineapple', 1099, 'Burgers', 2),
('94bda0e4-0e21-427d-9214-6e95b9017a4f', 'Hamburguesa Especial', 'Triple stack with everything — the works', 1399, 'Burgers', 3),
('94bda0e4-0e21-427d-9214-6e95b9017a4f', 'Hot Dog Estilo Uruapan', 'Michoacan-style loaded hot dog', 599, 'Hot Dogs', 4),
('94bda0e4-0e21-427d-9214-6e95b9017a4f', 'Papas Locas', 'Loaded crazy fries with all the toppings', 799, 'Sides', 5),

-- ===================== TACOS EL CACHETON (Food Truck) =====================
('6674138a-c6e3-4d45-84ff-3fdb56f99543', 'Street Tacos (3pc)', 'Authentic street tacos with onion and cilantro', 699, 'Tacos', 1),
('6674138a-c6e3-4d45-84ff-3fdb56f99543', 'Taco de Asada', 'Grilled steak taco', 299, 'Tacos', 2),
('6674138a-c6e3-4d45-84ff-3fdb56f99543', 'Taco de Pastor', 'Marinated pork taco', 299, 'Tacos', 3),
('6674138a-c6e3-4d45-84ff-3fdb56f99543', 'Churros (3pc)', 'Fresh fried churros with cinnamon sugar', 499, 'Desserts', 4),
('6674138a-c6e3-4d45-84ff-3fdb56f99543', 'Burrito', 'Large burrito with your choice of meat', 1099, 'Burritos', 5),
('6674138a-c6e3-4d45-84ff-3fdb56f99543', 'Quesadilla', 'Cheese quesadilla with meat', 899, 'Quesadillas', 6),

-- ===================== PHAT NOODLES =====================
('81bbd5c6-2f29-4276-bcde-590bb56679d1', 'Phnom Penh Noodle Soup', 'Traditional Cambodian rice noodle soup with pork and shrimp', 1199, 'Noodle Soups', 1),
('81bbd5c6-2f29-4276-bcde-590bb56679d1', 'Lok Lak (Shaking Beef)', 'Stir-fried beef with pepper-lime dipping sauce and rice', 1399, 'Plates', 2),
('81bbd5c6-2f29-4276-bcde-590bb56679d1', 'Pad Thai', 'Stir-fried rice noodles with egg, bean sprouts, peanuts', 1199, 'Noodles', 3),
('81bbd5c6-2f29-4276-bcde-590bb56679d1', 'Chicken Stir Fry Noodles', 'Wok-fried noodles with chicken and vegetables', 1099, 'Noodles', 4),
('81bbd5c6-2f29-4276-bcde-590bb56679d1', 'Spring Rolls (4pc)', 'Crispy fried spring rolls', 699, 'Appetizers', 5),

-- ===================== TAM'S BURGERS =====================
('45062b75-a846-4db8-9273-e2d6814a8530', 'Cheeseburger', 'Classic cheeseburger', 599, 'Burgers', 1),
('45062b75-a846-4db8-9273-e2d6814a8530', 'Double Cheeseburger', 'Double patty cheeseburger', 799, 'Burgers', 2),
('45062b75-a846-4db8-9273-e2d6814a8530', 'Pastrami Sandwich', 'Hot pastrami on a roll', 899, 'Sandwiches', 3),
('45062b75-a846-4db8-9273-e2d6814a8530', 'Chicken Sandwich', 'Fried chicken sandwich', 799, 'Sandwiches', 4),
('45062b75-a846-4db8-9273-e2d6814a8530', 'Breakfast Burrito', 'Eggs, potatoes, cheese, and meat', 799, 'Breakfast', 5),
('45062b75-a846-4db8-9273-e2d6814a8530', 'Fries', 'Golden crispy fries', 349, 'Sides', 6),
('45062b75-a846-4db8-9273-e2d6814a8530', 'Chili Cheese Fries', 'Fries with chili and cheese', 599, 'Sides', 7),

-- ===================== ORIGINAL TACO PETE =====================
('c66b51f8-64ef-40ee-9edf-f390d53a03ea', 'Soft Shell Tacos (3pc)', 'Signature soft shell tacos with house taco sauce', 799, 'Tacos', 1),
('c66b51f8-64ef-40ee-9edf-f390d53a03ea', 'Soft Shell Tacos (6pc)', 'Six soft shell tacos', 1399, 'Tacos', 2),
('c66b51f8-64ef-40ee-9edf-f390d53a03ea', 'Taco Plate', 'Tacos with rice and beans', 1099, 'Plates', 3),
('c66b51f8-64ef-40ee-9edf-f390d53a03ea', 'Burrito', 'Large burrito with your choice of filling', 999, 'Burritos', 4),
('c66b51f8-64ef-40ee-9edf-f390d53a03ea', 'Nachos', 'Chips with cheese, beans, and toppings', 799, 'Sides', 5),

-- ===================== BELLY'S SLIDERS & WINGS (Food Truck) =====================
('e31cd440-2dbd-42a8-be49-1a55291e1fd3', 'Sliders (3pc)', 'Three mini burgers with signature sauce', 899, 'Sliders', 1),
('e31cd440-2dbd-42a8-be49-1a55291e1fd3', 'Sliders (5pc)', 'Five mini burgers with signature sauce', 1399, 'Sliders', 2),
('e31cd440-2dbd-42a8-be49-1a55291e1fd3', 'Wings (6pc)', 'Six wings with your choice of sauce', 999, 'Wings', 3),
('e31cd440-2dbd-42a8-be49-1a55291e1fd3', 'Wings (10pc)', 'Ten wings with your choice of sauce', 1499, 'Wings', 4),
('e31cd440-2dbd-42a8-be49-1a55291e1fd3', 'Combo (3 Sliders + 6 Wings)', 'Three sliders and six wings', 1699, 'Combos', 5),
('e31cd440-2dbd-42a8-be49-1a55291e1fd3', 'Fries', 'Seasoned fries', 499, 'Sides', 6),

-- ===================== LA PIZZA LOCA =====================
('ba2100e4-29dd-45c2-90b5-f24b022c4523', 'Cheese Pizza (Large)', 'Large cheese pizza', 999, 'Pizza', 1),
('ba2100e4-29dd-45c2-90b5-f24b022c4523', 'Pepperoni Pizza (Large)', 'Large pepperoni pizza', 1199, 'Pizza', 2),
('ba2100e4-29dd-45c2-90b5-f24b022c4523', 'Mexican Pizza', 'Pizza with jalapeños, chorizo, and Mexican-inspired toppings', 1299, 'Pizza', 3),
('ba2100e4-29dd-45c2-90b5-f24b022c4523', 'Wings (8pc)', 'Chicken wings with sauce', 899, 'Wings', 4),
('ba2100e4-29dd-45c2-90b5-f24b022c4523', 'Crazy Bread', 'Cheesy garlic bread sticks', 499, 'Sides', 5),

-- ===================== M & T DONUT SHOP =====================
('7d375b13-6dcd-410d-919d-87aa91f0c95c', 'Glazed Donut', 'Classic glazed donut', 175, 'Donuts', 1),
('7d375b13-6dcd-410d-919d-87aa91f0c95c', 'Chocolate Donut', 'Chocolate frosted donut', 199, 'Donuts', 2),
('7d375b13-6dcd-410d-919d-87aa91f0c95c', 'Apple Fritter', 'Large apple fritter', 299, 'Donuts', 3),
('7d375b13-6dcd-410d-919d-87aa91f0c95c', 'Dozen Assorted Donuts', 'Box of 12 assorted fresh donuts', 1599, 'Donuts', 4),
('7d375b13-6dcd-410d-919d-87aa91f0c95c', 'Coffee (Regular)', 'Fresh brewed coffee', 199, 'Drinks', 5),
('7d375b13-6dcd-410d-919d-87aa91f0c95c', 'Coffee (Large)', 'Large fresh brewed coffee', 299, 'Drinks', 6),
('7d375b13-6dcd-410d-919d-87aa91f0c95c', 'Croissant', 'Buttery croissant', 249, 'Pastries', 7),

-- ===================== EVERYTABLE =====================
('f9572438-eba0-4763-9aa4-5ce0cc7e6e3d', 'Chicken Tikka Masala Bowl', 'Chef-prepared chicken tikka over rice', 799, 'Bowls', 1),
('f9572438-eba0-4763-9aa4-5ce0cc7e6e3d', 'Jamaican Jerk Chicken Bowl', 'Jerk chicken with rice and beans', 799, 'Bowls', 2),
('f9572438-eba0-4763-9aa4-5ce0cc7e6e3d', 'Southwest Chicken Salad', 'Grilled chicken, black beans, corn, avocado over greens', 799, 'Salads', 3),
('f9572438-eba0-4763-9aa4-5ce0cc7e6e3d', 'Kale Caesar Salad', 'Kale with caesar dressing and croutons', 699, 'Salads', 4),
('f9572438-eba0-4763-9aa4-5ce0cc7e6e3d', 'Turkey Meatball Bowl', 'Turkey meatballs with vegetables and grain', 799, 'Bowls', 5),
('f9572438-eba0-4763-9aa4-5ce0cc7e6e3d', 'Fresh Juice', 'Cold-pressed fresh juice', 499, 'Drinks', 6)

ON CONFLICT DO NOTHING;
