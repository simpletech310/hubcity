import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getGeneralRateLimiter, checkRateLimit } from "@/lib/ratelimit";

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get("q")?.trim();

    if (!q || q.length < 2) {
      return NextResponse.json(
        { error: "Query must be at least 2 characters" },
        { status: 400 }
      );
    }

    // Rate limit by IP
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0] ??
      request.headers.get("x-real-ip") ??
      "anonymous";

    try {
      const limiter = getGeneralRateLimiter();
      const { success } = await checkRateLimit(limiter, `search:${ip}`);
      if (!success) {
        return NextResponse.json(
          { error: "Too many requests. Please wait a moment." },
          { status: 429 }
        );
      }
    } catch {
      // Fail open if Redis is unavailable
    }

    const supabase = await createClient();
    const pattern = `%${q}%`;

    // Search all content types in parallel
    const [
      { data: profiles },
      { data: posts },
      { data: businesses },
      { data: events },
      { data: schools },
      { data: channels },
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, display_name, handle, avatar_url, bio")
        .or(`display_name.ilike.${pattern},handle.ilike.${pattern}`)
        .limit(5),
      supabase
        .from("posts")
        .select("id, body, author_id, created_at, like_count, profiles!posts_author_id_fkey(display_name, handle, avatar_url)")
        .eq("is_published", true)
        .ilike("body", pattern)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("businesses")
        .select("id, name, slug, category, description, address, image_urls")
        .eq("is_published", true)
        .or(`name.ilike.${pattern},description.ilike.${pattern}`)
        .limit(5),
      supabase
        .from("events")
        .select("id, title, slug, category, start_date, start_time, location_name, image_url")
        .eq("is_published", true)
        .or(`title.ilike.${pattern},description.ilike.${pattern}`)
        .order("start_date", { ascending: false })
        .limit(5),
      supabase
        .from("schools")
        .select("id, name, slug, level, address")
        .ilike("name", pattern)
        .limit(5),
      supabase
        .from("channels")
        .select("id, name, slug, description, type, avatar_url")
        .or(`name.ilike.${pattern},description.ilike.${pattern}`)
        .limit(5),
    ]);

    const results = {
      people: (profiles ?? []).map((p) => ({
        id: p.id,
        title: p.display_name,
        subtitle: p.handle ? `@${p.handle}` : null,
        description: p.bio,
        image: p.avatar_url,
        link: `/profile/${p.handle || p.id}`,
      })),
      posts: (posts ?? []).map((p) => {
        const author =
          p.profiles && !Array.isArray(p.profiles)
            ? p.profiles
            : Array.isArray(p.profiles)
              ? p.profiles[0]
              : null;
        return {
          id: p.id,
          title: (p.body as string).slice(0, 120) + ((p.body as string).length > 120 ? "..." : ""),
          subtitle: author
            ? `${author.display_name}${author.handle ? ` @${author.handle}` : ""}`
            : null,
          description: null,
          image: author?.avatar_url ?? null,
          link: `/pulse/post/${p.id}`,
        };
      }),
      businesses: (businesses ?? []).map((b) => ({
        id: b.id,
        title: b.name,
        subtitle: b.category,
        description: b.address,
        image: b.image_urls?.[0] ?? null,
        link: `/business/${b.slug}`,
      })),
      events: (events ?? []).map((e) => ({
        id: e.id,
        title: e.title,
        subtitle: e.category,
        description: e.location_name,
        image: e.image_url,
        link: `/events/${e.id}`,
      })),
      schools: (schools ?? []).map((s) => ({
        id: s.id,
        title: s.name,
        subtitle: s.level,
        description: s.address,
        image: null,
        link: `/schools/${s.slug || s.id}`,
      })),
      channels: (channels ?? []).map((c) => ({
        id: c.id,
        title: c.name,
        subtitle: c.type,
        description: c.description,
        image: c.avatar_url,
        link: `/channels/${c.slug}`,
      })),
    };

    const total = Object.values(results).reduce(
      (sum, arr) => sum + arr.length,
      0
    );

    return NextResponse.json({ results, total });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
