import { createClient } from "@/lib/supabase/server";

export type LaunchStatus = "live" | "coming_soon" | "hidden";

export type City = {
  id: string;
  slug: string;
  name: string;
  state: string;
  timezone: string;
  default_zip_codes: string[];
  mapbox_center_lng: number | null;
  mapbox_center_lat: number | null;
  mapbox_bounds: unknown;
  districts: Record<string, { name: string; zip_codes?: string[] }> | null;
  launch_status: LaunchStatus;
  theme: Record<string, unknown> | null;
};

type ResolveInput = {
  slug?: string | null;
  userHomeCityId?: string | null;
  zipHint?: string | null;
};

/**
 * In-memory cache. Cities change rarely; revalidate by restarting the server
 * or by setting CITY_CACHE_TTL_MS in env. Set to 0 to disable.
 */
const CACHE_TTL_MS = Number(process.env.CITY_CACHE_TTL_MS ?? 5 * 60 * 1000);
let cache: { fetchedAt: number; cities: City[] } | null = null;

async function loadCities(): Promise<City[]> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.cities;
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("cities")
    .select("*")
    .neq("launch_status", "hidden")
    .order("launch_status", { ascending: true })
    .order("name", { ascending: true });
  const cities = (data ?? []) as City[];
  cache = { fetchedAt: Date.now(), cities };
  return cities;
}

export async function listLiveCities(): Promise<City[]> {
  const cities = await loadCities();
  return cities.filter((c) => c.launch_status === "live");
}

export async function listKnownCities(): Promise<City[]> {
  return loadCities();
}

export async function getCityBySlug(slug: string): Promise<City | null> {
  const cities = await loadCities();
  return cities.find((c) => c.slug === slug) ?? null;
}

export async function getCityById(id: string): Promise<City | null> {
  const cities = await loadCities();
  return cities.find((c) => c.id === id) ?? null;
}

/**
 * Resolve the current city for a request.
 * Priority: explicit path param > user's home city > ZIP hint > null (picker).
 */
export async function resolveCity(input: ResolveInput): Promise<City | null> {
  if (input.slug) {
    const c = await getCityBySlug(input.slug);
    if (c && c.launch_status !== "hidden") return c;
  }
  if (input.userHomeCityId) {
    const c = await getCityById(input.userHomeCityId);
    if (c) return c;
  }
  if (input.zipHint) {
    const cities = await loadCities();
    const match = cities.find((c) =>
      c.default_zip_codes.includes(input.zipHint as string)
    );
    if (match) return match;
  }
  return null;
}

/**
 * ZIP → city lookup used by the verify-address flow.
 * Returns null if the ZIP matches no city or is ambiguous (would need manual review).
 */
export async function resolveCityByZip(
  zip: string
): Promise<{ city: City | null; ambiguous: boolean }> {
  const cities = await loadCities();
  const matches = cities.filter((c) => c.default_zip_codes.includes(zip));
  if (matches.length === 1) return { city: matches[0], ambiguous: false };
  if (matches.length > 1) return { city: null, ambiguous: true };
  return { city: null, ambiguous: false };
}
