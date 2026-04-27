import { createClient } from "@/lib/supabase/server";

/**
 * Static default values for all feature flags.
 * These are used synchronously (e.g. in middleware) and as a fallback when the
 * feature_flags table does not yet exist or a DB read fails.
 */
export const FEATURE_FLAGS_DEFAULTS: Record<string, boolean> = {
  civic_enabled: false,
  multi_city_enabled: true,
  creator_studio_enabled: true,
  spanish_enabled: true,
};

/**
 * Synchronous flag check — uses static defaults only.
 * Safe to call from middleware (no async, no DB round-trip).
 */
export function isEnabled(flagName: string): boolean {
  return FEATURE_FLAGS_DEFAULTS[flagName] ?? false;
}

/**
 * Async flag check — reads from the feature_flags table, falls back to
 * FEATURE_FLAGS_DEFAULTS when the table is unavailable or the row is missing.
 *
 * Expected table shape:
 *   feature_flags (name text PK, enabled boolean not null)
 */
export async function getFlag(flagName: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("feature_flags")
      .select("is_enabled")
      .eq("name", flagName)
      .maybeSingle();

    if (error || data === null) {
      return FEATURE_FLAGS_DEFAULTS[flagName] ?? false;
    }

    return data.is_enabled as boolean;
  } catch {
    return FEATURE_FLAGS_DEFAULTS[flagName] ?? false;
  }
}

/**
 * Single source of truth for civic route prefixes.
 * Used by middleware (blocking) and access.ts (canSee).
 */
export const CIVIC_ROUTE_PREFIXES: ReadonlyArray<string> = [
  "/city-hall",
  "/district",
  "/council",
  "/trustee",
  "/officials",
  "/schools",
  "/parks",
  "/city-data",
  "/admin/issues",
  "/admin/city-metrics",
];
