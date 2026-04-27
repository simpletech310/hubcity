import Link from "next/link";
import LiveNowBanner from "@/components/live/LiveNowBanner";
import type { TrendingReel, TrendingEvent } from "@/components/TrendingStrip";
import EventSliderHero, { type HeroSlide } from "@/components/home/EventSliderHero";
import {
  CultureMarquee,
  CultureSectionHead,
  CultureChipRow,
  CultureNumberedRow,
} from "@/components/culture";
import { createClient } from "@/lib/supabase/server";
import { getFeaturedArt } from "@/lib/art-spotlight";
import { getActiveCity } from "@/lib/city-context";
import { getCityFilter } from "@/lib/city-filter";
import CityFilterChip from "@/components/ui/CityFilterChip";
import { formatDistanceToNow } from "date-fns";
import type { Post } from "@/types/database";

// Always render fresh — the home page surfaces newest deals / events /
// posts / moments and any cache lag would mean visitors miss new
// content for minutes at a time.
export const dynamic = "force-dynamic";

function timeAgo(dateStr: string): string {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
}

/**
 * Fisher-Yates shuffle then take the first N. Used to keep the home
 * page feeling alive on every load — instead of always showing the
 * same top-rated 3 businesses / soonest 3 events / newest 3 posts,
 * we pull a wider pool from the DB and pick a random subset per
 * request. Safe because the page is `dynamic = "force-dynamic"`,
 * so each visit re-runs the queries AND re-shuffles.
 */
