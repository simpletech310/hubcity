import type { SupabaseClient } from "@supabase/supabase-js";
import type { ExploreItem, ExploreKind, ExploreBadgeVariant } from "@/types/database";

const ROLE_TO_VARIANT: Record<string, ExploreBadgeVariant> = {
  city_ambassador: "purple",
  admin: "blue",
  business_owner: "emerald",
  content_creator: "coral",
  creator: "coral",
  resource_provider: "cyan",
  chamber_admin: "purple",
  school: "emerald",
};

const ROLE_TO_ACCENT: Record<string, string> = {
  city_ambassador: "#8B5CF6",
  admin: "#8B5CF6",
  business_owner: "#22C55E",
  content_creator: "#FF6B6B",
  creator: "#FF6B6B",
  resource_provider: "#06B6D4",
  chamber_admin: "#8B5CF6",
  school: "#22C55E",
};

const CATEGORY_ACCENT: Record<string, string> = {
  culture: "#8B5CF6",
  music: "#8B5CF6",
  sports: "#3B82F6",
  community: "#22C55E",
  school: "#22C55E",
  youth: "#FF6B6B",
  business: "#F2A900",
  networking: "#F2A900",
  city: "#06B6D4",
};

/**
 * Stable-per-day seeded shuffle + same-kind-adjacency guard.
 * Given an array of items, returns a new array where no two adjacent
 * items share the same `kind` (unless impossible — then best effort).
 */
export function interleaveByKind<T extends { kind: ExploreKind }>(
  items: T[],
  seed = 0
): T[] {
  if (items.length <= 1) return items.slice();

  // Seeded PRNG (mulberry32)
  let s = seed >>> 0 || 1;
  const rand = () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  // Bucket by kind
  const byKind = new Map<ExploreKind, T[]>();
  for (const item of items) {
    const arr = byKind.get(item.kind) ?? [];
    arr.push(item);
    byKind.set(item.kind, arr);
  }

  // Shuffle each bucket deterministically
  for (const arr of byKind.values()) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  const result: T[] = [];
  let lastKind: ExploreKind | null = null;

  while (result.length < items.length) {
    // Candidate kinds (exclude lastKind if possible)
    const kinds: ExploreKind[] = [];
    for (const [kind, arr] of byKind) {
      if (arr.length > 0 && kind !== lastKind) kinds.push(kind);
    }
    // Fallback: only lastKind has items left
    if (kinds.length === 0) {
      for (const [kind, arr] of byKind) {
        if (arr.length > 0) kinds.push(kind);
      }
    }

    // Weighted pick: prefer the kind with the most remaining items so we
    // don't end up with a trailing cluster of one kind.
    kinds.sort((a, b) => (byKind.get(b)!.length - byKind.get(a)!.length));
    // But still inject a bit of randomness among the top few
    const top = kinds.slice(0, Math.min(3, kinds.length));
    const chosen = top[Math.floor(rand() * top.length)];

    const bucket = byKind.get(chosen)!;
    const next = bucket.shift()!;
    result.push(next);
    lastKind = chosen;
  }

  return result;
}

function dailySeed(): number {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

interface BuildOptions {
  limit?: number;
}

// Row shapes are loosely typed since we select specific columns.
type ProfileRow = {
  id: string;
  display_name: string;
  handle: string | null;
  avatar_url: string | null;
  role: string | null;
  bio: string | null;
};

type PostRow = {
  id: string;
  image_url: string | null;
  body: string | null;
  hashtags: string[] | null;
  created_at: string;
  author?: ProfileRow | null;
};

type EventRow = {
  id: string;
  title: string;
  slug: string;
  image_url: string | null;
  category: string | null;
  start_date: string;
  location_name: string | null;
  is_featured: boolean | null;
};

type ShowRow = {
  id: string;
  slug: string;
  title: string;
  tagline: string | null;
  poster_url: string | null;
  channel?: { id: string; name: string; slug: string | null } | null;
};

type BusinessRow = {
  id: string;
  slug: string;
  name: string;
  image_urls: string[] | null;
  category: string | null;
  account_type?: string | null;
  description: string | null;
};

type ExhibitRow = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  cover_image_url: string | null;
};

type GalleryRow = {
  id: string;
  slug: string;
  title: string;
  item_type: string | null;
  image_urls: string[] | null;
  artist_name: string | null;
};

type MuralRow = {
  id: string;
  title: string;
  artist_name: string | null;
  image_urls: string[] | null;
};

function firstImage(urls: string[] | null | undefined): string | null {
  return urls && urls.length > 0 ? urls[0] : null;
}

