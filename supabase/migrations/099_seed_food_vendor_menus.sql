-- ============================================================
-- Seed: menu_items for the 5 demo food vendors (098)
-- ============================================================
-- price is stored in cents (INTEGER). $12.99 = 1299.
-- Paste-safe: no table-alias dot-notation, no example.com URLs.
-- Re-runnable: each item dedups via NOT EXISTS on (business_id, name).
-- ============================================================

-- ── Hub City Burger House ────────────────────────────────────
INSERT INTO menu_items (business_id, name, description, price, image_url, category, sort_order)
SELECT b.id, x.name, x.description, x.price, x.image_url, x.category, x.sort_order
FROM businesses b, (VALUES
  ('Hub City Smashburger', 'Two smash patties, American cheese, special sauce, pickles on a brioche bun.',
   899, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&q=80', 'Burgers', 1),
  ('Bacon Cheddar Smash', 'Double smash, sharp cheddar, candied bacon, caramelized onions.',
   1099, 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=1200&q=80', 'Burgers', 2),
  ('The Quad Buster', 'Four patties, four cheese, bacon, lettuce, tomato. The challenge burger.',
   1899, 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=1200&q=80', 'Burgers', 3),
  ('Beef-Tallow Fries', 'Hand-cut, fried in beef tallow, finished with sea salt.',
   499, 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=1200&q=80', 'Sides', 4),
  ('Garlic Parm Fries', 'Tallow fries tossed in garlic, parsley, parmesan.',
   599, 'https://images.unsplash.com/photo-1639024471283-03518883512d?w=1200&q=80', 'Sides', 5),
  ('Chocolate Malt Shake', 'Hand-spun chocolate malt with whipped cream.',
   599, 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=1200&q=80', 'Shakes', 6)
) AS x(name, description, price, image_url, category, sort_order)
WHERE b.slug = 'hub-city-burger-house'
  AND NOT EXISTS (
    SELECT 1 FROM menu_items mi
    WHERE mi.business_id = b.id AND mi.name = x.name
  );

-- ── Compton Soul Wings ───────────────────────────────────────
INSERT INTO menu_items (business_id, name, description, price, image_url, category, sort_order)
SELECT b.id, x.name, x.description, x.price, x.image_url, x.category, x.sort_order
FROM businesses b, (VALUES
  ('6-Piece Wing Combo', 'Six wings, choice of sauce, fries, drink.',
   1199, 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=1200&q=80', 'Wings', 1),
  ('10-Piece Wing Combo', 'Ten wings, two sauces, fries, drink.',
   1799, 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=1200&q=80', 'Wings', 2),
  ('Reaper Hot Wings (10pc)', 'Carolina reaper sauce. The dare wings.',
   1899, 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=1200&q=80', 'Wings', 3),
  ('Mac and Cheese', 'Three-cheese baked mac with crispy top.',
   699, 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=1200&q=80', 'Sides', 4),
  ('Collard Greens', 'Slow-cooked greens with smoked turkey.',
   599, 'https://images.unsplash.com/photo-1606756790138-261d2b21cd75?w=1200&q=80', 'Sides', 5),
  ('Candied Yams', 'Cinnamon-brown-sugar baked yams.',
   599, 'https://images.unsplash.com/photo-1574484184081-afea8a62f9c6?w=1200&q=80', 'Sides', 6)
) AS x(name, description, price, image_url, category, sort_order)
WHERE b.slug = 'compton-soul-wings'
  AND NOT EXISTS (
    SELECT 1 FROM menu_items mi
    WHERE mi.business_id = b.id AND mi.name = x.name
  );

-- ── Tia Carmen Tacos ─────────────────────────────────────────
INSERT INTO menu_items (business_id, name, description, price, image_url, category, sort_order)
SELECT b.id, x.name, x.description, x.price, x.image_url, x.category, x.sort_order
FROM businesses b, (VALUES
  ('Al Pastor Taco', 'Marinated pork off the trompo, pineapple, onion, cilantro.',
   399, 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=1200&q=80', 'Tacos', 1),
  ('Suadero Taco', 'Slow-cooked beef brisket, onion, cilantro, salsa verde.',
   399, 'https://images.unsplash.com/photo-1611250188496-e966043a0629?w=1200&q=80', 'Tacos', 2),
  ('Lengua Taco', 'Tender beef tongue, lime, salsa roja.',
   449, 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=1200&q=80', 'Tacos', 3),
  ('Quesabirria (3pc)', 'Three cheese-stuffed birria tacos with consommé.',
   1499, 'https://images.unsplash.com/photo-1613514785940-daed07799d9b?w=1200&q=80', 'Specials', 4),
  ('Elote', 'Grilled corn, mayo, cotija, lime, chili.',
   499, 'https://images.unsplash.com/photo-1625867260036-d0c10b22da7d?w=1200&q=80', 'Sides', 5),
  ('Agua Fresca', 'Choice of horchata, jamaica, or tamarindo. 16oz.',
   399, 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=1200&q=80', 'Drinks', 6)
) AS x(name, description, price, image_url, category, sort_order)
WHERE b.slug = 'tia-carmen-tacos'
  AND NOT EXISTS (
    SELECT 1 FROM menu_items mi
    WHERE mi.business_id = b.id AND mi.name = x.name
  );

-- ── Sunrise Plantcake Cafe ───────────────────────────────────
INSERT INTO menu_items (business_id, name, description, price, image_url, category, sort_order)
SELECT b.id, x.name, x.description, x.price, x.image_url, x.category, x.sort_order
FROM businesses b, (VALUES
  ('Vegan Pancake Stack', 'Three fluffy pancakes, maple syrup, berries, coconut whip.',
   1299, 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=1200&q=80', 'Brunch', 1),
  ('Stack of Five', 'Five-stack tower with berries and coconut cream. The challenge stack.',
   1799, 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=1200&q=80', 'Brunch', 2),
  ('Chickpea Benedict', 'House english muffin, chickpea-tofu scramble, hollandaise, greens.',
   1499, 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=1200&q=80', 'Brunch', 3),
  ('Avocado Toast', 'Sourdough, smashed avocado, chili crunch, microgreens.',
   1199, 'https://images.unsplash.com/photo-1603046891744-1f76eb10aec0?w=1200&q=80', 'Brunch', 4),
  ('Oat-Milk Latte', 'Single-origin espresso with house oat milk.',
   549, 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=1200&q=80', 'Drinks', 5),
  ('Cake of the Day Slice', 'Rotating vegan cake. Ask staff for today.',
   699, 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=1200&q=80', 'Cakes', 6)
) AS x(name, description, price, image_url, category, sort_order)
WHERE b.slug = 'sunrise-plantcake-cafe'
  AND NOT EXISTS (
    SELECT 1 FROM menu_items mi
    WHERE mi.business_id = b.id AND mi.name = x.name
  );

-- ── Yamashita Ramen Bar ──────────────────────────────────────
INSERT INTO menu_items (business_id, name, description, price, image_url, category, sort_order)
SELECT b.id, x.name, x.description, x.price, x.image_url, x.category, x.sort_order
FROM businesses b, (VALUES
  ('Tonkotsu Ramen', 'Rich pork-bone broth, hand-pulled noodles, char siu, soft egg, scallion.',
   1599, 'https://images.unsplash.com/photo-1623341214825-9f4f963727da?w=1200&q=80', 'Ramen', 1),
  ('Spicy Tonkotsu (Lvl 5)', 'Pork bone broth with our level-5 chili oil. The inferno bowl.',
   1799, 'https://images.unsplash.com/photo-1591814468924-caf88d1232e1?w=1200&q=80', 'Ramen', 2),
  ('Miso Ramen', 'Three-miso blend, ground pork, corn, butter, scallion.',
   1599, 'https://images.unsplash.com/photo-1557872943-16a5ac26437e?w=1200&q=80', 'Ramen', 3),
  ('Shoyu Ramen', 'Soy-based clear broth, char siu, bamboo, soft egg.',
   1499, 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=1200&q=80', 'Ramen', 4),
  ('Vegan Shiitake Ramen', 'Shiitake-kombu broth, tofu, mushrooms, bok choy.',
   1599, 'https://images.unsplash.com/photo-1626804475297-41608ea09aeb?w=1200&q=80', 'Ramen', 5),
  ('Chashu Donburi', 'Sliced pork belly over rice with soft egg and scallion.',
   1299, 'https://images.unsplash.com/photo-1582450871972-ab5ca641643d?w=1200&q=80', 'Bowls', 6),
  ('Pork Gyoza (5pc)', 'Pan-fried pork dumplings with chili-soy dip.',
   799, 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=1200&q=80', 'Sides', 7)
) AS x(name, description, price, image_url, category, sort_order)
WHERE b.slug = 'yamashita-ramen-bar'
  AND NOT EXISTS (
    SELECT 1 FROM menu_items mi
    WHERE mi.business_id = b.id AND mi.name = x.name
  );
