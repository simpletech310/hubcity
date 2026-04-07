-- 038_seed_notable_people.sql
-- Seed notable_people table with 30+ real Compton figures
-- Phase 2: Magazine elevation - Notable People of Compton

INSERT INTO notable_people (name, slug, title, bio, birth_year, death_year, category, portrait_url, image_urls, notable_achievements, external_links, era, tags, is_published, display_order)
VALUES

-- ============================================================
-- 1. KENDRICK LAMAR (display_order = 1)
-- ============================================================
(
  'Kendrick Lamar',
  'kendrick-lamar',
  'Rapper, Songwriter, Record Producer',
  E'Kendrick Lamar Duckworth grew up on the streets of Compton, California, where the realities of gang culture, poverty, and resilience shaped his artistic vision. From his earliest mixtapes released under the name K.Dot while still in high school, Lamar demonstrated a lyrical depth and storytelling ability that set him apart from his peers. His major-label debut Good Kid, M.A.A.D City painted a vivid autobiographical portrait of adolescence in Compton and earned him immediate critical acclaim.\n\nLamar''s subsequent albums cemented his status as one of the defining voices of his generation. To Pimp a Butterfly fused jazz, funk, and spoken word with unflinching social commentary, while DAMN. earned him the Pulitzer Prize for Music in 2018, making him the first non-classical, non-jazz artist to receive the honor. His 2024 album GNX continued his streak of boundary-pushing artistry.\n\nBeyond personal accolades, Lamar has become the most awarded rapper in Grammy history. He headlined the Super Bowl LIX halftime show in 2025 and remains deeply connected to Compton, frequently referencing the city in his music and investing in community initiatives. His work has elevated Compton''s narrative from one defined solely by hardship to one that celebrates complexity, creativity, and triumph.',
  1987,
  NULL,
  'music',
  'https://upload.wikimedia.org/wikipedia/commons/3/32/Pulitzer2018-portraits-kendrick-lamar.jpg',
  ARRAY['https://upload.wikimedia.org/wikipedia/commons/3/32/Pulitzer2018-portraits-kendrick-lamar.jpg'],
  ARRAY['First non-classical, non-jazz artist to win the Pulitzer Prize for Music (2018)', 'Most awarded rapper in Grammy history', 'Good Kid, M.A.A.D City certified triple platinum', 'Headlined Super Bowl LIX halftime show (2025)', 'Named to Time 100 most influential people list'],
  '{"wikipedia": "https://en.wikipedia.org/wiki/Kendrick_Lamar"}'::jsonb,
  '2010s-Present',
  ARRAY['hip-hop', 'rap', 'pulitzer-prize', 'grammy-winner', 'songwriter'],
  TRUE,
  1
),

-- ============================================================
-- 2. SERENA WILLIAMS (display_order = 2)
-- ============================================================
(
  'Serena Williams',
  'serena-williams',
  'Professional Tennis Player, Entrepreneur',
  E'Serena Williams learned to play tennis on the public courts of Compton, trained by her father Richard Williams, who famously wrote a 78-page plan for his daughters'' tennis careers before they were born. Growing up in a neighborhood better known for gangs than Grand Slams, Serena and her sister Venus defied every expectation placed on them and transformed the sport of tennis forever.\n\nOver a career spanning nearly three decades, Serena amassed 23 Grand Slam singles titles, the most in the Open Era, and held the world No. 1 ranking for 319 weeks. She completed the career Grand Slam and won four Olympic gold medals. Her dominance on the court was matched by her business acumen, as she built a portfolio that includes venture capital firm Serena Ventures and the fashion line S by Serena.\n\nSerena''s journey from the cracked courts of Compton to the pinnacle of professional tennis is one of the most compelling stories in sports history. She shattered racial and economic barriers, inspired millions of young athletes worldwide, and proved that greatness can emerge from the most unlikely of places. Her legacy extends far beyond trophies, having fundamentally changed who gets to compete and succeed in elite athletics.',
  1981,
  NULL,
  'sports',
  'https://upload.wikimedia.org/wikipedia/commons/4/4b/Serena_Williams_at_the_2025_International_Tennis_Hall_of_Fame_Induction_Ceremony_Press_Conference_%28cropped%29.jpg',
  ARRAY['https://upload.wikimedia.org/wikipedia/commons/4/4b/Serena_Williams_at_the_2025_International_Tennis_Hall_of_Fame_Induction_Ceremony_Press_Conference_%28cropped%29.jpg'],
  ARRAY['23 Grand Slam singles titles, most in the Open Era', 'Held world No. 1 ranking for 319 weeks', 'Four Olympic gold medals', 'Completed the career Grand Slam', 'Founded Serena Ventures, a venture capital firm'],
  '{"wikipedia": "https://en.wikipedia.org/wiki/Serena_Williams"}'::jsonb,
  '1990s-Present',
  ARRAY['tennis', 'grand-slam', 'olympic-gold', 'entrepreneur', 'compton-raised'],
  TRUE,
  2
),

-- ============================================================
-- 3. DR. DRE (display_order = 3)
-- ============================================================
(
  'Dr. Dre',
  'dr-dre',
  'Rapper, Record Producer, Entrepreneur',
  E'Andre Romelle Young, known worldwide as Dr. Dre, grew up in Compton and became one of the most influential figures in the history of hip-hop. As a founding member of N.W.A, he helped create the sonic blueprint for gangsta rap with the landmark album Straight Outta Compton in 1988. His production style, which drew heavily on Parliament-Funkadelic and synthesizer-driven arrangements, defined the West Coast sound for a generation.\n\nAfter leaving N.W.A, Dre co-founded Death Row Records and released his solo debut The Chronic in 1992, which popularized the G-funk subgenre and became one of the best-selling hip-hop albums of all time. He went on to found Aftermath Entertainment and discovered artists including Eminem, 50 Cent, and Kendrick Lamar, shaping their careers and the broader trajectory of popular music.\n\nDre''s entrepreneurial ambitions led him to co-found Beats Electronics with Jimmy Iovine in 2006. The company''s premium headphones became a cultural phenomenon, and Apple acquired Beats for approximately $3 billion in 2014. In 2016, Dre was inducted into the Rock and Roll Hall of Fame as a member of N.W.A. From Compton''s streets to the boardrooms of Silicon Valley, his career represents one of the most remarkable ascents in American entertainment and business.',
  1965,
  NULL,
  'music',
  'https://upload.wikimedia.org/wikipedia/commons/6/65/Dr._Dre_in_2026_%28cropped%29_2.jpg',
  ARRAY['https://upload.wikimedia.org/wikipedia/commons/6/65/Dr._Dre_in_2026_%28cropped%29_2.jpg'],
  ARRAY['Co-founded N.W.A and produced Straight Outta Compton', 'Pioneered G-funk with The Chronic (1992)', 'Co-founded Beats Electronics, sold to Apple for $3 billion', 'Inducted into Rock and Roll Hall of Fame (2016)', 'Discovered Eminem, 50 Cent, and Kendrick Lamar'],
  '{"wikipedia": "https://en.wikipedia.org/wiki/Dr._Dre"}'::jsonb,
  '1980s-Present',
  ARRAY['hip-hop', 'rap', 'producer', 'nwa', 'entrepreneur', 'beats-electronics'],
  TRUE,
  3
),

