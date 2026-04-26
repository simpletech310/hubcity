-- ============================================================
-- 105: Seed Adiz the BAM (post + moment + music + on-air video
--      with pre-roll ad rotation) AND Element 78 fitness brand
--      (business + retail + trainer job + post + moment).
--
-- Idempotent. Safe to re-run.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- A. Adiz the BAM — find by handle/display name and seed her
--    creator surface (post, moment, music album+track, channel
--    video, pre-roll ad video, simulated-live rotation).
-- ────────────────────────────────────────────────────────────
DO $adiz$
DECLARE
  v_adiz          UUID;
  v_channel       UUID;
  v_album         UUID;
  v_track         UUID;
  v_perf_video    UUID;
  v_ad_video      UUID;
  v_now           TIMESTAMPTZ := NOW();
BEGIN
  SELECT id INTO v_adiz
  FROM profiles
  WHERE handle ILIKE '%adiz%'
     OR display_name ILIKE '%adiz%'
     OR display_name ILIKE '%bam%'
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_adiz IS NULL THEN
    RAISE NOTICE 'Adiz the BAM profile not found — skipping creator seeds.';
    RETURN;
  END IF;

  -- Promote to creator
  UPDATE profiles
  SET is_creator = TRUE,
      creator_tier = COALESCE(creator_tier, 'rising'),
      role = CASE WHEN role IN ('citizen') THEN 'content_creator' ELSE role END,
      updated_at = NOW()
  WHERE id = v_adiz;

  -- Ensure she has a channel
  SELECT id INTO v_channel
  FROM channels
  WHERE owner_id = v_adiz
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_channel IS NULL THEN
    INSERT INTO channels (
      name, slug, type, owner_id, scope,
      is_active, is_verified, is_live_simulated, description, follower_count
    ) VALUES (
      'Adiz the BAM',
      'adiz-the-bam',
      'music',
      v_adiz,
      'local',
      TRUE,
      TRUE,
      TRUE,
      'Compton-rooted music, performance, and culture from Adiz the BAM.',
      0
    )
    ON CONFLICT (slug) DO UPDATE SET
      owner_id = EXCLUDED.owner_id,
      is_live_simulated = TRUE,
      is_active = TRUE
    RETURNING id INTO v_channel;
  ELSE
    UPDATE channels SET is_live_simulated = TRUE WHERE id = v_channel;
  END IF;

  -- ── POST ───────────────────────────────────────────────
  IF NOT EXISTS (
    SELECT 1 FROM posts
    WHERE author_id = v_adiz
      AND body LIKE 'New chapter, same Compton roots.%'
  ) THEN
    INSERT INTO posts (author_id, body, image_url, is_published, hashtags)
    VALUES (
      v_adiz,
      'New chapter, same Compton roots. Studio session today — putting the finishing touches on something for the city.',
      'https://images.unsplash.com/photo-1598387993441-a364f854c3e1?w=1200&q=80',
      TRUE,
      ARRAY['compton','newmusic','studio']
    );
  END IF;

  -- ── MOMENT (reel) ──────────────────────────────────────
  IF NOT EXISTS (
    SELECT 1 FROM reels
    WHERE author_id = v_adiz
      AND caption LIKE 'BAM in the lab.%'
  ) THEN
    INSERT INTO reels (
      author_id, video_url, video_path, poster_url, poster_path,
      caption, duration_seconds, width, height, is_published, hashtags
    ) VALUES (
      v_adiz,
      'https://videos.pexels.com/video-files/4990229/4990229-hd_1080_1920_30fps.mp4',
      'reels/adiz/preview.mp4',
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=720&h=1280&fit=crop',
      'reels/adiz/preview.jpg',
      'BAM in the lab. New record loading.',
      18.5,
      1080,
      1920,
      TRUE,
      ARRAY['compton','bam','reel']
    );
  END IF;

  -- ── ALBUM (Frequency) ──────────────────────────────────
  INSERT INTO albums (
    creator_id, channel_id, slug, title, description,
    release_type, cover_art_url, genre_slug, release_date, is_published
  ) VALUES (
    v_adiz, v_channel,
    'bam-szn-2026',
    'BAM SZN',
    'A six-track introduction to Adiz the BAM — Compton soul, modern hip-hop, Sunday cookout energy.',
    'ep',
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&h=800&fit=crop',
    'hip-hop',
    '2026-04-01',
    TRUE
  )
  ON CONFLICT (slug) DO UPDATE SET
    creator_id   = EXCLUDED.creator_id,
    channel_id   = EXCLUDED.channel_id,
    is_published = TRUE,
    updated_at   = NOW()
  RETURNING id INTO v_album;

  -- ── TRACK ──────────────────────────────────────────────
  INSERT INTO tracks (
    album_id, channel_id, creator_id, title, track_number,
    duration_seconds, mux_playback_id, mux_status, genre_slug, is_published
  ) VALUES (
    v_album, v_channel, v_adiz,
    'Hub City Anthem',
    1,
    201,
    'demo-bam-anthem-pb',
    'ready',
    'hip-hop',
    TRUE
  )
  ON CONFLICT (album_id, track_number) DO UPDATE SET
    title = EXCLUDED.title,
    is_published = TRUE,
    updated_at = NOW()
  RETURNING id INTO v_track;

  -- ── CHANNEL VIDEO (her performance, on-air) ─────────────
  SELECT id INTO v_perf_video
  FROM channel_videos
  WHERE channel_id = v_channel AND title = 'Adiz the BAM — Live at Compton Center'
  LIMIT 1;

  IF v_perf_video IS NULL THEN
    INSERT INTO channel_videos (
      channel_id, title, description, video_type,
      mux_playback_id, status, duration, thumbnail_url,
      is_published, published_at
    ) VALUES (
      v_channel,
      'Adiz the BAM — Live at Compton Center',
      'A live performance recorded at Compton Center — opening with "Hub City Anthem".',
      'original',
      'demo-bam-live-pb',
      'ready',
      540,
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1280&h=720&fit=crop',
      TRUE,
      NOW()
    ) RETURNING id INTO v_perf_video;
  END IF;

  -- ── AD VIDEO (Element 78 pre-roll, also on her channel) ─
  SELECT id INTO v_ad_video
  FROM channel_videos
  WHERE channel_id = v_channel AND title = 'Element 78 — Move with Purpose'
  LIMIT 1;

  IF v_ad_video IS NULL THEN
    INSERT INTO channel_videos (
      channel_id, title, description, video_type,
      mux_playback_id, status, duration, thumbnail_url,
      is_published, published_at
    ) VALUES (
      v_channel,
      'Element 78 — Move with Purpose',
      'Element 78 fitness apparel — Compton-built. 30-second spot.',
      'on_demand',
      'demo-element78-ad-pb',
      'ready',
      30,
      'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1280&h=720&fit=crop',
      TRUE,
      NOW()
    ) RETURNING id INTO v_ad_video;
  END IF;

  -- ── REBUILD a 4-slot rotation: AD → performance → AD → performance ──
  DELETE FROM scheduled_broadcasts
  WHERE channel_id = v_channel
    AND ends_at >= v_now
    AND starts_at <= v_now + INTERVAL '3 hours';

  INSERT INTO scheduled_broadcasts (channel_id, video_id, starts_at, ends_at, position, is_ad_slot) VALUES
    (v_channel, v_ad_video,   v_now,                                                                      v_now + INTERVAL '30 seconds',                                                              1, TRUE),
    (v_channel, v_perf_video, v_now + INTERVAL '30 seconds',                                              v_now + INTERVAL '30 seconds'  + INTERVAL '540 seconds',                                    2, FALSE),
    (v_channel, v_ad_video,   v_now + INTERVAL '30 seconds'  + INTERVAL '540 seconds',                    v_now + INTERVAL '60 seconds'  + INTERVAL '540 seconds',                                    3, TRUE),
    (v_channel, v_perf_video, v_now + INTERVAL '60 seconds'  + INTERVAL '540 seconds',                    v_now + INTERVAL '60 seconds'  + INTERVAL '1080 seconds',                                   4, FALSE);

  RAISE NOTICE 'Adiz the BAM seeded. profile=% channel=% album=% track=% perf_video=% ad_video=%',
    v_adiz, v_channel, v_album, v_track, v_perf_video, v_ad_video;
