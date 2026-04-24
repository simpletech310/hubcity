"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon, { type IconName } from "@/components/ui/Icon";

/**
 * Printed grid of service tiles. Opens from the HUB button in
 * `CultureBottomNav`. Matches the Culture blockprint aesthetic —
 * paper sheet, 3px ink top rule, hard corners, 2px ink grid rules.
 *
 * Route changes auto-close the sheet; Escape key closes too.
 */
type ServiceTile = { href: string; label: string; icon: IconName };

/** 21 tiles — everything the user can jump to in a single tap.
 *  Grouping loose so the grid reads left→right like a newspaper index. */
const TILES: ServiceTile[] = [
  { href: "/events", label: "Events", icon: "calendar" },
  { href: "/food", label: "Food", icon: "utensils" },
  { href: "/business", label: "Business", icon: "briefcase" },
  { href: "/map", label: "Map", icon: "map-pin" },
  { href: "/pulse", label: "Pulse", icon: "pulse" },
  { href: "/live", label: "Culture TV", icon: "film" },
  { href: "/health", label: "Health", icon: "heart-pulse" },
  { href: "/parks", label: "Parks", icon: "tree" },
  { href: "/schools", label: "Schools", icon: "graduation" },
  { href: "/city-hall", label: "City Hall", icon: "landmark" },
  { href: "/jobs", label: "Jobs", icon: "briefcase" },
  { href: "/groups", label: "Scenes", icon: "users" },
  { href: "/people", label: "Explore", icon: "sparkle" },
  { href: "/creators", label: "Discover", icon: "camera" },
  { href: "/podcasts", label: "Podcasts", icon: "podcast" },
  { href: "/resources", label: "Support", icon: "book" },
  { href: "/messages", label: "Messages", icon: "chat" },
  { href: "/notifications", label: "Notifs", icon: "bell" },
  { href: "/tickets", label: "Tickets", icon: "ticket" },
  { href: "/orders", label: "Orders", icon: "receipt" },
  { href: "/bookings", label: "Bookings", icon: "handshake" },
];

export default function CultureServicesSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname() ?? "/";

  // Close on route change
  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Lock body scroll while open
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  return (
    <div
      className={`fixed inset-0 z-[190] ${
        open ? "visible" : "invisible pointer-events-none"
      }`}
      aria-hidden={!open}
    >
      {/* Backdrop — ink at 70% */}
      <div
        className={`absolute inset-0 transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0"
        }`}
        style={{ background: "rgba(26, 21, 18, 0.72)" }}
        onClick={onClose}
      />

      {/* Paper sheet pinned bottom */}
      <div
        className={`absolute bottom-0 left-1/2 -translate-x-1/2 max-w-[430px] w-full transition-transform duration-250 ease-out ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
        role="dialog"
        aria-label="Services"
        style={{
          // Cap the sheet so it never exceeds the viewport. The grid
          // + footer scroll inside; the header stays pinned at the
          // top of the sheet. 88dvh leaves a small peek of backdrop
          // so the user can tap to dismiss.
          maxHeight: "88dvh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            background: "var(--paper)",
            borderTop: "3px solid var(--rule-strong-c)",
            display: "flex",
            flexDirection: "column",
            flex: "1 1 auto",
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          {/* Header row — sticky at top of sheet */}
          <div
            className="flex items-center justify-between px-[18px] py-3"
            style={{
              borderBottom: "2px solid var(--rule-strong-c)",
              flexShrink: 0,
              background: "var(--paper)",
            }}
          >
            <span className="c-kicker" style={{ opacity: 0.7 }}>
              § THE HUB
            </span>
            <button
              type="button"
              onClick={onClose}
              className="c-kicker press"
              style={{ color: "var(--ink-strong)" }}
              aria-label="Close services"
            >
              CLOSE ✕
            </button>
          </div>

          {/* Scrollable body */}
          <div
            className="overscroll-contain"
            style={{
              overflowY: "auto",
              WebkitOverflowScrolling: "touch",
              flex: "1 1 auto",
              minHeight: 0,
              paddingBottom:
                "calc(env(safe-area-inset-bottom, 0px) + 108px)",
            }}
          >
            {/* Title block */}
            <div className="px-[18px] pt-4 pb-3">
              <h2
                className="c-hero"
                style={{ fontSize: 44, lineHeight: 0.88, letterSpacing: "-0.012em" }}
              >
                Everything.
              </h2>
              <p className="c-serif-it mt-1.5" style={{ fontSize: 13 }}>
                Every corner of the city, one tap away.
              </p>
            </div>

            {/* Printed grid — 3 cols, 2px ink rules between cells */}
            <div
              className="mx-[18px]"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                border: "2px solid var(--rule-strong-c)",
                background: "var(--rule-strong-c)",
                gap: "2px",
              }}
            >
            {TILES.map((tile) => {
              const active =
                pathname === tile.href || pathname.startsWith(tile.href + "/");
              return (
                <Link
                  key={tile.href}
                  href={tile.href}
                  onClick={onClose}
                  aria-label={tile.label}
                  style={{
                    aspectRatio: "1 / 1",
                    background: active ? "var(--gold-c)" : "var(--paper)",
                    color: "var(--ink-strong)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                  }}
                >
                  <Icon
                    name={tile.icon}
                    size={26}
                    strokeWidth={1.6}
                    style={{ color: "var(--ink-strong)" }}
                  />
                  <span
                    className="c-kicker"
                    style={{
                      fontSize: 10,
                      letterSpacing: "0.12em",
                      color: "var(--ink-strong)",
                    }}
                  >
                    {tile.label}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Footer kicker */}
          <div
            className="flex items-center justify-between px-[18px] py-3 mt-4"
            style={{ borderTop: "2px solid var(--rule-strong-c)" }}
          >
            <span className="c-kicker" style={{ opacity: 0.5 }}>
              HUB CITY · INDEX · {TILES.length} ENTRIES
            </span>
            <Link
              href="/profile"
              onClick={onClose}
              className="c-kicker"
              style={{ color: "var(--gold-c)" }}
            >
              YOU ↗
            </Link>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
