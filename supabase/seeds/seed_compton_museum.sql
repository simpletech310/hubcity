-- ============================================================
-- Hub City — Compton Museum Seed Data
-- Initial exhibits, gallery items, notable people, library items
-- ============================================================

-- ============================================================
-- MUSEUM EXHIBITS
-- ============================================================

INSERT INTO museum_exhibits (title, slug, subtitle, description, cover_image_url, curator_note, era, tags, is_featured, display_order) VALUES

-- Featured Exhibits
(
  'Birthplace of West Coast Hip-Hop',
  'birthplace-west-coast-hip-hop',
  'How Compton shaped the sound that changed the world',
  'From backyard parties to global domination, Compton gave birth to a musical revolution that redefined popular culture. This exhibit traces the origins of West Coast hip-hop from the late 1980s through its continued influence today, featuring the artists, producers, and cultural moments that put Compton on the world stage.',
  NULL,
  'This exhibit honors the creative genius born from Compton''s streets — music that spoke truth to power and gave voice to a generation.',
  '1980s-2000s',
  ARRAY['music', 'hip-hop', 'west-coast', 'nwa', 'culture'],
  TRUE,
  1
),
(
  'Compton Cowboys',
  'compton-cowboys',
  'Preserving Black equestrian heritage in the heart of the city',
  'The Compton Cowboys carry forward a tradition of Black horsemanship in Compton that dates back generations. Based at the Richland Farms neighborhood, this group of riders has become a symbol of community resilience, mentoring youth and challenging stereotypes about Black urban life.',
  NULL,
  'The Cowboys remind us that Compton''s story is far more diverse and beautiful than any single narrative.',
  '2000s-Present',
  ARRAY['cowboys', 'horses', 'richland-farms', 'community', 'youth'],
  TRUE,
  2
),
(
  'The Founding: 1867 and Beyond',
  'the-founding-1867',
  'From rancho lands to an incorporated city',
  'Compton''s story begins in 1867 when Griffith Dickenson Compton led a group of settlers to establish a farming community south of Los Angeles. This exhibit chronicles the city''s founding, its agricultural roots, early incorporation in 1888, and the transformative decades that followed.',
  NULL,
  'Understanding where we came from is essential to knowing where we''re going.',
  '1867-1950s',
  ARRAY['founding', 'history', 'agriculture', 'early-compton'],
  TRUE,
  3
),

-- Regular Exhibits
(
  'Compton on the Court',
  'compton-on-the-court',
  'A legacy of athletic excellence',
  'From Venus and Serena Williams practicing on the public courts of East Compton to NBA stars who called the city home, Compton has produced world-class athletes who dominated their sports while representing their community with pride.',
  NULL,
  NULL,
  '1970s-Present',
  ARRAY['sports', 'tennis', 'basketball', 'athletes'],
  FALSE,
  4
),
(
  'The Great Migration West',
  'great-migration-west',
  'How Compton became a center of Black community and culture',
  'During the mid-20th century, African Americans migrated westward seeking opportunity and freedom from Jim Crow. Compton became one of the first cities in the region where Black families could own homes, build wealth, and establish thriving communities, fundamentally reshaping the city''s identity.',
  NULL,
  NULL,
  '1940s-1970s',
  ARRAY['migration', 'civil-rights', 'housing', 'community'],
  FALSE,
  5
),
(
  'Street Art & Murals of Compton',
  'street-art-murals',
  'The walls that tell our stories',
  'Compton''s streets are an open-air gallery. From memorial murals to bold contemporary works, the city''s artists have transformed buildings, walls, and fences into powerful expressions of identity, memory, and hope.',
  NULL,
  NULL,
  '1990s-Present',
  ARRAY['art', 'murals', 'street-art', 'visual-arts'],
  FALSE,
  6
),
(
  'Compton''s Latino Heritage',
  'compton-latino-heritage',
  'The vibrant contributions of Compton''s growing Latino community',
  'Compton''s Latino population has grown significantly since the 1990s, bringing rich cultural traditions, entrepreneurship, and community organizations that have become integral to the city''s identity. This exhibit celebrates the fusion of cultures that defines modern Compton.',
  NULL,
  NULL,
  '1980s-Present',
  ARRAY['latino', 'culture', 'community', 'diversity'],
  FALSE,
  7
),
(
  'Education & Empowerment',
  'education-empowerment',
  'Schools, scholars, and the fight for quality education',
  'From Compton College (est. 1927) to grassroots tutoring programs, education has been a cornerstone of community empowerment. This exhibit highlights the educators, students, and institutions that have championed learning in Compton despite systemic challenges.',
  NULL,
  NULL,
  '1920s-Present',
  ARRAY['education', 'schools', 'compton-college', 'youth'],
  FALSE,
  8
);


