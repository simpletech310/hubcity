"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";

const wings: { href: string; label: string; icon: IconName }[] = [
  { href: "/culture", label: "Lobby", icon: "landmark" },
  { href: "/culture/exhibits", label: "Exhibits", icon: "palette" },
  { href: "/culture/gallery", label: "Gallery", icon: "frame" },
  { href: "/culture/people", label: "People", icon: "person" },
  { href: "/culture/history", label: "History", icon: "scroll" },
  { href: "/culture/events", label: "Events", icon: "calendar" },
  { href: "/culture/landmarks", label: "Landmarks", icon: "map-pin" },
];

/**
 * Editorial museum sub-nav. Replaces the legacy `bg-gold/15 text-gold`
 * dark-theme pills with paper-warm Hub City chips: ink rule + c-kicker
 * label, gold fill on active. Lives directly under <CultureHero> on
 * every /culture/* page.
 */
export default function MuseumNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/culture") return pathname === "/culture";
    return pathname.startsWith(href);
  }

  return (
    <nav className="flex gap-2 overflow-x-auto scrollbar-hide px-5 py-3 -mx-5">
      {wings.map((wing) => {
        const active = isActive(wing.href);
        return (
          <Link
            key={wing.href}
            href={wing.href}
            className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 press"
            style={{
              padding: "7px 12px",
              background: active ? "var(--gold-c)" : "var(--paper-warm)",
              color: "var(--ink-strong)",
              border: "2px solid var(--rule-strong-c)",
              fontFamily: "var(--font-archivo), Archivo, sans-serif",
              fontWeight: 800,
              fontSize: 10.5,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              boxShadow: active ? "0 2px 0 rgba(0,0,0,0.18)" : "none",
            }}
          >
            <Icon name={wing.icon} size={13} />
            {wing.label}
          </Link>
        );
      })}
    </nav>
  );
}
