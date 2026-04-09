/**
 * Maps Compton ZIP codes to city council districts (1-4).
 * Compton's primary ZIP codes are 90220, 90221, 90222, and 90223.
 * This is a simplified mapping — a production app would use
 * precise geographic boundary polygons.
 */

const ZIP_TO_DISTRICT: Record<string, number> = {
  "90220": 1,
  "90221": 2,
  "90222": 3,
  "90223": 4,
};

// Extended ZIP codes that overlap with Compton
const EXTENDED_ZIPS: Record<string, number> = {
  "90224": 1,
  "90059": 2,
  "90061": 3,
  "90262": 4,
};

export function getDistrictFromZip(zip: string): number | null {
  const trimmed = zip.trim();
  return ZIP_TO_DISTRICT[trimmed] ?? EXTENDED_ZIPS[trimmed] ?? null;
}

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
