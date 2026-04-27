"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import PushPermission from "@/components/notifications/PushPermission";

const CHANNELS = [
  { key: "follows", label: "New followers", desc: "When someone starts following you." },
  { key: "dms", label: "Direct messages", desc: "Inbox messages from creators or organizers." },
  { key: "events", label: "Event reminders", desc: "RSVPed events, day-of reminders." },
  { key: "broadcasts", label: "Broadcasts", desc: "City-wide updates from Hub City ops." },
  { key: "ticket", label: "Tickets & orders", desc: "Confirmation, status changes, refunds." },
] as const;

type ChannelKey = (typeof CHANNELS)[number]["key"];
type Prefs = Record<`${ChannelKey}_${"push" | "email"}`, boolean>;

const DEFAULT_PREFS: Prefs = {
  follows_push: true,
  dms_push: true,
  events_push: true,
  broadcasts_push: true,
  ticket_push: true,
  follows_email: false,
  dms_email: true,
  events_email: false,
  broadcasts_email: true,
  ticket_email: true,
};

/**
 * /dashboard/settings/notifications — per-channel push + email toggles
 * backed by `notification_preferences` (migration 111). Honored by
 * dispatchPush in /lib/web-push.ts and by every email template that
 * checks the email-* flag.
 */
export default function NotificationSettingsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        const next: Prefs = { ...DEFAULT_PREFS };
        for (const k of Object.keys(next) as (keyof Prefs)[]) {
          if (typeof data[k] === "boolean") next[k] = data[k] as boolean;
        }
        setPrefs(next);
      }
      setLoading(false);
    })();
  }, [supabase]);

  async function persist(next: Prefs) {
    setSaving(true);
    setError("");
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { error: upErr } = await supabase
        .from("notification_preferences")
        .upsert(
          { user_id: user.id, ...next, updated_at: new Date().toISOString() },
          { onConflict: "user_id" },
        );
      if (upErr) {
        setError(upErr.message);
      }
    } finally {
      setSaving(false);
    }
  }

  function setKey(k: keyof Prefs, v: boolean) {
    const next = { ...prefs, [k]: v };
    setPrefs(next);
    persist(next);
  }

  if (loading) {
    return (
      <div className="px-5 py-10 text-center">
        <p className="c-kicker" style={{ color: "var(--ink-mute)" }}>
          LOADING…
        </p>
      </div>
    );
  }

  return (
    <div className="px-5 pb-12 pt-6 mx-auto max-w-2xl">
      <div className="mb-5">
        <Link
          href="/dashboard/settings"
          className="c-kicker"
          style={{ color: "var(--ink-mute)" }}
        >
          ← SETTINGS
        </Link>
        <h1
          className="c-hero mt-2"
          style={{ fontSize: 32, color: "var(--ink-strong)" }}
        >
          Notifications
        </h1>
      </div>

      <PushPermission />

      {error && (
        <div
          className="mb-4 px-4 py-3 rounded-lg"
          style={{
            background: "rgba(232,72,85,0.08)",
            color: "var(--red-c, #E84855)",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          background: "var(--paper)",
          border: "2px solid var(--rule-strong-c)",
        }}
      >
        <div className="p-3 flex items-center justify-between">
          <div className="flex-1" />
          <div
            className="grid grid-cols-2 gap-4 c-kicker"
            style={{ color: "var(--ink-mute)", fontSize: 11, width: 160 }}
          >
            <span className="text-center">PUSH</span>
            <span className="text-center">EMAIL</span>
          </div>
        </div>
        {CHANNELS.map((c) => (
          <div
            key={c.key}
            className="p-3 flex items-center"
            style={{ borderTop: "1px solid var(--rule-c)" }}
          >
            <div className="flex-1 min-w-0 pr-3">
              <p
                className="c-card-t"
                style={{ fontSize: 14, color: "var(--ink-strong)" }}
              >
                {c.label}
              </p>
              <p
                className="c-serif-it"
                style={{ fontSize: 12, color: "var(--ink-mute)" }}
              >
                {c.desc}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4" style={{ width: 160 }}>
              <input
                type="checkbox"
                checked={prefs[`${c.key}_push` as keyof Prefs]}
                onChange={(e) =>
                  setKey(`${c.key}_push` as keyof Prefs, e.target.checked)
                }
                disabled={saving}
                className="w-5 h-5 mx-auto"
              />
              <input
                type="checkbox"
                checked={prefs[`${c.key}_email` as keyof Prefs]}
                onChange={(e) =>
                  setKey(`${c.key}_email` as keyof Prefs, e.target.checked)
                }
                disabled={saving}
                className="w-5 h-5 mx-auto"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
