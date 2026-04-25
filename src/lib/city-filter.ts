import { getCityBySlug, type City } from "@/lib/cities";

/**
 * Resolve the optional per-page city filter for an index page.
 *
 * The new default is "ALL CITIES" — content from every market shows up on
 * every index page unless the listener explicitly filters down. Pages opt
 * into per-market filtering by passing the `?city=<slug>` search param,
 * which this helper looks up.
 *
 * Returns:
 *   - `City` row when a valid `?city=<slug>` is present, OR
 *   - `null` when no filter is active (= show all cities).
 *
 * NOTE: This is the only city resolver that should be used for *content
 * scoping* on index pages (feed, on-air, eat, commerce, events, jobs,
 * resources, health, etc.). City-anchored civic features (city hall,
 * civic officials, district maps, alerts) keep using `getActiveCity()`.
 */
export async function getCityFilter(
  searchParams: { city?: string | string[] | undefined } | URLSearchParams,
): Promise<City | null> {
  let slug: string | undefined;
  if (searchParams instanceof URLSearchParams) {
    slug = searchParams.get("city") ?? undefined;
  } else {
    const raw = (searchParams as { city?: string | string[] | undefined }).city;
    slug = Array.isArray(raw) ? raw[0] : raw;
  }
  if (!slug || slug === "all") return null;
  const city = await getCityBySlug(slug);
  return city ?? null;
}
