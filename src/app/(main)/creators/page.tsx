import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveCity } from "@/lib/city-context";
import Icon from "@/components/ui/Icon";
import CreatorCard, { type WorkItem } from "@/components/creators/CreatorCard";
import { resolveFeaturedMedia, type FeaturedMedia } from "@/lib/featured-media";
import { deriveDiscipline } from "@/lib/creator-discipline";

// Valid user_role enum values that count as a "creator" in Discover.
const CREATOR_ROLES = [
  "content_creator",
  "city_ambassador",
  "resource_provider",
  "chamber_admin",
] as const;

type RoleKey = (typeof CREATOR_ROLES)[number];

const ROLE_LABEL: Record<RoleKey, string> = {
  content_creator: "Creator",
  city_ambassador: "Ambassador",
  resource_provider: "Community",
  chamber_admin: "Chamber",
};

function isRoleKey(v: string): v is RoleKey {
  return (CREATOR_ROLES as readonly string[]).includes(v);
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Discover | Culture",
    description: "Find things to watch. Meet the creators making it.",
  };
}

type CreatorProfile = {
  id: string;
  display_name: string;
  handle: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: string | null;
  verification_status: string | null;
  profile_tags: string[] | null;
  creator_tier: "starter" | "rising" | "partner" | "premium" | null;
  featured_kind: "reel" | "video" | "post" | "track" | "exhibit" | null;
  featured_id: string | null;
  featured_caption: string | null;
  city: { slug: string; name: string } | null;
};

type CreatorPost = {
  id: string;
  image_url: string | null;
  video_url: string | null;
  media_type: string | null;
  body: string;
  author_id: string;
  created_at: string;
};

type CreatorReel = {
  id: string;
  video_url: string;
  poster_url: string | null;
  caption: string | null;
  author_id: string;
  like_count: number;
};

type CreatorChannel = {
  id: string;
  slug: string | null;
  name: string;
  owner_id: string;
  follower_count: number;
};

type CreatorVideo = {
  id: string;
  title: string;
  thumbnail_url: string | null;
  mux_playback_id: string | null;
  duration: number | null;
  channel_id: string;
};

type SearchParams = { role?: string; city?: string };

