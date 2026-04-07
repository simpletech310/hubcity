"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Chip from "@/components/ui/Chip";
import Badge from "@/components/ui/Badge";
import EditorialHeader from "@/components/ui/EditorialHeader";
import AdZone from "@/components/ui/AdZone";
import { createClient } from "@/lib/supabase/client";
import type { Event } from "@/types/database";

const categories = [
  { label: "All", value: "all", icon: "🔥" },
  { label: "City", value: "city", icon: "🏛️" },
  { label: "Sports", value: "sports", icon: "🏈" },
  { label: "Culture", value: "culture", icon: "🎭" },
  { label: "Community", value: "community", icon: "🤝" },
  { label: "School", value: "school", icon: "📚" },
  { label: "Youth", value: "youth", icon: "🌟" },
];

const categoryImages: Record<string, string> = {
  community: "/images/christmas-parade.png",
  sports: "/images/football-night.png",
  culture: "/images/community-event.png",
  city: "/images/city-hall.png",
  youth: "/images/community-event.png",
  school: "/images/community-event.png",
};

const categoryBadgeVariant: Record<string, "purple" | "coral" | "cyan" | "gold" | "emerald" | "blue" | "pink"> = {
  city: "cyan",
  sports: "emerald",
  culture: "pink",
  community: "purple",
  school: "blue",
  youth: "gold",
};

const categoryColors: Record<string, string> = {
  city: "#06B6D4",
  sports: "#22C55E",
  culture: "#FF6B6B",
  community: "#8B5CF6",
  school: "#3B82F6",
  youth: "#F2A900",
};

function formatEventDate(dateStr: string) {
  const d = new Date(dateStr);
  return {
    month: d.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
    day: d.getDate(),
    weekday: d.toLocaleDateString("en-US", { weekday: "short" }),
    time: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
    full: d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }),
  };
}

