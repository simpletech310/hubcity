/**
 * @deprecated This module is intentionally left empty after the multi-city
 * refactor. The Compton timeline now lives in the `city_history` table and
 * is loaded via `@/lib/city-history` (server) or `@/hooks/useCityHistory`
 * (client). See migration `076_multi_city_foundation.sql`.
 *
 * The named export below is preserved as an empty array so any unmigrated
 * callers fail loudly via empty timelines rather than a hard import error
 * during the transition period.
 */

export interface HistoryEntry {
  year: string;
  title: string;
  description: string;
  color: string;
  category:
    | "founding"
    | "civil_rights"
    | "music"
    | "sports"
    | "politics"
    | "renaissance";
}

/** @deprecated Use `loadCityHistory()` from `@/lib/city-history`. */
export const COMPTON_HISTORY: HistoryEntry[] = [];
