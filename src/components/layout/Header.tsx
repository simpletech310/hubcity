"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import SearchModal from "@/components/search/SearchModal";
import CityPicker from "@/components/city/CityPicker";

/* ── Page title mappings ── */
const pageTitles: Record<string, string> = {
  "/pulse": "City Pulse",
  "/live": "Live",
  "/business": "Business",
  "/events": "Events",
  "/resources": "Resources",
  "/profile": "Profile",
  "/notifications": "Notifications",
  "/food": "Food & Dining",
  "/city-hall": "City Hall",
  "/health": "Health",
  "/schools": "Schools",
  "/culture": "Culture",
  "/parks": "Parks",

  "/jobs": "Jobs",
  "/district": "District",
  "/city-data": "City Data",
  "/groups": "Groups",
  "/dashboard": "Dashboard",
  "/admin": "Admin",
  "/settings": "Settings",
};

export default function Header() {
  const pathname = usePathname();
  const [notificationCount, setNotificationCount] = useState(0);
  const [hidden, setHidden] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const lastScrollY = useRef(0);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Scroll-aware hide/show with higher threshold and debounce
  useEffect(() => {
    lastScrollY.current = window.scrollY;

    function onScroll() {
      const currentY = window.scrollY;
      const delta = currentY - lastScrollY.current;

      // Only hide when scrolling down past 120px with meaningful movement
      if (delta > 8 && currentY > 120) {
        if (!hideTimer.current) {
          hideTimer.current = setTimeout(() => {
            setHidden(true);
            hideTimer.current = null;
          }, 80);
        }
      } else if (delta < -4) {
        // Show immediately on scroll up
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

  // Fetch unread notification count
  useEffect(() => {
    const supabase = createClient();

    async function fetchUnreadCount() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setNotificationCount(0);
        return;
      }

      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      setNotificationCount(count ?? 0);
    }

    fetchUnreadCount();
  }, [pathname]);

  // Dynamic page title
  const getTitle = (): string | null => {
    if (pathname === "/") return null; // Home shows logo
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
        {/* Gradient fade background */}
        <div className="absolute inset-0 bg-gradient-to-b from-midnight via-midnight/95 to-transparent" />
        <div
          className="absolute inset-0 backdrop-blur-xl"
          style={{
            maskImage: "linear-gradient(to bottom, black 60%, transparent)",
            WebkitMaskImage: "linear-gradient(to bottom, black 60%, transparent)",
          }}
        />

        <div className="relative px-5 py-3 flex items-center justify-between">
          {/* Logo / Page Title */}
          {title ? (
            <div className="flex items-center gap-3 min-w-0">
              <Link
                href="/"
                aria-label="Home"
                className="w-8 h-8 bg-gradient-to-br from-gold to-gold-light rounded-lg flex items-center justify-center font-heading font-extrabold text-[13px] text-midnight press shrink-0"
              >
                K
              </Link>
              <div className="flex flex-col min-w-0">
                <h1 className="font-heading font-bold text-lg tracking-tight leading-tight truncate">{title}</h1>
                <CityPicker variant="header" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link
                href="/"
                aria-label="Knect Home"
                className="flex items-center gap-2.5 press"
              >
                <div className="w-9 h-9 bg-gradient-to-br from-gold to-gold-light rounded-[10px] flex items-center justify-center font-heading font-extrabold text-[15px] text-midnight shadow-lg shadow-gold/20">
                  K
                </div>
                <span className="font-heading font-bold text-lg tracking-tight leading-none">
                  K<span className="text-gold">nect</span>
                </span>
              </Link>
              <CityPicker variant="header" />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {/* Search */}
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              className="w-[38px] h-[38px] rounded-full bg-white/[0.06] border border-border-subtle text-txt-secondary flex items-center justify-center press hover:text-white hover:bg-white/[0.1] transition-all"
            >
              <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="7.5" cy="7.5" r="5" />
                <path d="M11.5 11.5l3.5 3.5" />
              </svg>
            </button>

            {/* Notifications */}
            <Link
              href="/notifications"
              aria-label="Notifications"
              className="w-[38px] h-[38px] rounded-full bg-white/[0.06] border border-border-subtle text-txt-secondary flex items-center justify-center press relative hover:text-white hover:bg-white/[0.1] transition-all"
            >
              <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M8.5 2a5 5 0 0 0-5 5v3l-1.5 2h13L13.5 10V7a5 5 0 0 0-5-5z" />
                <path d="M6.5 15a2 2 0 0 0 4 0" />
              </svg>
              {notificationCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-coral rounded-full border-2 border-midnight flex items-center justify-center text-[9px] font-bold text-white">
                  {notificationCount > 9 ? "9+" : notificationCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