END
$adiz$;


-- ────────────────────────────────────────────────────────────
-- B. ELEMENT 78 — owner profile, business, retail, job, post,
--    moment. Owner email/domain split with `||` so chat-pasted
--    SQL never gets auto-linkified.
-- ────────────────────────────────────────────────────────────

INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  is_sso_user, is_anonymous, created_at, updated_at
) VALUES (
  'b7800001-0000-4000-8000-000000007800',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'team@element78' || '.app',
  crypt('HubCity2026!Element', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"display_name":"Element 78"}'::jsonb,
  FALSE, FALSE, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (
  id, user_id, provider_id, provider, identity_data,
  last_sign_in_at, created_at, updated_at
) VALUES (
  'b7800001-0000-4000-8000-000000007800',
  'b7800001-0000-4000-8000-000000007800',
  'b7800001-0000-4000-8000-000000007800',
  'email',
  jsonb_build_object(
    'sub','b7800001-0000-4000-8000-000000007800',
    'email','team@element78' || '.app'
  ),
  NOW(), NOW(), NOW()
) ON CONFLICT DO NOTHING;

INSERT INTO profiles (
  id, display_name, handle, avatar_url, bio, role,
  verification_status, city, state, zip
) VALUES (
  'b7800001-0000-4000-8000-000000007800',
  'Element 78',
  'element78',
  'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=400&fit=crop',
  'Compton-built fitness brand. Performance apparel and recovery gear designed for athletes who train where they live.',
  'business_owner',
  'verified',
  'Compton', 'CA', '90220'
) ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  handle = EXCLUDED.handle,
  avatar_url = EXCLUDED.avatar_url,
  bio = EXCLUDED.bio,
  role = EXCLUDED.role,
  verification_status = EXCLUDED.verification_status;

-- Business (retail / fitness brand)
INSERT INTO businesses (
  id, owner_id, name, slug, category, description, address,
  phone, website, image_urls, badges, is_published, accepts_orders
) VALUES (
  'b7800002-0000-4000-8000-000000007800',
  'b7800001-0000-4000-8000-000000007800',
  'Element 78',
  'element-78',
  'retail',
  'Compton-built fitness brand. Performance apparel and recovery gear designed for athletes who train where they live. Drop-in training, retail floor, and a small studio in the back.',
  '1078 Compton Blvd, Compton, CA 90220',
  '(310) 555-0178',
  'https://element78' || '.shop',
  ARRAY[
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1600&q=80',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1600&q=80',
    'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=1600&q=80'
  ],
  ARRAY['hub_verified','trending']::text[],
  TRUE,
  TRUE
) ON CONFLICT (slug) DO UPDATE SET
  owner_id     = EXCLUDED.owner_id,
  description  = EXCLUDED.description,
  is_published = TRUE,
  accepts_orders = TRUE,
  updated_at   = NOW();

-- Products: 2 clothing items + tripod water bottle.
INSERT INTO menu_items (business_id, name, description, price, category, image_url, sort_order, is_available)
SELECT
  (SELECT id FROM businesses WHERE slug = 'element-78'),
  x.name, x.description, x.price, x.category, x.image_url, x.sort_order, TRUE
FROM (VALUES
  (
    'E78 Training Tee',
    'Lightweight, sweat-wicking performance tee. Compton-made graphics, locker-room ready. Unisex fit.',
    4500, 'Apparel',
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1200&q=80',
    1
  ),
  (
    'E78 Performance Joggers',
    'Tapered training joggers in mid-weight french terry. Side-zip pocket, drawcord waist.',
    7800, 'Apparel',
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&q=80',
    2
  ),
  (
    'Tripod Hydration Bottle',
    '32oz vacuum-insulated water bottle with a built-in tripod base — set it down, snap a clip, keep training. Stainless steel, BPA-free.',
    3900, 'Accessories',
    'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=1200&q=80',
    3
  )
) AS x(name, description, price, category, image_url, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM menu_items m
  WHERE m.business_id = (SELECT id FROM businesses WHERE slug = 'element-78')
    AND m.name = x.name
);

-- Job posting — Personal Trainer
INSERT INTO job_listings (
  business_id, title, slug, description, requirements,
  job_type, salary_min, salary_max, salary_type, location,
  is_active, contact_email, contact_phone
)
SELECT
  (SELECT id FROM businesses WHERE slug = 'element-78'),
  'Personal Trainer',
  'element-78-personal-trainer',
  'Element 78 is hiring a Personal Trainer to join the Compton studio. You will run small-group strength sessions, build individualized programs for retail clients, and represent the brand on the floor and on socials. Mornings and evenings, four to five days a week.',
  E'- Current personal training certification (NASM, ACE, NSCA, or equivalent)\n- 2+ years coaching experience with adult clients\n- CPR/AED certified (or willing to certify in first 30 days)\n- Strong communicator, comfortable on camera for short brand content\n- Compton or surrounding area preferred',
  'part_time',
  35.00,
  60.00,
  'hourly',
  'Compton, CA',
  TRUE,
  'jobs@element78' || '.app',
  '(310) 555-0178'
WHERE NOT EXISTS (
  SELECT 1 FROM job_listings WHERE slug = 'element-78-personal-trainer'
);

-- Element 78 — POST authored by the brand profile
INSERT INTO posts (author_id, body, image_url, is_published, hashtags)
SELECT
  'b7800001-0000-4000-8000-000000007800'::uuid,
  'Doors open. The first drop is in — Training Tees, Performance Joggers, and the Tripod Hydration Bottle. Built in Compton, for the work. Come through 1078 Compton Blvd.',
  'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1600&q=80',
  TRUE,
  ARRAY['element78','compton','fitness','firstdrop']
WHERE NOT EXISTS (
  SELECT 1 FROM posts
  WHERE author_id = 'b7800001-0000-4000-8000-000000007800'::uuid
    AND body LIKE 'Doors open. The first drop is in%'
);

-- Element 78 — MOMENT (reel)
INSERT INTO reels (
  author_id, video_url, video_path, poster_url, poster_path,
  caption, duration_seconds, width, height, is_published, hashtags
)
SELECT
  'b7800001-0000-4000-8000-000000007800'::uuid,
  'https://videos.pexels.com/video-files/3196284/3196284-hd_1080_1920_25fps.mp4',
  'reels/element78/intro.mp4',
  'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=720&h=1280&fit=crop',
  'reels/element78/intro.jpg',
  'Move with purpose. Compton-built. — Element 78',
  22.0,
  1080,
  1920,
  TRUE,
  ARRAY['element78','compton','training']
WHERE NOT EXISTS (
  SELECT 1 FROM reels
  WHERE author_id = 'b7800001-0000-4000-8000-000000007800'::uuid
    AND caption LIKE 'Move with purpose. Compton-built.%'
);
