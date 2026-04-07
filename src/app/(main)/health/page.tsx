"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import EditorialHeader from "@/components/ui/EditorialHeader";
import EmergencyBanner from "@/components/health/EmergencyBanner";
import { createClient } from "@/lib/supabase/client";
import type { HealthResource, HealthCategory } from "@/types/database";

// ─── Config ────────────────────────────────────────
const categories: { label: string; value: HealthCategory | "all"; icon: string; color: string }[] = [
  { label: "All", value: "all", icon: "🏥", color: "#F2A900" },
  { label: "Clinic", value: "clinic", icon: "🏥", color: "#3B82F6" },
  { label: "Hospital", value: "hospital", icon: "🏨", color: "#EF4444" },
  { label: "Mental Health", value: "mental_health", icon: "🧠", color: "#8B5CF6" },
  { label: "Dental", value: "dental", icon: "🦷", color: "#06B6D4" },
  { label: "Vision", value: "vision", icon: "👁️", color: "#22C55E" },
  { label: "Pharmacy", value: "pharmacy", icon: "💊", color: "#EC4899" },
  { label: "Emergency", value: "emergency", icon: "🚑", color: "#EF4444" },
  { label: "Substance", value: "substance_abuse", icon: "💚", color: "#22C55E" },
  { label: "Prenatal", value: "prenatal", icon: "🤰", color: "#F472B6" },
  { label: "Pediatric", value: "pediatric", icon: "👶", color: "#60A5FA" },
  { label: "Senior", value: "senior_care", icon: "🧓", color: "#D97706" },
  { label: "Insurance", value: "insurance_help", icon: "📋", color: "#6366F1" },
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
const wellnessActivities = [
  {
    name: "Compton Run Club",
    tagline: "Every Saturday at 7 AM",
    description: "Free weekly community run/walk through Compton. All levels welcome — from first-timers to marathon runners.",
    icon: "🏃",
    color: "#22C55E",
    schedule: "Saturdays 7:00 AM",
    location: "Wilson Park, Compton",
    type: "recurring",
  },
  {
    name: "Yoga in the Park",
    tagline: "Free outdoor yoga sessions",
    description: "Beginner-friendly yoga class every Sunday morning. Bring a mat or towel — we provide the good vibes.",
    icon: "🧘",
    color: "#8B5CF6",
    schedule: "Sundays 8:00 AM",
    location: "Gonzales Park, Compton",
    type: "recurring",
  },
  {
    name: "Compton Boxing Club",
    tagline: "Train like a champion",
    description: "Free boxing training for youth and adults. Build confidence, discipline, and fitness.",
    icon: "🥊",
    color: "#EF4444",
    schedule: "Mon/Wed/Fri 5:00 PM",
    location: "Compton Community Center",
    type: "recurring",
  },
  {
    name: "Seniors Walk & Talk",
    tagline: "Move your body, feed your soul",
    description: "Gentle walking group for seniors. Social connection and light exercise in a supportive environment.",
    icon: "🚶",
    color: "#D97706",
    schedule: "Tuesdays 9:00 AM",
    location: "Lueders Park, Compton",
    type: "recurring",
  },
];

const upcomingHealthEvents = [
  {
    id: "blood-drive-spring",
    title: "Spring Community Blood Drive",
    date: "2026-04-12",
    time: "9:00 AM - 3:00 PM",
    location: "Compton City Hall",
    icon: "🩸",
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
    icon: "🏥",
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
    icon: "🏅",
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
    icon: "🧠",
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
    icon: "💉",
    color: "#06B6D4",
    type: "clinic",
    description: "Flu shots, COVID boosters, and routine vaccinations. No insurance needed. All ages welcome.",
  },
];

const fitnessSpots = [
  { name: "Wilson Park", type: "Park", icon: "🌳", features: ["Track", "Basketball", "Playground"], color: "#22C55E" },
  { name: "Gonzales Park", type: "Park", icon: "🌿", features: ["Walking Path", "Open Field", "Benches"], color: "#15803D" },
  { name: "Lueders Park", type: "Park", icon: "🏞️", features: ["Walking Trail", "Picnic Area"], color: "#059669" },
  { name: "Compton Par Course", type: "Fitness", icon: "💪", features: ["Outdoor Gym", "Pull-Up Bars", "Dip Bars"], color: "#D97706" },
];

const wellnessTips = [
  { tip: "Walk 30 minutes a day to reduce heart disease risk by 35%", icon: "🚶", color: "#22C55E" },
  { tip: "Drink 8 glasses of water daily — your body is 60% water", icon: "💧", color: "#3B82F6" },
  { tip: "Get 7-9 hours of sleep for optimal mental health", icon: "😴", color: "#8B5CF6" },
  { tip: "Eat 5 servings of fruits & veggies every day", icon: "🥗", color: "#15803D" },
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
                <span className="text-lg">{categories.find(c => c.value === resource.category)?.icon || "🏥"}</span>
              </div>
              <div className="min-w-0">
                <h3 className="font-heading font-bold text-[13px] mb-0.5 line-clamp-1">{resource.name}</h3>
                {resource.organization && (
                  <p className="text-[11px] text-white/40">{resource.organization}</p>
                )}
              </div>
            </div>
            {resource.is_emergency && (
              <span className="inline-flex items-center gap-1 bg-compton-red/15 border border-compton-red/20 rounded-full px-2 py-0.5 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-compton-red animate-pulse" />
                <span className="text-[9px] font-semibold text-compton-red uppercase">ER</span>
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

      if (activeCategory !== "all") {
        query = query.eq("category", activeCategory);
      }

      const { data } = await query;
      setResources((data as HealthResource[]) ?? []);
      setLoading(false);
    }
    fetchResources();
  }, [activeCategory]);

  // Fetch health-related events from DB
  useEffect(() => {
    async function fetchHealthEvents() {
      const supabase = createClient();
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("events")
        .select("id, title, start_date, start_time, location_name, category")
        .eq("is_published", true)
        .gte("start_date", today)
        .or("title.ilike.%health%,title.ilike.%wellness%,title.ilike.%clinic%,title.ilike.%vaccination%,title.ilike.%screening%,title.ilike.%medical%,title.ilike.%blood%,title.ilike.%run%,title.ilike.%fitness%,title.ilike.%walk%,title.ilike.%yoga%")
        .order("start_date")
        .limit(6);
      setDbEvents(data ?? []);
    }
    fetchHealthEvents();
  }, []);

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
    <div className="animate-fade-in pb-safe">
      {/* ─── Hero ─── */}
      <div className="relative h-64 overflow-hidden">
        <Image src="/images/generated/health-hero.png" alt="Health & Wellness" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-midnight/50 via-midnight/80 to-midnight" />
        <div className="absolute inset-0 pattern-dots opacity-20" />

        <div className="absolute inset-0 flex flex-col justify-end p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 bg-emerald/15 border border-emerald/25 rounded-full px-3 py-1 text-[10px] font-bold text-emerald badge-shine uppercase tracking-wide">
              Health & Fitness
            </span>
          </div>
          <EditorialHeader kicker="WELLNESS & CARE" title="Health Resources" subtitle="Healthcare, fitness, community events — everything to keep Compton healthy and thriving" />
        </div>
      </div>

      {/* ─── Stats Strip ─── */}
      <div className="px-5 -mt-3 mb-5 relative z-10">
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Resources", value: resources.length.toString(), color: "#3B82F6" },
            { label: "Free", value: freeCount.toString(), color: "#22C55E" },
            { label: "Events", value: (upcomingHealthEvents.length + dbEvents.length).toString(), color: "#8B5CF6" },
            { label: "Emergency", value: emergencyCount.toString(), color: "#EF4444" },
          ].map((stat) => (
            <div key={stat.label} className="bg-card border border-border-subtle rounded-xl p-2.5 text-center">
              <p className="text-base font-bold font-heading" style={{ color: stat.color }}>{stat.value}</p>
              <p className="text-[9px] text-white/30 uppercase tracking-wider mt-0.5">{stat.label}</p>
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
            <div className="rounded-2xl p-4 flex items-center gap-3 border" style={{ background: `${tip.color}08`, borderColor: `${tip.color}15` }}>
              <span className="text-2xl">{tip.icon}</span>
              <div className="flex-1">
                <p className="text-[10px] text-white/30 uppercase tracking-wider font-semibold mb-0.5">Daily Wellness Tip</p>
                <p className="text-[12px] text-white/60 leading-relaxed">{tip.tip}</p>
              </div>
            </div>
          );
        })()}
      </div>

      {/* ─── Community Fitness & Activities ─── */}
      <section className="mb-6">
        <div className="px-5 mb-3">
          <h2 className="font-heading font-bold text-base flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-emerald" />
            Community Fitness
          </h2>
          <p className="text-[11px] text-white/30">Free weekly activities for everyone</p>
        </div>
        <div className="flex gap-3 px-5 overflow-x-auto scrollbar-hide pb-2">
          {wellnessActivities.map((activity) => (
            <div
              key={activity.name}
              className="shrink-0 w-[240px] rounded-2xl border overflow-hidden press"
              style={{ borderColor: `${activity.color}20` }}
            >
              <div
                className="p-4 h-full"
                style={{ background: `linear-gradient(135deg, ${activity.color}08, ${activity.color}03)` }}
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${activity.color}15` }}>
                    <span className="text-xl">{activity.icon}</span>
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-[13px]">{activity.name}</h3>
                    <p className="text-[10px] font-semibold" style={{ color: activity.color }}>{activity.tagline}</p>
                  </div>
                </div>
                <p className="text-[11px] text-white/40 leading-relaxed mb-3 line-clamp-2">{activity.description}</p>
                <div className="flex items-center gap-3 text-[10px] text-white/30">
                  <span className="flex items-center gap-1">
                    <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="5" cy="5" r="4"/><path d="M5 3v2l1.5 1"/></svg>
                    {activity.schedule}
                  </span>
                </div>
                <p className="text-[10px] text-white/25 mt-1">{activity.location}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Upcoming Health Events ─── */}
      <section className="px-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-heading font-bold text-base flex items-center gap-2">
              <div className="w-1 h-5 rounded-full bg-coral" />
              Health Events
            </h2>
            <p className="text-[11px] text-white/30">Blood drives, fairs, runs & more</p>
          </div>
          <Link href="/events" className="text-[11px] text-gold font-semibold press">All Events</Link>
        </div>

        <div className="space-y-2.5 stagger">
          {upcomingHealthEvents.map((event) => {
            const { month, day } = formatEventDate(event.date);
            return (
              <div
                key={event.id}
                className="bg-card rounded-2xl border overflow-hidden transition-all hover:border-white/10"
                style={{ borderColor: `${event.color}15`, borderLeftWidth: 3, borderLeftColor: event.color }}
              >
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Date block */}
                    <div className="w-12 h-14 rounded-xl border border-border-subtle flex flex-col items-center justify-center shrink-0 bg-midnight/50">
                      <p className="text-[9px] font-bold uppercase leading-none" style={{ color: event.color }}>{month}</p>
                      <p className="text-lg font-bold leading-none mt-0.5">{day}</p>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base">{event.icon}</span>
                        <h3 className="font-heading font-bold text-[13px] truncate">{event.title}</h3>
                      </div>
                      <p className="text-[11px] text-white/40 line-clamp-2 mb-2">{event.description}</p>
                      <div className="flex items-center gap-3 text-[10px] text-white/30">
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
                <div className="bg-card rounded-2xl border border-border-subtle p-4 hover:border-white/10 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-14 rounded-xl border border-border-subtle flex flex-col items-center justify-center shrink-0 bg-midnight/50">
                      <p className="text-[9px] text-gold font-bold uppercase leading-none">{month}</p>
                      <p className="text-lg font-bold leading-none mt-0.5">{day}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-heading font-bold text-[13px] truncate">{event.title}</p>
                      {event.location_name && <p className="text-[11px] text-white/30 truncate">{event.location_name}</p>}
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
        <h2 className="font-heading font-bold text-base mb-3 flex items-center gap-2">
          <div className="w-1 h-5 rounded-full bg-gold" />
          Outdoor Fitness Spots
        </h2>
        <div className="grid grid-cols-2 gap-2.5">
          {fitnessSpots.map((spot) => (
            <div
              key={spot.name}
              className="rounded-xl p-3.5 border press"
              style={{ background: `${spot.color}06`, borderColor: `${spot.color}15` }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{spot.icon}</span>
                <div>
                  <p className="font-heading font-bold text-[12px]">{spot.name}</p>
                  <p className="text-[9px] text-white/30">{spot.type}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {spot.features.map((f) => (
                  <span key={f} className="text-[9px] bg-white/[0.04] text-white/40 rounded-full px-2 py-0.5 border border-white/[0.06]">{f}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="divider-subtle mx-5 mb-6" />

      {/* ─── Search ─── */}
      <div className="px-5 mb-4">
        <h2 className="font-heading font-bold text-lg mb-3 flex items-center gap-2">
          <div className="w-1 h-5 rounded-full bg-hc-blue" />
          Find Healthcare
        </h2>
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
                <span>{cat.icon}</span>
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
                  <span className="text-3xl">🏥</span>
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
        <div className="relative overflow-hidden rounded-2xl border border-hc-purple/20 p-5" style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.08), rgba(139,92,246,0.02))" }}>
          <div className="absolute top-0 right-0 w-24 h-24 opacity-10">
            <svg viewBox="0 0 100 100" fill="none" stroke="#8B5CF6" strokeWidth="1">
              <circle cx="80" cy="20" r="40" />
              <circle cx="80" cy="20" r="25" />
            </svg>
          </div>
          <div className="relative">
            <span className="text-2xl block mb-2">🧠</span>
            <h3 className="font-heading font-bold text-lg mb-1">Mental Health Matters</h3>
            <p className="text-[12px] text-white/40 leading-relaxed mb-3">
              It&apos;s okay to not be okay. Free counseling, support groups, and crisis resources are available for all Compton residents.
            </p>
            <div className="flex gap-2">
              <a
                href="tel:988"
                className="inline-flex items-center gap-2 bg-hc-purple text-white rounded-full px-4 py-2.5 text-[12px] font-bold press"
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07" />
                </svg>
                Call 988
              </a>
              <button
                onClick={() => { setActiveCategory("mental_health"); }}
                className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2.5 text-[12px] font-medium press border border-white/10"
              >
                Find Help
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Know Your Numbers ─── */}
      <section className="px-5 mb-6">
        <h2 className="font-heading font-bold text-base mb-3 flex items-center gap-2">
          <div className="w-1 h-5 rounded-full bg-cyan" />
          Know Your Numbers
        </h2>
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { label: "Blood Pressure", target: "< 120/80", icon: "❤️", color: "#EF4444" },
            { label: "Blood Sugar", target: "< 100 mg/dL", icon: "🩸", color: "#D97706" },
            { label: "BMI", target: "18.5 - 24.9", icon: "⚖️", color: "#3B82F6" },
            { label: "Cholesterol", target: "< 200 mg/dL", icon: "🫀", color: "#8B5CF6" },
          ].map((item) => (
            <div key={item.label} className="bg-card rounded-xl border border-border-subtle p-3 text-center">
              <span className="text-xl block mb-1">{item.icon}</span>
              <p className="text-[11px] font-semibold text-white/60">{item.label}</p>
              <p className="text-[12px] font-bold mt-0.5" style={{ color: item.color }}>{item.target}</p>
              <p className="text-[9px] text-white/20 mt-0.5">Healthy Range</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Compton Health Hotlines ─── */}
      <section className="px-5 mb-8">
        <h2 className="font-heading font-bold text-base mb-3 flex items-center gap-2">
          <div className="w-1 h-5 rounded-full bg-compton-red" />
          Health Hotlines
        </h2>
        <div className="space-y-2">
          {[
            { name: "Suicide & Crisis Lifeline", number: "988", color: "#EF4444" },
            { name: "Poison Control", number: "1-800-222-1222", color: "#D97706" },
            { name: "SAMHSA Helpline", number: "1-800-662-4357", color: "#22C55E" },
            { name: "Domestic Violence", number: "1-800-799-7233", color: "#8B5CF6" },
          ].map((line) => (
            <a
              key={line.name}
              href={`tel:${line.number.replace(/-/g, "")}`}
              className="flex items-center gap-3 bg-card rounded-xl border border-border-subtle p-3 press hover:border-white/10 transition-all"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: `${line.color}15` }}>
                <svg width="14" height="14" fill="none" stroke={line.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-[12px] font-semibold">{line.name}</p>
                <p className="text-[11px] font-bold" style={{ color: line.color }}>{line.number}</p>
              </div>
              <span className="text-[10px] text-white/20">24/7</span>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