-- ============================================================
-- NOTABLE PEOPLE
-- ============================================================

INSERT INTO notable_people (name, slug, title, bio, birth_year, death_year, category, notable_achievements, era, tags, display_order,
  exhibit_id) VALUES

-- Music
(
  'Kendrick Lamar',
  'kendrick-lamar',
  'Pulitzer Prize-Winning Rapper & Songwriter',
  'Born and raised in Compton, Kendrick Lamar Duckworth is widely regarded as one of the greatest rappers of all time. His deeply personal and politically charged music draws heavily from his experiences growing up in Compton, and he has become a global ambassador for the city''s culture and creativity.',
  1987, NULL, 'music',
  ARRAY['Pulitzer Prize for Music (2018)', 'Multiple Grammy Awards', 'good kid, m.A.A.d city (2012)', 'To Pimp a Butterfly (2015)', 'Super Bowl Halftime Show (2022)'],
  '2000s-Present',
  ARRAY['hip-hop', 'rapper', 'pulitzer', 'grammy'],
  1,
  (SELECT id FROM museum_exhibits WHERE slug = 'birthplace-west-coast-hip-hop')
),
(
  'Dr. Dre',
  'dr-dre',
  'Producer, Rapper & Entrepreneur',
  'Andre Romelle Young, known as Dr. Dre, is a legendary music producer and rapper from Compton who co-founded Death Row Records and later Aftermath Entertainment and Beats Electronics. His production style defined the sound of West Coast hip-hop.',
  1965, NULL, 'music',
  ARRAY['Co-founded N.W.A', 'The Chronic (1992)', 'Founded Aftermath Entertainment', 'Created Beats by Dre', 'Multiple Grammy Awards'],
  '1980s-Present',
  ARRAY['hip-hop', 'producer', 'nwa', 'entrepreneur'],
  2,
  (SELECT id FROM museum_exhibits WHERE slug = 'birthplace-west-coast-hip-hop')
),
(
  'Eazy-E',
  'eazy-e',
  'The Godfather of Gangsta Rap',
  'Eric Lynn Wright, known as Eazy-E, was a rapper and entrepreneur from Compton who co-founded N.W.A and Ruthless Records. His raw, unfiltered style helped create gangsta rap and brought Compton''s stories to a worldwide audience.',
  1964, 1995, 'music',
  ARRAY['Co-founded N.W.A', 'Founded Ruthless Records', 'Eazy-Duz-It (1988)', 'Straight Outta Compton (1988)', 'Pioneer of gangsta rap'],
  '1980s-1990s',
  ARRAY['hip-hop', 'rapper', 'nwa', 'ruthless-records'],
  3,
  (SELECT id FROM museum_exhibits WHERE slug = 'birthplace-west-coast-hip-hop')
),
(
  'DJ Quik',
  'dj-quik',
  'Producer, Rapper & Multi-Instrumentalist',
  'David Marvin Blake, known as DJ Quik, is a rapper and producer from Compton known for his funk-influenced production style. A true musical polymath, he plays multiple instruments and has produced for numerous artists across genres.',
  1970, NULL, 'music',
  ARRAY['Quik Is the Name (1991)', 'Multi-instrumentalist producer', 'Produced for 2Pac, Jay-Z, and others', 'Compton''s Most Wanted collaborator'],
  '1990s-Present',
  ARRAY['hip-hop', 'producer', 'funk', 'g-funk'],
  4,
  (SELECT id FROM museum_exhibits WHERE slug = 'birthplace-west-coast-hip-hop')
),
(
  'The Game',
  'the-game',
  'Rapper & Community Activist',
  'Jayceon Terrell Taylor, known as The Game, is a rapper from Compton who rose to fame with his debut album The Documentary. Known for his vivid storytelling about life in Compton, he has also been active in community outreach and youth programs.',
  1979, NULL, 'music',
  ARRAY['The Documentary (2005)', 'Multi-platinum artist', 'Community outreach programs', 'Robin Hood Project charity'],
  '2000s-Present',
  ARRAY['hip-hop', 'rapper', 'community', 'activism'],
  5,
  (SELECT id FROM museum_exhibits WHERE slug = 'birthplace-west-coast-hip-hop')
),

