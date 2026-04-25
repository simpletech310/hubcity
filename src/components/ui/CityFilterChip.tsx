"use client";

/**
 * Per-page "filter by city" chip. Lives near each index page header
 * (Feed, On Air, Eat, Commerce, Events, Jobs, Resources, Health, …).
 *
 * Default state is "ALL CITIES" — every market's content is shown.
 * Selecting a city pushes `?city=<slug>` into the URL, preserving every
 * other search param. Selecting "ALL CITIES" clears the param.
 *
 * The control is intentionally separate from the global <CityPicker /> in
 * the header. CityPicker sets the listener's *home city* (cookie-stored,
 * used by civic pages). CityFilterChip is content-scope-only and never
 * touches the cookie.
 */

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useKnownCities } from "@/hooks/useActiveCity";

const ALL_VALUE = "all";

export default function CityFilterChip({
  className,
  align = "left",
}: {
  className?: string;
  align?: "left" | "right";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const cities = useKnownCities();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  const currentSlug = searchParams.get("city") ?? ALL_VALUE;
  const currentCity = cities.find((c) => c.slug === currentSlug) ?? null;
  const label = currentCity ? currentCity.name : "All Cities";

  // Close on outside click + Escape
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        sheetRef.current?.contains(t) ||
        triggerRef.current?.contains(t)
      ) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function pickSlug(slug: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (slug === ALL_VALUE) params.delete("city");
    else params.set("city", slug);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
    setOpen(false);
  }

  // Order: ALL → live cities → coming soon. Coming-soon stay enabled here
  // because the seed has data on cities that aren't yet "live" (LA, LB, IE).
  const ordered = [...cities].sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === "live" ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });

  return (
    <div className={className} style={{ position: "relative" }}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="press inline-flex items-center gap-2"
        style={{
          padding: "6px 10px",
          background: "var(--paper)",
          border: "2px solid var(--rule-strong-c)",
          color: "var(--ink-strong)",
          fontFamily: "var(--font-archivo), Archivo, sans-serif",
          fontWeight: 800,
          fontSize: 11,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          minWidth: 0,
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span
          aria-hidden
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: currentCity ? "var(--gold-c)" : "var(--ink-mute)",
            display: "inline-block",
          }}
        />
        <span style={{ whiteSpace: "nowrap" }}>CITY · {label.toUpperCase()}</span>
        <svg
          aria-hidden
          width="10"
          height="10"
          viewBox="0 0 12 12"
          style={{ marginLeft: 2 }}
        >
          <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      </button>

      {open && (
        <div
          ref={sheetRef}
          role="listbox"
          aria-label="Filter by city"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            [align === "right" ? "right" : "left"]: 0,
            zIndex: 40,
            background: "var(--paper)",
            border: "2px solid var(--rule-strong-c)",
            minWidth: 220,
            maxHeight: 320,
            overflowY: "auto",
            boxShadow: "0 4px 0 var(--rule-strong-c)",
          }}
        >
          <button
            type="button"
            role="option"
            aria-selected={currentSlug === ALL_VALUE}
            onClick={() => pickSlug(ALL_VALUE)}
            className="press"
            style={{
              display: "flex",
              width: "100%",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              padding: "10px 12px",
              background: currentSlug === ALL_VALUE ? "var(--paper-soft, #DCD3BF)" : "transparent",
              border: "none",
              borderBottom: "1px solid var(--rule-c)",
              textAlign: "left",
              cursor: "pointer",
              fontFamily: "var(--font-archivo), Archivo, sans-serif",
              fontWeight: 800,
              fontSize: 12,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--ink-strong)",
            }}
          >
            <span>All Cities</span>
            {currentSlug === ALL_VALUE && (
              <span style={{ color: "var(--gold-c)" }}>●</span>
            )}
          </button>
          {ordered.map((c) => {
            const selected = c.slug === currentSlug;
            const comingSoon = c.status !== "live";
            return (
              <button
                key={c.slug}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => pickSlug(c.slug)}
                className="press"
                style={{
                  display: "flex",
                  width: "100%",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: "10px 12px",
                  background: selected ? "var(--paper-soft, #DCD3BF)" : "transparent",
                  border: "none",
                  borderBottom: "1px solid var(--rule-c)",
                  textAlign: "left",
                  cursor: "pointer",
                  fontFamily: "var(--font-archivo), Archivo, sans-serif",
                  fontWeight: 700,
                  fontSize: 12,
                  letterSpacing: "0.06em",
                  color: "var(--ink-strong)",
                  textTransform: "none",
                }}
              >
                <span>{c.name}</span>
                <span
                  style={{
                    fontSize: 9,
                    letterSpacing: "0.12em",
                    color: comingSoon ? "var(--ink-mute)" : "var(--gold-c)",
                    textTransform: "uppercase",
                  }}
                >
                  {selected ? "●" : comingSoon ? "Soon" : ""}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
