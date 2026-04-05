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

  // Fetch community resources with coordinates (general)
  const { data: resources } = await supabase
    .from("resources")
    .select("id, name, slug, address, category, description, organization")
    .eq("status", "open");

  // Resources don't always have lat/lng columns — include only those that do
  // (the table may not have these columns; if the query fails silently, skip)

  return <MapExplorer initialPoints={points} />;
}
