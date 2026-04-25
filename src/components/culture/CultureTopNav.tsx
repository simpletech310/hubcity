"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SearchModal from "@/components/search/SearchModal";
import { createClient } from "@/lib/supabase/client";
import { useActiveCity } from "@/hooks/useActiveCity";

/**
 * CultureTopNav — slim sticky paper strip that sits above every (main)
 * page. Left: HC mark + dynamic city kicker (HUB CITY · COMPTON /
 * INGLEWOOD etc). Right: Search / Messages / Notifications icon buttons
 * with gold unread dots.
 *
 * Design language: paper bg, 2px ink bottom rule, square ink-bordered
 * icon buttons (32×32). No rounded corners, no glass. Hover → gold
 * border. Uses `sticky` (not `fixed`) so per-page Culture mastheads
 * can scroll underneath naturally.
 */
export default function CultureTopNav() {
  const pathname = usePathname() ?? "/";
  const activeCity = useActiveCity();
  const [searchOpen, setSearchOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Unread counters — lifted from the retired src/components/layout/Header.tsx.
  // Re-runs on pathname change so counts refresh when the user reads a thread.
  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function fetchCounts() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      setSignedIn(!!user);
      if (!user) {
        setUnreadMessages(0);
        setUnreadNotifications(0);
        return;
      }

      const { count: notifCount } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
      if (!cancelled) setUnreadNotifications(notifCount ?? 0);

      // Conversations with last_message_at later than my last_read_at.
      const { data: parts } = await supabase
        .from("conversation_participants")
        .select(
          "conversation_id, last_read_at, conversation:conversations(last_message_at)",
        )
        .eq("user_id", user.id);
      type PartRow = {
        last_read_at: string | null;
        conversation: { last_message_at: string | null } | null;
      };
      let unread = 0;
      for (const p of (parts as unknown as PartRow[]) ?? []) {
        const last = p.conversation?.last_message_at;
        if (!last) continue;
        if (!p.last_read_at || new Date(last) > new Date(p.last_read_at))
          unread += 1;
      }
      if (!cancelled) setUnreadMessages(unread);
    }

    fetchCounts();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  // Dynamic city kicker — mirrors the wordmark logic on the home page.
  // On `/` we skip the kicker text because the home masthead already
  // displays the wordmark below at large scale.
  const onHome = pathname === "/";
  const cityLabel = (() => {
    if (!activeCity) return "HUB CITY";
    const slug = (activeCity.slug ?? "").toLowerCase();
    if (slug === "compton") return "HUB CITY · COMPTON";
    return `HUB CITY · ${(activeCity.name ?? "").toUpperCase()}`;
  })();

  return (
    <>
      <header
        className="sticky top-0 z-50 flex items-center justify-between px-[14px]"
        style={{
          background: "var(--rule-strong-c)",
          borderBottom: "3px solid var(--gold-c)",
          height: 52,
        }}
        aria-label="Top"
      >
        {/* Left: Culture wordmark + city kicker */}
        <Link href="/" aria-label="Hub City home" className="flex items-center gap-2.5 press">
          <span
            style={{
              fontFamily: "var(--font-anton), Anton, Impact, sans-serif",
              fontSize: 18,
              lineHeight: 1,
              letterSpacing: "-0.02em",
              color: "var(--gold-c)",
              textTransform: "uppercase",
            }}
          >
            Culture
          </span>
          {!onHome && (
            <span
              style={{
                fontFamily: "var(--font-archivo), Archivo, sans-serif",
                fontWeight: 800,
                fontSize: 9,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--paper)",
                opacity: 0.55,
                maxWidth: 190,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {cityLabel}
            </span>
          )}
        </Link>

        {/* Right: Search + Messages + Notifications */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="Search"
            className="press"
            style={iconBtnStyle}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            >
              <circle cx="8.5" cy="8.5" r="5" />
              <path d="M12.5 12.5l4 4" />
            </svg>
          </button>

          {signedIn && (
            <Link
              href="/messages"
              aria-label="Messages"
              className="press"
              style={{ ...iconBtnStyle, position: "relative" }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 4h14a1 1 0 011 1v9a1 1 0 01-1 1H7l-4 3V5a1 1 0 011-1z" />
              </svg>
              {unreadMessages > 0 && <UnreadDot />}
            </Link>
          )}

          <Link
            href="/notifications"
            aria-label="Notifications"
            className="press"
            style={{ ...iconBtnStyle, position: "relative" }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10 2a5 5 0 015 5v3l1.5 2h-13L5 10V7a5 5 0 015-5z" />
              <path d="M8 16a2 2 0 004 0" />
            </svg>
            {unreadNotifications > 0 && <UnreadDot />}
          </Link>
        </div>
      </header>

      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

const iconBtnStyle: React.CSSProperties = {
  width: 34,
  height: 34,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: "2px solid var(--gold-c)",
  background: "transparent",
  color: "var(--paper)",
};

function UnreadDot() {
  return (
    <span
      aria-hidden="true"
      style={{
        position: "absolute",
        top: -3,
        right: -3,
        width: 10,
        height: 10,
        background: "var(--gold-c)",
        border: "2px solid var(--rule-strong-c)",
        borderRadius: "50%",
      }}
    />
  );
}
