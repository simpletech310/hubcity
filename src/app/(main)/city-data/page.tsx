import { createClient } from "@/lib/supabase/server";
import { WeatherWidget } from "@/components/city-data/WeatherWidget";
import { AlertBanner } from "@/components/city-data/AlertBanner";
import Icon from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";
import Link from "next/link";

interface CityAlert {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  body: string;
  affected_districts: number[];
  starts_at: string;
  expires_at: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
}

export const metadata = {
  title: "City Data - Culture",
  description: "Compton at a glance: weather, air quality, alerts, and community data.",
};

const EMERGENCY_CONTACTS = [
  { label: "Emergency", number: "911", icon: "shield" as IconName, color: "text-red-400", bg: "bg-red-500/10" },
  { label: "Compton Station", number: "(310) 605-6500", icon: "phone" as IconName, color: "text-cyan", bg: "bg-cyan/10" },
  { label: "City Services", number: "(310) 605-5500", icon: "landmark" as IconName, color: "text-gold", bg: "bg-gold/10" },
  { label: "Code Enforcement", number: "(310) 605-5577", icon: "gavel" as IconName, color: "text-gold", bg: "bg-hc-purple/10" },
];

const QUICK_LINKS = [
  { href: "/city-data/transit", label: "Transit & Routes", icon: "transit" as IconName, desc: "Metro, buses & schedules", color: "from-cyan/10 to-cyan/5", border: "border-cyan/15", iconColor: "text-cyan" },
  { href: "/city-data/safety", label: "Community Safety", icon: "shield" as IconName, desc: "Issues & emergency info", color: "from-emerald/10 to-emerald/5", border: "border-emerald/15", iconColor: "text-emerald" },
  { href: "/city-data/meetings", label: "City Meetings", icon: "landmark" as IconName, desc: "Council agendas & minutes", color: "from-hc-blue/10 to-hc-blue/5", border: "border-hc-blue/15", iconColor: "text-hc-blue" },
  { href: "/city-hall/issues", label: "Report an Issue", icon: "megaphone" as IconName, desc: "Potholes, streetlights & more", color: "from-gold/10 to-gold/5", border: "border-gold/15", iconColor: "text-gold" },
];

