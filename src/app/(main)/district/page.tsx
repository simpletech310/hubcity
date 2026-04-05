import Image from "next/image";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import SectionHeader from "@/components/layout/SectionHeader";
import { createClient } from "@/lib/supabase/server";

export default async function DistrictPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userDistrict: number | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("district")
      .eq("id", user.id)
      .single();
    userDistrict = profile?.district ?? null;
  }

  const today = new Date().toISOString().split("T")[0];

  // Fetch all real data in parallel
  const [
    { data: upcomingEvents },
    { count: businessesCount },
    { count: schoolsCount },
    { count: eventsCount },
    { data: activeAlerts },
    { data: officialPosts },
  ] = await Promise.all([
    supabase
      .from("events")
      .select("*")
      .gte("start_date", today)
      .eq("is_published", true)
      .order("start_date")
      .limit(3),
    supabase
      .from("businesses")
      .select("id", { count: "exact", head: true })
      .eq("is_published", true),
    supabase
      .from("schools")
      .select("id", { count: "exact", head: true })
      .eq("is_published", true),
    supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .gte("start_date", today)
      .eq("is_published", true),
    supabase
      .from("city_alerts")
      .select("id, title, body, alert_type, severity")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("posts")
      .select("id, body, created_at, author:profiles(id, display_name, avatar_url, role)")
      .eq("is_published", true)
      .eq("profiles.role", "city_official")
      .order("created_at", { ascending: false })
      .limit(3),
  ]);

  const quickLinks = [
    { label: "City Hall", href: "/city-hall", icon: "\u{1F3DB}\uFE0F" },
    { label: "Report Issue", href: "/city-hall/issues", icon: "\u{1F6A8}" },
    { label: "City Data", href: "/city-data", icon: "\u{1F4CA}" },
    { label: "Schools", href: "/schools", icon: "\u{1F393}" },
    { label: "Health", href: "/health", icon: "\u{1FA7A}" },
    { label: "Parks", href: "/parks", icon: "\u{1F333}" },
  ];

  const severityColor: Record<string, string> = {
    critical: "coral",
    high: "coral",
    medium: "gold",
    low: "cyan",
    info: "cyan",
  };

  return (
    <div className="animate-fade-in space-y-6 pb-6">
      {/* District Badge */}
      {userDistrict && (
        <div className="mx-5 mt-4 bg-gradient-to-r from-gold/10 to-gold/5 border border-gold/20 rounded-xl px-4 py-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center shrink-0">
            <span className="text-gold font-heading font-bold text-sm">D{userDistrict}</span>
          </div>
          <div>
            <p className="text-sm font-bold text-gold">Your District: District {userDistrict}</p>
            <p className="text-[11px] text-txt-secondary">Verified resident</p>
          </div>
        </div>
      )}

      {/* City Hero */}
      <div className="px-5 pt-2">
        <div className="relative h-40 rounded-2xl overflow-hidden">
          <Image
            src="/images/city-hall.png"
            alt="Compton City Hall"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/50 to-transparent" />
          <div className="pattern-dots absolute inset-0 opacity-20" />
          <div className="absolute bottom-4 left-4 right-4">
            <p className="text-[10px] text-gold font-bold tracking-[0.2em] uppercase mb-1">
              City of
            </p>
            <h1 className="font-display text-2xl font-bold">Compton, California</h1>
          </div>
        </div>
      </div>

      {/* City at a Glance */}
      <div className="px-5">
        <SectionHeader title="City at a Glance" compact />
        <div className="grid grid-cols-3 gap-2.5">
          <Card>
            <div className="text-center py-1">
              <p className="font-heading font-bold text-gold text-lg leading-none">{eventsCount ?? 0}</p>
              <p className="text-[10px] text-txt-secondary mt-1 font-medium">Upcoming Events</p>
            </div>
          </Card>
          <Card>
            <div className="text-center py-1">
              <p className="font-heading font-bold text-gold text-lg leading-none">{businessesCount ?? 0}</p>
              <p className="text-[10px] text-txt-secondary mt-1 font-medium">Businesses</p>
            </div>
          </Card>
          <Card>
            <div className="text-center py-1">
              <p className="font-heading font-bold text-gold text-lg leading-none">{schoolsCount ?? 0}</p>
              <p className="text-[10px] text-txt-secondary mt-1 font-medium">Schools</p>
            </div>
          </Card>
        </div>
      </div>

      {/* City Alerts */}
      {activeAlerts && activeAlerts.length > 0 && (
        <div className="px-5">
          <SectionHeader title="City Alerts" linkText="All Alerts" linkHref="/city-data" compact />
          <div className="space-y-2.5">
            {activeAlerts.map((alert) => (
              <Link key={alert.id} href="/city-data">
                <Card hover className="border-cyan/10">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-cyan/10 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-cyan text-sm">!</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-bold text-[13px] truncate">{alert.title}</p>
                        <Badge
                          label={alert.severity ?? "info"}
                          variant={severityColor[alert.severity ?? "info"] as "coral" | "gold" | "cyan" ?? "cyan"}
                        />
                      </div>
                      {alert.body && (
                        <p className="text-[11px] text-txt-secondary line-clamp-2">{alert.body}</p>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent from City Hall */}
      {officialPosts && officialPosts.length > 0 && (
        <div className="px-5">
          <SectionHeader title="Recent from City Hall" linkText="See All" linkHref="/pulse" compact />
          <div className="space-y-2.5">
            {officialPosts.map((post) => {
              const authorArr = post.author as unknown as { id: string; display_name: string; avatar_url: string | null; role: string }[] | null;
              const author = authorArr?.[0] ?? null;
              return (
                <Link key={post.id} href="/pulse">
                  <Card hover>
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-royal to-hc-purple flex items-center justify-center shrink-0 overflow-hidden ring-2 ring-gold/20">
                        {author?.avatar_url ? (
                          <Image
                            src={author.avatar_url}
                            alt={author.display_name ?? ""}
                            width={36}
                            height={36}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <span className="text-gold font-heading font-bold text-xs">
                            {(author?.display_name ?? "?").charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-[12px] font-bold truncate">{author?.display_name ?? "City Official"}</p>
                          <Badge label="Official" variant="gold" />
                        </div>
                        <p className="text-[12px] text-txt-secondary line-clamp-2">{post.body}</p>
                        <p className="text-[10px] text-txt-secondary/60 mt-1">
                          {new Date(post.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Upcoming Events */}
      {upcomingEvents && upcomingEvents.length > 0 && (
        <div className="px-5">
          <SectionHeader title="Upcoming Events" linkText="See All" linkHref="/events" compact />
          <div className="space-y-2.5">
            {upcomingEvents.map((event) => (
              <Link key={event.id} href={`/events/${event.id}`}>
                <Card hover>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-14 rounded-lg bg-midnight/50 border border-border-subtle flex flex-col items-center justify-center shrink-0">
                      <p className="text-[9px] text-gold font-bold uppercase leading-none">
                        {new Date(event.start_date).toLocaleDateString("en-US", { month: "short" })}
                      </p>
                      <p className="text-base font-bold leading-none mt-0.5">
                        {new Date(event.start_date).getDate()}
                      </p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[13px] truncate">{event.title}</p>
                      {event.location_name && (
                        <p className="text-[11px] text-txt-secondary truncate">{event.location_name}</p>
                      )}
                    </div>
                    <Badge label={event.category} variant="purple" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="px-5">
        <SectionHeader title="Quick Links" compact />
        <div className="grid grid-cols-2 gap-2.5">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <Card hover>
                <div className="flex items-center gap-3 py-0.5">
                  <span className="text-lg">{link.icon}</span>
                  <p className="text-[13px] font-bold">{link.label}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
