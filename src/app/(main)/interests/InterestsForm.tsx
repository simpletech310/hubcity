"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Icon, { type IconName } from "@/components/ui/Icon";
import type { CultureCategory } from "@/lib/interests";

type Props = {
  categories: CultureCategory[];
  selectedIds: string[];
};

export default function InterestsForm({ categories, selectedIds }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set(selectedIds));
  const [isPending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function save() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/interests", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ category_ids: [...selected] }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Could not save");
        }
        setSavedAt(Date.now());
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not save");
      }
    });
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        {categories.map((c) => {
          const on = selected.has(c.id);
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => toggle(c.id)}
              aria-pressed={on}
              className="flex items-center gap-3 p-3 text-left transition press"
              style={{
                background: on ? "var(--gold-c)" : "var(--paper-warm)",
                border: "2px solid var(--rule-strong-c)",
                color: "var(--ink-strong)",
              }}
            >
              <div
                className="w-8 h-8 flex items-center justify-center"
                style={{
                  background: on ? "var(--ink-strong)" : "var(--paper-soft)",
                  border: "2px solid var(--rule-strong-c)",
                }}
              >
                <Icon
                  name={((c.icon || "palette").toLowerCase() as IconName)}
                  size={14}
                  style={{ color: on ? "var(--gold-c)" : "var(--ink-strong)" }}
                />
              </div>
              <span className="c-card-t" style={{ fontSize: 13 }}>{c.name}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={isPending}
          className="c-btn c-btn-primary press disabled:opacity-50"
        >
          {isPending ? "SAVING…" : "SAVE INTERESTS"}
        </button>
        {savedAt && !isPending && (
          <span className="c-kicker" style={{ color: "var(--ink-strong)", opacity: 0.7 }}>SAVED.</span>
        )}
        {error && <span className="c-kicker" style={{ color: "var(--ink-strong)" }}>{error}</span>}
      </div>
    </div>
  );
}
