/**
 * @deprecated This module has been folded into `@/lib/city-context`. The
 * functions below are thin shims so existing callers keep working during
 * the migration. Prefer `getActiveCity()` from `@/lib/city-context` going
 * forward — it returns the lighter `ActiveCity` shape used across the app.
 */

import { getCityBySlug, type City } from "@/lib/cities";
import {
  ACTIVE_CITY_COOKIE,
  getActiveCity,
  getActiveCityFromCookie,
} from "@/lib/city-context";

export { ACTIVE_CITY_COOKIE };

/** @deprecated Use `getActiveCity()` from `@/lib/city-context`. */
export async function getCurrentCity(): Promise<City | null> {
  const slug = await getActiveCityFromCookie();
  if (slug) {
    const c = await getCityBySlug(slug);
    if (c && c.launch_status === "live") return c;
  }
  // Fall through to the full resolver, then re-fetch the City row to keep
  // the legacy `City` shape (jsonb fields, etc.) for callers that need it.
  const active = await getActiveCity();
  if (!active) return null;
  return getCityBySlug(active.slug);
}

/** @deprecated Use `getActiveCity()` and read `.id`. */
export async function getCurrentCityId(): Promise<string | null> {
  const city = await getActiveCity();
  return city?.id ?? null;
}
