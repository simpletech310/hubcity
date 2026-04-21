import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DMThread from "@/components/messages/DMThread";

export const metadata: Metadata = {
  title: "Chat | Culture",
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

type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string | null;
  gif_url: string | null;
  image_url: string | null;
  created_at: string;
  read_at: string | null;
};

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/messages/${conversationId}`);
  }

  // Confirm the viewer is a participant (RLS will have already hidden this row
  // if not, but we check explicitly so 404 is deliberate rather than accidental).
  const { data: conv } = await supabase
    .from("conversations")
    .select(
      "id, participants:conversation_participants(user_id, last_read_at, profile:profiles(id, display_name, handle, avatar_url, role, verification_status))",
    )
    .eq("id", conversationId)
    .maybeSingle();

  if (!conv) notFound();

  const parts = (conv.participants as unknown as Participant[]) ?? [];
  const me = parts.find((p) => p.user_id === user.id);
  const other = parts.find((p) => p.user_id !== user.id);
  if (!me) notFound();

  // Load initial message page. Newest first from DB, reversed into chronological
  // order for chat-bottom alignment.
  const { data: msgRows } = await supabase
    .from("messages")
    .select(
      "id, conversation_id, sender_id, body, gif_url, image_url, created_at, read_at",
    )
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(50);

  const initialMessages = ((msgRows as MessageRow[] | null) ?? []).slice().reverse();

  const otherName = other?.profile?.display_name || other?.profile?.handle || "Unknown";
  const otherHandle = other?.profile?.handle ? `@${other.profile.handle}` : null;

  return (
    <div className="animate-fade-in flex flex-col min-h-[100dvh]">
      {/* Thread header — compact, sits under the global fixed Header */}
      <div className="px-5 pt-4 pb-3 border-b border-white/[0.08] flex items-center gap-3 sticky top-0 z-10 bg-ink/95 backdrop-blur">
        <Link
          href="/messages"
          aria-label="Back to inbox"
          className="w-9 h-9 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center press hover:border-gold/30 transition-colors text-ivory/80"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 3L5 8l5 5" />
          </svg>
        </Link>
        <Link
          href={other?.profile?.handle ? `/user/${other.profile.handle}` : "#"}
          className="flex items-center gap-3 min-w-0 flex-1 press"
        >
          <div className="w-10 h-10 rounded-full overflow-hidden bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0">
            {other?.profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={other.profile.avatar_url}
                alt={otherName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-[11px] font-bold text-ivory/80">
                {otherName.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <h2
              className="font-display text-[18px] leading-tight text-white truncate"
              style={{ fontFamily: 'var(--font-dm-serif), "DM Serif Display", serif' }}
            >
              {otherName}
            </h2>
            {otherHandle && (
              <p className="text-[11px] text-ivory/40 truncate">{otherHandle}</p>
            )}
          </div>
        </Link>
      </div>

      <DMThread
        conversationId={conversationId}
        currentUserId={user.id}
        otherAvatarUrl={other?.profile?.avatar_url ?? null}
        otherName={otherName}
        initialMessages={initialMessages}
      />
    </div>
  );
}
