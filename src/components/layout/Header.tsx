"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import SearchModal from "@/components/search/SearchModal";
import CitySelector from "@/components/CitySelector";
import Wordmark from "@/components/layout/Wordmark";

/* ── Section title mappings — magazine-section names, not functional labels ── */
const pageTitles: Record<string, string> = {
  "/pulse": "Feed",
  "/live": "On Air",
  "/business": "Commerce",
  "/events": "Events",
  "/resources": "Community",
  "/profile": "Profile",
  "/notifications": "Notifications",
  "/messages": "Inbox",
  "/food": "Eat",
  // "/city-hall": "City Hall",   // hidden — civic nav
  "/health": "Health",
  // "/schools": "Schools",       // hidden — civic nav
  "/culture": "Heritage",
  // "/parks": "Parks",           // hidden — civic nav
  "/jobs": "Work",
  "/people": "Explore",
  "/creators": "Discover",
  // "/district": "District",     // hidden — civic feature flag
  // "/city-data": "City Data",   // hidden — civic nav
  "/groups": "Community",
  "/dashboard": "Dashboard",
  "/admin": "Admin",
  "/settings": "Settings",
  "/moments": "Moments",
  "/reels": "Moments",
  "/map": "Atlas",
  "/podcasts": "Listen",
};

export default function Header() {
  const pathname = usePathname();
  const [notificationCount, setNotificationCount] = useState(0);
  const [hidden, setHidden] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const lastScrollY = useRef(0);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    lastScrollY.current = window.scrollY;
    setScrolled(window.scrollY > 12);

    function onScroll() {
      const currentY = window.scrollY;
      const delta = currentY - lastScrollY.current;

      setScrolled(currentY > 12);

      if (delta > 8 && currentY > 120) {
        if (!hideTimer.current) {
          hideTimer.current = setTimeout(() => {
            setHidden(true);
            hideTimer.current = null;
          }, 80);
        }
      } else if (delta < -4) {
        if (hideTimer.current) {
          clearTimeout(hideTimer.current);
          hideTimer.current = null;
        }
        setHidden(false);
      }

      lastScrollY.current = currentY;
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  useEffect(() => {
    const supabase = createClient();
    async function fetchUnreadCount() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setSignedIn(!!user);
      if (!user) {
        setNotificationCount(0);
        setUnreadMessages(0);
        return;
      }
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
      setNotificationCount(count ?? 0);

      // Count conversations with new messages since my last_read_at.
      // Simple approximation: conversations where last_message_at > my last_read_at.
      const { data: parts } = await supabase
        .from("conversation_participants")
        .select(
          "conversation_id, last_read_at, conversation:conversations(last_message_at)",
        )
        .eq("user_id", user.id);
      let unread = 0;
      type PartRow = {
        last_read_at: string | null;
        conversation: { last_message_at: string | null } | null;
      };
      for (const p of (parts as unknown as PartRow[]) ?? []) {
        const last = p.conversation?.last_message_at;
        if (!last) continue;
        if (!p.last_read_at || new Date(last) > new Date(p.last_read_at)) unread += 1;
      }
      setUnreadMessages(unread);
    }
    fetchUnreadCount();
  }, [pathname]);

  const getTitle = (): string | null => {
    if (pathname === "/") return null;
    for (const [route, title] of Object.entries(pageTitles)) {
      if (pathname.startsWith(route)) return title;
    }
    return null;
  };

  const title = getTitle();

  return (
    <>
      <header
        className={`fixed top-0 left-1/2 -translate-x-1/2 max-w-[430px] w-full z-[100] transition-transform duration-300 ease-out ${
          hidden ? "-translate-y-full" : "translate-y-0"
        }`}
      >
        {/* Ink fade background */}
        <div className="absolute inset-0 bg-gradient-to-b from-ink via-ink/95 to-transparent" />
        <div
          className="absolute inset-0 backdrop-blur-xl"
          style={{
            maskImage: "linear-gradient(to bottom, black 60%, transparent)",
            WebkitMaskImage: "linear-gradient(to bottom, black 60%, transparent)",
          }}
        />

        <div className="relative px-5 py-3 flex items-center justify-between">
          {/* Wordmark / Section title */}
          {title ? (
            <div className="flex items-center gap-3 min-w-0">
              <Link
                href="/"
                aria-label="Culture home"
                className="shrink-0 press"
              >
                <Wordmark variant="compact" size={26} />
              </Link>
              <div className="flex flex-col min-w-0">
                <h1 className="font-display text-[17px] leading-none tracking-tight text-white truncate">
                  {title}
                </h1>
                <CitySelector />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/"
                aria-label="Culture home"
                className="flex items-center press"
              >
                <Wordmark variant="full" size={26} />
              </Link>
              <CitySelector />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              className="w-[38px] h-[38px] rounded-full bg-white/[0.04] border border-white/[0.08] text-ivory/70 flex items-center justify-center press hover:text-white hover:border-gold/30 transition-all"
            >
              <svg
                width="17"
                height="17"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              >
                <circle cx="7.5" cy="7.5" r="5" />
                <path d="M11.5 11.5l3.5 3.5" />
              </svg>
            </button>

            {signedIn && (
              <Link
                href="/messages"
                aria-label="Messages"
                className="w-[38px] h-[38px] rounded-full bg-white/[0.04] border border-white/[0.08] text-ivory/70 flex items-center justify-center press relative hover:text-white hover:border-gold/30 transition-all"
              >
                <svg
                  width="17"
                  height="17"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M16 13a2 2 0 0 1-2 2H5l-3 3V3a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v10z" />
                </svg>
                {unreadMessages > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] bg-gold rounded-full border-2 border-ink flex items-center justify-center text-[8px] font-bold text-midnight">
                    {unreadMessages > 9 ? "9+" : unreadMessages}
                  </span>
                )}
              </Link>
            )}

            <Link
              href="/notifications"
              aria-label="Notifications"
              className="w-[38px] h-[38px] rounded-full bg-white/[0.04] border border-white/[0.08] text-ivory/70 flex items-center justify-center press relative hover:text-white hover:border-gold/30 transition-all"
            >
              <svg
                width="17"
                height="17"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              >
                <path d="M8.5 2a5 5 0 0 0-5 5v3l-1.5 2h13L13.5 10V7a5 5 0 0 0-5-5z" />
                <path d="M6.5 15a2 2 0 0 0 4 0" />
              </svg>
              {notificationCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-coral rounded-full border-2 border-ink flex items-center justify-center text-[9px] font-bold text-white">
                  {notificationCount > 9 ? "9+" : notificationCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Gold hairline when scrolled — editorial masthead rule */}
        <div
          className={`absolute inset-x-5 bottom-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent transition-opacity duration-300 ${
            scrolled ? "opacity-100" : "opacity-0"
          }`}
        />
      </header>

      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
