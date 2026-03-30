import Link from "next/link";
import { redirect } from "next/navigation";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "./SignOutButton";
import BadgesSection from "./BadgesSection";
import CitizenIDCard from "@/components/profile/CitizenIDCard";

// ---------------------------------------------------------------------------
// District data (Compton has 4 council districts)
// ---------------------------------------------------------------------------

const districtInfo: Record<number, { council: string; area: string; color: string }> = {
  1: { council: "Council District 1", area: "Northwest Compton", color: "#3B82F6" },
  2: { council: "Council District 2", area: "Northeast Compton", color: "#8B5CF6" },
  3: { council: "Council District 3", area: "Southeast Compton", color: "#22C55E" },
  4: { council: "Council District 4", area: "Southwest Compton", color: "#F2A900" },
};

// Tag-to-resource category mapping
const tagToCategories: Record<string, string[]> = {
  housing: ["housing"],
  jobs: ["jobs"],
  employment: ["jobs"],
  health: ["health"],
  healthcare: ["health"],
  youth: ["youth"],
  education: ["education"],
  business: ["business"],
  food: ["food"],
  legal: ["legal"],
  senior: ["senior"],
  veterans: ["veterans"],
};

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

const resourceCategoryIcons: Record<string, string> = {
  business: "🏪",
  housing: "🏠",
  health: "❤️",
  youth: "🧒",
  jobs: "💼",
  food: "🍽️",
  legal: "⚖️",
  senior: "👴",
  education: "📚",
  veterans: "🎖️",
  utilities: "💡",
};

const resourceCategoryColors: Record<string, string> = {
  business: "#F2A900",
  housing: "#3B82F6",
  health: "#22C55E",
  youth: "#FF006E",
  jobs: "#8B5CF6",
  food: "#FF6B6B",
  legal: "#06B6D4",
  senior: "#F2A900",
  education: "#3B82F6",
  veterans: "#22C55E",
  utilities: "#06B6D4",
};

