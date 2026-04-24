"use client";

/**
 * CitySelector — Phase 2A multi-city pill + bottom-sheet picker.
 *
 * Persistence model (three layers):
 *   1. URL query param  ?city=compton  (drives SSR filtering)
 *   2. localStorage key  hub_city_selected  (survives navigation)
 *   3. Supabase profile city_id  (written elsewhere by auth flows)
 *
 * The pill button shows "🌍 All Cities" or "📍 <City>" depending on state.
 * Tapping it opens a full-height bottom sheet grouped by region.
 *
 * Also exports `useCityFilter()` for any page that needs the active filter.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CITIES,
  CITIES_BY_REGION,
  type CityOption,
  getSelectedCitySlug,
  parseCityFromSearchParams,
  setSelectedCitySlug,
} from "@/lib/cities-client";

// ---------------------------------------------------------------------------
// Context — lets child components subscribe to the active city filter
// ---------------------------------------------------------------------------

type CityFilterCtx = {
  selectedSlug: string | null;
  setCity: (slug: string | null) => void;
  isFiltering: boolean;
};

const CityFilterContext = createContext<CityFilterCtx>({
  selectedSlug: null,
  setCity: () => {},
  isFiltering: false,
});

/** Read the active city filter from anywhere below a <CitySelector>. */
export function useCityFilter(): CityFilterCtx {
  return useContext(CityFilterContext);
}

// ---------------------------------------------------------------------------
// Helper: resolve initial slug (URL param wins over localStorage)
// ---------------------------------------------------------------------------

function resolveInitialSlug(
  searchParams: ReturnType<typeof useSearchParams>,
): string | null {
  const fromUrl = parseCityFromSearchParams(searchParams);
  if (fromUrl) return fromUrl;
  return getSelectedCitySlug();
}

// ---------------------------------------------------------------------------
// CitySelector component
// ---------------------------------------------------------------------------

