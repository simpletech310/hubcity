import type { SupabaseClient } from "@supabase/supabase-js";
import type { ScheduledBroadcast, ChannelType } from "@/types/database";

// ── Topic model ─────────────────────────────────────────────
export type RelatedTopic =
  | "sports"
  | "wellness"
  | "food"
  | "music"
  | "art"
  | "civic"
  | "business"
  | "tech"
  | "education"
  | "faith"
  | "comedy"
  | "talk"
  | "home"
  | "fashion"
  | "community";

export interface RelatedItem {
  id: string;
  kind: "event" | "resource" | "business" | "promo" | "exhibit";
  href: string;
  title: string;
  subtitle?: string;
  image_url: string | null;
  chip?: { label: string; tone: "gold" | "coral" | "emerald" | "cyan" | "purple" | "blue" | "pink" };
  /** Small "AD" flag for chain businesses + food promos */
  isAd?: boolean;
}

export interface RelatedToLiveData {
  /** The channel_video id this rail was built for */
  videoId: string;
  topic: RelatedTopic;
  label: string;
  accent: string;
  headline: string;
  items: RelatedItem[];
}

// Channel.type → RelatedTopic normalisation
function channelTypeToTopic(t: ChannelType | null | undefined): RelatedTopic {
  switch (t) {
    case "sports":
      return "sports";
    case "wellness":
      return "wellness";
    case "food":
      return "food";
    case "music":
      return "music";
    case "art":
    case "museum":
      return "art";
    case "civic":
    case "city":
    case "organization":
      return "civic";
    case "business":
      return "business";
    case "tech":
      return "tech";
    case "education":
    case "school":
      return "education";
    case "faith":
      return "faith";
    case "comedy":
      return "comedy";
    case "talk":
    case "media":
      return "talk";
    case "home":
      return "home";
    case "fashion":
      return "fashion";
    default:
      return "community";
  }
}

const TOPIC_META: Record<
  RelatedTopic,
  { label: string; accent: string; headline: string }
> = {
  sports: {
    label: "Sports",
    accent: "#3B82F6",
    headline: "Sports near you",
  },
  wellness: {
    label: "Wellness",
    accent: "#22C55E",
    headline: "Mental health & wellness resources",
  },
  food: {
    label: "Food",
    accent: "#FF6B6B",
    headline: "Eat local",
  },
  music: {
    label: "Music",
    accent: "#8B5CF6",
    headline: "Music & live culture",
  },
  art: {
    label: "Art",
    accent: "#8B5CF6",
    headline: "On view in Compton",
  },
  civic: {
    label: "Civic",
    accent: "#06B6D4",
    headline: "City happenings",
  },
  business: {
    label: "Business",
    accent: "#F2A900",
    headline: "Local business & opportunities",
  },
  tech: {
    label: "Tech",
    accent: "#06B6D4",
    headline: "Tech & jobs",
  },
  education: {
    label: "Education",
    accent: "#22C55E",
    headline: "Schools, scholarships, programs",
  },
  faith: {
    label: "Faith",
    accent: "#F2A900",
    headline: "Faith & community",
  },
  comedy: {
    label: "Comedy",
    accent: "#F2A900",
    headline: "Nights out in the city",
  },
  talk: {
    label: "Talk",
    accent: "#3B82F6",
    headline: "What Compton is talking about",
  },
  home: {
    label: "Home",
    accent: "#22C55E",
    headline: "Home & housing",
  },
  fashion: {
    label: "Fashion",
    accent: "#EC4899",
    headline: "Style + retail",
  },
  community: {
    label: "Community",
    accent: "#F2A900",
    headline: "Happening in Compton",
  },
};

// Map a topic to event categories in the events.category enum.
// event_category values: city, sports, culture, community, school, youth, business, networking
function topicToEventCategories(t: RelatedTopic): string[] {
  switch (t) {
    case "sports": return ["sports"];
    case "music":
    case "art":
    case "fashion":
    case "comedy": return ["culture", "community"];
    case "civic": return ["city", "community"];
    case "business":
    case "tech": return ["business", "networking"];
    case "education": return ["school", "youth"];
    case "wellness": return ["community", "youth"];
    case "faith": return ["community"];
    case "food":
    case "home":
    case "talk":
    case "community":
    default: return ["community", "culture", "city"];
  }
}