-- Sports
(
  'Venus Williams',
  'venus-williams',
  'Tennis Champion & Entrepreneur',
  'Venus Ebony Starr Williams grew up practicing tennis on the public courts of Compton under her father Richard Williams'' coaching. She became one of the most dominant players in tennis history and a pioneering advocate for equal prize money in women''s sports.',
  1980, NULL, 'sports',
  ARRAY['7 Grand Slam singles titles', '14 Grand Slam doubles titles', 'Olympic gold medalist', 'Equal prize money advocate', 'Fashion designer & entrepreneur'],
  '1990s-Present',
  ARRAY['tennis', 'champion', 'entrepreneur', 'pioneer'],
  6,
  (SELECT id FROM museum_exhibits WHERE slug = 'compton-on-the-court')
),
(
  'Serena Williams',
  'serena-williams',
  'Greatest Tennis Player of All Time',
  'Serena Jameka Williams, raised alongside her sister Venus on the courts of Compton, is widely considered the greatest tennis player ever. Her dominance, power, and resilience redefined the sport and inspired millions worldwide.',
  1981, NULL, 'sports',
  ARRAY['23 Grand Slam singles titles', '14 Grand Slam doubles titles', 'Multiple Olympic gold medals', 'Career Grand Slam achiever', 'Venture capital investor'],
  '1990s-Present',
  ARRAY['tennis', 'champion', 'goat', 'inspiration'],
  7,
  (SELECT id FROM museum_exhibits WHERE slug = 'compton-on-the-court')
),
(
  'DeMar DeRozan',
  'demar-derozan',
  'NBA All-Star',
  'DeMar Darnell DeRozan is a Compton native and NBA All-Star known for his scoring ability and mid-range game. He has been outspoken about mental health awareness and remains deeply connected to his Compton roots.',
  1989, NULL, 'sports',
  ARRAY['Multiple NBA All-Star selections', 'Mental health advocacy', 'Compton Magic youth basketball', 'USC Trojan standout'],
  '2000s-Present',
  ARRAY['basketball', 'nba', 'mental-health', 'youth'],
  8,
  (SELECT id FROM museum_exhibits WHERE slug = 'compton-on-the-court')
),

-- Politics & Activism
(
  'Aja Brown',
  'aja-brown',
  'Youngest Mayor of Compton',
  'Aja Brown made history in 2013 when she was elected as the youngest mayor of Compton at age 31. Her administration focused on economic development, reducing crime, and revitalizing the city''s image, bringing new investment and attention to Compton''s potential.',
  1982, NULL, 'politics',
  ARRAY['Youngest Mayor of Compton (2013)', 'Economic development initiatives', 'Crime reduction programs', 'City revitalization efforts'],
  '2010s-Present',
  ARRAY['mayor', 'politics', 'leadership', 'development'],
  9,
  NULL
),

-- Arts & Community
(
  'The Compton Cowboys',
  'the-compton-cowboys',
  'Equestrian Group & Community Mentors',
  'The Compton Cowboys are a group of horseback riders based in the Richland Farms neighborhood of Compton. They preserve the tradition of Black horsemanship while mentoring local youth, promoting animal welfare, and challenging narratives about urban communities.',
  NULL, NULL, 'arts',
  ARRAY['Richland Farms equestrian tradition', 'Youth mentorship program', 'National media recognition', 'Book: "The Compton Cowboys" by Walter Thompson-Hernandez'],
  '2010s-Present',
  ARRAY['cowboys', 'horses', 'mentorship', 'community'],
  10,
  (SELECT id FROM museum_exhibits WHERE slug = 'compton-cowboys')
);


-- ============================================================
-- GALLERY ITEMS
-- ============================================================

INSERT INTO gallery_items (title, slug, description, item_type, image_urls, artist_name, year_created, medium, tags, display_order,
  exhibit_id) VALUES