export default function CitySelector() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedSlug, setSelectedSlug] = useState<string | null>(() =>
    resolveInitialSlug(searchParams),
  );
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hydrate portal after mount
  useEffect(() => setMounted(true), []);

  // Sync URL → state on navigation (back/forward)
  useEffect(() => {
    const fromUrl = parseCityFromSearchParams(searchParams);
    setSelectedSlug(fromUrl ?? getSelectedCitySlug());
  }, [searchParams]);

  // Sheet open/close animation
  useEffect(() => {
    if (open) {
      // Small RAF delay lets the DOM paint with translate-y-full first
      requestAnimationFrame(() => setSheetVisible(true));
    } else {
      setSheetVisible(false);
    }
  }, [open]);

  // Escape key
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Lock body scroll when sheet is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  function handleClose() {
    setSheetVisible(false);
    // Wait for slide-down animation before unmounting
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 280);
  }

  const setCity = useCallback(
    (slug: string | null) => {
      setSelectedSlug(slug);
      setSelectedCitySlug(slug);

      // Update URL — preserve existing params, replace city param
      const params = new URLSearchParams(searchParams.toString());
      if (slug && slug !== "all") {
        params.set("city", slug);
      } else {
        params.delete("city");
      }
      const qs = params.toString();
      router.push(qs ? `?${qs}` : window.location.pathname, { scroll: false });

      handleClose();
    },
    [router, searchParams],
  );

  // Derived display values
  const selectedCity = selectedSlug
    ? CITIES.find((c) => c.slug === selectedSlug)
    : null;

  const pillLabel = selectedCity
    ? `📍 ${selectedCity.name}`
    : "🌍 All Cities";

  const isFiltering = selectedSlug !== null;

  const ctxValue: CityFilterCtx = { selectedSlug, setCity, isFiltering };

  return (
    <CityFilterContext.Provider value={ctxValue}>
      {/* ── Pill button ─────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={
          selectedCity
            ? `Filtering by ${selectedCity.name}. Tap to change.`
            : "All cities selected. Tap to filter by city."
        }
        aria-haspopup="dialog"
        className={`
          inline-flex items-center gap-1 px-2.5 py-1 rounded-full
          text-[11px] font-medium leading-none whitespace-nowrap
          border transition-all duration-200 press
          ${
            isFiltering
              ? "bg-gold/10 border-gold/40 text-gold"
              : "bg-white/[0.04] border-white/[0.10] text-txt-secondary hover:border-gold/30 hover:text-gold/80"
          }
        `}
      >
        <span>{pillLabel}</span>
        <svg
          width="9"
          height="9"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="opacity-60 shrink-0"
          aria-hidden
        >
          <path d="M3 4.5L6 7.5L9 4.5" />
        </svg>
      </button>

      {/* ── Bottom-sheet portal ─────────────────────────────────────── */}
      {open && mounted &&
        createPortal(
          <div className="fixed inset-0 z-[400] flex items-end">
            {/* Backdrop */}
            <div
              className={`
                absolute inset-0 bg-midnight/70 backdrop-blur-sm
                transition-opacity duration-250
                ${sheetVisible ? "opacity-100" : "opacity-0"}
              `}
              onClick={handleClose}
              aria-hidden
            />

            {/* Sheet */}
            <div
              ref={sheetRef}
              role="dialog"
              aria-modal="true"
              aria-label="Choose city"
              className={`
                relative w-full max-h-[80vh] overflow-y-auto
                glass-card-elevated rounded-t-3xl
                transition-transform duration-280 ease-out
                ${sheetVisible ? "translate-y-0" : "translate-y-full"}
              `}
              style={{ willChange: "transform" }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1 sm:hidden">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>

              {/* Header row */}
              <div className="flex items-start justify-between px-5 pt-4 pb-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold mb-0.5">
                    City
                  </p>
                  <h2 className="font-display text-xl text-white leading-tight">
                    Where are you exploring?
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  aria-label="Close city picker"
                  className="w-8 h-8 rounded-full bg-white/[0.06] border border-border-subtle flex items-center justify-center hover:bg-white/[0.12] press shrink-0 mt-0.5"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 14 14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    aria-hidden
                  >
                    <path d="M2 2l10 10M12 2L2 12" />
                  </svg>
                </button>
              </div>

              <div className="px-5 pb-8 space-y-5">
                {/* ── All Cities option ───────────────────────────── */}
                <CityRow
                  label="All Cities"
                  sublabel="Browse everything"
                  emoji="🌍"
                  isSelected={!isFiltering}
                  isActive
                  onSelect={() => setCity(null)}
                />

                {/* ── Regions ─────────────────────────────────────── */}
                {Object.entries(CITIES_BY_REGION).map(([region, cities]) => (
                  <section key={region}>
                    <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40 mb-2">
                      {region}
                    </h3>
                    <ul className="space-y-1.5">
                      {cities.map((city) => (
                        <li key={city.slug}>
                          <CityRow
                            label={city.name}
                            sublabel={`${city.state} · ${city.tagline}`}
                            emoji="📍"
                            isSelected={selectedSlug === city.slug}
                            isActive={city.launch_status === "active"}
                            onSelect={
                              city.launch_status === "active"
                                ? () => setCity(city.slug)
                                : undefined
                            }
                          />
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </CityFilterContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Sub-component: individual city row
// ---------------------------------------------------------------------------

function CityRow({
  label,
  sublabel,
  emoji,
  isSelected,
  isActive,
  onSelect,
}: {
  label: string;
  sublabel: string;
  emoji: string;
  isSelected: boolean;
  isActive: boolean;
  onSelect?: () => void;
}) {
  const disabled = !isActive;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      aria-pressed={isSelected}
      className={`
        w-full flex items-center justify-between gap-3 px-4 py-3
        rounded-2xl border text-left transition-colors
        ${
          disabled
            ? "border-white/[0.04] bg-white/[0.015] opacity-50 cursor-not-allowed"
            : isSelected
              ? "border-gold/40 bg-gold/10 press"
              : "border-border-subtle bg-white/[0.03] hover:border-gold/20 hover:bg-white/[0.06] press"
        }
      `}
    >
      {/* Left: emoji + text */}
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="text-base shrink-0" aria-hidden>
          {disabled ? "🔜" : emoji}
        </span>
        <div className="min-w-0">
          <p
            className={`font-heading text-[15px] leading-tight truncate ${
              isSelected ? "text-gold" : "text-white"
            }`}
          >
            {label}
          </p>
          <p className="text-[11px] text-white/40 mt-0.5 truncate">{sublabel}</p>
        </div>
      </div>

      {/* Right: checkmark or coming-soon badge */}
      {isSelected ? (
        <span className="shrink-0 text-gold" aria-label="Selected">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M3 8l3.5 3.5L13 5" />
          </svg>
        </span>
      ) : disabled ? (
        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-white/40 px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08]">
          Soon
        </span>
      ) : null}
    </button>
  );
}
