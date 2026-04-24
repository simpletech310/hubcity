import Image from "next/image";
import Link from "next/link";
import SectionHeader from "@/components/layout/SectionHeader";
import EditorialHeader from "@/components/ui/EditorialHeader";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Icon from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";
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

const quickLinks: { label: string; iconName: IconName; href: string; color: string; external?: boolean }[] = [
  { label: "City Council", iconName: "users", href: "/district", color: "from-royal/40 to-royal/20" },
  { label: "Permits & Licenses", iconName: "document", href: "https://www.comptoncity.org/departments/permits", color: "from-gold/30 to-gold/10", external: true },
  { label: "Public Records", iconName: "scroll", href: "/city-hall/issues", color: "from-cyan/40 to-cyan/20" },
  { label: "Pay Bills", iconName: "credit-card", href: "https://www.comptoncity.org/departments/finance", color: "from-emerald/40 to-emerald/20", external: true },
  { label: "Report Issue", iconName: "wrench", href: "/city-hall/issues", color: "from-coral/40 to-coral/20" },
  { label: "Officials", iconName: "gavel", href: "/officials", color: "from-emerald/40 to-emerald/20" },
  { label: "Contact Us", iconName: "phone", href: "/city-hall/departments", color: "from-hc-purple/40 to-hc-purple/20" },
];