-- ============================================================
-- 4. VENUS WILLIAMS (display_order = 4)
-- ============================================================
(
  'Venus Williams',
  'venus-williams',
  'Professional Tennis Player, Entrepreneur',
  E'Venus Ebony Starr Williams was the older of the two Williams sisters who revolutionized tennis from their beginnings on the public courts of Compton. Trained alongside Serena by their father Richard, Venus turned professional in 1994 and quickly established herself as one of the most powerful and athletic players the sport had ever seen. Her serve, at times exceeding 125 miles per hour, and her commanding court presence changed the game.\n\nVenus won seven Grand Slam singles titles, including five Wimbledon championships and two US Open titles. She also captured a singles gold medal at the 2000 Sydney Olympics and won 14 Grand Slam doubles titles alongside Serena. Beyond her playing career, Venus became a fierce advocate for equal prize money in tennis, and her efforts were instrumental in Wimbledon''s decision to award equal pay to men and women in 2007.\n\nOff the court, Venus founded the interior design firm V Starr Interiors and the activewear line EleVen. She earned a business degree from Indiana University East and has been a vocal champion for gender equity in sports and business. Like her sister, Venus proved that a child from Compton could reach the very top of a sport historically associated with wealth and privilege.',
  1980,
  NULL,
  'sports',
  'https://upload.wikimedia.org/wikipedia/commons/1/19/Venus_Williams_%282025_DC_Open%29_crop.jpg',
  ARRAY['https://upload.wikimedia.org/wikipedia/commons/1/19/Venus_Williams_%282025_DC_Open%29_crop.jpg'],
  ARRAY['Seven Grand Slam singles titles including five Wimbledon championships', 'Olympic gold medalist in singles (2000) and doubles', 'Instrumental in achieving equal prize money at Wimbledon', 'Founded V Starr Interiors and EleVen activewear', '14 Grand Slam doubles titles with sister Serena'],
  '{"wikipedia": "https://en.wikipedia.org/wiki/Venus_Williams"}'::jsonb,
  '1990s-Present',
  ARRAY['tennis', 'grand-slam', 'olympic-gold', 'entrepreneur', 'equal-pay-advocate'],
  TRUE,
  4
),

-- ============================================================
-- MUSIC CATEGORY (display_order 5-14)
-- ============================================================

-- 5. EAZY-E
(
  'Eazy-E',
  'eazy-e',
  'Rapper, Record Executive, Entrepreneur',
  E'Eric Lynn Wright, better known as Eazy-E, was born and raised in Compton and became one of the most pivotal figures in hip-hop history. In 1987, he founded Ruthless Records with manager Jerry Heller, creating the label that would launch N.W.A and reshape the American music landscape. His high-pitched, aggressive vocal style and unflinching street narratives gave voice to the realities of life in South Central Los Angeles.\n\nAs the driving force behind N.W.A, Eazy-E helped produce Straight Outta Compton, an album that drew national attention, FBI scrutiny, and massive commercial success despite virtually no radio play. His solo debut Eazy-Duz-It went double platinum and solidified his reputation as one of gangsta rap''s founding architects. He was a shrewd businessman who understood the music industry and built Ruthless Records into a formidable enterprise.\n\nEazy-E''s life was cut tragically short when he died of AIDS-related complications on March 26, 1995, at the age of 30. His passing brought national attention to the HIV/AIDS crisis and its impact on communities of color. Posthumously, his influence has only grown. He is widely regarded as the godfather of gangsta rap, and his legacy as a Compton native who built an empire from nothing continues to inspire artists and entrepreneurs.',
  1964,
  1995,
  'music',
  'https://upload.wikimedia.org/wikipedia/commons/b/b1/Eazy_E_headshot.jpg',
  ARRAY['https://upload.wikimedia.org/wikipedia/commons/b/b1/Eazy_E_headshot.jpg'],
  ARRAY['Founded Ruthless Records in Compton (1987)', 'Co-founded N.W.A and produced Straight Outta Compton', 'Solo debut Eazy-Duz-It went double platinum', 'Inducted into Rock and Roll Hall of Fame posthumously (2016)', 'Considered the godfather of gangsta rap'],
  '{"wikipedia": "https://en.wikipedia.org/wiki/Eazy-E"}'::jsonb,
  '1980s-1990s',
  ARRAY['hip-hop', 'rap', 'nwa', 'ruthless-records', 'gangsta-rap'],
  TRUE,
  5
),

-- 6. MC REN
(
  'MC Ren',
  'mc-ren',
  'Rapper, Songwriter, Record Producer',
  E'Lorenzo Jerald Patterson, known as MC Ren, is a Compton native who served as one of the primary lyricists and creative forces behind N.W.A. While still a high school student, Ren was signed to Eazy-E''s Ruthless Records and quickly proved himself an indispensable talent. He wrote nearly half of Eazy-E''s debut album Eazy-Duz-It and contributed some of the most memorable verses on Straight Outta Compton.\n\nAfter N.W.A disbanded, Ren launched a solo career that yielded immediate results. His debut EP Kizz My Black Azz became the first EP in music history to achieve platinum certification, selling over a million copies within two months of its 1992 release. He continued releasing critically respected solo work through the 1990s and 2000s while maintaining his reputation as one of rap''s most skilled lyricists.\n\nIn 2016, MC Ren was inducted into the Rock and Roll Hall of Fame alongside his N.W.A groupmates, and in 2024 the group received a Grammy Lifetime Achievement Award. He founded Villain Entertainment, his own independent record label, and remains a respected figure in West Coast hip-hop. Ren''s contributions to N.W.A''s catalog and his solo achievements make him one of Compton''s most important musical exports.',
  1969,
  NULL,
  'music',
  'https://upload.wikimedia.org/wikipedia/commons/5/58/MC_Ren_of_NWA_Los_Angeles_1990_photographed_by_Ithaka_Darin_Pappas_%28cropped%29.jpg',
  ARRAY['https://upload.wikimedia.org/wikipedia/commons/5/58/MC_Ren_of_NWA_Los_Angeles_1990_photographed_by_Ithaka_Darin_Pappas_%28cropped%29.jpg'],
  ARRAY['First EP to achieve platinum certification (Kizz My Black Azz, 1992)', 'Wrote nearly half of Eazy-Duz-It', 'Inducted into Rock and Roll Hall of Fame with N.W.A (2016)', 'Grammy Lifetime Achievement Award with N.W.A (2024)', 'Founded Villain Entertainment record label'],
  '{"wikipedia": "https://en.wikipedia.org/wiki/MC_Ren"}'::jsonb,
  '1980s-Present',
  ARRAY['hip-hop', 'rap', 'nwa', 'songwriter', 'producer'],
  TRUE,
  6
),

-- 7. DJ QUIK
(
  'DJ Quik',
  'dj-quik',
  'Rapper, Record Producer, DJ',
  E'David Marvin Blake, professionally known as DJ Quik, is a Compton-born rapper and producer who helped define the sound of West Coast hip-hop. By the age of 21, he had released his debut album Quik Is the Name, which went platinum and established his signature style: silky, funk-drenched production paired with vivid storytelling about life in Compton. His musical DNA draws directly from the Parliament-Funkadelic tradition, filtered through the lens of street-level reality.\n\nThroughout the 1990s and 2000s, DJ Quik released a string of acclaimed albums including Way 2 Fonky, Safe + Sound, and Rhythm-al-ism, all of which earned gold or platinum certifications. His production skills made him one of the most sought-after hitmakers on the West Coast, crafting beats for 2Pac, Snoop Dogg, Jay-Z, Whitney Houston, and Janet Jackson among many others.\n\nDJ Quik''s influence on West Coast music extends beyond his own discography. He is widely credited as a pioneer of the G-funk sound, and his smooth, melodic approach to hip-hop production has influenced generations of producers. He remains active as both an artist and producer, and his body of work stands as a testament to Compton''s enduring contribution to American music.',
  1970,
  NULL,
  'music',
  'https://upload.wikimedia.org/wikipedia/commons/2/25/Dj-quik-2015.jpg',
  ARRAY['https://upload.wikimedia.org/wikipedia/commons/2/25/Dj-quik-2015.jpg'],
  ARRAY['Debut album Quik Is the Name went platinum by age 21', 'Pioneer of the G-funk production style', 'Produced for 2Pac, Snoop Dogg, Jay-Z, and Whitney Houston', 'Four consecutive gold or platinum certified albums', 'Born and Raised in Compton: The Greatest Hits compilation'],
  '{"wikipedia": "https://en.wikipedia.org/wiki/DJ_Quik"}'::jsonb,
  '1990s-Present',
  ARRAY['hip-hop', 'rap', 'producer', 'dj', 'g-funk'],
  TRUE,
  7
),