/** A single image-led tile in the home-page Culture rail. */
function CultureTileCard({
  tile,
  aspect,
}: {
  tile: {
    kind: "exhibit" | "art";
    title: string;
    image: string | null;
    href: string;
    meta: string | null;
  };
  aspect: "1/1" | "4/3" | "2/1";
}) {
  return (
    <Link
      href={tile.href}
      className="block press relative overflow-hidden"
      style={{
        aspectRatio: aspect,
        background: "var(--ink-strong)",
        border: "2px solid var(--rule-strong-c)",
      }}
    >
      {tile.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={tile.image}
          alt={tile.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      {/* Bottom gradient + label */}
      <div
        className="absolute inset-x-0 bottom-0 px-2.5 pt-8 pb-2"
        style={{
          background:
            "linear-gradient(180deg, transparent 0%, rgba(26,21,18,0.88) 100%)",
        }}
      >
        <p
          className="c-card-t line-clamp-1"
          style={{ fontSize: 12, color: "var(--paper)", lineHeight: 1.2 }}
        >
          {tile.title}
        </p>
        {tile.meta && (
          <p
            className="c-meta line-clamp-1"
            style={{ fontSize: 9, color: "var(--paper)", opacity: 0.75 }}
          >
            {tile.meta}
          </p>
        )}
      </div>
      <span
        className="absolute top-1.5 left-1.5 c-kicker"
        style={{
          fontSize: 8,
          letterSpacing: "0.14em",
          background: "var(--gold-c)",
          color: "var(--ink-strong)",
          padding: "2px 5px",
        }}
      >
        {tile.kind === "exhibit" ? "EXHIBIT" : "ART"}
      </span>
    </Link>
  );
}

function pickRandom<T>(arr: T[], n: number): T[] {
  if (!arr || arr.length === 0) return [];
  if (arr.length <= n) return arr.slice();
  // Fisher-Yates over a copy so we don't mutate the caller's array.
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

type UpcomingStream = {
  id: string;
  title: string;
  category: string;
  thumbnail_url: string | null;
  scheduled_at: string | null;
};

type RecentPodcast = {
  id: string;
  title: string;
  episode_number: number | null;
  thumbnail_url: string | null;
  duration: number | null;
};

type ActiveDeal = {
  id: string;
  title: string;
  description: string;
  discount_label: string;
  promo_code: string | null;
  valid_until: string;
  business: {
    id: string;
    name: string;
    slug: string;
    category: string;
    image_urls: string[] | null;
    is_published: boolean;
  } | null;
};

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<{ city?: string | string[] }>;
}) {
  const supabase = await createClient();
  const nowIso = new Date().toISOString();
  const todayIso = new Date().toISOString().split("T")[0];
  const activeCity = await getActiveCity();
  const sp = (await (searchParams ?? Promise.resolve({}))) as { city?: string | string[] };
  // Default scope = ALL cities. The listener can scope down to a single
  // market by selecting a city via <CityFilterChip>, which writes ?city=<slug>
  // into the URL. activeCity (the cookie-stored "home city") only feeds the
  // masthead label, the featured-art lookup, and a few civic surfaces below.
  const filterCity = await getCityFilter(sp);
  const cityId = filterCity?.id ?? null;

  // Helper that conditionally narrows a query to the *filter* city only.
  // Without a filter we let the query fan out across every city.
  const scopeToCity = <T,>(q: T): T => {
    if (!cityId) return q;
    return ((q as unknown) as { eq: (k: string, v: string) => T }).eq(
      "city_id",
      cityId,
    );
  };

  const [
    {
      data: { user },
    },
    { data: businesses },
    { data: events },
    { data: liveStreams },
    { data: recentPosts },
    { data: criticalAlerts },
    { data: foodVendors },
    { data: upcomingStreams },
    { data: recentPodcasts },
    { data: trendingReelsRaw },
    { data: trendingEventsRaw },
    { data: activeDealsRaw },
    { data: cultureExhibitsRaw },
    { data: cultureGalleryRaw },
    { data: foodChallengesRaw },
  ] = await Promise.all([
    supabase.auth.getUser(),
    // Local Favorites pool — we pull a wider top-rated set so the
    // section can randomize 3 of N each render instead of always
    // showing the same top 5.
    scopeToCity(
      supabase
        .from("businesses")
        .select("id, name, slug, category, image_urls, address, rating_avg")
        .eq("is_featured", true)
        .eq("is_published", true),
    )
      .order("rating_avg", { ascending: false })
      .limit(20),
    // Events pool — soonest 18 upcoming so "Where the Block Goes"
    // randomizes 3 different shows on every visit.
    scopeToCity(
      supabase
        .from("events")
        .select("id, title, start_date, location_name, image_url")
        .eq("is_published", true),
    )
      .gte("start_date", todayIso)
      .order("start_date", { ascending: true })
      .limit(18),
    scopeToCity(
      supabase
        .from("live_streams")
        .select("id, title, category, mux_playback_id, status, viewer_count")
        .eq("status", "active"),
    ).limit(3),
    // Posts pool — drives Dispatches + (fallback) Picked-for-You.
    // Widened 8 → 24 so the section can shuffle 3 different voices
    // on every load instead of always showing the same newest 3.
    scopeToCity(
      supabase
        .from("posts")
        .select(
          "*, author:profiles!posts_author_id_fkey(id, display_name, handle, avatar_url, role, verification_status)",
        )
        .eq("is_published", true),
    )
      .order("created_at", { ascending: false })
      .limit(24),
    scopeToCity(
      supabase
        .from("city_alerts")
        .select("id, title, body, severity")
        .eq("is_active", true)
        .eq("severity", "critical"),
    )
      .order("created_at", { ascending: false })
      .limit(2),
    scopeToCity(
      supabase
        .from("businesses")
        .select(
          "id, name, slug, image_urls, category, business_sub_type, rating_avg, is_open",
        )
        .eq("is_published", true)
        .eq("business_type", "food"),
    )
      .order("rating_avg", { ascending: false })
      .limit(8),
    scopeToCity(
      supabase
        .from("live_streams")
        .select("id, title, category, thumbnail_url, scheduled_at")
        .eq("status", "idle"),
    )
      .gte("scheduled_at", nowIso)
      .order("scheduled_at", { ascending: true })
      .limit(4)
      .returns<UpcomingStream[]>(),
    scopeToCity(
      supabase
        .from("podcasts")
        .select("id, title, episode_number, thumbnail_url, duration")
        .eq("is_published", true),
    )
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(4)
      .returns<RecentPodcast[]>(),
    // Trending reels — sorted by engagement. Pool widened so the
    // home-page Moments rail can shuffle a random 6 of N each visit.
    supabase
      .from("reels")
      .select(
        "id, caption, poster_url, like_count, created_at, author:profiles!reels_author_id_fkey(display_name, handle)",
      )
      .eq("is_published", true)
      .order("like_count", { ascending: false })
      .limit(24)
      .returns<TrendingReel[]>(),
    // Trending events — future only, sorted by rsvp_count
    scopeToCity(
      supabase
        .from("events")
        .select(
          "id, title, cover_image_url, starts_at, city_id, cities(name)",
        )
        .gte("starts_at", nowIso),
    )
      .order("rsvp_count", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(6)
      .returns<TrendingEvent[]>(),
    // Active deals — newest first. Joined to the parent business so the
    // tile can render brand context + a link. Page hides the rail when
    // no rows come back so freshly-deployed instances don't show empties.
    // Bumped 6 → 15 so the on-page render can shuffle 3 of 15 per visit.
    supabase
      .from("business_deals")
      .select(
        "id, title, description, discount_label, promo_code, valid_until, business:businesses!inner(id, name, slug, category, image_urls, is_published)",
      )
      .eq("is_active", true)
      .lte("valid_from", nowIso)
      .gte("valid_until", nowIso)
      .order("created_at", { ascending: false })
      .limit(15),
    // Culture pool — exhibits + gallery items. Drives the new
    // image-heavy "Culture Right Now" rail under Deals. Only published
    // items with cover art so the grid never has empty cells.
    supabase
      .from("museum_exhibits")
      .select("id, slug, title, subtitle, cover_image_url, era")
      .eq("is_published", true)
      .not("cover_image_url", "is", null)
      .order("display_order", { ascending: true })
      .limit(20),
    supabase
      .from("gallery_items")
      .select("id, slug, title, image_urls, item_type, artist_name, year_created")
      .eq("is_published", true)
      .order("display_order", { ascending: true })
      .limit(40),
    // Food / collection challenges — drives the Explore rail. Active only.
    supabase
      .from("food_challenges")
      .select(
        "id, slug, name, description, image_url, challenge_type, end_date, participant_count",
      )
      .eq("is_active", true)
      .gte("end_date", todayIso)
      .order("end_date", { ascending: true })
      .limit(8),
  ]);

  // ── Personalization data (logged-in only, all errors are non-fatal) ──────
  let profileData: { interests?: string[] | null; city_id?: string | null } | null = null;
  let followedIds: string[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let interestBusinesses: any[] = [];

  if (user) {
    const [profileResult, followsResult] = await Promise.all([
      (async () => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return await (supabase
            .from("profiles")
            .select("interests, city_id")
            .eq("id", user.id)
            .single() as any);
        } catch {
          return { data: null };
        }
      })(),
      (async () => {
        try {
          return await supabase
            .from("user_follows")
            .select("followed_id")
            .eq("follower_id", user.id)
            .limit(100);
        } catch {
          return { data: null };
        }
      })(),
    ]);

    profileData = (profileResult as { data: { interests?: string[] | null; city_id?: string | null } | null }).data ?? null;
    const rawFollows = (followsResult as { data: { followed_id: string }[] | null }).data;
    followedIds = rawFollows?.map((f) => f.followed_id) ?? [];
  }

  // Merge feed: if the user follows creators, prepend their posts
  let mergedPosts: Post[] = recentPosts ? [...recentPosts] as Post[] : [];
  if (followedIds.length > 0) {
    try {
      const { data: followedPosts } = await scopeToCity(
        supabase
          .from("posts")
          .select(
            "*, author:profiles!posts_author_id_fkey(id, display_name, handle, avatar_url, role, verification_status)",
          )
          .in("author_id", followedIds)
          .eq("is_published", true),
      )
        .order("created_at", { ascending: false })
        .limit(10);

      if (followedPosts && followedPosts.length > 0) {
        const seenIds = new Set(followedPosts.map((p: Post) => p.id));
        const generalRemainder = (recentPosts ?? []).filter(
          (p) => !seenIds.has(p.id),
        );
        mergedPosts = [...(followedPosts as Post[]), ...(generalRemainder as Post[])];
      }
    } catch {
      // Keep unmerged posts on error
    }
  }

  // Interest-based business recommendations
  const userInterests: string[] = (profileData?.interests as string[] | null) ?? [];
  if (userInterests.length > 0) {
    try {
      const interestCategoryMap: Record<string, string[]> = {
        food: ["restaurant", "other"],
        music: ["entertainment", "other"],
        fashion: ["retail", "beauty"],
        beauty: ["beauty", "health"],
        health: ["health", "services"],
        arts: ["entertainment", "other"],
        sports: ["health", "services"],
        shopping: ["retail", "other"],
        services: ["services", "other"],
      };
      const primaryInterest = userInterests[0].toLowerCase();
      const matchedCategories =
        interestCategoryMap[primaryInterest] ??
        interestCategoryMap[
          Object.keys(interestCategoryMap).find((k) =>
            primaryInterest.includes(k),
          ) ?? ""
        ] ??
        [];

      if (matchedCategories.length > 0) {
        const { data: intBiz } = await scopeToCity(
          supabase
            .from("businesses")
            .select("id, name, slug, category, image_urls, rating_avg")
            .eq("is_published", true)
            .in("category", matchedCategories),
        )
          .order("rating_avg", { ascending: false })
          .limit(12);
        interestBusinesses = intBiz ?? [];
      }
    } catch {
      interestBusinesses = [];
    }
  }

  const featuredArt = cityId ? await getFeaturedArt(cityId) : null;
  const hasLive = Boolean(liveStreams && liveStreams.length > 0);
  const featuredBusinesses = businesses ?? [];
  const pulsePosts: Post[] = mergedPosts;

  // Creator posts for the "For You" rail: prefer media-first.
  // Pool sized to give pickRandom() something to shuffle (we render 3
  // of these per visit). 12 keeps the page responsive while still
  // looking different on each load.
  const mediaPosts = pulsePosts
    .filter((p) => p.image_url || p.video_url || p.mux_playback_id)
    .slice(0, 12);
  const displayPosts =
    mediaPosts.length >= 2 ? mediaPosts : pulsePosts.slice(0, 12);

  const trendingReels: TrendingReel[] = trendingReelsRaw ?? [];
  const trendingEvents: TrendingEvent[] = trendingEventsRaw ?? [];

  // Flatten the joined deals shape — Supabase JS may return `business`
  // as an object or a single-item array depending on the relationship,
  // so coerce to the first row regardless. Lifted above the Explore /
  // Culture tile builders below so they can reference activeDeals.
  const activeDeals = ((activeDealsRaw ?? []) as unknown as ActiveDeal[])
    .map((d) => {
      const b = Array.isArray(d.business) ? d.business[0] : d.business;
      if (!b || !b.is_published) return null;
      return {
        id: d.id,
        title: d.title,
        description: d.description,
        discount_label: d.discount_label,
        promo_code: d.promo_code,
        valid_until: d.valid_until,
        business_id: b.id,
        business_name: b.name,
        business_slug: b.slug,
        business_category: b.category,
        business_cover: b.image_urls?.[0] ?? null,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  // Culture pool — flatten exhibits + gallery items into a single
  // shuffled list of image-led tiles. Drives the new rail under
  // Deals Dropped. Each tile has a kind so the chip can label it.
  type CultureTile = {
    id: string;
    kind: "exhibit" | "art";
    title: string;
    image: string | null;
    href: string;
    meta: string | null;
  };
  const cultureTiles: CultureTile[] = [];
  for (const ex of (cultureExhibitsRaw ?? []) as Array<{
    id: string;
    slug: string;
    title: string;
    subtitle: string | null;
    cover_image_url: string | null;
    era: string | null;
  }>) {
    if (!ex.cover_image_url) continue;
    cultureTiles.push({
      id: `exhibit-${ex.id}`,
      kind: "exhibit",
      title: ex.title,
      image: ex.cover_image_url,
      href: `/culture/exhibits/${ex.slug}`,
      meta: ex.era ?? ex.subtitle,
    });
  }
  for (const g of (cultureGalleryRaw ?? []) as Array<{
    id: string;
    slug: string;
    title: string;
    image_urls: string[] | null;
    item_type: string | null;
    artist_name: string | null;
    year_created: string | null;
  }>) {
    const cover = g.image_urls?.[0];
    if (!cover) continue;
    cultureTiles.push({
      id: `art-${g.id}`,
      kind: "art",
      title: g.title,
      image: cover,
      href: `/culture/gallery/${g.slug}`,
      meta: [g.artist_name, g.year_created].filter(Boolean).join(" · ") || null,
    });
  }

  // Explore pool — heterogeneous tiles that replace the legacy
  // "Local Favorites" rail. Mixes food challenges + active deals +
  // featured businesses + upcoming events so the home page surfaces
  // the same variety a citizen would find tabbing across the
  // category pages.
  type ExploreTile = {
    id: string;
    kind: "challenge" | "deal" | "shop" | "event";
    label: string;
    title: string;
    meta: string | null;
    image: string | null;
    href: string;
  };
  const exploreTiles: ExploreTile[] = [];
  for (const c of (foodChallengesRaw ?? []) as Array<{
    id: string;
    slug: string;
    name: string;
    description: string | null;
    image_url: string | null;
    challenge_type: string | null;
    end_date: string;
    participant_count: number | null;
  }>) {
    if (!c.image_url) continue;
    const days = Math.max(
      0,
      Math.ceil(
        (new Date(c.end_date).getTime() - Date.now()) / (24 * 3600 * 1000),
      ),
    );
    exploreTiles.push({
      id: `challenge-${c.id}`,
      kind: "challenge",
      label: "CHALLENGE",
      title: c.name,
      meta:
        days <= 0
          ? "ENDS TODAY"
          : days === 1
            ? "1 DAY LEFT"
            : `${days} DAYS LEFT`,
      image: c.image_url,
      href: `/food/challenges/${c.slug}`,
    });
  }
  for (const d of activeDeals.slice(0, 6)) {
    if (!d.business_cover) continue;
    exploreTiles.push({
      id: `deal-${d.id}`,
      kind: "deal",
      label: d.discount_label,
      title: d.title,
      meta: d.business_name.toUpperCase(),
      image: d.business_cover,
      href: `/business/${d.business_slug}`,
    });
  }
  for (const b of (businesses ?? []).slice(0, 8)) {
    const cover = b.image_urls?.[0];
    if (!cover) continue;
    exploreTiles.push({
      id: `shop-${b.id}`,
      kind: "shop",
      label: (b.category ?? "SHOP").toUpperCase(),
      title: b.name,
      meta: b.rating_avg ? `★ ${Number(b.rating_avg).toFixed(1)}` : null,
      image: cover,
      href: `/business/${b.slug}`,
    });
  }
  for (const e of (events ?? []).slice(0, 6)) {
    if (!e.image_url) continue;
    const d = new Date(e.start_date);
    exploreTiles.push({
      id: `event-${e.id}`,
      kind: "event",
      label: "EVENT",
      title: e.title,
      meta: d
        .toLocaleDateString("en-US", { month: "short", day: "numeric" })
        .toUpperCase(),
      image: e.image_url,
      href: `/events/${e.id}`,
    });
  }

  // ── Derived UI values ────────────────────────────────────────────────────
  // The label tracks the *filter* city when one is set, and only falls back
  // to the home city's name when the listener hasn't filtered down. With no
  // filter and no home city we just say "Everywhere".
  const labelCity = filterCity ?? activeCity ?? null;
  const cityName = labelCity?.name ?? "Everywhere";
  const cityUpper = cityName.toUpperCase();

  const today = new Date();
  const dateLabel = today.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
  }).toUpperCase();
  const tonightDateLabel = today
    .toLocaleDateString("en-US", { month: "2-digit", day: "2-digit" });
  const isoWeek = (() => {
    const onejan = new Date(today.getFullYear(), 0, 1);
    return Math.ceil(
      ((today.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7,
    );
  })();
  const volLabel = `VOL.${today.getFullYear() % 100}`;
  const issLabel = `ISS.${isoWeek}`;

  // Marquee items: mix events/reels/live titles with a safe fallback
  const marqueeItems: string[] = (() => {
    const items: string[] = [];
    if (events) {
      for (const e of events.slice(0, 3)) items.push((e.title ?? "").toUpperCase());
    }
    if (trendingReels) {
      for (const r of trendingReels.slice(0, 2)) {
        if (r.caption) items.push(r.caption.toUpperCase().slice(0, 48));
      }
    }
    if (liveStreams) {
      for (const ls of liveStreams) items.push(`${(ls.title ?? "LIVE").toUpperCase()} · LIVE`);
    }
    const cleaned = items.filter(Boolean).slice(0, 6);
    return cleaned.length > 0
      ? cleaned
      : ["TONIGHT ON THE BLOCK", "NEW EVENTS DROPPED", "HUB CITY PRESS"];
  })();

  // Hero slider — paginated upcoming events + a featured-art / live
  // stream lead. Each slide renders a magazine-cover spread with
  // its own kicker, image, title, subtitle, and CTA.
  const topStream = liveStreams?.[0];
  // Hero is now a culture-driven slideshow — random exhibits + gallery
  // pieces + featured artwork. Each slide links to the artwork itself
  // so visitors can open the full piece. Falls back to events / streams
  // only if no culture content is available (rare).
  const heroSlides: HeroSlide[] = (() => {
    const slides: HeroSlide[] = [];

    // 1. Featured longread (when curated) takes the lead slot.
    if (featuredArt) {
      slides.push({
        id: `art-${featuredArt.slug ?? "feature"}`,
        kicker: "§ FEATURE",
        title: featuredArt.title,
        subtitle: featuredArt.artist ? `By ${featuredArt.artist}` : null,
        meta: "READ · 8 MIN",
        cta: "OPEN ↗",
        href: featuredArt.slug ? `/art/${featuredArt.slug}` : "/culture",
        imageUrl: featuredArt.imageUrl ?? null,
      });
    }

    // 2. Random culture tiles — shuffle the pool so each load shows
    //    different artwork. Up to 5 culture slides per hero.
    for (const tile of pickRandom(cultureTiles, 5)) {
      slides.push({
        id: `culture-${tile.id}`,
        kicker: tile.kind === "exhibit" ? "§ EXHIBIT" : "§ ARTWORK",
        title: tile.title,
        subtitle: tile.meta,
        meta: tile.kind === "exhibit" ? "ON VIEW" : "VIEW PIECE",
        cta: "OPEN ↗",
        href: tile.href,
        imageUrl: tile.image,
      });
    }

    // 3. If we still don't have enough slides (no culture content yet),
    //    fall back to upcoming events + the live stream so the hero
    //    isn't empty.
    if (slides.length < 3) {
      if (topStream) {
        slides.push({
          id: `stream-${topStream.id}`,
          kicker: "§ LIVE NOW",
          title: topStream.title,
          subtitle: "Live on Hub City — open the stream.",
          meta: "ON AIR · NOW",
          cta: "WATCH LIVE",
          href: `/live/${topStream.id}`,
          imageUrl: topStream.mux_playback_id
            ? `https://image.mux.com/${topStream.mux_playback_id}/thumbnail.jpg`
            : null,
        });
      }
      for (const e of (events ?? []).slice(0, 3)) {
        const d = new Date(e.start_date);
        const meta = `${d
          .toLocaleDateString("en-US", { month: "short", day: "2-digit" })
          .toUpperCase()}${e.location_name ? ` · ${e.location_name.toUpperCase()}` : ""}`;
        slides.push({
          id: `event-${e.id}`,
          kicker: "§ UPCOMING",
          title: e.title,
          subtitle: e.location_name
            ? `Live at ${e.location_name}.`
            : "Mark the calendar.",
          meta,
          cta: "RSVP →",
          href: `/events/${e.id}`,
          imageUrl: e.image_url ?? null,
        });
      }
    }

    if (slides.length === 0) {
      slides.push({
        id: "fallback-culture",
        kicker: "§ HUB CITY",
        title: `Hub ${cityName}`,
        subtitle: `${cityName} — the weekly cultural field guide.`,
        meta: dateLabel,
        cta: "OPEN ↗",
        href: "/culture",
        imageUrl: null,
      });
    }

    return slides.slice(0, 6);
  })();

  // Discover chips (top-level category filter)
  const discoverChips = [
    { label: "ALL", href: "/" },
    { label: "FOOD", href: "/food" },
    { label: "EVENTS", href: "/events" },
    { label: "MOMENTS", href: "/moments" },
    { label: "SHOPS", href: "/business" },
    { label: "CIVIC", href: "/city-data" },
    { label: "JOBS", href: "/jobs" },
  ];

  return (
    <div
      className="culture-surface min-h-dvh mx-auto max-w-[430px] relative"
      style={{ paddingBottom: 120 }}
    >
      {/* Filter strip — city scope. Default = ALL CITIES. */}
      <div
        className="flex items-center gap-2 px-[18px] py-2"
        style={{
          borderTop: "2px solid var(--rule-strong-c)",
          borderBottom: "2px solid var(--rule-strong-c)",
          background: "var(--paper-soft, #DCD3BF)",
        }}
      >
        <span className="c-kicker" style={{ fontSize: 10, color: "var(--ink-strong)", opacity: 0.8 }}>
          BROWSING
        </span>
        <CityFilterChip />
        <span className="flex-1" />
      </div>

      {/* Marquee — first scrolling element after the city filter strip */}
      <CultureMarquee items={marqueeItems} />

      {/* Discover chip row */}
      <CultureChipRow chips={discoverChips} activeIndex={0} />

      {/* Critical alerts */}
      {criticalAlerts && criticalAlerts.length > 0 && (
        <div
          className="px-[18px] py-4"
          style={{ borderTop: "3px solid var(--red-c)" }}
        >
          {criticalAlerts.map((alert) => (
            <Link
              key={alert.id}
              href="/city-data"
              className="block py-2"
            >
              <div
                className="c-kicker"
                style={{ color: "var(--red-c)" }}
              >
                § CRITICAL ALERT
              </div>
              <div className="c-card-t mt-1" style={{ fontSize: 16 }}>
                {alert.title}
              </div>
              {alert.body && (
                <div className="c-meta mt-1" style={{ textTransform: "none" }}>
                  {alert.body}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* Hero slider — paginated cover of upcoming events + features */}
      <EventSliderHero slides={heroSlides} />

      {/* § MOMENTS — recent reels as a poster rail. Refreshes
       *  every page load (force-dynamic) so the home page always
       *  reflects what listeners just dropped. */}
      {trendingReels.length > 0 && (
        <section className="pt-5">
          <div className="px-[18px] mb-3">
            <div
              className="flex items-baseline gap-3 pb-2"
              style={{ borderBottom: "2px solid var(--rule-strong-c)" }}
            >
              <span
                className="c-kicker"
                style={{
                  fontSize: 10,
                  letterSpacing: "0.18em",
                  color: "var(--ink-strong)",
                  opacity: 0.7,
                }}
              >
                § MOMENTS
              </span>
              <span
                className="c-badge c-badge-gold tabular-nums ml-auto"
                style={{ fontSize: 9 }}
              >
                {trendingReels.length} NEW
              </span>
            </div>
          </div>
          <div className="overflow-x-auto scrollbar-hide pb-1">
            <div className="flex gap-2 px-[18px]">
              {pickRandom(trendingReels, 8).map((r) => (
                <Link
                  key={r.id}
                  href={`/moments?r=${r.id}`}
                  className="shrink-0 press relative overflow-hidden"
                  style={{
                    width: 108,
                    aspectRatio: "9 / 16",
                    background: "var(--ink-strong)",
                    border: "2px solid var(--rule-strong-c)",
                  }}
                >
                  {r.poster_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={r.poster_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : null}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background:
                        "linear-gradient(180deg, transparent 50%, rgba(26,21,18,0.9) 100%)",
                    }}
                  />
                  <div className="absolute inset-x-0 bottom-0 px-2 pb-2">
                    {r.author?.display_name && (
                      <p
                        className="c-kicker truncate"
                        style={{
                          fontSize: 8.5,
                          letterSpacing: "0.16em",
                          color: "var(--gold-c)",
                          opacity: 0.95,
                        }}
                      >
                        @{r.author.handle ?? r.author.display_name.toLowerCase().replace(/\s+/g, "")}
                      </p>
                    )}
                    {r.caption && (
                      <p
                        className="line-clamp-2 mt-1"
                        style={{
                          fontSize: 10,
                          lineHeight: 1.2,
                          fontFamily: "var(--font-archivo), Archivo, sans-serif",
                          fontWeight: 700,
                          color: "var(--paper)",
                        }}
                      >
                        {r.caption}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* § TONIGHT section */}
      {events && events.length > 0 && (
        <>
          <CultureSectionHead
            kicker={`§ TONIGHT · ${tonightDateLabel}`}
            title="Where the Block Goes."
          />
          <div className="px-[18px] pb-5">
            {pickRandom(events, 3).map((e, i) => {
              const d = new Date(e.start_date);
              const timeStr = d
                .toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                })
                .toUpperCase();
              const kicker = `${timeStr} · ${(e.location_name ?? cityName).toUpperCase()}`;
              return (
                <CultureNumberedRow
                  key={e.id}
                  n={String(i + 1).padStart(2, "0")}
                  tag={i === 0 ? "TONIGHT" : undefined}
                  kicker={kicker}
                  title={e.title}
                  img={e.image_url ?? undefined}
                  imgAlt={e.title}
                  href={`/events/${e.id}`}
                  topRule={i > 0}
                />
              );
            })}
          </div>
        </>
      )}

      {/* § CULTURE RIGHT NOW — random exhibits + gallery pieces from
            /culture. Moved up directly after § TONIGHT so the home page
            leads with images before the text-heavy Dispatches block.
            Image-heavy mosaic refreshes on every load. */}
      {cultureTiles.length > 0 && (
        <section className="pt-6">
          <div className="px-[18px] mb-3">
            <div
              className="flex items-baseline gap-3 pb-2"
              style={{ borderBottom: "2px solid var(--rule-strong-c)" }}
            >
              <span
                className="c-display c-tabnum"
                style={{
                  fontSize: 22,
                  color: "var(--gold-c)",
                  lineHeight: 1,
                  letterSpacing: "-0.02em",
                }}
              >
                §
              </span>
              <div className="flex flex-col">
                <span
                  className="c-kicker"
                  style={{ fontSize: 10, letterSpacing: "0.18em" }}
                >
                  CULTURE RIGHT NOW
                </span>
                <span
                  className="c-serif-it"
                  style={{ fontSize: 12, color: "var(--ink-strong)", opacity: 0.65 }}
                >
                  Compton, in frame.
                </span>
              </div>
              <Link
                href="/culture/gallery"
                className="ml-auto c-kicker press"
                style={{
                  fontSize: 9,
                  color: "var(--gold-c)",
                  letterSpacing: "0.16em",
                }}
              >
                ALL ↗
              </Link>
            </div>
          </div>
          {(() => {
            const picks = pickRandom(cultureTiles, 6);
            // Mosaic layout: row 1 = 1 wide hero + 2 stacked squares;
            // row 2 = 3 squares. Falls back to a simple 3-grid if we
            // somehow get fewer than 4 tiles.
            const [t0, t1, t2, t3, t4, t5] = picks;
            if (picks.length < 4) {
              return (
                <div className="grid grid-cols-3 gap-2 px-[18px]">
                  {picks.map((t) => (
                    <CultureTileCard key={t.id} tile={t} aspect="1/1" />
                  ))}
                </div>
              );
            }
            return (
              <div className="px-[18px] space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  {/* Hero spans 2 cols */}
                  <div className="col-span-2">
                    <CultureTileCard tile={t0} aspect="4/3" />
                  </div>
                  <div className="grid grid-rows-2 gap-2">
                    <CultureTileCard tile={t1} aspect="2/1" />
                    <CultureTileCard tile={t2} aspect="2/1" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[t3, t4, t5]
                    .filter((t): t is CultureTile => Boolean(t))
                    .map((t) => (
                      <CultureTileCard key={t.id} tile={t} aspect="1/1" />
                    ))}
                </div>
              </div>
            );
          })()}
        </section>
      )}

      {/* Live on the Block — LiveNowBanner in ink block */}
      {hasLive && liveStreams && (
        <section
          className="c-ink-block"
          style={{
            borderTop: "2px solid var(--gold-c)",
            padding: "24px 18px",
            marginTop: 24,
          }}
        >
          <div className="c-kicker" style={{ color: "var(--gold-c)" }}>
            § LIVE ON THE BLOCK
          </div>
          <div className="mt-3">
            <LiveNowBanner streams={liveStreams} />
          </div>
        </section>
      )}

      {/* § DISPATCHES (ink slab) */}
      {mergedPosts.length > 0 && (
        <section
          className="c-ink-block"
          style={{ padding: "28px 18px 28px" }}
        >
          <div className="c-kicker" style={{ color: "var(--gold-c)" }}>
            § DISPATCHES
          </div>
          <h2 className="c-hero mt-2" style={{ color: "var(--paper)" }}>
            Voices,
            <br />
            Unfiltered.
          </h2>
          <div className="mt-4">
            {pickRandom(mergedPosts, 3).map((p) => {
              const author =
                p.author?.handle ??
                p.author?.display_name?.toLowerCase().replace(/\s+/g, "") ??
                "community";
              const timeLabel = timeAgo(p.created_at).toUpperCase();
              const role = p.author?.role?.toString().toUpperCase() ?? "POST";
              return (
                <Link
                  key={p.id}
                  href="/pulse"
                  className="block py-4"
                  style={{ borderTop: "1px solid rgba(243,238,220,0.15)" }}
                >
                  <div
                    className="c-kicker"
                    style={{ color: "var(--gold-c)", fontSize: 9 }}
                  >
                    {role} · {timeLabel}
                  </div>
                  <p
                    className="c-card-t mt-2"
                    style={{
                      fontSize: 18,
                      color: "var(--paper)",
                      textWrap: "balance" as const,
                    }}
                  >
                    {(p.body ?? "Untitled").slice(0, 140)}
                  </p>
                  <div
                    className="c-kicker mt-2.5"
                    style={{
                      opacity: 0.6,
                      fontSize: 9,
                      color: "var(--paper)",
                    }}
                  >
                    @{author} · READ ↗
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* § EXPLORE — heterogeneous mix of food challenges + deals +
            featured businesses + upcoming events. Replaces the legacy
            "Picked for You" + "Local Favorites" rails so the home page
            surfaces the same variety the dedicated category pages do. */}
      {exploreTiles.length > 0 && (
        <section className="pt-2 pb-6">
          <div className="px-[18px] mb-3">
            <div
              className="flex items-baseline gap-3 pb-2"
              style={{ borderBottom: "2px solid var(--rule-strong-c)" }}
            >
              <span
                className="c-display c-tabnum"
                style={{
                  fontSize: 22,
                  color: "var(--gold-c)",
                  lineHeight: 1,
                  letterSpacing: "-0.02em",
                }}
              >
                §
              </span>
              <div className="flex flex-col">
                <span
                  className="c-kicker"
                  style={{ fontSize: 10, letterSpacing: "0.18em" }}
                >
                  EXPLORE
                </span>
                <span
                  className="c-serif-it"
                  style={{
                    fontSize: 12,
                    color: "var(--ink-strong)",
                    opacity: 0.65,
                  }}
                >
                  Things to do, eat, and find.
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2.5 px-[18px]">
            {pickRandom(exploreTiles, 6).map((tile) => (
              <Link
                key={tile.id}
                href={tile.href}
                className="block press relative overflow-hidden"
                style={{
                  aspectRatio: "1/1",
                  background: "var(--ink-strong)",
                  border: "2px solid var(--rule-strong-c)",
                }}
              >
                {tile.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={tile.image}
                    alt={tile.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
                <span
                  className="absolute top-1.5 left-1.5 c-kicker"
                  style={{
                    fontSize: 8,
                    letterSpacing: "0.14em",
                    background:
                      tile.kind === "deal"
                        ? "var(--gold-c)"
                        : tile.kind === "challenge"
                          ? "var(--ink-strong)"
                          : tile.kind === "event"
                            ? "var(--ink-strong)"
                            : "var(--paper)",
                    color:
                      tile.kind === "deal"
                        ? "var(--ink-strong)"
                        : tile.kind === "shop"
                          ? "var(--ink-strong)"
                          : "var(--gold-c)",
                    padding: "2px 5px",
                    border:
                      tile.kind === "shop"
                        ? "1px solid var(--rule-strong-c)"
                        : undefined,
                  }}
                >
                  {tile.label}
                </span>
                <div
                  className="absolute inset-x-0 bottom-0 px-2.5 pt-8 pb-2"
                  style={{
                    background:
                      "linear-gradient(180deg, transparent 0%, rgba(26,21,18,0.9) 100%)",
                  }}
                >
                  <p
                    className="c-card-t line-clamp-2"
                    style={{
                      fontSize: 12,
                      color: "var(--paper)",
                      lineHeight: 1.2,
                    }}
                  >
                    {tile.title}
                  </p>
                  {tile.meta && (
                    <p
                      className="c-meta line-clamp-1"
                      style={{
                        fontSize: 9,
                        color: "var(--paper)",
                        opacity: 0.78,
                      }}
                    >
                      {tile.meta}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* § DEALS DROPPED — moved down so the home page leads with image
            content (Culture + Explore) before showing promo codes. */}
      {activeDeals.length > 0 && (
        <section>
          <div className="px-[18px] pt-2">
            <div className="flex items-baseline gap-3">
              <span className="c-kicker">§ DEALS DROPPED</span>
              <span className="ml-auto c-kicker" style={{ opacity: 0.55 }}>
                {activeDeals.length} ACTIVE
              </span>
            </div>
            <div className="c-rule mt-2 mb-3" />
          </div>
          <div className="overflow-x-auto scrollbar-hide pb-2">
            <div className="flex gap-3 px-[18px]">
              {pickRandom(activeDeals, 3).map((d) => (
                <Link
                  key={d.id}
                  href={`/business/${d.business_slug}`}
                  className="shrink-0 w-[230px] press"
                >
                  <div
                    className="overflow-hidden h-full"
                    style={{
                      background: "var(--paper-warm)",
                      border: "2px solid var(--rule-strong-c)",
                    }}
                  >
                    {d.business_cover ? (
                      <div
                        className="aspect-[4/3] relative overflow-hidden"
                        style={{ background: "var(--ink-strong)" }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={d.business_cover}
                          alt={d.business_name}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        <span
                          className="c-badge c-badge-gold absolute"
                          style={{ top: 10, right: 10 }}
                        >
                          {d.discount_label}
                        </span>
                      </div>
                    ) : (
                      <div
                        className="px-4 pt-4 flex items-center justify-end"
                        style={{ background: "var(--paper-warm)" }}
                      >
                        <span className="c-badge c-badge-gold">
                          {d.discount_label}
                        </span>
                      </div>
                    )}
                    <div className="px-4 py-3">
                      <p
                        className="c-kicker truncate"
                        style={{
                          fontSize: 9,
                          letterSpacing: "0.16em",
                          color: "var(--ink-strong)",
                          opacity: 0.65,
                        }}
                      >
                        {d.business_name.toUpperCase()}
                      </p>
                      <p
                        className="c-card-t mt-1 line-clamp-2"
                        style={{
                          fontSize: 14,
                          lineHeight: 1.2,
                          color: "var(--ink-strong)",
                        }}
                      >
                        {d.title}
                      </p>
                      {d.promo_code && (
                        <div
                          className="mt-2.5 px-2 py-1 text-center"
                          style={{
                            background: "var(--paper)",
                            border: "2px dashed var(--rule-strong-c)",
                          }}
                        >
                          <span
                            className="font-mono"
                            style={{
                              fontSize: 11,
                              fontWeight: 800,
                              letterSpacing: "0.08em",
                              color: "var(--gold-c)",
                            }}
                          >
                            {d.promo_code}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* § ON THE MENU — food vendors (low priority, smaller rail) */}
      {foodVendors && foodVendors.length > 0 && (
        <>
          <CultureSectionHead kicker="§ ON THE MENU" title="Eat Local." />
          <div className="px-[18px] pb-8">
            {foodVendors.slice(0, 3).map((v, i) => (
              <CultureNumberedRow
                key={v.id}
                n={String(i + 1).padStart(2, "0")}
                kicker={(v.category ?? "").toUpperCase()}
                title={v.name}
                meta={
                  v.rating_avg
                    ? `★ ${Number(v.rating_avg).toFixed(1)}${v.is_open ? " · OPEN" : ""}`
                    : v.is_open
                      ? "OPEN NOW"
                      : undefined
                }
                img={v.image_urls?.[0] ?? undefined}
                imgAlt={v.name}
                href={`/business/${v.slug}`}
                topRule={i > 0}
              />
            ))}
          </div>
        </>
      )}

      {/* Colophon */}
      <div
        className="px-[18px] py-5"
        style={{ borderTop: "2px solid var(--rule-strong-c)" }}
      >
        <div className="flex items-center justify-between">
          <span className="c-kicker" style={{ opacity: 0.5 }}>
            HUB CITY · {cityUpper} · {dateLabel}
          </span>
          <span className="c-kicker" style={{ opacity: 0.5 }}>
            {volLabel} · {issLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
