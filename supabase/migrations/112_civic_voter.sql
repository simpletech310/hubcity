-- ============================================================
-- Hub City App — Voter / election surface
-- ============================================================
-- Three small tables that power /city-hall/vote:
--   * polling_locations  — precinct addresses, hours, district
--   * elections          — name, dates, info_url, type
--   * candidates         — per-election cards (office, bio, photo)
--
-- Public read for everyone; admin write via the existing admin role.
-- ============================================================

CREATE TABLE IF NOT EXISTS polling_locations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id       UUID REFERENCES cities(id) ON DELETE SET NULL,
  district      INTEGER CHECK (district BETWEEN 1 AND 4),
  name          TEXT NOT NULL,
  address       TEXT NOT NULL,
  latitude      DOUBLE PRECISION,
  longitude     DOUBLE PRECISION,
  hours_text    TEXT,
  is_accessible BOOLEAN NOT NULL DEFAULT TRUE,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_polling_district
  ON polling_locations (district);

CREATE TABLE IF NOT EXISTS elections (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id               UUID REFERENCES cities(id) ON DELETE SET NULL,
  name                  TEXT NOT NULL,
  slug                  TEXT NOT NULL UNIQUE,
  election_date         DATE NOT NULL,
  registration_deadline DATE,
  type                  TEXT NOT NULL DEFAULT 'general'
                         CHECK (type IN ('general','primary','runoff','special','school','local')),
  description           TEXT,
  info_url              TEXT,
  is_published          BOOLEAN NOT NULL DEFAULT FALSE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_elections_date
  ON elections (election_date)
  WHERE is_published = TRUE;

CREATE TABLE IF NOT EXISTS candidates (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  election_id  UUID NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  office       TEXT NOT NULL,
  party        TEXT,
  bio          TEXT,
  photo_url    TEXT,
  website      TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_candidates_election
  ON candidates (election_id, display_order, name);

-- ── RLS ──────────────────────────────────────────────────────

ALTER TABLE polling_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE elections ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "polling_public_read"
  ON polling_locations FOR SELECT USING (TRUE);

CREATE POLICY "polling_admin_all"
  ON polling_locations FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','city_official')));

CREATE POLICY "elections_public_read"
  ON elections FOR SELECT USING (is_published = TRUE);

CREATE POLICY "elections_admin_all"
  ON elections FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','city_official')));

CREATE POLICY "candidates_public_read"
  ON candidates FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM elections e
      WHERE e.id = candidates.election_id AND e.is_published = TRUE
    )
  );

CREATE POLICY "candidates_admin_all"
  ON candidates FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','city_official')));