export default async function CityHallPage() {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  const [
    { data: departments },
    { data: officialPosts },
    { data: cityEvents },
    { data: councilMembers },
  ] = await Promise.all([
    supabase
      .from("city_departments")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("posts")
      .select("*, author:profiles!posts_author_id_fkey(id, display_name, handle, avatar_url, role, verification_status)")
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
    supabase
      .from("profiles")
      .select("id, display_name, handle, avatar_url, bio, district, verification_status")
      .eq("role", "city_official")
      .eq("verification_status", "verified")
      .in("handle", ["mayor_sharif", "council_duhart", "council_spicer", "council_bowers", "council_darden"])
      .order("display_name"),
  ]);

  const depts = (departments ?? []) as Department[];
  const posts = (officialPosts ?? []) as Post[];
  const events = (cityEvents ?? []) as CityEvent[];

  return (
    <div className="culture-surface min-h-dvh animate-fade-in">
      {/* Hero Section */}
      <section
        className="px-[18px] pt-5 pb-5"
        style={{ borderBottom: "3px solid var(--rule-strong-c)" }}
      >
        <div className="c-kicker" style={{ opacity: 0.65 }}>§ VOL·01 · ISSUE CIVIC · CITY OF COMPTON</div>
        <h1 className="c-hero mt-2" style={{ fontSize: 52, lineHeight: 0.9 }}>City Hall.</h1>
        <p className="c-serif-it mt-2" style={{ fontSize: 13 }}>
          Your digital gateway to Compton city government services. Serving the Culture since 1888.
        </p>
      </section>

      {/* Quick Links Grid */}
      <section className="px-5 mb-8">
        <SectionHeader title="Quick Links" compact />
        <div className="grid grid-cols-3 gap-3 stagger">
          {quickLinks.map((link) => {
            const inner = (
              <div className="flex flex-col items-center gap-2 py-3 press group">
                <div
                  className="w-[50px] h-[50px] flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
                  style={{
                    background: "var(--paper-warm)",
                    border: "2px solid var(--rule-strong-c)",
                  }}
                >
                  <Icon name={link.iconName} size={20} />
                </div>
                <span
                  className="c-meta text-center leading-tight"
                  style={{ fontSize: 10, color: "var(--ink-strong)" }}
                >
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

      {/* City Council Members */}
      {councilMembers && councilMembers.length > 0 && (
        <section className="px-5 mb-8">
          <EditorialHeader kicker="YOUR GOVERNMENT" title="City Council" subtitle="Your elected representatives" />
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
            {councilMembers.map((member) => (
              <Link
                key={member.id}
                href={`/user/${member.handle}`}
                className="shrink-0 w-[160px] press"
              >
                <div
                  className="c-frame overflow-hidden transition-all"
                  style={{ background: "var(--paper-warm)" }}
                >
                  {/* Avatar */}
                  <div className="relative h-[100px]" style={{ background: "var(--paper-soft)" }}>
                    {member.avatar_url && (
                      <img
                        src={member.avatar_url}
                        alt={member.display_name}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    )}
                    {/* Verified badge */}
                    <div
                      className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: "var(--gold-c)", border: "1.5px solid var(--ink-strong)" }}
                    >
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="var(--ink-strong)">
                        <path d="M6 0L7.5 2.5L10.5 1.5L10 4.5L12 6L10 7.5L10.5 10.5L7.5 9.5L6 12L4.5 9.5L1.5 10.5L2 7.5L0 6L2 4.5L1.5 1.5L4.5 2.5Z" />
                      </svg>
                    </div>
                  </div>
                  <div className="p-3 pt-2">
                    <p className="c-card-t text-[12px] leading-tight mb-0.5 truncate">
                      {member.display_name}
                    </p>
                    <p className="c-meta" style={{ fontSize: 10, color: "var(--gold-c)" }}>
                      {member.display_name.includes("Mayor") ? "Mayor — At-Large" : `District ${member.district}`}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* School Board / CUSD Section */}
      <section className="px-5 mb-8">
        <EditorialHeader kicker="COMPTON UNIFIED" title="School Board" subtitle="CUSD Board of Trustees" />
        <Link href="/officials?tab=school_board" className="block press">
          <Card hover>
            <div className="flex items-center gap-3.5">
              <div
                className="w-12 h-12 flex items-center justify-center shrink-0"
                style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)" }}
              >
                <Icon name="graduation" size={22} style={{ color: "var(--ink-strong)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="c-card-t text-[14px] leading-snug">
                  CUSD Board of Trustees
                </h3>
                <p className="c-body text-[11px] leading-relaxed mt-0.5">
                  View trustee profiles, votes, and accountability scores
                </p>
              </div>
              <Icon name="chevron-right" size={14} style={{ color: "var(--ink-strong)", opacity: 0.5 }} />
            </div>
          </Card>
        </Link>
        <div className="mt-3">
          <Link href="/officials" className="c-btn c-btn-outline c-btn-sm">
            View All Officials &amp; Accountability
            <Icon name="chevron-right" size={12} />
          </Link>
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
            <div className="text-center mt-4">
              <Link href="/city-hall/departments" className="c-btn c-btn-outline c-btn-sm">
                View All {depts.length} Departments
              </Link>
            </div>
          )}
        </section>
      )}

      <div className="divider-subtle mx-5 mb-8" />

      {/* City News — Posts from City Officials */}
      {posts.length > 0 && (
        <section className="px-5 mb-8">
          <EditorialHeader kicker="LATEST UPDATES" title="City News" />
          <div className="space-y-3 stagger">
            {posts.map((post) => {
              const badge = post.author?.role ? ROLE_BADGE_MAP[post.author.role] : null;
              return (
                <Card key={post.id} hover>
                  <div className="flex items-center gap-3 mb-2.5">
                    <div
                      className="w-9 h-9 rounded-full overflow-hidden relative"
                      style={{ border: "1.5px solid var(--rule-strong-c)" }}
                    >
                      {post.author?.avatar_url ? (
                        <Image
                          src={post.author.avatar_url}
                          alt={post.author.display_name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center text-[11px] font-bold"
                          style={{ background: "var(--paper-soft)", color: "var(--gold-c)" }}
                        >
                          {post.author?.display_name?.split(" ").map((w) => w[0]).join("").slice(0, 2) ?? "?"}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="c-card-t text-[13px]">{post.author?.display_name ?? "City Official"}</p>
                        {badge && <Badge label={badge.label} variant={badge.variant} />}
                      </div>
                      <p className="c-meta" style={{ fontSize: 10 }}>{timeAgo(post.created_at)}</p>
                    </div>
                  </div>
                  <p className="c-body text-[12px] leading-relaxed line-clamp-3">
                    {post.body}
                  </p>
                  <div
                    className="flex items-center gap-4 mt-2.5 pt-2.5"
                    style={{ borderTop: "1.5px solid var(--rule-strong-c)" }}
                  >
                    <span className="c-meta flex items-center gap-1" style={{ fontSize: 11 }}>
                      {post.comment_count > 0 && <><Icon name="chat" size={12} /> {post.comment_count}</>}
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
                    <div
                      className="w-11 h-14 flex flex-col items-center justify-center shrink-0"
                      style={{
                        background: "var(--paper-warm)",
                        border: "2px solid var(--rule-strong-c)",
                      }}
                    >
                      <p
                        className="c-kicker leading-none"
                        style={{ fontSize: 9, color: "var(--gold-c)" }}
                      >
                        {new Date(event.start_date).toLocaleDateString("en-US", { month: "short" })}
                      </p>
                      <p
                        className="text-base font-bold leading-none mt-0.5"
                        style={{ color: "var(--ink-strong)" }}
                      >
                        {new Date(event.start_date).getDate()}
                      </p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="c-card-t text-[13px] truncate">{event.title}</p>
                      {event.location_name && (
                        <p className="c-meta truncate flex items-center gap-1" style={{ fontSize: 11 }}>
                          <Icon name="pin" size={11} /> {event.location_name}
                        </p>
                      )}
                      {event.start_time && (
                        <p className="c-meta mt-0.5 flex items-center gap-1" style={{ fontSize: 10 }}>
                          <Icon name="clock" size={11} /> {event.start_time}
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
        <div
          className="relative overflow-hidden p-5 c-frame-strong"
          style={{ background: "var(--paper-warm)" }}
        >
          <div className="relative text-center">
            <span className="block mb-2"><Icon name="globe" size={28} /></span>
            <h3 className="c-card-t mb-1">Visit comptoncity.org</h3>
            <p
              className="c-body text-[12px] leading-relaxed mb-4 max-w-[280px] mx-auto"
            >
              For full city services, agendas, and official documents, visit the City of Compton website.
            </p>
            <a
              href="https://www.comptoncity.org"
              target="_blank"
              rel="noopener noreferrer"
              className="c-btn c-btn-primary c-btn-sm"
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