-- 8. THE GAME
(
  'The Game',
  'the-game',
  'Rapper, Actor, Entrepreneur',
  E'Jayceon Terrell Taylor, known as The Game, was born and raised in Compton and emerged as one of the most prominent West Coast rappers of the 2000s. Growing up in the Santana Blocc neighborhood, he survived a shooting in 2001 that left him in a coma for three days. That near-death experience redirected his life toward music, and he began recording mixtapes that caught the attention of Dr. Dre and 50 Cent.\n\nThe Game''s debut album The Documentary was released in January 2005 and debuted at number one on the Billboard 200, selling over 586,000 copies in its first week. The album, executive produced by Dr. Dre, was hailed as a return to form for West Coast hip-hop. His collaboration with 50 Cent on the single Hate It or Love It earned Grammy nominations for Best Rap Song and Best Rap Performance. He went on to release multiple successful albums including Doctor''s Advocate and The R.E.D. Album.\n\nThroughout his career, The Game has been a vocal representative of Compton, frequently referencing his hometown in his music and public life. His commercial success helped revitalize mainstream interest in West Coast rap during a period when the region''s influence had waned. He has sold millions of records worldwide and won the World Music Award for World''s Best Selling New Male Artist in 2005.',
  1979,
  NULL,
  'music',
  'https://upload.wikimedia.org/wikipedia/commons/6/6a/The_Game_2016.jpg',
  ARRAY['https://upload.wikimedia.org/wikipedia/commons/6/6a/The_Game_2016.jpg'],
  ARRAY['The Documentary debuted at No. 1 on Billboard 200', 'Grammy nominations for Hate It or Love It', 'World Music Award for Best Selling New Male Artist (2005)', 'The Documentary sold over 5 million copies worldwide', 'Multiple No. 1 albums on Billboard 200'],
  '{"wikipedia": "https://en.wikipedia.org/wiki/The_Game_(rapper)"}'::jsonb,
  '2000s-Present',
  ARRAY['hip-hop', 'rap', 'west-coast', 'aftermath'],
  TRUE,
  8
),

-- 9. COOLIO
(
  'Coolio',
  'coolio',
  'Rapper, Actor, Chef',
  E'Artis Leon Ivey Jr., known as Coolio, moved to Compton at the age of eight and the city became the backdrop for his rise to international stardom. After years of struggling with addiction and working odd jobs, he broke through in the early 1990s with the single Fantastic Voyage, which showcased his playful flow and knack for crafting infectious hooks. His music bridged the gap between hardcore West Coast rap and mainstream pop sensibilities.\n\nCoolio reached the summit of popular music with Gangsta''s Paradise in 1995, a haunting, sample-driven track featured on the Dangerous Minds soundtrack. The song topped charts in over a dozen countries, spent three weeks at number one on the Billboard Hot 100, and won the Grammy Award for Best Rap Solo Performance. It remains one of the best-selling and most recognizable hip-hop songs ever recorded.\n\nBeyond music, Coolio built a multifaceted career that included acting appearances on television shows, the web cooking series Cookin'' with Coolio, and a published cookbook. He sold nearly five million albums in the United States alone and earned six Grammy nominations over his career. Coolio passed away on September 28, 2022, leaving behind a legacy that demonstrated Compton''s ability to produce artists of global reach and versatility.',
  1963,
  2022,
  'music',
  'https://upload.wikimedia.org/wikipedia/commons/c/c8/Coolio.jpg',
  ARRAY['https://upload.wikimedia.org/wikipedia/commons/c/c8/Coolio.jpg'],
  ARRAY['Gangsta''s Paradise topped charts in 12+ countries', 'Grammy Award for Best Rap Solo Performance (1996)', 'Six Grammy nominations over his career', 'Sold nearly 5 million albums in the U.S.', 'Created Cookin'' with Coolio web series and cookbook'],
  '{"wikipedia": "https://en.wikipedia.org/wiki/Coolio"}'::jsonb,
  '1990s-2020s',
  ARRAY['hip-hop', 'rap', 'grammy-winner', 'actor', 'chef'],
  TRUE,
  9
),

-- 10. YG
(
  'YG',
  'yg',
  'Rapper, Songwriter, Actor',
  E'Keenon Dequan Ray Jackson, known professionally as YG, was born and raised in Compton and has become one of the most prominent voices in modern West Coast hip-hop. Growing up in a neighborhood shaped by gang culture, YG channeled his experiences into music that blends party anthems with social commentary. His early single Toot It and Boot It caught the attention of Def Jam Recordings and launched his mainstream career.\n\nYG''s debut album My Krazy Life, released in 2014 and executive produced by DJ Mustard, peaked at number two on the Billboard 200 and was praised as a modern West Coast classic. His follow-up Still Brazy received even stronger critical acclaim for its politically charged content and refined sonic palette. The single Big Bank, featuring 2 Chainz, Big Sean, and Nicki Minaj, became his highest-charting song.\n\nAcross numerous albums and mixtapes, YG has maintained his identity as an unapologetic Compton representative. His music often addresses racial inequality, police brutality, and the challenges facing Black communities in South Los Angeles. He has collaborated with fellow Compton artists and continues to elevate the city''s cultural presence in contemporary hip-hop.',
  1990,
  NULL,
  'music',
  'https://upload.wikimedia.org/wikipedia/commons/8/8c/YG.jpg',
  ARRAY['https://upload.wikimedia.org/wikipedia/commons/8/8c/YG.jpg'],
  ARRAY['My Krazy Life peaked at No. 2 on Billboard 200', 'Still Brazy acclaimed as modern West Coast classic', 'Big Bank peaked at No. 16 on Billboard Hot 100', 'Multiple platinum-certified singles', 'Signed to Def Jam Recordings'],
  '{"wikipedia": "https://en.wikipedia.org/wiki/YG_(rapper)"}'::jsonb,
  '2010s-Present',
  ARRAY['hip-hop', 'rap', 'west-coast', 'def-jam'],
  TRUE,
  10
),

-- 11. RODDY RICCH
(
  'Roddy Ricch',
  'roddy-ricch',
  'Rapper, Singer, Songwriter',
  E'Roddy Ricch, born Roderick Wayne Moore Jr., grew up in Compton and emerged as one of hip-hop''s brightest young talents in the late 2010s. He began making music as a teenager, uploading tracks to SoundCloud before gaining wider attention with his 2018 single Die Young, a poignant reflection on gun violence and mortality that resonated deeply with listeners who shared similar experiences.\n\nRicch''s guest appearance on Nipsey Hussle''s Racks in the Middle earned him a Grammy Award for Best Rap Performance in 2020. That same year, his debut album Please Excuse Me for Being Antisocial debuted at number one on the Billboard 200, and the breakout single The Box spent eleven weeks atop the Billboard Hot 100. He received six nominations at the 63rd Grammy Awards, including Song of the Year and Record of the Year.\n\nAt just 20 years old, Roddy Ricch had already achieved what many artists spend entire careers working toward. His melodic style, which blends singing and rapping over atmospheric production, represents the evolution of the Compton sound for a new generation. He continues to release music and remains one of the most commercially successful artists to emerge from the city in recent years.',
  1998,
  NULL,
  'music',
  'https://upload.wikimedia.org/wikipedia/commons/6/6c/Roddy_Ricch_2022.png',
  ARRAY['https://upload.wikimedia.org/wikipedia/commons/6/6c/Roddy_Ricch_2022.png'],
  ARRAY['The Box spent 11 weeks at No. 1 on Billboard Hot 100', 'Grammy Award for Best Rap Performance (2020)', 'Please Excuse Me for Being Antisocial debuted at No. 1', 'Six nominations at 63rd Grammy Awards', 'BET Award winner'],
  '{"wikipedia": "https://en.wikipedia.org/wiki/Roddy_Ricch"}'::jsonb,
  '2010s-Present',
  ARRAY['hip-hop', 'rap', 'grammy-winner', 'singer'],
  TRUE,
  11
),