export default async function CityDataPage() {
  const supabase = await createClient();

  const [
    { data: alerts },
    { count: issuesCount },
    { count: eventsCount },
    { count: resolvedCount },
  ] = await Promise.all([
    supabase
      .from("city_alerts")
      .select("*")
      .eq("is_active", true)
      .or("expires_at.is.null,expires_at.gt.now()")
      .order("created_at", { ascending: false }),
    supabase
      .from("city_issues")
      .select("*", { count: "exact", head: true })
      .eq("status", "open"),
    supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("city_issues")
      .select("*", { count: "exact", head: true })
      .in("status", ["resolved", "closed"]),
  ]);

  const totalIssues = (issuesCount ?? 0) + (resolvedCount ?? 0);
  const resolutionRate = totalIssues > 0 ? Math.round(((resolvedCount ?? 0) / totalIssues) * 100) : 0;

  return (
    <div className="culture-surface min-h-dvh pb-28">
      {/* Hero Header */}
      <div
        className="px-[18px] pt-5 pb-5"
        style={{ borderBottom: "3px solid var(--rule-strong-c)" }}
      >
        <div className="c-kicker" style={{ opacity: 0.65 }}>§ VOL·01 · ISSUE CIVIC · CITY DATA</div>
        <h1 className="c-hero mt-2" style={{ fontSize: 48, lineHeight: 0.9 }}>City at a Glance.</h1>
        <p className="c-serif-it mt-2" style={{ fontSize: 13 }}>
          Real-time data for Compton, CA.
        </p>
      </div>

      <div className="px-5 pt-5 space-y-5">
        {/* Alert Banner */}
        {alerts && alerts.length > 0 && (
          <AlertBanner alerts={alerts as CityAlert[]} />
        )}

        {/* Weather Section */}
        <WeatherWidget />

        {/* Community Stats */}
        <div>
          <p className="c-kicker mb-3" style={{ opacity: 0.65 }}>Community Pulse</p>
          <div className="grid grid-cols-4 gap-2">
            {[
              { value: issuesCount ?? 0, label: "Open Issues", gold: true },
              { value: `${resolutionRate}%`, label: "Resolved" },
              { value: eventsCount ?? 0, label: "Events" },
              { value: 4, label: "Districts", gold: true },
            ].map((stat, i) => (
              <div
                key={i}
                className="c-frame p-3 text-center"
                style={{ background: "var(--paper-warm)" }}
              >
                <p className="c-hero" style={{ fontSize: 20, color: stat.gold ? "var(--gold-c)" : "var(--ink-strong)" }}>{stat.value}</p>
                <p className="c-meta leading-tight" style={{ fontSize: 9 }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <p className="c-kicker mb-3" style={{ opacity: 0.65 }}>Explore</p>
          <div className="grid grid-cols-2 gap-3">
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="c-frame p-4 press hover:scale-[1.02] transition-all"
                style={{ background: "var(--paper)" }}
              >
                <div
                  className="w-9 h-9 flex items-center justify-center mb-2.5"
                  style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)" }}
                >
                  <Icon name={link.icon} size={18} style={{ color: "var(--ink-strong)" }} />
                </div>
                <p className="c-card-t text-[13px] mb-0.5">{link.label}</p>
                <p className="c-body text-[10px] leading-snug">{link.desc}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Emergency Contacts */}
        <div>
          <p className="c-kicker mb-3" style={{ opacity: 0.65 }}>Emergency Contacts</p>
          <div
            className="c-frame"
            style={{ background: "var(--paper)" }}
          >
            {EMERGENCY_CONTACTS.map((contact, i) => (
              <a
                key={contact.label}
                href={`tel:${contact.number.replace(/[^0-9]/g, "")}`}
                className="flex items-center gap-3 px-4 py-3.5 press transition-colors"
                style={i > 0 ? { borderTop: "1.5px solid var(--rule-strong-c)" } : undefined}
              >
                <div
                  className="w-9 h-9 flex items-center justify-center shrink-0"
                  style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)" }}
                >
                  <Icon name={contact.icon} size={16} style={{ color: "var(--ink-strong)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="c-card-t text-[13px]">{contact.label}</p>
                  <p className="c-meta" style={{ fontSize: 11 }}>{contact.number}</p>
                </div>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: "var(--paper-warm)", border: "1.5px solid var(--rule-strong-c)" }}
                >
                  <Icon name="phone" size={14} style={{ color: "var(--ink-strong)" }} />
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* City Info Footer */}
        <div className="c-frame p-5 text-center" style={{ background: "var(--paper-warm)" }}>
          <div
            className="w-10 h-10 flex items-center justify-center mx-auto mb-3"
            style={{ background: "var(--gold-c)", border: "2px solid var(--rule-strong-c)" }}
          >
            <Icon name="landmark" size={20} style={{ color: "var(--ink-strong)" }} />
          </div>
          <p className="c-card-t mb-1">City of Compton</p>
          <p className="c-body text-[11px] mb-3 leading-relaxed">
            Population 97,000+ &bull; 4 Council Districts &bull; 10.1 sq mi
          </p>
          <div className="flex justify-center gap-2 flex-wrap">
            <Link href="/city-hall" className="c-btn c-btn-outline c-btn-sm">
              <Icon name="landmark" size={12} />
              City Hall
            </Link>
            <Link href="/events" className="c-btn c-btn-outline c-btn-sm">
              <Icon name="calendar" size={12} />
              Events
            </Link>
            <Link href="/resources" className="c-btn c-btn-outline c-btn-sm">
              <Icon name="heart-pulse" size={12} />
              Resources
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