// resource_category values: business, housing, health, youth, jobs, food, legal, senior, education, veterans, utilities
function topicToResourceCategories(t: RelatedTopic): string[] {
  switch (t) {
    case "wellness": return ["health", "senior"];
    case "education": return ["education", "youth"];
    case "business":
    case "tech": return ["business", "jobs"];
    case "home": return ["housing", "utilities"];
    case "civic": return ["legal", "veterans"];
    case "food": return ["food"];
    case "sports":
    case "music":
    case "art": return ["youth"];
    default: return [];
  }
}

// business_category values: restaurant, barber, retail, services, auto, health, beauty, entertainment, other
function topicToBusinessCategories(t: RelatedTopic): string[] {
  switch (t) {
    case "food": return ["restaurant"];
    case "wellness": return ["health", "beauty"];
    case "fashion": return ["retail", "beauty"];
    case "home": return ["services", "retail"];
    case "sports":
    case "music":
    case "art":
    case "comedy": return ["entertainment"];
    case "business":
    case "tech":
    case "talk":
    case "civic": return ["services", "retail"];
    default: return [];
  }
}

// ── Builder ────────────────────────────────────────────────
interface Row<T> { data: T | null }

/** Pick the broadcast that is currently on-air (mirrors LiveSimulatedPlayer). */
export function findCurrentBroadcast(
  schedule: ScheduledBroadcast[],
  now: number = Date.now()
): ScheduledBroadcast | null {
  if (!schedule.length) return null;
  let idx = schedule.length - 1;
  for (let i = 0; i < schedule.length; i++) {
    const starts = new Date(schedule[i].starts_at).getTime();
    const ends = new Date(schedule[i].ends_at).getTime();
    if (now >= starts && now < ends) { idx = i; break; }
    if (now < starts) { idx = Math.max(0, i - 1); break; }
  }
  return schedule[idx] ?? null;
}

/** Build the related rail for the schedule's currently-on-air video. */
export async function buildRelatedToLive(
  supabase: SupabaseClient,
  schedule: ScheduledBroadcast[]
): Promise<RelatedToLiveData | null> {
  const current = findCurrentBroadcast(schedule);
  if (!current?.video_id) return null;
  return buildRelatedForVideo(supabase, current.video_id);
}

/**
 * Build the related rail for a specific channel_video id. Used both by the
 * server for the initial render and by `GET /api/live/related` whenever the
 * live player advances to the next scheduled broadcast.
 */
