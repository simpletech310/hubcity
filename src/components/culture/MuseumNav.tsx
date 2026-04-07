"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";

const wings = [
  { href: "/culture", label: "Lobby", icon: "landmark" },
  { href: "/culture/exhibits", label: "Exhibits", icon: "palette" },
  { href: "/culture/gallery", label: "Gallery", icon: "frame" },
  { href: "/culture/people", label: "People", icon: "person" },
  { href: "/culture/history", label: "History", icon: "scroll" },
  { href: "/culture/media", label: "Media", icon: "film" },
  { href: "/culture/library", label: "Library", icon: "book" },
  { href: "/culture/discussions", label: "Discuss", icon: "chat" },
  { href: "/culture/murals", label: "Murals", icon: "theater" },
  { href: "/culture/calendar", label: "Events", icon: "calendar" },
];

export default function MuseumNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/culture") return pathname === "/culture";
    return pathname.startsWith(href);
  }

  return (
    <nav className="flex gap-1.5 overflow-x-auto scrollbar-hide px-5 py-3 -mx-5">
      {wings.map((wing) => {
        const active = isActive(wing.href);
        return (
          <Link
            key={wing.href}
            href={wing.href}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-semibold whitespace-nowrap shrink-0 transition-all ${
              active
                ? "bg-gold/15 text-gold border border-gold/25"
                : "bg-white/[0.04] text-txt-secondary border border-transparent hover:bg-white/[0.06] hover:text-white"
            }`}
          >
            <Icon name={wing.icon as IconName} size={16} />
            {wing.label}
          </Link>
        );
      })}
    </nav>
  );
}
