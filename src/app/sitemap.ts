import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { SITE_DOMAIN } from "@/lib/branding";

export const revalidate = 3600; // refresh hourly

const STATIC_PATHS: string[] = [
  "",
  "/events",
  "/creators",
  "/groups",
  "/frequency",
  "/live",
  "/food",
  "/health",
  "/culture",
  "/city-data/meetings",
  "/city-hall/issues",
  "/login",
  "/signup",
];

function row(path: string, lastModified?: string): MetadataRoute.Sitemap[number] {
  return {
    url: `${SITE_DOMAIN}${path.startsWith("/") ? path : `/${path}`}`,
    lastModified: lastModified ? new Date(lastModified) : new Date(),
  };
}

/**
 * Dynamic sitemap covering published events, creators, albums, businesses,
 * groups, and channel videos. Static landing pages live in STATIC_PATHS.
 *
 * Cached for 1 hour — invalidates when content is republished. Capped at
 * a few hundred rows per entity to stay under Google's 50k-URL limit
 * comfortably until content scales.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();
  const out: MetadataRoute.Sitemap = [];

  STATIC_PATHS.forEach((p) => out.push(row(p)));

  // Events (published only)
  const { data: events } = await supabase
    .from("events")
    .select("id, slug, updated_at")
    .eq("is_published", true)
    .order("start_date", { ascending: false })
    .limit(500);
  for (const e of events ?? []) {
    out.push(row(`/events/${e.slug || e.id}`, e.updated_at));
  }

  // Creators (every public profile with a handle)
  const { data: creators } = await supabase
    .from("profiles")
    .select("handle, updated_at")
    .not("handle", "is", null)
    .limit(1000);
  for (const c of creators ?? []) {
    if (c.handle) out.push(row(`/user/${c.handle}`, c.updated_at));
  }

  // Albums
  const { data: albums } = await supabase
    .from("albums")
    .select("slug, updated_at")
    .eq("is_published", true)
    .limit(500);
  for (const a of albums ?? []) {
    if (a.slug) out.push(row(`/frequency/album/${a.slug}`, a.updated_at));
  }

  // Businesses
  const { data: businesses } = await supabase
    .from("businesses")
    .select("id, slug, updated_at")
    .eq("is_published", true)
    .limit(500);
  for (const b of businesses ?? []) {
    out.push(row(`/business/${b.slug || b.id}`, b.updated_at));
  }

  // Groups
  const { data: groups } = await supabase
    .from("community_groups")
    .select("id, slug, updated_at")
    .eq("is_active", true)
    .eq("is_public", true)
    .limit(500);
  for (const g of groups ?? []) {
    out.push(row(`/groups/${g.slug || g.id}`, g.updated_at));
  }

  // Channel videos (the live/watch surface)
  const { data: videos } = await supabase
    .from("channel_videos")
    .select("id, updated_at")
    .eq("is_published", true)
    .limit(500);
  for (const v of videos ?? []) {
    out.push(row(`/live/watch/${v.id}`, v.updated_at));
  }

  return out;
}
