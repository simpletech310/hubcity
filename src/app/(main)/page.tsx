import Link from "next/link";
import LiveNowBanner from "@/components/live/LiveNowBanner";
import TrendingStrip from "@/components/TrendingStrip";
import type { TrendingReel, TrendingEvent } from "@/components/TrendingStrip";
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

function timeAgo(dateStr: string): string {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
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
  ] = await Promise.all([
    supabase.auth.getUser(),
    scopeToCity(
      supabase
        .from("businesses")
        .select("id, name, slug, category, image_urls, address, rating_avg")
        .eq("is_featured", true)
        .eq("is_published", true),
    )
      .order("rating_avg", { ascending: false })
      .limit(8),
    scopeToCity(
      supabase
        .from("events")
        .select("id, title, start_date, location_name, image_url")
        .eq("is_published", true),
    )
      .gte("start_date", todayIso)
      .order("start_date", { ascending: true })
      .limit(6),
    scopeToCity(
      supabase
        .from("live_streams")
        .select("id, title, category, mux_playback_id, status, viewer_count")
        .eq("status", "active"),
    ).limit(3),
    scopeToCity(
      supabase
        .from("posts")
        .select(
          "*, author:profiles!posts_author_id_fkey(id, display_name, handle, avatar_url, role, verification_status)",
        )
        .eq("is_published", true),
    )
      .order("created_at", { ascending: false })
      .limit(8),
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
    // Trending reels — sorted by engagement
    supabase
      .from("reels")
      .select(
        "id, caption, poster_url, like_count, created_at, author:profiles!reels_author_id_fkey(display_name, handle)",
      )
      .eq("is_published", true)
      .order("like_count", { ascending: false })
      .limit(8)
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
          .limit(4);
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

  // Creator posts for the "For You" rail: prefer media-first
  const mediaPosts = pulsePosts
    .filter((p) => p.image_url || p.video_url || p.mux_playback_id)
    .slice(0, 4);
  const displayPosts =
    mediaPosts.length >= 2 ? mediaPosts : pulsePosts.slice(0, 4);

  const trendingReels: TrendingReel[] = trendingReelsRaw ?? [];
  const trendingEvents: TrendingEvent[] = trendingEventsRaw ?? [];

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

  // Hero poster image + copy
  const topStream = liveStreams?.[0];
  const heroImage: string | null =
    featuredArt?.imageUrl ??
    (topStream?.mux_playback_id
      ? `https://image.mux.com/${topStream.mux_playback_id}/thumbnail.jpg`
      : null) ??
    events?.[0]?.image_url ??
    trendingReelsRaw?.[0]?.poster_url ??
    mergedPosts.find((p) => p.image_url)?.image_url ??
    null;
  const heroTitleRaw =
    featuredArt?.title ??
    topStream?.title ??
    events?.[0]?.title ??
    `Hub ${cityName}`;
  // Split title into 2 stacked Anton lines if possible
  const heroTitleWords = heroTitleRaw.split(/\s+/);
  const heroLineBreak = Math.ceil(heroTitleWords.length / 2);
  const heroLine1 = heroTitleWords.slice(0, heroLineBreak).join(" ");
  const heroLine2 = heroTitleWords.slice(heroLineBreak).join(" ");
  const heroSubtitle = featuredArt?.artist
    ? `By ${featuredArt.artist}`
    : topStream
      ? "Live on Hub City now."
      : events?.[0]?.location_name ?? `${cityName} — the weekly cultural field guide.`;
  const heroHref = featuredArt?.slug
    ? `/art/${featuredArt.slug}`
    : topStream
      ? `/live/${topStream.id}`
      : events?.[0]
        ? `/events/${events[0].id}`
        : `/culture`;

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

      {/* Location ink-strip */}
      <div
        className="flex items-center gap-2 px-[18px] py-2.5"
        style={{ background: "var(--rule-strong-c)", color: "var(--paper)" }}
      >
        <span
          className="c-live-dot inline-block"
          style={{ width: 8, height: 8, background: "var(--green-c)" }}
        />
        <span className="c-kicker" style={{ color: "var(--paper)" }}>
          ON THE BLOCK · {cityUpper} · 72°
        </span>
        <span className="flex-1" />
        <Link
          href="/choose-city"
          className="c-kicker"
          style={{ color: "var(--gold-c)" }}
        >
          CHANGE ↗
        </Link>
      </div>

      {/* Marquee */}
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

      {/* Hero poster — full-bleed 1:1 */}
      <Link
        href={heroHref}
        className="block relative overflow-hidden"
        style={{ aspectRatio: "1 / 1" }}
      >
        {heroImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroImage}
            alt={heroTitleRaw}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 c-ph" aria-hidden />
        )}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, transparent 30%, rgba(26,21,18,0.85) 100%)",
          }}
        />
        <span
          className="c-badge c-badge-gold absolute"
          style={{ top: 14, left: 14 }}
        >
          § FEATURED
        </span>
        <div className="absolute inset-x-0 bottom-0 px-[18px] py-6">
          <h1
            style={{
              fontFamily: "var(--font-anton), Anton, sans-serif",
              fontSize: 60,
              lineHeight: 0.82,
              color: "#F3EEDC",
              textTransform: "uppercase",
              letterSpacing: "-0.02em",
              margin: 0,
            }}
          >
            {heroLine1}
            {heroLine2 && <br />}
            {heroLine2}
          </h1>
          <p
            style={{
              marginTop: 12,
              maxWidth: "80%",
              fontSize: 13,
              color: "#F3EEDC",
              fontFamily: "var(--font-body), Inter, sans-serif",
              lineHeight: 1.45,
              opacity: 0.9,
            }}
          >
            {heroSubtitle}
          </p>
          <div className="flex items-center gap-2.5 mt-4">
            <span
              style={{
                padding: "8px 14px",
                background: "#F3EEDC",
                color: "#1a1512",
                fontFamily: "var(--font-archivo), Archivo, sans-serif",
                fontWeight: 900,
                fontSize: 11,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
              }}
            >
              {topStream ? "WATCH LIVE" : featuredArt ? "READ · 8 MIN" : "OPEN ↗"}
            </span>
            {featuredArt?.artist && (
              <span
                className="c-kicker"
                style={{ color: "rgba(243,238,220,0.7)" }}
              >
                BY {featuredArt.artist.toUpperCase()}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* § TONIGHT section */}
      {events && events.length > 0 && (
        <>
          <CultureSectionHead
            kicker={`§ TONIGHT · ${tonightDateLabel}`}
            title="Where the Block Goes."
          />
          <div className="px-[18px] pb-5">
            {events.slice(0, 3).map((e, i) => {
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

      {/* § TRENDING */}
      {(trendingReels.length > 0 || trendingEvents.length > 0) && (
        <section>
          <div className="px-[18px] pt-6">
            <div className="c-kicker">§ TRENDING NOW</div>
          </div>
          <div className="px-[18px]">
            <div className="c-rule mt-2 mb-3" />
          </div>
          <TrendingStrip reels={trendingReels} events={trendingEvents} />
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
            {mergedPosts.slice(0, 3).map((p) => {
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

      {/* § FOR YOU (personalization) */}
      {(followedIds.length > 0 && displayPosts.length > 0) ||
      interestBusinesses.length > 0 ? (
        <>
          <CultureSectionHead kicker="§ FOR YOU" title="Picked for You." />
          <div className="px-[18px] pb-5">
            {interestBusinesses.length > 0
              ? interestBusinesses.slice(0, 4).map((b, i) => (
                  <CultureNumberedRow
                    key={b.id}
                    n={String(i + 1).padStart(2, "0")}
                    kicker={(b.category ?? "").toUpperCase()}
                    title={b.name}
                    meta={
                      b.rating_avg
                        ? `★ ${Number(b.rating_avg).toFixed(1)}`
                        : undefined
                    }
                    img={b.image_urls?.[0] ?? undefined}
                    imgAlt={b.name}
                    href={`/business/${b.slug}`}
                    topRule={i > 0}
                  />
                ))
              : displayPosts.slice(0, 3).map((p, i) => (
                  <CultureNumberedRow
                    key={p.id}
                    n={String(i + 1).padStart(2, "0")}
                    kicker={(p.author?.display_name ?? "community").toUpperCase()}
                    title={(p.body ?? "").slice(0, 80) || "Untitled"}
                    meta={timeAgo(p.created_at)}
                    img={p.image_url ?? undefined}
                    href="/pulse"
                    topRule={i > 0}
                  />
                ))}
          </div>
        </>
      ) : null}

      {/* § ON THE BLOCK — featured businesses */}
      {featuredBusinesses.length > 0 && (
        <>
          <CultureSectionHead
            kicker="§ ON THE BLOCK"
            title="Local Favorites."
          />
          <div className="px-[18px] pb-5">
            {featuredBusinesses.slice(0, 5).map((b, i) => (
              <CultureNumberedRow
                key={b.id}
                n={String(i + 1).padStart(2, "0")}
                kicker={(b.category ?? "").toUpperCase()}
                title={b.name}
                meta={[
                  b.rating_avg
                    ? `★ ${Number(b.rating_avg).toFixed(1)}`
                    : null,
                  b.address ?? null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
                img={b.image_urls?.[0] ?? undefined}
                imgAlt={b.name}
                href={`/business/${b.slug}`}
                topRule={i > 0}
              />
            ))}
          </div>
        </>
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
