import { createClient } from "@/lib/supabase/server";

export type SearchKind =
  | "event"
  | "creator"
  | "business"
  | "album"
  | "group"
  | "post";

export interface SearchHit {
  kind: SearchKind;
  id: string;
  title: string;
  subtitle: string | null;
  image: string | null;
  href: string;
}

export interface SearchResults {
  q: string;
  hits: Record<SearchKind, SearchHit[]>;
  total: number;
}

const PER_KIND = 5;

/**
 * Public unified search — `ilike` across the major entity tables. Capped
 * at PER_KIND hits per kind. Once content scales past ~10k rows we'll
 * swap this out for a `search_index` materialized view + ts_vector
 * ranking.
 */
export async function searchAll(qRaw: string): Promise<SearchResults> {
  const q = qRaw.trim();
  const out: SearchResults = {
    q,
    hits: {
      event: [],
      creator: [],
      business: [],
      album: [],
      group: [],
      post: [],
    },
    total: 0,
  };
  if (q.length < 2) return out;

  const supabase = await createClient();
  const like = `%${q}%`;

  // Run all queries in parallel — each is bounded to PER_KIND.
  const [events, creators, businesses, albums, groups, posts] =
    await Promise.all([
      supabase
        .from("events")
        .select("id, slug, title, location_name, image_url, start_date")
        .eq("is_published", true)
        .or(
          `title.ilike.${like},description.ilike.${like},location_name.ilike.${like}`,
        )
        .order("start_date", { ascending: false })
        .limit(PER_KIND),
      supabase
        .from("profiles")
        .select("id, handle, display_name, avatar_url, bio")
        .not("handle", "is", null)
        .or(`display_name.ilike.${like},handle.ilike.${like},bio.ilike.${like}`)
        .limit(PER_KIND),
      supabase
        .from("businesses")
        .select("id, slug, name, category, image_urls, address")
        .eq("is_published", true)
        .or(
          `name.ilike.${like},description.ilike.${like},category.ilike.${like}`,
        )
        .limit(PER_KIND),
      supabase
        .from("albums")
        .select("id, slug, title, cover_art_url, release_type")
        .eq("is_published", true)
        .or(`title.ilike.${like},description.ilike.${like}`)
        .limit(PER_KIND),
      supabase
        .from("community_groups")
        .select("id, slug, name, description, image_url, avatar_url")
        .eq("is_active", true)
        .eq("is_public", true)
        .or(`name.ilike.${like},description.ilike.${like}`)
        .limit(PER_KIND),
      supabase
        .from("posts")
        .select("id, content, image_url")
        .ilike("content", like)
        .order("created_at", { ascending: false })
        .limit(PER_KIND),
    ]);

  for (const e of events.data ?? []) {
    out.hits.event.push({
      kind: "event",
      id: e.id,
      title: e.title,
      subtitle: e.location_name ?? e.start_date,
      image: e.image_url,
      href: `/events/${e.slug || e.id}`,
    });
  }
  for (const c of creators.data ?? []) {
    out.hits.creator.push({
      kind: "creator",
      id: c.id,
      title: c.display_name || `@${c.handle}`,
      subtitle: c.handle ? `@${c.handle}` : null,
      image: c.avatar_url,
      href: `/user/${c.handle}`,
    });
  }
  for (const b of businesses.data ?? []) {
    out.hits.business.push({
      kind: "business",
      id: b.id,
      title: b.name,
      subtitle: b.category ?? b.address,
      image: b.image_urls?.[0] ?? null,
      href: `/business/${b.slug || b.id}`,
    });
  }
  for (const a of albums.data ?? []) {
    out.hits.album.push({
      kind: "album",
      id: a.id,
      title: a.title,
      subtitle: a.release_type?.toUpperCase() ?? null,
      image: a.cover_art_url,
      href: `/frequency/album/${a.slug}`,
    });
  }
  for (const g of groups.data ?? []) {
    out.hits.group.push({
      kind: "group",
      id: g.id,
      title: g.name,
      subtitle: g.description?.slice(0, 80) ?? null,
      image: g.image_url || g.avatar_url,
      href: `/groups/${g.slug || g.id}`,
    });
  }
  for (const p of posts.data ?? []) {
    out.hits.post.push({
      kind: "post",
      id: p.id,
      title: (p.content ?? "").slice(0, 80) || "Untitled post",
      subtitle: null,
      image: p.image_url ?? null,
      href: `/pulse?post=${p.id}`,
    });
  }

  out.total = (
    Object.values(out.hits) as SearchHit[][]
  ).reduce((s, arr) => s + arr.length, 0);
  return out;
}
