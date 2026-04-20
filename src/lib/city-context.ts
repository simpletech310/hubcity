/**
 * Active-city context utilities.
 *
 * The "active city" is the city whose content the request should render
 * (homepage, browse pages, search). It is decoupled from the user's *home*
 * city (set by address verification) — a verified Compton resident can
 * still browse Inglewood content.
 *
 * Resolution order for the active city:
 *   1. `hubcity_active_city` cookie (set by the picker / `/c/:slug` entry).
 *   2. The user's home city (from `profiles.city_id`), if signed in.
 *   3. `DEFAULT_CITY_SLUG` (Compton, the flagship), if it's live.
 *   4. The first live city in the database.
 *   5. null — caller should redirect to `/choose-city`.
 *
 * `DEFAULT_CITY_SLUG` is the *only* place in the codebase that hardcodes a
 * slug. Every other component reads the active city from this module.
 */

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  getCityBySlug,
  listLiveCities,
  type City,
  type LaunchStatus,
} from "@/lib/cities";

export const DEFAULT_CITY_SLUG = "compton";
export const ACTIVE_CITY_COOKIE = "hubcity_active_city";
/**
 * Legacy cookie name. Read on the server for backwards compatibility — any
 * cookie write goes through `setActiveCityCookie`, which only writes the new
 * name. Old cookies expire as users return.
 */
export const LEGACY_ACTIVE_CITY_COOKIE = "active_city";

/**
 * Lightweight shape returned by the hooks/server helpers. A subset of `City`
 * to keep the client surface area small (no jsonb blobs, etc.).
 */
export type ActiveCity = {
  slug: string;
  name: string;
  state: string;
  id: string;
  status: LaunchStatus;
};

export function toActiveCity(city: City): ActiveCity {
  return {
    slug: city.slug,
    name: city.name,
    state: city.state,
    id: city.id,
    status: city.launch_status,
  };
}

/**
 * Read the active-city slug from request cookies. Returns null if no cookie
 * is set or it's invalid. Does not validate against the DB — use
 * `getActiveCity()` for that.
 */
export async function getActiveCityFromCookie(): Promise<string | null> {
  const jar = await cookies();
  const slug =
    jar.get(ACTIVE_CITY_COOKIE)?.value ??
    jar.get(LEGACY_ACTIVE_CITY_COOKIE)?.value ??
    null;
  return slug && slug.trim() ? slug.trim() : null;
}

/**
 * Set the active-city cookie. Intended for use in server actions and route
 * handlers. The cookie is HTTP-only=false so client code can read it for
 * SSR hydration sanity checks.
 */
export async function setActiveCityCookie(slug: string): Promise<void> {
  const jar = await cookies();
  jar.set(ACTIVE_CITY_COOKIE, slug, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: "lax",
  });
  // Also update the legacy cookie so any code still reading it stays in sync.
  jar.set(LEGACY_ACTIVE_CITY_COOKIE, slug, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}

/**
 * Clear the active-city cookie (e.g. on sign-out or explicit "show me the
 * picker again" actions).
 */
export async function clearActiveCityCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(ACTIVE_CITY_COOKIE);
  jar.delete(LEGACY_ACTIVE_CITY_COOKIE);
}

/**
 * Resolve the active city using the full priority chain. Returns null only
 * if there are zero live cities in the database.
 */
export async function getActiveCity(): Promise<ActiveCity | null> {
  const cookieSlug = await getActiveCityFromCookie();
  if (cookieSlug) {
    const fromCookie = await getCityBySlug(cookieSlug);
    if (fromCookie && fromCookie.launch_status === "live") {
      return toActiveCity(fromCookie);
    }
  }

  // Try authenticated user's home city.
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("city_id")
        .eq("id", user.id)
        .maybeSingle();
      if (profile?.city_id) {
        const live = await listLiveCities();
        const home = live.find((c) => c.id === profile.city_id);
        if (home) return toActiveCity(home);
      }
    }
  } catch {
    // Ignore — fall through to defaults.
  }

  const live = await listLiveCities();
  const flagship = live.find((c) => c.slug === DEFAULT_CITY_SLUG);
  if (flagship) return toActiveCity(flagship);

  return live[0] ? toActiveCity(live[0]) : null;
}

/**
 * Same as `getActiveCity` but throws if no city resolves. Use in routes that
 * have already enforced "city must exist" via redirect.
 */
export async function requireActiveCity(): Promise<ActiveCity> {
  const city = await getActiveCity();
  if (!city) {
    throw new Error(
      "No active city could be resolved. Seed at least one live city."
    );
  }
  return city;
}