// Emergency & quick reference
const emergencyContacts = [
  { label: "Emergency", number: "911", icon: "🚨" },
  { label: "City Hall", number: "(310) 605-5500", icon: "🏛️" },
  { label: "Non-Emergency", number: "(310) 605-5511", icon: "📞" },
];

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/profile");
  }

  const today = new Date().toISOString().split("T")[0];

  // Fetch profile + counts + events + resources in parallel
  const [
    { data: profile },
    { count: savedCount },
    { count: rsvpCount },
    { data: upcomingRsvps },
    { data: recentPosts },
    { data: ticketOrders },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("saved_items").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("event_rsvps").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    // Upcoming RSVPed events
    supabase
      .from("event_rsvps")
      .select("*, event:events(id, title, slug, start_date, start_time, location_name, category, image_url)")
      .eq("user_id", user.id)
      .eq("status", "going")
      .limit(5),
    // User's recent pulse posts
    supabase
      .from("posts")
      .select("id, title, body, created_at")
      .eq("author_id", user.id)
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(3),
    // Ticket orders
    supabase
      .from("ticket_orders")
      .select("id, order_number, status, total, event:events(id, title, slug, start_date)")
      .eq("customer_id", user.id)
      .in("status", ["confirmed", "pending"])
      .order("created_at", { ascending: false })
      .limit(3),
  ]);

  const displayName = profile?.display_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "Resident";
  const handle = profile?.handle || `@${displayName.toLowerCase().replace(/\s+/g, "")}`;
  const district = profile?.district;
  const role = profile?.role || "citizen";
  const verificationStatus = profile?.verification_status || "unverified";
  const profileTags: string[] = profile?.profile_tags || [];
  const bio = profile?.bio;
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : null;

  // Filter upcoming events that haven't passed yet
  const upcomingEvents = (upcomingRsvps ?? [])
    .filter((r: Record<string, unknown>) => {
      const event = r.event as Record<string, unknown> | null;
      return event && (event.start_date as string) >= today;
    })
    .slice(0, 3);

  // Determine resource categories to suggest based on profile tags
  const relevantCategories = new Set<string>();
  profileTags.forEach((tag) => {
    const lower = tag.toLowerCase();
    Object.entries(tagToCategories).forEach(([key, cats]) => {
      if (lower.includes(key)) cats.forEach((c) => relevantCategories.add(c));
    });
  });

  // Fetch matched resources if we have relevant categories
  let matchedResources: Record<string, unknown>[] = [];
  if (relevantCategories.size > 0) {
    const { data } = await supabase
      .from("resources")
      .select("id, name, slug, category, organization, status, is_free, description")
      .eq("is_published", true)
      .in("category", Array.from(relevantCategories))
      .in("status", ["open", "upcoming", "limited"])
      .order("created_at", { ascending: false })
      .limit(6);
    matchedResources = (data as Record<string, unknown>[]) ?? [];
  }

  // Fetch district-specific events if user has district
  let districtEvents: Record<string, unknown>[] = [];
  if (district) {
    const { data } = await supabase
      .from("events")
      .select("id, title, slug, start_date, start_time, location_name, category")
      .eq("is_published", true)
      .eq("district", district)
      .gte("start_date", today)
      .order("start_date")
      .limit(4);
    districtEvents = (data as Record<string, unknown>[]) ?? [];
  }

  const dInfo = district ? districtInfo[district] : null;
  const posts = recentPosts ?? [];
  const tickets = ticketOrders ?? [];

  return (
    <div className="animate-fade-in pb-safe">
      {/* ── Profile Hero ── */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gold/10 via-deep to-hc-purple/8" />
        <div className="absolute inset-0 pattern-dots opacity-20" />
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-midnight to-transparent" />

        <div className="relative z-10 px-5 pt-5 pb-5">
          {/* Avatar & Name */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={displayName}
                  className="w-[76px] h-[76px] rounded-full object-cover ring-4 ring-midnight shadow-lg shadow-gold/20"
                />
              ) : (
                <div className="w-[76px] h-[76px] rounded-full bg-gradient-to-br from-gold to-gold-light flex items-center justify-center text-midnight font-heading font-bold text-2xl ring-4 ring-midnight shadow-lg shadow-gold/20">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              {verificationStatus === "verified" && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald flex items-center justify-center ring-2 ring-midnight">
                  <svg width="12" height="12" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M2.5 6l2.5 2.5 5-5" />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-heading text-xl font-bold leading-tight truncate">
                {displayName}
              </h1>
              <p className="text-sm text-txt-secondary mb-1.5">{handle}</p>
              <div className="flex gap-1.5 flex-wrap">
                {verificationStatus === "verified" ? (
                  <Badge label="Verified" variant="emerald" />
                ) : (
                  <Badge label="Unverified" variant="gold" />
                )}
                {district && dInfo && (
                  <Badge label={`District ${district}`} variant="cyan" />
                )}
                <Badge label={role.replace("_", " ")} variant="purple" />
              </div>
            </div>

            {/* Edit profile */}
            <Link href="/profile/settings" className="shrink-0">
              <div className="w-9 h-9 rounded-xl bg-card border border-border-subtle flex items-center justify-center press hover:border-gold/20 transition-colors">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-txt-secondary">
                  <path d="M11.5 1.5l3 3-9 9H2.5v-3l9-9z" />
                </svg>
              </div>
            </Link>
          </div>

          {/* Bio */}
          {bio && (
            <p className="text-[12px] text-txt-secondary leading-relaxed mb-3 line-clamp-2">{bio}</p>
          )}

          {/* Member since */}
          {memberSince && (
            <p className="text-[10px] text-txt-secondary/60 mb-3">
              Compton resident since {memberSince}
            </p>
          )}

          {/* Stats */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Saved", value: savedCount ?? 0, icon: "🔖", color: "#F2A900" },
              { label: "RSVPs", value: rsvpCount ?? 0, icon: "📅", color: "#3B82F6" },
              { label: "Tickets", value: tickets.length, icon: "🎟️", color: "#8B5CF6" },
              { label: "Tags", value: profileTags.length, icon: "💡", color: "#22C55E" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-card rounded-xl p-2.5 text-center border border-border-subtle relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: stat.color }} />
                <span className="text-sm block mb-0.5">{stat.icon}</span>
                <p className="font-heading font-bold text-sm leading-none" style={{ color: stat.color }}>
                  {stat.value}
                </p>
                <p className="text-[8px] text-txt-secondary mt-0.5 font-medium uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Your District ── */}
      {district && dInfo && (
        <section className="px-5 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-5 rounded-full" style={{ background: dInfo.color }} />
            <h2 className="font-heading font-bold text-base">Your District</h2>
          </div>
          <Link href="/district">
            <div className="rounded-2xl bg-card border border-border-subtle p-4 relative overflow-hidden hover:border-gold/20 transition-colors press">
              <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: dInfo.color }} />
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${dInfo.color}15` }}>
                  <span className="font-heading font-bold text-xl" style={{ color: dInfo.color }}>{district}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-heading font-bold text-[13px]">{dInfo.council}</p>
                  <p className="text-[11px] text-txt-secondary">{dInfo.area}</p>
                </div>
                <div className="shrink-0">
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-txt-secondary/50">
                    <path d="M6 4l4 4-4 4" />
                  </svg>
                </div>
              </div>

              {/* District events */}
              {districtEvents.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border-subtle">
                  <p className="text-[9px] text-txt-secondary font-semibold uppercase tracking-wider mb-2">Upcoming in your district</p>
                  <div className="space-y-1.5">
                    {districtEvents.slice(0, 2).map((evt) => (
                      <div key={evt.id as string} className="flex items-center gap-2">
                        <span className="text-[10px]">📅</span>
                        <p className="text-[11px] truncate flex-1">{evt.title as string}</p>
                        <p className="text-[9px] text-txt-secondary shrink-0">
                          {new Date(evt.start_date as string).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Link>
        </section>
      )}

      {/* ── Upcoming Events ── */}
      {upcomingEvents.length > 0 && (
        <section className="px-5 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-5 rounded-full bg-hc-blue" />
            <h2 className="font-heading font-bold text-base">Your Upcoming Events</h2>
            <Link href="/events" className="ml-auto text-[10px] text-gold font-bold">See All</Link>
          </div>
          <div className="space-y-2.5">
            {upcomingEvents.map((rsvp: Record<string, unknown>) => {
              const event = rsvp.event as Record<string, unknown>;
              if (!event) return null;
              const eventDate = new Date(event.start_date as string);
              return (
                <Link key={event.id as string} href={`/events/${event.slug}`}>
                  <div className="rounded-xl bg-card border border-border-subtle p-3 flex items-center gap-3 hover:border-gold/20 transition-colors press relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-hc-blue rounded-l-xl" />
                    <div className="w-11 h-11 rounded-lg bg-hc-blue/10 flex flex-col items-center justify-center shrink-0">
                      <span className="text-[9px] font-bold text-hc-blue uppercase">
                        {eventDate.toLocaleDateString("en-US", { month: "short" })}
                      </span>
                      <span className="font-heading font-bold text-sm text-hc-blue leading-none">
                        {eventDate.getDate()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-bold truncate">{event.title as string}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {String(event.start_time ?? "") !== "" && (
                          <span className="text-[10px] text-txt-secondary">{String(event.start_time)}</span>
                        )}
                        {String(event.location_name ?? "") !== "" && (
                          <span className="text-[10px] text-txt-secondary truncate">📍 {String(event.location_name)}</span>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 px-2 py-0.5 rounded-md bg-emerald/10 border border-emerald/20">
                      <span className="text-[9px] font-bold text-emerald">Going</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Your Tickets ── */}
      {tickets.length > 0 && (
        <section className="px-5 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-5 rounded-full bg-hc-purple" />
            <h2 className="font-heading font-bold text-base">Your Tickets</h2>
            <Link href="/profile/tickets" className="ml-auto text-[10px] text-gold font-bold">See All</Link>
          </div>
          <div className="space-y-2.5">
            {(tickets as Record<string, unknown>[]).map((order) => {
              const event = order.event as Record<string, unknown> | null;
              return (
                <Link key={order.id as string} href={`/tickets/${order.id}`}>
                  <div className="rounded-xl bg-card border border-border-subtle p-3 flex items-center gap-3 hover:border-gold/20 transition-colors press relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-hc-purple rounded-l-xl" />
                    <div className="w-11 h-11 rounded-lg bg-hc-purple/10 flex items-center justify-center shrink-0">
                      <span className="text-lg">🎟️</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-bold truncate">{event ? (event.title as string) : "Event"}</p>
                      <p className="text-[10px] text-txt-secondary">Order #{order.order_number as string}</p>
                    </div>
                    <div className={`shrink-0 px-2 py-0.5 rounded-md ${order.status === "confirmed" ? "bg-emerald/10 border border-emerald/20" : "bg-gold/10 border border-gold/20"}`}>
                      <span className={`text-[9px] font-bold ${order.status === "confirmed" ? "text-emerald" : "text-gold"}`}>
                        {(order.status as string).charAt(0).toUpperCase() + (order.status as string).slice(1)}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Profile Tags (interests) ── */}
      <section className="px-5 mb-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5 rounded-full bg-gold" />
          <h2 className="font-heading font-bold text-base">Your Interests</h2>
          <Badge label="AI Matched" variant="gold" shine />
        </div>
        <div className="flex flex-wrap gap-2 mb-2">
          {profileTags.length > 0 ? (
            profileTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-hc-purple/10 border border-hc-purple/20 text-hc-purple text-[11px] font-semibold"
              >
                {tag}
              </span>
            ))
          ) : (
            <span className="text-xs text-txt-secondary">No interests yet — browse resources to get AI-matched tags</span>
          )}
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-dashed border-white/15 text-[11px] text-txt-secondary press hover:border-gold/30 hover:text-gold transition-all">
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 2v8M2 6h8" />
            </svg>
            Add
          </button>
        </div>
        <p className="text-[10px] text-txt-secondary leading-relaxed">
          Your interests help us match you with relevant resources, events & opportunities in Compton
        </p>
      </section>

      {/* ── Achievements / Badges ── */}
      <BadgesSection />

      {/* ── Hub City Digital ID Card ── */}
      <section className="px-5 mb-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5 rounded-full bg-gold" />
          <h2 className="font-heading font-bold text-base">My Hub City Card</h2>
        </div>
        <CitizenIDCard
          avatarUrl={profile?.avatar_url}
          displayName={displayName}
          handle={handle}
          district={district}
          memberSince={memberSince}
          isVerified={verificationStatus === "verified"}
          role={role}
          profileUrl={`hubcity.app/profile/${profile?.handle || profile?.id || ""}`}
        />
      </section>

      {/* ── Resources For You ── */}
      {matchedResources.length > 0 && (
        <section className="mb-5">
          <div className="px-5 flex items-center gap-2 mb-3">
            <div className="w-1 h-5 rounded-full bg-emerald" />
            <h2 className="font-heading font-bold text-base">Resources For You</h2>
            <Link href="/resources" className="ml-auto text-[10px] text-gold font-bold">See All</Link>
          </div>
          <div className="flex gap-3 px-5 overflow-x-auto scrollbar-hide pb-2">
            {matchedResources.map((res, i) => {
              const cat = res.category as string;
              const accentColor = resourceCategoryColors[cat] || "#F2A900";
              return (
                <Link
                  key={res.id as string}
                  href={`/resources/${res.slug}`}
                  className="shrink-0 w-[200px] animate-slide-in"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="rounded-xl bg-card border border-border-subtle p-3.5 hover:border-gold/20 transition-colors press relative overflow-hidden h-full">
                    <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: accentColor }} />
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${accentColor}15` }}>
                        <span className="text-sm">{resourceCategoryIcons[cat] || "📦"}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[8px] font-bold uppercase tracking-wider" style={{ color: accentColor }}>{cat}</p>
                      </div>
                      {res.is_free === true && (
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-emerald/10 text-emerald border border-emerald/20">FREE</span>
                      )}
                    </div>
                    <h3 className="text-[12px] font-bold mb-1 line-clamp-2 leading-tight">{String(res.name)}</h3>
                    {res.organization ? (
                      <p className="text-[10px] text-txt-secondary truncate">{String(res.organization)}</p>
                    ) : null}
                    <div className="mt-2 flex items-center gap-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${res.status === "open" ? "bg-emerald" : res.status === "limited" ? "bg-gold" : "bg-hc-blue"}`} />
                      <span className="text-[9px] text-txt-secondary capitalize">{res.status as string}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Quick Actions ── */}
      <section className="px-5 mb-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5 rounded-full bg-cyan" />
          <h2 className="font-heading font-bold text-base">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { label: "Find Resources", icon: "🤖", desc: "AI-powered matching", href: "/resources", color: "#22C55E" },
            { label: "Browse Events", icon: "📅", desc: `${rsvpCount ?? 0} RSVPs`, href: "/events", color: "#3B82F6" },
            { label: "Local Businesses", icon: "🏪", desc: "Deals & specials", href: "/business", color: "#F2A900" },
            { label: "City Pulse", icon: "📡", desc: "News & updates", href: "/pulse", color: "#8B5CF6" },
            { label: "City Hall", icon: "🏛️", desc: "Services & permits", href: "/city-hall", color: "#06B6D4" },
            { label: "Food & Dining", icon: "🍽️", desc: "Order & explore", href: "/food", color: "#FF6B6B" },
          ].map((action) => (
            <Link key={action.label} href={action.href}>
              <div className="rounded-xl bg-card border border-border-subtle p-3.5 hover:border-gold/20 transition-colors press relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: action.color }} />
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${action.color}12` }}>
                    <span className="text-lg">{action.icon}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12px] font-bold">{action.label}</p>
                    <p className="text-[10px] text-txt-secondary">{action.desc}</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Recent Activity ── */}
      {posts.length > 0 && (
        <section className="px-5 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-5 rounded-full bg-coral" />
            <h2 className="font-heading font-bold text-base">Your Posts</h2>
            <Link href="/pulse" className="ml-auto text-[10px] text-gold font-bold">See All</Link>
          </div>
          <div className="space-y-2">
            {(posts as Record<string, unknown>[]).map((post) => (
              <div key={post.id as string} className="rounded-xl bg-card border border-border-subtle p-3 relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-coral rounded-l-xl" />
                <div className="pl-2">
                  {post.title ? <p className="text-[12px] font-bold mb-0.5">{String(post.title)}</p> : null}
                  <p className="text-[11px] text-txt-secondary line-clamp-2">{post.body as string}</p>
                  <p className="text-[9px] text-txt-secondary/50 mt-1">{timeAgo(post.created_at as string)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Emergency & Important Numbers ── */}
      <section className="px-5 mb-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5 rounded-full bg-compton-red" />
          <h2 className="font-heading font-bold text-base">Important Numbers</h2>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {emergencyContacts.map((contact) => (
            <a key={contact.label} href={`tel:${contact.number.replace(/[^0-9]/g, "")}`}>
              <div className="rounded-xl bg-card border border-border-subtle p-3 text-center hover:border-compton-red/20 transition-colors press relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-compton-red/40" />
                <span className="text-lg block mb-1">{contact.icon}</span>
                <p className="text-[10px] font-bold mb-0.5">{contact.label}</p>
                <p className="text-[9px] text-txt-secondary">{contact.number}</p>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* ── Divider ── */}
      <div className="divider-subtle mx-5 mb-4" />

      {/* ── Settings Menu ── */}
      <div className="px-5 space-y-1">
        <p className="text-[10px] text-txt-secondary font-semibold uppercase tracking-wider mb-2">Account & Settings</p>
        {[
          { label: "Saved Items", icon: "🔖", href: "/profile/saved", count: savedCount ?? 0 },
          { label: "My Applications", icon: "📋", href: "/profile/applications" },
          { label: "My Job Applications", icon: "💼", href: "/profile/jobs" },
          { label: "My Tickets", icon: "🎟️", href: "/profile/tickets" },
          { label: "My Groups", icon: "🤝", href: "/groups" },
          { label: "My RSVPs", icon: "📅", href: "/events", count: rsvpCount ?? 0 },
          { label: "Notification Settings", icon: "🔔", href: "/profile/settings" },
          { label: "Verify Address", icon: "✅", href: "/verify-address", highlight: verificationStatus !== "verified" },
          { label: "Language", icon: "🌐", comingSoon: true, detail: profile?.language || "English" },
          { label: "Privacy & Data", icon: "🔒", comingSoon: true },
          { label: "Help & Support", icon: "❓", comingSoon: true },
          { label: "About Hub City", icon: "ℹ️", comingSoon: true },
        ].map((item) => {
          const content = (
            <div className={`flex items-center justify-between py-3 px-1 rounded-xl transition-colors ${item.comingSoon ? "opacity-50 cursor-default" : "hover:bg-white/[0.03] press"}`}>
              <div className="flex items-center gap-3">
                <span className="text-base w-6 text-center">{item.icon}</span>
                <span className="text-[13px] font-medium">{item.label}</span>
                {item.comingSoon && (
                  <span className="text-[9px] text-txt-secondary bg-white/[0.06] px-1.5 py-0.5 rounded-full font-medium">
                    Coming Soon
                  </span>
                )}
                {(item as Record<string, unknown>).highlight === true ? (
                  <span className="text-[9px] text-gold bg-gold/10 px-1.5 py-0.5 rounded-full font-bold">
                    Verify Now
                  </span>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                {item.count !== undefined && item.count > 0 && (
                  <span className="text-[10px] text-gold font-bold bg-gold/10 px-2 py-0.5 rounded-full">
                    {item.count}
                  </span>
                )}
                {item.detail && (
                  <span className="text-[11px] text-txt-secondary">
                    {item.detail}
                  </span>
                )}
                {!item.comingSoon && (
                  <svg
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-txt-secondary/50"
                    strokeLinecap="round"
                  >
                    <path d="M6 4l4 4-4 4" />
                  </svg>
                )}
              </div>
            </div>
          );

          if (item.comingSoon) {
            return <div key={item.label}>{content}</div>;
          }
          return <Link key={item.label} href={(item as { href: string }).href}>{content}</Link>;
        })}
      </div>

      {/* ── Sign Out ── */}
      <div className="px-5 mt-8 mb-6">
        <SignOutButton />

        <p className="text-center text-[10px] text-txt-secondary/50 mt-3">
          {user.email}
        </p>
        <p className="text-center text-[10px] text-txt-secondary/50 mt-1">
          Hub City v1.0.0 · Made with love in Compton
        </p>
      </div>
    </div>
  );
}
