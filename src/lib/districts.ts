/**
 * District / trustee-area lookups.
 *
 * Historically this file was hardcoded to Compton. After the multi-city
 * refactor, the canonical source for district boundaries is the per-city
 * `cities.districts` jsonb column (see migration 049). The legacy in-memory
 * Compton table below is kept as a fast path used as a fallback if no
 * city-specific mapping is available.
 *
 * Prefer `isCityZip(zip, city)` and the new helpers in this module over the
 * legacy `isComptonZip` (still exported for backwards compatibility).
 */

import type { City } from "@/lib/cities";

// ── Legacy Compton ZIP → district fallback ────────────────────────────────
const ZIP_TO_DISTRICT: Record<string, number> = {
  "90220": 1,
  "90221": 2,
  "90222": 3,
  "90223": 4,
};

const EXTENDED_ZIPS: Record<string, number> = {
  "90224": 1,
  "90059": 2,
  "90061": 3,
  "90262": 4,
};

/**
 * Look up the district for a ZIP within a given city. Falls back to the
 * legacy Compton table if the city has no district config (so existing
 * Compton flows keep working).
 */
export function getDistrictFromZip(
  zip: string,
  city?: Pick<City, "districts"> | null
): number | null {
  const trimmed = zip.trim();
  const districts = city?.districts;
  if (districts) {
    for (const [key, def] of Object.entries(districts)) {
      const num = Number(key);
      if (!Number.isFinite(num)) continue;
      const zips = (def?.zip_codes as string[] | undefined) ?? [];
      if (zips.includes(trimmed)) return num;
    }
  }
  return ZIP_TO_DISTRICT[trimmed] ?? EXTENDED_ZIPS[trimmed] ?? null;
}

/**
 * Generic city-aware ZIP membership check. Use this in onboarding flows.
 */
export function isCityZip(
  zip: string,
  city: Pick<City, "default_zip_codes"> | null
): boolean {
  if (!city) return false;
  return city.default_zip_codes.includes(zip.trim());
}

/** @deprecated Use `isCityZip(zip, city)` with the active city. */
export function isComptonZip(zip: string): boolean {
  return getDistrictFromZip(zip) !== null;
}

export const DISTRICT_NAMES: Record<number, string> = {
  1: "District 1 — Northwest",
  2: "District 2 — Northeast",
  3: "District 3 — Southeast",
  4: "District 4 — Southwest",
};

// ── CUSD Trustee Areas ──────────────────────────────────────
export type TrusteeArea = "A" | "B" | "C" | "D" | "E" | "F" | "G";

/**
 * Maps Compton ZIP codes to CUSD trustee areas (A-G).
 * Unlike city districts (1:1 mapping), ZIPs can span multiple trustee areas.
 * This is an approximate mapping — real boundaries use address-level precision.
 */
const ZIP_TO_TRUSTEE_AREAS: Record<string, TrusteeArea[]> = {
  "90220": ["A", "G"],
  "90221": ["B", "C", "D"],
  "90222": ["E", "F", "G"],
  "90223": ["A", "E"],
  "90224": ["A"],
  "90059": ["B"],
  "90061": ["E", "F"],
  "90262": ["G"],
};

export function getTrusteeAreasFromZip(zip: string): TrusteeArea[] {
  return ZIP_TO_TRUSTEE_AREAS[zip.trim()] ?? [];
}

export const TRUSTEE_AREA_NAMES: Record<TrusteeArea, string> = {
  A: "Area A — Western Compton",
  B: "Area B — North Compton",
  C: "Area C — Central-East Compton",
  D: "Area D — Central Compton",
  E: "Area E — South-Central Compton",
  F: "Area F — East Compton",
  G: "Area G — Compton to North Carson",
};