-- 12. TYGA
(
  'Tyga',
  'tyga',
  'Rapper, Singer, Songwriter, Actor',
  E'Michael Ray Nguyen-Stevenson, known as Tyga, was born in Compton to parents of Vietnamese and Jamaican descent. His multicultural background and Compton roots gave him a distinctive perspective in hip-hop. After gaining early attention through YouTube, Tyga signed with Lil Wayne''s Young Money Entertainment and quickly established himself as a hitmaker with a talent for crafting catchy, radio-friendly rap songs.\n\nTyga''s breakthrough came with the single Rack City, which became a top-ten hit on the Billboard Hot 100 and one of the defining club anthems of the early 2010s. His album Careless World: Rise of the Last King peaked at number four on the Billboard 200 and earned platinum certification. He also earned a Grammy nomination for his collaboration with Chris Brown on the single Deuces.\n\nOver his career, Tyga has released multiple studio albums and maintained a consistent presence on the charts. He has collaborated with some of the biggest names in music and expanded into fashion, television, and social media entrepreneurship. His success represents the diversity of Compton''s musical output, demonstrating that the city produces talent across a wide spectrum of hip-hop styles.',
  1989,
  NULL,
  'music',
  'https://upload.wikimedia.org/wikipedia/commons/5/55/Tyga_-_Openair_Frauenfeld_2019_02.jpg',
  ARRAY['https://upload.wikimedia.org/wikipedia/commons/5/55/Tyga_-_Openair_Frauenfeld_2019_02.jpg'],
  ARRAY['Rack City reached top 10 on Billboard Hot 100', 'Careless World: Rise of the Last King went platinum', 'Grammy nomination for Deuces with Chris Brown', 'Signed to Young Money Entertainment', 'Multiple platinum-certified singles'],
  '{"wikipedia": "https://en.wikipedia.org/wiki/Tyga"}'::jsonb,
  '2000s-Present',
  ARRAY['hip-hop', 'rap', 'young-money', 'singer'],
  TRUE,
  12
),

-- 13. DJ YELLA
(
  'DJ Yella',
  'dj-yella',
  'DJ, Rapper, Record Producer, Film Director',
  E'Antoine Carraby, known as DJ Yella, is a Compton native who served as the turntablist and primary DJ for N.W.A, one of the most influential groups in music history. Before N.W.A, Yella was a member of the World Class Wreckin'' Cru alongside Dr. Dre, where they honed the electro-funk sound that would later evolve into gangsta rap. His scratching and mixing skills provided the rhythmic foundation for N.W.A''s revolutionary recordings.\n\nAs the longest-serving member of N.W.A, Yella was present from the group''s formation through its dissolution and remained loyal to Eazy-E and Ruthless Records throughout the well-documented conflicts that divided the group. His turntable work on albums like Straight Outta Compton and Niggaz4Life helped define the sonic identity of West Coast hip-hop. After N.W.A, Yella explored filmmaking, directing adult films and releasing his solo album One Mo Nigga ta Go, which he dedicated to the late Eazy-E.\n\nIn 2016, DJ Yella was inducted into the Rock and Roll Hall of Fame alongside his N.W.A groupmates, and in 2024 the group received a Grammy Lifetime Achievement Award. His contributions to hip-hop''s foundational era, though sometimes overshadowed by his more vocal bandmates, were essential to the sound that changed popular music.',
  1967,
  NULL,
  'music',
  'https://upload.wikimedia.org/wikipedia/commons/7/7a/DJ_Yella_2.jpg',
  ARRAY['https://upload.wikimedia.org/wikipedia/commons/7/7a/DJ_Yella_2.jpg'],
  ARRAY['Founding member and DJ of N.W.A', 'Inducted into Rock and Roll Hall of Fame (2016)', 'Grammy Lifetime Achievement Award with N.W.A (2024)', 'Member of World Class Wreckin'' Cru with Dr. Dre', 'Longest-serving member of N.W.A'],
  '{"wikipedia": "https://en.wikipedia.org/wiki/DJ_Yella"}'::jsonb,
  '1980s-Present',
  ARRAY['hip-hop', 'dj', 'nwa', 'producer', 'filmmaker'],
  TRUE,
  13
),

-- 14. STEVE LACY
(
  'Steve Lacy',
  'steve-lacy',
  'Singer, Songwriter, Producer, Guitarist',
  E'Steve Thomas Lacy-Moya was born and raised in Compton and has become one of the most inventive musicians of his generation. As a teenager, he joined the alternative R&B collective the Internet, contributing guitar work and production to their Grammy-nominated album Ego Death. His ability to blend R&B, funk, rock, and pop into something entirely personal quickly distinguished him from his contemporaries.\n\nLacy''s solo career accelerated with his debut album Apollo XXI in 2019, which earned a Grammy nomination, and reached new heights with Gemini Rights in 2022. The album''s lead single Bad Habit became a global smash, reaching number one on the Billboard Hot 100 and earning nominations for Record of the Year and Song of the Year at the Grammys. Gemini Rights won the Grammy Award for Best Progressive R&B Album.\n\nIn 2023, Time magazine named Lacy one of the 100 most influential people in the world. His artistry, which he famously began crafting on his iPhone, represents a new chapter in Compton''s musical story, one that extends beyond hip-hop into the broader landscape of contemporary music. He has demonstrated that Compton continues to produce boundary-pushing artists across genres.',
  1998,
  NULL,
  'music',
  'https://upload.wikimedia.org/wikipedia/commons/3/3e/Steve_Lacy_%40_Rialto_Theatre.jpg',
  ARRAY['https://upload.wikimedia.org/wikipedia/commons/3/3e/Steve_Lacy_%40_Rialto_Theatre.jpg'],
  ARRAY['Bad Habit reached No. 1 on Billboard Hot 100', 'Grammy Award for Best Progressive R&B Album (2023)', 'Named to Time 100 most influential people (2023)', 'Member of the Internet, Grammy-nominated group', 'Grammy nominations for Record and Song of the Year'],
  '{"wikipedia": "https://en.wikipedia.org/wiki/Steve_Lacy"}'::jsonb,
  '2010s-Present',
  ARRAY['r-and-b', 'alternative', 'guitarist', 'producer', 'the-internet'],
  TRUE,
  14
),

-- ============================================================
-- SPORTS CATEGORY (display_order 15-21)
-- ============================================================

-- 15. DEMAR DEROZAN
(
  'DeMar DeRozan',
  'demar-derozan',
  'Professional Basketball Player',
  E'DeMar DeRozan was born and raised in Compton, where he developed his basketball skills amid challenging circumstances. At Compton High School, he emerged as one of the top prep players in the nation before a standout season at the University of Southern California. The Toronto Raptors selected him ninth overall in the 2009 NBA draft, launching a career that has spanned more than fifteen seasons.\n\nDeRozan spent nine seasons in Toronto, becoming the franchise''s all-time leading scorer and earning four All-Star selections as a Raptor. He later starred for the San Antonio Spurs and Chicago Bulls before joining the Sacramento Kings. A six-time NBA All-Star and three-time All-NBA selection, DeRozan surpassed 25,000 career points in 2025, placing him among the top 30 scorers in league history.\n\nBeyond individual statistics, DeRozan has been an outspoken advocate for mental health awareness in professional sports, sharing his own struggles with depression to help destigmatize the conversation. He won a gold medal with Team USA at the 2016 Olympics and remains one of the most respected players in the NBA. His journey from Compton to NBA stardom serves as a powerful example for young athletes in his hometown.',
  1989,
  NULL,
  'sports',
  'https://upload.wikimedia.org/wikipedia/commons/6/64/DeMar_DeRozan_2022.jpg',
  ARRAY['https://upload.wikimedia.org/wikipedia/commons/6/64/DeMar_DeRozan_2022.jpg'],
  ARRAY['Six-time NBA All-Star', 'Surpassed 25,000 career points (2025)', 'Toronto Raptors all-time leading scorer', 'Olympic gold medalist with Team USA (2016)', 'Mental health advocacy pioneer in professional sports'],
  '{"wikipedia": "https://en.wikipedia.org/wiki/DeMar_DeRozan"}'::jsonb,
  '2000s-Present',
  ARRAY['nba', 'basketball', 'all-star', 'olympic-gold', 'mental-health-advocate'],
  TRUE,
  15
),

