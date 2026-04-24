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
      <div className="animate-fade-in pb-24">
        <Masthead
          volume="VOL · 01"
          headline="INBOX."
          strap="Your direct messages"
        />
        <div className="text-center py-16 px-5">
          <span className="text-5xl block mb-3">{"\u{1F4AC}"}</span>
          <p className="text-sm font-medium mb-1">Sign in to see your messages</p>
          <p className="text-xs text-txt-secondary mb-4">
            Chat with creators, community members, and independents.
          </p>
          <Link
            href="/login?next=/messages"
            className="inline-block bg-gold text-midnight px-6 py-2.5 rounded-full text-sm font-bold press hover:bg-gold-light transition-colors"
          >
            Sign in
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
    <div className="animate-fade-in pb-24">
      <Masthead
        volume="VOL · 01"
        headline="INBOX."
        strap={`${rows.length} thread${rows.length === 1 ? "" : "s"}`}
      />

      {rows.length === 0 ? (
        <div className="text-center py-16 px-5">
          <span className="text-5xl block mb-3">{"\u{1F4EC}"}</span>
          <p className="text-sm font-medium mb-1">No messages yet</p>
          <p className="text-xs text-txt-secondary">
            Start a chat from any creator&apos;s profile.
          </p>
        </div>
      ) : (
        <div className="px-5 pt-5 space-y-3 stagger">
          {rows.map((row) => {
            const name = row.other?.display_name || row.other?.handle || "Unknown";
            const handle = row.other?.handle ? `@${row.other.handle}` : null;
            const href = `/messages/${row.id}`;
            return (
              <Link
                key={row.id}
                href={href}
                className="group block rounded-2xl panel-editorial p-4 press hover:border-gold/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {/* Avatar with gold ring on hover */}
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-white/[0.04] border border-white/[0.08] ring-0 ring-gold/0 group-hover:ring-2 group-hover:ring-gold/60 transition-all flex items-center justify-center">
                      {row.other?.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={row.other.avatar_url}
                          alt={name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-[13px] font-bold text-ivory/80">
                          {initials(name)}
                        </span>
                      )}
                    </div>
                    {row.unread && (
                      <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-gold border-2 border-ink" />
                    )}
                  </div>

                  {/* Name + preview */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <h3
                        className="font-display text-[17px] leading-tight text-white truncate"
                        style={{ fontFamily: 'var(--font-dm-serif), "DM Serif Display", serif' }}
                      >
                        {name}
                      </h3>
                      {handle && (
                        <span className="text-[11px] text-ivory/40 truncate">{handle}</span>
                      )}
                    </div>
                    <p
                      className={`text-[13px] truncate ${
                        row.unread ? "text-ivory" : "text-ivory/60"
                      }`}
                    >
                      {row.last_message_preview || (
                        <span className="italic text-ivory/40">No messages yet</span>
                      )}
                    </p>
                  </div>

                  {/* Timestamp */}
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    <SectionKicker tone={row.unread ? "gold" : "muted"}>
                      <span className="tabular-nums">{timeAgo(row.last_message_at)}</span>
                    </SectionKicker>
                    {row.unread && <span className="w-2 h-2 rounded-full bg-gold" />}
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
