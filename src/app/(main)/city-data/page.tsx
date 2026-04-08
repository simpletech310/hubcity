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
  title: "City Data - Hub City",
  description: "Compton at a glance: weather, air quality, alerts, and community data.",
};

const EMERGENCY_CONTACTS = [
  { label: "Emergency", number: "911", icon: "shield" as IconName, color: "text-red-400", bg: "bg-red-500/10" },
  { label: "Compton Station", number: "(310) 605-6500", icon: "phone" as IconName, color: "text-cyan", bg: "bg-cyan/10" },
  { label: "City Services", number: "(310) 605-5500", icon: "landmark" as IconName, color: "text-gold", bg: "bg-gold/10" },
  { label: "Code Enforcement", number: "(310) 605-5577", icon: "gavel" as IconName, color: "text-hc-purple", bg: "bg-hc-purple/10" },
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
    <div className="min-h-screen bg-midnight text-white pb-28">
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gold/8 via-midnight to-midnight" />
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
        <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-gold/5 blur-3xl" />
        <div className="relative z-10 px-5 pt-6 pb-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-gold/15 flex items-center justify-center">
              <Icon name="chart" size={18} className="text-gold" />
            </div>
            <div>
              <h1 className="font-heading text-[20px] font-bold text-white">City at a Glance</h1>
            </div>
          </div>
          <p className="text-[12px] text-white/40 ml-10">Real-time data for Compton, CA</p>
        </div>
      </div>

      <div className="px-5 space-y-5">
        {/* Alert Banner */}
        {alerts && alerts.length > 0 && (
          <AlertBanner alerts={alerts as CityAlert[]} />
        )}

        {/* Weather Section */}
        <WeatherWidget />

        {/* Community Stats */}
        <div>
          <p className="text-[10px] text-white/40 font-semibold uppercase tracking-wider mb-3">Community Pulse</p>
          <div className="grid grid-cols-4 gap-2">
            <div className="rounded-xl bg-gradient-to-br from-gold/8 to-gold/3 border border-gold/15 p-3 text-center">
              <p className="text-[18px] font-heading font-bold text-gold">{issuesCount ?? 0}</p>
              <p className="text-[9px] text-white/40 font-medium leading-tight">Open Issues</p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-emerald/8 to-emerald/3 border border-emerald/15 p-3 text-center">
              <p className="text-[18px] font-heading font-bold text-emerald">{resolutionRate}%</p>
              <p className="text-[9px] text-white/40 font-medium leading-tight">Resolved</p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-cyan/8 to-cyan/3 border border-cyan/15 p-3 text-center">
              <p className="text-[18px] font-heading font-bold text-cyan">{eventsCount ?? 0}</p>
              <p className="text-[9px] text-white/40 font-medium leading-tight">Events</p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-hc-purple/8 to-hc-purple/3 border border-hc-purple/15 p-3 text-center">
              <p className="text-[18px] font-heading font-bold text-hc-purple">4</p>
              <p className="text-[9px] text-white/40 font-medium leading-tight">Districts</p>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <p className="text-[10px] text-white/40 font-semibold uppercase tracking-wider mb-3">Explore</p>
          <div className="grid grid-cols-2 gap-3">
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-2xl bg-gradient-to-br ${link.color} border ${link.border} p-4 press hover:scale-[1.02] transition-all`}
              >
                <div className={`w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center mb-2.5`}>
                  <Icon name={link.icon} size={18} className={link.iconColor} />
                </div>
                <p className="font-heading text-[13px] font-bold text-white mb-0.5">{link.label}</p>
                <p className="text-[10px] text-white/40 leading-snug">{link.desc}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Emergency Contacts */}
        <div>
          <p className="text-[10px] text-white/40 font-semibold uppercase tracking-wider mb-3">Emergency Contacts</p>
          <div className="glass-card-elevated rounded-2xl divide-y divide-white/[0.04]">
            {EMERGENCY_CONTACTS.map((contact) => (
              <a
                key={contact.label}
                href={`tel:${contact.number.replace(/[^0-9]/g, "")}`}
                className="flex items-center gap-3 px-4 py-3.5 press hover:bg-white/[0.02] transition-colors"
              >
                <div className={`w-9 h-9 rounded-xl ${contact.bg} flex items-center justify-center shrink-0`}>
                  <Icon name={contact.icon} size={16} className={contact.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-white">{contact.label}</p>
                  <p className="text-[11px] text-white/40">{contact.number}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/[0.04] flex items-center justify-center shrink-0">
                  <Icon name="phone" size={14} className="text-white/30" />
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* City Info Footer */}
        <div className="rounded-2xl bg-white/[0.02] border border-white/[0.04] p-5 text-center">
          <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center mx-auto mb-3">
            <Icon name="landmark" size={20} className="text-gold" />
          </div>
          <p className="font-heading text-[14px] font-bold text-white mb-1">City of Compton</p>
          <p className="text-[11px] text-white/40 mb-3 leading-relaxed">
            Population 97,000+ &bull; 4 Council Districts &bull; 10.1 sq mi
          </p>
          <div className="flex justify-center gap-2">
            <Link href="/city-hall" className="inline-flex items-center gap-1.5 text-[11px] font-medium text-gold bg-gold/10 rounded-full px-3 py-1.5 press">
              <Icon name="landmark" size={12} className="text-gold" />
              City Hall
            </Link>
            <Link href="/events" className="inline-flex items-center gap-1.5 text-[11px] font-medium text-cyan bg-cyan/10 rounded-full px-3 py-1.5 press">
              <Icon name="calendar" size={12} className="text-cyan" />
              Events
            </Link>
            <Link href="/resources" className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald bg-emerald/10 rounded-full px-3 py-1.5 press">
              <Icon name="heart-pulse" size={12} className="text-emerald" />
              Resources
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