-- 16. RICHARD SHERMAN
(
  'Richard Sherman',
  'richard-sherman',
  'Professional Football Player, Broadcaster',
  E'Richard Kevin Sherman grew up in Compton and attended Dominguez High School, where he excelled in both football and track and field. After earning a degree from Stanford University, he was drafted by the Seattle Seahawks in the fifth round of the 2011 NFL Draft. What followed was one of the most dominant stretches by a cornerback in modern football history.\n\nSherman became the cornerstone of the Seahawks'' legendary Legion of Boom defense, which led the NFL in pass defense in both 2013 and 2014. He earned five Pro Bowl selections and five All-Pro honors, including three First-Team All-Pro nods. In 2014, he helped the Seahawks win Super Bowl XLVIII with a commanding 43-8 victory over the Denver Broncos. His famous tip in the NFC Championship game that sealed the victory against the San Francisco 49ers remains one of the most iconic plays in NFL history.\n\nBeyond football, Sherman has been a thoughtful voice on social issues, player rights, and education. His journey from the streets of Compton to Stanford to the pinnacle of professional football illustrates the power of athletic talent combined with academic discipline. He has transitioned into broadcasting and business, continuing to represent Compton with distinction.',
  1988,
  NULL,
  'sports',
  'https://upload.wikimedia.org/wikipedia/commons/3/35/Richard_Sherman_Super_Bowl_LX_parade.jpg',
  ARRAY['https://upload.wikimedia.org/wikipedia/commons/3/35/Richard_Sherman_Super_Bowl_LX_parade.jpg'],
  ARRAY['Super Bowl XLVIII champion with Seattle Seahawks', 'Five-time Pro Bowl selection', 'Five-time All-Pro (three First-Team)', 'Led NFL in interceptions (2013)', 'Stanford University graduate'],
  '{"wikipedia": "https://en.wikipedia.org/wiki/Richard_Sherman_(American_football)"}'::jsonb,
  '2010s-Present',
  ARRAY['nfl', 'football', 'cornerback', 'super-bowl', 'stanford'],
  TRUE,
  16
),

-- 17. ARRON AFFLALO
(
  'Arron Afflalo',
  'arron-afflalo',
  'Professional Basketball Player',
  E'Arron Afflalo attended Centennial High School in Compton before becoming a standout at UCLA, where he was named a consensus All-American and Pac-12 Player of the Year as a junior. The Detroit Pistons selected him 27th overall in the 2007 NBA Draft, and he went on to play eleven seasons across six NBA teams, earning a reputation as one of the league''s most reliable shooting guards.\n\nOver his NBA career, Afflalo appeared in 762 regular-season games, averaging 10.8 points per game while shooting 38 percent from three-point range. He recorded a career-high 43 points in a memorable double-overtime game against the Philadelphia 76ers in December 2013. His steady, workmanlike approach to the game made him a valued contributor on every roster he joined.\n\nKendrick Lamar himself cited Afflalo as an example of determination and ambition for young people in Compton. Afflalo''s path from Compton''s public schools to UCLA to a decade-long NBA career demonstrates the athletic talent that the city consistently produces, and his story continues to resonate with aspiring athletes in the community.',
  1985,
  NULL,
  'sports',
  'https://upload.wikimedia.org/wikipedia/commons/e/e2/Arron_Afflalo_Ben_McLemore_%28cropped%29.jpg',
  ARRAY['https://upload.wikimedia.org/wikipedia/commons/e/e2/Arron_Afflalo_Ben_McLemore_%28cropped%29.jpg'],
  ARRAY['Consensus All-American at UCLA', 'Pac-12 Player of the Year', '762 NBA regular-season games over 11 seasons', 'Career-high 43 points vs. Philadelphia 76ers', '27th overall pick in 2007 NBA Draft'],
  '{"wikipedia": "https://en.wikipedia.org/wiki/Arron_Afflalo"}'::jsonb,
  '2000s-2010s',
  ARRAY['nba', 'basketball', 'ucla', 'all-american'],
  TRUE,
  17
),

-- 18. LISA LESLIE
(
  'Lisa Leslie',
  'lisa-leslie',
  'Professional Basketball Player, Broadcaster',
  E'Lisa Deshaun Leslie was born in Compton and grew up to become one of the most decorated players in women''s basketball history. Standing 6-foot-5, she dominated at Morningside High School in nearby Inglewood before starring at USC and then joining the Los Angeles Sparks as one of the WNBA''s inaugural players in 1997. Her combination of size, skill, and athleticism redefined what was possible in women''s basketball.\n\nLeslie''s list of accomplishments is staggering. She won three WNBA MVP awards, two WNBA championships, and earned eight All-Star selections over her eleven-season career with the Sparks. In 2002, she made history as the first player to dunk in a WNBA game. She was also the first WNBA player to score 3,000, 4,000, 5,000, and 6,000 career points. On the international stage, she won four consecutive Olympic gold medals with Team USA from 1996 through 2008.\n\nIn 2015, Leslie was inducted into the Naismith Memorial Basketball Hall of Fame and the Women''s Basketball Hall of Fame. She has since built a successful career in broadcasting and business. Her story, from Compton to the Hall of Fame, represents one of the most remarkable athletic journeys in American sports and has inspired generations of young women to pursue their basketball dreams.',
  1972,
  NULL,
  'sports',
  'https://upload.wikimedia.org/wikipedia/commons/7/7f/LisaLeslieDec10.jpg',
  ARRAY['https://upload.wikimedia.org/wikipedia/commons/7/7f/LisaLeslieDec10.jpg'],
  ARRAY['Three-time WNBA MVP', 'First player to dunk in a WNBA game (2002)', 'Four consecutive Olympic gold medals (1996-2008)', 'Naismith Memorial Basketball Hall of Fame inductee (2015)', 'First WNBA player to score 6,000 career points'],
  '{"wikipedia": "https://en.wikipedia.org/wiki/Lisa_Leslie"}'::jsonb,
  '1990s-2010s',
  ARRAY['wnba', 'basketball', 'olympic-gold', 'hall-of-fame', 'la-sparks'],
  TRUE,
  18
),

-- 19. VIOLET PALMER
(
  'Violet Palmer',
  'violet-palmer',
  'NBA Referee, Sports Pioneer',
  E'Violet Palmer was raised in Compton and became one of the most significant trailblazers in American professional sports. After leading Cal Poly Pomona''s women''s basketball team to two NCAA Division II championships in 1985 and 1986, she transitioned into officiating and steadily climbed through the ranks. Her ascent would shatter barriers that had stood for decades in the male-dominated world of professional sports officiating.\n\nOn October 31, 1997, Palmer made history as one of the first two women to officiate an NBA game, working the season opener between the Vancouver Grizzlies and Dallas Mavericks. She became the first woman to officiate an NBA playoff game in 2006 and the first female to officiate a major U.S. professional sports All-Star game in 2014. Over her nearly two-decade career, she earned the respect of players, coaches, and fellow officials.\n\nPalmer retired from the NBA in 2016 after an extraordinary career that opened doors for women in sports officiating. She was inducted into the Women''s Basketball Hall of Fame in 2025. Her journey from Compton to the NBA court, in a role that had been exclusively male for half a century, stands as a testament to the pioneering spirit that the city produces.',
  1964,
  NULL,
  'sports',
  'https://upload.wikimedia.org/wikipedia/commons/6/6b/Violet_Palmer.jpg',
  ARRAY['https://upload.wikimedia.org/wikipedia/commons/6/6b/Violet_Palmer.jpg'],
  ARRAY['First female NBA referee (1997)', 'First woman to officiate an NBA playoff game (2006)', 'First woman to officiate a major U.S. pro sports All-Star game (2014)', 'Two NCAA Division II championships as player at Cal Poly Pomona', 'Women''s Basketball Hall of Fame inductee (2025)'],
  '{"wikipedia": "https://en.wikipedia.org/wiki/Violet_Palmer"}'::jsonb,
  '1990s-2010s',
  ARRAY['nba', 'referee', 'pioneer', 'womens-basketball', 'trailblazer'],
  TRUE,
  19
),

-- ============================================================
-- POLITICS CATEGORY (display_order 20-24)
-- ============================================================

