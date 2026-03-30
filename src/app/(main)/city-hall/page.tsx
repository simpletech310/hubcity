import Image from "next/image";
import Link from "next/link";
import SectionHeader from "@/components/layout/SectionHeader";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import DepartmentCard from "@/components/city-hall/DepartmentCard";
import { createClient } from "@/lib/supabase/server";
import { ROLE_BADGE_MAP } from "@/lib/constants";
import type { Department, Post, Event as CityEvent } from "@/types/database";

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

const quickLinks = [
  { label: "City Council", icon: "👥", href: "/district", color: "from-royal/40 to-royal/20" },
  { label: "Permits & Licenses", icon: "📄", href: "https://www.comptoncity.org/departments/permits", color: "from-gold/30 to-gold/10", external: true },
  { label: "Public Records", icon: "📁", href: "/city-hall/services", color: "from-cyan/40 to-cyan/20" },
  { label: "Pay Bills", icon: "💳", href: "https://www.comptoncity.org/departments/finance", color: "from-emerald/40 to-emerald/20", external: true },
  { label: "Report Issue", icon: "🛠️", href: "/city-hall/services", color: "from-coral/40 to-coral/20" },
  { label: "Contact Us", icon: "📞", href: "/city-hall/departments", color: "from-hc-purple/40 to-hc-purple/20" },
];

