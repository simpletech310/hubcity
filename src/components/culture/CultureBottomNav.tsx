"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactElement } from "react";

const NAV_ITEMS: Array<{
  id: "home" | "culture" | "reels" | "map" | "profile";
  label: string;
  href: string;
  /** Regex patterns that mean "this tab is active". */
  match: RegExp[];
  icon: (p: { size?: number; strokeWidth?: number }) => ReactElement;
}> = [
  {
    id: "home",
    label: "FEED",
    href: "/",
    match: [/^\/$/, /^\/food/, /^\/events/, /^\/business/, /^\/resources/, /^\/jobs/],
    icon: ({ size = 22, strokeWidth = 1.6 }) => (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-9.5Z" />
      </svg>
    ),
  },
  {
    id: "culture",
    label: "CULT.",
    href: "/culture",
    match: [/^\/culture/, /^\/live/],
    icon: ({ size = 22, strokeWidth = 1.6 }) => (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 6h16M4 12h16M4 18h10" />
      </svg>
    ),
  },
  {
    id: "reels",
    label: "REELS",
    href: "/reels",
    match: [/^\/reels/],
    icon: ({ size = 22, strokeWidth = 1.6 }) => (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M10 9l5 3-5 3V9Z" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: "map",
    label: "MAP",
    href: "/map",
    match: [/^\/map/],
    icon: ({ size = 22, strokeWidth = 1.6 }) => (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 3 3 5v16l6-2 6 2 6-2V3l-6 2-6-2Z" />
        <path d="M9 3v16M15 5v16" />
      </svg>
    ),
  },
  {
    id: "profile",
    label: "YOU",
    href: "/profile",
    match: [/^\/profile/, /^\/user/, /^\/messages/, /^\/notifications/, /^\/dashboard/],
    icon: ({ size = 22, strokeWidth = 1.6 }) => (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c1-4 4-6 8-6s7 2 8 6" />
      </svg>
    ),
  },
];

/**
 * CultureBottomNav — 5-tab ink bottom nav with 3px gold top border. Active
 * tab glows gold (full opacity); inactive tabs fade to 55%.
 *
 * Matches the design spec in culture-core.jsx · CultureNav. Pins to the
 * bottom of the screen with safe-area padding. Uses the current pathname
 * to auto-highlight the active tab based on the `match` regexes above.
 */
export default function CultureBottomNav({
  active,
}: {
  active?: "home" | "culture" | "reels" | "map" | "profile";
}) {
  const pathname = usePathname() ?? "/";
  const resolvedActive =
    active ??
    NAV_ITEMS.find((item) => item.match.some((rx) => rx.test(pathname)))?.id ??
    "home";

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 mx-auto max-w-[430px] flex justify-around"
      style={{
        background: "var(--rule-strong-c)",
        color: "var(--paper)",
        padding: "10px 8px calc(env(safe-area-inset-bottom, 0px) + 18px)",
        borderTop: "3px solid var(--gold-c)",
      }}
      aria-label="Primary navigation"
    >
      {NAV_ITEMS.map((item) => {
        const on = item.id === resolvedActive;
        return (
          <Link
            key={item.id}
            href={item.href}
            className="flex flex-col items-center gap-[3px]"
            style={{
              fontFamily: "var(--font-archivo), Archivo, sans-serif",
              fontWeight: 800,
              fontSize: 9,
              letterSpacing: "0.12em",
              opacity: on ? 1 : 0.55,
              color: on ? "var(--gold-c)" : "var(--paper)",
            }}
            aria-current={on ? "page" : undefined}
          >
            {item.icon({ strokeWidth: on ? 2 : 1.6 })}
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
