"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import EmergencyBanner from "@/components/health/EmergencyBanner";
import Icon from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import { useKnownCities } from "@/hooks/useActiveCity";
import CityFilterChip from "@/components/ui/CityFilterChip";
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

const categoryLabels: Record<string, string> = {
  clinic: "Clinic", hospital: "Hospital", mental_health: "Mental Health", dental: "Dental",
  vision: "Vision", pharmacy: "Pharmacy", emergency: "Emergency", substance_abuse: "Substance Abuse",
  prenatal: "Prenatal", pediatric: "Pediatric", senior_care: "Senior Care", insurance_help: "Insurance Help",
};

type FilterTag = "free" | "medicaid" | "walkins";

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
  const iconName = categories.find(c => c.value === resource.category)?.icon || "first-aid";
  return (
    <Link href={`/health/${resource.slug}`} className="block press">
      <div
        className="overflow-hidden"
        style={{
          background: "var(--paper)",
          border: "2px solid var(--rule-strong-c)",
        }}
      >
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div
                className="w-10 h-10 flex items-center justify-center shrink-0"
                style={{
                  background: "var(--ink-strong)",
                  color: "var(--gold-c)",
                  border: "2px solid var(--rule-strong-c)",
                }}
              >
                <Icon name={iconName} size={18} />
              </div>
              <div className="min-w-0">
                <h3 className="c-card-t line-clamp-1" style={{ fontSize: 13 }}>{resource.name}</h3>
                {resource.organization && (
                  <p className="c-meta mt-0.5" style={{ fontSize: 11 }}>{resource.organization}</p>
                )}
              </div>
            </div>
            {resource.is_emergency && (
              <span
                className="c-badge-live shrink-0 inline-flex items-center gap-1 c-kicker"
                style={{ fontSize: 9, padding: "3px 6px", letterSpacing: "0.12em" }}
              >
                <span className="rounded-full animate-pulse" style={{ width: 4, height: 4, background: "#fff" }} />
                ER
              </span>
            )}
          </div>

          {resource.address && (
            <p className="line-clamp-1 mb-2" style={{ fontSize: 11, color: "var(--ink-strong)", opacity: 0.6 }}>{resource.address}</p>
          )}

          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-1.5">
              <span className="c-badge-gold c-kicker" style={{ fontSize: 9, padding: "3px 8px", letterSpacing: "0.12em" }}>
                {categoryLabels[resource.category] || resource.category}
              </span>
              {resource.is_free && (
                <span className="c-badge-ok c-kicker" style={{ fontSize: 9, padding: "3px 8px", letterSpacing: "0.12em" }}>FREE</span>
              )}
              {resource.accepts_medi_cal && (
                <span className="c-badge-ink c-kicker" style={{ fontSize: 9, padding: "3px 8px", letterSpacing: "0.12em" }}>MEDI-CAL</span>
              )}
              {resource.accepts_uninsured && (
                <span
                  className="c-kicker"
                  style={{
                    fontSize: 9,
                    padding: "3px 8px",
                    letterSpacing: "0.12em",
                    background: "transparent",
                    color: "var(--ink-strong)",
                    border: "1.5px solid var(--rule-strong-c)",
                  }}
                >
                  UNINSURED OK
                </span>
              )}
            </div>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--ink-strong)", opacity: 0.5 }} className="shrink-0" strokeLinecap="round">
              <path d="M5 3l4 4-4 4" />
            </svg>
          </div>

          {resource.phone && (
            <div
              className="flex items-center gap-1.5 mt-2.5 pt-2.5"
              style={{ borderTop: "2px solid var(--rule-strong-c)" }}
            >
              <svg width="10" height="10" fill="none" stroke="var(--gold-c)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07" />
              </svg>
              <p className="c-card-t tabular-nums" style={{ fontSize: 11, color: "var(--ink-strong)" }}>{resource.phone}</p>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── Main Page ─────────────────────────────────────
export default function HealthPage() {
  // Default scope = ALL cities. Listener narrows via the CityFilterChip.
  const sp = useSearchParams();
  const cities = useKnownCities();
  const filterCitySlug = sp.get("city");
  const filterCity = useMemo(
    () => (filterCitySlug ? cities.find((c) => c.slug === filterCitySlug) ?? null : null),
    [filterCitySlug, cities],
  );
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

      if (filterCity?.id) {
        query = query.eq("city_id", filterCity!.id);
      }

      if (activeCategory !== "all") {
        query = query.eq("category", activeCategory);
      }

      const { data } = await query;
      setResources((data as HealthResource[]) ?? []);
      setLoading(false);
    }
    fetchResources();
  }, [activeCategory, filterCity?.id]);

  // Fetch health-related events from DB
  useEffect(() => {
    async function fetchHealthEvents() {
      const supabase = createClient();
      const today = new Date().toISOString().split("T")[0];
      // Strict tag-based filter — only events explicitly tagged "health" (or "mental_health" / "fitness").
      let query = supabase
        .from("events")
        .select("id, title, start_date, start_time, location_name, category")
        .eq("is_published", true)
        .gte("start_date", today)
        .overlaps("tags", ["health", "mental_health", "fitness"])
        .order("start_date")
        .limit(6);

      if (filterCity?.id) {
        query = query.eq("city_id", filterCity!.id);
      }

      const { data } = await query;
      setDbEvents(data ?? []);
    }
    fetchHealthEvents();
  }, [filterCity?.id]);

  // Health groups — only groups tagged "health" (or "mental_health" / "fitness").
  const [healthGroups, setHealthGroups] = useState<
    { id: string; slug: string; name: string; description: string | null; image_url: string | null; member_count: number }[]
  >([]);
  useEffect(() => {
    async function fetchHealthGroups() {
      const supabase = createClient();
      let query = supabase
        .from("community_groups")
        .select("id, slug, name, description, image_url, avatar_url, member_count")
        .eq("is_active", true)
        .eq("is_public", true)
        .overlaps("tags", ["health", "mental_health", "fitness"])
        .order("member_count", { ascending: false })
        .limit(6);

      if (filterCity?.id) {
        query = query.eq("city_id", filterCity!.id);
      }

      const { data } = await query;
      setHealthGroups(
        (data ?? []).map((g) => ({
          id: g.id as string,
          slug: g.slug as string,
          name: g.name as string,
          description: (g.description as string | null) ?? null,
          image_url: (g.image_url as string | null) ?? (g.avatar_url as string | null) ?? null,
          member_count: (g.member_count as number) ?? 0,
        }))
      );
    }
    fetchHealthGroups();
  }, [filterCity?.id]);

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
          § VOL·01 · ISSUE HEALTH · {filterCity?.name?.toUpperCase() ?? "EVERYWHERE"}
        </div>
        <h1
          className="c-hero mt-2"
          style={{ fontSize: 56, lineHeight: 0.88, letterSpacing: "-0.02em" }}
        >
          Health.
        </h1>
        <p className="c-serif-it mt-2" style={{ fontSize: 13 }}>
          Care, fitness &amp; resources for {filterCity?.name ?? "your city"}.
        </p>
        <div className="mt-3"><CityFilterChip /></div>
      </div>

      {/* ─── Stats Strip ─── */}
      <div className="px-5 mt-5 mb-5 relative z-10">
        <div
          className="grid grid-cols-4"
          style={{ border: "2px solid var(--rule-strong-c)", background: "var(--paper)" }}
        >
          {[
            { label: "Resources", value: resources.length.toString() },
            { label: "Free", value: freeCount.toString() },
            { label: "Events", value: (upcomingHealthEvents.length + dbEvents.length).toString() },
            { label: "Emergency", value: emergencyCount.toString() },
          ].map((stat, idx) => (
            <div
              key={stat.label}
              className="p-2.5 text-center"
              style={{
                borderLeft: idx === 0 ? "none" : "2px solid var(--rule-strong-c)",
              }}
            >
              <p
                className="c-hero tabular-nums"
                style={{ fontSize: 22, lineHeight: 1, color: "var(--ink-strong)" }}
              >
                {stat.value}
              </p>
              <p className="c-kicker mt-1.5" style={{ fontSize: 9, opacity: 0.7 }}>
                {stat.label}
              </p>
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
            <div
              className="p-4 flex items-center gap-3"
              style={{
                background: "var(--paper)",
                border: "2px solid var(--rule-strong-c)",
              }}
            >
              <div
                className="w-10 h-10 flex items-center justify-center shrink-0"
                style={{
                  background: "var(--ink-strong)",
                  color: "var(--gold-c)",
                  border: "2px solid var(--rule-strong-c)",
                }}
              >
                <Icon name={tip.icon} size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="c-kicker"
                  style={{ fontSize: 10, color: "var(--gold-c)", letterSpacing: "0.16em" }}
                >
                  DAILY WELLNESS TIP
                </p>
                <p className="c-body mt-1" style={{ fontSize: 12 }}>{tip.tip}</p>
              </div>
            </div>
          );
        })()}
      </div>

      {/* ─── Health Groups ─── */}
      {healthGroups.length > 0 && (
        <section className="mb-6">
          <div className="px-5 mb-3">
            <div className="flex items-baseline gap-3">
              <span
                className="c-hero tabular-nums"
                style={{ fontSize: 22, lineHeight: 1, color: "var(--gold-c)" }}
              >
                № 01
              </span>
              <span className="c-kicker" style={{ fontSize: 10, letterSpacing: "0.16em" }}>
                HEALTH GROUPS
              </span>
              <span
                className="ml-auto flex-1 self-center"
                style={{ borderTop: "2px solid var(--rule-strong-c)" }}
              />
            </div>
            <p className="c-serif-it mt-1" style={{ fontSize: 11 }}>Communities tagged with health, mental health, or fitness.</p>
          </div>
          <div className="flex gap-3 px-5 overflow-x-auto scrollbar-hide pb-2">
            {healthGroups.map((g) => (
              <Link
                key={g.id}
                href={`/groups/${g.slug || g.id}`}
                className="shrink-0 w-[240px] overflow-hidden press block"
                style={{
                  background: "var(--paper)",
                  border: "2px solid var(--rule-strong-c)",
                }}
              >
                <div className="p-4 h-full">
                  <div className="flex items-center gap-2.5 mb-2">
                    <div
                      className="w-10 h-10 flex items-center justify-center shrink-0 overflow-hidden"
                      style={{
                        background: "var(--ink-strong)",
                        color: "var(--gold-c)",
                        border: "2px solid var(--rule-strong-c)",
                      }}
                    >
                      {g.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={g.image_url} alt={g.name} className="w-full h-full object-cover" />
                      ) : (
                        <Icon name="users" size={18} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="c-card-t truncate" style={{ fontSize: 14 }}>{g.name}</h3>
                      <p
                        className="c-kicker truncate"
                        style={{ fontSize: 9, color: "var(--gold-c)", letterSpacing: "0.14em" }}
                      >
                        {g.member_count} MEMBER{g.member_count === 1 ? "" : "S"}
                      </p>
                    </div>
                  </div>
                  {g.description && (
                    <p className="c-body line-clamp-3" style={{ fontSize: 11 }}>{g.description}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ─── Upcoming Health Events ─── */}
      <section className="px-5 mb-6">
        <div className="flex items-start justify-between mb-3 gap-3">
          <div className="min-w-0">
            <div className="flex items-baseline gap-3">
              <span
                className="c-hero tabular-nums"
                style={{ fontSize: 22, lineHeight: 1, color: "var(--gold-c)" }}
              >
                № 02
              </span>
              <span className="c-kicker" style={{ fontSize: 10, letterSpacing: "0.16em" }}>
                HEALTH EVENTS
              </span>
            </div>
            <p className="c-serif-it mt-1" style={{ fontSize: 11 }}>Blood drives, fairs, runs &amp; more.</p>
          </div>
          <Link
            href="/events"
            className="c-kicker shrink-0 press"
            style={{ fontSize: 10, color: "var(--gold-c)", letterSpacing: "0.14em" }}
          >
            ALL EVENTS →
          </Link>
        </div>

        <div className="space-y-2.5 stagger">
          {upcomingHealthEvents.map((event) => {
            const { month, day } = formatEventDate(event.date);
            return (
              <div
                key={event.id}
                className="overflow-hidden"
                style={{
                  background: "var(--paper)",
                  border: "2px solid var(--rule-strong-c)",
                }}
              >
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Editorial date block */}
                    <div
                      className="w-12 h-14 flex flex-col items-center justify-center shrink-0"
                      style={{
                        background: "var(--ink-strong)",
                        border: "2px solid var(--rule-strong-c)",
                      }}
                    >
                      <p
                        className="c-kicker"
                        style={{ fontSize: 9, color: "var(--gold-c)", letterSpacing: "0.14em", lineHeight: 1 }}
                      >
                        {month.toUpperCase()}
                      </p>
                      <p
                        className="c-hero tabular-nums mt-1"
                        style={{ fontSize: 20, lineHeight: 1, color: "var(--paper)" }}
                      >
                        {day}
                      </p>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon name={event.icon} size={14} style={{ color: "var(--gold-c)" }} />
                        <h3 className="c-card-t truncate" style={{ fontSize: 14 }}>{event.title}</h3>
                      </div>
                      <p className="c-body line-clamp-2 mb-2" style={{ fontSize: 11 }}>{event.description}</p>
                      <div className="flex items-center gap-3">
                        <span className="c-meta" style={{ fontSize: 10 }}>{event.time}</span>
                        <span className="c-meta" style={{ fontSize: 10, opacity: 0.7 }}>{event.location}</span>
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
                <div
                  className="p-4"
                  style={{
                    background: "var(--paper)",
                    border: "2px solid var(--rule-strong-c)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-14 flex flex-col items-center justify-center shrink-0"
                      style={{
                        background: "var(--ink-strong)",
                        border: "2px solid var(--rule-strong-c)",
                      }}
                    >
                      <p
                        className="c-kicker"
                        style={{ fontSize: 9, color: "var(--gold-c)", letterSpacing: "0.14em", lineHeight: 1 }}
                      >
                        {month.toUpperCase()}
                      </p>
                      <p
                        className="c-hero tabular-nums mt-1"
                        style={{ fontSize: 20, lineHeight: 1, color: "var(--paper)" }}
                      >
                        {day}
                      </p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="c-card-t truncate" style={{ fontSize: 14 }}>{event.title}</p>
                      {event.location_name && (
                        <p className="c-meta truncate mt-0.5" style={{ fontSize: 11 }}>{event.location_name}</p>
                      )}
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
          <span
            className="c-hero tabular-nums"
            style={{ fontSize: 22, lineHeight: 1, color: "var(--gold-c)" }}
          >
            № 03
          </span>
          <span className="c-kicker" style={{ fontSize: 10, letterSpacing: "0.16em" }}>
            OUTDOOR FITNESS SPOTS
          </span>
          <span
            className="ml-auto flex-1 self-center"
            style={{ borderTop: "2px solid var(--rule-strong-c)" }}
          />
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {fitnessSpots.map((spot) => (
            <div
              key={spot.name}
              className="p-3.5 press"
              style={{
                background: "var(--paper)",
                border: "2px solid var(--rule-strong-c)",
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-9 h-9 flex items-center justify-center"
                  style={{
                    background: "var(--ink-strong)",
                    color: "var(--gold-c)",
                    border: "2px solid var(--rule-strong-c)",
                  }}
                >
                  <Icon name={spot.icon} size={16} />
                </div>
                <div className="min-w-0">
                  <p className="c-card-t truncate" style={{ fontSize: 13 }}>{spot.name}</p>
                  <p className="c-kicker" style={{ fontSize: 9, opacity: 0.7 }}>{spot.type.toUpperCase()}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {spot.features.map((f) => (
                  <span
                    key={f}
                    className="c-kicker"
                    style={{
                      fontSize: 9,
                      padding: "2px 7px",
                      letterSpacing: "0.12em",
                      background: "transparent",
                      color: "var(--ink-strong)",
                      border: "1.5px solid var(--rule-strong-c)",
                    }}
                  >
                    {f.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div
        className="mx-5 mb-6"
        style={{ borderTop: "2px solid var(--rule-strong-c)" }}
      />

      {/* ─── Search ─── */}
      <div className="px-5 mb-4">
        <div className="flex items-baseline gap-3 mb-3">
          <span
            className="c-hero tabular-nums"
            style={{ fontSize: 22, lineHeight: 1, color: "var(--gold-c)" }}
          >
            № 04
          </span>
          <span className="c-kicker" style={{ fontSize: 10, letterSpacing: "0.16em" }}>
            FIND HEALTHCARE
          </span>
          <span
            className="ml-auto flex-1 self-center"
            style={{ borderTop: "2px solid var(--rule-strong-c)" }}
          />
        </div>
        <div className="relative">
          <svg
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="absolute left-3.5 top-1/2 -translate-y-1/2"
            style={{ color: "var(--ink-strong)", opacity: 0.5 }}
            strokeLinecap="round"
          >
            <circle cx="8" cy="8" r="6" />
            <path d="M13 13l3 3" />
          </svg>
          <input
            type="text"
            placeholder="Search clinics, hospitals, services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-10 py-3 text-sm focus:outline-none transition-colors"
            style={{
              background: "var(--paper)",
              border: "2px solid var(--rule-strong-c)",
              color: "var(--ink-strong)",
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
              style={{ color: "var(--ink-strong)", opacity: 0.6 }}
            >
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
                className="flex items-center gap-1.5 shrink-0 px-3.5 py-2 c-kicker press transition-colors"
                style={{
                  fontSize: 10,
                  letterSpacing: "0.12em",
                  background: isActive ? "var(--ink-strong)" : "var(--paper)",
                  color: isActive ? "var(--gold-c)" : "var(--ink-strong)",
                  border: "2px solid var(--rule-strong-c)",
                }}
              >
                <Icon name={cat.icon} size={14} />
                {cat.label.toUpperCase()}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Filter Badges ─── */}
      <div className="flex gap-2 px-5 mb-5">
        {([
          { label: "Free Services", value: "free" as FilterTag },
          { label: "Accepts Medi-Cal", value: "medicaid" as FilterTag },
        ]).map((badge) => {
          const isActive = activeFilters.has(badge.value);
          return (
            <button
              key={badge.value}
              onClick={() => toggleFilter(badge.value)}
              className="flex items-center gap-1.5 px-3 py-1.5 c-kicker press transition-colors"
              style={{
                fontSize: 10,
                letterSpacing: "0.12em",
                background: isActive ? "var(--gold-c)" : "var(--paper)",
                color: "var(--ink-strong)",
                border: "2px solid var(--rule-strong-c)",
              }}
            >
              {isActive && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              )}
              {badge.label.toUpperCase()}
            </button>
          );
        })}
      </div>

      {/* ─── Results Header ─── */}
      <div className="flex items-center justify-between px-5 mb-3">
        <span className="c-meta" style={{ fontSize: 11 }}>
          {filteredResources.length} HEALTHCARE RESOURCES
        </span>
        {activeCategory !== "all" && (
          <button
            onClick={() => setActiveCategory("all")}
            className="c-btn c-btn-sm c-btn-outline press"
          >
            CLEAR
          </button>
        )}
      </div>

      {/* ─── Resource List ─── */}
      {loading ? (
        <div className="px-5 space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="skeleton h-28"
              style={{ border: "2px solid var(--rule-strong-c)" }}
            />
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
                <div
                  className="w-16 h-16 flex items-center justify-center mx-auto mb-4"
                  style={{
                    background: "var(--ink-strong)",
                    color: "var(--gold-c)",
                    border: "2px solid var(--rule-strong-c)",
                  }}
                >
                  <Icon name="first-aid" size={30} />
                </div>
                <p className="c-card-t mb-1" style={{ fontSize: 14 }}>No health resources found</p>
                <p className="c-meta" style={{ fontSize: 11 }}>Try a different category or search.</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ─── Mental Health CTA ─── */}
      <section className="px-5 mb-6">
        <div
          className="relative overflow-hidden"
          style={{
            background: "var(--ink-strong)",
            border: "3px solid var(--rule-strong-c)",
          }}
        >
          {/* Gold foil bar top */}
          <div style={{ height: 4, background: "var(--gold-c)" }} />
          <div className="p-5">
            <div
              className="w-10 h-10 flex items-center justify-center mb-3"
              style={{
                background: "var(--gold-c)",
                color: "var(--ink-strong)",
                border: "2px solid var(--paper)",
              }}
            >
              <Icon name="brain" size={20} />
            </div>
            <h3
              className="c-hero mb-1"
              style={{ fontSize: 24, lineHeight: 1, color: "var(--paper)" }}
            >
              Mental Health Matters.
            </h3>
            <p
              className="c-serif-it mb-4 max-w-md"
              style={{ fontSize: 13, color: "var(--paper)", opacity: 0.8 }}
            >
              It&apos;s okay to not be okay. Free counseling, support groups, and crisis resources are available for all {filterCity?.name ?? "local"} residents.
            </p>
            <div className="flex gap-2">
              <a
                href="tel:988"
                className="c-btn c-btn-sm press inline-flex items-center gap-2"
                style={{
                  background: "var(--gold-c)",
                  color: "var(--ink-strong)",
                  border: "2px solid var(--paper)",
                }}
              >
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07" />
                </svg>
                CALL 988
              </a>
              <button
                onClick={() => { setActiveCategory("mental_health"); }}
                className="c-btn c-btn-sm press inline-flex items-center gap-2"
                style={{
                  background: "transparent",
                  color: "var(--paper)",
                  border: "2px solid var(--paper)",
                }}
              >
                FIND HELP
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Know Your Numbers ─── */}
      <section className="px-5 mb-6">
        <div className="flex items-baseline gap-3 mb-3">
          <span
            className="c-hero tabular-nums"
            style={{ fontSize: 22, lineHeight: 1, color: "var(--gold-c)" }}
          >
            № 05
          </span>
          <span className="c-kicker" style={{ fontSize: 10, letterSpacing: "0.16em" }}>
            KNOW YOUR NUMBERS
          </span>
          <span
            className="ml-auto flex-1 self-center"
            style={{ borderTop: "2px solid var(--rule-strong-c)" }}
          />
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { label: "Blood Pressure", target: "< 120/80", icon: "heart-pulse" as IconName },
            { label: "Blood Sugar", target: "< 100 mg/dL", icon: "pulse" as IconName },
            { label: "BMI", target: "18.5 - 24.9", icon: "chart" as IconName },
            { label: "Cholesterol", target: "< 200 mg/dL", icon: "stethoscope" as IconName },
          ].map((item) => (
            <div
              key={item.label}
              className="p-3 text-center"
              style={{
                background: "var(--paper)",
                border: "2px solid var(--rule-strong-c)",
              }}
            >
              <div
                className="mx-auto w-9 h-9 flex items-center justify-center mb-2"
                style={{
                  background: "var(--ink-strong)",
                  color: "var(--gold-c)",
                  border: "2px solid var(--rule-strong-c)",
                }}
              >
                <Icon name={item.icon} size={16} />
              </div>
              <p className="c-kicker" style={{ fontSize: 10, opacity: 0.75 }}>{item.label.toUpperCase()}</p>
              <p
                className="c-hero tabular-nums mt-1"
                style={{ fontSize: 18, lineHeight: 1, color: "var(--ink-strong)" }}
              >
                {item.target}
              </p>
              <p className="c-kicker mt-1" style={{ fontSize: 9, opacity: 0.55 }}>HEALTHY RANGE</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Health Hotlines ─── */}
      <section className="px-5 mb-8">
        <div className="flex items-baseline gap-3 mb-3">
          <span
            className="c-hero tabular-nums"
            style={{ fontSize: 22, lineHeight: 1, color: "var(--gold-c)" }}
          >
            № 06
          </span>
          <span className="c-kicker" style={{ fontSize: 10, letterSpacing: "0.16em" }}>
            HEALTH HOTLINES
          </span>
          <span
            className="ml-auto flex-1 self-center"
            style={{ borderTop: "2px solid var(--rule-strong-c)" }}
          />
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
              className="flex items-center gap-3 p-3 press"
              style={{
                background: "var(--paper)",
                border: "2px solid var(--rule-strong-c)",
              }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{
                  background: "var(--ink-strong)",
                  color: "var(--gold-c)",
                  border: "2px solid var(--rule-strong-c)",
                }}
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="c-card-t" style={{ fontSize: 13 }}>{line.name}</p>
                <p
                  className="c-card-t tabular-nums mt-0.5"
                  style={{ fontSize: 12, color: "var(--gold-c)" }}
                >
                  {line.number}
                </p>
              </div>
              <span
                className="c-badge-gold c-kicker"
                style={{ fontSize: 9, padding: "3px 8px", letterSpacing: "0.14em" }}
              >
                24/7
              </span>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