(
  'Straight Outta Compton Album Cover',
  'straight-outta-compton-album',
  'The iconic album cover that introduced the world to N.W.A and Compton. The stark black-and-white image became one of the most recognizable covers in hip-hop history.',
  'photo',
  ARRAY[]::TEXT[],
  NULL,
  '1988',
  'Photography',
  ARRAY['nwa', 'album', 'hip-hop', 'iconic'],
  1,
  (SELECT id FROM museum_exhibits WHERE slug = 'birthplace-west-coast-hip-hop')
),
(
  'Compton City Hall Mural',
  'compton-city-hall-mural',
  'A vibrant mural adorning the walls near Compton City Hall, depicting the city''s diverse history from its agricultural origins to its cultural renaissance.',
  'artwork',
  ARRAY[]::TEXT[],
  'Local Artists Collective',
  '2019',
  'Acrylic on concrete',
  ARRAY['mural', 'city-hall', 'history', 'community'],
  2,
  (SELECT id FROM museum_exhibits WHERE slug = 'street-art-murals')
),
(
  'Richland Farms Riders',
  'richland-farms-riders',
  'A documentary photograph capturing the Compton Cowboys riding through the Richland Farms neighborhood, a tradition that has connected the community to equestrian culture for decades.',
  'photo',
  ARRAY[]::TEXT[],
  NULL,
  '2020',
  'Photography',
  ARRAY['cowboys', 'horses', 'richland-farms', 'documentary'],
  3,
  (SELECT id FROM museum_exhibits WHERE slug = 'compton-cowboys')
),
(
  'Hub City Sunrise',
  'hub-city-sunrise',
  'A contemporary art piece celebrating Compton''s emergence as a renewed cultural and civic hub, blending elements of the city''s past and present.',
  'artwork',
  ARRAY[]::TEXT[],
  'Marcus Cole',
  '2023',
  'Mixed media on canvas',
  ARRAY['contemporary', 'sunrise', 'renewal', 'hope'],
  4,
  NULL
),
(
  'The Williams Sisters on Compton Courts',
  'williams-sisters-compton-courts',
  'An archival photograph of young Venus and Serena Williams practicing on the public tennis courts of East Compton, where their father Richard trained them to become champions.',
  'photo',
  ARRAY[]::TEXT[],
  NULL,
  '1991',
  'Photography',
  ARRAY['tennis', 'williams', 'sports', 'youth'],
  5,
  (SELECT id FROM museum_exhibits WHERE slug = 'compton-on-the-court')
),
(
  'Compton Boulevard Then and Now',
  'compton-boulevard-then-now',
  'A side-by-side comparison showing Compton Boulevard in the 1950s during the Great Migration era alongside a modern-day view, illustrating the city''s transformation over seven decades.',
  'photo',
  ARRAY[]::TEXT[],
  NULL,
  '2022',
  'Archival / Digital photography',
  ARRAY['history', 'boulevard', 'transformation', 'comparison'],
  6,
  (SELECT id FROM museum_exhibits WHERE slug = 'great-migration-west')
),
(
  'Compton High School Class of 1965',
  'compton-high-1965',
  'A class photograph from Compton High School during one of the most transformative periods in the city''s history, capturing the faces of a generation that would shape Compton''s future.',
  'document',
  ARRAY[]::TEXT[],
  NULL,
  '1965',
  'Archival photograph',
  ARRAY['education', 'history', 'compton-high', 'archive'],
  7,
  (SELECT id FROM museum_exhibits WHERE slug = 'education-empowerment')
),
(
  'Viva Compton',
  'viva-compton',
  'A bold, colorful mural celebrating the Latino community''s cultural contributions to Compton, featuring traditional Mexican imagery blended with contemporary urban elements.',
  'artwork',
  ARRAY[]::TEXT[],
  'Maria Estrada',
  '2021',
  'Spray paint and acrylic on wall',
  ARRAY['latino', 'mural', 'culture', 'diversity'],
  8,
  (SELECT id FROM museum_exhibits WHERE slug = 'compton-latino-heritage')
);


-- ============================================================
-- LIBRARY ITEMS
-- ============================================================

INSERT INTO library_items (title, slug, author, description, item_type, year_published, publisher, isbn, external_url, tags, display_order,
  exhibit_id) VALUES

