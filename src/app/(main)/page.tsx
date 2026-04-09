import Image from "next/image";
import Link from "next/link";
import SectionHeader from "@/components/layout/SectionHeader";
import EditorialHeader from "@/components/ui/EditorialHeader";
import AdZone from "@/components/ui/AdZone";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Icon from "@/components/ui/Icon";
import AISearchButton from "@/components/home/AISearchButton";
import WeatherBar from "@/components/home/WeatherBar";
import LiveNowBanner from "@/components/live/LiveNowBanner";
import { createClient } from "@/lib/supabase/server";
import { ROLE_BADGE_MAP } from "@/lib/constants";
import { getFeaturedArt } from "@/lib/art-spotlight";
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

const quickActions: { label: string; href: string; icon: IconName }[] = [
  { label: "Order Food", href: "/food", icon: "utensils" },
  { label: "Find Jobs", href: "/jobs", icon: "briefcase" },
  { label: "Events", href: "/events", icon: "calendar" },
  { label: "Report Issue", href: "/city-hall/issues", icon: "alert" },
  { label: "Parks", href: "/parks", icon: "tree" },
  { label: "Health", href: "/health", icon: "heart-pulse" },
  { label: "City Hall", href: "/city-hall", icon: "landmark" },
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
    { data: trafficAlerts },
    { data: foodVendors },
    { data: recentJobs },
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
    supabase
      .from("city_alerts")
      .select("id, title, body, severity")
      .eq("is_active", true)
      .eq("alert_type", "traffic")
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("businesses")
      .select("id, name, slug, image_urls, category, business_sub_type, rating_avg, is_open")
      .eq("is_published", true)
      .eq("business_type", "food")
      .order("rating_avg", { ascending: false })
      .limit(6),
    supabase
      .from("jobs")
      .select("id, title, company_name, location, salary_min, salary_max, salary_type, employment_type, created_at")
      .eq("is_published", true)
      .eq("status", "open")
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(3),
  ]);

  // Get user profile for greeting + role
  let displayName = "Compton";
  let userRole: string | null = null;
  let dashboardStats: { orders?: number; issues?: number } | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, role")
      .eq("id", user.id)
      .single();
    if (profile?.display_name) {
      displayName = profile.display_name.split(" ")[0];
    }
    userRole = profile?.role ?? null;

    // Fetch dashboard quick stats for business owners
    if (userRole === "business_owner") {
      const { data: biz } = await supabase
        .from("businesses")
        .select("id")
        .eq("owner_id", user.id)
        .single();
      if (biz) {
        const { count: pendingOrders } = await supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("business_id", biz.id)
          .eq("status", "pending");
        dashboardStats = { orders: pendingOrders ?? 0 };
      }
    }
  }

  const pulsePosts: Post[] = (recentPosts ?? []) as Post[];
  const greeting = getGreeting();
  const featuredArt = getFeaturedArt();

  const featuredBusiness = businesses?.[0] ?? null;
  const hasLive = liveStreams && liveStreams.length > 0;

  return (
    <div className="animate-fade-in space-y-6">
      {/* -- 1. Art Hero (65vh) -- */}
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

            {/* Art Spotlight badge */}
            <div className="absolute top-4 left-5 z-10">
              <span className="inline-flex items-center gap-1.5 bg-black/50 backdrop-blur-md border border-gold/30 rounded-full px-3 py-1.5 text-[10px] font-bold text-gold tracking-wider uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
                Art Spotlight
              </span>
            </div>

            {/* Art info at bottom */}
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

              {/* Scroll indicator */}
              <div className="flex justify-center mt-6">
                <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center animate-bounce">
                  <Icon name="chevron-down" size={14} className="text-white" />
                </div>
              </div>
            </div>
          </div>
        </Link>
      </section>

      {/* -- 2. Greeting + Search -- */}
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

      {/* -- 3. Dashboard Card (business owners) -- */}
      {userRole === "business_owner" && dashboardStats && (
        <section className="px-5">
          <Link href="/dashboard" className="block press">
            <div className="glass-neon rounded-xl p-3.5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gold/15 flex items-center justify-center shrink-0">
                <Icon name="bolt" size={18} className="text-gold" />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-semibold">Go to Dashboard</p>
                <p className="text-[11px] text-white/50">
                  {dashboardStats.orders ? `${dashboardStats.orders} pending order${dashboardStats.orders > 1 ? "s" : ""}` : "All caught up"}
                </p>
              </div>
              <Icon name="chevron-right" size={14} className="text-gold/50" />
            </div>
          </Link>
        </section>
      )}

      {/* -- 3b. Trustee Dashboard Card (school trustees) -- */}
      {userRole === "school_trustee" && (
        <section className="px-5">
          <Link href="/trustee/dashboard" className="block press">
            <div className="glass-neon rounded-xl p-3.5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
                <Icon name="graduation" size={18} className="text-emerald-400" />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-semibold">Trustee Dashboard</p>
                <p className="text-[11px] text-white/50">
                  Manage your profile & accountability
                </p>
              </div>
              <Icon name="chevron-right" size={14} className="text-emerald-400/50" />
            </div>
          </Link>
        </section>
      )}

      {/* -- 3c. City Official Dashboard Card -- */}
      {userRole === "city_official" && (
        <section className="px-5">
          <Link href="/dashboard" className="block press">
            <div className="glass-neon rounded-xl p-3.5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gold/15 flex items-center justify-center shrink-0">
                <Icon name="landmark" size={18} className="text-gold" />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-semibold">Official Dashboard</p>
                <p className="text-[11px] text-white/50">
                  Manage city resources & updates
                </p>
              </div>
              <Icon name="chevron-right" size={14} className="text-gold/50" />
            </div>
          </Link>
        </section>
      )}

      {/* -- 4. Quick Actions Grid -- */}
      <section className="px-5">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-5 px-5">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href} className="press shrink-0">
              <div className="bg-white/[0.06] backdrop-blur-sm border border-white/[0.08] rounded-full px-3.5 py-2 flex items-center gap-2 shrink-0">
                <Icon name={action.icon} size={14} className="text-gold" />
                <span className="text-[12px] font-medium text-white/80">{action.label}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* -- 5. Weather + AQI Bar -- */}
      <section className="px-5">
        <WeatherBar />
      </section>

      {/* -- 6. Active Polls Banner -- */}
      {(activePollsCount ?? 0) > 0 && (
        <section className="px-5">
          <Link href="/pulse" className="block press">
            <div className="glass-neon rounded-xl p-3.5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gold/15 flex items-center justify-center shrink-0">
                <Icon name="chart" size={18} className="text-gold" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-white">Your voice matters</p>
                <p className="text-[11px] text-white/50">{activePollsCount} active poll{activePollsCount! > 1 ? "s" : ""} — tap to vote</p>
              </div>
              <Icon name="chevron-right" size={14} className="text-gold/50" />
            </div>
          </Link>
        </section>
      )}

      {/* -- 7. Traffic Alert Banner -- */}
      {trafficAlerts && trafficAlerts.length > 0 && (
        <section className="px-5">
          <Card variant="glass" padding={false}>
            <div className="p-3 flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                <Icon name="transit" size={16} className="text-orange-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-orange-400 uppercase tracking-wider mb-0.5">
                  Traffic Alert
                </p>
                {trafficAlerts.map((ta) => (
                  <Link key={ta.id} href="/city-data" className="block press">
                    <p className="text-[12px] text-white/70 leading-snug line-clamp-1 mb-0.5">
                      {ta.title}
                    </p>
                  </Link>
                ))}
              </div>
              <Link href="/city-data" className="shrink-0">
                <Icon name="chevron-right" size={14} className="text-white/20" />
              </Link>
            </div>
          </Card>
        </section>
      )}

      {/* -- 8. City Alerts -- */}
      {cityAlerts && cityAlerts.length > 0 && (
        <section className="px-5">
          <div className="flex flex-col gap-2">
            {cityAlerts.map((alert) => {
              const severityConfig: Record<string, { bg: string; border: string; iconName: "alert" | "warning" | "info"; textColor: string }> = {
                critical: { bg: "bg-compton-red/10", border: "border-compton-red/25", iconName: "alert", textColor: "text-compton-red" },
                warning: { bg: "bg-gold/10", border: "border-gold/25", iconName: "warning", textColor: "text-gold" },
                info: { bg: "bg-cyan/10", border: "border-cyan/25", iconName: "info", textColor: "text-cyan" },
              };
              const config = severityConfig[alert.severity] || severityConfig.info;
              return (
                <Link key={alert.id} href="/city-data" className="press">
                  <div className={`${config.bg} border ${config.border} rounded-xl p-3 flex items-center gap-2.5`}>
                    <Icon name={config.iconName} size={16} className={`${config.textColor} shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-[12px] font-semibold ${config.textColor}`}>{alert.title}</p>
                      <p className="text-[11px] text-white/50 line-clamp-1">{alert.body}</p>
                    </div>
                    <Icon name="chevron-right" size={12} className="text-white/20 shrink-0" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* -- 9. Upcoming City Meetings -- */}
      {upcomingMeetings && upcomingMeetings.length > 0 && (
        <section className="px-5 space-y-2">
          <SectionHeader title="City Meetings" linkText="View All" linkHref="/city-data/meetings" compact />
          {upcomingMeetings.slice(0, 2).map((meeting) => (
            <Link key={meeting.id} href="/city-data/meetings" className="block press">
              <Card variant="glass" hover padding={false}>
                <div className="p-3 flex items-center gap-3">
                  <div className="flex flex-col items-center bg-cyan/10 rounded-lg px-2.5 py-1.5 min-w-[44px]">
                    <span className="text-[14px] font-bold text-cyan leading-none">
                      {new Date(meeting.date).getDate()}
                    </span>
                    <span className="text-[9px] font-semibold text-cyan/60 uppercase">
                      {new Date(meeting.date).toLocaleDateString("en-US", { month: "short" })}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[12px] font-bold truncate">{meeting.title}</h3>
                    <p className="text-[10px] text-warm-gray truncate">
                      {meeting.start_time} · {meeting.location || "City Hall"}
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </section>
      )}

      {/* -- 10. Live Now Banner -- */}
      {hasLive && <LiveNowBanner streams={liveStreams} />}

      {/* -- 11. Events Horizontal Carousel -- */}
      {events && events.length > 0 && (
        <section className="space-y-3">
          <div className="px-5">
            <SectionHeader title="Upcoming Events" linkText="See All" linkHref="/events" compact />
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 px-5">
            {events.slice(0, 5).map((event) => (
              <Link key={event.id} href={`/events/${event.id}`} className="shrink-0 w-[200px] press">
                <div className="glass-card-elevated rounded-xl overflow-hidden">
                  <div className="relative h-[120px] bg-royal">
                    {event.cover_image_url ? (
                      <Image src={event.cover_image_url} alt={event.title} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Icon name="calendar" size={28} className="text-white/20" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute top-2 left-2">
                      <div className="bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1 text-center">
                        <p className="text-[10px] font-bold text-gold uppercase leading-none">
                          {new Date(event.start_date).toLocaleDateString("en-US", { month: "short" })}
                        </p>
                        <p className="text-[16px] font-bold leading-none mt-0.5">
                          {new Date(event.start_date).getDate()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="text-[13px] font-bold leading-snug line-clamp-2 mb-1">{event.title}</h3>
                    {event.location_name && (
                      <p className="text-[11px] text-warm-gray truncate flex items-center gap-1">
                        <Icon name="map-pin" size={10} className="text-warm-gray shrink-0" />
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

      {/* -- 12. Food Vendors Row -- */}
      {foodVendors && foodVendors.length > 0 && (
        <section className="space-y-3">
          <div className="px-5">
            <SectionHeader title="Order Food" linkText="See All" linkHref="/food" compact />
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 px-5">
            {foodVendors.map((vendor) => (
              <Link key={vendor.id} href={`/food/vendor/${vendor.id}`} className="shrink-0 w-[140px] press">
                <div className="glass-card-elevated rounded-xl overflow-hidden">
                  <div className="relative h-[100px] bg-royal">
                    {vendor.image_urls?.[0] ? (
                      <img src={vendor.image_urls[0]} alt={vendor.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Icon name="utensils" size={24} className="text-white/20" />
                      </div>
                    )}
                  </div>
                  <div className="p-2.5">
                    <h3 className="text-[12px] font-bold truncate">{vendor.name}</h3>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Icon name="star" size={10} className="text-gold" />
                      <span className="text-[10px] text-warm-gray">{Number(vendor.rating_avg || 0).toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* -- 13. Featured Business Card -- */}
      {featuredBusiness && (
        <section className="px-5">
          <Link href={`/business/${featuredBusiness.slug}`} className="block press">
            <Card variant="glass" hover padding={false}>
              <div className="p-4 flex items-center gap-3.5">
                <div className="w-[52px] h-[52px] rounded-xl overflow-hidden relative shrink-0 bg-royal">
                  {featuredBusiness.image_urls?.[0] ? (
                    <img
                      src={featuredBusiness.image_urls[0]}
                      alt={featuredBusiness.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Icon name="store" size={22} className="text-white/40" />
                    </div>
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
                      <Icon name="star" size={11} className="text-gold" />
                      {Number(featuredBusiness.rating_avg).toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        </section>
      )}

      {/* -- 14. Jobs Teaser -- */}
      {recentJobs && recentJobs.length > 0 && (
        <section className="px-5 space-y-3">
          <SectionHeader title="Now Hiring" linkText="All Jobs" linkHref="/jobs" compact />
          <div className="space-y-2">
            {recentJobs.map((job) => (
              <Link key={job.id} href={`/jobs/${job.id}`} className="block press">
                <Card variant="glass" hover padding={false}>
                  <div className="p-3.5 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center shrink-0">
                      <Icon name="briefcase" size={18} className="text-gold" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[13px] font-bold truncate">{job.title}</h3>
                      <p className="text-[11px] text-warm-gray truncate">{job.company_name}</p>
                    </div>
                    {job.salary_min && (
                      <span className="text-[11px] font-semibold text-emerald shrink-0">
                        ${Math.round(job.salary_min / 1000)}k{job.salary_max ? `–${Math.round(job.salary_max / 1000)}k` : "+"}
                      </span>
                    )}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* -- 15. Ad Zone -- */}
      <div className="px-5">
        <AdZone zone="feed_banner" />
      </div>

      {/* -- 16. Pulse Feed -- */}
      {pulsePosts.length > 0 && (
        <section className="px-5 space-y-3">
          <EditorialHeader kicker="THE PULSE" title="What's New" subtitle="Latest from your city" />
          <Card variant="glass" padding={false}>
            <div className="flex flex-col divide-y divide-border-subtle overflow-hidden">
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
          </Card>
        </section>
      )}

      {/* -- 17. Bottom CTA -- */}
      <section className="px-5 pb-6">
        <Link
          href="/map"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-gold/20 bg-gold/5 text-gold text-[13px] font-heading font-semibold press hover:bg-gold/10 transition-colors"
        >
          Explore more on Hub City
          <Icon name="chevron-right" size={14} className="text-gold" />
        </Link>
      </section>
    </div>
  );
}
