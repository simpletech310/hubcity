-- ============================================================
-- 043: Civic Officials & Accountability System
-- Adds civic_officials, voting records, manager actions,
-- accountability vectors, and trustee area mappings.
-- ============================================================

-- ── Add school_trustee role ──────────────────────────────────
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'school_trustee';

-- Update profiles CHECK constraint to include new role
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN (
    'citizen', 'business_owner', 'admin', 'city_official',
    'content_creator', 'city_ambassador', 'chamber_admin',
    'resource_provider', 'school_trustee'
  ));

-- ── Civic Officials (extended profiles for tracked officials) ─
CREATE TABLE IF NOT EXISTS civic_officials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  official_type TEXT NOT NULL CHECK (official_type IN (
    'mayor', 'council_member', 'city_manager',
    'school_trustee', 'board_president', 'board_vp',
    'board_clerk', 'board_member', 'superintendent'
  )),
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  district INTEGER CHECK (district BETWEEN 1 AND 4),
  trustee_area TEXT CHECK (trustee_area IN ('A','B','C','D','E','F','G')),
  party TEXT,
  in_office_since TEXT,
  term_expires TEXT,
  running_for TEXT,
  is_voting_member BOOLEAN NOT NULL DEFAULT true,
  photo_url TEXT,
  background TEXT,
  geography TEXT,
  communities TEXT[] DEFAULT '{}',
  schools TEXT[] DEFAULT '{}',
  dual_role TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_civic_officials_type ON civic_officials(official_type);
CREATE INDEX IF NOT EXISTS idx_civic_officials_district ON civic_officials(district);
CREATE INDEX IF NOT EXISTS idx_civic_officials_trustee_area ON civic_officials(trustee_area);
CREATE INDEX IF NOT EXISTS idx_civic_officials_profile ON civic_officials(profile_id);

ALTER TABLE civic_officials ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'civic_officials' AND policyname = 'Anyone can view civic officials') THEN
    CREATE POLICY "Anyone can view civic officials" ON civic_officials FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'civic_officials' AND policyname = 'Admins can manage civic officials') THEN
    CREATE POLICY "Admins can manage civic officials" ON civic_officials FOR ALL
      USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
      WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

-- ── Official Flags (controversies, investigations, notable items) ─
CREATE TABLE IF NOT EXISTS official_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  official_id UUID NOT NULL REFERENCES civic_officials(id) ON DELETE CASCADE,
  flag_type TEXT NOT NULL DEFAULT 'controversy' CHECK (flag_type IN (
    'controversy', 'investigation', 'lawsuit', 'ethics',
    'fiscal', 'positive', 'dual_role', 'info'
  )),
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical')),
  source_url TEXT,
  is_resolved BOOLEAN DEFAULT false,
  flagged_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_official_flags_official ON official_flags(official_id);

ALTER TABLE official_flags ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'official_flags' AND policyname = 'Anyone can view official flags') THEN
    CREATE POLICY "Anyone can view official flags" ON official_flags FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'official_flags' AND policyname = 'Admins can manage official flags') THEN
    CREATE POLICY "Admins can manage official flags" ON official_flags FOR ALL
      USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
      WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

-- ── Council Votes ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS council_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN (
    'finance_budget', 'governance_reform', 'public_safety',
    'community_development', 'transparency', 'electoral',
    'infrastructure', 'housing', 'other'
  )),
  vote_date TEXT NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('passed', 'failed', 'tabled', 'withdrawn', 'placed_on_ballot')),
  vote_tally TEXT,
  impact_level TEXT NOT NULL DEFAULT 'medium' CHECK (impact_level IN ('low', 'medium', 'high')),
  aftermath TEXT,
  source_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE council_votes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'council_votes' AND policyname = 'Anyone can view council votes') THEN
    CREATE POLICY "Anyone can view council votes" ON council_votes FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'council_votes' AND policyname = 'Admins can manage council votes') THEN
    CREATE POLICY "Admins can manage council votes" ON council_votes FOR ALL
      USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
      WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

-- ── Council Vote Roll Calls ─────────────────────────────────
CREATE TABLE IF NOT EXISTS council_vote_rolls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vote_id UUID NOT NULL REFERENCES council_votes(id) ON DELETE CASCADE,
  official_id UUID NOT NULL REFERENCES civic_officials(id) ON DELETE CASCADE,
  position TEXT NOT NULL CHECK (position IN ('aye', 'nay', 'abstain', 'absent', 'na', 'placed_on_ballot')),
  notes TEXT,
  UNIQUE(vote_id, official_id)
);

CREATE INDEX IF NOT EXISTS idx_vote_rolls_vote ON council_vote_rolls(vote_id);
CREATE INDEX IF NOT EXISTS idx_vote_rolls_official ON council_vote_rolls(official_id);

ALTER TABLE council_vote_rolls ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'council_vote_rolls' AND policyname = 'Anyone can view vote rolls') THEN
    CREATE POLICY "Anyone can view vote rolls" ON council_vote_rolls FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'council_vote_rolls' AND policyname = 'Admins can manage vote rolls') THEN
    CREATE POLICY "Admins can manage vote rolls" ON council_vote_rolls FOR ALL
      USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
      WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