(
  'The Compton Cowboys: The New Generation of Cowboys in America''s Urban Heartland',
  'the-compton-cowboys-book',
  'Walter Thompson-Hernandez',
  'The remarkable true story of the Compton Cowboys, a group of African American men and women who have found solace and healing through horseback riding in an urban landscape known for its poverty and violence.',
  'book',
  2020,
  'William Morrow',
  '978-0062910608',
  NULL,
  ARRAY['cowboys', 'horses', 'community', 'memoir'],
  1,
  (SELECT id FROM museum_exhibits WHERE slug = 'compton-cowboys')
),
(
  'Straight Outta Compton: A History of Compton and Its Music',
  'straight-outta-compton-history',
  'Various Authors',
  'A comprehensive look at how Compton became the epicenter of West Coast hip-hop, exploring the social, economic, and cultural conditions that gave rise to one of the most influential music movements in history.',
  'book',
  2015,
  'Da Capo Press',
  NULL,
  NULL,
  ARRAY['music', 'hip-hop', 'history', 'nwa'],
  2,
  (SELECT id FROM museum_exhibits WHERE slug = 'birthplace-west-coast-hip-hop')
),
(
  'King Richard: Raising Venus and Serena',
  'king-richard',
  'Richard Williams with Bart Davis',
  'The autobiography of Richard Williams, father of Venus and Serena Williams, detailing how he trained his daughters on the public courts of Compton to become the greatest tennis players of all time.',
  'book',
  2014,
  'Gotham Books',
  '978-1592408559',
  NULL,
  ARRAY['tennis', 'sports', 'family', 'inspiration'],
  3,
  (SELECT id FROM museum_exhibits WHERE slug = 'compton-on-the-court')
),
(
  'Compton: A Short History',
  'compton-short-history',
  'Emily Straus',
  'A concise historical overview of Compton from its founding through the modern era, examining how racial covenants, white flight, economic disinvestment, and community resilience shaped the city.',
  'article',
  2018,
  'LA Public Library',
  NULL,
  NULL,
  ARRAY['history', 'founding', 'civil-rights', 'community'],
  4,
  (SELECT id FROM museum_exhibits WHERE slug = 'the-founding-1867')
),
(
  'Straight Outta Compton (Film)',
  'straight-outta-compton-film',
  'Directed by F. Gary Gray',
  'The 2015 biographical drama film depicting the rise and fall of N.W.A, filmed partly in Compton. The film brought renewed global attention to the city''s cultural significance and grossed over $200 million worldwide.',
  'documentary',
  2015,
  'Universal Pictures',
  NULL,
  NULL,
  ARRAY['film', 'nwa', 'hip-hop', 'biography'],
  5,
  (SELECT id FROM museum_exhibits WHERE slug = 'birthplace-west-coast-hip-hop')
),
(
  'The Compton Communicator Archives',
  'compton-communicator-archives',
  'Various Contributors',
  'Digitized archives from The Compton Communicator, a historically significant Black newspaper that served Compton''s African American community and documented the city''s transformation during the Civil Rights era.',
  'archive',
  1960,
  'Compton Communicator Press',
  NULL,
  NULL,
  ARRAY['newspaper', 'archive', 'civil-rights', 'black-press'],
  6,
  (SELECT id FROM museum_exhibits WHERE slug = 'great-migration-west')
),
(
  'Death of Innocence: The Story of the Hate Crime That Changed America',
  'death-of-innocence',
  'Mamie Till-Mobley and Christopher Benson',
  'While not exclusively about Compton, this work connects to the broader Great Migration narrative that brought African Americans westward, including to Compton, seeking safety and opportunity.',
  'book',
  2003,
  'One World/Ballantine',
  '978-0812970470',
  NULL,
  ARRAY['civil-rights', 'migration', 'history', 'justice'],
  7,
  (SELECT id FROM museum_exhibits WHERE slug = 'great-migration-west')
),
(
  'Compton College: A Century of Community Education',
  'compton-college-century',
  'Compton College Archives',
  'A comprehensive academic study of Compton College (El Camino College Compton Center), one of the oldest community colleges in California, examining its role in educating generations of Compton residents since 1927.',
  'academic',
  2020,
  'Compton College',
  NULL,
  NULL,
  ARRAY['education', 'compton-college', 'academic', 'community'],
  8,
  (SELECT id FROM museum_exhibits WHERE slug = 'education-empowerment')
);


-- ============================================================
-- MUSEUM CHANNEL (for Media wing)
-- ============================================================

INSERT INTO channels (name, slug, description, type, is_active)
SELECT 'The Compton Museum', 'compton-museum', 'Official channel of The Compton Museum featuring documentaries, interviews, and cultural content about Compton''s heritage.', 'museum', TRUE
WHERE NOT EXISTS (SELECT 1 FROM channels WHERE slug = 'compton-museum');