-- 20. MAXINE WATERS
(
  'Maxine Waters',
  'maxine-waters',
  'U.S. Congresswoman',
  E'Maxine Moore Waters has represented the communities of South Los Angeles, including areas in and around Compton, in the United States Congress since 1991. Born in St. Louis, Missouri, she moved to Los Angeles as a young woman and began her political career working in a Head Start program before being elected to the California State Assembly in 1976. Her deep roots in the community and fierce advocacy for her constituents made her one of the most recognizable political figures in the region.\n\nIn the California State Assembly, Waters authored groundbreaking legislation including the nation''s first statewide Child Abuse Prevention Training Program and the first plant closure law. In Congress, she chaired the Congressional Black Caucus from 1997 to 1999 and the powerful House Financial Services Committee from 2019 to 2023. She authored the Neighborhood Stabilization Program, securing $6 billion to fight foreclosures and restore neighborhoods.\n\nWaters has been a fearless voice on issues of racial justice, economic equity, and government accountability throughout her decades of public service. She played a prominent role during the 1992 Los Angeles uprising, advocating for the communities most affected by the unrest. Her longevity and influence in Congress have made her one of the most powerful advocates for communities like Compton on the national stage.',
  1938,
  NULL,
  'politics',
  'https://upload.wikimedia.org/wikipedia/commons/5/5e/Maxine_Waters_by_Gage_Skidmore.jpg',
  ARRAY['https://upload.wikimedia.org/wikipedia/commons/5/5e/Maxine_Waters_by_Gage_Skidmore.jpg'],
  ARRAY['Chaired House Financial Services Committee (2019-2023)', 'Authored Neighborhood Stabilization Program securing $6 billion', 'Chaired Congressional Black Caucus (1997-1999)', 'Created nation''s first Child Abuse Prevention Training Program', 'Serving in Congress since 1991'],
  '{"wikipedia": "https://en.wikipedia.org/wiki/Maxine_Waters"}'::jsonb,
  '1970s-Present',
  ARRAY['politics', 'congress', 'civil-rights', 'south-los-angeles'],
  TRUE,
  20
),

-- 21. AJA BROWN
(
  'Aja Brown',
  'aja-brown',
  'Former Mayor of Compton, Urban Planner',
  E'Aja Lena Brown made history in 2013 when she was elected as the youngest mayor in Compton''s history at just 31 years old. An economic development expert and community activist, she brought a fresh, data-driven approach to city governance that prioritized measurable outcomes. Her election represented a generational shift in Compton''s political landscape, and she won re-election in 2017, serving as mayor until 2021.\n\nBrown''s tenure as mayor produced remarkable results. Under her leadership, Compton achieved a 64 percent reduction in homicides without increasing law enforcement funding, instead implementing a holistic gang intervention policy. She reduced the city''s unemployment rate from 50 percent to 9 percent in just over two years and attracted over $3 billion in new investment to Compton. She also created the Compton Apprentice Program to connect local residents with jobs on city-funded projects.\n\nIn 2016, Brown received the John F. Kennedy New Frontier Award, recognizing her innovative approach to public service. She co-founded the Urban Vision Community Development Corporation, a nonprofit dedicated to community economic and youth development. Brown''s mayoral legacy demonstrated that transformative leadership could reshape the narrative around cities like Compton, proving that bold, compassionate governance can produce tangible change.',
  1982,
  NULL,
  'politics',
  'https://upload.wikimedia.org/wikipedia/commons/0/01/Aja_Brown_0021.jpg',
  ARRAY['https://upload.wikimedia.org/wikipedia/commons/0/01/Aja_Brown_0021.jpg'],
  ARRAY['Youngest mayor in Compton history at age 31', 'Achieved 64% reduction in homicides during tenure', 'Reduced unemployment from 50% to 9% in two years', 'John F. Kennedy New Frontier Award recipient (2016)', 'Attracted over $3 billion in new investment to Compton'],
  '{"wikipedia": "https://en.wikipedia.org/wiki/Aja_Brown"}'::jsonb,
  '2010s-Present',
  ARRAY['politics', 'mayor', 'urban-planning', 'economic-development'],
  TRUE,
  21
),

-- 22. EMMA SHARIF
(
  'Emma Sharif',
  'emma-sharif',
  'Mayor of Compton',
  E'Emma Sharif has served as the Mayor of Compton since 2021, bringing a deep knowledge of city governance and community service honed through years on the Compton City Council. Before entering elected office, she served as a Trustee of the Compton Unified School District, where she successfully championed the Emergency Repair Program that brought over $40 million to repair 28 schools across the district. Her career in public service has consistently centered on improving infrastructure and expanding opportunity for Compton residents.\n\nAs mayor, Sharif has overseen a $19.5 million infrastructure improvement program that touches every corner of the city. She has led the Clean and Beautify Compton initiative to revitalize public spaces, established the Compton Arts Commission to support the city''s creative community, and is actively preparing the city for increased visibility during the 2028 Los Angeles Olympics. She has also been deeply involved in regional digital equity initiatives to ensure Compton residents have access to modern technology.\n\nSharif''s leadership style combines practical governance with a vision for Compton''s future. Her work on the City Council, where she enhanced the city''s scholarship program, supported the Collaborative Court, and led efforts to address homelessness and human trafficking, laid the groundwork for her current role. She represents a continuation of Compton''s tradition of strong, community-focused political leadership.',
  NULL,
  NULL,
  'politics',
  NULL,
  ARRAY[]::TEXT[],
  ARRAY['Mayor of Compton since 2021', 'Launched $19.5 million infrastructure improvement program', 'Established the Compton Arts Commission', 'Secured $40 million Emergency Repair Program for 28 schools', 'Preparing Compton for 2028 Los Angeles Olympics'],
  '{"official": "https://www.comptoncity.org/our-city/elected-officials/mayor-emma-sharif"}'::jsonb,
  '2010s-Present',
  ARRAY['politics', 'mayor', 'education', 'infrastructure'],
  TRUE,
  22
),

-- 23. DORIS A. DAVIS
(
  'Doris A. Davis',
  'doris-a-davis',
  'Former Mayor of Compton, Civil Rights Pioneer',
  E'Doris A. Davis made history in 1973 when she became the first African American woman elected mayor of a metropolitan city in the United States, taking office in Compton at a pivotal moment in the city''s demographic and political transformation. Her election came during a period when Compton''s population was shifting from predominantly white to predominantly Black, and her leadership helped ensure that this transition was accompanied by meaningful political representation.\n\nDavis served as mayor of Compton from 1973 to 1977, navigating the challenges of governing a city in transition. She worked to improve city services, expand opportunities for residents, and establish Compton as a center of Black political power in Southern California. Her tenure helped set the stage for the generation of African American politicians who would follow her in Compton and beyond.\n\nThe significance of Davis''s achievement cannot be overstated. At a time when African American women held virtually no executive political positions in American cities, she broke through a barrier that had seemed impenetrable. Her legacy as a pioneer is remembered not just in Compton but across the nation as part of the broader story of Black political empowerment in America.',
  1935,
  NULL,
  'politics',
  'https://upload.wikimedia.org/wikipedia/commons/2/2d/Doris_A._Davis%2C_mayor_of_Compton.png',
  ARRAY['https://upload.wikimedia.org/wikipedia/commons/2/2d/Doris_A._Davis%2C_mayor_of_Compton.png'],
  ARRAY['First African American woman mayor of a metropolitan U.S. city (1973)', 'Mayor of Compton from 1973 to 1977', 'Pioneered Black political representation in Southern California', 'Led Compton during critical demographic transition'],
  '{"wikipedia": "https://en.wikipedia.org/wiki/Doris_A._Davis"}'::jsonb,
  '1970s',
  ARRAY['politics', 'mayor', 'civil-rights', 'pioneer', 'first-black-woman-mayor'],
  TRUE,
  23
),

