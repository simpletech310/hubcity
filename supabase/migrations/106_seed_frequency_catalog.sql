-- ============================================================
-- 106: Populate the Frequency hub with demo catalog.
--
-- Reuses ONE working Mux audio playback ID across every seeded
-- track / podcast episode so the page fills out and any tile
-- still plays the same real asset (per 092's design note:
-- "mux_playback_id may be reused across demo rows").
--
-- Seeds:
--   - 12 albums (singles, EPs, albums, mixtapes) across genres
--   - 2–3 tracks per album
--   - 6 podcast shows × 3 episodes each (18 episodes total)
--   - 6 editorial playlists with track items
--
-- Idempotent. Safe to re-run. All rows flagged is_demo = TRUE
-- so they can be purged later.
-- ============================================================

DO $freq$
DECLARE
  v_pb         TEXT;     -- shared mux_playback_id reused across all seed rows
  v_album_id   UUID;
  v_track_dur  INT  := 195;
  v_now        TIMESTAMPTZ := NOW();

  -- Cover-art bank (Unsplash-hosted, square 800)
  c_hiphop1   CONSTANT TEXT := 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&h=800&fit=crop';
  c_hiphop2   CONSTANT TEXT := 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=800&fit=crop';
  c_rnb1      CONSTANT TEXT := 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&h=800&fit=crop';
  c_rnb2      CONSTANT TEXT := 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&h=800&fit=crop';
  c_gospel    CONSTANT TEXT := 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=800&h=800&fit=crop';
  c_jazz      CONSTANT TEXT := 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=800&h=800&fit=crop';
  c_latin     CONSTANT TEXT := 'https://images.unsplash.com/photo-1493676304819-0d7a8d026dcf?w=800&h=800&fit=crop';
  c_reggae    CONSTANT TEXT := 'https://images.unsplash.com/photo-1471478331149-c72f17e33c73?w=800&h=800&fit=crop';
  c_electro   CONSTANT TEXT := 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=800&h=800&fit=crop';
  c_faith     CONSTANT TEXT := 'https://images.unsplash.com/photo-1438032005730-c779502df39b?w=800&h=800&fit=crop';
  c_culture1  CONSTANT TEXT := 'https://images.unsplash.com/photo-1485579149621-3123dd979885?w=800&h=800&fit=crop';
  c_culture2  CONSTANT TEXT := 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=800&fit=crop';

  -- Podcast cover bank
  p_civic     CONSTANT TEXT := 'https://images.unsplash.com/photo-1589903308904-1010c2294adc?w=800&h=800&fit=crop';
  p_business  CONSTANT TEXT := 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&h=800&fit=crop';
  p_culture   CONSTANT TEXT := 'https://images.unsplash.com/photo-1494059980473-813e73ee784b?w=800&h=800&fit=crop';
  p_sports    CONSTANT TEXT := 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&h=800&fit=crop';
  p_faith     CONSTANT TEXT := 'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=800&h=800&fit=crop';
  p_youth     CONSTANT TEXT := 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=800&fit=crop';

  -- Playlist cover bank
  pl_morning  CONSTANT TEXT := 'https://images.unsplash.com/photo-1504700610630-ac6aba3536d3?w=800&h=800&fit=crop';
  pl_workout  CONSTANT TEXT := 'https://images.unsplash.com/photo-1483721310020-03333e577078?w=800&h=800&fit=crop';
  pl_sunday   CONSTANT TEXT := 'https://images.unsplash.com/photo-1465225314224-587cd83d322b?w=800&h=800&fit=crop';
  pl_lowrider CONSTANT TEXT := 'https://images.unsplash.com/photo-1468581264429-2548ef9eb732?w=800&h=800&fit=crop';
  pl_focus    CONSTANT TEXT := 'https://images.unsplash.com/photo-1453738773917-9c3eff1db985?w=800&h=800&fit=crop';
  pl_block    CONSTANT TEXT := 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=800&fit=crop';
