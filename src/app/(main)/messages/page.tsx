import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Masthead, SectionKicker } from "@/components/ui/editorial";

export const metadata: Metadata = {
  title: "Inbox | Culture",
  description: "Your direct messages with creators and community members.",
};

type Participant = {
  user_id: string;
  last_read_at: string | null;
  profile: {
    id: string;
    display_name: string | null;
    handle: string | null;
    avatar_url: string | null;
    role: string | null;
    verification_status: string | null;
  } | null;
};

type ConversationRow = {
  id: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  participants: Participant[] | null;
};

function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function initials(name?: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase() || "?";
}

export default async function MessagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Anon users get a soft sign-in nudge rather than a redirect — matches the
  // notifications page pattern.
  if (!user) {
    return (
      <div className="culture-surface animate-fade-in pb-24 min-h-dvh">
        <Masthead
          volume="VOL · 01"
          headline="INBOX."
          strap="Your direct messages"
        />
        <div className="text-center py-16 px-5">
          <div
            className="w-16 h-16 flex items-center justify-center mx-auto mb-4"
            style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)" }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--ink-strong)" }}>
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>
          <p
            className="c-serif-it mb-1"
            style={{ fontSize: 14, color: "var(--ink-strong)" }}
          >
            Sign in to see your messages
          </p>
          <p
            className="c-kicker mb-4"
            style={{ fontSize: 10, color: "var(--ink-strong)", opacity: 0.6, letterSpacing: "0.14em" }}
          >
            CHAT WITH CREATORS, COMMUNITY MEMBERS, AND INDEPENDENTS
          </p>
          <Link
            href="/login?next=/messages"
            className="inline-block c-btn c-btn-primary press"
          >
            SIGN IN
          </Link>
        </div>
      </div>
    );
  }

  // Pull the same shape the GET /api/conversations route produces, but server-
  // side so we can render a fully-hydrated list on first paint.
  const { data: convs } = await supabase
    .from("conversations")
    .select(
      "id, last_message_at, last_message_preview, participants:conversation_participants(user_id, last_read_at, profile:profiles(id, display_name, handle, avatar_url, role, verification_status))",
    )
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .limit(50);

  const rows = ((convs as ConversationRow[] | null) ?? []).map((c) => {
    const parts = c.participants ?? [];
    const me = parts.find((p) => p.user_id === user.id);
    const other = parts.find((p) => p.user_id !== user.id);
    const unread =
      !!c.last_message_at &&
      (!me?.last_read_at ||
        new Date(c.last_message_at).getTime() > new Date(me.last_read_at).getTime());
    return {
      id: c.id,
      last_message_at: c.last_message_at,
      last_message_preview: c.last_message_preview,
      unread,
      other: other?.profile ?? null,
    };
  });

  return (
    <div className="culture-surface animate-fade-in pb-24 min-h-dvh">
      <Masthead
        volume="VOL · 01"
        headline="INBOX."
        strap={`${rows.length} thread${rows.length === 1 ? "" : "s"}`}
      />

      {rows.length === 0 ? (
        <div className="text-center py-16 px-5">
          <div
            className="w-16 h-16 flex items-center justify-center mx-auto mb-4"
            style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)" }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--ink-strong)" }}>
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>
          <p
            className="c-serif-it mb-1"
            style={{ fontSize: 14, color: "var(--ink-strong)" }}
          >
            No messages yet
          </p>
          <p
            className="c-kicker"
            style={{ fontSize: 10, color: "var(--ink-strong)", opacity: 0.55, letterSpacing: "0.14em" }}
          >
            START A CHAT FROM ANY CREATOR&apos;S PROFILE
          </p>
        </div>
      ) : (
        <div className="pt-4 stagger">
          {rows.map((row, i) => {
            const name = row.other?.display_name || row.other?.handle || "Unknown";
            const handle = row.other?.handle ? `@${row.other.handle}` : null;
            const href = `/messages/${row.id}`;
            return (
              <Link
                key={row.id}
                href={href}
                className="group block press"
                style={{
                  borderTop: i === 0 ? "2px solid var(--rule-strong-c)" : undefined,
                  borderBottom: "2px solid var(--rule-strong-c)",
                  background: row.unread ? "var(--paper-warm)" : "transparent",
                  padding: "14px 16px",
                }}
              >
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div
                      className="w-12 h-12 overflow-hidden flex items-center justify-center"
                      style={{
                        background: "var(--gold-c)",
                        border: "2px solid var(--rule-strong-c)",
                      }}
                    >
                      {row.other?.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={row.other.avatar_url}
                          alt={name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span
                          className="c-card-t"
                          style={{ fontSize: 13, color: "var(--ink-strong)" }}
                        >
                          {initials(name)}
                        </span>
                      )}
                    </div>
                    {row.unread && (
                      <span
                        className="absolute -top-0.5 -right-0.5"
                        style={{
                          width: 10,
                          height: 10,
                          background: "var(--gold-c)",
                          border: "2px solid var(--rule-strong-c)",
                        }}
                      />
                    )}
                  </div>

                  {/* Name + preview */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <h3
                        className="c-card-t truncate"
                        style={{ fontSize: 15, color: "var(--ink-strong)", lineHeight: 1.15 }}
                      >
                        {name}
                      </h3>
                      {handle && (
                        <span
                          className="truncate c-kicker"
                          style={{ fontSize: 10, color: "var(--ink-strong)", opacity: 0.5, letterSpacing: "0.08em" }}
                        >
                          {handle}
                        </span>
                      )}
                    </div>
                    <p
                      className="c-body truncate"
                      style={{
                        fontSize: 13,
                        color: "var(--ink-strong)",
                        opacity: row.unread ? 1 : 0.6,
                        fontWeight: row.unread ? 600 : 400,
                      }}
                    >
                      {row.last_message_preview || (
                        <span
                          className="c-serif-it"
                          style={{ opacity: 0.45 }}
                        >
                          No messages yet
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Timestamp */}
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    <SectionKicker tone={row.unread ? "gold" : "muted"}>
                      <span className="tabular-nums">{timeAgo(row.last_message_at)}</span>
                    </SectionKicker>
                    {row.unread && (
                      <span
                        style={{ width: 6, height: 6, background: "var(--gold-c)" }}
                      />
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
