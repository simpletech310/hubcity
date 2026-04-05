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
import { formatDistanceToNow } from "date-fns";
import type { Post } from "@/types/database";

function timeAgo(dateStr: string): string {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const quickActions = [
  { label: "Map", icon: "🗺️", href: "/map" },
  { label: "Events", icon: "📅", href: "/events" },
  { label: "Food", icon: "🔥", href: "/food" },
  { label: "Resources", icon: "💡", href: "/resources" },
  { label: "Schools", icon: "🎓", href: "/schools" },
  { label: "HubTV", icon: "📺", href: "/live" },
  { label: "City Hall", icon: "🏛️", href: "/city-hall" },
  { label: "Jobs", icon: "💼", href: "/jobs" },
  { label: "Health", icon: "❤️", href: "/health" },
  { label: "Groups", icon: "🤝", href: "/groups" },
  { label: "Culture", icon: "🎭", href: "/culture" },
  { label: "Parks", icon: "🌳", href: "/parks" },
];

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
    { data: cityAlerts },
    { data: upcomingMeetings },
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
      .select("*, author:profiles!posts_author_id_fkey(id, display_name, handle, avatar_url, role, verification_status)")
      .eq("is_published", true)
      .eq("is_pinned", true)
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("posts")
      .select("*, author:profiles!posts_author_id_fkey(id, display_name, avatar_url, role, verification_status)")
      .eq("is_published", true)
      .eq("profiles.role", "city_official")
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("posts")
      .select("*, author:profiles!posts_author_id_fkey(id, display_name, handle, avatar_url, role, verification_status)")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("polls")
      .select("*", { count: "exact", head: true })
      .eq("status", "active")
      .eq("is_published", true),
    supabase
      .from("city_alerts")
      .select("id, title, body, alert_type, severity")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("city_meetings")
      .select("id, title, meeting_type, date, start_time, location")
      .gte("date", new Date().toISOString().split("T")[0])
      .order("date", { ascending: true })
      .limit(3),
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
      displayName = profile.display_name.split(" ")[0];
    }
  }

  const pulsePosts: Post[] = (recentPosts ?? []) as Post[];
  const greeting = getGreeting();
  const featuredArt = getFeaturedArt();

  // Pick best content for the featured section
  const featuredEvent = events?.[0] ?? null;
  const featuredBusiness = businesses?.[0] ?? null;
  const hasLive = liveStreams && liveStreams.length > 0;

  return (
    <div className="animate-fade-in space-y-6">
      {/* ── Compact Art Hero ── */}
      <section>
        <Link href={`/art/${featuredArt.slug}`} className="block press">
          <div className="relative w-full h-[200px] overflow-hidden">
            <Image
              src={featuredArt.imageUrl}
              alt={featuredArt.title}
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-midnight/40 via-transparent to-midnight" />

            {/* Art Spotlight badge */}
            <div className="absolute top-3 left-4 z-10">
              <span className="inline-flex items-center gap-1.5 bg-black/50 backdrop-blur-md border border-gold/30 rounded-full px-2.5 py-1 text-[10px] font-bold text-gold tracking-wider uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
                Art Spotlight
              </span>
            </div>

            {/* Art info */}
            <div className="absolute bottom-0 left-0 right-0 px-4 pb-3 z-10">
              <h2 className="font-display text-[18px] leading-tight drop-shadow-lg">
                &ldquo;{featuredArt.title}&rdquo;
              </h2>
              <p className="text-[12px] text-gold/80 font-heading font-semibold">
                {featuredArt.artist} &middot; {featuredArt.medium}
              </p>
            </div>
          </div>
        </Link>
      </section>

      {/* ── Greeting + Search ── */}
      <section className="px-5 -mt-1 space-y-3">
        <div>
          <h1 className="font-display text-[26px] leading-tight">
            {greeting}, <span className="text-gold">{displayName}</span>
          </h1>
          <p className="text-[13px] text-warm-gray mt-0.5">
            What&apos;s happening in Compton today
          </p>
        </div>
        <AISearchButton />
      </section>

      {/* ── City Alerts ── */}
      {cityAlerts && cityAlerts.length > 0 && (
        <section className="px-5">
          <div className="flex flex-col gap-2">
            {cityAlerts.map((alert) => {
              const severityConfig: Record<string, { bg: string; border: string; icon: string; textColor: string }> = {
                critical: { bg: "bg-compton-red/10", border: "border-compton-red/25", icon: "🚨", textColor: "text-compton-red" },
                warning: { bg: "bg-gold/10", border: "border-gold/25", icon: "⚠️", textColor: "text-gold" },
                info: { bg: "bg-cyan/10", border: "border-cyan/25", icon: "ℹ️", textColor: "text-cyan" },
              };
              const config = severityConfig[alert.severity] || severityConfig.info;
              return (
                <Link key={alert.id} href="/city-data" className="press">
                  <div className={`${config.bg} border ${config.border} rounded-xl p-3 flex items-center gap-2.5`}>
                    <span className="text-sm shrink-0">{config.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[12px] font-semibold ${config.textColor}`}>{alert.title}</p>
                      <p className="text-[11px] text-white/50 line-clamp-1">{alert.body}</p>
                    </div>
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/20 shrink-0" strokeLinecap="round"><path d="M5 3l4 4-4 4"/></svg>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Quick Actions (3-col, 2 rows visible, scroll for rest) ── */}
      <section className="px-5">
        <div className="overflow-x-auto scrollbar-hide -mx-5 px-5">
          <div className="grid grid-rows-2 grid-flow-col auto-cols-[calc(33.333%-8px)] gap-2">
            {quickActions.map((action) => (
              <Link key={action.label} href={action.href} className="press">
                <div className="bg-royal rounded-xl border border-border-subtle p-3 flex flex-col items-center gap-1.5 transition-colors hover:border-white/10">
                  <span className="text-[28px] leading-none">{action.icon}</span>
                  <span className="font-heading text-[11px] font-semibold text-txt-primary tracking-tight text-center">
                    {action.label}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Live Now Banner ── */}
      {hasLive && <LiveNowBanner streams={liveStreams} />}

      {/* ── Featured Section (mixed content) ── */}
      <section className="px-5 space-y-3">
        <SectionHeader title="Featured" subtitle="Highlights from Compton" compact />

        {/* Featured event — large card */}
        {featuredEvent && (
          <Link href={`/events/${featuredEvent.id}`} className="block press">
            <Card hover padding={false}>
              <div className="p-4 flex items-start gap-3.5">
                <div className="flex flex-col items-center bg-gold/10 rounded-xl px-3 py-2 min-w-[52px]">
                  <span className="font-heading text-[20px] font-bold leading-none text-gold">
                    {new Date(featuredEvent.start_date).getDate()}
                  </span>
                  <span className="text-[10px] font-semibold text-warm-gray tracking-wide uppercase">
                    {new Date(featuredEvent.start_date).toLocaleDateString("en-US", { month: "short" })}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold text-gold uppercase tracking-wider mb-0.5">
                    Upcoming Event
                  </p>
                  <h3 className="font-heading text-[15px] font-bold leading-snug line-clamp-2 mb-1">
                    {featuredEvent.title}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-warm-gray">
                    {featuredEvent.location_name && (
                      <span className="truncate">📍 {featuredEvent.location_name}</span>
                    )}
                    <span>
                      {new Date(featuredEvent.start_date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        )}

        {/* Featured business — compact card */}
        {featuredBusiness && (
          <Link href={`/business/${featuredBusiness.slug}`} className="block press">
            <Card hover padding={false}>
              <div className="p-4 flex items-center gap-3.5">
                <div className="w-[52px] h-[52px] rounded-xl overflow-hidden relative shrink-0 bg-royal">
                  {featuredBusiness.image_urls?.[0] ? (
                    <img
                      src={featuredBusiness.image_urls[0]}
                      alt={featuredBusiness.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[22px]">🏪</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold text-hc-blue uppercase tracking-wider mb-0.5">
                    Featured Business
                  </p>
                  <h3 className="font-heading text-[14px] font-bold leading-snug truncate">
                    {featuredBusiness.name}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-warm-gray">
                    <span className="truncate">
                      {featuredBusiness.category.charAt(0).toUpperCase() + featuredBusiness.category.slice(1)}
                      {featuredBusiness.address ? ` · ${featuredBusiness.address.split(",")[0]}` : ""}
                    </span>
                    <span className="shrink-0 flex items-center gap-0.5 text-gold">
                      ★ {Number(featuredBusiness.rating_avg).toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        )}

        {/* Live stream card (if available and not already shown via banner) */}
        {hasLive && liveStreams[0] && (
          <Link href="/live" className="block press">
            <Card hover padding={false}>
              <div className="p-4 flex items-center gap-3.5">
                <div className="w-[52px] h-[52px] rounded-xl bg-compton-red/15 border border-compton-red/30 flex items-center justify-center shrink-0">
                  <span className="text-[22px]">📺</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-compton-red uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-compton-red animate-pulse" />
                      Live Now
                    </span>
                  </div>
                  <h3 className="font-heading text-[14px] font-bold leading-snug truncate">
                    {liveStreams[0].title}
                  </h3>
                  <p className="text-[11px] text-warm-gray">
                    {liveStreams[0].viewer_count ?? 0} watching &middot; {liveStreams[0].category ?? "HubTV"}
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        )}
      </section>

      {/* ── What's New Feed ── */}
      {pulsePosts.length > 0 && (
        <section className="px-5 space-y-3">
          <SectionHeader
            title="What's New"
            subtitle="Latest from your city"
            linkText="All updates"
            linkHref="/pulse"
            compact
          />
          <div className="flex flex-col divide-y divide-border-subtle rounded-2xl bg-royal border border-border-subtle overflow-hidden">
            {pulsePosts.map((post) => {
              const badge = post.author?.role ? ROLE_BADGE_MAP[post.author.role] : null;
              return (
                <Link key={post.id} href="/pulse" className="press">
                  <div className="flex items-start gap-3 px-4 py-3">
                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full overflow-hidden relative shrink-0 bg-deep">
                      {post.author?.avatar_url ? (
                        <Image
                          src={post.author.avatar_url}
                          alt={post.author.display_name ?? ""}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[11px] font-bold text-gold">
                          {post.author?.display_name?.charAt(0) ?? "?"}
                        </div>
                      )}
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[12px] font-semibold truncate">
                          {post.author?.display_name ?? "Community"}
                        </span>
                        {badge && <Badge label={badge.label} variant={badge.variant} />}
                        <span className="text-[11px] text-muted-gray ml-auto shrink-0">
                          {timeAgo(post.created_at)}
                        </span>
                      </div>
                      <p className="text-[12px] text-warm-gray leading-snug line-clamp-2">
                        {post.body}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Bottom CTA ── */}
      <section className="px-5 pb-6">
        <Link
          href="/map"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-gold/20 bg-gold/5 text-gold text-[13px] font-heading font-semibold press hover:bg-gold/10 transition-colors"
        >
          Explore more on Hub City
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 3l4 4-4 4"/></svg>
        </Link>
      </section>
    </div>
  );
}
