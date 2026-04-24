"use client";

import Link from "next/link";
import { ReactNode } from "react";

export interface ChipItem {
  label: string;
  /** Optional href — if provided the chip becomes a link. */
  href?: string;
  /** Optional click handler — wins over href if both set. */
  onClick?: () => void;
  /** Emphasized gold variant (active with gold background). */
  gold?: boolean;
}

interface CultureChipRowProps {
  chips: ChipItem[] | string[];
  /** Index of the active chip. */
  activeIndex?: number;
  /** Extra node rendered at the end of the row (e.g. a filter icon). */
  trailing?: ReactNode;
  className?: string;
}

/**
 * CultureChipRow — horizontal scrolling chip strip. Active chip flips to a
 * solid ink background (or gold via the `gold` variant). Borders are 2px —
 * no pill softness, just hard printed corners.
 *
 * Each chip can be:
 *   • a plain string (renders non-interactive),
 *   • an object with { label, href } (Link),
 *   • an object with { label, onClick } (button).
 *
 * Design spec: culture-core.jsx · ChipRow
 */
export default function CultureChipRow({
  chips,
  activeIndex = 0,
  trailing,
  className = "",
}: CultureChipRowProps) {
  const items: ChipItem[] = chips.map((c) =>
    typeof c === "string" ? { label: c } : c
  );

  return (
    <div
      className={`c-noscroll flex gap-1.5 overflow-x-auto px-3.5 py-3.5 ${className}`}
      style={{ padding: "14px 14px" }}
    >
      {items.map((chip, i) => {
        const isActive = i === activeIndex;
        const klass = `c-chip${isActive ? " active" : ""}${chip.gold ? " gold" : ""}`;

        if (chip.href) {
          return (
            <Link key={`${chip.label}-${i}`} href={chip.href} className={klass}>
              {chip.label}
            </Link>
          );
        }
        if (chip.onClick) {
          return (
            <button
              type="button"
              key={`${chip.label}-${i}`}
              onClick={chip.onClick}
              className={klass}
            >
              {chip.label}
            </button>
          );
        }
        return (
          <span key={`${chip.label}-${i}`} className={klass}>
            {chip.label}
          </span>
        );
      })}
      {trailing && <div className="shrink-0 flex items-center">{trailing}</div>}
    </div>
  );
}
