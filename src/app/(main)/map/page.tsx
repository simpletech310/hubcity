import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import MapExplorer from "@/components/map/MapExplorer";
import type { MapPoint } from "@/types/map";

export const metadata: Metadata = {
  title: "Map — Hub City",
  description: "Explore Compton businesses, events, health resources, and more on an interactive map.",
};

export default async function MapPage() {
  const supabase = await createClient();
  const points: MapPoint[] = [];

  // Fetch businesses with coordinates
  const { data: businesses } = await supabase
    .from("businesses")
    .select("id, name, latitude, longitude, address, category, description")
    .eq("is_published", true)
    .not("latitude", "is", null)
    .not("longitude", "is", null);

  if (businesses) {
    for (const b of businesses) {
      points.push({
        id: b.id,
        type: "business",
        name: b.name,
        latitude: b.latitude!,
        longitude: b.longitude!,
        metadata: {
          address: b.address,
          category: b.category,
          description: b.description,
        },
      });
    }
  }

  // Fetch events with coordinates
  const { data: events } = await supabase
    .from("events")
    .select("id, title, latitude, longitude, address, location_name, category, description")
    .eq("is_published", true)
    .not("latitude", "is", null)
    .not("longitude", "is", null);

  if (events) {
    for (const e of events) {
      points.push({
        id: e.id,
        type: "event",
        name: e.title,
        latitude: e.latitude!,
        longitude: e.longitude!,
        metadata: {
          address: e.address,
          location_name: e.location_name,
          category: e.category,
          description: e.description,
        },
      });
    }
  }

  // Fetch health resources with coordinates
  const { data: healthResources } = await supabase
    .from("health_resources")
    .select("id, name, slug, latitude, longitude, address, category, description, organization")
    .eq("is_published", true)
    .not("latitude", "is", null)
    .not("longitude", "is", null);

  if (healthResources) {
    for (const h of healthResources) {
      points.push({
        id: h.id,
        type: "health",
        name: h.name,
        latitude: h.latitude!,
        longitude: h.longitude!,
        metadata: {
          slug: h.slug,
          address: h.address,
          category: h.category,
          description: h.description,
          organization: h.organization,
        },
      });
    }
  }

  // Fetch murals with coordinates
  const { data: murals } = await supabase
    .from("murals")
    .select("id, title, latitude, longitude, address, artist_name, description, year_created, district, image_urls")
    .eq("is_published", true)
    .not("latitude", "is", null)
    .not("longitude", "is", null);

  if (murals) {
    for (const m of murals) {
      points.push({
        id: m.id,
        type: "mural",
        name: m.title,
        latitude: m.latitude!,
        longitude: m.longitude!,
        metadata: {
          address: m.address,
          artist_name: m.artist_name,
          description: m.description,
          year_created: m.year_created,
          district: m.district,
          image_url: m.image_urls?.[0],
        },
      });
    }
  }

  // Fetch parks with coordinates
  const { data: parks } = await supabase
    .from("parks")
    .select("id, name, slug, latitude, longitude, address, description, amenities, district, image_urls")
    .eq("is_published", true)
    .not("latitude", "is", null)
    .not("longitude", "is", null);

  if (parks) {
    for (const p of parks) {
      points.push({
        id: p.id,
        type: "park",
        name: p.name,
        latitude: p.latitude!,
        longitude: p.longitude!,
        metadata: {
          slug: p.slug,
          address: p.address,
          description: p.description,
          amenities: p.amenities,
          district: p.district,
          image_url: p.image_urls?.[0],
        },
      });
    }
  }

  // Fetch transit stops with coordinates
  const { data: transitStops } = await supabase
    .from("transit_stops")
    .select("id, name, route_name, route_type, latitude, longitude, gtfs_stop_id")
    .eq("is_active", true)
    .not("latitude", "is", null)
    .not("longitude", "is", null);

  if (transitStops) {
    for (const t of transitStops) {
      points.push({
        id: t.id,
        type: "transit",
        name: t.name,
        latitude: t.latitude!,
        longitude: t.longitude!,
        metadata: {
          route_name: t.route_name,
          route_type: t.route_type,
          gtfs_stop_id: t.gtfs_stop_id,
        },
      });
    }
  }

  return <MapExplorer initialPoints={points} />;
}