-- 24. DOUGLAS DOLLARHIDE
(
  'Douglas Dollarhide',
  'douglas-dollarhide',
  'Former Mayor of Compton, Civil Rights Pioneer',
  E'Douglas Dollarhide made history in 1969 when he became the first African American mayor of Compton, California, at a time when the city was undergoing a profound racial and political transformation. His election was part of a broader wave of Black political empowerment in American cities during the civil rights era, and Compton under his leadership became one of the most important centers of African American political power on the West Coast.\n\nDollarhide served on the Compton City Council before ascending to the mayoral office, and his time in office was marked by efforts to ensure that the city''s growing Black population had equitable access to political representation, city services, and economic opportunity. He navigated the complex challenges of governing a city in transition, working to maintain stability while expanding opportunity for all residents.\n\nDollarhide passed away in 2008, but his legacy as a trailblazer in Black municipal governance endures. He paved the way for subsequent Compton mayors including Doris A. Davis, who would become the first African American woman mayor of a metropolitan city. His courage in seeking and winning office at a time of significant racial tension helped establish the tradition of strong Black political leadership that continues to define Compton.',
  1923,
  2008,
  'politics',
  'https://upload.wikimedia.org/wikipedia/commons/b/b2/Douglas_Dollarhide%2C_mayor_of_Compton.png',
  ARRAY['https://upload.wikimedia.org/wikipedia/commons/b/b2/Douglas_Dollarhide%2C_mayor_of_Compton.png'],
  ARRAY['First African American mayor of Compton (1969)', 'Pioneer of Black political leadership in Southern California', 'Compton City Council member before becoming mayor', 'Led Compton during the civil rights era'],
  '{"wikipedia": "https://en.wikipedia.org/wiki/Douglas_Dollarhide"}'::jsonb,
  '1960s-1970s',
  ARRAY['politics', 'mayor', 'civil-rights', 'pioneer', 'first-black-mayor'],
  TRUE,
  24
),

-- ============================================================
-- ARTS/ENTERTAINMENT CATEGORY (display_order 25-28)
-- ============================================================

-- 25. ANTHONY ANDERSON
(
  'Anthony Anderson',
  'anthony-anderson',
  'Actor, Comedian, Television Host',
  E'Anthony Anderson was born and raised in Compton and has built one of the most versatile careers in Hollywood. After attending a Los Angeles performing arts high school, he quickly established himself as a dynamic presence in both comedy and drama. His early film roles in projects like Big Momma''s House, Barbershop, and Kangaroo Jack showcased his comedic timing, while dramatic turns in Hustle & Flow and The Departed demonstrated his range.\n\nAnderson''s career reached its apex with the ABC sitcom Black-ish, in which he starred as Andre Johnson from 2014 to 2022. The show tackled issues of race, identity, and family with humor and heart, earning widespread acclaim and cultural significance. Anderson received eleven Primetime Emmy Award nominations and three Golden Globe nominations for his work on the series. He also hosted the game show To Tell the Truth and starred as Detective Kevin Bernard on Law & Order.\n\nThroughout his success, Anderson has remained connected to his Compton roots. He has spoken openly about how growing up in the city shaped his perspective and work ethic. His career, spanning film, television, and hosting, represents the breadth of creative talent that Compton has contributed to American entertainment.',
  1970,
  NULL,
  'arts',
  'https://upload.wikimedia.org/wikipedia/commons/b/b1/Anthony_Anderson_2010.jpg',
  ARRAY['https://upload.wikimedia.org/wikipedia/commons/b/b1/Anthony_Anderson_2010.jpg'],
  ARRAY['11 Primetime Emmy nominations for Black-ish', 'Starred in Black-ish for eight seasons (2014-2022)', 'Three Golden Globe nominations', 'Film roles in The Departed, Hustle & Flow, and Transformers', 'Hosted To Tell the Truth on ABC'],
  '{"wikipedia": "https://en.wikipedia.org/wiki/Anthony_Anderson"}'::jsonb,
  '1990s-Present',
  ARRAY['actor', 'comedian', 'television', 'black-ish', 'emmy-nominated'],
  TRUE,
  25
),

-- 26. KEVIN COSTNER
(
  'Kevin Costner',
  'kevin-costner',
  'Actor, Director, Producer',
  E'Kevin Michael Costner was born in nearby Lynwood and grew up in Compton, California, before his family later moved. His early years in Compton informed a worldview that would eventually permeate his work as one of Hollywood''s most successful actor-directors. Though he moved during his youth, Costner has acknowledged the influence his early Compton years had on his character and ambition.\n\nCostner rose to become one of the biggest movie stars of the late 1980s and 1990s, starring in era-defining films. He won two Academy Awards for his directorial debut Dances with Wolves, which also won Best Picture. His roles in The Untouchables, Field of Dreams, Bull Durham, JFK, and The Bodyguard established him as a leading man capable of carrying both action spectacles and intimate dramas. His Yellowstone television series became a massive cultural phenomenon in the 2020s.\n\nWith a career spanning more than four decades, multiple Academy Awards, and a filmography that has grossed billions of dollars worldwide, Costner remains one of the most accomplished figures in American cinema. His early connection to Compton adds another dimension to the city''s diverse contributions to arts and entertainment.',
  1955,
  NULL,
  'arts',
  'https://upload.wikimedia.org/wikipedia/commons/b/bc/Kevin_Costner_at_81st_Venice_Film_Festival_%28cropped%29.jpg',
  ARRAY['https://upload.wikimedia.org/wikipedia/commons/b/bc/Kevin_Costner_at_81st_Venice_Film_Festival_%28cropped%29.jpg'],
  ARRAY['Two Academy Awards for Dances with Wolves (Best Picture, Best Director)', 'Star of era-defining films including Field of Dreams and The Bodyguard', 'Lead of Yellowstone television series', 'Career box office earnings in the billions', 'One of the top-grossing actors of the 1990s'],
  '{"wikipedia": "https://en.wikipedia.org/wiki/Kevin_Costner"}'::jsonb,
  '1980s-Present',
  ARRAY['actor', 'director', 'producer', 'academy-award', 'yellowstone'],
  TRUE,
  26
),

-- 27. VINCE STAPLES
(
  'Vince Staples',
  'vince-staples',
  'Rapper, Actor, Television Producer',
  E'Vince Staples was born in Compton and raised in the Ramona Park neighborhood of North Long Beach, maintaining deep ties to both communities throughout his career. He first gained attention through appearances on projects from Odd Future affiliates, including Earl Sweatshirt''s critically acclaimed albums. His distinctive deadpan delivery and darkly observational lyrics set him apart from the mainstream rap landscape.\n\nStaples'' debut album Summertime ''06, released in 2015, was a double-disc examination of growing up in a violent neighborhood, earning widespread critical acclaim. The single Norf Norf achieved platinum certification and became an anthem for a generation. He was named to the prestigious XXL Freshman Class of 2015 and continued releasing innovative projects including Big Fish Theory, which incorporated electronic and dance music influences into hip-hop.\n\nIn 2024, Staples expanded into television with The Vince Staples Show, a scripted comedy series on Netflix produced in collaboration with Kenya Barris. The show drew on his real-life experiences growing up in the Compton and Long Beach areas. Staples represents a new wave of Compton-connected artists who move fluidly between music, film, and television while maintaining artistic integrity and authentic storytelling.',
  1993,
  NULL,
  'arts',
  'https://upload.wikimedia.org/wikipedia/commons/3/38/Vince_Staples_by_Gage_Skidmore.jpg',
  ARRAY['https://upload.wikimedia.org/wikipedia/commons/3/38/Vince_Staples_by_Gage_Skidmore.jpg'],
  ARRAY['Summertime ''06 received universal critical acclaim', 'Norf Norf certified platinum by RIAA', 'XXL Freshman Class of 2015', 'The Vince Staples Show on Netflix (2024)', 'BET Hip Hop Award for Impact Track'],
  '{"wikipedia": "https://en.wikipedia.org/wiki/Vince_Staples"}'::jsonb,
  '2010s-Present',
  ARRAY['hip-hop', 'rap', 'actor', 'television', 'netflix'],
  TRUE,
  27
),

-- ============================================================
-- ACTIVISM/COMMUNITY CATEGORY (display_order 28-29)
-- ============================================================

