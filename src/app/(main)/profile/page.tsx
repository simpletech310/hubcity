import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import Badge from "@/components/ui/Badge";
import Icon from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";
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

const resourceCategoryIcons: Record<string, IconName> = {
  business: "store",
  housing: "house",
  health: "heart-pulse",
  youth: "baby",
  jobs: "briefcase",
  food: "utensils",
  legal: "gavel",
  senior: "elder",
  education: "book",
  veterans: "veteran",
  utilities: "lightbulb",
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
const emergencyContacts: { label: string; number: string; icon: IconName }[] = [
  { label: "Emergency", number: "911", icon: "alert" },
  { label: "City Hall", number: "(310) 605-5500", icon: "landmark" },
  { label: "Non-Emergency", number: "(310) 605-5511", icon: "phone" },
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
    // User's recent pulse posts (fetch more for grid)
    supabase
      .from("posts")
      .select("id, title, body, image_url, created_at")
      .eq("author_id", user.id)
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(12),
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

  // Check if user is a business owner
  let userBusiness: { id: string; name: string; slug: string; rating_avg: number; rating_count: number; category: string } | null = null;
  if (role === "business_owner") {
    const { data: biz } = await supabase
      .from("businesses")
      .select("id, name, slug, rating_avg, rating_count, category")
      .eq("owner_id", user.id)
      .single();
    userBusiness = biz;
  }

  // Surface creator dashboard for users with the creator role.
  const isCreator = profile?.is_creator === true || role === "content_creator";

  const dInfo = district ? districtInfo[district] : null;
  const posts = recentPosts ?? [];
  const tickets = ticketOrders ?? [];

  // Separate posts with images for Instagram grid
  const postsWithImages = (posts as Record<string, unknown>[]).filter((p) => p.image_url);
  const postsTextOnly = (posts as Record<string, unknown>[]).filter((p) => !p.image_url);

  return (
    <div className="animate-fade-in pb-safe culture-surface min-h-dvh">
      {/* -- Profile Hero -- */}
      <div className="relative overflow-hidden" style={{ borderBottom: "3px solid var(--rule-strong-c)" }}>
        <div className="relative z-10 px-5 pt-5 pb-5">
          {/* Avatar & Name */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative">
              {profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt={displayName}
                  className="w-[76px] h-[76px] rounded-full object-cover"
                  style={{ border: "3px solid var(--rule-strong-c)" }}
                />
              ) : (
                <div
                  className="w-[76px] h-[76px] rounded-full flex items-center justify-center c-hero"
                  style={{
                    background: "var(--gold-c)",
                    color: "var(--ink-strong)",
                    border: "3px solid var(--rule-strong-c)",
                    fontSize: 30,
                  }}
                >
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              {verificationStatus === "verified" && (
                <div
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{
                    background: "var(--gold-c)",
                    border: "2px solid var(--rule-strong-c)",
                  }}
                >
                  <Icon name="check" size={12} style={{ color: "var(--ink-strong)" }} strokeWidth={2.5} />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="c-hero truncate" style={{ fontSize: 26, color: "var(--ink-strong)" }}>
                {displayName}
              </h1>
              <p className="c-meta mb-1.5">{handle}</p>
              <div className="flex gap-1.5 flex-wrap">
                {verificationStatus === "verified" ? (
                  <Badge label="Verified" variant="emerald" iconName="verified" />
                ) : (
                  <Badge label="Unverified" variant="gold" />
                )}
                {district && dInfo && (
                  <Badge label={`District ${district}`} variant="cyan" iconName="map-pin" />
                )}
                <Badge label={role.replace("_", " ")} variant="purple" />
              </div>
            </div>

            {/* Edit profile */}
            <Link href="/profile/edit" className="shrink-0">
              <div
                className="w-9 h-9 flex items-center justify-center press"
                style={{
                  background: "var(--paper-warm)",
                  border: "2px solid var(--rule-strong-c)",
                }}
              >
                <Icon name="edit" size={16} style={{ color: "var(--ink-strong)" }} />
              </div>
            </Link>
          </div>

          {/* Bio */}
          {bio && (
            <p className="c-serif-it mb-3 line-clamp-2" style={{ fontSize: 13, color: "var(--ink-strong)", opacity: 0.85 }}>{bio}</p>
          )}

          {/* Member since */}
          {memberSince && (
            <p className="c-meta mb-3" style={{ opacity: 0.65 }}>
              Compton member since {memberSince}
            </p>
          )}

          {/* Stats */}
          <div className="grid grid-cols-4 gap-2">
            {([
              { label: "Saved", value: savedCount ?? 0, icon: "bookmark" as IconName },
              { label: "RSVPs", value: rsvpCount ?? 0, icon: "calendar" as IconName },
              { label: "Tickets", value: tickets.length, icon: "ticket" as IconName },
              { label: "Tags", value: profileTags.length, icon: "lightbulb" as IconName },
            ]).map((stat) => (
              <div
                key={stat.label}
                className="p-2.5 text-center relative overflow-hidden"
                style={{
                  background: "var(--paper-warm)",
                  border: "2px solid var(--rule-strong-c)",
                }}
              >
                <div className="absolute top-0 left-0 right-0 h-1" style={{ background: "var(--gold-c)" }} />
                <span className="block mb-0.5" style={{ color: "var(--ink-strong)" }}>
                  <Icon name={stat.icon} size={16} className="mx-auto" />
                </span>
                <p className="c-hero" style={{ fontSize: 18, color: "var(--ink-strong)", lineHeight: 1 }}>
                  {stat.value}
                </p>
                <p className="c-kicker mt-0.5" style={{ fontSize: 8, color: "var(--ink-strong)", opacity: 0.65 }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* -- Creator Studio (creators only) -- */}
      {isCreator && (
        <section className="px-5 mb-5 pt-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-5" style={{ background: "var(--gold-c)" }} />
            <h2 className="c-card-t" style={{ fontSize: 16, color: "var(--ink-strong)" }}>Creator Studio</h2>
          </div>
          <Link href="/dashboard/creator">
            <div className="c-frame p-4 relative overflow-hidden press" style={{ background: "var(--paper-soft)" }}>
              <div className="absolute top-0 left-0 right-0 h-1" style={{ background: "var(--gold-c)" }} />
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 flex items-center justify-center shrink-0"
                  style={{ background: "var(--gold-c)", border: "2px solid var(--rule-strong-c)" }}
                >
                  <Icon name="dollar" size={22} style={{ color: "var(--ink-strong)" }} />
                </div>
                <div className="flex-1">
                  <p className="c-card-t" style={{ fontSize: 14 }}>Creator Dashboard</p>
                  <p className="c-meta">
                    Earnings, payouts, monetization settings
                  </p>
                </div>
                <Icon name="chevron-right" size={16} style={{ color: "var(--ink-strong)", opacity: 0.5 }} />
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* -- My Subscriptions (anyone) -- */}
      <section className="px-5 mb-5">
        <Link href="/profile/subscriptions">
          <div className="c-frame p-4 relative overflow-hidden press" style={{ background: "var(--paper-soft)" }}>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 flex items-center justify-center shrink-0"
                style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)" }}
              >
                <Icon name="bell" size={18} style={{ color: "var(--ink-strong)" }} />
              </div>
              <div className="flex-1">
                <p className="c-card-t" style={{ fontSize: 13 }}>My Subscriptions</p>
                <p className="c-meta">
                  Channels you support · billing
                </p>
              </div>
              <Icon name="chevron-right" size={16} style={{ color: "var(--ink-strong)", opacity: 0.5 }} />
            </div>
          </div>
        </Link>
      </section>

      {/* -- Business Dashboard -- */}
      {userBusiness && (
        <section className="px-5 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-5" style={{ background: "var(--gold-c)" }} />
            <h2 className="c-card-t" style={{ fontSize: 16, color: "var(--ink-strong)" }}>My Business</h2>
          </div>
          <Link href="/dashboard">
            <div className="c-frame p-4 press relative overflow-hidden" style={{ background: "var(--gold-c)" }}>
              <div className="flex items-center gap-3.5 mb-3">
                <div
                  className="w-12 h-12 flex items-center justify-center shrink-0"
                  style={{ background: "var(--ink-strong)", border: "2px solid var(--rule-strong-c)" }}
                >
                  <Icon name="store" size={22} style={{ color: "var(--gold-c)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="c-card-t truncate" style={{ fontSize: 14 }}>{userBusiness.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="c-meta capitalize">{userBusiness.category}</span>
                    {Number(userBusiness.rating_avg) > 0 && (
                      <>
                        <span style={{ color: "var(--ink-strong)", opacity: 0.3 }}>&middot;</span>
                        <Icon name="star" size={11} style={{ color: "var(--ink-strong)" }} />
                        <span className="c-kicker" style={{ color: "var(--ink-strong)" }}>{Number(userBusiness.rating_avg).toFixed(1)}</span>
                        <span className="c-meta">({userBusiness.rating_count})</span>
                      </>
                    )}
                  </div>
                </div>
                <Icon name="chevron-right" size={20} style={{ color: "var(--ink-strong)" }} className="shrink-0" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 text-center" style={{ background: "var(--paper)", border: "2px solid var(--rule-strong-c)" }}>
                  <Icon name="receipt" size={16} style={{ color: "var(--ink-strong)" }} className="mx-auto" />
                  <p className="c-meta mt-0.5">Orders</p>
                </div>
                <div className="p-2 text-center" style={{ background: "var(--paper)", border: "2px solid var(--rule-strong-c)" }}>
                  <Icon name="calendar" size={16} style={{ color: "var(--ink-strong)" }} className="mx-auto" />
                  <p className="c-meta mt-0.5">Bookings</p>
                </div>
                <div className="p-2 text-center" style={{ background: "var(--paper)", border: "2px solid var(--rule-strong-c)" }}>
                  <Icon name="chart" size={16} style={{ color: "var(--ink-strong)" }} className="mx-auto" />
                  <p className="c-meta mt-0.5">Analytics</p>
                </div>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* -- Your District -- */}
      {district && dInfo && (
        <section className="px-5 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-5" style={{ background: dInfo.color }} />
            <h2 className="c-card-t" style={{ fontSize: 16, color: "var(--ink-strong)" }}>Your District</h2>
          </div>
          <Link href="/district">
            <div className="c-frame p-4 relative overflow-hidden press" style={{ background: "var(--paper-soft)" }}>
              <div className="absolute top-0 left-0 right-0 h-1" style={{ background: dInfo.color }} />
              <div className="flex items-center gap-3.5">
                <div
                  className="w-12 h-12 flex items-center justify-center shrink-0"
                  style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)" }}
                >
                  <span className="c-hero" style={{ fontSize: 20, color: "var(--ink-strong)" }}>{district}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="c-card-t" style={{ fontSize: 13 }}>{dInfo.council}</p>
                  <p className="c-meta">{dInfo.area}</p>
                </div>
                <div className="shrink-0">
                  <Icon name="chevron-right" size={16} style={{ color: "var(--ink-strong)", opacity: 0.5 }} />
                </div>
              </div>

              {/* District events */}
              {districtEvents.length > 0 && (
                <div className="mt-3 pt-3" style={{ borderTop: "2px solid var(--rule-strong-c)" }}>
                  <p className="c-kicker mb-2" style={{ fontSize: 9, color: "var(--ink-strong)", opacity: 0.65 }}>Upcoming in your district</p>
                  <div className="space-y-1.5">
                    {districtEvents.slice(0, 2).map((evt) => (
                      <div key={evt.id as string} className="flex items-center gap-2">
                        <Icon name="calendar" size={12} style={{ color: "var(--ink-strong)" }} className="shrink-0" />
                        <p className="c-body truncate flex-1" style={{ fontSize: 11 }}>{evt.title as string}</p>
                        <p className="c-meta shrink-0" style={{ fontSize: 9 }}>
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

      {/* -- Upcoming Events -- */}
      {upcomingEvents.length > 0 && (
        <section className="px-5 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-5 bg-hc-blue" />
            <h2 className="c-card-t" style={{ fontSize: 16, color: "var(--ink-strong)" }}>Your Upcoming Events</h2>
            <Link href="/events" className="ml-auto c-kicker press" style={{ color: "var(--ink-strong)", textDecoration: "underline", fontSize: 10 }}>SEE ALL</Link>
          </div>
          <div className="space-y-2.5">
            {upcomingEvents.map((rsvp: Record<string, unknown>) => {
              const event = rsvp.event as Record<string, unknown>;
              if (!event) return null;
              const eventDate = new Date(event.start_date as string);
              return (
                <Link key={event.id as string} href={`/events/${event.slug}`}>
                  <div className="c-frame p-3 flex items-center gap-3 press relative overflow-hidden" style={{ background: "var(--paper-soft)" }}>
                    <div
                      className="w-11 h-11 flex flex-col items-center justify-center shrink-0"
                      style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)" }}
                    >
                      <span className="c-kicker" style={{ fontSize: 8, color: "var(--ink-strong)", opacity: 0.7 }}>
                        {eventDate.toLocaleDateString("en-US", { month: "short" })}
                      </span>
                      <span className="c-hero" style={{ fontSize: 16, color: "var(--ink-strong)", lineHeight: 1 }}>
                        {eventDate.getDate()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="c-card-t truncate" style={{ fontSize: 12 }}>{event.title as string}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {String(event.start_time ?? "") !== "" && (
                          <span className="c-meta">{String(event.start_time)}</span>
                        )}
                        {String(event.location_name ?? "") !== "" && (
                          <span className="c-meta truncate flex items-center gap-0.5">
                            <Icon name="map-pin" size={10} className="shrink-0" /> {String(event.location_name)}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge label="Going" variant="emerald" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* -- Your Tickets -- */}
      {tickets.length > 0 && (
        <section className="px-5 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-5" style={{ background: "var(--gold-c)" }} />
            <h2 className="c-card-t" style={{ fontSize: 16, color: "var(--ink-strong)" }}>Your Tickets</h2>
            <Link href="/profile/tickets" className="ml-auto c-kicker press" style={{ color: "var(--ink-strong)", textDecoration: "underline", fontSize: 10 }}>SEE ALL</Link>
          </div>
          <div className="space-y-2.5">
            {(tickets as Record<string, unknown>[]).map((order) => {
              const event = order.event as Record<string, unknown> | null;
              return (
                <Link key={order.id as string} href={`/tickets/${order.id}`}>
                  <div className="c-frame p-3 flex items-center gap-3 press relative overflow-hidden" style={{ background: "var(--paper-soft)" }}>
                    <div
                      className="w-11 h-11 flex items-center justify-center shrink-0"
                      style={{ background: "var(--gold-c)", border: "2px solid var(--rule-strong-c)" }}
                    >
                      <Icon name="ticket" size={20} style={{ color: "var(--ink-strong)" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="c-card-t truncate" style={{ fontSize: 12 }}>{event ? (event.title as string) : "Event"}</p>
                      <p className="c-meta">Order #{order.order_number as string}</p>
                    </div>
                    <Badge
                      label={(order.status as string).charAt(0).toUpperCase() + (order.status as string).slice(1)}
                      variant={order.status === "confirmed" ? "emerald" : "gold"}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* -- Profile Tags (interests) -- */}
      <section className="px-5 mb-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5" style={{ background: "var(--gold-c)" }} />
          <h2 className="c-card-t" style={{ fontSize: 16, color: "var(--ink-strong)" }}>Your Interests</h2>
          <Badge label="AI Matched" variant="gold" shine iconName="sparkle" />
        </div>
        <div className="flex flex-wrap gap-2 mb-2">
          {profileTags.length > 0 ? (
            profileTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 c-kicker"
                style={{
                  background: "var(--gold-c)",
                  border: "2px solid var(--rule-strong-c)",
                  color: "var(--ink-strong)",
                  fontSize: 11,
                  letterSpacing: "0.12em",
                }}
              >
                #{tag.toUpperCase()}
              </span>
            ))
          ) : (
            <span className="c-meta">No interests yet — browse resources to get AI-matched tags</span>
          )}
          <button
            className="inline-flex items-center gap-1.5 px-3 py-1.5 c-kicker press"
            style={{
              background: "var(--paper-warm)",
              border: "2px dashed var(--rule-strong-c)",
              color: "var(--ink-strong)",
              fontSize: 11,
              letterSpacing: "0.12em",
            }}
          >
            <Icon name="plus" size={12} />
            ADD
          </button>
        </div>
        <p className="c-meta">
          Your interests help us match you with relevant resources, events & opportunities in Compton
        </p>
      </section>

      {/* -- Achievements / Badges -- */}
      <BadgesSection />

      {/* -- Culture Digital ID Card -- */}
      <section className="px-5 mb-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5" style={{ background: "var(--gold-c)" }} />
          <h2 className="c-card-t" style={{ fontSize: 16, color: "var(--ink-strong)" }}>My Culture Card</h2>
        </div>
        <CitizenIDCard
          avatarUrl={profile?.avatar_url}
          displayName={displayName}
          handle={handle}
          district={district}
          memberSince={memberSince}
          isVerified={verificationStatus === "verified"}
          role={role}
          profileUrl={`knect.app/profile/${profile?.handle || profile?.id || ""}`}
        />
      </section>

      {/* -- Resources For You -- */}
      {matchedResources.length > 0 && (
        <section className="mb-5">
          <div className="px-5 flex items-center gap-2 mb-3">
            <div className="w-1 h-5 bg-emerald" />
            <h2 className="c-card-t" style={{ fontSize: 16, color: "var(--ink-strong)" }}>Resources For You</h2>
            <Link href="/resources" className="ml-auto c-kicker press" style={{ color: "var(--ink-strong)", textDecoration: "underline", fontSize: 10 }}>SEE ALL</Link>
          </div>
          <div className="flex gap-3 px-5 overflow-x-auto scrollbar-hide pb-2">
            {matchedResources.map((res, i) => {
              const cat = res.category as string;
              const resAccent = resourceCategoryColors[cat] || "#F2A900";
              const catIcon = resourceCategoryIcons[cat] || "lightbulb";
              return (
                <Link
                  key={res.id as string}
                  href={`/resources/${res.slug}`}
                  className="shrink-0 w-[200px] animate-slide-in"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="c-frame p-3 press relative overflow-hidden h-full" style={{ background: "var(--paper-soft)" }}>
                    <div className="absolute top-0 left-0 right-0 h-1" style={{ background: resAccent }} />
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-8 h-8 flex items-center justify-center"
                        style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)" }}
                      >
                        <Icon name={catIcon} size={16} style={{ color: "var(--ink-strong)" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="c-kicker" style={{ fontSize: 8, color: "var(--ink-strong)" }}>{cat.toUpperCase()}</p>
                      </div>
                      {res.is_free === true && (
                        <Badge label="FREE" variant="emerald" />
                      )}
                    </div>
                    <h3 className="c-card-t mb-1 line-clamp-2" style={{ fontSize: 12 }}>{String(res.name)}</h3>
                    {res.organization ? (
                      <p className="c-meta truncate">{String(res.organization)}</p>
                    ) : null}
                    <div className="mt-2 flex items-center gap-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${res.status === "open" ? "bg-emerald" : res.status === "limited" ? "bg-gold" : "bg-hc-blue"}`} />
                      <span className="c-meta capitalize">{res.status as string}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* -- Quick Actions -- */}
      <section className="px-5 mb-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5 bg-cyan" />
          <h2 className="c-card-t" style={{ fontSize: 16, color: "var(--ink-strong)" }}>Quick Actions</h2>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {([
            { label: "Find Resources", icon: "search" as IconName, desc: "AI-powered matching", href: "/resources", color: "#22C55E" },
            { label: "Browse Events", icon: "calendar" as IconName, desc: `${rsvpCount ?? 0} RSVPs`, href: "/events", color: "#3B82F6" },
            { label: "Independents", icon: "store" as IconName, desc: "Deals & specials", href: "/business", color: "#F2A900" },
            { label: "The Pulse", icon: "pulse" as IconName, desc: "News & updates", href: "/pulse", color: "#8B5CF6" },
            { label: "Community", icon: "landmark" as IconName, desc: "Resources & support", href: "/resources", color: "#06B6D4" },
            { label: "Food & Dining", icon: "utensils" as IconName, desc: "Order & explore", href: "/food", color: "#FF6B6B" },
          ]).map((action) => (
            <Link key={action.label} href={action.href}>
              <div className="c-frame p-3 press relative overflow-hidden" style={{ background: "var(--paper-soft)" }}>
                <div className="absolute top-0 left-0 right-0 h-1" style={{ background: action.color }} />
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 flex items-center justify-center shrink-0"
                    style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)" }}
                  >
                    <Icon name={action.icon} size={20} style={{ color: action.color }} />
                  </div>
                  <div className="min-w-0">
                    <p className="c-card-t" style={{ fontSize: 12 }}>{action.label}</p>
                    <p className="c-meta">{action.desc}</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* -- Your Posts (Instagram-style grid for images, list for text) -- */}
      {posts.length > 0 && (
        <section className="px-5 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-5 bg-coral" />
            <h2 className="c-card-t" style={{ fontSize: 16, color: "var(--ink-strong)" }}>Your Posts</h2>
            <Link href="/pulse" className="ml-auto c-kicker press" style={{ color: "var(--ink-strong)", textDecoration: "underline", fontSize: 10 }}>SEE ALL</Link>
          </div>

          {/* Instagram-style 3-col image grid */}
          {postsWithImages.length > 0 && (
            <div className="grid grid-cols-3 gap-1 overflow-hidden mb-3" style={{ border: "2px solid var(--rule-strong-c)" }}>
              {postsWithImages.map((post) => (
                <Link key={post.id as string} href={`/pulse/${post.id}`} className="relative aspect-square group">
                  <Image
                    src={post.image_url as string}
                    alt={post.title ? String(post.title) : "Post"}
                    fill
                    className="object-cover transition-opacity group-hover:opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                    <p className="c-body line-clamp-2" style={{ fontSize: 10, color: "var(--paper)" }}>
                      {post.body ? String(post.body).slice(0, 60) : ""}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Text-only posts list */}
          {postsTextOnly.length > 0 && (
            <div className="space-y-2">
              {postsTextOnly.slice(0, 3).map((post) => (
                <div key={post.id as string} className="c-frame p-3 relative overflow-hidden" style={{ background: "var(--paper-soft)" }}>
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-coral" />
                  <div className="pl-2">
                    {post.title ? <p className="c-card-t mb-0.5" style={{ fontSize: 12 }}>{String(post.title)}</p> : null}
                    <p className="c-body line-clamp-2" style={{ fontSize: 11 }}>{post.body as string}</p>
                    <p className="c-meta mt-1" style={{ fontSize: 9, opacity: 0.6 }}>{timeAgo(post.created_at as string)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* -- Emergency & Important Numbers -- */}
      <section className="px-5 mb-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5 bg-coral" />
          <h2 className="c-card-t" style={{ fontSize: 16, color: "var(--ink-strong)" }}>Important Numbers</h2>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {emergencyContacts.map((contact) => (
            <a key={contact.label} href={`tel:${contact.number.replace(/[^0-9]/g, "")}`}>
              <div className="c-frame p-3 text-center press relative overflow-hidden" style={{ background: "var(--paper-soft)" }}>
                <div className="absolute top-0 left-0 right-0 h-1 bg-coral" />
                <span className="block mb-1">
                  <Icon name={contact.icon} size={20} className="text-coral mx-auto" />
                </span>
                <p className="c-card-t mb-0.5" style={{ fontSize: 10 }}>{contact.label}</p>
                <p className="c-meta" style={{ fontSize: 9 }}>{contact.number}</p>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* -- Divider -- */}
      <div className="divider-subtle mx-5 mb-4" />

      {/* -- Settings Menu -- */}
      <div className="px-5 space-y-1">
        <p className="c-kicker mb-2" style={{ color: "var(--ink-strong)", opacity: 0.65 }}>Account & Settings</p>
        {([
          { label: "My Orders", icon: "receipt" as IconName, href: "/orders" },
          { label: "My Bookings", icon: "calendar" as IconName, href: "/bookings" },
          { label: "Saved Items", icon: "bookmark" as IconName, href: "/profile/saved", count: savedCount ?? 0 },
          { label: "My Resource Applications", icon: "document" as IconName, href: "/profile/applications" },
          { label: "My Job Applications", icon: "briefcase" as IconName, href: "/profile/jobs" },
          { label: "My Tickets", icon: "ticket" as IconName, href: "/profile/tickets" },
          ...((role === "admin" || role === "city_official" || role === "city_ambassador") ? [{ label: "Go Live", icon: "tv" as IconName, href: "/live", highlight: true }] : []),
          { label: "My Groups", icon: "users" as IconName, href: "/groups" },
          { label: "My RSVPs", icon: "calendar" as IconName, href: "/profile/rsvps", count: rsvpCount ?? 0 },
          { label: "Notification Settings", icon: "bell" as IconName, href: "/profile/settings" },
          { label: "Verify Address", icon: "verified" as IconName, href: "/verify-address", highlight: verificationStatus !== "verified" },
          { label: "Language", icon: "globe" as IconName, comingSoon: true, detail: profile?.language || "English" },
          { label: "Privacy & Data", icon: "lock" as IconName, comingSoon: true },
          { label: "Help & Support", icon: "info" as IconName, comingSoon: true },
          { label: "About Culture", icon: "info" as IconName, comingSoon: true },
        ] as { label: string; icon: IconName; href?: string; count?: number; highlight?: boolean; comingSoon?: boolean; detail?: string }[]).map((item) => {
          const content = (
            <div
              className={`flex items-center justify-between py-3 px-2 transition-colors ${item.comingSoon ? "opacity-50 cursor-default" : "press"}`}
              style={{ borderBottom: "1px solid var(--rule-strong-c)" }}
            >
              <div className="flex items-center gap-3">
                <span className="w-6 text-center flex items-center justify-center">
                  <Icon name={item.icon} size={18} style={{ color: "var(--ink-strong)" }} />
                </span>
                <span className="c-body" style={{ fontSize: 13, color: "var(--ink-strong)" }}>{item.label}</span>
                {item.comingSoon && (
                  <Badge label="Coming Soon" variant="gold" />
                )}
                {item.highlight === true ? (
                  <Badge label="Verify Now" variant="gold" />
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                {item.count !== undefined && item.count > 0 && (
                  <Badge label={String(item.count)} variant="gold" />
                )}
                {item.detail && (
                  <span className="c-meta">
                    {item.detail}
                  </span>
                )}
                {!item.comingSoon && (
                  <Icon name="chevron-right" size={16} style={{ color: "var(--ink-strong)", opacity: 0.5 }} />
                )}
              </div>
            </div>
          );

          if (item.comingSoon) {
            return <div key={item.label}>{content}</div>;
          }
          return <Link key={item.label} href={item.href!}>{content}</Link>;
        })}
      </div>

      {/* -- Sign Out -- */}
      <div className="px-5 mt-8 mb-6">
        <SignOutButton />

        <p className="c-meta text-center mt-3" style={{ opacity: 0.5 }}>
          {user.email}
        </p>
        <p className="c-meta text-center mt-1" style={{ opacity: 0.5 }}>
          Culture v1.0.0 — Made with love in Compton
        </p>
      </div>
    </div>
  );
}
