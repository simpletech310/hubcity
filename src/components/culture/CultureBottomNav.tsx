"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactElement } from "react";
import CultureServicesSheet from "./CultureServicesSheet";

type TabId = "home" | "culture" | "hub" | "moments" | "profile";

type NavItem = {
  id: TabId;
  label: string;
  /** Undefined for `hub` — HUB doesn't navigate, it opens the services sheet. */
  href?: string;
  match: RegExp[];
  icon: (p: { size?: number; strokeWidth?: number }) => ReactElement;
};

const NAV_ITEMS: NavItem[] = [
  {
    id: "home",
    label: "HOME",
    href: "/",
    match: [/^\/$/, /^\/food/, /^\/events/, /^\/business/, /^\/resources/, /^\/jobs/, /^\/pulse/],
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
    match: [/^\/culture/, /^\/live/, /^\/frequency/],
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
    id: "hub",
    label: "HUB",
    match: [], // HUB doesn't auto-activate from a route — state is local
    icon: ({ size = 24, strokeWidth = 2 }) => (
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
        <rect x="4" y="4" width="7" height="7" />
        <rect x="13" y="4" width="7" height="7" />
        <rect x="4" y="13" width="7" height="7" />
        <rect x="13" y="13" width="7" height="7" />
      </svg>
    ),
  },
  {
    id: "moments",
    label: "MOMENTS",
    href: "/moments",
    match: [/^\/moments/, /^\/reels/],
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
        <path d="M4 21c1-4 4-6 8-6s7 2 7 6" />
      </svg>
    ),
  },
];

/**
 * CultureBottomNav — 5-tab ink bar with a prominent central HUB tile
 * that opens the `CultureServicesSheet` (21 service shortcuts).
 *
 * - Ink background (`--rule-strong-c`), 3px gold top border.
 * - HUB center slot is a 44×44 gold square with 2px ink border; tapping
 *   toggles a local `hubOpen` state. No URL matching.
 * - Other 4 tabs route normally; active state glows gold.
 * - `active` prop lets parents force a specific highlight; otherwise
 *   we match the pathname against each item's regex list.
 */
export default function CultureBottomNav({
  active,
}: {
  active?: TabId;
}) {
  const pathname = usePathname() ?? "/";
  const [hubOpen, setHubOpen] = useState(false);

  const resolvedActive =
    active ??
    NAV_ITEMS.find((item) => item.match.some((rx) => rx.test(pathname)))?.id ??
    "home";

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 mx-auto max-w-[430px] flex items-end justify-around"
        style={{
          background: "var(--rule-strong-c)",
          color: "var(--paper)",
          padding: "10px 8px calc(env(safe-area-inset-bottom, 0px) + 18px)",
          borderTop: "3px solid var(--gold-c)",
        }}
        aria-label="Primary navigation"
      >
        {NAV_ITEMS.map((item) => {
          const on =
            item.id === "hub" ? hubOpen : item.id === resolvedActive;

          if (item.id === "hub") {
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setHubOpen((prev) => !prev)}
                aria-label="Open services"
                aria-expanded={hubOpen}
                className="flex flex-col items-center gap-[4px]"
                style={{
                  fontFamily: "var(--font-archivo), Archivo, sans-serif",
                  fontWeight: 800,
                  fontSize: 9,
                  letterSpacing: "0.12em",
                  color: "var(--gold-c)",
                  transform: "translateY(-4px)",
                }}
              >
                <span
                  style={{
                    width: 44,
                    height: 44,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "var(--gold-c)",
                    border: "2px solid var(--paper)",
                    color: "var(--ink-strong)",
                    boxShadow: hubOpen
                      ? "0 0 0 2px var(--gold-c)"
                      : "none",
                  }}
                >
                  {item.icon({ strokeWidth: 2 })}
                </span>
                <span>{item.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.id}
              href={item.href ?? "/"}
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

      <CultureServicesSheet
        open={hubOpen}
        onClose={() => setHubOpen(false)}
      />
    </>
  );
}
