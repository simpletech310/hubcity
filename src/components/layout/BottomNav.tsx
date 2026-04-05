"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    href: "/",
    label: "Home",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        {!active && <polyline points="9 22 9 12 15 12 15 22" />}
      </svg>
    ),
  },
  {
    href: "/pulse",
    label: "Pulse",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" fill={active ? "currentColor" : "none"} />
        <path d="M5.6 5.6a9 9 0 0 1 12.8 0" opacity={active ? 1 : 0.7} />
        <path d="M7.8 7.8a5.5 5.5 0 0 1 8.4 0" />
        <path d="M18.4 18.4a9 9 0 0 1-12.8 0" opacity={active ? 1 : 0.7} />
        <path d="M16.2 16.2a5.5 5.5 0 0 1-8.4 0" />
      </svg>
    ),
  },
  {
    href: "/live",
    label: "Live",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="5 3 19 12 5 21 5 3" />
      </svg>
    ),
  },
  {
    href: "/map",
    label: "Explore",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88" fill={active ? "currentColor" : "none"} />
      </svg>
    ),
  },
  {
    href: "/profile",
    label: "Me",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21v-2a6 6 0 0112 0v2" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 max-w-[430px] w-full z-[200]">
      {/* Gradient fade above nav */}
      <div className="absolute -top-6 left-0 right-0 h-6 bg-gradient-to-t from-midnight to-transparent pointer-events-none" />

      <div className="glass border-t border-border-subtle flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom,0px)]" style={{ height: '72px' }}>
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex flex-col items-center gap-1 py-2 px-4 rounded-2xl relative
                transition-all duration-300 press
                ${active ? "text-gold" : "text-txt-secondary hover:text-white/80"}
              `}
            >
              {/* Active indicator dot */}
              {active && (
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-gold" />
              )}

              <div className={`transition-transform duration-300 ${active ? "scale-110" : ""}`}>
                {item.icon(active)}
              </div>
              <span className={`text-[10px] font-medium transition-all ${active ? "text-gold font-semibold" : ""}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
