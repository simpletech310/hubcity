"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Header() {
  const pathname = usePathname();
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    const supabase = createClient();

    async function fetchUnreadCount() {
      const { data: { user } } = await supabase.auth.getUser();
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
  }, [pathname]); // Re-fetch when navigating (e.g. after reading notifications)

  // Dynamic page title
  const getTitle = () => {
    if (pathname === "/") return null; // Home shows logo
    if (pathname.startsWith("/pulse")) return "City Pulse";
    if (pathname.startsWith("/live")) return "Live";
    if (pathname.startsWith("/business")) return "Business";
    if (pathname.startsWith("/events")) return "Events";
    if (pathname.startsWith("/resources")) return "Resources";
    if (pathname.startsWith("/profile")) return "Profile";
    if (pathname.startsWith("/notifications")) return "Notifications";
    return null;
  };

  const title = getTitle();

  return (
    <header className="fixed top-0 left-1/2 -translate-x-1/2 max-w-[430px] w-full z-[100]">
      {/* Gradient fade background */}
      <div className="absolute inset-0 bg-gradient-to-b from-midnight via-midnight/95 to-transparent" />
      <div className="absolute inset-0 backdrop-blur-xl" style={{ maskImage: 'linear-gradient(to bottom, black 60%, transparent)', WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent)' }} />

      <div className="relative px-5 py-3 flex items-center justify-between">
        {/* Logo / Page Title */}
        {title ? (
          <div className="flex items-center gap-3">
            <Link href="/" className="w-8 h-8 bg-gradient-to-br from-gold to-gold-light rounded-lg flex items-center justify-center font-heading font-extrabold text-[13px] text-midnight press">
              HC
            </Link>
            <h1 className="font-heading font-bold text-lg tracking-tight">{title}</h1>
          </div>
        ) : (
          <Link href="/" className="flex items-center gap-2.5 press">
            <div className="w-9 h-9 bg-gradient-to-br from-gold to-gold-light rounded-[10px] flex items-center justify-center font-heading font-extrabold text-[15px] text-midnight shadow-lg shadow-gold/20">
              HC
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-bold text-lg tracking-tight leading-none">
                Hub<span className="text-gold">City</span>
              </span>
              <span className="text-[9px] text-txt-secondary tracking-[0.15em] uppercase leading-none mt-0.5">
                Compton, CA
              </span>
            </div>
          </Link>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {/* Search */}
          <button className="w-[38px] h-[38px] rounded-full bg-white/[0.06] border border-border-subtle text-txt-secondary flex items-center justify-center press hover:text-white hover:bg-white/[0.1] transition-all">
            <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="7.5" cy="7.5" r="5" />
              <path d="M11.5 11.5l3.5 3.5" />
            </svg>
          </button>

          {/* Notifications */}
          <Link
            href="/notifications"
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
  );
}