-- 28. RICHARD WILLIAMS
(
  'Richard Williams',
  'richard-williams',
  'Tennis Coach, Author, Father of Champions',
  E'Richard Dove Williams Jr. is the father and original coach of tennis legends Venus and Serena Williams. Before his daughters were born, he wrote a 78-page plan for their tennis careers after watching Virginia Ruzici win the French Open on television. He then moved his family to Compton, California, deliberately choosing the tough environment to build the mental toughness he believed his daughters would need to succeed in the predominantly white, upper-class world of professional tennis.\n\nOn the cracked and sometimes dangerous public courts of Compton, Richard taught Venus and Serena the fundamentals of tennis, often amidst gang activity and gunfire. Despite having no formal tennis training himself, he developed an unorthodox but remarkably effective coaching methodology. His insistence on education alongside athletics, his strategic management of his daughters'' early careers, and his willingness to challenge the tennis establishment made him one of the most consequential figures in the sport''s history.\n\nRichard''s story was brought to a global audience through the 2021 film King Richard, starring Will Smith, who won the Academy Award for Best Actor for his portrayal. The film highlighted how a self-taught coach from Compton raised two of the greatest athletes of all time, defying every societal expectation placed on his family.',
  1942,
  NULL,
  'activism',
  NULL,
  ARRAY[]::TEXT[],
  ARRAY['Coached Venus and Serena Williams from childhood in Compton', 'Subject of Academy Award-winning film King Richard (2021)', 'Developed unconventional tennis training methodology', 'Raised two of the greatest athletes in sports history', 'Inducted into American Tennis Association Hall of Fame'],
  '{"wikipedia": "https://en.wikipedia.org/wiki/Richard_Williams_(tennis_coach)"}'::jsonb,
  '1980s-Present',
  ARRAY['tennis', 'coaching', 'compton', 'sports-parent', 'king-richard'],
  TRUE,
  28
),

-- 29. MOLLIE BELL
(
  'Mollie Bell',
  'mollie-bell',
  'Community Activist, Photographer, Organizer',
  E'Mollie Bell is a longtime community activist and photographer who has dedicated decades of her life to documenting and advancing the struggle for Black liberation in Southern California. Based in the Compton and South Los Angeles area, Bell has been a tireless organizer and advocate, participating in marches, rallies, and community actions while simultaneously preserving these moments through her photography.\n\nBell''s photographic archive represents an invaluable record of grassroots activism in communities like Compton. She has documented protests, community meetings, cultural celebrations, and everyday life in Black Los Angeles, creating a visual history that might otherwise go unrecorded. Her work captures the spirit of resistance and resilience that defines these communities.\n\nAs both a participant in and chronicler of social justice movements, Mollie Bell embodies the activist tradition that has long been part of Compton''s identity. Her dual role as organizer and documentarian has made her a respected figure in South Los Angeles''s activist community, and her photographs serve as a bridge between generations of community advocates.',
  NULL,
  NULL,
  'activism',
  NULL,
  ARRAY[]::TEXT[],
  ARRAY['Decades of community organizing in South Los Angeles', 'Extensive photographic archive of Black liberation movements', 'Documented social justice activism across Southern California', 'Bridge between generations of community advocates'],
  '{"blm_grassroots": "https://blmgrassroots.org/mollie-bell/"}'::jsonb,
  '1990s-Present',
  ARRAY['activism', 'photography', 'community-organizing', 'social-justice'],
  TRUE,
  29
),

-- ============================================================
-- EDUCATION/BUSINESS CATEGORY (display_order 30-32)
-- ============================================================

-- 30. CANDACE LEOS VALDEPENA
(
  'Candace Leos Valdepena',
  'candace-leos-valdepena',
  'Community Organizer, Nonprofit Founder',
  E'Candace Leos Valdepena is a proud native of Compton who founded the Compton Advocates Coalition, a nonprofit organization dedicated to educating, empowering, and mobilizing Compton residents. She began organizing community meetings in 2019, driven by a desire to ensure that residents had a stronger voice in the decisions affecting their neighborhoods and daily lives.\n\nThe Compton Advocates Coalition quickly grew from informal community gatherings into a formalized nonprofit organization, providing a platform for civic engagement and community education. Valdepena''s work has focused on bringing residents together to address local issues, advocate for improved city services, and hold elected officials accountable. Her grassroots approach to organizing emphasizes the power of informed, engaged citizens.\n\nValdepena represents a new generation of Compton community leaders who are building institutions from the ground up. Her commitment to resident-led advocacy and community empowerment reflects the spirit of self-determination that has long characterized Compton''s civic life. Through the Compton Advocates Coalition, she continues to create spaces where residents can learn, organize, and work together for a better community.',
  NULL,
  NULL,
  'education',
  NULL,
  ARRAY[]::TEXT[],
  ARRAY['Founded Compton Advocates Coalition (2019)', 'Compton native and community organizer', 'Builds platforms for civic engagement and community education', 'Advocates for resident-led community empowerment'],
  '{"compton_advocates": "https://www.comptonadvocates.org/"}'::jsonb,
  '2010s-Present',
  ARRAY['community-organizing', 'nonprofit', 'civic-engagement', 'education'],
  TRUE,
  30
),

-- 31. SARA BOMANI
(
  'Sara Bomani',
  'sara-bomani',
  'Arts Educator, Community Developer',
  E'Sara Bomani is the Co-Creator and Director of Programming for Unearth and Empower Communities, a Compton-based organization that cultivates pathways to college, employment, and entrepreneurship for local youth through culturally rooted STEM education and the arts. Her work sits at the intersection of creativity and community development, using artistic expression as a vehicle for youth empowerment.\n\nBomani has designed and led arts programs serving over 3,000 youth across Paramount, Long Beach, and Compton. Under her guidance, these programs have resulted in the creation of more than 100 murals in schools and neighborhoods across California, transforming public spaces while giving young people a sense of agency and artistic accomplishment. Her approach combines technical art skills with cultural education and community engagement.\n\nThrough her work at Unearth and Empower Communities, Bomani has demonstrated the transformative power of arts education in underserved communities. Her programs provide young people in Compton and surrounding areas with the creative tools, cultural knowledge, and professional pathways they need to thrive. She represents the growing ecosystem of educators and community builders who are investing in Compton''s future generation.',
  NULL,
  NULL,
  'education',
  NULL,
  ARRAY[]::TEXT[],
  ARRAY['Arts programs serving over 3,000 youth', 'Guided creation of 100+ murals across California', 'Co-created Unearth and Empower Communities', 'Culturally rooted STEM and arts education programs'],
  '{"unearth_empower": "https://www.unearthandempower.org/"}'::jsonb,
  '2010s-Present',
  ARRAY['arts-education', 'youth-development', 'murals', 'stem', 'community-development'],
  TRUE,
  31
)

ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  bio = COALESCE(EXCLUDED.bio, notable_people.bio),
  birth_year = COALESCE(EXCLUDED.birth_year, notable_people.birth_year),
  death_year = COALESCE(EXCLUDED.death_year, notable_people.death_year),
  category = EXCLUDED.category,
  portrait_url = COALESCE(EXCLUDED.portrait_url, notable_people.portrait_url),
  image_urls = CASE WHEN array_length(EXCLUDED.image_urls, 1) > 0 THEN EXCLUDED.image_urls ELSE notable_people.image_urls END,
  notable_achievements = CASE WHEN array_length(EXCLUDED.notable_achievements, 1) > 0 THEN EXCLUDED.notable_achievements ELSE notable_people.notable_achievements END,
  external_links = EXCLUDED.external_links || notable_people.external_links,
  era = COALESCE(EXCLUDED.era, notable_people.era),
  tags = COALESCE(EXCLUDED.tags, notable_people.tags),
  display_order = EXCLUDED.display_order;

-- Fix display orders per spec: Kendrick=1, Serena=2, Dr. Dre=3, Venus=4
UPDATE notable_people SET display_order = 1 WHERE slug = 'kendrick-lamar';
UPDATE notable_people SET display_order = 2 WHERE slug = 'serena-williams';
UPDATE notable_people SET display_order = 3 WHERE slug = 'dr-dre';
UPDATE notable_people SET display_order = 4 WHERE slug = 'venus-williams';

-- Verify count
DO $$
BEGIN
  RAISE NOTICE 'Seeded % notable people', (SELECT count(*) FROM notable_people WHERE display_order BETWEEN 1 AND 31);
END $$;
