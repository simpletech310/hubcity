import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import MapExplorer from "@/components/map/MapExplorer";
import type { MapPoint } from "@/types/map";
import { getActiveCity } from "@/lib/city-context";

export const metadata: Metadata = {
  title: "Map — Culture",
  description:
    "Find schools, health clinics, businesses, parks, and city resources across Compton on an interactive map.",
};

export default async function MapPage() {
  const supabase = await createClient();
  const city = await getActiveCity();
  const points: MapPoint[] = [];

  // Fetch businesses with coordinates
  const { data: businesses } = await supabase
    .from("businesses")
    .select(
      "id, name, slug, latitude, longitude, address, category, description, image_urls, rating_avg"
    )
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
          slug: b.slug,
          address: b.address,
          category: b.category,
          description: b.description,
          image: b.image_urls?.[0] ?? null,
          rating: b.rating_avg,
          link: `/business/${b.slug}`,
        },
      });
    }
  }

  // Fetch schools with coordinates
  const { data: schools } = await supabase
    .from("schools")
    .select(
      "id, name, slug, latitude, longitude, address, level, enrollment, rating, image_url"
    )
    .eq("is_published", true)
    .not("latitude", "is", null)
    .not("longitude", "is", null);

  if (schools) {
    for (const s of schools) {
      const levelLabel: Record<string, string> = {
        high_school: "High School",
        middle_school: "Middle School",
        elementary: "Elementary",
        college: "College",
      };
      points.push({
        id: s.id,
        type: "school",
        name: s.name,
        latitude: s.latitude!,
        longitude: s.longitude!,
        metadata: {
          slug: s.slug,
          address: s.address,
          category: levelLabel[s.level] ?? s.level,
          description: `${s.enrollment?.toLocaleString() ?? "—"} students · ${levelLabel[s.level] ?? s.level}`,
          image: s.image_url,
          rating: s.rating,
          link: `/schools/${s.slug}`,
        },
      });
    }
  }

  // Fetch events with coordinates
  const today = new Date().toISOString().split("T")[0];
  const { data: events } = await supabase
    .from("events")
    .select(
      "id, title, latitude, longitude, address, location_name, category, start_date, image_url"
    )
    .eq("is_published", true)
    .gte("start_date", today)
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
          address: e.address || e.location_name,
          category: e.category,
          description: e.location_name
            ? `pin ${e.location_name}`
            : undefined,
          image: e.image_url,
          date: e.start_date,
          link: `/events/${e.id}`,
        },
      });
    }
  }

  // Fetch health resources with coordinates
  const { data: healthResources } = await supabase
    .from("health_resources")
    .select(
      "id, name, slug, latitude, longitude, address, category, description, organization, phone, is_emergency, is_free"
    )
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
          description: h.organization || h.description,
          phone: h.phone,
          is_emergency: h.is_emergency,
          is_free: h.is_free,
          link: `/health/${h.slug}`,
        },
      });
    }
  }

  // Fetch parks with coordinates
  const { data: parks } = await supabase
    .from("parks")
    .select(
      "id, name, slug, latitude, longitude, address, description, amenities, image_urls"
    )
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
          image: p.image_urls?.[0],
          link: `/parks/${p.slug ?? p.id}`,
        },
      });
    }
  }

  // Fetch city issues with coordinates
  const { data: issues } = await supabase
    .from("city_issues")
    .select("id, title, latitude, longitude, location_text, type, status")
    .in("status", ["open", "in_progress"])
    .not("latitude", "is", null)
    .not("longitude", "is", null)
    .limit(50);

  if (issues) {
    for (const i of issues) {
      points.push({
        id: i.id,
        type: "issue",
        name: i.title,
        latitude: i.latitude!,
        longitude: i.longitude!,
        metadata: {
          address: i.location_text,
          category: i.type,
          status: i.status,
          link: `/city-hall/issues/${i.id}`,
        },
      });
    }
  }

  // Compute category counts for the UI
  const counts: Record<string, number> = {};
  for (const p of points) {
    counts[p.type] = (counts[p.type] ?? 0) + 1;
  }

  const cityUpper = (city?.name ?? "Everywhere").toUpperCase();

  return (
    <div className="culture-surface min-h-dvh">
      {/* Ink-block location strip */}
      <div
        className="flex items-center gap-2 px-[18px] py-2.5"
        style={{ background: "var(--rule-strong-c)", color: "var(--paper)" }}
      >
        <span
          className="c-live-dot inline-block"
          style={{ width: 8, height: 8, background: "var(--green-c)" }}
        />
        <span className="c-kicker" style={{ color: "var(--paper)" }}>
          THE ATLAS · {cityUpper} · {points.length} PINS
        </span>
      </div>

      {/* Masthead title */}
      <div className="px-[18px] pt-5 pb-3">
        <div className="c-kicker mb-1.5">§ THE BLOCK</div>
        <h1
          className="c-hero"
          style={{ fontSize: 44, lineHeight: 0.88, letterSpacing: "-0.012em" }}
        >
          Find the Block.
        </h1>
        <p className="c-serif-it mt-2" style={{ fontSize: 13 }}>
          Businesses, resources, schools, and the culture pinned to the grid.
        </p>
      </div>

      {/* Map explorer (interactive mapbox kept; chrome restyle is a follow-up) */}
      <div
        className="mx-[18px]"
        style={{ border: "3px solid var(--rule-strong-c)", overflow: "hidden" }}
      >
        <MapExplorer initialPoints={points} categoryCounts={counts} />
      </div>

      {/* Colophon */}
      <div
        className="px-[18px] py-4 mt-4"
        style={{ borderTop: "2px solid var(--rule-strong-c)" }}
      >
        <div className="flex items-center justify-between">
          <span className="c-kicker" style={{ opacity: 0.5 }}>
            HUB CITY · ATLAS · {cityUpper}
          </span>
          <span className="c-kicker" style={{ opacity: 0.5 }}>
            {points.length} RESULTS
          </span>
        </div>
      </div>
    </div>
  );
}
