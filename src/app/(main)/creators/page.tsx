import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveCity } from "@/lib/city-context";
import Icon from "@/components/ui/Icon";
import PullQuote from "@/components/ui/PullQuote";
import MagazineGrid from "@/components/ui/MagazineGrid";
import {
  EditorialNumber,
  FeatureSpread,
  HeroBlock,
  SectionKicker,
  SnapCarousel,
  Tag,
} from "@/components/ui/editorial";

// Valid user_role enum values that count as a "creator" in Discover.
// 'creator' was an alias in an earlier draft but it's NOT in the
// Postgres enum — including it here makes the whole .in() query error
// out with "invalid input value for enum user_role".
const CREATOR_ROLES = [
  "content_creator",
  "city_ambassador",
  "resource_provider",
  "chamber_admin",
] as const;

type RoleKey = (typeof CREATOR_ROLES)[number];

type BadgeVariant = "gold" | "emerald" | "coral" | "cyan" | "pink" | "purple" | "blue";

const ROLE_LABEL: Record<RoleKey, string> = {
  content_creator: "Creators",
  city_ambassador: "Ambassadors",
  resource_provider: "Community",
  chamber_admin: "Chamber",
};

const ROLE_BADGE: Record<string, { label: string; variant: BadgeVariant }> = {
  content_creator: { label: "Creator", variant: "coral" },
  city_ambassador: { label: "Ambassador", variant: "purple" },
  resource_provider: { label: "Community", variant: "cyan" },
  chamber_admin: { label: "Chamber", variant: "gold" },
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Discover | Culture`,
    description: `Watch, follow, and discover creators across every Culture city.`,
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

function isRoleKey(v: string): v is RoleKey {
  return (CREATOR_ROLES as readonly string[]).includes(v);
}

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

  // Live cities for the filter bar — independent of the profile query.
  const { data: cityRows } = await supabase
    .from("cities")
    .select("id, slug, name")
    .eq("launch_status", "live")
    .order("name", { ascending: true });
  const liveCities = (cityRows ?? []) as { id: string; slug: string; name: string }[];
  const selectedCity = selectedCitySlug === "all"
    ? null
    : liveCities.find((c) => c.slug === selectedCitySlug) ?? null;

  // Discover defaults to the widest net: every creator-ish role across
  // every city. Narrow with ?role= and ?city= when the user picks a
  // filter pill.
  let query = supabase
    .from("profiles")
    .select(
      "id, display_name, handle, avatar_url, bio, role, verification_status, profile_tags, city:cities!profiles_city_id_fkey(slug, name)"
    )
    .in("role", CREATOR_ROLES as unknown as string[])
    .not("handle", "is", null);
  if (selectedRole !== "all") query = query.eq("role", selectedRole);
  if (selectedCity) query = query.eq("city_id", selectedCity.id);

  const { data: creatorRows, error: creatorErr } = await query.order("display_name", { ascending: true });
  if (creatorErr) console.warn("creators query error:", creatorErr.message);

  const creators = (creatorRows ?? []) as unknown as CreatorProfile[];

  // Filter pill URL helper. Preserves the other filter so you can stack
  // role + city narrowing without the one clobbering the other.
  function filterHref(nextRole: string, nextCity: string) {
    const params = new URLSearchParams();
    if (nextRole !== "all") params.set("role", nextRole);
    if (nextCity !== "all") params.set("city", nextCity);
    const qs = params.toString();
    return qs ? `/creators?${qs}` : "/creators";
  }

  const creatorIds = creators.map((c) => c.id);
  const nowISO = new Date().toISOString();

  // Guard against .in() with an empty array (Supabase turns it into a
  // Postgres `WHERE author_id IN ()` syntax error).
  const [postsRes, reelsRes, channelsRes] = creatorIds.length === 0
    ? [{ data: [] }, { data: [] }, { data: [] }]
    : await Promise.all([
    supabase
      .from("posts")
      .select("id, image_url, video_url, media_type, body, author_id, created_at")
      .in("author_id", creatorIds)
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(120),
    supabase
      .from("reels")
      .select("id, video_url, poster_url, caption, author_id, like_count")
      .in("author_id", creatorIds)
      .eq("is_published", true)
      .or(`expires_at.is.null,expires_at.gt.${nowISO}`)
      .order("created_at", { ascending: false })
      .limit(80),
    supabase
      .from("channels")
      .select("id, slug, name, owner_id, follower_count")
      .in("owner_id", creatorIds)
      .eq("is_active", true),
  ]);

  const posts = (postsRes.data ?? []) as CreatorPost[];
  const reels = (reelsRes.data ?? []) as CreatorReel[];
  const channels = (channelsRes.data ?? []) as CreatorChannel[];

  // Channel videos — one query keyed by channel.id rather than N-per-creator.
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

  // Indexes for constant-time per-creator lookup.
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

  return (
    <div className="culture-surface min-h-dvh animate-fade-in pb-safe">
      {/* Header */}
      <div
        className="px-[18px] pt-5 pb-5"
        style={{ borderBottom: "3px solid var(--rule-strong-c)" }}
      >
        <div className="c-kicker" style={{ opacity: 0.65 }}>§ VOL·01 · ISSUE DISCOVER</div>
        <h1 className="c-hero mt-2" style={{ fontSize: 52, lineHeight: 0.9 }}>Discover.</h1>
        <p className="c-serif-it mt-2" style={{ fontSize: 13 }}>
          Cool things to watch from creators across every Culture city
          {activeCity ? ` — including ${activeCity.name}` : ""}.
        </p>
      </div>

      {/* ── Filters ───────────────────────────────────────────────── */}
      <div className="px-5 pt-2 pb-3 flex flex-col gap-3">
        {/* Type */}
        <div>
          <p className="mb-1.5">
            <SectionKicker tone="muted">Type</SectionKicker>
          </p>
          <div className="-mx-5 px-5 overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 pb-1">
              <Link
                href={filterHref("all", selectedCitySlug)}
                className="shrink-0 px-3.5 py-1.5 transition-colors press"
                style={{
                  background: selectedRole === "all" ? "var(--gold-c)" : "var(--paper)",
                  color: "var(--ink-strong)",
                  border: "2px solid var(--rule-strong-c)",
                  fontFamily: "var(--font-archivo-narrow), sans-serif",
                  fontSize: 11,
                  fontWeight: selectedRole === "all" ? 800 : 600,
                }}
              >
                All
              </Link>
              {(CREATOR_ROLES as readonly RoleKey[]).map((r) => (
                <Link
                  key={r}
                  href={filterHref(r, selectedCitySlug)}
                  className="shrink-0 px-3.5 py-1.5 transition-colors press"
                  style={{
                    background: selectedRole === r ? "var(--gold-c)" : "var(--paper)",
                    color: "var(--ink-strong)",
                    border: "2px solid var(--rule-strong-c)",
                    fontFamily: "var(--font-archivo-narrow), sans-serif",
                    fontSize: 11,
                    fontWeight: selectedRole === r ? 800 : 600,
                  }}
                >
                  {ROLE_LABEL[r]}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* City */}
        <div>
          <p className="mb-1.5">
            <SectionKicker tone="muted">City</SectionKicker>
          </p>
          <div className="-mx-5 px-5 overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 pb-1">
              <Link
                href={filterHref(selectedRole, "all")}
                className="shrink-0 px-3.5 py-1.5 transition-colors press"
                style={{
                  background: selectedCitySlug === "all" ? "var(--gold-c)" : "var(--paper)",
                  color: "var(--ink-strong)",
                  border: "2px solid var(--rule-strong-c)",
                  fontFamily: "var(--font-archivo-narrow), sans-serif",
                  fontSize: 11,
                  fontWeight: selectedCitySlug === "all" ? 800 : 600,
                }}
              >
                All cities
              </Link>
              {liveCities.map((c) => (
                <Link
                  key={c.slug}
                  href={filterHref(selectedRole, c.slug)}
                  className="shrink-0 px-3.5 py-1.5 transition-colors press"
                  style={{
                    background: selectedCitySlug === c.slug ? "var(--gold-c)" : "var(--paper)",
                    color: "var(--ink-strong)",
                    border: "2px solid var(--rule-strong-c)",
                    fontFamily: "var(--font-archivo-narrow), sans-serif",
                    fontSize: 11,
                    fontWeight: selectedCitySlug === c.slug ? 800 : 600,
                  }}
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Results summary + clear — only when a filter is active */}
        {(selectedRole !== "all" || selectedCitySlug !== "all") && (
          <div className="flex items-center justify-between">
            <span className="c-meta" style={{ fontSize: 11 }}>
              {creators.length} result{creators.length === 1 ? "" : "s"}
            </span>
            <Link
              href="/creators"
              className="c-kicker press"
              style={{ color: "var(--ink-strong)" }}
            >
              Clear filters
            </Link>
          </div>
        )}
      </div>

      {/* Empty state — shown inline when a filter returned nothing, or
          as a full-page state when the platform has no creators at all. */}
      {creators.length === 0 && (
        <div
          className="mx-5 my-6 py-12 px-6 text-center"
          style={{
            background: "var(--paper)",
            border: "2px solid var(--rule-strong-c)",
          }}
        >
          <Icon name="sparkle" size={28} style={{ color: "var(--ink-strong)" }} className="mx-auto mb-3" />
          <p className="c-card-t mb-1" style={{ fontSize: 14, color: "var(--ink-strong)" }}>
            No creators match this filter
          </p>
          <p className="c-body mb-4" style={{ fontSize: 12, color: "var(--ink-strong)", opacity: 0.7 }}>
            Try a different type or city.
          </p>
          <Link href="/creators" className="c-btn c-btn-primary c-btn-sm inline-block">
            See everyone
          </Link>
        </div>
      )}

      {/* Editorial feed — each creator is a numbered feature spread. */}
      <div className="flex flex-col">
        {creators.map((creator, creatorIdx) => {
          const creatorPosts = (postsByCreator.get(creator.id) ?? []).slice(0, 6);
          const creatorReels = (reelsByCreator.get(creator.id) ?? []).slice(0, 5);
          const channel = channelByOwner.get(creator.id);
          const creatorVideos = channel
            ? (videosByChannel.get(channel.id) ?? []).slice(0, 4)
            : [];

          const initials = creator.display_name
            .split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

          // Hero image: prefer the first reel poster (cinematic), then
          // first image post, then null (renders a typographic hero).
          const heroImage =
            creatorReels.find((r) => r.poster_url)?.poster_url ??
            creatorPosts.find((p) => p.image_url)?.image_url ??
            null;

          const roleBadge = creator.role ? ROLE_BADGE[creator.role] : null;
          const kickerLine = `${roleBadge?.label ?? "Creator"} · ${creator.city?.name ?? "Everywhere"}`;

          // Numbered section index that only counts sections the creator
          // actually has content for — so the numbering reads naturally
          // regardless of whether they have reels / posts / show.
          let sectionCounter = 0;
          const nextSection = () => ++sectionCounter;

          return (
            <FeatureSpread
              key={creator.id}
              index={creatorIdx + 1}
              total={creators.length}
              kicker={kickerLine}
              first={creatorIdx === 0}
            >
              {/* Hero block — 4:5 cinematic with avatar/tags/name overlay */}
              <HeroBlock image={heroImage} aspect="4/5" alt={creator.display_name}>
                {/* Avatar — pinned top-left like a clipped polaroid */}
                <Link
                  href={`/user/${creator.handle}`}
                  aria-label={`${creator.display_name} profile`}
                  className="absolute top-5 left-5 w-14 h-14 rounded-full overflow-hidden border-2 border-gold shadow-[0_8px_30px_rgba(0,0,0,0.5)] z-10"
                >
                  {creator.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={creator.avatar_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-ink to-midnight text-gold font-heading font-bold">
                      {initials}
                    </div>
                  )}
                </Link>

                {/* Profile tags, right rail */}
                {creator.profile_tags && creator.profile_tags.length > 0 && (
                  <div className="absolute top-20 right-5 flex flex-col items-end gap-1.5 max-w-[45%] z-10">
                    {creator.profile_tags.slice(0, 3).map((tag) => (
                      <Tag key={tag} size="xs" tone="default">
                        #{tag}
                      </Tag>
                    ))}
                  </div>
                )}

                {/* Name + handle, anchored bottom */}
                <div className="absolute bottom-6 left-5 right-5 z-10">
                  <h2 className="font-display text-[44px] leading-[0.95] tracking-tight text-white drop-shadow-[0_6px_30px_rgba(0,0,0,0.7)]">
                    {creator.display_name}
                  </h2>
                  <div className="mt-3 flex items-center gap-3">
                    <span className="block h-[2px] w-10 bg-gold" />
                    <span className="text-[12px] font-bold text-gold tracking-[0.08em]">
                      @{creator.handle}
                    </span>
                    {creator.verification_status === "verified" && (
                      <Icon name="verified" size={13} className="text-cyan" />
                    )}
                  </div>
                </div>
              </HeroBlock>

              {/* Pull-quote bio — cold open below the hero */}
              {creator.bio && (
                <div className="px-5 pt-6">
                  <PullQuote quote={creator.bio} />
                </div>
              )}

              {/* Reels */}
              {creatorReels.length > 0 && (
                <div className="pt-8">
                  <SnapCarousel
                    number={nextSection()}
                    kicker="Reels"
                    seeAllHref="/reels"
                    seeAllLabel="Watch →"
                    itemGap="gap-2"
                  >
                    {creatorReels.map((r, i) => (
                      <Link
                        key={r.id}
                        href="/reels"
                        className="shrink-0 w-[120px] aspect-[9/16] rounded-xl overflow-hidden relative group press snap-start"
                        style={{ transform: i % 2 === 1 ? "translateY(6px)" : undefined }}
                      >
                        {r.poster_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={r.poster_url} alt="" className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-black via-deep to-midnight flex items-center justify-center">
                            <Icon name="video" size={22} className="text-white/30" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                        <span className="absolute top-1.5 left-1.5 z-10">
                          <EditorialNumber n={i + 1} size="sm" prefix="" className="drop-shadow" />
                        </span>
                        <div className="absolute bottom-1.5 left-2 right-2 flex items-center gap-1">
                          <Icon name="video" size={10} className="text-white" />
                          <span className="text-[10px] font-bold text-white tracking-wide">
                            {r.like_count.toLocaleString()}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </SnapCarousel>
                </div>
              )}

              {/* Latest posts — featured + asymmetric grid */}
              {creatorPosts.length > 0 && (() => {
                const featured = creatorPosts[0];
                const rest = creatorPosts.slice(1, 5);
                return (
                  <div className="pt-8">
                    <SnapCarousel
                      number={nextSection()}
                      kicker="Latest Work"
                      seeAllHref={`/user/${creator.handle}`}
                      seeAllLabel="Full feed →"
                      rail={false}
                    >
                      {/* Featured post + 2x2 supporting grid — asymmetric */}
                      <MagazineGrid variant="featured-4" className="px-5 !gap-1">
                        <Link
                          href={`/user/${creator.handle}`}
                          className="relative aspect-square bg-white/[0.04] overflow-hidden group"
                        >
                          {featured.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={featured.image_url} alt="" className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />
                          ) : featured.media_type === "video" ? (
                            <div className="w-full h-full bg-gradient-to-br from-black via-deep to-midnight flex items-center justify-center">
                              <Icon name="video" size={28} className="text-white/30" />
                            </div>
                          ) : (
                            <div className="w-full h-full p-4 flex items-center bg-gradient-to-br from-ink via-midnight to-midnight">
                              <p className="font-display italic text-[16px] text-ivory/75 line-clamp-6 leading-snug">&ldquo;{featured.body}&rdquo;</p>
                            </div>
                          )}
                          {featured.media_type === "video" && (
                            <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1">
                              <svg width="8" height="8" viewBox="0 0 24 24" fill="white"><polygon points="6,4 20,12 6,20" /></svg>
                              <span className="text-[9px] font-bold text-white tracking-wide">VIDEO</span>
                            </div>
                          )}
                        </Link>
                        {rest.map((p) => (
                          <Link
                            key={p.id}
                            href={`/user/${creator.handle}`}
                            className="relative aspect-square bg-white/[0.04] overflow-hidden group"
                          >
                            {p.image_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={p.image_url} alt="" className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" />
                            ) : p.media_type === "video" ? (
                              <div className="w-full h-full bg-gradient-to-br from-black via-deep to-midnight flex items-center justify-center">
                                <Icon name="video" size={16} className="text-white/30" />
                              </div>
                            ) : (
                              <div className="w-full h-full p-1.5 flex items-center">
                                <p className="text-[9px] text-ivory/70 line-clamp-4 leading-snug">{p.body}</p>
                              </div>
                            )}
                            {p.media_type === "video" && (
                              <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black/60 flex items-center justify-center">
                                <svg width="8" height="8" viewBox="0 0 24 24" fill="white"><polygon points="6,4 20,12 6,20" /></svg>
                              </div>
                            )}
                          </Link>
                        ))}
                      </MagazineGrid>
                    </SnapCarousel>
                  </div>
                );
              })()}

              {/* Channel / Show */}
              {channel && creatorVideos.length > 0 && (
                <div className="pt-8">
                  <p className="px-5 mb-3 font-display text-[18px] leading-tight text-ivory">
                    {channel.name}
                  </p>
                  <SnapCarousel
                    number={nextSection()}
                    kicker="From the Channel"
                    seeAllHref={`/live/channel/${channel.slug || channel.id}`}
                    seeAllLabel="Tune in →"
                    itemGap="gap-3"
                  >
                    {creatorVideos.map((v) => {
                      const thumb = v.thumbnail_url
                        ?? (v.mux_playback_id ? `https://image.mux.com/${v.mux_playback_id}/thumbnail.webp?width=320&height=180&time=5` : null);
                      return (
                        <Link
                          key={v.id}
                          href={`/live/watch/${v.id}`}
                          className="shrink-0 w-[190px] group press snap-start"
                        >
                          <div className="relative aspect-video rounded-lg overflow-hidden bg-black/40 border border-white/[0.05]">
                            {thumb ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={thumb} alt={v.title} className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Icon name="film" size={18} className="text-white/30" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            {v.duration && (
                              <span className="absolute bottom-1 right-1 bg-black/80 rounded px-1.5 py-0.5 text-[9px] font-mono text-white tracking-wider">
                                {Math.floor(v.duration / 60)}:{Math.floor(v.duration % 60).toString().padStart(2, "0")}
                              </span>
                            )}
                          </div>
                          <p className="font-heading font-semibold text-[12px] text-white line-clamp-1 mt-1.5">{v.title}</p>
                        </Link>
                      );
                    })}
                  </SnapCarousel>
                </div>
              )}

              {/* Visit CTA — full-width letter-spaced bar */}
              <div className="px-5 pt-8 pb-10">
                <Link
                  href={`/user/${creator.handle}`}
                  className="group relative block overflow-hidden rounded-2xl border border-gold/40 bg-gold/5 hover:bg-gold hover:border-gold transition-colors"
                >
                  <div className="flex items-center justify-between px-5 py-4">
                    <span className="font-display text-[16px] text-gold group-hover:text-midnight transition-colors">
                      Visit {creator.display_name.split(" ")[0]}
                    </span>
                    <span className="text-[10px] font-bold tracking-[0.32em] text-gold group-hover:text-midnight uppercase transition-colors">
                      Profile &nbsp;·&nbsp; →
                    </span>
                  </div>
                  <div className="h-[1px] bg-gradient-to-r from-gold/10 via-gold/40 to-gold/10 group-hover:bg-midnight/60 transition-colors" />
                </Link>
              </div>
            </FeatureSpread>
          );
        })}
      </div>
    </div>
  );
}
