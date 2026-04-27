-- ============================================================
-- Hub City App — Web Push subscriptions + per-user preferences
-- ============================================================
-- Stores the browser PushSubscription objects sent up by /api/push/
-- subscribe and a small per-channel toggle table that /api/push/
-- dispatch consults before fanning out.
--
-- VAPID keys live in env (VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY,
-- VAPID_SUBJECT). The web-push npm package consumes them server-side.
-- ============================================================

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint    TEXT NOT NULL UNIQUE,
  keys        JSONB NOT NULL,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user
  ON push_subscriptions (user_id, created_at DESC);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "push_subscriptions_owner_select"
  ON push_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "push_subscriptions_owner_insert"
  ON push_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "push_subscriptions_owner_delete"
  ON push_subscriptions FOR DELETE
  USING (auth.uid() = user_id);

-- ── Per-user channel preferences ─────────────────────────────

CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id            UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  follows_push       BOOLEAN NOT NULL DEFAULT TRUE,
  dms_push           BOOLEAN NOT NULL DEFAULT TRUE,
  events_push        BOOLEAN NOT NULL DEFAULT TRUE,
  broadcasts_push    BOOLEAN NOT NULL DEFAULT TRUE,
  ticket_push        BOOLEAN NOT NULL DEFAULT TRUE,
  follows_email      BOOLEAN NOT NULL DEFAULT FALSE,
  dms_email          BOOLEAN NOT NULL DEFAULT TRUE,
  events_email       BOOLEAN NOT NULL DEFAULT FALSE,
  broadcasts_email   BOOLEAN NOT NULL DEFAULT TRUE,
  ticket_email       BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notification_prefs_owner_all"
  ON notification_preferences FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
