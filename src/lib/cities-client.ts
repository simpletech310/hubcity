/**
 * Client-side city selection helpers.
 *
 * Handles the "Phase 2A multi-city" persistence model:
 *   - URL query param  ?city=compton  (or omitted / ?city=all for "All Cities")
 *   - localStorage key  hub_city_selected
 *   - Supabase profile  city_id  (written separately by auth flows)
 *
 * NOTE: This module is browser-only. Do not import from server components or
 * route handlers — use `@/lib/cities` (the server module) for those.
 */

import { createClient } from "@/lib/supabase/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CityOption = {
  id: string;
  slug: string;
  name: string;
  state: string;
  region: string;
  tagline: string;
  launch_status: "active" | "coming_soon" | "planned";
};

// ---------------------------------------------------------------------------
// Static city list — matches DB seed from migration 082
// ---------------------------------------------------------------------------

export const CITIES: CityOption[] = [
  {
    id: "",
    slug: "compton",
    name: "Compton",
    state: "CA",
    region: "SoCal",
    tagline: "The Hub City",
    launch_status: "active",
  },
  {
    id: "",
    slug: "los-angeles",
    name: "Los Angeles",
    state: "CA",
    region: "SoCal",
    tagline: "The City of Angels",
    launch_status: "coming_soon",
  },
  {
    id: "",
    slug: "long-beach",
    name: "Long Beach",
    state: "CA",
    region: "SoCal",
    tagline: "The LBC",
    launch_status: "coming_soon",
  },
  {
    id: "",
    slug: "inglewood",
    name: "Inglewood",
    state: "CA",
    region: "SoCal",
    tagline: "City of Champions",
    launch_status: "coming_soon",
  },
  {
    id: "",
    slug: "riverside",
    name: "Riverside",
    state: "CA",
    region: "Inland Empire",
    tagline: "The IE",
    launch_status: "coming_soon",
  },
  {
    id: "",
    slug: "san-bernardino",
    name: "San Bernardino",
    state: "CA",
    region: "Inland Empire",
    tagline: "The Inland Empire",
    launch_status: "coming_soon",
  },
  {
    id: "",
    slug: "dallas",
    name: "Dallas",
    state: "TX",
    region: "Texas Triangle",
    tagline: "Big D",
    launch_status: "coming_soon",
  },
  {
    id: "",
    slug: "houston",
    name: "Houston",
    state: "TX",
    region: "Texas Triangle",
    tagline: "H-Town",
    launch_status: "coming_soon",
  },
  {
    id: "",
    slug: "atlanta",
    name: "Atlanta",
    state: "GA",
    region: "ATL",
    tagline: "ATL",
    launch_status: "coming_soon",
  },
];

// ---------------------------------------------------------------------------
// Derived: cities grouped by region
// ---------------------------------------------------------------------------

export const CITIES_BY_REGION: Record<string, CityOption[]> = CITIES.reduce(
  (acc, city) => {
    if (!acc[city.region]) acc[city.region] = [];
    acc[city.region].push(city);
    return acc;
  },
  {} as Record<string, CityOption[]>,
);

// ---------------------------------------------------------------------------
// DB fetch (browser client)
// ---------------------------------------------------------------------------

/**
 * Fetch cities from the Supabase `cities` table and map them to CityOption.
 * Falls back to the static CITIES list on any error (network, auth, etc.).
 */
export async function getCitiesFromDB(): Promise<CityOption[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("cities")
      .select("id, slug, name, state, launch_status")
      .neq("launch_status", "hidden")
      .order("launch_status", { ascending: true })
      .order("name", { ascending: true });

    if (error || !data || data.length === 0) return CITIES;

    return data.map((row: {
      id: string;
      slug: string;
      name: string;
      state: string;
      launch_status: string;
    }) => {
      // Merge with the static list to pick up region + tagline (not in DB yet).
      const staticMatch = CITIES.find((c) => c.slug === row.slug);
      return {
        id: row.id ?? "",
        slug: row.slug,
        name: row.name,
        state: row.state,
        region: staticMatch?.region ?? "Other",
        tagline: staticMatch?.tagline ?? "",
        launch_status: (row.launch_status === "live"
          ? "active"
          : row.launch_status === "coming_soon"
            ? "coming_soon"
            : "planned") as CityOption["launch_status"],
      };
    });
  } catch {
    return CITIES;
  }
}

// ---------------------------------------------------------------------------
// Sync helpers
// ---------------------------------------------------------------------------

/** Look up a city by slug from the static list. */
export function getCityBySlug(slug: string): CityOption | undefined {
  return CITIES.find((c) => c.slug === slug);
}

const LS_KEY = "hub_city_selected";

/**
 * Read the persisted city slug from localStorage.
 * Returns null if not set, set to "all", or running SSR.
 */
export function getSelectedCitySlug(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const val = localStorage.getItem(LS_KEY);
    if (!val || val === "all") return null;
    return val;
  } catch {
    return null;
  }
}

/**
 * Persist a city slug to localStorage.
 * Pass null (or "all") to clear the filter (write "all").
 */
export function setSelectedCitySlug(slug: string | null): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_KEY, slug ?? "all");
  } catch {
    // Ignore (e.g. private mode quota exceeded).
  }
}

// ---------------------------------------------------------------------------
// URL helpers
// ---------------------------------------------------------------------------

/**
 * Build a query-param string for the selected city.
 * Returns "?city=compton" for a slug, or "" for null / "all".
 */
export function buildCityQueryParam(slug: string | null): string {
  if (!slug || slug === "all") return "";
  return `?city=${encodeURIComponent(slug)}`;
}

/**
 * Parse the city slug out of URLSearchParams (works with both the standard
 * `URLSearchParams` and Next.js `ReadonlyURLSearchParams`).
 * Returns null if the param is absent or equals "all".
 */
export function parseCityFromSearchParams(
  searchParams: URLSearchParams | { get(key: string): string | null },
): string | null {
  const val = searchParams.get("city");
  if (!val || val === "all") return null;
  return val;
}
