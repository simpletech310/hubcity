import Image from "next/image";
import Link from "next/link";
import SectionHeader from "@/components/layout/SectionHeader";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import AISearchButton from "@/components/home/AISearchButton";
import LiveNowBanner from "@/components/live/LiveNowBanner";
import { createClient } from "@/lib/supabase/server";
import { ROLE_BADGE_MAP } from "@/lib/constants";
import { getFeaturedArt } from "@/lib/art-spotlight";
import type { Post } from "@/types/database";

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function totalReactions(post: Post): number {
  if (!post.reaction_counts) return 0;
  return Object.values(post.reaction_counts).reduce((sum, n) => sum + (n ?? 0), 0);
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const quickActions = [
  { label: "Events", icon: "📅", href: "/events", color: "#22C55E", desc: "What's happening" },
  { label: "Food", icon: "🔥", href: "/food", color: "#FF6B6B", desc: "Eat local" },
  { label: "Resources", icon: "💡", href: "/resources", color: "#06B6D4", desc: "Get help" },
  { label: "Schools", icon: "🎓", href: "/schools", color: "#3B82F6", desc: "K-12 channels" },
  { label: "HubTV", icon: "📺", href: "/live", color: "#EF4444", desc: "Watch now" },
  { label: "City Hall", icon: "🏛️", href: "/city-hall", color: "#F2A900", desc: "Gov & Issues" },
  { label: "Jobs", icon: "💼", href: "/jobs", color: "#8B5CF6", desc: "Find careers" },
  { label: "Health", icon: "❤️", href: "/health", color: "#22C55E", desc: "Wellness" },
  { label: "Groups", icon: "🤝", href: "/groups", color: "#A855F7", desc: "Community" },
];

const businessImages: Record<string, string> = {
  "bludsos-bbq": "/images/bludsos-bbq.png",
  "billionaire-burger-boyz": "/images/billionaire-burgers.png",
  "ch-y-la-birria": "/images/birria-tacos.png",
};

export default async function HomePage() {
  const supabase = await createClient();

  const [
    { data: { user } },
    { data: businesses },
    { data: events },
    { data: liveStreams },
    { data: pinnedPosts },
    { data: officialPosts },
    { data: recentPosts },
    { count: activePollsCount },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("businesses")
      .select("*")
      .eq("is_featured", true)
      .eq("is_published", true)
      .order("rating_avg", { ascending: false })
      .limit(6),
    supabase
      .from("events")
      .select("*")
      .eq("is_published", true)
      .order("start_date", { ascending: true })
      .limit(6),
    supabase
      .from("live_streams")
      .select("id, title, category, mux_playback_id, status, viewer_count")
      .eq("status", "active")
      .limit(3),
    supabase
      .from("posts")
      .select("*, author:profiles(id, display_name, avatar_url, role, verification_status)")
      .eq("is_published", true)
      .eq("is_pinned", true)
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("posts")
      .select("*, author:profiles!inner(id, display_name, avatar_url, role, verification_status)")
      .eq("is_published", true)
      .eq("profiles.role", "city_official")
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("posts")
      .select("*, author:profiles(id, display_name, avatar_url, role, verification_status)")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(4),
    supabase
      .from("polls")
      .select("*", { count: "exact", head: true })
      .eq("status", "active")
      .eq("is_published", true),
  ]);

  // Get user profile for greeting
  let displayName = "Compton";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();
    if (profile?.display_name) {
      displayName = profile.display_name.split(" ")[0]; // First name only
    }
  }

  const boardPost: Post | null =
    (pinnedPosts && pinnedPosts.length > 0 ? pinnedPosts[0] : null) ??
    (officialPosts && officialPosts.length > 0 ? officialPosts[0] : null) ??
    null;

  const pulsePosts: Post[] = (recentPosts ?? []) as Post[];

  const greeting = getGreeting();
  const featuredArt = getFeaturedArt();

  // Community pulse stats
  const totalListings = (businesses?.length ?? 0) + (events?.length ?? 0);
  const liveCount = liveStreams?.length ?? 0;

  return (
    <div className="animate-fade-in">
      {/* ─── Art Spotlight Hero ─── */}
      <section className="relative">
        <Link href={`/art/${featuredArt.slug}`} className="block press">
          <div className="relative w-full" style={{ height: "55vh", minHeight: "380px" }}>
            <Image
              src={featuredArt.imageUrl}
              alt={featuredArt.title}
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
            {/* Gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-b from-midnight/40 via-transparent to-midnight" />
            <div className="absolute inset-0 bg-gradient-to-t from-midnight via-transparent to-transparent" />

            {/* Art Spotlight badge */}
            <div className="absolute top-4 left-5 z-10">
              <span className="inline-flex items-center gap-1.5 bg-black/50 backdrop-blur-md border border-gold/30 rounded-full px-3 py-1.5 text-[10px] font-bold text-gold tracking-wider uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
                Art Spotlight
              </span>
            </div>

            {/* Art info overlay at bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
              <p className="text-[11px] text-white/50 font-medium uppercase tracking-wider mb-1">
                {featuredArt.medium} · {featuredArt.year}
              </p>
              <h2 className="font-display text-[24px] leading-tight mb-1 drop-shadow-lg">
                &ldquo;{featuredArt.title}&rdquo;
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-[13px] text-gold font-heading font-semibold">
                  {featuredArt.artist}
                </span>
                <span className="text-white/30">·</span>
                <span className="text-[12px] text-white/40">{featuredArt.location}</span>
              </div>
              <p className="text-[11px] text-white/30 mt-2 flex items-center gap-1">
                Tap to view full artwork and artist details
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-gold"><path d="M5 3l4 4-4 4"/></svg>
              </p>
            </div>
          </div>
        </Link>
      </section>

      {/* ─── Greeting + Search ─── */}
      <section className="px-5 pt-4 pb-2">
        <h1 className="font-display text-[28px] leading-tight">
          {greeting}, <span className="text-gold">{displayName}</span>
        </h1>
        <p className="text-[14px] text-warm-gray mt-1">
          What&apos;s happening in Compton today
        </p>
      </section>

      {/* AI Search Bar */}
      <section className="px-5 mb-6">
        <AISearchButton />
      </section>

      {/* ─── Quick Actions Grid (3-col with accent bars) ─── */}
      <section className="px-5 mb-8">
        <div className="grid grid-cols-3 gap-2.5">
          {quickActions.slice(0, 6).map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="group press"
            >
              <div className="relative bg-royal rounded-2xl border border-border-subtle overflow-hidden p-4 pb-3.5 flex flex-col items-center gap-1.5 transition-all duration-200 group-hover:border-white/10">
                {/* Top color accent bar */}
                <div
                  className="absolute top-0 left-0 right-0 h-[2px] opacity-60"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${action.color}, transparent)`,
                  }}
                />
                <span className="text-[24px]">{action.icon}</span>
                <span className="font-heading text-[12px] font-semibold text-txt-primary tracking-tight">
                  {action.label}
                </span>
                <span className="text-[10px] text-muted-gray">
                  {action.desc}
                </span>
              </div>
            </Link>
          ))}
        </div>
        {/* Second row — remaining 2 items centered */}
        <div className="grid grid-cols-3 gap-2.5 mt-2.5">
          {quickActions.slice(6).map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="group press"
            >
              <div className="relative bg-royal rounded-2xl border border-border-subtle overflow-hidden p-4 pb-3.5 flex flex-col items-center gap-1.5 transition-all duration-200 group-hover:border-white/10">
                <div
                  className="absolute top-0 left-0 right-0 h-[2px] opacity-60"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${action.color}, transparent)`,
                  }}
                />
                <span className="text-[24px]">{action.icon}</span>
                <span className="font-heading text-[12px] font-semibold text-txt-primary tracking-tight">
                  {action.label}
                </span>
                <span className="text-[10px] text-muted-gray">
                  {action.desc}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── Live Now Banner ─── */}
      {liveStreams && liveStreams.length > 0 && (
        <LiveNowBanner streams={liveStreams} />
      )}

      {/* ─── Community Pulse Stats ─── */}
      <section className="px-5 mb-8">
        <SectionHeader title="Community Pulse" subtitle="Compton at a glance" compact />
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-royal rounded-2xl border border-border-subtle p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-[3px] h-full bg-gold rounded-r" />
            <p className="font-heading text-[26px] font-bold tracking-tight">{totalListings}+</p>
            <p className="text-[12px] text-warm-gray mt-0.5">Active listings</p>
            <span className="text-[11px] font-medium text-gold mt-1.5 inline-block">Businesses & events</span>
          </div>
          <div className="bg-royal rounded-2xl border border-border-subtle p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-[3px] h-full bg-coral rounded-r" />
            <p className="font-heading text-[26px] font-bold tracking-tight">{liveCount}</p>
            <p className="text-[12px] text-warm-gray mt-0.5">Live streams</p>
            <span className="text-[11px] font-medium text-coral mt-1.5 inline-block">{liveCount > 0 ? "Broadcasting now" : "Check back soon"}</span>
          </div>
          <div className="bg-royal rounded-2xl border border-border-subtle p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-[3px] h-full bg-hc-purple rounded-r" />
            <p className="font-heading text-[26px] font-bold tracking-tight">{pulsePosts.length}</p>
            <p className="text-[12px] text-warm-gray mt-0.5">Recent posts</p>
            <span className="text-[11px] font-medium text-hc-purple mt-1.5 inline-block">City Pulse</span>
          </div>
          <div className="bg-royal rounded-2xl border border-border-subtle p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-[3px] h-full bg-emerald rounded-r" />
            <p className="font-heading text-[26px] font-bold tracking-tight">{activePollsCount ?? 0}</p>
            <p className="text-[12px] text-warm-gray mt-0.5">Active polls</p>
            <span className="text-[11px] font-medium text-emerald mt-1.5 inline-block">Have your say</span>
          </div>
        </div>
      </section>

      {/* ─── Hub City TV Promo ─── */}
      <section className="px-5 mb-8">
        <div className="relative rounded-2xl overflow-hidden border border-border-subtle">
          {/* Abstract art background */}
          <div
            className="absolute inset-0"
            style={{
              background: `
                linear-gradient(135deg, #1a0a00, var(--color-royal)),
                radial-gradient(ellipse at 10% 90%, rgba(242,169,0,0.25) 0%, transparent 50%),
                radial-gradient(ellipse at 90% 10%, rgba(239,68,68,0.15) 0%, transparent 40%),
                radial-gradient(ellipse at 50% 50%, rgba(139,92,246,0.10) 0%, transparent 60%)
              `,
            }}
          />
          {/* Decorative circles */}
          <div className="absolute -top-5 -right-5 w-[120px] h-[120px] rounded-full border border-gold/10" />
          <div className="absolute -bottom-8 -left-3 w-[80px] h-[80px] rounded-full border border-hc-purple/10" />

          <div className="relative p-6 z-10">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-compton-red/20 border border-compton-red/40 mb-3.5">
              <span className="font-heading text-[10px] font-bold text-compton-red tracking-[0.08em]">
                HUB CITY TV
              </span>
            </div>

            <h3 className="font-display text-[26px] leading-[1.15] mb-2">
              Compton Rising
            </h3>
            <p className="text-[13px] text-warm-gray leading-relaxed max-w-[280px] mb-5">
              Five young creators. One city. Unlimited potential. A Hub City Original.
            </p>

            <div className="flex gap-2.5">
              <Link
                href="/live"
                className="inline-flex items-center gap-1.5 bg-gold text-midnight px-5 py-2.5 rounded-xl font-heading text-[13px] font-bold press hover:bg-gold-light transition-colors"
              >
                ▶ Watch Now
              </Link>
              <button className="inline-flex items-center gap-1.5 bg-white/[0.08] border border-white/[0.12] text-white px-4 py-2.5 rounded-xl text-[13px] font-medium press hover:bg-white/[0.12] transition-colors">
                + My List
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="divider-gold mx-5 mb-8" />

      {/* ─── Featured Businesses ─── */}
      <section className="mb-8">
        <SectionHeader
          title="Featured Businesses"
          subtitle="Support local Compton"
          linkText="See All"
          linkHref="/business"
        />
        <div className="flex gap-3 px-5 overflow-x-auto scrollbar-hide pb-2">
          {(businesses ?? []).map((biz, i) => (
            <Link
              key={biz.id}
              href={`/business/${biz.slug}`}
              className="shrink-0 w-[190px] animate-slide-in"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <Card hover padding={false}>
                <div className="h-[110px] relative overflow-hidden rounded-t-2xl">
                  {businessImages[biz.slug] ? (
                    <Image
                      src={businessImages[biz.slug]}
                      alt={biz.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full art-food" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
                  <div className="absolute top-2.5 right-2.5 bg-midnight/70 backdrop-blur-sm rounded-lg px-2 py-0.5 flex items-center gap-1">
                    <span className="text-gold text-[10px]">★</span>
                    <span className="text-[10px] font-bold">{Number(biz.rating_avg).toFixed(1)}</span>
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-heading font-bold text-[13px] mb-0.5 truncate">
                    {biz.name}
                  </h3>
                  <p className="text-[10px] text-txt-secondary mb-2 truncate">
                    {biz.category.charAt(0).toUpperCase() + biz.category.slice(1)} · {biz.address?.split(",")[0]}
                  </p>
                  <div className="flex items-center gap-1.5">
                    {biz.badges?.slice(0, 2).map((badge: string) => (
                      <Badge
                        key={badge}
                        label={badge.replace("_", " ")}
                        variant="gold"
                      />
                    ))}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── Upcoming Events ─── */}
      <section className="mb-8">
        <SectionHeader
          title="Upcoming Events"
          subtitle="Don't miss out"
          linkText="Calendar"
          linkHref="/events"
          linkColor="text-emerald"
        />
        <div className="flex gap-3 px-5 overflow-x-auto scrollbar-hide pb-2">
          {(events ?? []).map((event, i) => {
            const categoryColors: Record<string, string> = {
              city: "text-gold",
              sports: "text-emerald",
              culture: "text-coral",
              community: "text-cyan",
              school: "text-hc-blue",
              youth: "text-hc-purple",
            };
            const categoryEmojis: Record<string, string> = {
              city: "🏛️",
              sports: "⚽",
              culture: "🎭",
              community: "🤝",
              school: "📚",
              youth: "🌟",
            };
            const colorClass = categoryColors[event.category] || "text-gold";
            return (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="shrink-0 w-[220px] animate-slide-in"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <Card hover padding={false}>
                  {/* Date header with color accent */}
                  <div className="p-3.5 pb-2.5 border-b border-border-subtle flex items-center gap-3">
                    <div className="flex flex-col items-center bg-white/[0.04] rounded-xl px-2.5 py-1.5 min-w-[44px]">
                      <span className={`font-heading text-[16px] font-bold leading-none ${colorClass}`}>
                        {new Date(event.start_date).getDate()}
                      </span>
                      <span className="text-[9px] font-semibold text-warm-gray tracking-[0.05em] uppercase">
                        {new Date(event.start_date).toLocaleDateString("en-US", { month: "short" })}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-heading text-[13px] font-semibold leading-tight line-clamp-2">
                        {event.title}
                      </p>
                    </div>
                  </div>
                  <div className="px-3.5 py-2.5 flex items-center justify-between">
                    <span className="text-[11px] text-warm-gray truncate">
                      {event.location_name ? `📍 ${event.location_name}` : categoryEmojis[event.category] || "📅"}
                    </span>
                    <span className={`text-[11px] font-medium ${colorClass}`}>
                      {new Date(event.start_date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                    </span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ─── What's New Feed ─── */}
      {pulsePosts.length > 0 && (
        <section className="mb-8">
          <SectionHeader
            title="What's New"
            subtitle="Latest from your city"
            linkText="All updates"
            linkHref="/pulse"
          />
          <div className="px-5 flex flex-col gap-2.5">
            {pulsePosts.map((post) => {
              const badge = post.author?.role ? ROLE_BADGE_MAP[post.author.role] : null;
              const roleColors: Record<string, string> = {
                city_official: "#F2A900",
                business_owner: "#3B82F6",
                community_leader: "#22C55E",
              };
              const iconColor = post.author?.role ? (roleColors[post.author.role] || "#9E9A93") : "#9E9A93";
              const roleIcons: Record<string, string> = {
                city_official: "🏛️",
                business_owner: "🏪",
                community_leader: "🌿",
                citizen: "💬",
              };
              const icon = post.author?.role ? (roleIcons[post.author.role] || "💬") : "💬";

              return (
                <div
                  key={post.id}
                  className="flex gap-3.5 items-start bg-royal border border-border-subtle rounded-2xl p-3.5 press"
                >
                  {/* Icon badge */}
                  <div
                    className="w-[42px] h-[42px] rounded-xl flex items-center justify-center text-[18px] shrink-0 border"
                    style={{
                      background: `${iconColor}18`,
                      borderColor: `${iconColor}30`,
                    }}
                  >
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium leading-snug line-clamp-2">
                      {post.body}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[11px] font-medium" style={{ color: iconColor }}>
                        {post.author?.display_name ?? "Community"}
                      </span>
                      <span className="text-muted-gray text-[11px]">·</span>
                      <span className="text-[11px] text-muted-gray">
                        {timeAgo(post.created_at)}
                      </span>
                      {badge && (
                        <>
                          <span className="text-muted-gray text-[11px]">·</span>
                          <Badge label={badge.label} variant={badge.variant} />
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ─── Community Board (pinned/official post) ─── */}
      {boardPost && (
        <section className="px-5 mb-8">
          <SectionHeader title="Community Board" compact />
          <Card glow className="border-gold/10 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-full overflow-hidden relative ring-2 ring-gold/20">
                {boardPost.author?.avatar_url ? (
                  <Image
                    src={boardPost.author.avatar_url}
                    alt={boardPost.author.display_name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-card to-deep flex items-center justify-center text-[13px] font-bold text-gold">
                    {boardPost.author?.display_name?.split(" ").map((w) => w[0]).join("").slice(0, 2) ?? "?"}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold">{boardPost.author?.display_name ?? "Community"}</p>
                  {boardPost.author?.role && ROLE_BADGE_MAP[boardPost.author.role] && (
                    <Badge
                      label={ROLE_BADGE_MAP[boardPost.author.role].label}
                      variant={ROLE_BADGE_MAP[boardPost.author.role].variant}
                    />
                  )}
                </div>
                <p className="text-[10px] text-txt-secondary">{timeAgo(boardPost.created_at)}</p>
              </div>
            </div>
            <p className="text-[13px] text-txt-secondary leading-relaxed mb-3">
              {boardPost.body}
            </p>
            <div className="flex items-center gap-5 pt-3 border-t border-border-subtle">
              <span className="text-xs text-txt-secondary flex items-center gap-1.5">
                ❤️ <span className="font-medium">{totalReactions(boardPost)}</span>
              </span>
              <span className="text-xs text-txt-secondary flex items-center gap-1.5">
                💬 <span className="font-medium">{boardPost.comment_count}</span>
              </span>
              {boardPost.is_pinned && (
                <span className="text-[10px] text-gold font-medium ml-auto">📌 Pinned</span>
              )}
            </div>
          </Card>
        </section>
      )}

      {/* ─── Compton Pride Banner ─── */}
      <section className="px-5 mb-8">
        <div className="relative rounded-2xl overflow-hidden p-5 bg-gradient-to-br from-royal via-deep to-midnight border border-gold/10">
          <div className="pattern-dots absolute inset-0 opacity-20" />
          <div className="relative">
            <p className="text-gold text-[10px] font-bold tracking-[0.2em] uppercase mb-1">
              Built in Compton
            </p>
            <h3 className="font-heading font-bold text-lg mb-1.5">
              Streaming to the World
            </h3>
            <p className="font-display italic text-[13px] text-txt-secondary leading-relaxed mb-4 max-w-[280px]">
              Where culture becomes content and community becomes currency.
            </p>
            <div className="flex gap-2">
              <Link href="/business" className="inline-flex items-center gap-1.5 bg-gold text-midnight px-4 py-2 rounded-full text-xs font-bold press hover:bg-gold-light transition-colors">
                Explore Businesses
              </Link>
              <Link href="/resources" className="inline-flex items-center gap-1.5 bg-white/[0.06] text-white px-4 py-2 rounded-full text-xs font-medium press hover:bg-white/10 transition-colors border border-white/[0.08]">
                Find Resources
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
