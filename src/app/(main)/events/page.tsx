"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import AdZone from "@/components/ui/AdZone";
import Icon from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import { useKnownCities } from "@/hooks/useActiveCity";
import CityFilterChip from "@/components/ui/CityFilterChip";
import TagFilterRow from "@/components/ui/TagFilterRow";
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
  // Default scope = ALL cities. Listener narrows via the CityFilterChip.
  const searchParams = useSearchParams();
  const cities = useKnownCities();
  const filterCitySlug = searchParams.get("city");
  const filterCity = useMemo(
    () => (filterCitySlug ? cities.find((c) => c.slug === filterCitySlug) ?? null : null),
    [filterCitySlug, cities],
  );
  const [activeCategory, setActiveCategory] = useState("all");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [heroIndex, setHeroIndex] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const LIST_LIMIT = 8;

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

      if (filterCity?.id) {
        query = query.eq("city_id", filterCity.id);
      }

      if (activeCategory !== "all") {
        query = query.eq("category", activeCategory);
      }

      if (tagFilter) {
        query = query.contains("tags", [tagFilter]);
      }

      const { data } = await query;
      setEvents((data as Event[]) ?? []);
      setShowAll(false);
      setLoading(false);
    }
    fetchEvents();
  }, [activeCategory, tagFilter, filterCity?.id]);

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
    <div className="culture-surface animate-fade-in min-h-dvh">
      {/* Culture Masthead — paper/ink */}
      <header
        className="px-[18px] pt-5 pb-5"
        style={{ borderBottom: "3px solid var(--rule-strong-c)" }}
      >
        <div className="c-kicker" style={{ opacity: 0.65 }}>
          § ISSUE EVENTS · {(filterCity?.name ?? "EVERYWHERE").toUpperCase()}
        </div>
        <h1
          className="c-display mt-2"
          style={{ fontSize: 72, lineHeight: 0.82, letterSpacing: "-0.02em" }}
        >
          EVENTS.
        </h1>
        <p
          className="c-serif-it mt-2"
          style={{ fontSize: 14, lineHeight: 1.45 }}
        >
          What&apos;s happening in {filterCity?.name ?? "your city"}.
        </p>
        <div className="mt-3"><CityFilterChip /></div>
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
            {/* Live chip when the hero event is today */}
            {isToday(heroEvent.start_date) && (
              <span
                className="c-badge c-badge-live inline-flex items-center gap-1.5 self-start mb-4"
              >
                <span
                  className="inline-block animate-pulse"
                  style={{ width: 6, height: 6, background: "#fff" }}
                />
                HAPPENING TODAY
              </span>
            )}

            {/* Category + date — gold chip + kicker */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="c-badge c-badge-gold">
                {heroEvent.category.toUpperCase()}
              </span>
              <span
                className="c-kicker"
                style={{
                  fontSize: 10,
                  letterSpacing: "0.18em",
                  color: "#fff",
                  opacity: 0.85,
                }}
              >
                {formatEventDate(heroEvent.start_date).full}
              </span>
            </div>

            {/* Title — c-hero with editorial . terminator */}
            <h1
              className="c-hero mb-3 max-w-[340px] drop-shadow-lg"
              style={{
                fontSize: 38,
                lineHeight: 0.92,
                letterSpacing: "-0.012em",
                color: "#fff",
              }}
            >
              {heroEvent.title.toUpperCase()}.
            </h1>

            {/* Thin gold rule under the title */}
            <span
              className="block mb-4"
              style={{ height: 2, width: 40, background: "var(--gold-c)" }}
            />

            {/* Location + RSVP — Inter body for readability over the photo */}
            <div
              className="flex items-center gap-4 mb-6 flex-wrap"
              style={{
                fontFamily: "var(--font-body), Inter, sans-serif",
                fontSize: 13,
                color: "rgba(255,255,255,0.8)",
              }}
            >
              {heroEvent.location_name && (
                <span className="flex items-center gap-1.5">
                  <Icon name="pin" size={14} className="text-gold" />
                  {heroEvent.location_name}
                </span>
              )}
              {(heroEvent.rsvp_count ?? 0) > 0 && (
                <span
                  className="flex items-center gap-1.5 tabular-nums"
                  style={{ color: "var(--gold-c)", fontWeight: 700 }}
                >
                  <Icon name="users" size={14} />
                  {heroEvent.rsvp_count?.toLocaleString()} going
                </span>
              )}
            </div>

            {/* CTA */}
            <div className="flex gap-3">
              <Link
                href={`/events/${heroEvent.id}`}
                className="c-btn c-btn-primary press"
              >
                Get Tickets
                <Icon name="arrow-right-thin" size={12} />
              </Link>
              <button className="c-btn c-btn-outline press">
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

      {/* Stats strip — 4 cells divided by 2px ink rules */}
      <div
        className="grid grid-cols-4 mb-6"
        style={{ borderBottom: "3px solid var(--rule-strong-c)" }}
      >
        {[
          { label: "EVENTS", value: events.length.toString() },
          { label: "TODAY", value: todayEvents.length.toString() },
          { label: "GOING", value: totalRSVP.toLocaleString() },
          { label: "FEATURED", value: featured.length.toString() },
        ].map((stat, i) => (
          <div
            key={stat.label}
            className="text-center"
            style={{
              padding: "14px 10px",
              borderRight: i < 3 ? "2px solid var(--rule-strong-c)" : "none",
              background: i === 0 ? "var(--gold-c)" : "var(--paper)",
            }}
          >
            <div
              className="c-display c-tabnum"
              style={{ fontSize: 22, lineHeight: 1 }}
            >
              {stat.value}
            </div>
            <div className="c-kicker mt-1.5" style={{ fontSize: 9 }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Interest tag filter — Hub City editorial chips */}
      <div className="px-[14px] mb-3">
        <p
          className="c-kicker mb-2 px-1"
          style={{
            fontSize: 10,
            letterSpacing: "0.18em",
            color: "var(--ink-strong)",
            opacity: 0.7,
          }}
        >
          § FILTER BY INTEREST
        </p>
        <TagFilterRow value={tagFilter} onChange={setTagFilter} />
      </div>

      {/* ══════════════════════════════════════════════════════
          CATEGORY FILTERS — Plain editorial chips
          ══════════════════════════════════════════════════════ */}
      <div className="c-noscroll flex gap-1.5 px-[14px] mb-6 overflow-x-auto pb-1">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.value;
          return (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`c-chip${isActive ? " gold" : ""} inline-flex items-center gap-1.5`}
            >
              <Icon name={cat.icon} size={12} />
              {cat.label.toUpperCase()}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="px-5 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-28" style={{ border: "2px solid var(--rule-strong-c)" }} />
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
                  <span
                    className="c-hero tabular-nums"
                    style={{ fontSize: 22, lineHeight: 1, color: "var(--gold-c)" }}
                  >
                    № 01
                  </span>
                  <span
                    className="c-kicker"
                    style={{
                      fontSize: 10,
                      letterSpacing: "0.18em",
                      color: "var(--ink-strong)",
                      opacity: 0.7,
                    }}
                  >
                    HAPPENING TODAY
                  </span>
                  <span
                    className="c-badge c-badge-live inline-flex items-center gap-1"
                    style={{ fontSize: 9 }}
                  >
                    <span
                      className="inline-block animate-pulse"
                      style={{ width: 5, height: 5, background: "#fff" }}
                    />
                    {todayEvents.length} LIVE
                  </span>
                  <span className="ml-auto rule-hairline flex-1 self-center" />
                </div>
                <p
                  className="c-meta mt-1"
                  style={{ fontSize: 11, color: "var(--ink-strong)", opacity: 0.6 }}
                >
                  Live events going on right now
                </p>
              </div>
              <div className="space-y-2.5 stagger px-5">
                {todayEvents.slice(0, 5).map((event) => (
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
                  <span
                    className="c-hero tabular-nums"
                    style={{ fontSize: 22, lineHeight: 1, color: "var(--gold-c)" }}
                  >
                    № {todayEvents.length > 0 ? "02" : "01"}
                  </span>
                  <span
                    className="c-kicker"
                    style={{
                      fontSize: 10,
                      letterSpacing: "0.18em",
                      color: "var(--ink-strong)",
                      opacity: 0.7,
                    }}
                  >
                    THIS WEEK
                  </span>
                  <span className="ml-auto rule-hairline flex-1 self-center" />
                  <span
                    className="c-badge c-badge-gold tabular-nums"
                    style={{ fontSize: 9 }}
                  >
                    {thisWeekEvents.length}
                  </span>
                </div>
                <p
                  className="c-meta mt-1"
                  style={{ fontSize: 11, color: "var(--ink-strong)", opacity: 0.6 }}
                >
                  Don&apos;t miss out
                </p>
              </div>
              <div className="space-y-2.5 stagger px-5">
                {thisWeekEvents.slice(0, 5).map((event) => (
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
                <span
                  className="c-hero tabular-nums"
                  style={{ fontSize: 22, lineHeight: 1, color: "var(--gold-c)" }}
                >
                  № {todayEvents.length > 0 && thisWeekEvents.length > 0 ? "03" : todayEvents.length > 0 || thisWeekEvents.length > 0 ? "02" : "01"}
                </span>
                <span
                  className="c-kicker"
                  style={{
                    fontSize: 10,
                    letterSpacing: "0.18em",
                    color: "var(--ink-strong)",
                    opacity: 0.7,
                  }}
                >
                  CAN&apos;T MISS
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
                <span
                  className="c-hero tabular-nums"
                  style={{ fontSize: 22, lineHeight: 1, color: "var(--gold-c)" }}
                >
                  № 04
                </span>
                <span
                  className="c-kicker"
                  style={{
                    fontSize: 10,
                    letterSpacing: "0.18em",
                    color: "var(--ink-strong)",
                    opacity: 0.7,
                  }}
                >
                  BROWSE BY CATEGORY
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
                      className="c-frame p-3.5 text-left press group"
                      style={{ background: "var(--paper)", border: "2px solid var(--rule-strong-c)" }}
                    >
                      <div
                        className="w-10 h-10 flex items-center justify-center mb-2.5"
                        style={{ background: "var(--ink-strong)" }}
                      >
                        <Icon name={cat.icon} size={18} style={{ color: "var(--gold-c)" }} />
                      </div>
                      <p className="c-card-t" style={{ fontSize: 15, color: "var(--ink-strong)" }}>{cat.label}</p>
                      <p className="c-kicker mt-1 tabular-nums">
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
            {(() => {
              const sourceList = activeCategory !== "all"
                ? events
                : upcomingEvents.length > 0
                ? upcomingEvents
                : events;
              const visibleList = showAll ? sourceList : sourceList.slice(0, LIST_LIMIT);
              const hiddenCount = Math.max(0, sourceList.length - visibleList.length);

              return (
                <>
                  <div className="flex items-baseline gap-3 mb-3">
                    <span
                      className="c-hero tabular-nums"
                      style={{ fontSize: 22, lineHeight: 1, color: "var(--gold-c)" }}
                    >
                      № 05
                    </span>
                    <span
                      className="c-kicker"
                      style={{
                        fontSize: 10,
                        letterSpacing: "0.18em",
                        color: "var(--ink-strong)",
                        opacity: 0.7,
                      }}
                    >
                      {(activeCategory === "all"
                        ? "All Upcoming"
                        : `${categories.find((c) => c.value === activeCategory)?.label ?? ""} Events`).toUpperCase()}
                    </span>
                    <span className="ml-auto rule-hairline flex-1 self-center" />
                    <span
                      className="c-badge c-badge-gold tabular-nums"
                      style={{ fontSize: 9 }}
                    >
                      {visibleList.length}/{sourceList.length}
                    </span>
                  </div>

                  <div className="space-y-2.5 stagger">
                    {visibleList.map((event) => (
                      <EventListRow key={event.id} event={event} />
                    ))}

                    {events.length === 0 && (
                      <div className="text-center py-16">
                        <div
                          className="w-16 h-16 flex items-center justify-center mx-auto mb-4"
                          style={{ background: "var(--ink-strong)" }}
                        >
                          <Icon name="calendar" size={28} style={{ color: "var(--gold-c)" }} />
                        </div>
                        <p className="c-card-t mb-1" style={{ color: "var(--ink-strong)" }}>No events found</p>
                        <p className="c-meta max-w-[240px] mx-auto">
                          Try a different category or check back soon for new events
                        </p>
                      </div>
                    )}
                  </div>

                  {hiddenCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowAll(true)}
                      className="c-btn c-btn-outline w-full press mt-4"
                    >
                      SHOW {hiddenCount} MORE
                    </button>
                  )}
                  {showAll && sourceList.length > LIST_LIMIT && (
                    <button
                      type="button"
                      onClick={() => setShowAll(false)}
                      className="c-btn c-btn-outline w-full press mt-4"
                    >
                      SHOW LESS
                    </button>
                  )}
                </>
              );
            })()}
          </section>

          {/* ══════════════════════════════════════════════════
              BOTTOM CTA — Host your event
              ══════════════════════════════════════════════════ */}
          <section className="px-5 mb-8">
            <div className="c-frame relative overflow-hidden p-5" style={{ background: "var(--paper)", border: "2px solid var(--rule-strong-c)" }}>
              <div className="relative">
                <div
                  className="w-10 h-10 flex items-center justify-center mb-3"
                  style={{ background: "var(--ink-strong)" }}
                >
                  <Icon name="calendar" size={20} style={{ color: "var(--gold-c)" }} />
                </div>
                <p className="c-kicker mb-1">
                  Got something planned?
                </p>
                <h3 className="c-card-t mb-1.5" style={{ fontSize: 22, color: "var(--ink-strong)" }}>
                  Host Your Event
                </h3>
                <p className="c-body mb-4 max-w-[280px]">
                  Reach every citizen in {filterCity?.name ?? "your city"}. List your event for free.
                </p>
                <Link
                  href="/dashboard"
                  className="c-btn c-btn-primary c-btn-sm press"
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
      <div className="c-frame p-3.5 transition-colors relative overflow-hidden" style={{ background: "var(--paper)", border: "2px solid var(--rule-strong-c)" }}>
        {live && (
          <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: "var(--gold-c)" }} />
        )}
        <div className="flex items-center gap-3">
          {/* Editorial date block */}
          <div
            className="w-12 h-14 flex flex-col items-center justify-center shrink-0"
            style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)" }}
          >
            <p className="c-kicker leading-none" style={{ fontSize: 9 }}>
              {date.month}
            </p>
            <p className="c-card-t mt-1 tabular-nums" style={{ fontSize: 20, color: "var(--ink-strong)" }}>
              {date.day}
            </p>
          </div>

          {/* Middle — title + meta */}
          <div className="flex-1 min-w-0">
            <h3 className="c-card-t line-clamp-1" style={{ fontSize: 17, color: "var(--ink-strong)" }}>
              {event.title}
            </h3>
            <div className="flex items-center gap-1.5 c-meta mt-0.5 truncate">
              <Icon name="clock" size={11} style={{ color: "var(--ink-strong)", opacity: 0.7 }} />
              <span>{date.time}</span>
              {event.location_name && (
                <>
                  <span className="w-0.5 h-0.5 rounded-full" style={{ background: "var(--ink-strong)", opacity: 0.4 }} />
                  <span className="truncate">{event.location_name}</span>
                </>
              )}
            </div>
            {/* Tags row */}
            <div className="flex items-center gap-1.5 flex-wrap mt-2">
              <span className="c-badge c-badge-gold">
                {event.category.toUpperCase()}
              </span>
              {live && (
                <span
                  className="c-badge c-badge-live inline-flex items-center gap-1"
                  style={{ fontSize: 9 }}
                >
                  <span
                    className="inline-block animate-pulse"
                    style={{ width: 4, height: 4, background: "#fff" }}
                  />
                  LIVE
                </span>
              )}
              {event.is_featured && (
                <span
                  className="c-badge c-badge-gold inline-flex items-center gap-1"
                  style={{ fontSize: 9 }}
                >
                  <Icon name="star" size={8} />
                  FEATURED
                </span>
              )}
              {(event.rsvp_count ?? 0) > 0 && (
                <span
                  className="inline-flex items-center gap-1 tabular-nums"
                  style={{
                    fontFamily: "var(--font-archivo), Archivo, sans-serif",
                    fontWeight: 800,
                    fontSize: 10,
                    color: "var(--gold-c)",
                  }}
                >
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
      <div className="relative c-frame overflow-hidden" style={{ background: "var(--paper)", border: "2px solid var(--rule-strong-c)" }}>
        <div className="h-[200px] relative">
          {event.image_url ? (
            <Image src={event.image_url} alt={event.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <Image src={categoryImages[event.category] ?? "/images/community-event.png"} alt={event.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-midnight/50 to-transparent" />

          {/* Featured chip */}
          <div className="absolute top-3 left-3">
            <span className="c-badge c-badge-gold inline-flex items-center gap-1">
              <Icon name="star" size={9} />
              FEATURED
            </span>
          </div>

          {/* Editorial date block */}
          <div
            className="absolute top-3 right-3 w-12 h-14 flex flex-col items-center justify-center"
            style={{ background: "var(--paper)", border: "2px solid var(--rule-strong-c)" }}
          >
            <p className="c-kicker leading-none" style={{ fontSize: 9 }}>
              {date.month}
            </p>
            <p className="c-card-t mt-1 tabular-nums" style={{ fontSize: 20, color: "var(--ink-strong)" }}>
              {date.day}
            </p>
          </div>

          {/* Bottom info overlay */}
          <div className="absolute bottom-0 inset-x-0 p-4">
            <h3
              className="c-hero mb-2 drop-shadow-lg"
              style={{
                fontSize: 22,
                lineHeight: 0.95,
                letterSpacing: "-0.008em",
                color: "#fff",
              }}
            >
              {event.title.toUpperCase()}.
            </h3>
            <span
              className="block mb-2"
              style={{ height: 2, width: 32, background: "var(--gold-c)" }}
            />
            <div
              className="flex items-center gap-3"
              style={{
                fontFamily: "var(--font-body), Inter, sans-serif",
                fontSize: 12,
                color: "rgba(255,255,255,0.8)",
              }}
            >
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

        <div
          className="p-3.5 flex items-center justify-between gap-2"
          style={{
            background: "var(--paper-warm)",
            borderTop: "2px solid var(--rule-strong-c)",
          }}
        >
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="c-badge c-badge-gold">
              {event.category.toUpperCase()}
            </span>
            {event.district && (
              <span
                className="c-badge"
                style={{
                  background: "var(--paper)",
                  color: "var(--ink-strong)",
                  border: "1px solid var(--rule-strong-c)",
                }}
              >
                DIST. {event.district}
              </span>
            )}
            {(event.rsvp_count ?? 0) > 0 && (
              <span
                className="inline-flex items-center gap-1 tabular-nums"
                style={{
                  fontFamily: "var(--font-archivo), Archivo, sans-serif",
                  fontWeight: 800,
                  fontSize: 10,
                  color: "var(--gold-c)",
                }}
              >
                <Icon name="users" size={10} />
                {event.rsvp_count?.toLocaleString()} GOING
              </span>
            )}
          </div>
          <span className="c-badge c-badge-gold inline-flex items-center gap-1 shrink-0">
            TICKETS
            <Icon name="arrow-right-thin" size={11} />
          </span>
        </div>
      </div>
    </Link>
  );
}