-- ── Board Actions (CUSD school board decisions) ─────────────
CREATE TABLE IF NOT EXISTS board_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN (
    'facilities_bond', 'budget_academics', 'governance',
    'transportation', 'academics', 'personnel',
    'equity', 'community', 'other'
  )),
  action_date TEXT NOT NULL,
  result TEXT DEFAULT 'approved' CHECK (result IN ('approved', 'denied', 'tabled', 'informational')),
  impact_level TEXT NOT NULL DEFAULT 'medium' CHECK (impact_level IN ('low', 'medium', 'high')),
  outcome TEXT,
  source_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE board_actions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'board_actions' AND policyname = 'Anyone can view board actions') THEN
    CREATE POLICY "Anyone can view board actions" ON board_actions FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'board_actions' AND policyname = 'Admins can manage board actions') THEN
    CREATE POLICY "Admins can manage board actions" ON board_actions FOR ALL
      USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
      WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

-- ── Board Action Roll Calls ─────────────────────────────────
CREATE TABLE IF NOT EXISTS board_action_rolls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id UUID NOT NULL REFERENCES board_actions(id) ON DELETE CASCADE,
  official_id UUID NOT NULL REFERENCES civic_officials(id) ON DELETE CASCADE,
  position TEXT NOT NULL CHECK (position IN ('aye', 'nay', 'abstain', 'absent', 'na')),
  notes TEXT,
  UNIQUE(action_id, official_id)
);

CREATE INDEX IF NOT EXISTS idx_board_rolls_action ON board_action_rolls(action_id);
CREATE INDEX IF NOT EXISTS idx_board_rolls_official ON board_action_rolls(official_id);

ALTER TABLE board_action_rolls ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'board_action_rolls' AND policyname = 'Anyone can view board action rolls') THEN
    CREATE POLICY "Anyone can view board action rolls" ON board_action_rolls FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'board_action_rolls' AND policyname = 'Admins can manage board action rolls') THEN
    CREATE POLICY "Admins can manage board action rolls" ON board_action_rolls FOR ALL
      USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
      WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

-- ── Manager / Superintendent Actions ────────────────────────
CREATE TABLE IF NOT EXISTS manager_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  official_id UUID NOT NULL REFERENCES civic_officials(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  action_type TEXT NOT NULL CHECK (action_type IN (
    'policy_implementation', 'corrective_action', 'hiring_appointment',
    'agenda_control', 'financial_disclosure', 'records_transparency',
    'audit_oversight', 'operational', 'other'
  )),
  category TEXT,
  action_date TEXT NOT NULL,
  impact_level TEXT NOT NULL DEFAULT 'medium' CHECK (impact_level IN ('low', 'medium', 'high')),
  outcome TEXT,
  accountability_notes TEXT,
  source_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_manager_actions_official ON manager_actions(official_id);

ALTER TABLE manager_actions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'manager_actions' AND policyname = 'Anyone can view manager actions') THEN
    CREATE POLICY "Anyone can view manager actions" ON manager_actions FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'manager_actions' AND policyname = 'Admins can manage manager actions') THEN
    CREATE POLICY "Admins can manage manager actions" ON manager_actions FOR ALL
      USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
      WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

-- ── Accountability Vectors ──────────────────────────────────
CREATE TABLE IF NOT EXISTS accountability_vectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  watch_for TEXT[] DEFAULT '{}',
  applies_to TEXT[] NOT NULL DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE accountability_vectors ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'accountability_vectors' AND policyname = 'Anyone can view accountability vectors') THEN
    CREATE POLICY "Anyone can view accountability vectors" ON accountability_vectors FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'accountability_vectors' AND policyname = 'Admins can manage accountability vectors') THEN
    CREATE POLICY "Admins can manage accountability vectors" ON accountability_vectors FOR ALL
      USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
      WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

-- ── Trustee Area to Schools Mapping ─────────────────────────
CREATE TABLE IF NOT EXISTS trustee_area_schools (
  trustee_area TEXT NOT NULL CHECK (trustee_area IN ('A','B','C','D','E','F','G')),
  school_name TEXT NOT NULL,
  school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
  PRIMARY KEY (trustee_area, school_name)
);

ALTER TABLE trustee_area_schools ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'trustee_area_schools' AND policyname = 'Anyone can view trustee area schools') THEN
    CREATE POLICY "Anyone can view trustee area schools" ON trustee_area_schools FOR SELECT USING (true);
  END IF;
END $$;

-- ── ZIP to Trustee Area Mapping (many-to-many) ──────────────
CREATE TABLE IF NOT EXISTS zip_to_trustee_area (
  zip TEXT NOT NULL,
  trustee_area TEXT NOT NULL CHECK (trustee_area IN ('A','B','C','D','E','F','G')),
  is_primary BOOLEAN DEFAULT false,
  PRIMARY KEY (zip, trustee_area)
);

ALTER TABLE zip_to_trustee_area ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'zip_to_trustee_area' AND policyname = 'Anyone can view zip trustee mapping') THEN
    CREATE POLICY "Anyone can view zip trustee mapping" ON zip_to_trustee_area FOR SELECT USING (true);
  END IF;
END $$;

-- ── ZIP to Trustee Seed Data ────────────────────────────────
INSERT INTO zip_to_trustee_area (zip, trustee_area, is_primary) VALUES
  ('90220', 'A', true),
  ('90220', 'G', false),
  ('90221', 'C', true),
  ('90221', 'D', true),
  ('90221', 'B', false),
  ('90222', 'E', true),
  ('90222', 'F', true),
  ('90222', 'G', false),
  ('90223', 'A', false),
  ('90223', 'E', false),
  ('90224', 'A', true),
  ('90059', 'B', true),
  ('90061', 'E', false),
  ('90061', 'F', false),
  ('90262', 'G', false)
ON CONFLICT DO NOTHING;
