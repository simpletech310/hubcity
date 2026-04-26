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

  return (
    <div
      className={
        "flex gap-1.5 overflow-x-auto no-scrollbar px-1 py-1 " +
        (className ?? "")
      }
    >
      <button
        type="button"
        onClick={() => onChange(null)}
        className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide press transition-colors"
        style={{
          background: value === null ? "var(--gold-c, #F2A900)" : "var(--paper-warm, rgba(255,255,255,0.06))",
          color: value === null ? "#000" : "var(--ink-strong, #fff)",
          border: `2px solid ${value === null ? "var(--gold-c, #F2A900)" : "var(--rule-strong-c, rgba(255,255,255,0.18))"}`,
        }}
      >
        All
      </button>

      {visible.map((tag) => {
        const active = value === tag.value;
        return (
          <button
            key={tag.value}
            type="button"
            onClick={() => onChange(active ? null : tag.value)}
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide press transition-colors"
            style={{
              background: active ? tag.color : "var(--paper-warm, rgba(255,255,255,0.06))",
              color: active ? "#000" : "var(--ink-strong, #fff)",
              border: `2px solid ${active ? tag.color : "var(--rule-strong-c, rgba(255,255,255,0.18))"}`,
            }}
          >
            <Icon
              name={tag.icon}
              size={11}
              style={{ color: active ? "#000" : "currentColor" }}
            />
            {tag.label}
          </button>
        );
      })}
    </div>
  );
}