export async function buildExploreFeed(
  supabase: SupabaseClient,
  { limit = 60 }: BuildOptions = {}
): Promise<ExploreItem[]> {
  const todayISO = new Date().toISOString().slice(0, 10);

  const [
    { data: creatorRows },
    { data: postRows },
    { data: eventRows },
    { data: showRows },
    { data: businessRows },
    { data: exhibitRows },
    { data: galleryRows },
    { data: muralRows },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, display_name, handle, avatar_url, role, bio")
      .in("role", [
        "city_ambassador",
        "business_owner",
        "content_creator",
        "creator",
        "resource_provider",
        "chamber_admin",
      ])
      .not("handle", "is", null)
      .limit(30),
    supabase
      .from("posts")
      .select(
        "id, image_url, body, hashtags, created_at, author:profiles!posts_author_id_fkey(id, display_name, handle, avatar_url, role, bio)"
      )
      .not("image_url", "is", null)
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("events")
      .select("id, title, slug, image_url, category, start_date, location_name, is_featured")
      .eq("is_published", true)
      .gte("start_date", todayISO)
      .order("start_date", { ascending: true })
      .limit(15),
    supabase
      .from("shows")
      .select("id, slug, title, tagline, poster_url, channel:channels!shows_channel_id_fkey(id, name, slug)")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .limit(10),
    supabase
      .from("businesses")
      .select("id, slug, name, image_urls, category, account_type, description")
      .eq("is_published", true)
      .or("is_featured.eq.true,account_type.eq.ads_only")
      .limit(15),
    supabase
      .from("museum_exhibits")
      .select("id, slug, title, subtitle, cover_image_url")
      .eq("is_published", true)
      .order("is_featured", { ascending: false })
      .order("display_order", { ascending: true })
      .limit(8),
    supabase
      .from("gallery_items")
      .select("id, slug, title, item_type, image_urls, artist_name")
      .eq("is_published", true)
      .in("item_type", ["artwork", "photo", "poster"])
      .order("display_order", { ascending: true })
      .limit(12),
    supabase
      .from("murals")
      .select("id, title, artist_name, image_urls")
      .eq("is_published", true)
      .limit(8),
  ]);

  const items: ExploreItem[] = [];

  for (const p of (creatorRows ?? []) as ProfileRow[]) {
    if (!p.handle) continue;
    const role = p.role ?? "citizen";
    items.push({
      id: `creator:${p.id}`,
      kind: "creator",
      href: `/user/${p.handle}`,
      image_url: p.avatar_url,
      title: p.display_name,
      subtitle: p.bio ?? undefined,
      accentColor: ROLE_TO_ACCENT[role] ?? "#F2A900",
      aspectHint: "square",
      chip: ROLE_TO_VARIANT[role]
        ? { label: role.replace("_", " "), variant: ROLE_TO_VARIANT[role] }
        : undefined,
      meta: { role },
    });
  }

  for (const post of (postRows ?? []) as unknown as PostRow[]) {
    if (!post.image_url) continue;
    const author = post.author ?? null;
    const firstTag =
      post.hashtags && post.hashtags.length > 0 ? post.hashtags[0] : null;
    items.push({
      id: `post:${post.id}`,
      kind: "post",
      href: author?.handle ? `/user/${author.handle}` : `/pulse`,
      image_url: post.image_url,
      title: firstTag || (post.body ?? "").slice(0, 40) || "Post",
      subtitle: post.body?.slice(0, 80) ?? undefined,
      aspectHint: "portrait",
      meta: author
        ? {
            author: {
              name: author.display_name,
              avatar_url: author.avatar_url,
              handle: author.handle ?? "",
            },
          }
        : undefined,
    });
  }

  for (const event of (eventRows ?? []) as EventRow[]) {
    const accent =
      CATEGORY_ACCENT[event.category ?? ""] ?? "#F2A900";
    items.push({
      id: `event:${event.id}`,
      kind: "event",
      href: `/events/${event.slug || event.id}`,
      image_url: event.image_url,
      title: event.title,
      subtitle: event.location_name ?? undefined,
      accentColor: accent,
      aspectHint: "landscape",
      chip: { label: "Event", variant: "gold" },
      meta: { date: event.start_date },
    });
  }

  for (const show of (showRows ?? []) as unknown as ShowRow[]) {
    items.push({
      id: `show:${show.id}`,
      kind: "show",
      href: `/live/shows/${show.slug}`,
      image_url: show.poster_url,
      title: show.title,
      subtitle: show.tagline ?? show.channel?.name ?? undefined,
      aspectHint: "portrait",
      chip: { label: "Show", variant: "pink" },
    });
  }

  for (const biz of (businessRows ?? []) as BusinessRow[]) {
    const isAd = biz.account_type === "ads_only";
    items.push({
      id: `business:${biz.id}`,
      kind: "business",
      href: `/business/${biz.slug || biz.id}`,
      image_url: firstImage(biz.image_urls),
      title: biz.name,
      subtitle: biz.description ?? biz.category ?? undefined,
      aspectHint: "square",
      chip: isAd
        ? { label: "Ad", variant: "gold" }
        : { label: "Local", variant: "emerald" },
      meta: { isAd },
    });
  }

  for (const ex of (exhibitRows ?? []) as ExhibitRow[]) {
    items.push({
      id: `exhibit:${ex.id}`,
      kind: "exhibit",
      href: `/culture/exhibits/${ex.slug}`,
      image_url: ex.cover_image_url,
      title: ex.title,
      subtitle: ex.subtitle ?? undefined,
      aspectHint: "landscape",
      chip: { label: "Exhibit", variant: "purple" },
    });
  }

  for (const art of (galleryRows ?? []) as GalleryRow[]) {
    items.push({
      id: `artwork:${art.id}`,
      kind: "artwork",
      href: `/culture/gallery/${art.slug}`,
      image_url: firstImage(art.image_urls),
      title: art.title,
      subtitle: art.artist_name ?? undefined,
      aspectHint: "portrait",
      chip: { label: art.item_type ?? "Art", variant: "purple" },
    });
  }

  for (const mural of (muralRows ?? []) as MuralRow[]) {
    items.push({
      id: `mural:${mural.id}`,
      kind: "mural",
      href: `/culture/murals/${mural.id}`,
      image_url: firstImage(mural.image_urls),
      title: mural.title,
      subtitle: mural.artist_name ?? undefined,
      aspectHint: "landscape",
      chip: { label: "Mural", variant: "coral" },
    });
  }

  // Drop items with no image OR no title (visual feed needs something to show)
  const visible = items.filter((i) => i.image_url || i.kind === "creator");

  const interleaved = interleaveByKind(visible, dailySeed());
  return interleaved.slice(0, limit);
}
