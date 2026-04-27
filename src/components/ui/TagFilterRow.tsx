"use client";

import Icon from "@/components/ui/Icon";
import { INTEREST_TAGS } from "@/lib/interest-tags";

interface TagFilterRowProps {
  /** The active tag value, or null for "All". */
  value: string | null;
  onChange: (next: string | null) => void;
  /** Subset of tag values to show — defaults to all. */
  only?: string[];
  className?: string;
}

/**
 * Single-select horizontal scrollable chip row for browse pages.
 * "All" affordance clears the filter.
 *
 * Editorial Hub City treatment: square corners, gold-on-ink active
 * state, paper-warm idle. Per-tag rainbow colors (red, purple, cyan…)
 * appear as a tiny leading dot so the tag's visual identity is kept
 * without breaking the platform's gold/ink rhythm.
 */
export default function TagFilterRow({
  value,
  onChange,
  only,
  className,
}: TagFilterRowProps) {
  const visible = only
    ? INTEREST_TAGS.filter((t) => only.includes(t.value))
    : INTEREST_TAGS;

  const chipBase: React.CSSProperties = {
    height: 32,
    padding: "0 12px",
    fontFamily: "var(--font-archivo), Archivo, sans-serif",
    fontWeight: 800,
    fontSize: 10,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
  };

  return (
    <div
      className={
        "flex gap-1.5 overflow-x-auto scrollbar-hide px-1 py-1 " +
        (className ?? "")
      }
    >
      <button
        type="button"
        onClick={() => onChange(null)}
        className="shrink-0 inline-flex items-center gap-1.5 press transition-colors"
        style={{
          ...chipBase,
          background: value === null ? "var(--gold-c)" : "var(--paper-warm)",
          color: "var(--ink-strong)",
          border: `2px solid ${
            value === null ? "var(--ink-strong)" : "var(--rule-strong-c)"
          }`,
        }}
      >
        ALL
      </button>

      {visible.map((tag) => {
        const active = value === tag.value;
        return (
          <button
            key={tag.value}
            type="button"
            onClick={() => onChange(active ? null : tag.value)}
            className="shrink-0 inline-flex items-center gap-1.5 press transition-colors"
            style={{
              ...chipBase,
              background: active ? "var(--gold-c)" : "var(--paper-warm)",
              color: "var(--ink-strong)",
              border: `2px solid ${
                active ? "var(--ink-strong)" : "var(--rule-strong-c)"
              }`,
            }}
          >
            <span
              aria-hidden
              className="inline-block shrink-0"
              style={{
                width: 7,
                height: 7,
                background: tag.color,
                border: "1px solid var(--ink-strong)",
              }}
            />
            <Icon
              name={tag.icon}
              size={11}
              style={{ color: "var(--ink-strong)" }}
            />
            {tag.label}
          </button>
        );
      })}
    </div>
  );
}
