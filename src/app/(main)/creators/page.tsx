import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveCity } from "@/lib/city-context";
import Icon from "@/components/ui/Icon";

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
      "id, display_name, handle, avatar_url, bio, role, verification_status, profile_tags, city:cities!profiles_city_id_fkey(slug, name)"
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

  const [postsRes, reelsRes, channelsRes] =
    creatorIds.length === 0
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

  return (
    <div className="culture-surface min-h-dvh animate-fade-in pb-safe">

      {/* ── Masthead ─────────────────────────────────────────────── */}
      <header
        className="px-[18px] pt-5 pb-4"
        style={{ borderBottom: "3px solid var(--rule-strong-c)" }}
      >
        <div className="c-kicker" style={{ opacity: 0.65 }}>
          § VOL·01 · ISSUE DISCOVER · {(activeCity?.name ?? "EVERYWHERE").toUpperCase()}
        </div>
        <h1
          className="c-hero mt-2"
          style={{ fontSize: 60, lineHeight: 0.86, letterSpacing: "-0.02em" }}
        >
          DISCOVER.
        </h1>
        <p className="c-serif-it mt-3" style={{ fontSize: 14, lineHeight: 1.45 }}>
          Find things to watch. Meet the people making it.
        </p>
      </header>

      {/* ── Stats strip ──────────────────────────────────────────── */}
      <div
        className="grid grid-cols-4"
        style={{ borderBottom: "3px solid var(--rule-strong-c)" }}
      >
        {[
          { label: "CREATORS", value: creators.length, gold: true },
          { label: "REELS", value: reels.length },
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

      {/* ── № 01 · HOT RIGHT NOW — reels + videos strip ─────────── */}
      {(reels.length > 0 || videos.length > 0) && (
        <section className="mt-6 mb-6">
          <div className="px-5 mb-3">
            <div
              className="flex items-baseline gap-3 pb-2"
              style={{ borderBottom: "2px solid var(--rule-strong-c)" }}
            >
              <span
                className="c-display c-tabnum"
                style={{ fontSize: 22, lineHeight: 1, color: "var(--gold-c)" }}
              >
                № 01
              </span>
              <span className="c-kicker" style={{ color: "var(--ink-mute)" }}>
                HOT RIGHT NOW
              </span>
              <Link
                href="/reels"
                className="ml-auto c-kicker"
                style={{ fontSize: 9, color: "var(--gold-c)" }}
              >
                ALL REELS ↗
              </Link>
            </div>
          </div>

          <div
            className="flex overflow-x-auto scrollbar-hide gap-2.5 pb-2"
            style={{ paddingLeft: 20, paddingRight: 20 }}
          >
            {/* Reels — tall 9:16 tiles */}
            {reels.slice(0, 8).map((reel) => {
              const creator = creatorById.get(reel.author_id);
              return (
                <Link
                  key={reel.id}
                  href="/reels"
                  className="shrink-0 press"
                  style={{ width: 108 }}
                >
                  <div
                    className="relative overflow-hidden"
                    style={{
                      aspectRatio: "9/16",
                      background: "var(--ink-strong)",
                      border: "2px solid var(--rule-strong-c)",
                    }}
                  >
                    {reel.poster_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={reel.poster_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    )}
                    {/* Ink vignette */}
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          "linear-gradient(180deg, rgba(26,21,18,0.35) 0%, transparent 40%, rgba(26,21,18,0.75) 100%)",
                      }}
                    />
                    {/* REEL chip */}
                    <div
                      className="absolute top-1.5 left-1.5 inline-flex items-center gap-1 px-1.5"
                      style={{
                        background: "var(--paper)",
                        border: "1.5px solid var(--rule-strong-c)",
                        height: 15,
                      }}
                    >
                      <span
                        style={{
                          width: 4,
                          height: 4,
                          background: "var(--gold-c)",
                          display: "inline-block",
                        }}
                      />
                      <span className="c-kicker" style={{ fontSize: 7 }}>
                        REEL
                      </span>
                    </div>
                    {/* Play tile */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div
                        className="flex items-center justify-center"
                        style={{
                          width: 28,
                          height: 28,
                          background: "var(--gold-c)",
                          border: "2px solid var(--paper)",
                        }}
                      >
                        <svg width="9" height="9" fill="var(--ink-strong)" viewBox="0 0 10 10">
                          <polygon points="3,2 9,5 3,8" />
                        </svg>
                      </div>
                    </div>
                    {/* Creator name bottom */}
                    {creator && (
                      <div className="absolute bottom-0 inset-x-0 p-1.5">
                        <p
                          className="c-kicker"
                          style={{ fontSize: 8, color: "var(--paper)", opacity: 0.9 }}
                        >
                          @{creator.handle}
                        </p>
                      </div>
                    )}
                    {/* Like count */}
                    {reel.like_count > 0 && (
                      <div
                        className="absolute top-1.5 right-1.5 inline-flex items-center gap-0.5 px-1"
                        style={{
                          background: "rgba(26,21,18,0.7)",
                          height: 14,
                        }}
                      >
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="var(--gold-c)">
                          <path d="M12 21s-8-4.5-8-10.5a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6-8 10.5-8 10.5z" />
                        </svg>
                        <span className="c-kicker" style={{ fontSize: 7, color: "var(--paper)" }}>
                          {reel.like_count >= 1000
                            ? `${(reel.like_count / 1000).toFixed(1)}k`
                            : reel.like_count}
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}

            {/* Videos — 16:9 tiles, wider */}
            {videos.slice(0, 5).map((v) => {
              const ch = channels.find((c) => c.id === v.channel_id);
              const creator = ch ? creatorById.get(ch.owner_id) : null;
              const thumb =
                v.thumbnail_url ??
                (v.mux_playback_id
                  ? `https://image.mux.com/${v.mux_playback_id}/thumbnail.webp?width=320&height=180&time=5`
                  : null);
              return (
                <Link
                  key={v.id}
                  href={`/live/watch/${v.id}`}
                  className="shrink-0 press"
                  style={{ width: 168 }}
                >
                  <div
                    className="relative overflow-hidden"
                    style={{
                      aspectRatio: "16/9",
                      background: "var(--ink-strong)",
                      border: "2px solid var(--rule-strong-c)",
                    }}
                  >
                    {thumb && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thumb} alt={v.title} className="w-full h-full object-cover" />
                    )}
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          "linear-gradient(180deg, transparent 45%, rgba(26,21,18,0.82) 100%)",
                      }}
                    />
                    {/* Play tile */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div
                        className="flex items-center justify-center"
                        style={{
                          width: 28,
                          height: 28,
                          background: "var(--gold-c)",
                          border: "2px solid var(--paper)",
                        }}
                      >
                        <svg width="9" height="9" fill="var(--ink-strong)" viewBox="0 0 10 10">
                          <polygon points="3,2 9,5 3,8" />
                        </svg>
                      </div>
                    </div>
                    {/* Duration */}
                    {v.duration && (
                      <div
                        className="absolute bottom-1 right-1 px-1.5 c-kicker"
                        style={{
                          background: "rgba(0,0,0,0.75)",
                          color: "#fff",
                          fontSize: 8,
                        }}
                      >
                        {Math.floor(v.duration / 60)}:
                        {Math.floor(v.duration % 60)
                          .toString()
                          .padStart(2, "0")}
                      </div>
                    )}
                    {/* Creator */}
                    {creator && (
                      <div className="absolute bottom-1 left-1.5">
                        <p
                          className="c-kicker"
                          style={{ fontSize: 8, color: "var(--paper)", opacity: 0.85 }}
                        >
                          @{creator.handle}
                        </p>
                      </div>
                    )}
                  </div>
                  <p
                    className="c-card-t mt-1 line-clamp-1"
                    style={{ fontSize: 11, color: "var(--ink-strong)" }}
                  >
                    {v.title}
                  </p>
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
      {creators.map((creator, idx) => {
        const creatorPosts = (postsByCreator.get(creator.id) ?? []).slice(0, 6);
        const creatorReels = (reelsByCreator.get(creator.id) ?? []).slice(0, 5);
        const channel = channelByOwner.get(creator.id);
        const creatorVideos = channel
          ? (videosByChannel.get(channel.id) ?? []).slice(0, 4)
          : [];

        const initials = creator.display_name
          .split(" ")
          .map((w) => w[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();

        const roleLabel = creator.role
          ? ROLE_LABEL[creator.role as RoleKey] ?? creator.role
          : null;

        // Numbered section: Hot Right Now = 01, creators start at 02
        const sectionNum = String(idx + 2).padStart(2, "0");

        const imagePosts = creatorPosts.filter((p) => p.image_url);

        return (
          <section
            key={creator.id}
            style={{ borderTop: "2px solid var(--rule-strong-c)" }}
          >
            {/* ─ Section header bar ─ */}
            <div
              className="px-5 py-2.5 flex items-center justify-between"
              style={{
                background: "var(--paper-warm)",
                borderBottom: "2px solid var(--rule-strong-c)",
              }}
            >
              <div className="flex items-baseline gap-2">
                <span
                  className="c-display c-tabnum"
                  style={{ fontSize: 18, lineHeight: 1, color: "var(--gold-c)" }}
                >
                  № {sectionNum}
                </span>
                {roleLabel && (
                  <span className="c-badge c-badge-ink" style={{ fontSize: 8 }}>
                    {roleLabel.toUpperCase()}
                  </span>
                )}
              </div>
              <span
                className="c-kicker"
                style={{ fontSize: 9, opacity: 0.5 }}
              >
                {creator.city?.name?.toUpperCase() ?? "EVERYWHERE"}
              </span>
            </div>

            {/* ─ Creator identity row ─ */}
            <div
              className="px-5 py-4 flex items-start gap-4"
              style={{ background: "var(--paper)" }}
            >
              {/* Square avatar */}
              <Link href={`/user/${creator.handle}`} className="shrink-0">
                <div
                  className="w-[68px] h-[68px] overflow-hidden"
                  style={{
                    border: "2px solid var(--rule-strong-c)",
                    background: "var(--ink-strong)",
                  }}
                >
                  {creator.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={creator.avatar_url}
                      alt={creator.display_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span
                        className="c-card-t"
                        style={{ fontSize: 22, color: "var(--gold-c)" }}
                      >
                        {initials}
                      </span>
                    </div>
                  )}
                </div>
              </Link>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-1.5">
                  <Link href={`/user/${creator.handle}`}>
                    <h2
                      className="c-card-t"
                      style={{
                        fontSize: 20,
                        color: "var(--ink-strong)",
                        lineHeight: 1.1,
                      }}
                    >
                      {creator.display_name}
                    </h2>
                  </Link>
                  {creator.verification_status === "verified" && (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="shrink-0 mt-0.5"
                      style={{ color: "var(--gold-c)" }}
                    >
                      <path
                        d="M9 12l2 2 4-4"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  )}
                </div>
                {creator.handle && (
                  <p className="c-kicker mt-0.5" style={{ fontSize: 9, opacity: 0.5 }}>
                    @{creator.handle}
                  </p>
                )}
                {creator.bio && (
                  <p
                    className="c-serif-it mt-1.5 line-clamp-2"
                    style={{ fontSize: 12, color: "var(--ink-strong)" }}
                  >
                    {creator.bio}
                  </p>
                )}
                {creator.profile_tags && creator.profile_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {creator.profile_tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="c-badge c-badge-gold"
                        style={{ fontSize: 8 }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ─ Media strip ─ */}
            {(creatorReels.length > 0 || imagePosts.length > 0 || creatorVideos.length > 0) && (
              <div
                className="flex overflow-x-auto scrollbar-hide gap-1.5 pb-3"
                style={{ paddingLeft: 20, paddingRight: 20 }}
              >
                {/* Reels — narrow 9:16 */}
                {creatorReels.slice(0, 4).map((r) => (
                  <Link
                    key={r.id}
                    href="/reels"
                    className="shrink-0 press"
                    style={{ width: 74 }}
                  >
                    <div
                      className="relative overflow-hidden"
                      style={{
                        aspectRatio: "9/16",
                        background: "var(--ink-strong)",
                        border: "2px solid var(--rule-strong-c)",
                      }}
                    >
                      {r.poster_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={r.poster_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      )}
                      <div
                        className="absolute inset-0"
                        style={{
                          background: "linear-gradient(180deg, rgba(26,21,18,0.2) 0%, transparent 50%, rgba(26,21,18,0.6) 100%)",
                        }}
                      />
                      {/* REEL chip */}
                      <div
                        className="absolute top-1 left-1 px-1 inline-flex items-center"
                        style={{
                          background: "var(--paper)",
                          border: "1.5px solid var(--rule-strong-c)",
                          height: 13,
                        }}
                      >
                        <span className="c-kicker" style={{ fontSize: 6.5 }}>
                          REEL
                        </span>
                      </div>
                      {/* Play */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div
                          style={{
                            width: 22,
                            height: 22,
                            background: "var(--gold-c)",
                            border: "1.5px solid var(--paper)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <svg width="7" height="7" fill="var(--ink-strong)" viewBox="0 0 10 10">
                            <polygon points="3,2 8.5,5 3,8" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}

                {/* Image posts — square */}
                {imagePosts.slice(0, 3).map((p) => (
                  <Link
                    key={p.id}
                    href={`/user/${creator.handle}`}
                    className="shrink-0 press"
                    style={{ width: 74 }}
                  >
                    <div
                      className="relative overflow-hidden"
                      style={{
                        aspectRatio: "1/1",
                        background: "var(--ink-strong)",
                        border: "2px solid var(--rule-strong-c)",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.image_url!}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </Link>
                ))}

                {/* Channel videos — 16:9, wider */}
                {creatorVideos.slice(0, 3).map((v) => {
                  const thumb =
                    v.thumbnail_url ??
                    (v.mux_playback_id
                      ? `https://image.mux.com/${v.mux_playback_id}/thumbnail.webp?width=240&height=135&time=5`
                      : null);
                  return (
                    <Link
                      key={v.id}
                      href={`/live/watch/${v.id}`}
                      className="shrink-0 press"
                      style={{ width: 130 }}
                    >
                      <div
                        className="relative overflow-hidden"
                        style={{
                          aspectRatio: "16/9",
                          background: "var(--ink-strong)",
                          border: "2px solid var(--rule-strong-c)",
                        }}
                      >
                        {thumb && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={thumb}
                            alt={v.title}
                            className="w-full h-full object-cover"
                          />
                        )}
                        <div
                          className="absolute inset-0"
                          style={{
                            background: "linear-gradient(180deg, transparent 50%, rgba(26,21,18,0.7) 100%)",
                          }}
                        />
                        {/* Play */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div
                            style={{
                              width: 22,
                              height: 22,
                              background: "var(--gold-c)",
                              border: "1.5px solid var(--paper)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <svg width="7" height="7" fill="var(--ink-strong)" viewBox="0 0 10 10">
                              <polygon points="3,2 8.5,5 3,8" />
                            </svg>
                          </div>
                        </div>
                        {/* Duration */}
                        {v.duration && (
                          <div
                            className="absolute bottom-1 right-1 c-kicker px-1"
                            style={{ background: "rgba(0,0,0,0.75)", color: "#fff", fontSize: 7 }}
                          >
                            {Math.floor(v.duration / 60)}:
                            {Math.floor(v.duration % 60)
                              .toString()
                              .padStart(2, "0")}
                          </div>
                        )}
                      </div>
                      <p
                        className="c-kicker mt-1 line-clamp-1"
                        style={{ fontSize: 9, color: "var(--ink-mute)" }}
                      >
                        {v.title}
                      </p>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* ─ Channel callout ─ */}
            {channel && (
              <div
                className="px-5 pb-3 flex items-center gap-2"
              >
                <Icon name="film" size={11} style={{ color: "var(--gold-c)" }} />
                <Link
                  href={`/live/channel/${channel.slug || channel.id}`}
                  className="c-kicker"
                  style={{ fontSize: 9, color: "var(--gold-c)" }}
                >
                  {channel.name.toUpperCase()} · CHANNEL ↗
                </Link>
                {channel.follower_count > 0 && (
                  <span className="c-kicker" style={{ fontSize: 9, opacity: 0.45 }}>
                    {channel.follower_count.toLocaleString()} followers
                  </span>
                )}
              </div>
            )}

            {/* ─ View profile CTA bar ─ */}
            <Link
              href={`/user/${creator.handle}`}
              className="flex items-center justify-between px-5 py-3 press"
              style={{
                borderTop: "2px solid var(--rule-strong-c)",
                background: "var(--paper-warm)",
              }}
            >
              <span className="c-kicker" style={{ fontSize: 9 }}>
                VIEW PROFILE
              </span>
              <span className="c-kicker" style={{ fontSize: 9, color: "var(--gold-c)" }}>
                @{creator.handle} ↗
              </span>
            </Link>
          </section>
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
