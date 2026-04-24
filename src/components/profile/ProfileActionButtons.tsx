"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

/**
 * Follow + Message action pair shown on /user/[handle]. Two buttons:
 *
 *  - Follow / Following — POST or DELETE /api/follows. Optimistic toggle so
 *    the count flickers immediately. The page's follower-count number is
 *    server-rendered, so we kick a `router.refresh()` after success to pick
 *    up the trigger-bumped value without a full reload.
 *
 *  - Message — POST /api/conversations to find-or-create a 1:1 thread, then
 *    push to /messages/[id].
 *
 * If the visitor isn't signed in, both buttons send them to /login first.
 */
export default function ProfileActionButtons({
  targetUserId,
  isSignedIn,
  isOwner,
  initialFollowing,
  primaryCta,
}: {
  targetUserId: string;
  isSignedIn: boolean;
  isOwner: boolean;
  initialFollowing: boolean;
  /**
   * Optional role-driven primary CTA rendered ABOVE the Follow/Message row.
   * Used by the profile hero to surface "View Business" / "See Resources"
   * deep links for business and resource-provider profiles. Follow + Message
   * still render below as secondary actions.
   */
  primaryCta?: { label: string; href: string };
}) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, startTransition] = useTransition();
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isOwner) {
    return (
      <div className="mt-4 flex items-center gap-3">
        <a
          href="/profile/edit"
          className="flex-1 py-2.5 rounded-xl bg-transparent border border-gold/40 text-gold font-semibold text-sm press hover:bg-gold/10 transition-colors text-center"
        >
          Edit profile
        </a>
        <a
          href="/messages"
          className="flex-1 py-2.5 rounded-xl bg-gold text-midnight font-bold text-sm press hover:bg-gold-light transition-colors text-center"
        >
          Inbox
        </a>
      </div>
    );
  }

  function requireSignIn(then: string) {
    router.push(`/login?next=${encodeURIComponent(then)}`);
  }

  function toggleFollow() {
    if (!isSignedIn) return requireSignIn(window.location.pathname);
    setError(null);
    const next = !following;
    setFollowing(next); // optimistic
    startTransition(async () => {
      const res = await fetch("/api/follows", {
        method: next ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followed_id: targetUserId }),
      });
      if (!res.ok) {
        setFollowing(!next);
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Couldn't update follow.");
        return;
      }
      router.refresh();
    });
  }

  async function openDM() {
    if (!isSignedIn) return requireSignIn(window.location.pathname);
    setError(null);
    setOpening(true);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ other_user_id: targetUserId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't open chat.");
      router.push(`/messages/${data.conversation_id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Couldn't open chat.");
      setOpening(false);
    }
  }

  return (
    <div className="mt-4 space-y-2.5">
      {primaryCta && (
        <a
          href={primaryCta.href}
          className="block w-full py-2.5 rounded-xl text-center text-sm font-bold bg-gold text-midnight hover:bg-gold-light transition-colors press"
        >
          {primaryCta.label}
        </a>
      )}
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={toggleFollow}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold press transition-colors disabled:opacity-60 ${
            following
              ? "bg-transparent border border-gold/40 text-gold hover:bg-gold/10"
              : primaryCta
                ? "bg-white/[0.04] border border-gold/30 text-gold hover:bg-gold/10"
                : "bg-gold text-midnight hover:bg-gold-light"
          }`}
        >
          {following ? "Following" : "Follow"}
        </button>
        <button
          type="button"
          disabled={opening}
          onClick={openDM}
          className="flex-1 py-2.5 rounded-xl bg-transparent border border-gold/40 text-gold font-semibold text-sm press hover:bg-gold/10 transition-colors disabled:opacity-60"
        >
          {opening ? "Opening…" : "Message"}
        </button>
      </div>
      {error && <p className="text-[11px] text-coral">{error}</p>}
    </div>
  );
}
