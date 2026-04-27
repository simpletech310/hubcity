"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type CheckInResult =
  | {
      type: "success";
      ticket_code: string;
      section_name: string | null;
      event_title: string | null;
    }
  | {
      type: "already_checked_in";
      ticket_code: string;
      checked_in_at: string;
    }
  | { type: "invalid"; message: string };

type CheckInStats = {
  total_tickets: number;
  checked_in: number;
  by_section: Array<{ section_name: string; total: number; checked_in: number }>;
};

/**
 * /dashboard/events/[id]/check-in — creator-facing check-in console.
 *
 * Mirrors the admin scanner at /admin/events/[id]/check-in but routed
 * through the dashboard layout so creators (e.g. content_creator role)
 * can manage their own ticketed events. Manual ticket-code entry only;
 * the QR-camera scanner stays on the admin path. Auth is enforced
 * twice — first by checking event ownership client-side, then by the
 * /api/tickets/check-in API when the code is submitted.
 */
export default function CreatorCheckInPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params?.id as string;

  const [authChecking, setAuthChecking] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [eventTitle, setEventTitle] = useState<string>("");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [stats, setStats] = useState<CheckInStats | null>(null);

  // Confirm signed-in user owns this event before showing the form.
  useEffect(() => {
    if (!eventId) return;
    const check = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.replace("/login");
          return;
        }
        const { data: ev } = await supabase
          .from("events")
          .select("title, created_by")
          .eq("id", eventId)
          .maybeSingle();
        if (!ev) {
          router.replace("/dashboard/events");
          return;
        }
        // Allow event creator OR staff role.
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        const isStaff =
          profile?.role === "admin" ||
          profile?.role === "city_official" ||
          profile?.role === "city_ambassador";
        if (ev.created_by !== user.id && !isStaff) {
          router.replace("/dashboard/events");
          return;
        }
        setEventTitle(ev.title ?? "");
        setAuthed(true);
      } catch {
        router.replace("/login");
      } finally {
        setAuthChecking(false);
      }
    };
    check();
  }, [eventId, router]);

  const fetchStats = useCallback(async () => {
    if (!eventId || !authed) return;
    try {
      const res = await fetch(`/api/events/${eventId}/check-in-stats`);
      if (res.ok) setStats((await res.json()) as CheckInStats);
    } catch {
      /* no-op */
    }
  }, [eventId, authed]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || submitting) return;
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch("/api/tickets/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticket_code: code.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({
          type: "success",
          ticket_code: code.trim(),
          section_name: data.section_name ?? null,
          event_title: data.event_title ?? null,
        });
        setCode("");
        fetchStats();
      } else if (res.status === 409 && data.already_checked_in) {
        setResult({
          type: "already_checked_in",
          ticket_code: code.trim(),
          checked_in_at: data.checked_in_at,
        });
      } else {
        setResult({
          type: "invalid",
          message: data.error ?? "Ticket not found",
        });
      }
    } catch {
      setResult({ type: "invalid", message: "Network error — try again." });
    } finally {
      setSubmitting(false);
    }
  }

  if (authChecking) {
    return (
      <div className="px-5 py-12 text-center">
        <p className="c-kicker" style={{ color: "var(--ink-mute)" }}>
          § CHECKING ACCESS…
        </p>
      </div>
    );
  }
  if (!authed) return null;

  const total = stats?.total_tickets ?? 0;
  const checkedIn = stats?.checked_in ?? 0;
  const pct = total > 0 ? Math.round((checkedIn / total) * 100) : 0;

  return (
    <div className="px-5 pb-20 pt-6 mx-auto max-w-2xl">
      <div className="flex items-end justify-between mb-5 gap-3">
        <div>
          <p className="c-kicker" style={{ color: "var(--ink-mute)" }}>
            § CHECK-IN · {eventTitle.toUpperCase()}
          </p>
          <h1
            className="c-hero mt-1"
            style={{ fontSize: 32, color: "var(--ink-strong)" }}
          >
            {checkedIn}
            <span className="text-base" style={{ color: "var(--ink-mute)" }}>
              {" "}
              / {total} checked in
            </span>
          </h1>
        </div>
        <Link
          href="/dashboard/events"
          className="c-kicker shrink-0 px-3 py-2"
          style={{
            background: "var(--paper-warm)",
            color: "var(--ink-strong)",
            border: "2px solid var(--rule-strong-c)",
          }}
        >
          ← EVENTS
        </Link>
      </div>

      {/* Progress bar */}
      <div
        className="w-full h-3 mb-5"
        style={{
          background: "var(--paper-warm)",
          border: "2px solid var(--rule-strong-c)",
        }}
      >
        <div
          className="h-full"
          style={{ width: `${pct}%`, background: "var(--gold-c)" }}
        />
      </div>

      {/* Manual entry form */}
      <form
        onSubmit={submit}
        className="p-4 mb-5"
        style={{
          background: "var(--paper-warm)",
          border: "2px solid var(--rule-strong-c)",
        }}
      >
        <label
          className="c-kicker block mb-2"
          style={{ color: "var(--ink-mute)" }}
        >
          § TICKET CODE
        </label>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="HC-XXXX-XXXX"
          autoComplete="off"
          autoCapitalize="characters"
          className="w-full px-3 py-3 mb-3"
          style={{
            background: "var(--paper)",
            border: "2px solid var(--rule-strong-c)",
            color: "var(--ink-strong)",
            fontFamily: "var(--font-anton), Anton, Impact, sans-serif",
            fontSize: 18,
            letterSpacing: "0.08em",
          }}
        />
        <button
          type="submit"
          disabled={!code.trim() || submitting}
          className="c-kicker w-full py-3"
          style={{
            background: "var(--ink-strong)",
            color: "var(--gold-c)",
            border: "2px solid var(--rule-strong-c)",
            opacity: !code.trim() || submitting ? 0.5 : 1,
          }}
        >
          {submitting ? "CHECKING…" : "CHECK IN"}
        </button>
      </form>

      {/* Result banner */}
      {result && (
        <div
          className="p-4 mb-5"
          style={{
            background:
              result.type === "success"
                ? "var(--gold-c)"
                : result.type === "already_checked_in"
                  ? "var(--paper-warm)"
                  : "#3a1717",
            color:
              result.type === "invalid" ? "var(--paper)" : "var(--ink-strong)",
            border: "2px solid var(--rule-strong-c)",
          }}
        >
          <p className="c-kicker">
            §{" "}
            {result.type === "success"
              ? "CHECKED IN"
              : result.type === "already_checked_in"
                ? "ALREADY CHECKED IN"
                : "INVALID"}
          </p>
          <p
            className="c-card-t mt-1"
            style={{ fontSize: 18, color: "inherit" }}
          >
            {result.type === "success" && (
              <>
                {result.ticket_code}
                {result.section_name && (
                  <span
                    className="c-meta block mt-1"
                    style={{ color: "var(--ink-strong)" }}
                  >
                    {result.section_name}
                  </span>
                )}
              </>
            )}
            {result.type === "already_checked_in" && (
              <>
                {result.ticket_code} — at{" "}
                {new Date(result.checked_in_at).toLocaleTimeString()}
              </>
            )}
            {result.type === "invalid" && result.message}
          </p>
        </div>
      )}

      {/* Per-section breakdown */}
      {stats?.by_section && stats.by_section.length > 0 && (
        <div>
          <p
            className="c-kicker mb-2"
            style={{ color: "var(--ink-mute)" }}
          >
            § BY SECTION
          </p>
          <div className="space-y-2">
            {stats.by_section.map((s) => (
              <div
                key={s.section_name}
                className="flex items-center justify-between p-3"
                style={{
                  background: "var(--paper-warm)",
                  border: "2px solid var(--rule-strong-c)",
                }}
              >
                <span
                  className="c-card-t"
                  style={{ fontSize: 14, color: "var(--ink-strong)" }}
                >
                  {s.section_name}
                </span>
                <span
                  className="c-kicker"
                  style={{ color: "var(--gold-c)" }}
                >
                  {s.checked_in} / {s.total}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