function isToday(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

function isThisWeek(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const weekEnd = new Date(now);
  weekEnd.setDate(weekEnd.getDate() + 7);
  return d >= now && d <= weekEnd;
}

export default function EventsPage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    async function fetchEvents() {
      setLoading(true);
      const supabase = createClient();
      let query = supabase
        .from("events")
        .select("*")
        .eq("is_published", true)
        .order("is_featured", { ascending: false })
        .order("start_date", { ascending: true });

      if (activeCategory !== "all") {
        query = query.eq("category", activeCategory);
      }

      const { data } = await query;
      setEvents((data as Event[]) ?? []);
      setLoading(false);
    }
    fetchEvents();
  }, [activeCategory]);

  const featured = useMemo(() => events.filter((e) => e.is_featured), [events]);
  const todayEvents = useMemo(() => events.filter((e) => isToday(e.start_date)), [events]);
  const thisWeekEvents = useMemo(() => events.filter((e) => isThisWeek(e.start_date) && !isToday(e.start_date)), [events]);
  const upcomingEvents = useMemo(() => events.filter((e) => !isThisWeek(e.start_date)), [events]);
  const totalRSVP = useMemo(() => events.reduce((sum, e) => sum + (e.rsvp_count ?? 0), 0), [events]);

  // Auto-rotate hero
  useEffect(() => {
    if (featured.length <= 1) return;
    const interval = setInterval(() => {
      setHeroIndex((i) => (i + 1) % featured.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [featured.length]);

  const heroEvent = featured.length > 0 ? featured[heroIndex % featured.length] : events[0];

  return (
    <div className="animate-fade-in">
      {/* ══════════════════════════════════════════════════════
          HERO BANNER — Cinematic event spotlight
          ══════════════════════════════════════════════════════ */}
      {heroEvent && (
        <div className="relative -mt-[72px] pt-[72px] mb-6">
          {/* Background Image */}
          <div className="absolute inset-0 overflow-hidden">
            {heroEvent.image_url ? (
              <Image
                src={heroEvent.image_url}
                alt={heroEvent.title}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <Image
                src={categoryImages[heroEvent.category] ?? "/images/community-event.png"}
                alt={heroEvent.title}
                fill
                className="object-cover"
                priority
              />
            )}
            {/* Gradient overlays for readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/70 to-midnight/30" />
            <div className="absolute inset-0 bg-gradient-to-r from-midnight/50 to-transparent" />
          </div>

          {/* Decorative ambient glow */}
          <div
            className="absolute bottom-0 left-0 w-[200px] h-[200px] rounded-full opacity-30 blur-3xl"
            style={{ background: categoryColors[heroEvent.category] ?? "#F2A900" }}
          />

          <div className="relative z-10 px-5 pt-8 pb-8">
            {/* Live tag if today */}
            {isToday(heroEvent.start_date) && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-compton-red/20 border border-compton-red/40 mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-compton-red animate-pulse" />
                <span className="font-heading text-[10px] font-bold text-compton-red tracking-[0.1em]">
                  HAPPENING TODAY
                </span>
              </div>
            )}

            {/* Category + date */}
            <div className="flex items-center gap-2 mb-3">
              <Badge
                label={heroEvent.category}
                variant={categoryBadgeVariant[heroEvent.category] ?? "purple"}
                size="md"
              />
              <span className="text-[12px] text-warm-gray">
                {formatEventDate(heroEvent.start_date).full}
              </span>
            </div>

            {/* Title */}
            <h1 className="font-heading text-[32px] font-bold leading-[0.95] tracking-tight mb-3 max-w-[340px] drop-shadow-lg">
              {heroEvent.title}
            </h1>

            {/* Location + RSVP */}
            <div className="flex items-center gap-4 text-[13px] text-warm-gray mb-6">
              {heroEvent.location_name && (
                <span className="flex items-center gap-1.5">
                  <span className="text-[16px]">📍</span>
                  {heroEvent.location_name}
                </span>
              )}
              {(heroEvent.rsvp_count ?? 0) > 0 && (
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald" />
                  {heroEvent.rsvp_count?.toLocaleString()} going
                </span>
              )}
            </div>

            {/* CTA */}
            <div className="flex gap-3">
              <Link
                href={`/events/${heroEvent.id}`}
                className="flex items-center gap-2 bg-gold text-midnight px-6 py-3 rounded-xl font-heading text-[14px] font-bold press hover:bg-gold-light transition-colors shadow-lg shadow-gold/20"
              >
                Get Tickets
              </Link>
              <button className="flex items-center gap-2 bg-white/[0.08] border border-white/[0.15] text-white px-5 py-3 rounded-xl text-[14px] font-medium press hover:bg-white/[0.12] transition-colors backdrop-blur-sm">
                Share
              </button>
            </div>

            {/* Hero pagination */}
            {featured.length > 1 && (
              <div className="flex gap-2 mt-6">
                {featured.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setHeroIndex(i)}
                    className={`h-[3px] rounded-full transition-all duration-300 ${
                      i === heroIndex % featured.length ? "w-8 bg-gold" : "w-3 bg-white/20"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          QUICK STATS BAR
          ══════════════════════════════════════════════════════ */}
      <div className="flex gap-2.5 px-5 mb-6 overflow-x-auto scrollbar-hide pb-1">
        <div className="flex items-center gap-2 bg-royal rounded-2xl px-4 py-2.5 border border-border-subtle shrink-0">
          <span className="text-[18px]">🎉</span>
          <div>
            <p className="text-[15px] font-bold font-heading leading-none">{events.length}</p>
            <p className="text-[10px] text-warm-gray">Events</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-royal rounded-2xl px-4 py-2.5 border border-border-subtle shrink-0">
          <span className="text-[18px]">🔥</span>
          <div>
            <p className="text-[15px] font-bold font-heading leading-none">{todayEvents.length}</p>
            <p className="text-[10px] text-warm-gray">Today</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-royal rounded-2xl px-4 py-2.5 border border-border-subtle shrink-0">
          <span className="text-[18px]">👥</span>
          <div>
            <p className="text-[15px] font-bold font-heading leading-none">{totalRSVP.toLocaleString()}</p>
            <p className="text-[10px] text-warm-gray">Attending</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-royal rounded-2xl px-4 py-2.5 border border-border-subtle shrink-0">
          <span className="text-[18px]">⭐</span>
          <div>
            <p className="text-[15px] font-bold font-heading leading-none">{featured.length}</p>
            <p className="text-[10px] text-warm-gray">Featured</p>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          CATEGORY FILTERS
          ══════════════════════════════════════════════════════ */}
      <div className="flex gap-2 px-5 mb-6 overflow-x-auto scrollbar-hide pb-1">
        {categories.map((cat) => (
          <Chip
            key={cat.value}
            label={`${cat.icon} ${cat.label}`}
            active={activeCategory === cat.value}
            onClick={() => setActiveCategory(cat.value)}
          />
        ))}
      </div>

      {loading ? (
        <div className="px-5 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-28" />
          ))}
        </div>
      ) : (
        <>
          {/* ══════════════════════════════════════════════════
              HAPPENING TODAY
              ══════════════════════════════════════════════════ */}
          {todayEvents.length > 0 && (
            <section className="mb-8">
              <div className="flex items-center gap-2 px-5 mb-3">
                <div className="w-2.5 h-2.5 rounded-full bg-compton-red animate-pulse" />
                <h2 className="font-heading font-bold text-[18px]">Happening Today</h2>
                <Badge label={`${todayEvents.length} LIVE`} variant="coral" shine />
              </div>
              <div className="flex gap-3 px-5 overflow-x-auto scrollbar-hide pb-2">
                {todayEvents.map((event) => (
                  <EventCardHot key={event.id} event={event} />
                ))}
              </div>
            </section>
          )}

          {/* ══════════════════════════════════════════════════
              THIS WEEK — Horizontal card scroller
              ══════════════════════════════════════════════════ */}
          {thisWeekEvents.length > 0 && (
            <section className="mb-8">
              <div className="px-5 mb-3">
                <h2 className="font-heading font-bold text-[18px]">This Week</h2>
                <p className="text-[12px] text-warm-gray mt-0.5">Don&apos;t miss out</p>
              </div>
              <div className="flex gap-3 px-5 overflow-x-auto scrollbar-hide pb-2">
                {thisWeekEvents.map((event) => (
                  <EventCardLarge key={event.id} event={event} />
                ))}
              </div>
            </section>
          )}

          {/* ══════════════════════════════════════════════════
              FEATURED EVENTS — Big visual cards
              ══════════════════════════════════════════════════ */}
          {featured.length > 0 && activeCategory === "all" && (
            <section className="px-5 mb-8">
              <div className="mb-3">
                <EditorialHeader kicker="WHAT'S HAPPENING" title="Can't Miss" />
              </div>
              <div className="space-y-3">
                {featured.slice(0, 3).map((event) => (
                  <EventCardFeatured key={event.id} event={event} />
                ))}
              </div>
            </section>
          )}

          {/* ══════════════════════════════════════════════════
              BROWSE BY CATEGORY — Visual grid
              ══════════════════════════════════════════════════ */}
          {activeCategory === "all" && (
            <section className="px-5 mb-8">
              <div className="mb-3">
                <h2 className="font-heading font-bold text-[18px]">Browse Events</h2>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {categories.slice(1).map((cat) => {
                  const catEvents = events.filter((e) => e.category === cat.value);
                  const color = categoryColors[cat.value] ?? "#F2A900";
                  return (
                    <button
                      key={cat.value}
                      onClick={() => setActiveCategory(cat.value)}
                      className="relative overflow-hidden rounded-2xl border border-border-subtle p-4 text-left press group"
                      style={{
                        background: `linear-gradient(135deg, ${color}15 0%, var(--color-royal) 100%)`,
                      }}
                    >
                      <div
                        className="absolute top-0 left-0 right-0 h-[2px] opacity-50"
                        style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
                      />
                      <span className="text-[28px] block mb-1.5">{cat.icon}</span>
                      <span className="font-heading text-[14px] font-bold block">{cat.label}</span>
                      <span className="text-[11px] text-warm-gray">{catEvents.length} events</span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* Ad Zone */}
          <div className="px-5 mb-8">
            <AdZone zone="feed_banner" />
          </div>

          {/* ══════════════════════════════════════════════════
              ALL UPCOMING — Timeline-style list
              ══════════════════════════════════════════════════ */}
          <section className="px-5 mb-8">
            <div className="mb-3">
              <h2 className="font-heading font-bold text-[18px]">
                {activeCategory === "all" ? "All Events" : `${categories.find(c => c.value === activeCategory)?.label} Events`}
              </h2>
              <p className="text-[12px] text-warm-gray mt-0.5">
                {events.length} event{events.length !== 1 ? "s" : ""} coming up
              </p>
            </div>
            <div className="space-y-3 stagger">
              {(activeCategory !== "all" ? events : upcomingEvents.length > 0 ? upcomingEvents : events).map((event) => (
                <EventCardRow key={event.id} event={event} />
              ))}
              {events.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-20 h-20 rounded-3xl bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
                    <span className="text-[40px]">📅</span>
                  </div>
                  <p className="font-heading font-bold text-[16px] mb-1">No events found</p>
                  <p className="text-[13px] text-warm-gray max-w-[240px] mx-auto">
                    Try a different category or check back soon for new events
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* ══════════════════════════════════════════════════
              BOTTOM CTA
              ══════════════════════════════════════════════════ */}
          <section className="px-5 mb-8">
            <div className="relative rounded-2xl overflow-hidden p-5 border border-gold/10">
              <div className="absolute inset-0" style={{
                background: `
                  linear-gradient(135deg, var(--color-royal) 0%, var(--color-deep) 100%),
                  radial-gradient(ellipse at 20% 80%, rgba(242,169,0,0.15) 0%, transparent 50%),
                  radial-gradient(ellipse at 80% 20%, rgba(139,92,246,0.08) 0%, transparent 40%)
                `,
              }} />
              <div className="pattern-dots absolute inset-0 opacity-15" />
              <div className="relative">
                <p className="text-gold text-[10px] font-bold tracking-[0.2em] uppercase mb-1">
                  Got something planned?
                </p>
                <h3 className="font-heading font-bold text-[18px] mb-1.5">
                  Host Your Event on Hub City
                </h3>
                <p className="font-display italic text-[13px] text-warm-gray leading-relaxed mb-4 max-w-[280px]">
                  Reach every citizen in Compton. List your event for free.
                </p>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1.5 bg-gold text-midnight px-5 py-2.5 rounded-xl text-[13px] font-bold press hover:bg-gold-light transition-colors"
                >
                  List an Event
                </Link>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════

/** Hot event card — for "Happening Today" */
function EventCardHot({ event }: { event: Event }) {
  const date = formatEventDate(event.start_date);
  const color = categoryColors[event.category] ?? "#F2A900";

  return (
    <Link href={`/events/${event.id}`} className="shrink-0 w-[280px] press group">
      <div className="relative rounded-2xl overflow-hidden border border-border-subtle">
        {/* Image */}
        <div className="h-[160px] relative">
          {event.image_url ? (
            <Image src={event.image_url} alt={event.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <Image src={categoryImages[event.category] ?? "/images/community-event.png"} alt={event.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/40 to-transparent" />

          {/* Live pulse */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-compton-red/80 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span className="text-[10px] font-bold text-white tracking-wider">TODAY</span>
          </div>

          {/* Time badge */}
          <div className="absolute top-3 right-3 bg-midnight/70 backdrop-blur-sm rounded-lg px-2.5 py-1">
            <p className="text-[11px] font-bold" style={{ color }}>{date.time}</p>
          </div>
        </div>

        <div className="p-3.5 bg-card">
          <h3 className="font-heading font-bold text-[14px] mb-1.5 line-clamp-1">{event.title}</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] text-warm-gray">
              <span>📍</span>
              <span className="truncate max-w-[140px]">{event.location_name ?? "Compton"}</span>
            </div>
            {(event.rsvp_count ?? 0) > 0 && (
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald" />
                <span className="text-[10px] text-emerald font-medium">{event.rsvp_count} going</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

/** Large card — for "This Week" horizontal scroller */
function EventCardLarge({ event }: { event: Event }) {
  const date = formatEventDate(event.start_date);
  const color = categoryColors[event.category] ?? "#F2A900";

  return (
    <Link href={`/events/${event.id}`} className="shrink-0 w-[220px] press group">
      <div className="relative rounded-2xl overflow-hidden border border-border-subtle">
        <div className="h-[130px] relative">
          {event.image_url ? (
            <Image src={event.image_url} alt={event.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <Image src={categoryImages[event.category] ?? "/images/community-event.png"} alt={event.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />

          {/* Date badge */}
          <div className="absolute top-2.5 left-2.5 bg-midnight/70 backdrop-blur-sm rounded-xl px-2.5 py-1.5 text-center min-w-[44px]">
            <p className="text-[9px] font-bold uppercase leading-none" style={{ color }}>{date.month}</p>
            <p className="text-[16px] font-bold leading-none mt-0.5">{date.day}</p>
          </div>

          {event.is_featured && (
            <div className="absolute top-2.5 right-2.5">
              <Badge label="Hot" variant="coral" />
            </div>
          )}
        </div>
        <div className="p-3 bg-card">
          <h3 className="font-heading font-bold text-[13px] mb-1 line-clamp-2">{event.title}</h3>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-warm-gray truncate">{event.location_name ?? date.weekday}</span>
            <span className="text-[10px] font-medium" style={{ color }}>{date.time}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

/** Featured card — large visual card for "Can't Miss" */
function EventCardFeatured({ event }: { event: Event }) {
  const date = formatEventDate(event.start_date);
  const color = categoryColors[event.category] ?? "#F2A900";

  return (
    <Link href={`/events/${event.id}`} className="block press group">
      <div className="relative rounded-2xl overflow-hidden border border-border-subtle">
        <div className="h-[200px] relative">
          {event.image_url ? (
            <Image src={event.image_url} alt={event.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <Image src={categoryImages[event.category] ?? "/images/community-event.png"} alt={event.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-midnight/40 to-transparent" />

          {/* Featured badge */}
          <div className="absolute top-3 left-3">
            <Badge label="Featured" variant="gold" size="md" shine />
          </div>

          {/* Date badge */}
          <div className="absolute top-3 right-3 bg-midnight/70 backdrop-blur-sm rounded-xl px-3 py-1.5 text-center min-w-[48px]">
            <p className="text-[10px] font-bold uppercase leading-none" style={{ color }}>{date.month}</p>
            <p className="text-[18px] font-bold leading-none mt-0.5">{date.day}</p>
          </div>

          {/* Bottom info overlay */}
          <div className="absolute bottom-0 inset-x-0 p-4">
            <h3 className="font-heading font-bold text-[18px] mb-2 drop-shadow-lg leading-tight">
              {event.title}
            </h3>
            <div className="flex items-center gap-3 text-[12px] text-warm-gray">
              {event.location_name && (
                <span className="flex items-center gap-1">📍 {event.location_name}</span>
              )}
              <span className="flex items-center gap-1">🕐 {date.time}</span>
            </div>
          </div>
        </div>

        <div className="p-3.5 bg-card flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge label={event.category} variant={categoryBadgeVariant[event.category] ?? "purple"} />
            {event.district && <Badge label={`District ${event.district}`} variant="cyan" />}
          </div>
          <div className="flex items-center gap-3">
            {(event.rsvp_count ?? 0) > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald" />
                <span className="text-[11px] text-emerald font-medium">{event.rsvp_count?.toLocaleString()} going</span>
              </div>
            )}
            <span
              className="px-3 py-1.5 rounded-xl text-[11px] font-bold press"
              style={{ background: `${color}20`, color }}
            >
              Get Tickets →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

/** Row card — for the main events list */
function EventCardRow({ event }: { event: Event }) {
  const date = formatEventDate(event.start_date);
  const color = categoryColors[event.category] ?? "#F2A900";

  return (
    <Link href={`/events/${event.id}`}>
      <Card hover>
        <div className="flex gap-3.5">
          {/* Date column — vibrant */}
          <div className="w-[52px] flex flex-col items-center justify-center shrink-0 rounded-xl py-2.5" style={{ background: `${color}12` }}>
            <span className="text-[10px] font-bold uppercase leading-none" style={{ color }}>
              {date.month}
            </span>
            <span className="text-[22px] font-bold leading-none mt-0.5" style={{ color }}>
              {date.day}
            </span>
            <span className="text-[9px] text-warm-gray mt-0.5">{date.weekday}</span>
          </div>

          {/* Event info */}
          <div className="flex-1 min-w-0 py-0.5">
            <h3 className="font-heading font-bold text-[14px] mb-1 line-clamp-1">
              {event.title}
            </h3>
            <div className="flex items-center gap-3 text-[11px] text-warm-gray mb-2">
              <span className="flex items-center gap-1">🕐 {date.time}</span>
              {event.location_name && (
                <span className="flex items-center gap-1 truncate">📍 {event.location_name}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge
                label={event.category}
                variant={categoryBadgeVariant[event.category] ?? "purple"}
              />
              {(event.rsvp_count ?? 0) > 0 && (
                <span className="text-[10px] text-emerald font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald" />
                  {event.rsvp_count} going
                </span>
              )}
              {event.is_featured && (
                <span className="text-[9px] text-gold font-bold">⭐ Featured</span>
              )}
            </div>
          </div>

          {/* Thumbnail */}
          <div className="w-[56px] h-[56px] rounded-xl shrink-0 overflow-hidden relative self-center">
            {event.image_url ? (
              <Image src={event.image_url} alt={event.title} fill className="object-cover" />
            ) : (
              <Image src={categoryImages[event.category] ?? "/images/community-event.png"} alt={event.title} fill className="object-cover" />
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
