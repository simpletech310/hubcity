/**
 * Mapbox Geocoding helper
 * Uses Mapbox Geocoding API v5 for address/place search
 */

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export interface GeocodingResult {
  id: string;
  name: string;
  fullAddress: string;
  latitude: number;
  longitude: number;
  category?: string;
  type: string; // poi, address, place, etc.
}

export type GeocodeBias = {
  /** Map center lng/lat to bias proximity. */
  centerLng: number;
  centerLat: number;
  /** Optional bbox: [swLng, swLat, neLng, neLat]. */
  bbox?: [number, number, number, number];
};

/**
 * Forward geocode: search text → coordinates.
 *
 * Pass `bias` (loaded from the active city's `cities.mapbox_center_lng/lat`
 * and `mapbox_bounds` columns) to bias results toward that city. With no
 * bias, the request is unrestricted.
 */
export async function geocodeSearch(
  query: string,
  limit = 5,
  bias?: GeocodeBias
): Promise<GeocodingResult[]> {
  if (!MAPBOX_TOKEN || !query.trim()) return [];

  const encoded = encodeURIComponent(query.trim());
  const params = new URLSearchParams({
    access_token: MAPBOX_TOKEN,
    limit: String(limit),
    types: "poi,address,neighborhood,locality",
    language: "en",
  });
  if (bias) {
    params.set("proximity", `${bias.centerLng},${bias.centerLat}`);
    if (bias.bbox) params.set("bbox", bias.bbox.join(","));
  }
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?${params.toString()}`;

  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();

    return (data.features || []).map(
      (f: {
        id: string;
        text: string;
        place_name: string;
        center: [number, number];
        properties?: { category?: string };
        place_type?: string[];
      }) => ({
        id: f.id,
        name: f.text,
        fullAddress: f.place_name,
        longitude: f.center[0],
        latitude: f.center[1],
        category: f.properties?.category,
        type: f.place_type?.[0] || "poi",
      })
    );
  } catch {
    console.error("Geocoding search failed");
    return [];
  }
}

/**
 * Reverse geocode: coordinates → address
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<string | null> {
  if (!MAPBOX_TOKEN) return null;

  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&limit=1&types=address,poi`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return data.features?.[0]?.place_name || null;
  } catch {
    return null;
  }
}