BEGIN
  -- ── Pick a real, working mux_playback_id from the DB ──
  -- Prefer a real published track asset. Fall back to the demo
  -- placeholder we ship with seed 105.
  SELECT mux_playback_id INTO v_pb
  FROM tracks
  WHERE mux_status = 'ready'
    AND mux_playback_id IS NOT NULL
    AND mux_playback_id NOT LIKE 'demo-%'
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_pb IS NULL THEN
    SELECT mux_playback_id INTO v_pb
    FROM podcasts
    WHERE mux_status = 'ready'
      AND mux_playback_id IS NOT NULL
      AND mux_playback_id NOT LIKE 'demo-%'
    ORDER BY created_at ASC
    LIMIT 1;
  END IF;

  IF v_pb IS NULL THEN
    v_pb := 'demo-bam-anthem-pb';
    RAISE NOTICE 'No real Mux audio asset found — falling back to demo placeholder %. Seeded tiles will list but won''t play until a real asset exists.', v_pb;
  ELSE
    RAISE NOTICE 'Reusing existing Mux playback id % across seeded catalog.', v_pb;
  END IF;

  -- ════════════════════════════════════════════════════════════
  -- ALBUMS
  -- ════════════════════════════════════════════════════════════

  -- helper: insert album (or fetch existing by slug), then 2–3 tracks
  -- We inline 12 albums below. Each block returns v_album_id and
  -- inserts tracks reusing v_pb.

  -- 1. Hip-hop SINGLE
  INSERT INTO albums (slug, title, description, release_type, cover_art_url, genre_slug, release_date, is_published, is_demo)
  VALUES ('hub-city-anthem-rmx', 'Hub City Anthem (Remix)', 'A west-coast remix flip of the Compton anthem.', 'single', c_hiphop1, 'hip-hop', '2026-04-12', TRUE, TRUE)
  ON CONFLICT (slug) DO UPDATE SET is_published = TRUE, is_demo = TRUE, updated_at = NOW()
  RETURNING id INTO v_album_id;
  INSERT INTO tracks (album_id, title, track_number, duration_seconds, mux_playback_id, mux_status, genre_slug, is_published, is_demo)
  VALUES (v_album_id, 'Hub City Anthem (Remix)', 1, v_track_dur, v_pb, 'ready', 'hip-hop', TRUE, TRUE)
  ON CONFLICT (album_id, track_number) DO UPDATE SET mux_playback_id = EXCLUDED.mux_playback_id, mux_status = 'ready', is_published = TRUE;

  -- 2. R&B EP
  INSERT INTO albums (slug, title, description, release_type, cover_art_url, genre_slug, release_date, is_published, is_demo)
  VALUES ('long-beach-nights-ep', 'Long Beach Nights', 'Late-night R&B from the 710 corridor — three slow burners.', 'ep', c_rnb1, 'r-b-soul', '2026-03-22', TRUE, TRUE)
  ON CONFLICT (slug) DO UPDATE SET is_published = TRUE, is_demo = TRUE, updated_at = NOW()
  RETURNING id INTO v_album_id;
  INSERT INTO tracks (album_id, title, track_number, duration_seconds, mux_playback_id, mux_status, genre_slug, is_published, is_demo) VALUES
    (v_album_id, 'Velvet Hour',     1, 222, v_pb, 'ready', 'r-b-soul', TRUE, TRUE),
    (v_album_id, '3AM Phone Call',  2, 198, v_pb, 'ready', 'r-b-soul', TRUE, TRUE),
    (v_album_id, 'Dominguez Drive', 3, 244, v_pb, 'ready', 'r-b-soul', TRUE, TRUE)
  ON CONFLICT (album_id, track_number) DO UPDATE SET mux_playback_id = EXCLUDED.mux_playback_id, mux_status = 'ready', is_published = TRUE;

  -- 3. Gospel ALBUM
  INSERT INTO albums (slug, title, description, release_type, cover_art_url, genre_slug, release_date, is_published, is_demo)
  VALUES ('greater-temple-live', 'Greater Temple — Live in Compton', 'Sunday service, recorded live. Choir, horns, and testimony.', 'album', c_gospel, 'gospel', '2026-02-14', TRUE, TRUE)
  ON CONFLICT (slug) DO UPDATE SET is_published = TRUE, is_demo = TRUE, updated_at = NOW()
  RETURNING id INTO v_album_id;
  INSERT INTO tracks (album_id, title, track_number, duration_seconds, mux_playback_id, mux_status, genre_slug, is_published, is_demo) VALUES
    (v_album_id, 'Praise Procession', 1, 312, v_pb, 'ready', 'gospel', TRUE, TRUE),
    (v_album_id, 'I Surrender',       2, 268, v_pb, 'ready', 'gospel', TRUE, TRUE),
    (v_album_id, 'Choir Reprise',     3, 187, v_pb, 'ready', 'gospel', TRUE, TRUE)
  ON CONFLICT (album_id, track_number) DO UPDATE SET mux_playback_id = EXCLUDED.mux_playback_id, mux_status = 'ready', is_published = TRUE;

  -- 4. Jazz ALBUM
  INSERT INTO albums (slug, title, description, release_type, cover_art_url, genre_slug, release_date, is_published, is_demo)
  VALUES ('blue-line-quartet', 'The Blue Line Quartet', 'Standards reimagined for the LA Metro. Recorded in one take.', 'album', c_jazz, 'jazz', '2026-01-30', TRUE, TRUE)
  ON CONFLICT (slug) DO UPDATE SET is_published = TRUE, is_demo = TRUE, updated_at = NOW()
  RETURNING id INTO v_album_id;
  INSERT INTO tracks (album_id, title, track_number, duration_seconds, mux_playback_id, mux_status, genre_slug, is_published, is_demo) VALUES
    (v_album_id, 'Wilmington Walk', 1, 412, v_pb, 'ready', 'jazz', TRUE, TRUE),
    (v_album_id, 'Slauson Stride',  2, 376, v_pb, 'ready', 'jazz', TRUE, TRUE)
  ON CONFLICT (album_id, track_number) DO UPDATE SET mux_playback_id = EXCLUDED.mux_playback_id, mux_status = 'ready', is_published = TRUE;

  -- 5. Latin SINGLE
  INSERT INTO albums (slug, title, description, release_type, cover_art_url, genre_slug, release_date, is_published, is_demo)
  VALUES ('cumbia-del-bulevar', 'Cumbia del Bulevar', 'A Compton-Acapulco cumbia for backyard parties.', 'single', c_latin, 'latin', '2026-04-05', TRUE, TRUE)
  ON CONFLICT (slug) DO UPDATE SET is_published = TRUE, is_demo = TRUE, updated_at = NOW()
  RETURNING id INTO v_album_id;
  INSERT INTO tracks (album_id, title, track_number, duration_seconds, mux_playback_id, mux_status, genre_slug, is_published, is_demo)
  VALUES (v_album_id, 'Cumbia del Bulevar', 1, 233, v_pb, 'ready', 'latin', TRUE, TRUE)
  ON CONFLICT (album_id, track_number) DO UPDATE SET mux_playback_id = EXCLUDED.mux_playback_id, mux_status = 'ready', is_published = TRUE;

  -- 6. Reggae MIXTAPE
  INSERT INTO albums (slug, title, description, release_type, cover_art_url, genre_slug, release_date, is_published, is_demo)
  VALUES ('westside-roots-vol-1', 'Westside Roots, Vol. 1', 'A reggae mixtape of LA-rooted artists, hosted by DJ Pacífico.', 'mixtape', c_reggae, 'reggae', '2026-03-08', TRUE, TRUE)
  ON CONFLICT (slug) DO UPDATE SET is_published = TRUE, is_demo = TRUE, updated_at = NOW()
  RETURNING id INTO v_album_id;
  INSERT INTO tracks (album_id, title, track_number, duration_seconds, mux_playback_id, mux_status, genre_slug, is_published, is_demo) VALUES
    (v_album_id, 'Sound the Horn',   1, 211, v_pb, 'ready', 'reggae', TRUE, TRUE),
    (v_album_id, 'Skank in the Sun', 2, 246, v_pb, 'ready', 'reggae', TRUE, TRUE),
    (v_album_id, 'Dub for the City', 3, 305, v_pb, 'ready', 'reggae', TRUE, TRUE)
  ON CONFLICT (album_id, track_number) DO UPDATE SET mux_playback_id = EXCLUDED.mux_playback_id, mux_status = 'ready', is_published = TRUE;

  -- 7. Electronic EP
  INSERT INTO albums (slug, title, description, release_type, cover_art_url, genre_slug, release_date, is_published, is_demo)
  VALUES ('ports-and-power-lines', 'Ports & Power Lines', 'Industrial-tinted house, synthesized from LA infrastructure.', 'ep', c_electro, 'electronic', '2026-04-18', TRUE, TRUE)
  ON CONFLICT (slug) DO UPDATE SET is_published = TRUE, is_demo = TRUE, updated_at = NOW()
  RETURNING id INTO v_album_id;
  INSERT INTO tracks (album_id, title, track_number, duration_seconds, mux_playback_id, mux_status, genre_slug, is_published, is_demo) VALUES
    (v_album_id, 'Substation',  1, 354, v_pb, 'ready', 'electronic', TRUE, TRUE),
    (v_album_id, '710 Loop',    2, 392, v_pb, 'ready', 'electronic', TRUE, TRUE),
    (v_album_id, 'Phasewalker', 3, 421, v_pb, 'ready', 'electronic', TRUE, TRUE)
  ON CONFLICT (album_id, track_number) DO UPDATE SET mux_playback_id = EXCLUDED.mux_playback_id, mux_status = 'ready', is_published = TRUE;

  -- 8. Faith ALBUM
  INSERT INTO albums (slug, title, description, release_type, cover_art_url, genre_slug, release_date, is_published, is_demo)
  VALUES ('letters-from-the-pulpit', 'Letters from the Pulpit', 'Spoken-word and song. A young pastor''s first project.', 'album', c_faith, 'faith', '2026-02-28', TRUE, TRUE)
  ON CONFLICT (slug) DO UPDATE SET is_published = TRUE, is_demo = TRUE, updated_at = NOW()
  RETURNING id INTO v_album_id;
  INSERT INTO tracks (album_id, title, track_number, duration_seconds, mux_playback_id, mux_status, genre_slug, is_published, is_demo) VALUES
    (v_album_id, 'Letter One: Hope',    1, 256, v_pb, 'ready', 'faith', TRUE, TRUE),
    (v_album_id, 'Letter Two: Endure',  2, 287, v_pb, 'ready', 'faith', TRUE, TRUE)
  ON CONFLICT (album_id, track_number) DO UPDATE SET mux_playback_id = EXCLUDED.mux_playback_id, mux_status = 'ready', is_published = TRUE;

  -- 9. Hip-hop ALBUM
  INSERT INTO albums (slug, title, description, release_type, cover_art_url, genre_slug, release_date, is_published, is_demo)
  VALUES ('rosecrans-roses', 'Rosecrans Roses', 'A coming-of-age album from a Centennial High senior.', 'album', c_hiphop2, 'hip-hop', '2026-03-15', TRUE, TRUE)
  ON CONFLICT (slug) DO UPDATE SET is_published = TRUE, is_demo = TRUE, updated_at = NOW()
  RETURNING id INTO v_album_id;
  INSERT INTO tracks (album_id, title, track_number, duration_seconds, mux_playback_id, mux_status, genre_slug, is_published, is_demo) VALUES
    (v_album_id, 'Sunset on Rosecrans', 1, 203, v_pb, 'ready', 'hip-hop', TRUE, TRUE),
    (v_album_id, 'Pop''s Cadillac',     2, 218, v_pb, 'ready', 'hip-hop', TRUE, TRUE),
    (v_album_id, 'Graduation Day',      3, 184, v_pb, 'ready', 'hip-hop', TRUE, TRUE)
  ON CONFLICT (album_id, track_number) DO UPDATE SET mux_playback_id = EXCLUDED.mux_playback_id, mux_status = 'ready', is_published = TRUE;

  -- 10. R&B SINGLE
  INSERT INTO albums (slug, title, description, release_type, cover_art_url, genre_slug, release_date, is_published, is_demo)
  VALUES ('palmer-park-summers', 'Palmer Park Summers', 'A breezy single about block-party romance.', 'single', c_rnb2, 'r-b-soul', '2026-04-20', TRUE, TRUE)
  ON CONFLICT (slug) DO UPDATE SET is_published = TRUE, is_demo = TRUE, updated_at = NOW()
  RETURNING id INTO v_album_id;
  INSERT INTO tracks (album_id, title, track_number, duration_seconds, mux_playback_id, mux_status, genre_slug, is_published, is_demo)
  VALUES (v_album_id, 'Palmer Park Summers', 1, 209, v_pb, 'ready', 'r-b-soul', TRUE, TRUE)
  ON CONFLICT (album_id, track_number) DO UPDATE SET mux_playback_id = EXCLUDED.mux_playback_id, mux_status = 'ready', is_published = TRUE;

  -- 11. Culture & Stories MIXTAPE
  INSERT INTO albums (slug, title, description, release_type, cover_art_url, genre_slug, release_date, is_published, is_demo)
  VALUES ('voices-of-the-hub', 'Voices of the Hub', 'Spoken-word + ambient: stories from elders, students, and shop owners.', 'mixtape', c_culture1, 'culture-stories', '2026-01-12', TRUE, TRUE)
  ON CONFLICT (slug) DO UPDATE SET is_published = TRUE, is_demo = TRUE, updated_at = NOW()
  RETURNING id INTO v_album_id;
  INSERT INTO tracks (album_id, title, track_number, duration_seconds, mux_playback_id, mux_status, genre_slug, is_published, is_demo) VALUES
    (v_album_id, 'The Barber',         1, 312, v_pb, 'ready', 'culture-stories', TRUE, TRUE),
    (v_album_id, 'The Crossing Guard', 2, 274, v_pb, 'ready', 'culture-stories', TRUE, TRUE),
    (v_album_id, 'The Quinceañera',    3, 298, v_pb, 'ready', 'culture-stories', TRUE, TRUE)
  ON CONFLICT (album_id, track_number) DO UPDATE SET mux_playback_id = EXCLUDED.mux_playback_id, mux_status = 'ready', is_published = TRUE;

  -- 12. Culture & Stories EP
  INSERT INTO albums (slug, title, description, release_type, cover_art_url, genre_slug, release_date, is_published, is_demo)
  VALUES ('north-of-rosecrans', 'North of Rosecrans', 'Six poems about home, set to live drums and bass.', 'ep', c_culture2, 'culture-stories', '2026-04-08', TRUE, TRUE)
  ON CONFLICT (slug) DO UPDATE SET is_published = TRUE, is_demo = TRUE, updated_at = NOW()
  RETURNING id INTO v_album_id;
  INSERT INTO tracks (album_id, title, track_number, duration_seconds, mux_playback_id, mux_status, genre_slug, is_published, is_demo) VALUES
    (v_album_id, 'North of Rosecrans', 1, 187, v_pb, 'ready', 'culture-stories', TRUE, TRUE),
    (v_album_id, 'Linden & Long Beach', 2, 199, v_pb, 'ready', 'culture-stories', TRUE, TRUE)
  ON CONFLICT (album_id, track_number) DO UPDATE SET mux_playback_id = EXCLUDED.mux_playback_id, mux_status = 'ready', is_published = TRUE;

  -- ════════════════════════════════════════════════════════════
  -- PODCAST SHOWS — 6 shows × 3 episodes each
  -- (podcasts is one row per episode; show grouping via show_slug)
  -- ════════════════════════════════════════════════════════════

  -- Helper pattern: insert episode if not already present (by show_slug + episode_number).
  -- audio_url is NOT NULL — set to a passthrough placeholder; player uses mux_playback_id.

  -- Show 1: Council Cast (civic / news-talk)
  INSERT INTO podcasts (show_slug, show_title, show_description, title, description, audio_url, mux_playback_id, mux_status, thumbnail_url, duration, episode_number, season_number, genre_slug, is_published, is_demo, published_at)
  SELECT 'council-cast', 'Council Cast', 'A weekly recap of the Compton City Council — what passed, what didn''t, and what to watch.', t.title, t.description, 'https://stream.mux.com/' || v_pb || '/audio.m3u8', v_pb, 'ready', p_civic, t.duration, t.epnum, 1, 'news-talk', TRUE, TRUE, t.pub
  FROM (VALUES
    ('Ep. 1 — The Budget That Almost Wasn''t', 'How a 3-2 vote rewired the FY26 budget.',                       1, 1820, NOW() - INTERVAL '21 days'),
    ('Ep. 2 — Public Comment, Public Stakes',  'A 90-minute public comment night, distilled.',                 2, 1545, NOW() - INTERVAL '14 days'),
    ('Ep. 3 — The Park Bond Comes Home',       'What the new park bond actually pays for.',                    3, 1980, NOW() -  INTERVAL '7 days')
  ) AS t(title, description, epnum, duration, pub)
  WHERE NOT EXISTS (
    SELECT 1 FROM podcasts WHERE show_slug = 'council-cast' AND episode_number = t.epnum
  );

  -- Show 2: Hub City Hustle (business)
  INSERT INTO podcasts (show_slug, show_title, show_description, title, description, audio_url, mux_playback_id, mux_status, thumbnail_url, duration, episode_number, season_number, genre_slug, is_published, is_demo, published_at)
  SELECT 'hub-city-hustle', 'Hub City Hustle', 'Conversations with Compton entrepreneurs — barbershops, food trucks, fitness, fashion.', t.title, t.description, 'https://stream.mux.com/' || v_pb || '/audio.m3u8', v_pb, 'ready', p_business, t.duration, t.epnum, 1, 'business-tech', TRUE, TRUE, t.pub
  FROM (VALUES
    ('From Backyard Cookout to Brand',  'Two siblings turn a Saturday tradition into a catering business.', 1, 2210, NOW() - INTERVAL '20 days'),
    ('A Barber, A Block, A Brand',       'Building a barbershop that doubles as a community hub.',           2, 1880, NOW() - INTERVAL '13 days'),
    ('Element 78 — Move with Purpose',   'How a fitness brand started in a Compton garage.',                  3, 1965, NOW() -  INTERVAL '6 days')
  ) AS t(title, description, epnum, duration, pub)
  WHERE NOT EXISTS (
    SELECT 1 FROM podcasts WHERE show_slug = 'hub-city-hustle' AND episode_number = t.epnum
  );

  -- Show 3: After Service (faith)
  INSERT INTO podcasts (show_slug, show_title, show_description, title, description, audio_url, mux_playback_id, mux_status, thumbnail_url, duration, episode_number, season_number, genre_slug, is_published, is_demo, published_at)
  SELECT 'after-service', 'After Service', 'Compton pastors and faith leaders, off the pulpit.', t.title, t.description, 'https://stream.mux.com/' || v_pb || '/audio.m3u8', v_pb, 'ready', p_faith, t.duration, t.epnum, 1, 'faith', TRUE, TRUE, t.pub
  FROM (VALUES
    ('On Forgiveness',     'Three pastors talk about the hardest sermons.', 1, 2400, NOW() - INTERVAL '24 days'),
    ('On Showing Up',       'Why Sunday isn''t the only day that matters.',  2, 2150, NOW() - INTERVAL '17 days'),
    ('On Raising Boys',     'Mentorship in the church and beyond.',          3, 2300, NOW() - INTERVAL '10 days')
  ) AS t(title, description, epnum, duration, pub)
  WHERE NOT EXISTS (
    SELECT 1 FROM podcasts WHERE show_slug = 'after-service' AND episode_number = t.epnum
  );

  -- Show 4: Centennial Sidelines (sports / kids & family-adjacent)
  INSERT INTO podcasts (show_slug, show_title, show_description, title, description, audio_url, mux_playback_id, mux_status, thumbnail_url, duration, episode_number, season_number, genre_slug, is_published, is_demo, published_at)
  SELECT 'centennial-sidelines', 'Centennial Sidelines', 'Compton and Centennial High athletics — Friday-night recaps and weekend previews.', t.title, t.description, 'https://stream.mux.com/' || v_pb || '/audio.m3u8', v_pb, 'ready', p_sports, t.duration, t.epnum, 1, 'culture-stories', TRUE, TRUE, t.pub
  FROM (VALUES
    ('Week 1 Recap',          'A statement opener for the Apaches.',                  1, 1620, NOW() - INTERVAL '23 days'),
    ('The Crosstown Preview', 'Centennial vs Compton, and what''s on the line.',      2, 1480, NOW() - INTERVAL '16 days'),
    ('Senior Night Stories',  'Three seniors share what this season means.',          3, 1750, NOW() -  INTERVAL '9 days')
  ) AS t(title, description, epnum, duration, pub)
  WHERE NOT EXISTS (
    SELECT 1 FROM podcasts WHERE show_slug = 'centennial-sidelines' AND episode_number = t.epnum
  );

  -- Show 5: Block Stories (culture)
  INSERT INTO podcasts (show_slug, show_title, show_description, title, description, audio_url, mux_playback_id, mux_status, thumbnail_url, duration, episode_number, season_number, genre_slug, is_published, is_demo, published_at)
  SELECT 'block-stories', 'Block Stories', 'Oral histories from the Hub. One block, one episode.', t.title, t.description, 'https://stream.mux.com/' || v_pb || '/audio.m3u8', v_pb, 'ready', p_culture, t.duration, t.epnum, 1, 'culture-stories', TRUE, TRUE, t.pub
  FROM (VALUES
    ('Rosecrans & Wilmington',  'The intersection that built three generations.',     1, 2050, NOW() - INTERVAL '22 days'),
    ('Compton Blvd & Long Beach','The corner everyone has a story about.',            2, 2210, NOW() - INTERVAL '15 days'),
    ('Alondra Park',             'How the park became the center of a neighborhood.', 3, 1995, NOW() -  INTERVAL '8 days')
  ) AS t(title, description, epnum, duration, pub)
  WHERE NOT EXISTS (
    SELECT 1 FROM podcasts WHERE show_slug = 'block-stories' AND episode_number = t.epnum
  );

  -- Show 6: First Bell (kids & family / education)
  INSERT INTO podcasts (show_slug, show_title, show_description, title, description, audio_url, mux_playback_id, mux_status, thumbnail_url, duration, episode_number, season_number, genre_slug, is_published, is_demo, published_at)
  SELECT 'first-bell', 'First Bell', 'CUSD teachers, principals, and parents on what''s working in classrooms.', t.title, t.description, 'https://stream.mux.com/' || v_pb || '/audio.m3u8', v_pb, 'ready', p_youth, t.duration, t.epnum, 1, 'kids', TRUE, TRUE, t.pub
  FROM (VALUES
    ('Reading at Grade Level', 'A 4th-grade teacher on the work behind the data.',  1, 1840, NOW() - INTERVAL '19 days'),
    ('After-School That Works', 'Three programs that move the needle.',             2, 1720, NOW() - INTERVAL '12 days'),
    ('The Senior-Year Push',    'Counselors on FAFSA, applications, and follow-up.',3, 1995, NOW() -  INTERVAL '5 days')
  ) AS t(title, description, epnum, duration, pub)
  WHERE NOT EXISTS (
    SELECT 1 FROM podcasts WHERE show_slug = 'first-bell' AND episode_number = t.epnum
  );

  -- ════════════════════════════════════════════════════════════
  -- EDITORIAL PLAYLISTS — 6 lists, each with 4–6 demo tracks
  -- ════════════════════════════════════════════════════════════

  PERFORM 1; -- (no-op separator)

  -- 1. Compton Mornings
  INSERT INTO playlists (id, title, description, cover_art_url, is_public, is_editorial, is_demo, genre_slug)
  VALUES ('a0aa0001-0000-4000-8000-000000000001', 'Compton Mornings', 'Soft starts. Coffee, sunrise on Rosecrans, headphones in.', pl_morning, TRUE, TRUE, TRUE, 'r-b-soul')
  ON CONFLICT (id) DO UPDATE SET is_public = TRUE, is_editorial = TRUE, is_demo = TRUE, updated_at = NOW();

  -- 2. Workout Heat
  INSERT INTO playlists (id, title, description, cover_art_url, is_public, is_editorial, is_demo, genre_slug)
  VALUES ('a0aa0001-0000-4000-8000-000000000002', 'Workout Heat', 'For the run, the lift, the rep that hurts. Element 78 approved.', pl_workout, TRUE, TRUE, TRUE, 'hip-hop')
  ON CONFLICT (id) DO UPDATE SET is_public = TRUE, is_editorial = TRUE, is_demo = TRUE, updated_at = NOW();

  -- 3. Sunday Service
  INSERT INTO playlists (id, title, description, cover_art_url, is_public, is_editorial, is_demo, genre_slug)
  VALUES ('a0aa0001-0000-4000-8000-000000000003', 'Sunday Service', 'Greater Temple, choirs, and praise from the pulpit.', pl_sunday, TRUE, TRUE, TRUE, 'gospel')
  ON CONFLICT (id) DO UPDATE SET is_public = TRUE, is_editorial = TRUE, is_demo = TRUE, updated_at = NOW();

  -- 4. Lowrider Sundays
  INSERT INTO playlists (id, title, description, cover_art_url, is_public, is_editorial, is_demo, genre_slug)
  VALUES ('a0aa0001-0000-4000-8000-000000000004', 'Lowrider Sundays', 'Cruising music: oldies, soul, slow jams, sun.', pl_lowrider, TRUE, TRUE, TRUE, 'r-b-soul')
  ON CONFLICT (id) DO UPDATE SET is_public = TRUE, is_editorial = TRUE, is_demo = TRUE, updated_at = NOW();

  -- 5. Deep Focus
  INSERT INTO playlists (id, title, description, cover_art_url, is_public, is_editorial, is_demo, genre_slug)
  VALUES ('a0aa0001-0000-4000-8000-000000000005', 'Deep Focus', 'Ambient, jazz, and electronic for long-form work.', pl_focus, TRUE, TRUE, TRUE, 'electronic')
  ON CONFLICT (id) DO UPDATE SET is_public = TRUE, is_editorial = TRUE, is_demo = TRUE, updated_at = NOW();

  -- 6. Block Party 2026
  INSERT INTO playlists (id, title, description, cover_art_url, is_public, is_editorial, is_demo, genre_slug)
  VALUES ('a0aa0001-0000-4000-8000-000000000006', 'Block Party 2026', 'The summer rotation. Hip-hop, cumbia, reggae, and a horn or two.', pl_block, TRUE, TRUE, TRUE, 'hip-hop')
  ON CONFLICT (id) DO UPDATE SET is_public = TRUE, is_editorial = TRUE, is_demo = TRUE, updated_at = NOW();

  -- Fill each playlist with up to 6 published demo tracks (chosen by genre when possible)
  -- Wipe prior items for these editorial lists first so re-runs stay clean.
  DELETE FROM playlist_items
  WHERE playlist_id IN (
    'a0aa0001-0000-4000-8000-000000000001',
    'a0aa0001-0000-4000-8000-000000000002',
    'a0aa0001-0000-4000-8000-000000000003',
    'a0aa0001-0000-4000-8000-000000000004',
    'a0aa0001-0000-4000-8000-000000000005',
    'a0aa0001-0000-4000-8000-000000000006'
  );

  -- Mornings → r-b-soul + culture-stories
  INSERT INTO playlist_items (playlist_id, position, item_type, item_id)
  SELECT 'a0aa0001-0000-4000-8000-000000000001', ROW_NUMBER() OVER (ORDER BY t.created_at), 'track', t.id
  FROM tracks t
  WHERE t.is_published AND t.genre_slug IN ('r-b-soul','culture-stories')
  ORDER BY t.created_at LIMIT 6;

  -- Workout Heat → hip-hop + electronic
  INSERT INTO playlist_items (playlist_id, position, item_type, item_id)
  SELECT 'a0aa0001-0000-4000-8000-000000000002', ROW_NUMBER() OVER (ORDER BY t.created_at), 'track', t.id
  FROM tracks t
  WHERE t.is_published AND t.genre_slug IN ('hip-hop','electronic')
  ORDER BY t.created_at LIMIT 6;

  -- Sunday Service → gospel + faith
  INSERT INTO playlist_items (playlist_id, position, item_type, item_id)
  SELECT 'a0aa0001-0000-4000-8000-000000000003', ROW_NUMBER() OVER (ORDER BY t.created_at), 'track', t.id
  FROM tracks t
  WHERE t.is_published AND t.genre_slug IN ('gospel','faith')
  ORDER BY t.created_at LIMIT 6;

  -- Lowrider Sundays → r-b-soul + latin + jazz
  INSERT INTO playlist_items (playlist_id, position, item_type, item_id)
  SELECT 'a0aa0001-0000-4000-8000-000000000004', ROW_NUMBER() OVER (ORDER BY t.created_at), 'track', t.id
  FROM tracks t
  WHERE t.is_published AND t.genre_slug IN ('r-b-soul','latin','jazz')
  ORDER BY t.created_at LIMIT 6;

  -- Deep Focus → jazz + electronic + culture-stories
  INSERT INTO playlist_items (playlist_id, position, item_type, item_id)
  SELECT 'a0aa0001-0000-4000-8000-000000000005', ROW_NUMBER() OVER (ORDER BY t.created_at), 'track', t.id
  FROM tracks t
  WHERE t.is_published AND t.genre_slug IN ('jazz','electronic','culture-stories')
  ORDER BY t.created_at LIMIT 6;

  -- Block Party → hip-hop + reggae + latin
  INSERT INTO playlist_items (playlist_id, position, item_type, item_id)
  SELECT 'a0aa0001-0000-4000-8000-000000000006', ROW_NUMBER() OVER (ORDER BY t.created_at), 'track', t.id
  FROM tracks t
  WHERE t.is_published AND t.genre_slug IN ('hip-hop','reggae','latin')
  ORDER BY t.created_at LIMIT 6;

  RAISE NOTICE 'Frequency catalog seeded: 12 albums + 18 podcast episodes + 6 editorial playlists (mux_playback_id=%).', v_pb;
END
$freq$;