export async function buildRelatedForVideo(
  supabase: SupabaseClient,
  videoId: string
): Promise<RelatedToLiveData | null> {
  if (!videoId) return null;

  // Resolve the video's channel type → topic
  const { data: videoChannel } = (await supabase
    .from("channel_videos")
    .select("channel:channels(type)")
    .eq("id", videoId)
    .single()) as unknown as Row<{ channel: { type: ChannelType | null } | null }>;

  const topic = channelTypeToTopic(videoChannel?.channel?.type ?? null);
  const meta = TOPIC_META[topic];

  const todayIso = new Date().toISOString().slice(0, 10);
  const nowIso = new Date().toISOString();

  // Parallel fetch across relevant tables. Each is capped small so the
  // final rail has 5-6 items with variety.
  const [
    { data: rawEvents },
    { data: rawResources },
    { data: rawBusinesses },
    { data: rawPromos },
  ] = await Promise.all([
    supabase
      .from("events")
      .select("id, title, slug, start_date, location_name, category, image_url")
      .eq("is_published", true)
      .gte("start_date", todayIso)
      .in("category", topicToEventCategories(topic))
      .order("start_date", { ascending: true })
      .limit(4),
    topicToResourceCategories(topic).length > 0
      ? supabase
          .from("resources")
          .select("id, name, slug, category, description, image_url")
          .eq("is_published", true)
          .in("category", topicToResourceCategories(topic))
          .limit(3)
      : Promise.resolve({ data: [] as Array<{ id: string; name: string; slug: string; category: string; description: string | null; image_url: string | null }> }),
    topicToBusinessCategories(topic).length > 0
      ? supabase
          .from("businesses")
          .select("id, slug, name, category, account_type, image_urls, description, is_featured")
          .eq("is_published", true)
          .in("category", topicToBusinessCategories(topic))
          .order("is_featured", { ascending: false })
          .limit(3)
      : Promise.resolve({ data: [] as Array<{ id: string; slug: string; name: string; category: string; account_type?: string | null; image_urls: string[] | null; description: string | null; is_featured: boolean | null }> }),
    // Only surface food promos when topic is food
    topic === "food"
      ? supabase
          .from("food_promotions")
          .select("id, title, description, promo_type, image_url, valid_until, business:businesses!food_promotions_business_id_fkey(id, slug, name, image_urls, account_type)")
          .eq("is_active", true)
          .gte("valid_until", nowIso)
          .limit(2)
      : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
  ]);

  const items: RelatedItem[] = [];

  for (const e of (rawEvents ?? []) as Array<{
    id: string; title: string; slug: string; start_date: string;
    location_name: string | null; category: string; image_url: string | null;
  }>) {
    items.push({
      id: `event:${e.id}`,
      kind: "event",
      href: `/events/${e.slug || e.id}`,
      title: e.title,
      subtitle: e.location_name ?? new Date(e.start_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      image_url: e.image_url,
      chip: { label: "Event", tone: "gold" },
    });
  }

  for (const r of (rawResources ?? []) as Array<{
    id: string; name: string; slug: string; category: string;
    description: string | null; image_url: string | null;
  }>) {
    items.push({
      id: `resource:${r.id}`,
      kind: "resource",
      href: `/resources/${r.slug || r.id}`,
      title: r.name,
      subtitle: r.description ?? r.category,
      image_url: r.image_url,
      chip: { label: "Resource", tone: "cyan" },
    });
  }

  for (const b of (rawBusinesses ?? []) as Array<{
    id: string; slug: string; name: string; category: string;
    account_type?: string | null; image_urls: string[] | null;
    description: string | null; is_featured: boolean | null;
  }>) {
    const isAd = b.account_type === "ads_only";
    items.push({
      id: `business:${b.id}`,
      kind: "business",
      href: `/business/${b.slug || b.id}`,
      title: b.name,
      subtitle: b.description ?? b.category,
      image_url: (b.image_urls && b.image_urls[0]) || null,
      chip: isAd ? { label: "Ad", tone: "gold" } : { label: "Local", tone: "emerald" },
      isAd,
    });
  }

  interface PromoRow {
    id: string; title: string; description: string | null; promo_type: string;
    image_url: string | null; valid_until: string;
    business: { id: string; slug: string; name: string; image_urls: string[] | null; account_type?: string | null } | null;
  }
  for (const p of (rawPromos ?? []) as unknown as PromoRow[]) {
    if (!p.business) continue;
    const isAd = p.business.account_type === "ads_only";
    items.push({
      id: `promo:${p.id}`,
      kind: "promo",
      href: `/business/${p.business.slug || p.business.id}`,
      title: p.title,
      subtitle: p.business.name,
      image_url: p.image_url || (p.business.image_urls && p.business.image_urls[0]) || null,
      chip: { label: isAd ? "Ad" : "Deal", tone: "coral" },
      isAd,
    });
  }

  // De-dup by id (shouldn't collide since we prefixed, but belt + suspenders)
  const seen = new Set<string>();
  const deduped = items.filter((i) => (seen.has(i.id) ? false : (seen.add(i.id), true)));

  if (deduped.length === 0) return null;

  // Cap at 8 so the rail stays snappy; server already limits per-source.
  return {
    videoId,
    topic,
    label: meta.label,
    accent: meta.accent,
    headline: meta.headline,
    items: deduped.slice(0, 8),
  };
}
