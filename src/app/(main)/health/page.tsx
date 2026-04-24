"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import EmergencyBanner from "@/components/health/EmergencyBanner";
import Icon from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";
import { createClient } from "@/lib/supabase/client";
import { useActiveCity } from "@/hooks/useActiveCity";
import type { HealthResource, HealthCategory } from "@/types/database";

// ─── Config ────────────────────────────────────────
const categories: { label: string; value: HealthCategory | "all"; icon: IconName; color: string }[] = [
  { label: "All", value: "all", icon: "first-aid", color: "#F2A900" },
  { label: "Clinic", value: "clinic", icon: "stethoscope", color: "#3B82F6" },
  { label: "Hospital", value: "hospital", icon: "first-aid", color: "#EF4444" },
  { label: "Mental Health", value: "mental_health", icon: "brain", color: "#8B5CF6" },
  { label: "Dental", value: "dental", icon: "tooth", color: "#06B6D4" },
  { label: "Vision", value: "vision", icon: "eye", color: "#22C55E" },
  { label: "Pharmacy", value: "pharmacy", icon: "pill", color: "#EC4899" },
  { label: "Emergency", value: "emergency", icon: "alert", color: "#EF4444" },
  { label: "Substance", value: "substance_abuse", icon: "heart-pulse", color: "#22C55E" },
  { label: "Prenatal", value: "prenatal", icon: "baby", color: "#F472B6" },
  { label: "Pediatric", value: "pediatric", icon: "baby", color: "#60A5FA" },
  { label: "Senior", value: "senior_care", icon: "elder", color: "#D97706" },
  { label: "Insurance", value: "insurance_help", icon: "document", color: "#6366F1" },
];

const categoryColors: Record<string, string> = {
  clinic: "#3B82F6", hospital: "#EF4444", mental_health: "#8B5CF6", dental: "#06B6D4",
  vision: "#22C55E", pharmacy: "#EC4899", emergency: "#EF4444", substance_abuse: "#22C55E",
  prenatal: "#F472B6", pediatric: "#60A5FA", senior_care: "#D97706", insurance_help: "#6366F1",
};

const categoryLabels: Record<string, string> = {
  clinic: "Clinic", hospital: "Hospital", mental_health: "Mental Health", dental: "Dental",
  vision: "Vision", pharmacy: "Pharmacy", emergency: "Emergency", substance_abuse: "Substance Abuse",
  prenatal: "Prenatal", pediatric: "Pediatric", senior_care: "Senior Care", insurance_help: "Insurance Help",
};

type FilterTag = "free" | "medicaid" | "walkins";

// ─── Wellness Activities (hardcoded community data) ─
const wellnessActivities: { name: string; tagline: string; description: string; icon: IconName; color: string; schedule: string; location: string; type: string }[] = [
  {
    name: "Compton Run Club",
    tagline: "Every Saturday at 7 AM",
    description: "Free weekly community run/walk through Compton. All levels welcome — from first-timers to marathon runners.",
    icon: "trending",
    color: "#22C55E",
    schedule: "Saturdays 7:00 AM",
    location: "Wilson Park, Compton",
    type: "recurring",
  },
  {
    name: "Yoga in the Park",
    tagline: "Free outdoor yoga sessions",
    description: "Beginner-friendly yoga class every Sunday morning. Bring a mat or towel — we provide the good vibes.",
    icon: "heart-pulse",
    color: "#8B5CF6",
    schedule: "Sundays 8:00 AM",
    location: "Gonzales Park, Compton",
    type: "recurring",
  },
  {
    name: "Compton Boxing Club",
    tagline: "Train like a champion",
    description: "Free boxing training for youth and adults. Build confidence, discipline, and fitness.",
    icon: "trophy",
    color: "#EF4444",
    schedule: "Mon/Wed/Fri 5:00 PM",
    location: "Compton Community Center",
    type: "recurring",
  },
  {
    name: "Seniors Walk & Talk",
    tagline: "Move your body, feed your soul",
    description: "Gentle walking group for seniors. Social connection and light exercise in a supportive environment.",
    icon: "elder",
    color: "#D97706",
    schedule: "Tuesdays 9:00 AM",
    location: "Lueders Park, Compton",
    type: "recurring",
  },
];

