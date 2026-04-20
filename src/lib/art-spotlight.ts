/**
 * Per-city featured art / heritage piece. Backed by the
 * `public.city_art_features` table (see migration 076).
 *
 * The functions in this module are async because they hit the database;
 * callers that previously imported the in-code list need to `await` them.
 */

import { createClient } from "@/lib/supabase/server";
import { getCityBySlug, listLiveCities } from "@/lib/cities";

export interface ArtPiece {
  id: string;
  slug: string;
  title: string;
  artist: string;
  artistBio: string;
  medium: string;
  year: string;
  location: string;
  locationAddress: string;
  description: string;
  imageUrl: string;
  artistImageUrl?: string;
  artistWebsite?: string;
  artistInstagram?: string;
  tags: string[];
}

type Row = {
  id: string;
  slug: string;
  title: string;
  artist: string;
  artist_bio: string | null;
  medium: string | null;
  year: string | null;
  location: string | null;
  location_address: string | null;
  description: string | null;
  image_url: string | null;
  artist_image_url: string | null;
  artist_website: string | null;
  artist_instagram: string | null;
  tags: string[] | null;
  is_featured: boolean;
  display_order: number;
};

function toArtPiece(row: Row): ArtPiece {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    artist: row.artist,
    artistBio: row.artist_bio ?? "",
    medium: row.medium ?? "",
    year: row.year ?? "",
    location: row.location ?? "",
    locationAddress: row.location_address ?? "",
    description: row.description ?? "",
    imageUrl: row.image_url ?? "",
    artistImageUrl: row.artist_image_url ?? undefined,
    artistWebsite: row.artist_website ?? undefined,
    artistInstagram: row.artist_instagram ?? undefined,
    tags: row.tags ?? [],
  };
}

/**
 * All art features for a given city, ordered by `display_order`.
 */
export async function listArtFeatures(cityId: string): Promise<ArtPiece[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("city_art_features")
    .select("*")
    .eq("city_id", cityId)
    .order("display_order", { ascending: true });
  return (data as Row[] | null)?.map(toArtPiece) ?? [];
}

/**
 * Featured (hero) piece for the active city.
 * Falls back to the first piece by display_order if no row is flagged.
 */
export async function getFeaturedArt(cityId: string): Promise<ArtPiece | null> {
  const supabase = await createClient();
  const { data: featured } = await supabase
    .from("city_art_features")
    .select("*")
    .eq("city_id", cityId)
    .eq("is_featured", true)
    .order("display_order", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (featured) return toArtPiece(featured as Row);

  const { data: any0 } = await supabase
    .from("city_art_features")
    .select("*")
    .eq("city_id", cityId)
    .order("display_order", { ascending: true })
    .limit(1)
    .maybeSingle();

  return any0 ? toArtPiece(any0 as Row) : null;
}

/**
 * Look up a single art piece by slug. Optionally constrained to a city.
 */
export async function getArtBySlug(
  slug: string,
  cityId?: string
): Promise<ArtPiece | null> {
  const supabase = await createClient();
  let query = supabase.from("city_art_features").select("*").eq("slug", slug);
  if (cityId) query = query.eq("city_id", cityId);
  const { data } = await query.limit(1).maybeSingle();
  return data ? toArtPiece(data as Row) : null;
}

/**
 * For static-params generation: union of slugs across every live city.
 */
export async function listAllArtSlugs(): Promise<{ slug: string }[]> {
  const cities = await listLiveCities();
  if (cities.length === 0) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("city_art_features")
    .select("slug")
    .in(
      "city_id",
      cities.map((c) => c.id)
    );
  const seen = new Set<string>();
  const out: { slug: string }[] = [];
  for (const row of (data ?? []) as { slug: string }[]) {
    if (!seen.has(row.slug)) {
      seen.add(row.slug);
      out.push({ slug: row.slug });
    }
  }
  return out;
}

/**
 * Back-compat helper for callers that need to look up art by slug without
 * knowing the active city. Tries each live city in turn.
 */
export async function findArtBySlugAcrossCities(
  slug: string
): Promise<{ art: ArtPiece; citySlug: string } | null> {
  const cities = await listLiveCities();
  for (const c of cities) {
    const art = await getArtBySlug(slug, c.id);
    if (art) return { art, citySlug: c.slug };
  }
  return null;
}

void getCityBySlug; // exported helper kept for callers that import the module
