import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getCityBySlug, listLiveCities, type City } from "@/lib/cities";

const ACTIVE_CITY_COOKIE = "active_city";

/**
 * Resolve the city the current request should render content for.
 * Priority:
 *   1. `active_city` cookie (set by /c/:slug entry points and the picker).
 *   2. Authenticated user's home city (from profiles.city_id).
 *   3. The first live city as a global default.
 *   4. null if none of the above — caller can redirect to /choose-city.
 */
export async function getCurrentCity(): Promise<City | null> {
  const jar = await cookies();
  const slug = jar.get(ACTIVE_CITY_COOKIE)?.value;
  if (slug) {
    const fromCookie = await getCityBySlug(slug);
    if (fromCookie && fromCookie.launch_status === "live") return fromCookie;
  }

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
      const { data: city } = await supabase
        .from("cities")
        .select("*")
        .eq("id", profile.city_id)
        .maybeSingle();
      if (city && (city as City).launch_status === "live") return city as City;
    }
  }

  const live = await listLiveCities();
  return live[0] ?? null;
}

export async function getCurrentCityId(): Promise<string | null> {
  const city = await getCurrentCity();
  return city?.id ?? null;
}
