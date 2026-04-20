"use client";

/**
 * Compact dropdown that swaps the active city for the current browser.
 * Replaces the hardcoded "Compton, CA" label in the header.
 *
 * - Clicking opens a sheet listing all cities, grouped by live vs coming_soon.
 * - Selecting a live city POSTs to /api/cities/active, then reloads so every
 *   server component refetches with the new cookie.
 * - Coming-soon cities show a disabled "Coming soon" badge.
 */

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/ui/Icon";
import { useActiveCity, useKnownCities } from "@/hooks/useActiveCity";

type Variant = "header" | "inline";

export default function CityPicker({
  variant = "header",
}: {
  variant?: Variant;
} = {}) {
  const active = useActiveCity();
  const cities = useKnownCities();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Lock body scroll when sheet is open
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  const live = cities.filter((c) => c.status === "live");
  const comingSoon = cities.filter((c) => c.status === "coming_soon");

  async function handleSelect(slug: string) {
    setError(null);
    if (active?.slug === slug) {
      setOpen(false);
      return;
    }
    startTransition(async () => {
      try {
        const res = await fetch("/api/cities/active", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error || "Failed to switch cities");
          return;
        }
        // Hard reload so all RSCs refetch with the new cookie. router.refresh()
        // alone doesn't always pick up the new cookie in dev.
        setOpen(false);
        router.refresh();
        // Navigate to the new city's home so the URL reflects the switch.
        window.location.href = `/c/${slug}`;
      } catch {
        setError("Network error. Please try again.");
      }
    });
  }

  const triggerLabel = active
    ? `${active.name}, ${active.state}`
    : "Choose city";

  return (
    <>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Active city: ${triggerLabel}. Tap to change.`}
        className={
          variant === "header"
            ? "group inline-flex items-center gap-1 text-[9px] text-txt-secondary tracking-[0.15em] uppercase leading-none mt-0.5 hover:text-white transition-colors press"
            : "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.06] border border-border-subtle text-xs text-txt-secondary hover:text-white hover:border-gold/30 transition-colors press"
        }
      >
        <span>{triggerLabel}</span>
        <svg
          width={variant === "header" ? "9" : "10"}
          height={variant === "header" ? "9" : "10"}
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="opacity-70 group-hover:opacity-100 transition-opacity"
        >
          <path d="M3 4.5L6 7.5L9 4.5" />
        </svg>
      </button>

      {/* Sheet */}
      {open && (
        <div className="fixed inset-0 z-[300] flex items-end sm:items-center sm:justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 sheet-backdrop animate-fade-in"
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-label="Choose city"
            className="relative max-w-[430px] w-full glass-card-elevated rounded-t-3xl sm:rounded-3xl px-5 pt-5 pb-8 max-h-[85vh] overflow-y-auto animate-sheet-up"
          >
            {/* Handle */}
            <div className="flex justify-center mb-4 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            {/* Title row */}
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold mb-1">
                  Choose your city
                </p>
                <h2 className="font-display text-2xl text-white leading-tight">
                  Where are we connecting?
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="w-8 h-8 rounded-full bg-white/[0.06] border border-border-subtle flex items-center justify-center hover:bg-white/[0.12] press"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 14 14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M2 2l10 10M12 2L2 12" />
                </svg>
              </button>
            </div>

            {error && (
              <p className="mb-3 text-xs text-coral bg-coral/10 border border-coral/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            {live.length > 0 && (
              <section className="mb-5">
                <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/50 mb-2">
                  Live now
                </h3>
                <ul className="space-y-2">
                  {live.map((c) => {
                    const isActive = c.slug === active?.slug;
                    return (
                      <li key={c.id}>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => handleSelect(c.slug)}
                          className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border transition-colors press disabled:opacity-50 ${
                            isActive
                              ? "border-gold/40 bg-gold/10"
                              : "border-border-subtle bg-white/[0.03] hover:border-gold/20 hover:bg-white/[0.06]"
                          }`}
                        >
                          <div className="text-left">
                            <p
                              className={`font-display text-lg leading-tight ${
                                isActive ? "text-gold" : "text-white"
                              }`}
                            >
                              {c.name}
                            </p>
                            <p className="text-[11px] text-white/40 mt-0.5">
                              {c.state}
                            </p>
                          </div>
                          {isActive ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-gold">
                              <Icon name="check" size={12} className="text-gold" />
                              Active
                            </span>
                          ) : (
                            <Icon name="forward" size={14} className="text-gold/70" />
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            {comingSoon.length > 0 && (
              <section>
                <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/50 mb-2">
                  Coming soon
                </h3>
                <ul className="space-y-2">
                  {comingSoon.map((c) => (
                    <li key={c.id}>
                      <div
                        aria-disabled
                        className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border border-white/5 bg-white/[0.02] opacity-60 cursor-not-allowed"
                      >
                        <div className="text-left">
                          <p className="font-display text-lg leading-tight text-white/80">
                            {c.name}
                          </p>
                          <p className="text-[11px] text-white/40 mt-0.5">
                            {c.state}
                          </p>
                        </div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-white/50 px-2 py-1 rounded-full bg-white/[0.04] border border-white/10">
                          Coming soon
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <p className="mt-5 text-[11px] text-white/40 text-center">
              You can switch cities anytime. Verifying your address unlocks
              resident-only sections in your home city.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