export default async function CreatorsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const supabase = await createClient();
  const activeCity = await getActiveCity();

  const sp = await searchParams;
  const selectedRole: RoleKey | "all" =
    sp.role && isRoleKey(sp.role) ? sp.role : "all";
  const selectedCitySlug = sp.city && sp.city !== "all" ? sp.city : "all";

  const { data: cityRows } = await supabase
    .from("cities")
    .select("id, slug, name")
    .eq("launch_status", "live")
    .order("name", { ascending: true });
  const liveCities = (cityRows ?? []) as { id: string; slug: string; name: string }[];
  const selectedCity =
    selectedCitySlug === "all"
      ? null
      : liveCities.find((c) => c.slug === selectedCitySlug) ?? null;

  let query = supabase
    .from("profiles")
    .select(
      "id, display_name, handle, avatar_url, bio, role, verification_status, profile_tags, creator_tier, featured_kind, featured_id, featured_caption, city:cities!profiles_city_id_fkey(slug, name)"
    )
    .in("role", CREATOR_ROLES as unknown as string[])
    .not("handle", "is", null);
  if (selectedRole !== "all") query = query.eq("role", selectedRole);
  if (selectedCity) query = query.eq("city_id", selectedCity.id);

  const { data: creatorRows } = await query.order("display_name", { ascending: true });
  const creators = (creatorRows ?? []) as unknown as CreatorProfile[];

  function filterHref(nextRole: string, nextCity: string) {
    const params = new URLSearchParams();
    if (nextRole !== "all") params.set("role", nextRole);
    if (nextCity !== "all") params.set("city", nextCity);
    const qs = params.toString();
    return qs ? `/creators?${qs}` : "/creators";
  }

  const creatorIds = creators.map((c) => c.id);
  const nowISO = new Date().toISOString();

  const [postsRes, reelsRes, channelsRes, albumsRes, galleryRes] =
    creatorIds.length === 0
      ? [{ data: [] }, { data: [] }, { data: [] }, { data: [] }, { data: [] }]
      : await Promise.all([
          supabase
            .from("posts")
            .select("id, image_url, video_url, media_type, body, author_id, created_at")
            .in("author_id", creatorIds)
            .eq("is_published", true)
            .order("created_at", { ascending: false })
            // Bumped 120 → 400 so a creator with a deep wall (e.g. the
            // museum @compton-museum has 13 posts + climbing) actually
            // gets enough rows to populate the portfolio grid instead
            // of being crowded out by everyone else's recent activity.
            .limit(400),
          supabase
            .from("reels")
            .select("id, video_url, poster_url, caption, author_id, like_count")
            .in("author_id", creatorIds)
            .eq("is_published", true)
            .or(`expires_at.is.null,expires_at.gt.${nowISO}`)
            .order("created_at", { ascending: false })
            .limit(160),
          supabase
            .from("channels")
            .select("id, slug, name, owner_id, follower_count")
            .in("owner_id", creatorIds)
            .eq("is_active", true),
          supabase
            .from("albums")
            .select("id, slug, title, cover_art_url, creator_id, release_date")
            .in("creator_id", creatorIds)
            .eq("is_published", true)
            .order("release_date", { ascending: false, nullsFirst: false })
            .limit(120),
          supabase
            .from("profile_gallery_images")
            .select("id, image_url, caption, owner_id, display_order")
            .in("owner_id", creatorIds)
            .order("display_order", { ascending: true })
            .limit(200),
        ]);

  const posts = (postsRes.data ?? []) as CreatorPost[];
  const reels = (reelsRes.data ?? []) as CreatorReel[];
  const channels = (channelsRes.data ?? []) as CreatorChannel[];
  type CreatorAlbum = { id: string; slug: string; title: string; cover_art_url: string | null; creator_id: string; release_date?: string | null };
  type CreatorGalleryImage = { id: string; image_url: string; caption: string | null; owner_id: string };
  const albums = (albumsRes.data ?? []) as CreatorAlbum[];
  const galleryImages = (galleryRes.data ?? []) as CreatorGalleryImage[];

  type HotPoster = {
    id: string;
    kind: "track" | "film" | "art";
    title: string;
    image: string | null;
    creator_handle: string | null;
    creator_name: string | null;
    href: string;
    sort_ts: number;
  };

  const channelIds = channels.map((c) => c.id);
  let videos: CreatorVideo[] = [];
  if (channelIds.length > 0) {
    const { data: videoRows } = await supabase
      .from("channel_videos")
      .select("id, title, thumbnail_url, mux_playback_id, duration, channel_id")
      .in("channel_id", channelIds)
      .eq("is_published", true)
      .eq("status", "ready")
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(60);
    videos = (videoRows ?? []) as CreatorVideo[];
  }

  // Indexes
  const postsByCreator = new Map<string, CreatorPost[]>();
  for (const p of posts) {
    const arr = postsByCreator.get(p.author_id) ?? [];
    arr.push(p);
    postsByCreator.set(p.author_id, arr);
  }
  const reelsByCreator = new Map<string, CreatorReel[]>();
  for (const r of reels) {
    const arr = reelsByCreator.get(r.author_id) ?? [];
    arr.push(r);
    reelsByCreator.set(r.author_id, arr);
  }
  const channelByOwner = new Map<string, CreatorChannel>();
  for (const ch of channels) channelByOwner.set(ch.owner_id, ch);
  const videosByChannel = new Map<string, CreatorVideo[]>();
  for (const v of videos) {
    const arr = videosByChannel.get(v.channel_id) ?? [];
    arr.push(v);
    videosByChannel.set(v.channel_id, arr);
  }
  const creatorById = new Map<string, CreatorProfile>();
  for (const c of creators) creatorById.set(c.id, c);

  // Unified "Hot Right Now" poster feed — songs (albums), films (channel
  // videos), and art (gallery images) interleaved by recency. Each tile
  // is a 2:3 magazine-style poster with a kind chip and creator
  // attribution. Posters tap into the canonical detail page for that
  // medium so the rail doubles as discovery.
  const hotPosters: HotPoster[] = [];
  for (const a of albums) {
    if (!a.cover_art_url) continue;
    const c = creatorById.get(a.creator_id);
    hotPosters.push({
      id: `track:${a.id}`,
      kind: "track",
      title: a.title,
      image: a.cover_art_url,
      creator_handle: c?.handle ?? null,
      creator_name: c?.display_name ?? null,
      href: `/frequency/album/${a.slug}`,
      sort_ts: a.release_date ? new Date(a.release_date).getTime() : 0,
    });
  }
  for (const v of videos) {
    const ch = channels.find((c) => c.id === v.channel_id);
    const c = ch ? creatorById.get(ch.owner_id) : null;
    const thumb =
      v.thumbnail_url ??
      (v.mux_playback_id
        ? `https://image.mux.com/${v.mux_playback_id}/thumbnail.webp?width=400&height=600&time=5&fit_mode=smartcrop`
        : null);
    if (!thumb) continue;
    hotPosters.push({
      id: `film:${v.id}`,
      kind: "film",
      title: v.title,
      image: thumb,
      creator_handle: c?.handle ?? null,
      creator_name: c?.display_name ?? null,
      href: `/live/watch/${v.id}`,
      // Videos already came back ordered by published_at desc; assign
      // a descending pseudo-timestamp so order is preserved when mixed.
      sort_ts: Date.now() - videos.indexOf(v) * 1000,
    });
  }
  for (const g of galleryImages) {
    const c = creatorById.get(g.owner_id);
    if (!c?.handle) continue;
    hotPosters.push({
      id: `art:${g.id}`,
      kind: "art",
      title: g.caption?.slice(0, 60) || `${c.display_name} — work`,
      image: g.image_url,
      creator_handle: c.handle,
      creator_name: c.display_name,
      href: `/user/${c.handle}`,
      sort_ts: Date.now() - galleryImages.indexOf(g) * 500,
    });
  }
  hotPosters.sort((a, b) => b.sort_ts - a.sort_ts);

  const albumsByCreator = new Map<string, CreatorAlbum[]>();
  for (const a of albums) {
    const arr = albumsByCreator.get(a.creator_id) ?? [];
    arr.push(a);
    albumsByCreator.set(a.creator_id, arr);
  }
  const galleryByOwner = new Map<string, CreatorGalleryImage[]>();
  for (const g of galleryImages) {
    const arr = galleryByOwner.get(g.owner_id) ?? [];
    arr.push(g);
    galleryByOwner.set(g.owner_id, arr);
  }

  // Resolve pinned featured-media for any creator who pinned one.
  const featuredByCreator = new Map<string, FeaturedMedia>();
  const pinned = creators.filter((c) => c.featured_kind && c.featured_id);
  if (pinned.length > 0) {
    const resolved = await Promise.all(
      pinned.map((c) =>
        resolveFeaturedMedia(supabase, {
          id: c.id,
          featured_kind: c.featured_kind,
          featured_id: c.featured_id,
          featured_caption: c.featured_caption,
        })
      )
    );
    pinned.forEach((c, i) => {
      const m = resolved[i];
      if (m) featuredByCreator.set(c.id, m);
    });
  }

  // Pick a "featured" creator — the one with the most combined media. Falls back
  // to first creator. Drives the magazine hero spotlight at the top.
  const scoreCreator = (c: CreatorProfile) => {
    const reelCount = (reelsByCreator.get(c.id) ?? []).length;
    const postCount = (postsByCreator.get(c.id) ?? []).filter((p) => p.image_url).length;
    const ch = channelByOwner.get(c.id);
    const vidCount = ch ? (videosByChannel.get(ch.id) ?? []).length : 0;
    const verifyBoost = c.verification_status === "verified" ? 2 : 0;
    return reelCount * 2 + postCount + vidCount * 3 + verifyBoost;
  };
  const sortedByScore = [...creators].sort((a, b) => scoreCreator(b) - scoreCreator(a));
  const featuredCreator = sortedByScore[0] ?? null;
  const featuredHasMedia = featuredCreator ? scoreCreator(featuredCreator) > 0 : false;

  // What's the hero piece of media for the featured creator?
  let featuredMedia: {
    kind: "reel" | "video" | "post";
    href: string;
    img: string | null;
    title: string | null;
    duration: number | null;
  } | null = null;
  if (featuredCreator && featuredHasMedia) {
    const fch = channelByOwner.get(featuredCreator.id);
    const fvids = fch ? videosByChannel.get(fch.id) ?? [] : [];
    const freels = reelsByCreator.get(featuredCreator.id) ?? [];
    const fposts = (postsByCreator.get(featuredCreator.id) ?? []).filter((p) => p.image_url);
    if (fvids.length > 0) {
      const v = fvids[0];
      const thumb =
        v.thumbnail_url ??
        (v.mux_playback_id
          ? `https://image.mux.com/${v.mux_playback_id}/thumbnail.webp?width=800&height=450&time=5`
          : null);
      featuredMedia = {
        kind: "video",
        href: `/live/watch/${v.id}`,
        img: thumb,
        title: v.title,
        duration: v.duration,
      };
    } else if (freels.length > 0) {
      const r = freels[0];
      featuredMedia = {
        kind: "reel",
        href: "/reels",
        img: r.poster_url,
        title: r.caption,
        duration: null,
      };
    } else if (fposts.length > 0) {
      const p = fposts[0];
      featuredMedia = {
        kind: "post",
        href: `/user/${featuredCreator.handle}`,
        img: p.image_url,
        title: null,
        duration: null,
      };
    }
  }

  // Remove the featured creator from the main loop so the spotlight isn't
  // duplicated below.
  const remainingCreators = featuredCreator
    ? creators.filter((c) => c.id !== featuredCreator.id)
    : creators;

  return (
    <div className="culture-surface min-h-dvh animate-fade-in pb-safe">

      {/* ── Masthead ─────────────────────────────────────────────── */}
      <header
        className="px-[18px] pt-6 pb-5"
        style={{ borderBottom: "3px solid var(--rule-strong-c)" }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="c-kicker" style={{ opacity: 0.65, fontSize: 9 }}>
            § VOL·01 · ISSUE DISCOVER
          </div>
          <div className="c-kicker" style={{ opacity: 0.65, fontSize: 9 }}>
            {(activeCity?.name ?? "EVERYWHERE").toUpperCase()}
          </div>
        </div>
        <h1
          className="c-hero"
          style={{ fontSize: 72, lineHeight: 0.84, letterSpacing: "-0.035em" }}
        >
          DISCOVER.
        </h1>
        <div className="flex items-baseline justify-between gap-3 mt-3">
          <p
            className="c-serif-it"
            style={{ fontSize: 15, lineHeight: 1.4, color: "var(--ink-strong)", opacity: 0.85 }}
          >
            Find things to watch. Meet the people making it.
          </p>
          <span
            className="c-kicker tabular-nums shrink-0"
            style={{ fontSize: 9, opacity: 0.5 }}
          >
            EST. 2026
          </span>
        </div>
      </header>

      {/* ── Stats strip ──────────────────────────────────────────── */}
      <div
        className="grid grid-cols-4"
        style={{ borderBottom: "3px solid var(--rule-strong-c)" }}
      >
        {[
          { label: "CREATORS", value: creators.length, gold: true },
          { label: "MOMENTS", value: reels.length },
          { label: "VIDEOS", value: videos.length },
          { label: "POSTS", value: posts.filter((p) => p.image_url).length },
        ].map((stat, i) => (
          <div
            key={stat.label}
            className="text-center"
            style={{
              padding: "14px 10px",
              borderRight: i < 3 ? "2px solid var(--rule-strong-c)" : "none",
              background: stat.gold ? "var(--gold-c)" : "var(--paper)",
            }}
          >
            <div className="c-display c-tabnum" style={{ fontSize: 22, lineHeight: 1 }}>
              {stat.value}
            </div>
            <div className="c-kicker mt-1.5" style={{ fontSize: 9 }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters ─────────────────────────────────────────────── */}
      <div
        className="px-5 pt-3 pb-3"
        style={{ borderBottom: "2px solid var(--rule-strong-c)" }}
      >
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {/* Role pills */}
          <Link
            href={filterHref("all", selectedCitySlug)}
            className="shrink-0 px-3 py-1.5 press"
            style={{
              background: selectedRole === "all" ? "var(--gold-c)" : "var(--paper)",
              color: "var(--ink-strong)",
              border: "2px solid var(--rule-strong-c)",
              fontFamily: "var(--font-archivo-narrow), sans-serif",
              fontSize: 11,
              fontWeight: selectedRole === "all" ? 800 : 600,
              letterSpacing: "0.06em",
            }}
          >
            ALL
          </Link>
          {(CREATOR_ROLES as readonly RoleKey[]).map((r) => (
            <Link
              key={r}
              href={filterHref(r, selectedCitySlug)}
              className="shrink-0 px-3 py-1.5 press"
              style={{
                background: selectedRole === r ? "var(--gold-c)" : "var(--paper)",
                color: "var(--ink-strong)",
                border: "2px solid var(--rule-strong-c)",
                fontFamily: "var(--font-archivo-narrow), sans-serif",
                fontSize: 11,
                fontWeight: selectedRole === r ? 800 : 600,
                letterSpacing: "0.06em",
              }}
            >
              {ROLE_LABEL[r].toUpperCase()}S
            </Link>
          ))}

          {/* Divider */}
          {liveCities.length > 0 && (
            <span
              className="shrink-0 self-stretch"
              style={{ width: 2, background: "var(--rule-strong-c)", margin: "2px 4px" }}
            />
          )}

          {/* City pills */}
          {liveCities.length > 0 && (
            <Link
              href={filterHref(selectedRole, "all")}
              className="shrink-0 px-3 py-1.5 press"
              style={{
                background: selectedCitySlug === "all" ? "var(--ink-strong)" : "var(--paper)",
                color: selectedCitySlug === "all" ? "var(--paper)" : "var(--ink-strong)",
                border: "2px solid var(--rule-strong-c)",
                fontFamily: "var(--font-archivo-narrow), sans-serif",
                fontSize: 11,
                fontWeight: selectedCitySlug === "all" ? 800 : 600,
                letterSpacing: "0.06em",
              }}
            >
              ALL CITIES
            </Link>
          )}
          {liveCities.map((c) => (
            <Link
              key={c.slug}
              href={filterHref(selectedRole, c.slug)}
              className="shrink-0 px-3 py-1.5 press"
              style={{
                background: selectedCitySlug === c.slug ? "var(--ink-strong)" : "var(--paper)",
                color: selectedCitySlug === c.slug ? "var(--paper)" : "var(--ink-strong)",
                border: "2px solid var(--rule-strong-c)",
                fontFamily: "var(--font-archivo-narrow), sans-serif",
                fontSize: 11,
                fontWeight: selectedCitySlug === c.slug ? 800 : 600,
                letterSpacing: "0.06em",
              }}
            >
              {c.name.toUpperCase()}
            </Link>
          ))}
        </div>

        {(selectedRole !== "all" || selectedCitySlug !== "all") && (
          <div className="flex items-center justify-between mt-2">
            <span className="c-kicker" style={{ fontSize: 9, opacity: 0.55 }}>
              {creators.length} result{creators.length === 1 ? "" : "s"}
            </span>
            <Link
              href="/creators"
              className="c-kicker press"
              style={{ fontSize: 9, color: "var(--ink-strong)" }}
            >
              CLEAR ×
            </Link>
          </div>
        )}
      </div>

      {/* ── FEATURED SPOTLIGHT ─ magazine cover-style hero for top creator ─ */}
      {featuredCreator && featuredMedia && (
        <section
          style={{
            background: "var(--ink-strong)",
            borderBottom: "3px solid var(--rule-strong-c)",
          }}
        >
          {/* Top byline strip */}
          <div
            className="flex items-center justify-between px-5 py-2.5"
            style={{ borderBottom: "1px solid rgba(242,169,0,0.35)" }}
          >
            <div className="flex items-center gap-2">
              <span
                style={{
                  width: 6,
                  height: 6,
                  background: "var(--gold-c)",
                  display: "inline-block",
                }}
              />
              <span
                className="c-kicker"
                style={{ fontSize: 9, color: "var(--gold-c)", letterSpacing: "0.14em" }}
              >
                THE COVER · TONIGHT&apos;S BIG STORY
              </span>
            </div>
            <span
              className="c-kicker"
              style={{ fontSize: 9, color: "var(--paper)", opacity: 0.55 }}
            >
              № 00
            </span>
          </div>

          {/* Featured media — wide cinema treatment */}
          <Link href={featuredMedia.href} className="block press relative">
            <div
              className="relative overflow-hidden"
              style={{
                aspectRatio: "16/10",
                background: "var(--ink-strong)",
                borderBottom: "2px solid var(--gold-c)",
              }}
            >
              {featuredMedia.img && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={featuredMedia.img}
                  alt=""
                  className="w-full h-full object-cover"
                  style={{ opacity: 0.78 }}
                />
              )}
              {/* Cinematic gradient — dark left for type, lighter right */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(26,21,18,0.92) 0%, rgba(26,21,18,0.55) 45%, rgba(26,21,18,0.25) 100%)",
                }}
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, transparent 50%, rgba(26,21,18,0.85) 100%)",
                }}
              />

              {/* Kind chip top-right */}
              <div className="absolute top-4 right-4">
                <div
                  className="inline-flex items-center gap-1.5 px-2 py-1"
                  style={{
                    background: "var(--gold-c)",
                    color: "var(--ink-strong)",
                  }}
                >
                  <Icon
                    name={featuredMedia.kind === "video" ? "film" : featuredMedia.kind === "reel" ? "video" : "photo"}
                    size={10}
                    style={{ color: "var(--ink-strong)" }}
                  />
                  <span className="c-kicker" style={{ fontSize: 9, color: "var(--ink-strong)" }}>
                    {featuredMedia.kind === "video"
                      ? "FEATURED FILM"
                      : featuredMedia.kind === "reel"
                      ? "REEL"
                      : "FROM THE FEED"}
                  </span>
                </div>
              </div>

              {/* Big play */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: 64,
                    height: 64,
                    background: "var(--gold-c)",
                    border: "3px solid var(--paper)",
                    boxShadow: "5px 5px 0 rgba(0,0,0,0.45)",
                  }}
                >
                  <svg width="22" height="22" fill="var(--ink-strong)" viewBox="0 0 10 10">
                    <polygon points="3,1.5 9,5 3,8.5" />
                  </svg>
                </div>
              </div>

              {/* Bottom slab — title + creator */}
              <div className="absolute inset-x-0 bottom-0 p-5">
                {featuredMedia.title && (
                  <h2
                    className="c-hero line-clamp-2 mb-2"
                    style={{
                      fontSize: 28,
                      lineHeight: 1.0,
                      letterSpacing: "-0.02em",
                      color: "var(--paper)",
                      textShadow: "0 2px 8px rgba(0,0,0,0.5)",
                    }}
                  >
                    {featuredMedia.title}
                  </h2>
                )}
                <div className="flex items-center gap-2">
                  <span
                    className="c-kicker"
                    style={{ fontSize: 9, color: "var(--gold-c)" }}
                  >
                    @{featuredCreator.handle}
                  </span>
                  {featuredCreator.verification_status === "verified" && (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" style={{ color: "var(--gold-c)" }}>
                      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  )}
                  {featuredMedia.duration && (
                    <>
                      <span
                        className="c-kicker"
                        style={{ fontSize: 9, color: "var(--paper)", opacity: 0.5 }}
                      >
                        ·
                      </span>
                      <span
                        className="c-kicker tabular-nums"
                        style={{ fontSize: 9, color: "var(--paper)", opacity: 0.65 }}
                      >
                        {Math.floor(featuredMedia.duration / 60)}:
                        {Math.floor(featuredMedia.duration % 60).toString().padStart(2, "0")}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </Link>

          {/* Creator credit slab */}
          <Link
            href={`/user/${featuredCreator.handle}`}
            className="flex items-center gap-3 px-5 py-4 press"
          >
            <div
              className="shrink-0 overflow-hidden"
              style={{
                width: 48,
                height: 48,
                background: "var(--gold-c)",
                border: "2px solid var(--gold-c)",
              }}
            >
              {featuredCreator.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={featuredCreator.avatar_url}
                  alt={featuredCreator.display_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span
                    className="c-card-t"
                    style={{ fontSize: 16, color: "var(--ink-strong)" }}
                  >
                    {featuredCreator.display_name
                      .split(" ")
                      .map((w) => w[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="c-card-t truncate"
                style={{ fontSize: 16, color: "var(--paper)", lineHeight: 1.1 }}
              >
                {featuredCreator.display_name}
              </p>
              {featuredCreator.bio ? (
                <p
                  className="c-serif-it line-clamp-1 mt-0.5"
                  style={{ fontSize: 12, color: "var(--paper)", opacity: 0.7 }}
                >
                  {featuredCreator.bio}
                </p>
              ) : featuredCreator.role ? (
                <p
                  className="c-kicker mt-0.5"
                  style={{ fontSize: 9, color: "var(--paper)", opacity: 0.55 }}
                >
                  {(ROLE_LABEL[featuredCreator.role as RoleKey] ?? featuredCreator.role).toUpperCase()}
                </p>
              ) : null}
            </div>
            <span
              className="c-kicker shrink-0"
              style={{ fontSize: 9, color: "var(--gold-c)" }}
            >
              VIEW PROFILE ↗
            </span>
          </Link>
        </section>
      )}

      {/* ── № 01 · HOT RIGHT NOW — poster grid: songs / films / art ─ */}
      {hotPosters.length > 0 && (
        <section className="mt-7 mb-7">
          <div className="px-5 mb-4">
            <div
              className="flex items-baseline gap-3 pb-2.5"
              style={{ borderBottom: "2px solid var(--rule-strong-c)" }}
            >
              <span
                className="c-display c-tabnum"
                style={{ fontSize: 28, lineHeight: 1, color: "var(--gold-c)", letterSpacing: "-0.02em" }}
              >
                № 01
              </span>
              <span className="c-kicker" style={{ fontSize: 11, letterSpacing: "0.14em" }}>
                HOT RIGHT NOW
              </span>
              <Link
                href="/frequency"
                className="ml-auto c-kicker"
                style={{ fontSize: 9, color: "var(--gold-c)" }}
              >
                ALL CULTURE ↗
              </Link>
            </div>
            <p
              className="c-serif-it mt-2"
              style={{ fontSize: 12, color: "var(--ink-strong)", opacity: 0.6 }}
            >
              Latest songs, films, and artwork from the city.
            </p>
          </div>

          <div
            className="flex overflow-x-auto scrollbar-hide gap-3 pb-2"
            style={{ paddingLeft: 20, paddingRight: 20 }}
          >
            {hotPosters.slice(0, 12).map((poster) => {
              const KIND_LABEL: Record<HotPoster["kind"], string> = {
                track: "TRACK",
                film: "FILM",
                art: "ART",
              };
              return (
                <Link
                  key={poster.id}
                  href={poster.href}
                  className="shrink-0 press"
                  style={{ width: 140 }}
                >
                  <div
                    className="relative overflow-hidden"
                    style={{
                      aspectRatio: "2 / 3",
                      background: "var(--ink-strong)",
                      border: "2px solid var(--rule-strong-c)",
                    }}
                  >
                    {poster.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={poster.image}
                        alt={poster.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                    {/* Bottom-up ink wash so the title pops */}
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          "linear-gradient(180deg, rgba(26,21,18,0.25) 0%, transparent 35%, rgba(26,21,18,0.85) 100%)",
                      }}
                    />
                    {/* Kind chip — top-left */}
                    <span
                      className="absolute top-2 left-2 c-badge c-badge-gold"
                      style={{ fontSize: 9, padding: "3px 7px" }}
                    >
                      § {KIND_LABEL[poster.kind]}
                    </span>
                    {/* Bottom block — title + creator */}
                    <div className="absolute inset-x-0 bottom-0 p-2">
                      <p
                        className="c-card-t line-clamp-2"
                        style={{
                          fontSize: 11,
                          lineHeight: 1.15,
                          color: "var(--paper)",
                          letterSpacing: "0.005em",
                        }}
                      >
                        {poster.title}
                      </p>
                      {poster.creator_handle && (
                        <p
                          className="c-kicker mt-1"
                          style={{
                            fontSize: 8,
                            letterSpacing: "0.16em",
                            color: "var(--gold-c)",
                            opacity: 0.95,
                          }}
                        >
                          @{poster.creator_handle}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Empty state ──────────────────────────────────────────── */}
      {creators.length === 0 && (
        <div
          className="mx-5 my-6 py-12 px-6 text-center"
          style={{
            background: "var(--paper-warm)",
            border: "2px solid var(--rule-strong-c)",
          }}
        >
          <div
            className="w-14 h-14 flex items-center justify-center mx-auto mb-4"
            style={{ background: "var(--ink-strong)" }}
          >
            <Icon name="sparkle" size={24} style={{ color: "var(--gold-c)" }} />
          </div>
          <p className="c-card-t mb-1" style={{ fontSize: 16, color: "var(--ink-strong)" }}>
            No creators match this filter
          </p>
          <p
            className="c-serif-it mb-4"
            style={{ fontSize: 13, color: "var(--ink-strong)", opacity: 0.7 }}
          >
            Try a different type or city.
          </p>
          <Link href="/creators" className="c-btn c-btn-primary c-btn-sm inline-block">
            SEE EVERYONE
          </Link>
        </div>
      )}

      {/* ── Creator cards — № 02, 03, … ────────────────────────── */}
      {/* Section opener for the roster */}
      {remainingCreators.length > 0 && (
        <div
          className="px-5 pt-2 pb-4"
          style={{ borderTop: "3px solid var(--rule-strong-c)", borderBottom: "2px solid var(--rule-strong-c)", background: "var(--paper-warm)" }}
        >
          <div className="flex items-baseline gap-3">
            <span className="c-kicker" style={{ fontSize: 10, color: "var(--gold-c)", letterSpacing: "0.16em" }}>
              § THE ROSTER
            </span>
            <span className="block flex-1 h-px" style={{ background: "var(--rule-strong-c)" }} />
            <span className="c-kicker tabular-nums" style={{ fontSize: 9, opacity: 0.55 }}>
              {remainingCreators.length} {remainingCreators.length === 1 ? "ENTRY" : "ENTRIES"}
            </span>
          </div>
        </div>
      )}

      {remainingCreators.map((creator, idx) => {
        const creatorPosts = postsByCreator.get(creator.id) ?? [];
        const creatorReels = reelsByCreator.get(creator.id) ?? [];
        const channel = channelByOwner.get(creator.id);
        const creatorVideos = channel ? videosByChannel.get(channel.id) ?? [] : [];
        const creatorAlbums = albumsByCreator.get(creator.id) ?? [];
        const creatorGallery = galleryByOwner.get(creator.id) ?? [];
        const imagePosts = creatorPosts.filter((p) => p.image_url);

        const sectionNum = String(idx + 2).padStart(2, "0");

        const stats = {
          reels: creatorReels.length,
          videos: creatorVideos.length,
          posts: imagePosts.length,
          tracks: creatorAlbums.length,
        };

        const discipline = deriveDiscipline(
          { role: creator.role },
          {
            reels: creatorReels.length,
            videos: creatorVideos.length,
            tracks: creatorAlbums.length,
            image_posts: imagePosts.length,
          }
        );

        // Featured: pinned > algorithmic fallback (video → reel → post → album → exhibit)
        let featured: FeaturedMedia | null = featuredByCreator.get(creator.id) ?? null;
        if (!featured) {
          if (creatorVideos.length > 0) {
            const v = creatorVideos[0];
            featured = {
              kind: "video",
              id: v.id,
              mux_playback_id: v.mux_playback_id ?? null,
              title: v.title,
              description: null,
              duration_seconds: v.duration ?? null,
              thumbnail_url:
                v.thumbnail_url ??
                (v.mux_playback_id
                  ? `https://image.mux.com/${v.mux_playback_id}/thumbnail.webp?width=800&height=450&time=5`
                  : null),
            };
          } else if (creatorReels.length > 0) {
            const r = creatorReels[0];
            featured = {
              kind: "reel",
              id: r.id,
              video_url: r.video_url,
              poster_url: r.poster_url,
              caption: r.caption,
              duration_seconds: null,
            };
          } else if (imagePosts.length > 0) {
            const p = imagePosts[0];
            featured = {
              kind: "post",
              id: p.id,
              image_url: p.image_url!,
              body: p.body ?? null,
            };
          } else if (creatorAlbums.length > 0) {
            const a = creatorAlbums[0];
            featured = {
              kind: "track",
              id: a.id,
              title: a.title,
              cover_art_url: a.cover_art_url,
              mux_playback_id: null,
              preview_seconds: null,
              duration_seconds: null,
              album_id: a.id,
              album_title: a.title,
            };
          } else if (creatorGallery.length > 0) {
            const g = creatorGallery[0];
            featured = {
              kind: "exhibit",
              id: g.id,
              image_url: g.image_url,
              caption: g.caption,
            };
          }
        }

        // Build a flat WorkItem[] for the portfolio grid (uniform 1:1 squares)
        const work: WorkItem[] = [];
        for (const r of creatorReels) {
          work.push({ id: r.id, kind: "reel", thumb: r.poster_url, href: `/reels?reel=${r.id}` });
        }
        for (const v of creatorVideos) {
          const thumb =
            v.thumbnail_url ??
            (v.mux_playback_id
              ? `https://image.mux.com/${v.mux_playback_id}/thumbnail.webp?width=400&height=400&time=5`
              : null);
          work.push({ id: v.id, kind: "video", thumb, href: `/live/watch/${v.id}`, label: v.title });
        }
        for (const p of imagePosts) {
          work.push({ id: p.id, kind: "post", thumb: p.image_url, href: `/user/${creator.handle}` });
        }
        for (const a of creatorAlbums) {
          work.push({ id: a.id, kind: "track", thumb: a.cover_art_url, href: `/user/${creator.handle}`, label: a.title });
        }
        for (const g of creatorGallery) {
          work.push({ id: g.id, kind: "exhibit", thumb: g.image_url, href: `/user/${creator.handle}`, label: g.caption });
        }
        const workFiltered = featured
          ? work.filter((w) => !(w.id === featured!.id && w.kind === featured!.kind))
          : work;

        return (
          <CreatorCard
            key={creator.id}
            id={creator.id}
            display_name={creator.display_name}
            handle={creator.handle}
            avatar_url={creator.avatar_url}
            bio={creator.bio}
            verified={creator.verification_status === "verified"}
            profile_tags={creator.profile_tags}
            city={creator.city?.name ?? null}
            featured={featured}
            work={workFiltered.slice(0, 6)}
            stats={stats}
            discipline={discipline}
            tier={creator.creator_tier ?? null}
            sectionNum={sectionNum}
          />
        );
      })}

      {/* ── Become a Creator CTA ──────────────────────────────── */}
      <section className="px-5 mt-8 mb-8">
        <div className="c-gold-block p-5">
          <div
            className="w-10 h-10 flex items-center justify-center mb-3"
            style={{ background: "var(--ink-strong)" }}
          >
            <Icon name="sparkle" size={20} style={{ color: "var(--gold-c)" }} />
          </div>
          <div className="c-kicker mb-2" style={{ color: "var(--ink-strong)" }}>
            § MAKE YOUR MARK
          </div>
          <h3
            className="c-hero"
            style={{
              fontSize: 30,
              lineHeight: 0.94,
              color: "var(--ink-strong)",
              marginBottom: 8,
            }}
          >
            Join the
            <br />
            Creators.
          </h3>
          <p
            className="c-body-sm mb-4 max-w-md"
            style={{ fontSize: 12, color: "var(--ink-strong)", opacity: 0.85 }}
          >
            Share your work, build an audience, and get discovered across every
            Hub City.
          </p>
          <Link href="/creators/apply" className="c-btn c-btn-primary">
            APPLY NOW →
          </Link>
        </div>
      </section>
    </div>
  );
}
