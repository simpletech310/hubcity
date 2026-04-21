"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import AdZone from "@/components/ui/AdZone";
import Icon from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";
import Tag from "@/components/ui/editorial/Tag";
import { createClient } from "@/lib/supabase/client";
import { useActiveCity } from "@/hooks/useActiveCity";
import type { Event } from "@/types/database";

const categories: { label: string; value: string; icon: IconName }[] = [
  { label: "All", value: "all", icon: "flame" },
  { label: "City", value: "city", icon: "landmark" },
  { label: "Sports", value: "sports", icon: "trophy" },
  { label: "Culture", value: "culture", icon: "theater" },
  { label: "Community", value: "community", icon: "handshake" },
  { label: "Business", value: "business", icon: "briefcase" },
  { label: "Networking", value: "networking", icon: "handshake" },
  { label: "School", value: "school", icon: "book" },
  { label: "Youth", value: "youth", icon: "sparkle" },
];

const categoryImages: Record<string, string> = {
  community: "/images/christmas-parade.png",
  sports: "/images/football-night.png",
  culture: "/images/community-event.png",
  city: "/images/city-hall.png",
  youth: "/images/community-event.png",
  school: "/images/community-event.png",
  business: "/images/community-event.png",
  networking: "/images/community-event.png",
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
  const activeCity = useActiveCity();
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
        .or("visibility.eq.public,visibility.is.null")
        .order("is_featured", { ascending: false })
        .order("start_date", { ascending: true });

      if (activeCity?.id) {
        query = query.eq("city_id", activeCity.id);
      }

      if (activeCategory !== "all") {
        query = query.eq("category", activeCategory);
      }

      const { data } = await query;
      setEvents((data as Event[]) ?? []);
      setLoading(false);
    }
    fetchEvents();
  }, [activeCategory, activeCity?.id]);

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
      {/* Editorial Masthead */}
      <header className="relative px-5 pt-6 pb-6 border-b border-white/[0.08] panel-editorial">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[10px] font-bold uppercase tracking-editorial text-gold tabular-nums">
            VOL · 01 · ISSUE EVENTS
          </span>
          <span className="block w-1 h-1 rounded-full bg-gold/60" />
          <span className="text-[10px] font-bold uppercase tracking-editorial text-white/40">
            {activeCity?.name?.toUpperCase() ?? "EVERYWHERE"}
          </span>
        </div>
        <h1 className="masthead text-white text-[44px]">EVENTS.</h1>
        <div className="mt-3 flex items-center gap-3">
          <span className="block h-[2px] w-8 bg-gold" />
          <span className="text-[10px] font-bold uppercase tracking-editorial text-ivory/60">
            What&apos;s happening in {activeCity?.name ?? "your city"}
          </span>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════
          HERO BANNER — Cinematic event spotlight (editorial)
          ══════════════════════════════════════════════════════ */}
      {heroEvent && (
        <div className="relative mb-8">
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
            <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/75 to-midnight/30" />
            <div className="absolute inset-0 bg-gradient-to-r from-midnight/60 to-transparent" />
            {/* Subtle grain for editorial feel */}
            <div
              className="absolute inset-0 opacity-[0.06] mix-blend-overlay pointer-events-none"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.9 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.6'/%3E%3C/svg%3E\")",
              }}
            />
          </div>

          <div className="relative z-10 px-5 pt-8 pb-8 min-h-[360px] flex flex-col justify-end">
            {/* Live tag if today — coral IS the status color */}
            {isToday(heroEvent.start_date) && (
              <div className="inline-flex self-start items-center gap-2 px-3 py-1.5 rounded-lg bg-coral/20 border border-coral/40 mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-coral animate-pulse" />
                <span className="font-heading text-[10px] font-bold text-coral tracking-[0.1em]">
                  HAPPENING TODAY
                </span>
              </div>
            )}

            {/* Category + date — gold only, no per-category tint */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <Tag tone="gold" size="sm">
                {heroEvent.category}
              </Tag>
              <span className="text-[11px] font-bold uppercase tracking-editorial text-ivory/70">
                {formatEventDate(heroEvent.start_date).full}
              </span>
            </div>

            {/* Title — editorial display */}
            <h1 className="font-display text-[36px] leading-[0.95] tracking-tight mb-3 text-white max-w-[340px] drop-shadow-lg">
              {heroEvent.title}
            </h1>

            {/* Thin gold rule under the title */}
            <span className="block h-[2px] w-10 bg-gold mb-4" />

            {/* Location + RSVP */}
            <div className="flex items-center gap-4 text-[12px] text-ivory/70 mb-6 flex-wrap">
              {heroEvent.location_name && (
                <span className="flex items-center gap-1.5">
                  <Icon name="pin" size={14} className="text-gold" />
                  {heroEvent.location_name}
                </span>
              )}
              {(heroEvent.rsvp_count ?? 0) > 0 && (
                <span className="flex items-center gap-1.5 text-gold tabular-nums font-semibold">
                  <Icon name="users" size={14} />
                  {heroEvent.rsvp_count?.toLocaleString()} going
                </span>
              )}
            </div>

            {/* CTA */}
            <div className="flex gap-3">
              <Link
                href={`/events/${heroEvent.id}`}
                className="inline-flex items-center gap-2 bg-gold text-midnight px-5 py-3 rounded-xl uppercase tracking-editorial-tight text-[11px] font-bold press hover:bg-gold-light transition-colors shadow-lg shadow-gold/20"
              >
                Get Tickets
                <Icon name="arrow-right-thin" size={12} />
              </Link>
              <button className="inline-flex items-center gap-2 border border-gold/40 text-white px-5 py-3 rounded-xl uppercase tracking-editorial-tight text-[11px] font-bold press hover:bg-gold/10 transition-colors">
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
                      i === heroIndex % featured.length ? "w-8 bg-gold" : "w-3 bg-white/15"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          QUICK STATS BAR — Editorial
          ══════════════════════════════════════════════════════ */}
      <div className="px-5 mb-6">
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Events", value: events.length.toString() },
            { label: "Today", value: todayEvents.length.toString() },
            { label: "Going", value: totalRSVP.toLocaleString() },
            { label: "Featured", value: featured.length.toString() },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl panel-editorial p-2.5 text-center">
              <p className="font-display text-[20px] leading-none text-gold tabular-nums">{stat.value}</p>
              <p className="text-[9px] text-ivory/45 uppercase tracking-editorial-tight font-semibold mt-1.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          CATEGORY FILTERS — Plain editorial chips
          ══════════════════════════════════════════════════════ */}
      <div className="flex gap-2 px-5 mb-6 overflow-x-auto scrollbar-hide pb-1">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.value;
          return (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`inline-flex items-center gap-1.5 shrink-0 rounded-full px-3.5 py-2 text-[11px] font-bold uppercase tracking-editorial-tight transition-colors press ${
                isActive
                  ? "bg-gold text-midnight border border-gold"
                  : "panel-editorial text-ivory/70 border border-white/[0.08] hover:border-gold/30 hover:text-white"
              }`}
            >
              <Icon name={cat.icon} size={13} />
              {cat.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="px-5 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-28 rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          {/* ══════════════════════════════════════════════════
              № 01 — HAPPENING TODAY
              ══════════════════════════════════════════════════ */}
          {todayEvents.length > 0 && (
            <section className="mb-8">
              <div className="px-5 mb-3">
                <div className="flex items-baseline gap-3">
                  <span className="font-display text-gold text-[22px] leading-none tabular-nums">
                    № 01
                  </span>
                  <span className="text-[10px] font-bold tracking-editorial uppercase text-white/50">
                    Happening Today
                  </span>
                  <Tag tone="coral" size="xs">
                    <span className="w-1 h-1 rounded-full bg-coral animate-pulse" />
                    {todayEvents.length} live
                  </Tag>
                  <span className="ml-auto rule-hairline flex-1 self-center" />
                </div>
                <p className="text-[11px] text-ivory/40 mt-1">Live events going on right now</p>
              </div>
              <div className="space-y-2.5 stagger px-5">
                {todayEvents.map((event) => (
                  <EventListRow key={event.id} event={event} live />
                ))}
              </div>
            </section>
          )}

          {/* ══════════════════════════════════════════════════
              № 02 — THIS WEEK
              ══════════════════════════════════════════════════ */}
          {thisWeekEvents.length > 0 && (
            <section className="mb-8">
              <div className="px-5 mb-3">
                <div className="flex items-baseline gap-3">
                  <span className="font-display text-gold text-[22px] leading-none tabular-nums">
                    № {todayEvents.length > 0 ? "02" : "01"}
                  </span>
                  <span className="text-[10px] font-bold tracking-editorial uppercase text-white/50">
                    This Week
                  </span>
                  <span className="ml-auto rule-hairline flex-1 self-center" />
                  <span className="text-[10px] font-bold tracking-editorial uppercase text-gold tabular-nums whitespace-nowrap">
                    {thisWeekEvents.length}
                  </span>
                </div>
                <p className="text-[11px] text-ivory/40 mt-1">Don&apos;t miss out</p>
              </div>
              <div className="space-y-2.5 stagger px-5">
                {thisWeekEvents.map((event) => (
                  <EventListRow key={event.id} event={event} />
                ))}
              </div>
            </section>
          )}

          {/* ══════════════════════════════════════════════════
              FEATURED EVENTS — Editorial feature cards
              ══════════════════════════════════════════════════ */}
          {featured.length > 0 && activeCategory === "all" && (
            <section className="px-5 mb-8">
              <div className="flex items-baseline gap-3 mb-3">
                <span className="font-display text-gold text-[22px] leading-none tabular-nums">
                  № {todayEvents.length > 0 && thisWeekEvents.length > 0 ? "03" : todayEvents.length > 0 || thisWeekEvents.length > 0 ? "02" : "01"}
                </span>
                <span className="text-[10px] font-bold tracking-editorial uppercase text-white/50">
                  Can&apos;t Miss
                </span>
                <span className="ml-auto rule-hairline flex-1 self-center" />
              </div>
              <div className="space-y-3">
                {featured.slice(0, 3).map((event) => (
                  <EventCardFeatured key={event.id} event={event} />
                ))}
              </div>
            </section>
          )}

          {/* Ad Zone */}
          <div className="px-5 mb-8">
            <AdZone zone="feed_banner" />
          </div>

          {/* ══════════════════════════════════════════════════
              BROWSE BY CATEGORY — Editorial grid
              ══════════════════════════════════════════════════ */}
          {activeCategory === "all" && (
            <section className="px-5 mb-8">
              <div className="flex items-baseline gap-3 mb-3">
                <span className="font-display text-gold text-[22px] leading-none tabular-nums">
                  № 04
                </span>
                <span className="text-[10px] font-bold tracking-editorial uppercase text-white/50">
                  Browse by Category
                </span>
                <span className="ml-auto rule-hairline flex-1 self-center" />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {categories.slice(1).map((cat) => {
                  const catEvents = events.filter((e) => e.category === cat.value);
                  return (
                    <button
                      key={cat.value}
                      onClick={() => setActiveCategory(cat.value)}
                      className="rounded-xl panel-editorial p-3.5 text-left press hover:border-gold/30 transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-lg border border-gold/20 bg-ink flex items-center justify-center mb-2.5 group-hover:border-gold/40 transition-colors">
                        <Icon name={cat.icon} size={18} className="text-gold" />
                      </div>
                      <p className="font-display text-[15px] leading-tight text-white">{cat.label}</p>
                      <p className="text-[10px] font-semibold uppercase tracking-editorial-tight text-gold/70 mt-1 tabular-nums">
                        {catEvents.length} {catEvents.length === 1 ? "event" : "events"}
                      </p>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* ══════════════════════════════════════════════════
              № 05 — ALL UPCOMING / FILTERED LIST
              ══════════════════════════════════════════════════ */}
          <section className="px-5 mb-8">
            <div className="flex items-baseline gap-3 mb-3">
              <span className="font-display text-gold text-[22px] leading-none tabular-nums">
                № 05
              </span>
              <span className="text-[10px] font-bold tracking-editorial uppercase text-white/50">
                {activeCategory === "all" ? "All Upcoming" : `${categories.find(c => c.value === activeCategory)?.label ?? ""} Events`}
              </span>
              <span className="ml-auto rule-hairline flex-1 self-center" />
              <span className="text-[10px] font-bold tracking-editorial uppercase text-ivory/50 tabular-nums whitespace-nowrap">
                {events.length}
              </span>
            </div>
            <div className="space-y-2.5 stagger">
              {(activeCategory !== "all" ? events : upcomingEvents.length > 0 ? upcomingEvents : events).map((event) => (
                <EventListRow key={event.id} event={event} />
              ))}
              {events.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-gold/15 flex items-center justify-center mx-auto mb-4">
                    <Icon name="calendar" size={28} className="text-gold" />
                  </div>
                  <p className="font-display text-[17px] text-white mb-1">No events found</p>
                  <p className="text-[12px] text-ivory/55 max-w-[240px] mx-auto">
                    Try a different category or check back soon for new events
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* ══════════════════════════════════════════════════
              BOTTOM CTA — Host your event
              ══════════════════════════════════════════════════ */}
          <section className="px-5 mb-8">
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
                  <Icon name="calendar" size={20} className="text-gold" />
                </div>
                <p className="text-[10px] font-bold tracking-editorial uppercase text-gold mb-1">
                  Got something planned?
                </p>
                <h3 className="font-display text-[22px] leading-tight text-white mb-1.5">
                  Host Your Event
                </h3>
                <p className="text-[12px] text-ivory/55 leading-relaxed mb-4 max-w-[280px]">
                  Reach every citizen in {activeCity?.name ?? "your city"}. List your event for free.
                </p>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 bg-gold text-midnight rounded-xl px-4 py-2.5 text-[11px] font-bold uppercase tracking-editorial-tight press hover:bg-gold-light transition-colors"
                >
                  List an Event
                  <Icon name="arrow-right-thin" size={12} />
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
// SUB-COMPONENTS — All editorial, no per-category color
// ═══════════════════════════════════════════════════════════

/** Editorial list row — the dominant card style for event lists */
function EventListRow({ event, live = false }: { event: Event; live?: boolean }) {
  const date = formatEventDate(event.start_date);

  return (
    <Link
      href={`/events/${event.id}`}
      className="block press group"
    >
      <div className="rounded-2xl panel-editorial p-3.5 transition-colors hover:border-gold/30 relative overflow-hidden">
        {live && (
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-coral" />
        )}
        <div className="flex items-center gap-3">
          {/* Editorial date block */}
          <div className="w-12 h-14 rounded-xl border border-gold/20 bg-ink flex flex-col items-center justify-center shrink-0">
            <p className="text-[9px] font-bold uppercase tracking-editorial-tight leading-none text-gold">
              {date.month}
            </p>
            <p className="font-display text-[20px] leading-none mt-1 text-white tabular-nums">
              {date.day}
            </p>
          </div>

          {/* Middle — title + meta */}
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-[17px] leading-tight text-white group-hover:text-gold transition-colors line-clamp-1">
              {event.title}
            </h3>
            <div className="flex items-center gap-1.5 text-[11px] text-ivory/55 mt-0.5 truncate">
              <Icon name="clock" size={11} className="text-gold/70" />
              <span>{date.time}</span>
              {event.location_name && (
                <>
                  <span className="w-0.5 h-0.5 rounded-full bg-ivory/40" />
                  <span className="truncate">{event.location_name}</span>
                </>
              )}
            </div>
            {/* Tags row */}
            <div className="flex items-center gap-1.5 flex-wrap mt-2">
              <Tag tone="gold" size="xs">
                {event.category}
              </Tag>
              {live && (
                <Tag tone="coral" size="xs">
                  <span className="w-1 h-1 rounded-full bg-coral animate-pulse" />
                  Live
                </Tag>
              )}
              {event.is_featured && (
                <Tag tone="gold" size="xs">
                  <Icon name="star" size={8} />
                  Featured
                </Tag>
              )}
              {(event.rsvp_count ?? 0) > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] text-gold font-semibold tabular-nums">
                  <Icon name="users" size={10} />
                  {event.rsvp_count}
                </span>
              )}
            </div>
          </div>

          {/* Right — gold chevron */}
          <Icon
            name="arrow-right-thin"
            size={14}
            className="text-gold/60 group-hover:text-gold transition-colors shrink-0"
          />
        </div>
      </div>
    </Link>
  );
}

/** Featured card — big visual card for "Can't Miss" */
function EventCardFeatured({ event }: { event: Event }) {
  const date = formatEventDate(event.start_date);

  return (
    <Link href={`/events/${event.id}`} className="block press group">
      <div className="relative rounded-2xl overflow-hidden panel-editorial hover:border-gold/30 transition-colors">
        <div className="h-[200px] relative">
          {event.image_url ? (
            <Image src={event.image_url} alt={event.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <Image src={categoryImages[event.category] ?? "/images/community-event.png"} alt={event.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-midnight/50 to-transparent" />

          {/* Featured tag */}
          <div className="absolute top-3 left-3">
            <Tag tone="gold" size="sm">
              <Icon name="star" size={9} />
              Featured
            </Tag>
          </div>

          {/* Editorial date block */}
          <div className="absolute top-3 right-3 w-12 h-14 rounded-xl border border-gold/30 bg-ink/80 backdrop-blur-sm flex flex-col items-center justify-center">
            <p className="text-[9px] font-bold uppercase tracking-editorial-tight leading-none text-gold">
              {date.month}
            </p>
            <p className="font-display text-[20px] leading-none mt-1 text-white tabular-nums">
              {date.day}
            </p>
          </div>

          {/* Bottom info overlay */}
          <div className="absolute bottom-0 inset-x-0 p-4">
            <h3 className="font-display text-[22px] leading-tight text-white mb-2 drop-shadow-lg">
              {event.title}
            </h3>
            <span className="block h-[2px] w-8 bg-gold mb-2" />
            <div className="flex items-center gap-3 text-[11px] text-ivory/70">
              {event.location_name && (
                <span className="flex items-center gap-1">
                  <Icon name="pin" size={11} className="text-gold" />
                  {event.location_name}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Icon name="clock" size={11} className="text-gold" />
                {date.time}
              </span>
            </div>
          </div>
        </div>

        <div className="p-3.5 flex items-center justify-between gap-2 bg-ink/40">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Tag tone="gold" size="xs">{event.category}</Tag>
            {event.district && (
              <Tag tone="default" size="xs">District {event.district}</Tag>
            )}
            {(event.rsvp_count ?? 0) > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] text-gold font-semibold tabular-nums">
                <Icon name="users" size={10} />
                {event.rsvp_count?.toLocaleString()} going
              </span>
            )}
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-editorial-tight bg-gold/15 text-gold group-hover:bg-gold group-hover:text-midnight transition-colors shrink-0">
            Tickets
            <Icon name="arrow-right-thin" size={11} />
          </span>
        </div>
      </div>
    </Link>
  );
}
