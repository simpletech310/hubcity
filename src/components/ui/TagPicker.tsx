"use client";

import Icon from "@/components/ui/Icon";
import { INTEREST_TAGS } from "@/lib/interest-tags";

interface TagPickerProps {
  selected: string[];
  onChange: (next: string[]) => void;
  /** Cap how many tags can be picked. Default unlimited. */
  max?: number;
  /** Optional helper label rendered above the chips. */
  label?: string;
}

/**
 * Multi-select chip grid backed by INTEREST_TAGS.
 * Toggles tag on/off; respects an optional max-selected cap.
 */
export default function TagPicker({
  selected,
  onChange,
  max,
  label,
}: TagPickerProps) {
  function toggle(value: string) {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
      return;
    }
    if (typeof max === "number" && selected.length >= max) return;
    onChange([...selected, value]);
  }

  const remaining =
    typeof max === "number" ? Math.max(0, max - selected.length) : null;

  return (
    <div className="w-full">
      {(label || remaining !== null) && (
        <div className="flex items-center justify-between mb-2">
          {label && (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-txt-secondary">
              {label}
            </span>
          )}
          {remaining !== null && (
            <span className="text-[10px] text-txt-secondary">
              {remaining === 0 ? "Max selected" : `${remaining} left`}
            </span>
          )}
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">
        {INTEREST_TAGS.map((tag) => {
          const active = selected.includes(tag.value);
          return (
            <button
              key={tag.value}
              type="button"
              onClick={() => toggle(tag.value)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide press transition-colors"
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
    </div>
  );
}
