"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

/**
 * Follow + Message action pair shown on /user/[handle] — Culture blockprint.
 * Primary button = ink bg / gold text (c-btn-primary). Secondary = bordered
 * outline (c-btn-outline).
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
  primaryCta?: { label: string; href: string };
}) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, startTransition] = useTransition();
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const primaryBase: React.CSSProperties = {
    background: "var(--ink-strong)",
    color: "var(--gold-c)",
    padding: "13px 0",
    textAlign: "center",
    flex: 1,
  };
  const outlineBase: React.CSSProperties = {
    border: "2px solid var(--ink-strong)",
    color: "var(--ink-strong)",
    background: "var(--paper)",
    padding: "11px 0",
    textAlign: "center",
    flex: 1,
  };
  const btnClass =
    "c-ui press transition-colors disabled:opacity-60";

  if (isOwner) {
    return (
      <div className="flex items-center gap-[10px]">
        <a href="/profile/edit" className={btnClass} style={primaryBase}>
          EDIT PROFILE
        </a>
        <a href="/messages" className={btnClass} style={outlineBase}>
          INBOX
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
    setFollowing(next);
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

  // Follow button surface — primary ink when not following AND no external
  // primary CTA; otherwise outline so the hierarchy reads correctly.
  const followStyle: React.CSSProperties = following
    ? outlineBase
    : primaryCta
      ? outlineBase
      : primaryBase;

  return (
    <div className="space-y-[10px]">
      {primaryCta && (
        <a href={primaryCta.href} className={btnClass} style={primaryBase}>
          {primaryCta.label.toUpperCase()}
        </a>
      )}
      <div className="flex items-center gap-[10px]">
        <button
          type="button"
          disabled={pending}
          onClick={toggleFollow}
          className={btnClass}
          style={followStyle}
        >
          {following ? "FOLLOWING" : "FOLLOW"}
        </button>
        <button
          type="button"
          disabled={opening}
          onClick={openDM}
          className={btnClass}
          style={outlineBase}
        >
          {opening ? "OPENING…" : "MESSAGE"}
        </button>
      </div>
      {error && (
        <p
          className="c-kicker"
          style={{ color: "var(--red-c)", fontSize: 10 }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
