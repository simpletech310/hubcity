-- ============================================================
-- 092: FREQUENCY — Audio streaming hub (podcasts + music)
--
-- Adds the schema needed to power a sibling audio destination to
-- the existing ON AIR (live/) video hub. Mux-backed audio assets
-- (audio-only Mux assets), with albums (covers single/EP/album/
-- mixtape), tracks, podcast extension, playlists, audio_genres,
-- and audio_plays analytics.
-- ============================================================

-- ── 1. Audio genres reference table ───────────────────────────
CREATE TABLE IF NOT EXISTS audio_genres (
  slug        TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  icon        TEXT,
  sort_order  INT  NOT NULL DEFAULT 0,
  active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO audio_genres (slug, name, icon, sort_order) VALUES
  ('hip-hop',          'Hip-Hop',           'headphones',   10),
  ('r-b-soul',         'R&B / Soul',        'heart',        20),
  ('gospel',           'Gospel',            'music',        30),
  ('jazz',             'Jazz',              'disc',         40),
  ('latin',            'Latin',             'globe',        50),
  ('reggae',           'Reggae',            'sun',          60),
  ('electronic',       'Electronic',        'radio',        70),
  ('rock',             'Rock',              'guitar',       80),
  ('country',          'Country',           'star',         90),
  ('news-talk',        'News & Talk',       'mic',         100),
  ('culture-stories',  'Culture & Stories', 'book-open',   110),
  ('business-tech',    'Business & Tech',   'briefcase',   120),
  ('faith',            'Faith',             'heart',       130),
  ('comedy',           'Comedy',            'smile',       140),
  ('kids',             'Kids & Family',     'star',        150)
ON CONFLICT (slug) DO NOTHING;

-- ── 2. Albums (single / EP / album / mixtape) ────────────────
CREATE TABLE IF NOT EXISTS albums (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id            UUID REFERENCES channels(id) ON DELETE SET NULL,
  creator_id            UUID REFERENCES profiles(id) ON DELETE SET NULL,
  slug                  TEXT NOT NULL UNIQUE,
  title                 TEXT NOT NULL,
  description           TEXT,
  release_type          TEXT NOT NULL DEFAULT 'single'
                         CHECK (release_type IN ('single','ep','album','mixtape')),
  cover_art_url         TEXT,
  cover_art_path        TEXT,
  genre_slug            TEXT REFERENCES audio_genres(slug),
  release_date          DATE,
  access_type           TEXT NOT NULL DEFAULT 'free'
                         CHECK (access_type IN ('free','subscribers','ppv')),
  price_cents           INT,
  ppv_stripe_price_id   TEXT,
  preview_seconds       INT,
  is_published          BOOLEAN NOT NULL DEFAULT FALSE,
  is_demo               BOOLEAN NOT NULL DEFAULT FALSE,
  play_count            BIGINT  NOT NULL DEFAULT 0,
  like_count            BIGINT  NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_albums_channel       ON albums (channel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_albums_creator       ON albums (creator_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_albums_genre         ON albums (genre_slug, created_at DESC) WHERE is_published = TRUE;
CREATE INDEX IF NOT EXISTS idx_albums_release_type  ON albums (release_type, created_at DESC) WHERE is_published = TRUE;
CREATE INDEX IF NOT EXISTS idx_albums_published     ON albums (is_published, created_at DESC);

-- ── 3. Tracks (rows in an album) ─────────────────────────────
CREATE TABLE IF NOT EXISTS tracks (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id            UUID NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  channel_id          UUID REFERENCES channels(id) ON DELETE SET NULL,
  creator_id          UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title               TEXT NOT NULL,
  track_number        INT  NOT NULL,
  duration_seconds    INT,
  mux_asset_id        TEXT,
  mux_playback_id     TEXT,
  mux_upload_id       TEXT,
  mux_status          TEXT NOT NULL DEFAULT 'pending'
                       CHECK (mux_status IN ('pending','ready','errored')),
  genre_slug          TEXT REFERENCES audio_genres(slug),
  explicit            BOOLEAN NOT NULL DEFAULT FALSE,
  features            TEXT[],
  credits             JSONB,
  mid_roll_seconds    INT[],
  play_count          BIGINT NOT NULL DEFAULT 0,
  is_published        BOOLEAN NOT NULL DEFAULT FALSE,
  is_demo             BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (album_id, track_number)
);

CREATE INDEX IF NOT EXISTS idx_tracks_album        ON tracks (album_id, track_number);
CREATE INDEX IF NOT EXISTS idx_tracks_genre        ON tracks (genre_slug, created_at DESC) WHERE is_published = TRUE;
CREATE INDEX IF NOT EXISTS idx_tracks_creator      ON tracks (creator_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tracks_mux_status   ON tracks (mux_status);

-- ── 4. Extend podcasts (Mux + genre + creator + mid-rolls) ───
ALTER TABLE podcasts
  ADD COLUMN IF NOT EXISTS mux_asset_id      TEXT,
  ADD COLUMN IF NOT EXISTS mux_playback_id   TEXT,
  ADD COLUMN IF NOT EXISTS mux_upload_id     TEXT,
  ADD COLUMN IF NOT EXISTS mux_status        TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS genre_slug        TEXT,
  ADD COLUMN IF NOT EXISTS explicit          BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS mid_roll_seconds  INT[],
  ADD COLUMN IF NOT EXISTS creator_id        UUID,
  ADD COLUMN IF NOT EXISTS show_slug         TEXT,
  ADD COLUMN IF NOT EXISTS show_title        TEXT,
  ADD COLUMN IF NOT EXISTS show_description  TEXT,
  ADD COLUMN IF NOT EXISTS is_demo           BOOLEAN NOT NULL DEFAULT FALSE;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'podcasts_mux_status_check') THEN
    ALTER TABLE podcasts
      ADD CONSTRAINT podcasts_mux_status_check
        CHECK (mux_status IN ('pending','ready','errored'));
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'podcasts_genre_slug_fkey'
  ) THEN
    ALTER TABLE podcasts
      ADD CONSTRAINT podcasts_genre_slug_fkey
        FOREIGN KEY (genre_slug) REFERENCES audio_genres(slug);
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_podcasts_genre        ON podcasts (genre_slug, published_at DESC) WHERE is_published = TRUE;
CREATE INDEX IF NOT EXISTS idx_podcasts_show_slug    ON podcasts (show_slug, episode_number);
CREATE INDEX IF NOT EXISTS idx_podcasts_mux_status   ON podcasts (mux_status);

-- ── 5. Playlists (user-curated and editorial) ────────────────
CREATE TABLE IF NOT EXISTS playlists (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  cover_art_url   TEXT,
  is_public       BOOLEAN NOT NULL DEFAULT TRUE,
  is_editorial    BOOLEAN NOT NULL DEFAULT FALSE,
  is_demo         BOOLEAN NOT NULL DEFAULT FALSE,
  genre_slug      TEXT REFERENCES audio_genres(slug),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS playlist_items (
  playlist_id     UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  position        INT  NOT NULL,
  item_type       TEXT NOT NULL CHECK (item_type IN ('track','episode')),
  item_id         UUID NOT NULL,
  added_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (playlist_id, position)
);

CREATE INDEX IF NOT EXISTS idx_playlist_items_lookup ON playlist_items (item_type, item_id);

-- ── 6. Audio plays (analytics + ad pacing) ───────────────────
CREATE TABLE IF NOT EXISTS audio_plays (
  id                          BIGSERIAL PRIMARY KEY,
  listener_id                 UUID REFERENCES profiles(id) ON DELETE SET NULL,
  item_type                   TEXT NOT NULL CHECK (item_type IN ('track','episode')),
  item_id                     UUID NOT NULL,
  source                      TEXT CHECK (source IN ('album','podcast','playlist','genre_mix','direct')),
  started_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duration_listened_seconds   INT NOT NULL DEFAULT 0,
  completed                   BOOLEAN NOT NULL DEFAULT FALSE,
  ad_breaks_served            INT NOT NULL DEFAULT 0,
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audio_plays_listener   ON audio_plays (listener_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_audio_plays_item       ON audio_plays (item_type, item_id, started_at DESC);

-- ── 7. RLS policies ──────────────────────────────────────────
ALTER TABLE audio_genres   ENABLE ROW LEVEL SECURITY;
ALTER TABLE albums         ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracks         ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlists      ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_plays    ENABLE ROW LEVEL SECURITY;

-- audio_genres: public read, no writes from clients
DROP POLICY IF EXISTS audio_genres_public_read ON audio_genres;
CREATE POLICY audio_genres_public_read ON audio_genres FOR SELECT USING (active = TRUE);

-- albums: public read of published rows, owner manages
DROP POLICY IF EXISTS albums_public_read ON albums;
CREATE POLICY albums_public_read ON albums FOR SELECT USING (is_published = TRUE OR creator_id = auth.uid());

DROP POLICY IF EXISTS albums_owner_write ON albums;
CREATE POLICY albums_owner_write ON albums FOR INSERT WITH CHECK (creator_id = auth.uid());

DROP POLICY IF EXISTS albums_owner_update ON albums;
CREATE POLICY albums_owner_update ON albums FOR UPDATE USING (creator_id = auth.uid());

DROP POLICY IF EXISTS albums_owner_delete ON albums;
CREATE POLICY albums_owner_delete ON albums FOR DELETE USING (creator_id = auth.uid());

-- tracks: public read of published rows in published albums
DROP POLICY IF EXISTS tracks_public_read ON tracks;
CREATE POLICY tracks_public_read ON tracks FOR SELECT
  USING (
    is_published = TRUE
    OR creator_id = auth.uid()
    OR EXISTS (SELECT 1 FROM albums a WHERE a.id = album_id AND a.creator_id = auth.uid())
  );

DROP POLICY IF EXISTS tracks_owner_write ON tracks;
CREATE POLICY tracks_owner_write ON tracks FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM albums a WHERE a.id = album_id AND a.creator_id = auth.uid())
);

DROP POLICY IF EXISTS tracks_owner_update ON tracks;
CREATE POLICY tracks_owner_update ON tracks FOR UPDATE USING (
  EXISTS (SELECT 1 FROM albums a WHERE a.id = album_id AND a.creator_id = auth.uid())
);

DROP POLICY IF EXISTS tracks_owner_delete ON tracks;
CREATE POLICY tracks_owner_delete ON tracks FOR DELETE USING (
  EXISTS (SELECT 1 FROM albums a WHERE a.id = album_id AND a.creator_id = auth.uid())
);

-- playlists
DROP POLICY IF EXISTS playlists_public_read ON playlists;
CREATE POLICY playlists_public_read ON playlists FOR SELECT
  USING (is_public = TRUE OR owner_id = auth.uid());

DROP POLICY IF EXISTS playlists_owner_write ON playlists;
CREATE POLICY playlists_owner_write ON playlists FOR INSERT WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS playlists_owner_update ON playlists;
CREATE POLICY playlists_owner_update ON playlists FOR UPDATE USING (owner_id = auth.uid());

DROP POLICY IF EXISTS playlists_owner_delete ON playlists;
CREATE POLICY playlists_owner_delete ON playlists FOR DELETE USING (owner_id = auth.uid());

-- playlist_items: read if playlist is readable; write if owner
DROP POLICY IF EXISTS playlist_items_read ON playlist_items;
CREATE POLICY playlist_items_read ON playlist_items FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM playlists p WHERE p.id = playlist_id
            AND (p.is_public = TRUE OR p.owner_id = auth.uid()))
  );

DROP POLICY IF EXISTS playlist_items_owner_write ON playlist_items;
CREATE POLICY playlist_items_owner_write ON playlist_items FOR ALL
  USING (
    EXISTS (SELECT 1 FROM playlists p WHERE p.id = playlist_id AND p.owner_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM playlists p WHERE p.id = playlist_id AND p.owner_id = auth.uid())
  );

-- audio_plays: insert open (anon listeners ok); read only own rows
DROP POLICY IF EXISTS audio_plays_insert ON audio_plays;
CREATE POLICY audio_plays_insert ON audio_plays FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS audio_plays_read_own ON audio_plays;
CREATE POLICY audio_plays_read_own ON audio_plays FOR SELECT USING (listener_id = auth.uid());

DROP POLICY IF EXISTS audio_plays_update_own ON audio_plays;
CREATE POLICY audio_plays_update_own ON audio_plays FOR UPDATE USING (listener_id = auth.uid() OR listener_id IS NULL);

-- ── 8. Comments ──────────────────────────────────────────────
COMMENT ON TABLE  audio_genres    IS 'Reference taxonomy for the FREQUENCY audio hub.';
COMMENT ON TABLE  albums          IS 'Audio releases (single / EP / album / mixtape).';
COMMENT ON TABLE  tracks          IS 'Tracks in an album. mux_playback_id may be reused across demo rows.';
COMMENT ON TABLE  playlists       IS 'User-curated and editorial playlists.';
COMMENT ON TABLE  playlist_items  IS 'Ordered items in a playlist (track or episode).';
COMMENT ON TABLE  audio_plays     IS 'Per-play analytics and ad-pacing source-of-truth.';
COMMENT ON COLUMN albums.is_demo  IS 'Set by FREQUENCY seed script; safe to purge.';
COMMENT ON COLUMN tracks.is_demo  IS 'Set by FREQUENCY seed script; safe to purge.';
COMMENT ON COLUMN podcasts.is_demo IS 'Set by FREQUENCY seed script; safe to purge.';
