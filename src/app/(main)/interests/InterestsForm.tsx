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
              className={[
                "flex items-center gap-3 rounded-xl border p-3 text-left transition",
                on
                  ? "bg-gold/10 border-gold/40 text-white"
                  : "bg-white/[0.02] border-white/10 text-txt-secondary hover:bg-white/[0.04]",
              ].join(" ")}
            >
              <div
                className={[
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  on ? "bg-gold/20 border border-gold/30" : "bg-white/5 border border-white/10",
                ].join(" ")}
              >
                <Icon
                  name={((c.icon || "palette").toLowerCase() as IconName)}
                  size={14}
                  className={on ? "text-gold" : "text-white/50"}
                />
              </div>
              <span className="text-sm font-medium">{c.name}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={isPending}
          className="px-5 py-2.5 rounded-lg bg-gold text-midnight font-semibold text-sm disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save interests"}
        </button>
        {savedAt && !isPending && (
          <span className="text-xs text-emerald-300">Saved.</span>
        )}
        {error && <span className="text-xs text-coral-300">{error}</span>}
      </div>
    </div>
  );
}