export default async function CityHallPage() {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  const [
    { data: departments },
    { data: officialPosts },
    { data: cityEvents },
  ] = await Promise.all([
    supabase
      .from("city_departments")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("posts")
      .select("*, author:profiles!inner(id, display_name, avatar_url, role, verification_status)")
      .eq("is_published", true)
      .eq("profiles.role", "city_official")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("events")
      .select("*")
      .eq("is_published", true)
      .eq("category", "city")
      .gte("start_date", today)
      .order("start_date", { ascending: true })
      .limit(5),
  ]);

  const depts = (departments ?? []) as Department[];
  const posts = (officialPosts ?? []) as Post[];
  const events = (cityEvents ?? []) as CityEvent[];

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="relative px-5 pt-2 pb-6">
        <div className="relative rounded-3xl overflow-hidden min-h-[200px] flex flex-col justify-end">
          <Image
            src="/images/generated/city-hall-hero.png"
            alt="Compton City Hall"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/60 to-midnight/20" />
          <div className="absolute inset-0 pattern-dots opacity-20" />

          <div className="relative z-10 p-6 pb-7">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-gold/20 border border-gold/30 flex items-center justify-center">
                <span className="text-2xl">🏛️</span>
              </div>
              <div>
                <p className="text-gold text-[10px] font-bold tracking-[0.25em] uppercase">
                  City of Compton
                </p>
                <h1 className="font-display text-[28px] font-bold leading-[1.1]">
                  City Hall
                </h1>
              </div>
            </div>
            <p className="text-txt-secondary text-sm leading-relaxed max-w-[280px]">
              Your digital gateway to Compton city government services and information.
            </p>
            <p className="text-gold/70 text-[11px] font-medium mt-2">
              Serving the Hub City since 1888
            </p>
          </div>
        </div>
      </section>

      {/* Quick Links Grid */}
      <section className="px-5 mb-8">
        <SectionHeader title="Quick Links" compact />
        <div className="grid grid-cols-3 gap-3 stagger">
          {quickLinks.map((link) => {
            const inner = (
              <div className="flex flex-col items-center gap-2 py-3 press group">
                <div
                  className={`w-[50px] h-[50px] rounded-2xl bg-gradient-to-br ${link.color} flex items-center justify-center text-[20px] group-hover:scale-110 transition-transform duration-300 border border-white/[0.06]`}
                >
                  {link.icon}
                </div>
                <span className="text-[11px] font-semibold text-txt-secondary group-hover:text-white transition-colors text-center leading-tight">
                  {link.label}
                </span>
              </div>
            );

            if (link.external) {
              return (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {inner}
                </a>
              );
            }

            return (
              <Link key={link.label} href={link.href}>
                {inner}
              </Link>
            );
          })}
        </div>
      </section>

      <div className="divider-subtle mx-5 mb-8" />

      {/* Departments Section */}
      {depts.length > 0 && (
        <section className="px-5 mb-8">
          <SectionHeader
            title="Departments"
            linkText="View All"
            linkHref="/city-hall/departments"
            compact
          />
          <div className="space-y-2.5 stagger">
            {depts.slice(0, 6).map((dept) => (
              <DepartmentCard key={dept.id} department={dept} />
            ))}
          </div>
          {depts.length > 6 && (
            <Link
              href="/city-hall/departments"
              className="block text-center text-sm text-gold font-semibold mt-4 press"
            >
              View All {depts.length} Departments
            </Link>
          )}
        </section>
      )}

      <div className="divider-subtle mx-5 mb-8" />

      {/* City News — Posts from City Officials */}
      {posts.length > 0 && (
        <section className="px-5 mb-8">
          <SectionHeader
            title="City News"
            linkText="View All"
            linkHref="/pulse"
            compact
          />
          <div className="space-y-3 stagger">
            {posts.map((post) => {
              const badge = post.author?.role ? ROLE_BADGE_MAP[post.author.role] : null;
              return (
                <Card key={post.id} hover>
                  <div className="flex items-center gap-3 mb-2.5">
                    <div className="w-9 h-9 rounded-full overflow-hidden relative ring-1 ring-gold/20">
                      {post.author?.avatar_url ? (
                        <Image
                          src={post.author.avatar_url}
                          alt={post.author.display_name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-royal to-hc-purple flex items-center justify-center text-[11px] font-bold text-gold">
                          {post.author?.display_name?.split(" ").map((w) => w[0]).join("").slice(0, 2) ?? "?"}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-[13px] font-bold">{post.author?.display_name ?? "City Official"}</p>
                        {badge && <Badge label={badge.label} variant={badge.variant} />}
                      </div>
                      <p className="text-[10px] text-txt-secondary">{timeAgo(post.created_at)}</p>
                    </div>
                  </div>
                  <p className="text-[12px] text-txt-secondary leading-relaxed line-clamp-3">
                    {post.body}
                  </p>
                  <div className="flex items-center gap-4 mt-2.5 pt-2.5 border-t border-border-subtle">
                    <span className="text-[11px] text-txt-secondary font-medium">
                      {post.comment_count > 0 ? `💬 ${post.comment_count}` : ""}
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* Upcoming City Meetings */}
      {events.length > 0 && (
        <section className="px-5 mb-8">
          <SectionHeader
            title="Upcoming City Meetings"
            linkText="See All"
            linkHref="/events?cat=city"
            compact
          />
          <div className="space-y-2.5">
            {events.map((event) => (
              <Link key={event.id} href={`/events/${event.id}`}>
                <Card hover>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-14 rounded-lg bg-midnight/50 border border-gold/15 flex flex-col items-center justify-center shrink-0">
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
                        <p className="text-[11px] text-txt-secondary truncate">
                          📍 {event.location_name}
                        </p>
                      )}
                      {event.start_time && (
                        <p className="text-[10px] text-txt-secondary mt-0.5">
                          🕐 {event.start_time}
                        </p>
                      )}
                    </div>
                    <Badge label="City" variant="gold" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA Banner */}
      <section className="px-5 mb-8">
        <div className="relative rounded-2xl overflow-hidden p-5 bg-gradient-to-br from-gold/10 via-deep to-midnight border border-gold/15">
          <div className="pattern-dots absolute inset-0 opacity-15" />
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
          <div className="relative text-center">
            <span className="text-3xl block mb-2">🌐</span>
            <h3 className="font-heading font-bold text-base mb-1">
              Visit comptoncity.org
            </h3>
            <p className="text-[12px] text-txt-secondary leading-relaxed mb-4 max-w-[280px] mx-auto">
              For full city services, agendas, and official documents, visit the City of Compton website.
            </p>
            <a
              href="https://www.comptoncity.org"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-gold text-midnight px-5 py-2.5 rounded-full text-xs font-bold press hover:bg-gold-light transition-colors"
            >
              Go to comptoncity.org
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M4 3l4 4-4 4" />
              </svg>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