const upcomingHealthEvents: { id: string; title: string; date: string; time: string; location: string; icon: IconName; color: string; type: string; description: string }[] = [
  {
    id: "blood-drive-spring",
    title: "Spring Community Blood Drive",
    date: "2026-04-12",
    time: "9:00 AM - 3:00 PM",
    location: "Compton City Hall",
    icon: "heart-pulse",
    color: "#EF4444",
    type: "blood_drive",
    description: "Give the gift of life. Walk-ins welcome, appointments preferred. Free snacks and a t-shirt for all donors.",
  },
  {
    id: "health-fair-2026",
    title: "Compton Health & Wellness Fair",
    date: "2026-04-19",
    time: "10:00 AM - 4:00 PM",
    location: "Compton College",
    icon: "first-aid",
    color: "#3B82F6",
    type: "health_fair",
    description: "Free screenings, dental checkups, vision tests, mental health resources, and family activities.",
  },
  {
    id: "5k-run-spring",
    title: "Compton Strong 5K Run/Walk",
    date: "2026-04-26",
    time: "7:00 AM",
    location: "Wilson Park → City Hall",
    icon: "trophy",
    color: "#22C55E",
    type: "fitness",
    description: "Annual community 5K through historic Compton. All ages and abilities. Finisher medals for everyone!",
  },
  {
    id: "mental-health-workshop",
    title: "Mental Wellness Workshop",
    date: "2026-05-03",
    time: "2:00 PM - 4:00 PM",
    location: "Compton Library",
    icon: "brain",
    color: "#8B5CF6",
    type: "mental_health",
    description: "Free workshop on stress management, mindfulness, and community support resources.",
  },
  {
    id: "vaccination-clinic",
    title: "Free Vaccination Clinic",
    date: "2026-05-10",
    time: "10:00 AM - 2:00 PM",
    location: "MLK Jr Community Hospital",
    icon: "stethoscope",
    color: "#06B6D4",
    type: "clinic",
    description: "Flu shots, COVID boosters, and routine vaccinations. No insurance needed. All ages welcome.",
  },
];

const fitnessSpots: { name: string; type: string; icon: IconName; features: string[]; color: string }[] = [
  { name: "Wilson Park", type: "Park", icon: "tree", features: ["Track", "Basketball", "Playground"], color: "#22C55E" },
  { name: "Gonzales Park", type: "Park", icon: "tree", features: ["Walking Path", "Open Field", "Benches"], color: "#15803D" },
  { name: "Lueders Park", type: "Park", icon: "navigation", features: ["Walking Trail", "Picnic Area"], color: "#059669" },
  { name: "Compton Par Course", type: "Fitness", icon: "trending", features: ["Outdoor Gym", "Pull-Up Bars", "Dip Bars"], color: "#D97706" },
];

const wellnessTips: { tip: string; icon: IconName; color: string }[] = [
  { tip: "Walk 30 minutes a day to reduce heart disease risk by 35%", icon: "trending", color: "#22C55E" },
  { tip: "Drink 8 glasses of water daily — your body is 60% water", icon: "heart-pulse", color: "#3B82F6" },
  { tip: "Get 7-9 hours of sleep for optimal mental health", icon: "moon", color: "#8B5CF6" },
  { tip: "Eat 5 servings of fruits & veggies every day", icon: "apple", color: "#15803D" },
];

