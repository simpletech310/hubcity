import Image from "next/image";
import Link from "next/link";
import SectionHeader from "@/components/layout/SectionHeader";
import EditorialHeader from "@/components/ui/EditorialHeader";
import Badge from "@/components/ui/Badge";
import Icon from "@/components/ui/Icon";
import AISearchButton from "@/components/home/AISearchButton";
import LiveNowBanner from "@/components/live/LiveNowBanner";
import { Masthead } from "@/components/ui/editorial";
import { createClient } from "@/lib/supabase/server";
import { ROLE_BADGE_MAP } from "@/lib/constants";
import { getFeaturedArt } from "@/lib/art-spotlight";
import { getActiveCity } from "@/lib/city-context";
import { formatDistanceToNow } from "date-fns";
import type { Post } from "@/types/database";
import type { IconName } from "@/components/ui/Icon";

function timeAgo(dateStr: string): string {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

type DiscoverChip = { label: string; href: string; icon: IconName };

const DISCOVER_CHIPS: DiscoverChip[] = [
  { label: "Events", href: "/events", icon: "calendar" },
  { label: "Food", href: "/food", icon: "utensils" },
  { label: "Shows", href: "/live", icon: "live" },
  { label: "Creators", href: "/pulse", icon: "sparkle" },
  { label: "Businesses", href: "/business", icon: "store" },
];

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

type ShowItem = {
  key: string;
  kind: "stream" | "podcast";
  title: string;
  thumbnail: string | null;
  kicker: string;
  href: string;
};

export default async function HomePage() {
  const supabase = await createClient();
  const nowIso = new Date().toISOString();
  const todayIso = new Date().toISOString().split("T")[0];
  const activeCity = await getActiveCity();
  const cityId = activeCity?.id ?? null;

  // Helper that conditionally narrows a query to the active city. When no
  // city has been resolved yet (very rare — only on cold-boot with zero
  // live cities) we fall back to a global query so the homepage still has
  // content rather than an empty shell.
  const scopeToCity = <T,>(q: T): T => {
    if (!cityId) return q;
    // The Supabase QueryBuilder chains type-narrow nicely once you cast.
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
  ]);

  const cityName = activeCity?.name ?? "your city";
  let displayName = cityName;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();
    if (profile?.display_name) {
      displayName = profile.display_name.split(" ")[0];
    }
  }

  const pulsePosts: Post[] = (recentPosts ?? []) as Post[];
  const greeting = getGreeting();
  const featuredArt = cityId ? await getFeaturedArt(cityId) : null;
  const hasLive = Boolean(liveStreams && liveStreams.length > 0);
  const featuredBusinesses = businesses ?? [];

  // Build "New Shows" mix: upcoming streams first, then recent podcasts
  const streamItems: ShowItem[] = (upcomingStreams ?? []).map((s) => {
    const dt = s.scheduled_at ? new Date(s.scheduled_at) : null;
    const kicker = dt
      ? `${dt.toLocaleDateString("en-US", { month: "short", day: "numeric" })} · ${dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`
      : "Upcoming";
    return {
      key: `stream-${s.id}`,
      kind: "stream",
      title: s.title,
      thumbnail: s.thumbnail_url,
      kicker,
      href: `/live/${s.id}`,
    };
  });
  const podcastItems: ShowItem[] = (recentPodcasts ?? []).map((p) => ({
    key: `podcast-${p.id}`,
    kind: "podcast",
    title: p.title,
    thumbnail: p.thumbnail_url,
    kicker: p.episode_number ? `Episode ${p.episode_number}` : "New podcast",
    href: `/podcasts/${p.id}`,
  }));
  const showItems: ShowItem[] = [...streamItems, ...podcastItems].slice(0, 6);

  // Creator posts: prefer media-first; fall back to mix if too few
  const mediaPosts = pulsePosts
    .filter((p) => p.image_url || p.video_url || p.mux_playback_id)
    .slice(0, 4);
  const displayPosts =
    mediaPosts.length >= 2 ? mediaPosts : pulsePosts.slice(0, 4);

  return (
    <div className="animate-fade-in space-y-6">
      {/* -- 1. Art Spotlight Hero -- */}
      {featuredArt && (
        <section className="relative">
          <Link href={`/art/${featuredArt.slug}`} className="block press">
            <div className="relative w-full h-[65vh]">
              <Image
                src={featuredArt.imageUrl}
                alt={featuredArt.title}
                fill
                className="object-cover"
                priority
                sizes="100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-midnight/30 via-transparent to-midnight" />
              <div className="absolute inset-0 bg-gradient-to-t from-midnight/90 via-transparent to-transparent" />

              <div className="absolute top-4 left-5 z-10">
                <span className="inline-flex items-center gap-1.5 bg-black/50 backdrop-blur-md border border-gold/30 rounded-full px-3 py-1.5 text-[10px] font-bold text-gold tracking-wider uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
                  Art Spotlight
                </span>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-5 pb-8 z-10">
                <p className="text-[11px] text-white/50 font-medium uppercase tracking-wider mb-1">
                  Featured Artist &middot; {featuredArt.year}
                </p>
                <h2 className="font-display text-[28px] leading-tight mb-1.5 drop-shadow-lg">
                  &ldquo;{featuredArt.title}&rdquo;
                </h2>
                <p className="text-[14px] text-gold font-heading font-semibold mb-1">
                  {featuredArt.artist}
                </p>
                <p className="text-[12px] text-white/40">
                  {featuredArt.medium} &middot; {featuredArt.location}
                </p>

                <div className="flex justify-center mt-6">
                  <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center animate-bounce">
                    <Icon name="chevron-down" size={14} className="text-white" />
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* -- 2. Masthead + Search -- */}
      <Masthead
        volume="VOL · 01"
        issue={`ISSUE ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase()}`}
        headline={`${greeting.toUpperCase()}, ${displayName.toUpperCase()}.`}
        strap={`What's moving in ${cityName} today`}
      />
      <section className="px-5 -mt-2">
        <AISearchButton />
      </section>

      {/* -- 3. Discover Chips — gold tag rail -- */}
      <section>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 px-5">
          {DISCOVER_CHIPS.map((chip) => (
            <Link key={chip.href} href={chip.href} className="press shrink-0">
              <span className="inline-flex items-center gap-2 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-gold/30 rounded-full px-3.5 py-2 transition-colors">
                <Icon name={chip.icon} size={13} className="text-gold" />
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-ivory/80">
                  {chip.label}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* -- 4. Critical Alerts (safety floor) -- */}
      {criticalAlerts && criticalAlerts.length > 0 && (
        <section className="px-5">
          <div className="flex flex-col gap-2">
            {criticalAlerts.map((alert) => (
              <Link key={alert.id} href="/city-data" className="press">
                <div className="bg-coral/10 border border-coral/25 rounded-xl p-3 flex items-center gap-2.5">
                  <Icon
                    name="alert"
                    size={16}
                    className="text-coral shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-coral">
                      {alert.title}
                    </p>
                    <p className="text-[11px] text-white/50 line-clamp-1">
                      {alert.body}
                    </p>
                  </div>
                  <Icon
                    name="chevron-right"
                    size={12}
                    className="text-white/20 shrink-0"
                  />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* -- 5. Live Now -- */}
      {hasLive && <LiveNowBanner streams={liveStreams!} />}

      {/* -- 6. Upcoming Events -- */}
      {events && events.length > 0 && (
        <section className="space-y-3">
          <div className="px-5">
            <SectionHeader
              title="Upcoming Events"
              subtitle={`This week in ${cityName}`}
              linkText="See All"
              linkHref="/events"
              compact
            />
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 px-5">
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="shrink-0 w-[240px] press"
              >
                <div className="glass-card-elevated rounded-2xl overflow-hidden">
                  <div className="relative h-[160px] bg-royal">
                    {event.image_url ? (
                      <Image
                        src={event.image_url}
                        alt={event.title}
                        fill
                        className="object-cover"
                        sizes="240px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gold/10 to-purple-900/10">
                        <Icon
                          name="calendar"
                          size={32}
                          className="text-white/20"
                        />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent" />
                    <div className="absolute top-2.5 left-2.5">
                      <div className="bg-black/60 backdrop-blur-sm rounded-lg px-2.5 py-1.5 text-center border border-white/10">
                        <p className="text-[10px] font-bold text-gold uppercase leading-none">
                          {new Date(event.start_date).toLocaleDateString(
                            "en-US",
                            { month: "short" },
                          )}
                        </p>
                        <p className="text-[18px] font-bold leading-none mt-0.5">
                          {new Date(event.start_date).getDate()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="text-[13px] font-bold leading-snug line-clamp-2 mb-1">
                      {event.title}
                    </h3>
                    {event.location_name && (
                      <p className="text-[11px] text-warm-gray truncate flex items-center gap-1">
                        <Icon
                          name="map-pin"
                          size={10}
                          className="text-warm-gray shrink-0"
                        />
                        {event.location_name}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* -- 7. Eat in Compton -- */}
      {foodVendors && foodVendors.length > 0 && (
        <section className="space-y-3">
          <div className="px-5">
            <SectionHeader
              title={`Eat in ${cityName}`}
              subtitle="Top-rated local spots"
              linkText="See All"
              linkHref="/food"
              compact
            />
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 px-5">
            {foodVendors.map((vendor) => (
              <Link
                key={vendor.id}
                href={`/food/vendor/${vendor.id}`}
                className="shrink-0 w-[180px] press"
              >
                <div className="glass-card-elevated rounded-2xl overflow-hidden">
                  <div className="relative h-[130px] bg-royal">
                    {vendor.image_urls?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={vendor.image_urls[0]}
                        alt={vendor.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Icon
                          name="utensils"
                          size={28}
                          className="text-white/20"
                        />
                      </div>
                    )}
                    {vendor.is_open && (
                      <div className="absolute top-2 right-2">
                        <span className="inline-flex items-center gap-1 bg-emerald/90 text-midnight rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                          <span className="w-1 h-1 rounded-full bg-midnight" />
                          Open
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-2.5">
                    <h3 className="text-[12px] font-bold truncate">
                      {vendor.name}
                    </h3>
                    <div className="flex items-center justify-between mt-1 gap-2">
                      <div className="flex items-center gap-1 shrink-0">
                        <Icon name="star" size={10} className="text-gold" />
                        <span className="text-[10px] text-warm-gray">
                          {Number(vendor.rating_avg || 0).toFixed(1)}
                        </span>
                      </div>
                      {vendor.business_sub_type && (
                        <span className="text-[9px] text-white/40 uppercase tracking-wider truncate">
                          {vendor.business_sub_type}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* -- 8. New Shows (upcoming streams + fresh podcasts) -- */}
      {showItems.length > 0 && (
        <section className="space-y-3">
          <div className="px-5">
            <SectionHeader
              title="New Shows"
              subtitle="Streams & podcasts coming up"
              linkText="See All"
              linkHref="/live"
              compact
            />
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 px-5">
            {showItems.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className="shrink-0 w-[200px] press"
              >
                <div className="glass-card-elevated rounded-2xl overflow-hidden">
                  <div className="relative h-[260px] bg-royal">
                    {item.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900/20 to-gold/10">
                        <Icon
                          name={item.kind === "stream" ? "live" : "podcast"}
                          size={36}
                          className="text-white/20"
                        />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />
                    <div className="absolute top-2.5 left-2.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                          item.kind === "stream"
                            ? "bg-coral/90 text-white"
                            : "bg-cyan/90 text-midnight"
                        }`}
                      >
                        <Icon
                          name={item.kind === "stream" ? "live" : "podcast"}
                          size={9}
                        />
                        {item.kind === "stream" ? "Live Soon" : "Podcast"}
                      </span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-[9px] font-bold text-gold uppercase tracking-wider mb-1 truncate">
                        {item.kicker}
                      </p>
                      <h3 className="text-[13px] font-bold leading-snug line-clamp-2">
                        {item.title}
                      </h3>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* -- 9. From Creators (media-first pulse) -- */}
      {displayPosts.length > 0 && (
        <section className="space-y-3">
          <div className="px-5">
            <EditorialHeader
              kicker="THE PULSE"
              title="From Creators"
              subtitle="Fresh posts from your community"
            />
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 px-5">
            {displayPosts.map((post) => {
              const badge = post.author?.role
                ? ROLE_BADGE_MAP[post.author.role]
                : null;
              const hasMedia = Boolean(
                post.image_url || post.video_url || post.mux_playback_id,
              );
              const isVideo = Boolean(
                post.video_url || post.mux_playback_id,
              );
              return (
                <Link
                  key={post.id}
                  href="/pulse"
                  className="shrink-0 w-[220px] press"
                >
                  <div className="glass-card-elevated rounded-2xl overflow-hidden">
                    <div className="relative h-[275px] bg-royal">
                      {post.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={post.image_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gold/5 to-coral/10 p-4">
                          <p className="text-[13px] text-white/80 font-medium line-clamp-6 text-center leading-snug">
                            {post.body}
                          </p>
                        </div>
                      )}
                      {post.image_url && (
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-transparent" />
                      )}
                      {isVideo && (
                        <div className="absolute top-2.5 right-2.5">
                          <span className="inline-flex items-center gap-1 bg-black/60 backdrop-blur-md rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                            <Icon name="video" size={9} />
                            Video
                          </span>
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="w-6 h-6 rounded-full overflow-hidden relative shrink-0 bg-deep">
                            {post.author?.avatar_url ? (
                              <Image
                                src={post.author.avatar_url}
                                alt={post.author.display_name ?? ""}
                                fill
                                className="object-cover"
                                sizes="24px"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gold">
                                {post.author?.display_name?.charAt(0) ?? "?"}
                              </div>
                            )}
                          </div>
                          <span className="text-[11px] font-semibold truncate">
                            {post.author?.display_name ?? "Community"}
                          </span>
                          {badge && (
                            <Badge label={badge.label} variant={badge.variant} />
                          )}
                        </div>
                        {hasMedia && post.body && (
                          <p className="text-[11px] text-white/70 line-clamp-2 leading-snug">
                            {post.body}
                          </p>
                        )}
                        {!hasMedia && (
                          <p className="text-[10px] text-white/40">
                            {timeAgo(post.created_at)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* -- 10. Local Favorites (Businesses) -- */}
      {featuredBusinesses.length > 0 && (
        <section className="space-y-3">
          <div className="px-5">
            <SectionHeader
              title="Local Favorites"
              subtitle={`Hand-picked spots in ${cityName}`}
              linkText="See All"
              linkHref="/business"
              compact
            />
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 px-5">
            {featuredBusinesses.map((biz) => (
              <Link
                key={biz.id}
                href={`/business/${biz.slug}`}
                className="shrink-0 w-[200px] press"
              >
                <div className="glass-card-elevated rounded-2xl overflow-hidden">
                  <div className="relative h-[150px] bg-royal">
                    {biz.image_urls?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={biz.image_urls[0]}
                        alt={biz.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Icon
                          name="store"
                          size={28}
                          className="text-white/20"
                        />
                      </div>
                    )}
                    <div className="absolute top-2.5 left-2.5">
                      <span className="inline-flex items-center gap-1 bg-gold/90 text-midnight rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                        <Icon name="star" size={9} />
                        Featured
                      </span>
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="text-[13px] font-bold leading-snug line-clamp-1">
                      {biz.name}
                    </h3>
                    <div className="flex items-center justify-between mt-1 gap-2">
                      <span className="text-[10px] text-warm-gray uppercase tracking-wider truncate">
                        {biz.category}
                      </span>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <Icon name="star" size={10} className="text-gold" />
                        <span className="text-[10px] text-warm-gray">
                          {Number(biz.rating_avg || 0).toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* -- 11. Footer CTA -- */}
      <section className="px-5 pb-6">
        <Link
          href="/district"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-gold/20 bg-gold/5 text-gold text-[13px] font-heading font-semibold press hover:bg-gold/10 transition-colors"
        >
          Explore more on Culture
          <Icon name="chevron-right" size={14} className="text-gold" />
        </Link>
      </section>
    </div>
  );
}