// ─── Components ────────────────────────────────────
function HealthResourceCard({ resource }: { resource: HealthResource }) {
  const color = categoryColors[resource.category] || "#3B82F6";
  return (
    <Link href={`/health/${resource.slug}`} className="block press">
      <div
        className="bg-card rounded-2xl border border-border-subtle overflow-hidden transition-all hover:border-white/10"
        style={{ borderLeftWidth: 3, borderLeftColor: color }}
      >
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${color}12` }}
              >
                <Icon name={categories.find(c => c.value === resource.category)?.icon || "first-aid"} size={18} />
              </div>
              <div className="min-w-0">
                <h3 className="font-heading font-bold text-[13px] mb-0.5 line-clamp-1">{resource.name}</h3>
                {resource.organization && (
                  <p className="text-[11px] text-white/40">{resource.organization}</p>
                )}
              </div>
            </div>
            {resource.is_emergency && (
              <span className="inline-flex items-center gap-1 bg-coral/15 border border-coral/20 rounded-full px-2 py-0.5 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-coral animate-pulse" />
                <span className="text-[9px] font-semibold text-coral uppercase">ER</span>
              </span>
            )}
          </div>

          {resource.address && (
            <p className="text-[11px] text-white/30 mb-2 line-clamp-1">{resource.address}</p>
          )}

          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-1.5">
              <span className="text-[9px] font-semibold rounded-full px-2 py-0.5" style={{ background: `${color}12`, color }}>
                {categoryLabels[resource.category] || resource.category}
              </span>
              {resource.is_free && (
                <span className="text-[9px] font-semibold text-emerald bg-emerald/10 rounded-full px-2 py-0.5">Free</span>
              )}
              {resource.accepts_medi_cal && (
                <span className="text-[9px] font-semibold text-cyan bg-cyan/10 rounded-full px-2 py-0.5">Medi-Cal</span>
              )}
              {resource.accepts_uninsured && (
                <span className="text-[9px] font-semibold text-gold bg-gold/10 rounded-full px-2 py-0.5">Uninsured OK</span>
              )}
            </div>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/15 shrink-0" strokeLinecap="round">
              <path d="M5 3l4 4-4 4" />
            </svg>
          </div>

          {resource.phone && (
            <div className="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-white/[0.04]">
              <svg width="10" height="10" fill="none" stroke="#F2A900" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07" />
              </svg>
              <p className="text-[11px] text-gold font-semibold">{resource.phone}</p>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── Main Page ─────────────────────────────────────
export default function HealthPage() {
  const activeCity = useActiveCity();
  const [activeCategory, setActiveCategory] = useState<HealthCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<Set<FilterTag>>(new Set());
  const [resources, setResources] = useState<HealthResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbEvents, setDbEvents] = useState<Array<{ id: string; title: string; start_date: string; start_time: string | null; location_name: string | null; category: string }>>([]);

  useEffect(() => {
    async function fetchResources() {
      setLoading(true);
      const supabase = createClient();
      let query = supabase
        .from("health_resources")
        .select("*")
        .eq("is_published", true)
        .order("is_emergency", { ascending: false })
        .order("name", { ascending: true });

      if (activeCity?.id) {
        query = query.eq("city_id", activeCity.id);
      }

      if (activeCategory !== "all") {
        query = query.eq("category", activeCategory);
      }

      const { data } = await query;
      setResources((data as HealthResource[]) ?? []);
      setLoading(false);
    }
    fetchResources();
  }, [activeCategory, activeCity?.id]);

  // Fetch health-related events from DB
  useEffect(() => {
    async function fetchHealthEvents() {
      const supabase = createClient();
      const today = new Date().toISOString().split("T")[0];
      let query = supabase
        .from("events")
        .select("id, title, start_date, start_time, location_name, category")
        .eq("is_published", true)
        .gte("start_date", today)
        .or("title.ilike.%health%,title.ilike.%wellness%,title.ilike.%clinic%,title.ilike.%vaccination%,title.ilike.%screening%,title.ilike.%medical%,title.ilike.%blood%,title.ilike.%run%,title.ilike.%fitness%,title.ilike.%walk%,title.ilike.%yoga%")
        .order("start_date")
        .limit(6);

      if (activeCity?.id) {
        query = query.eq("city_id", activeCity.id);
      }

      const { data } = await query;
      setDbEvents(data ?? []);
    }
    fetchHealthEvents();
  }, [activeCity?.id]);

  const filteredResources = useMemo(() => {
    let result = resources;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.organization?.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q)
      );
    }
    if (activeFilters.has("free")) result = result.filter((r) => r.is_free);
    if (activeFilters.has("medicaid")) result = result.filter((r) => r.accepts_medi_cal);
    return result;
  }, [resources, searchQuery, activeFilters]);

  function toggleFilter(f: FilterTag) {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(f)) next.delete(f); else next.add(f);
      return next;
    });
  }

  function formatEventDate(dateStr: string) {
    const d = new Date(dateStr + "T00:00:00");
    return { month: d.toLocaleDateString("en-US", { month: "short" }), day: d.getDate() };
  }

  const freeCount = resources.filter(r => r.is_free).length;
  const emergencyCount = resources.filter(r => r.is_emergency).length;

  return (
    <div className="culture-surface min-h-dvh animate-fade-in pb-safe">
      <div
        className="px-[18px] pt-5 pb-4"
        style={{ borderBottom: "3px solid var(--rule-strong-c)" }}
      >
        <div className="c-kicker" style={{ opacity: 0.65 }}>
          § VOL·01 · ISSUE HEALTH · {activeCity?.name?.toUpperCase() ?? "EVERYWHERE"}
        </div>
        <h1
          className="c-hero mt-2"
          style={{ fontSize: 56, lineHeight: 0.88, letterSpacing: "-0.02em" }}
        >
          Health.
        </h1>
        <p className="c-serif-it mt-2" style={{ fontSize: 13 }}>
          Care, fitness &amp; resources for {activeCity?.name ?? "your city"}.
        </p>
      </div>

      {/* ─── Stats Strip ─── */}
      <div className="px-5 -mt-3 mb-5 relative z-10">
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Resources", value: resources.length.toString() },
            { label: "Free", value: freeCount.toString() },
            { label: "Events", value: (upcomingHealthEvents.length + dbEvents.length).toString() },
            { label: "Emergency", value: emergencyCount.toString() },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl panel-editorial p-2.5 text-center">
              <p className="font-display text-[20px] leading-none text-gold tabular-nums">{stat.value}</p>
              <p className="text-[9px] text-ivory/45 uppercase tracking-editorial-tight font-semibold mt-1.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Emergency Banner ─── */}
      <EmergencyBanner />

      {/* ─── Wellness Tip Banner ─── */}
      <div className="px-5 mb-5">
        {(() => {
          const tip = wellnessTips[new Date().getDay() % wellnessTips.length];
          return (
            <div className="rounded-2xl panel-editorial p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl border border-gold/20 bg-ink flex items-center justify-center shrink-0">
                <Icon name={tip.icon} size={18} className="text-gold" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-gold uppercase tracking-editorial font-bold mb-0.5">Daily Wellness Tip</p>
                <p className="text-[12px] text-ivory/70 leading-relaxed">{tip.tip}</p>
              </div>
            </div>
          );
        })()}
      </div>

      {/* ─── Community Fitness & Activities ─── */}
      <section className="mb-6">
        <div className="px-5 mb-3">
          <div className="flex items-baseline gap-3">
            <span className="font-display text-gold text-[22px] leading-none tabular-nums">
              № 01
            </span>
            <span className="text-[10px] font-bold tracking-editorial uppercase text-white/50">
              Community Fitness
            </span>
            <span className="ml-auto rule-hairline flex-1 self-center" />
          </div>
          <p className="text-[11px] text-ivory/40 mt-1">Free weekly activities for everyone</p>
        </div>
        <div className="flex gap-3 px-5 overflow-x-auto scrollbar-hide pb-2">
          {wellnessActivities.map((activity) => (
            <div
              key={activity.name}
              className="shrink-0 w-[240px] rounded-2xl panel-editorial overflow-hidden press hover:border-gold/30 transition-colors"
            >
              <div className="p-4 h-full">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-10 h-10 rounded-xl border border-gold/20 bg-ink flex items-center justify-center shrink-0">
                    <Icon name={activity.icon} size={18} className="text-gold" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display text-[16px] leading-tight text-white truncate">{activity.name}</h3>
                    <p className="text-[10px] font-bold uppercase tracking-editorial-tight text-gold/80 truncate">{activity.tagline}</p>
                  </div>
                </div>
                <p className="text-[11px] text-ivory/55 leading-relaxed mb-3 line-clamp-2">{activity.description}</p>
                <div className="flex items-center gap-3 text-[10px] text-ivory/50">
                  <span className="flex items-center gap-1">
                    <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-gold"><circle cx="5" cy="5" r="4"/><path d="M5 3v2l1.5 1"/></svg>
                    {activity.schedule}
                  </span>
                </div>
                <p className="text-[10px] text-ivory/40 mt-1">{activity.location}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Upcoming Health Events ─── */}
      <section className="px-5 mb-6">
        <div className="flex items-start justify-between mb-3 gap-3">
          <div className="min-w-0">
            <div className="flex items-baseline gap-3">
              <span className="font-display text-gold text-[22px] leading-none tabular-nums">
                № 02
              </span>
              <span className="text-[10px] font-bold tracking-editorial uppercase text-white/50">
                Health Events
              </span>
            </div>
            <p className="text-[11px] text-ivory/40 mt-1">Blood drives, fairs, runs &amp; more</p>
          </div>
          <Link href="/events" className="shrink-0 text-[10px] font-bold tracking-editorial-tight uppercase text-gold press">All Events →</Link>
        </div>

        <div className="space-y-2.5 stagger">
          {upcomingHealthEvents.map((event) => {
            const { month, day } = formatEventDate(event.date);
            return (
              <div
                key={event.id}
                className="rounded-2xl panel-editorial overflow-hidden transition-colors hover:border-gold/25"
              >
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Editorial date block */}
                    <div className="w-12 h-14 rounded-xl border border-gold/20 flex flex-col items-center justify-center shrink-0 bg-ink">
                      <p className="text-[9px] font-bold uppercase tracking-editorial-tight leading-none text-gold">{month}</p>
                      <p className="font-display text-[20px] leading-none mt-1 text-white tabular-nums">{day}</p>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon name={event.icon} size={14} className="text-gold" />
                        <h3 className="font-display text-[16px] leading-tight text-white truncate">{event.title}</h3>
                      </div>
                      <p className="text-[11px] text-ivory/55 line-clamp-2 mb-2">{event.description}</p>
                      <div className="flex items-center gap-3 text-[10px] text-ivory/40">
                        <span>{event.time}</span>
                        <span>{event.location}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* DB events */}
          {dbEvents.map((event) => {
            const { month, day } = formatEventDate(event.start_date);
            return (
              <Link key={event.id} href={`/events/${event.id}`} className="block press">
                <div className="rounded-2xl panel-editorial p-4 hover:border-gold/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-14 rounded-xl border border-gold/20 flex flex-col items-center justify-center shrink-0 bg-ink">
                      <p className="text-[9px] text-gold font-bold uppercase tracking-editorial-tight leading-none">{month}</p>
                      <p className="font-display text-[20px] leading-none mt-1 text-white tabular-nums">{day}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-[16px] leading-tight text-white truncate">{event.title}</p>
                      {event.location_name && <p className="text-[11px] text-ivory/45 truncate mt-0.5">{event.location_name}</p>}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ─── Outdoor Fitness Spots ─── */}
      <section className="px-5 mb-6">
        <div className="flex items-baseline gap-3 mb-3">
          <span className="font-display text-gold text-[22px] leading-none tabular-nums">
            № 03
          </span>
          <span className="text-[10px] font-bold tracking-editorial uppercase text-white/50">
            Outdoor Fitness Spots
          </span>
          <span className="ml-auto rule-hairline flex-1 self-center" />
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {fitnessSpots.map((spot) => (
            <div
              key={spot.name}
              className="rounded-xl panel-editorial p-3.5 press hover:border-gold/30 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-9 h-9 rounded-lg border border-gold/20 bg-ink flex items-center justify-center">
                  <Icon name={spot.icon} size={16} className="text-gold" />
                </div>
                <div className="min-w-0">
                  <p className="font-display text-[14px] leading-tight text-white truncate">{spot.name}</p>
                  <p className="text-[9px] text-ivory/45 uppercase tracking-editorial-tight font-semibold">{spot.type}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {spot.features.map((f) => (
                  <span key={f} className="text-[9px] font-semibold uppercase tracking-editorial-tight bg-white/[0.03] text-ivory/55 rounded-full px-2 py-0.5 border border-white/[0.06]">{f}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="divider-subtle mx-5 mb-6" />

      {/* ─── Search ─── */}
      <div className="px-5 mb-4">
        <div className="flex items-baseline gap-3 mb-3">
          <span className="font-display text-gold text-[22px] leading-none tabular-nums">
            № 04
          </span>
          <span className="text-[10px] font-bold tracking-editorial uppercase text-white/50">
            Find Healthcare
          </span>
          <span className="ml-auto rule-hairline flex-1 self-center" />
        </div>
        <div className="relative">
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" strokeLinecap="round">
            <circle cx="8" cy="8" r="6" />
            <path d="M13 13l3 3" />
          </svg>
          <input
            type="text"
            placeholder="Search clinics, hospitals, services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card border border-border-subtle rounded-xl pl-11 pr-10 py-3 text-sm text-txt-primary placeholder:text-white/20 focus:outline-none focus:border-gold/40 transition-colors"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4l8 8M12 4l-8 8" /></svg>
            </button>
          )}
        </div>
      </div>

      {/* ─── Category Grid ─── */}
      <div className="px-5 mb-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.value;
            return (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(isActive ? "all" : cat.value as HealthCategory | "all")}
                className="flex items-center gap-1.5 shrink-0 rounded-full px-3.5 py-2 text-[11px] font-semibold transition-all press"
                style={{
                  background: isActive ? `${cat.color}20` : "rgba(255,255,255,0.04)",
                  color: isActive ? cat.color : "rgba(255,255,255,0.4)",
                  border: `1px solid ${isActive ? `${cat.color}30` : "rgba(255,255,255,0.06)"}`,
                }}
              >
                <Icon name={cat.icon} size={14} />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Filter Badges ─── */}
      <div className="flex gap-2 px-5 mb-5">
        {([
          { label: "Free Services", value: "free" as FilterTag, color: "#22C55E" },
          { label: "Accepts Medi-Cal", value: "medicaid" as FilterTag, color: "#06B6D4" },
        ]).map((badge) => {
          const isActive = activeFilters.has(badge.value);
          return (
            <button
              key={badge.value}
              onClick={() => toggleFilter(badge.value)}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all press"
              style={{
                background: isActive ? `${badge.color}20` : "rgba(255,255,255,0.04)",
                color: isActive ? badge.color : "rgba(255,255,255,0.35)",
                border: `1px solid ${isActive ? `${badge.color}30` : "rgba(255,255,255,0.06)"}`,
              }}
            >
              {isActive && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              )}
              {badge.label}
            </button>
          );
        })}
      </div>

      {/* ─── Results Header ─── */}
      <div className="flex items-center justify-between px-5 mb-3">
        <span className="text-[11px] text-white/30">{filteredResources.length} healthcare resources</span>
        {activeCategory !== "all" && (
          <button
            onClick={() => setActiveCategory("all")}
            className="flex items-center gap-1 bg-gold/10 rounded-full px-2.5 py-1 border border-gold/20 press"
          >
            <span className="text-[10px] font-medium text-gold">Clear</span>
            <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-gold" strokeLinecap="round"><path d="M3 3l4 4M7 3l-4 4" /></svg>
          </button>
        )}
      </div>

      {/* ─── Resource List ─── */}
      {loading ? (
        <div className="px-5 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-28 rounded-2xl" />
          ))}
        </div>
      ) : (
        <section className="px-5 mb-6">
          <div className="space-y-2.5 stagger">
            {filteredResources.map((resource) => (
              <HealthResourceCard key={resource.id} resource={resource} />
            ))}
            {filteredResources.length === 0 && (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
                  <Icon name="first-aid" size={30} />
                </div>
                <p className="text-sm font-semibold mb-1">No health resources found</p>
                <p className="text-xs text-white/30">Try a different category or search</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ─── Mental Health CTA ─── */}
      <section className="px-5 mb-6">
        <div className="relative overflow-hidden rounded-2xl panel-editorial border-gold/25 p-5">
          <div
            className="absolute inset-0 opacity-[0.05] mix-blend-overlay pointer-events-none"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.9 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.6'/%3E%3C/svg%3E\")",
            }}
          />
          <div className="relative">
            <div className="w-10 h-10 rounded-xl border border-gold/25 bg-ink flex items-center justify-center mb-3">
              <Icon name="brain" size={20} className="text-gold" />
            </div>
            <h3 className="font-display text-[22px] leading-tight text-white mb-1">Mental Health Matters</h3>
            <p className="text-[12px] text-ivory/55 leading-relaxed mb-4 max-w-md">
              It&apos;s okay to not be okay. Free counseling, support groups, and crisis resources are available for all {activeCity?.name ?? "local"} residents.
            </p>
            <div className="flex gap-2">
              <a
                href="tel:988"
                className="inline-flex items-center gap-2 bg-gold text-midnight rounded-full px-4 py-2.5 text-[11px] font-bold uppercase tracking-editorial-tight press"
              >
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07" />
                </svg>
                Call 988
              </a>
              <button
                onClick={() => { setActiveCategory("mental_health"); }}
                className="inline-flex items-center gap-2 bg-transparent text-white rounded-full px-4 py-2.5 text-[11px] font-bold uppercase tracking-editorial-tight press border border-gold/30 hover:bg-gold/10 transition-colors"
              >
                Find Help
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Know Your Numbers ─── */}
      <section className="px-5 mb-6">
        <div className="flex items-baseline gap-3 mb-3">
          <span className="font-display text-gold text-[22px] leading-none tabular-nums">
            № 05
          </span>
          <span className="text-[10px] font-bold tracking-editorial uppercase text-white/50">
            Know Your Numbers
          </span>
          <span className="ml-auto rule-hairline flex-1 self-center" />
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { label: "Blood Pressure", target: "< 120/80", icon: "heart-pulse" as IconName },
            { label: "Blood Sugar", target: "< 100 mg/dL", icon: "pulse" as IconName },
            { label: "BMI", target: "18.5 - 24.9", icon: "chart" as IconName },
            { label: "Cholesterol", target: "< 200 mg/dL", icon: "stethoscope" as IconName },
          ].map((item) => (
            <div key={item.label} className="rounded-xl panel-editorial p-3 text-center">
              <div className="mx-auto w-9 h-9 rounded-lg border border-gold/20 bg-ink flex items-center justify-center mb-2">
                <Icon name={item.icon} size={16} className="text-gold" />
              </div>
              <p className="text-[10px] font-semibold uppercase tracking-editorial-tight text-ivory/55">{item.label}</p>
              <p className="font-display text-[16px] leading-tight text-gold mt-1 tabular-nums">{item.target}</p>
              <p className="text-[9px] text-ivory/35 mt-1 uppercase tracking-editorial-tight">Healthy Range</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Health Hotlines ─── */}
      <section className="px-5 mb-8">
        <div className="flex items-baseline gap-3 mb-3">
          <span className="font-display text-gold text-[22px] leading-none tabular-nums">
            № 06
          </span>
          <span className="text-[10px] font-bold tracking-editorial uppercase text-white/50">
            Health Hotlines
          </span>
          <span className="ml-auto rule-hairline flex-1 self-center" />
        </div>
        <div className="space-y-2">
          {[
            { name: "Suicide & Crisis Lifeline", number: "988" },
            { name: "Poison Control", number: "1-800-222-1222" },
            { name: "SAMHSA Helpline", number: "1-800-662-4357" },
            { name: "Domestic Violence", number: "1-800-799-7233" },
          ].map((line) => (
            <a
              key={line.name}
              href={`tel:${line.number.replace(/-/g, "")}`}
              className="flex items-center gap-3 rounded-xl panel-editorial p-3 press hover:border-gold/30 transition-colors"
            >
              <div className="w-8 h-8 rounded-full border border-coral/25 bg-coral/10 flex items-center justify-center shrink-0">
                <svg width="14" height="14" fill="none" stroke="currentColor" className="text-coral" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-display text-[14px] leading-tight text-white">{line.name}</p>
                <p className="text-[11px] font-bold text-gold tabular-nums">{line.number}</p>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-editorial-tight text-ivory/35">24/7</span>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
