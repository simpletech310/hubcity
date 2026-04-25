import { notFound } from "next/navigation";
import Link from "next/link";
import SaveButton from "@/components/ui/SaveButton";
import RSVPButton from "@/components/events/RSVPButton";
import Icon from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";
import {
  HeroBlock,
  EditorialNumber,
  SectionKicker,
  SnapCarousel,
  EditorialCard,
  Tag,
  IssueDivider,
} from "@/components/ui/editorial";
import { createClient } from "@/lib/supabase/server";
import { formatCents } from "@/lib/stripe";
import { isTicketSalesOpen, getTicketSalesMessage } from "@/lib/tickets";
import type { Event, EventTicketConfig, Venue } from "@/types/database";

const categoryIcons: Record<string, IconName> = {
  city: "landmark",
  sports: "trophy",
  culture: "theater",
  community: "handshake",
  school: "book",
  youth: "sparkle",
};

function formatTime12h(time: string): string {
  const [h, m] = time.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${hour12}:${m} ${ampm}`;
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const looksLikeUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  let eventRow = null;
  if (looksLikeUuid) {
    const { data } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
    eventRow = data;
  }
  if (!eventRow) {
    const { data } = await supabase.from("events").select("*").eq("slug", id).maybeSingle();
    eventRow = data;
  }
  if (!eventRow) notFound();
  const event = eventRow;
  const ev = event as Event;

  const { data: { user } } = await supabase.auth.getUser();

  let userRsvpStatus: string | null = null;
  if (user) {
    const { data: rsvp } = await supabase
      .from("event_rsvps")
      .select("status")
      .match({ event_id: event.id, user_id: user.id })
      .single();
    userRsvpStatus = rsvp?.status ?? null;
  }

  let ticketConfigs: (EventTicketConfig & { venue_section: { name: string; description: string | null; color: string | null } | null })[] = [];
  let venue: Venue | null = null;

  if (ev.is_ticketed) {
    const { data: configs } = await supabase
      .from("event_ticket_config")
      .select("*, venue_section:venue_sections(*)")
      .eq("event_id", event.id)
      .eq("is_active", true)
      .order("venue_section(sort_order)");
    ticketConfigs = (configs ?? []) as typeof ticketConfigs;

    if (ev.venue_id) {
      const { data: venueData } = await supabase
        .from("venues")
        .select("*")
        .eq("id", ev.venue_id)
        .single();
      venue = venueData as Venue | null;
    }
  }

  const salesOpen = ev.is_ticketed ? isTicketSalesOpen(ev) : false;
  const salesMessage = ev.is_ticketed ? getTicketSalesMessage(ev) : null;
  const startDate = new Date(ev.start_date);
  const dayName = startDate.toLocaleDateString("en-US", { weekday: "long" });
  const monthName = startDate.toLocaleDateString("en-US", { month: "long" });
  const dayNum = startDate.getDate();
  const year = startDate.getFullYear();
  const isToday = new Date().toDateString() === startDate.toDateString();

  const lowestPrice = ticketConfigs.length > 0
    ? Math.min(...ticketConfigs.filter(c => c.available_count > 0).map(c => c.price))
    : 0;
  const allSoldOut = ticketConfigs.length > 0 && ticketConfigs.every(c => c.available_count <= 0);

  const categoryLabel = (ev.category || "event").toUpperCase();
  const dateLine = `${monthName} ${dayNum}, ${year}`;
  const timeLine = ev.start_time ? formatTime12h(ev.start_time) : "TBA";

  return (
    <article className="culture-surface animate-fade-in pb-safe min-h-dvh">

      {/* ── HERO (dark overlay — ivory text is intentional here) ── */}
      <div className="relative">
        <HeroBlock image={ev.image_url ?? null} aspect="3/2" alt={ev.title}>
          {/* Back button */}
          <div className="absolute top-4 left-4 z-20">
            <Link
              href="/events"
              className="w-9 h-9 flex items-center justify-center press"
              style={{
                background: "var(--paper)",
                border: "2px solid var(--rule-strong-c)",
              }}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ color: "var(--ink-strong)" }}>
                <path d="M11 13L7 9l4-4" />
              </svg>
            </Link>
          </div>
          <div className="absolute top-4 right-4 z-20">
            <SaveButton itemType="event" itemId={ev.id} />
          </div>

          {/* Hero bottom overlay — DARK SURFACE: ivory stays correct */}
          <div className="absolute inset-x-0 bottom-0 px-6 pb-7 z-10">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <SectionKicker tone="gold">{categoryLabel}</SectionKicker>
              {ev.is_featured && <Tag tone="gold" size="sm">Featured</Tag>}
              {isToday && <Tag tone="coral" size="sm">Live Today</Tag>}
              {ev.district && <Tag tone="default" size="sm">{ev.district}</Tag>}
            </div>
            <h1 className="font-display text-[38px] sm:text-[52px] leading-[0.95] tracking-tight text-ivory max-w-[26ch]">
              {ev.title}
            </h1>
            <div className="mt-5" style={{ height: 3, width: 48, background: "var(--gold-c)" }} />
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[11px] uppercase tracking-editorial-tight">
              <span style={{ color: "#fff" }}>{dayName}, {monthName} {dayNum}</span>
              <span style={{ color: "rgba(255,255,255,0.4)" }}>·</span>
              <span style={{ color: "rgba(255,255,255,0.75)" }}>{timeLine}</span>
              {ev.location_name && (
                <>
                  <span style={{ color: "rgba(255,255,255,0.4)" }}>·</span>
                  <span className="truncate max-w-[18ch]" style={{ color: "rgba(255,255,255,0.75)" }}>{ev.location_name}</span>
                </>
              )}
            </div>
          </div>
        </HeroBlock>
      </div>

      {/* ── BYLINE STRIP ── */}
      <div
        className="px-5 py-4 flex items-center gap-4"
        style={{ borderBottom: "2px solid var(--rule-strong-c)" }}
      >
        <EditorialNumber n={1} size="sm" />
        <SectionKicker tone="gold">Feature · {categoryLabel}</SectionKicker>
        <div className="flex-1" style={{ height: 2, background: "var(--rule-strong-c)", opacity: 0.2 }} />
        <span
          style={{
            fontFamily: "var(--font-archivo), Archivo, sans-serif",
            fontWeight: 700,
            fontSize: 10,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--ink-strong)",
            opacity: 0.45,
            whiteSpace: "nowrap",
          }}
        >
          {dateLine}
        </span>
      </div>

      {/* ── DESCRIPTION ── */}
      {ev.description && (
        <section className="px-5 mt-8 max-w-[68ch]">
          <p
            className="c-serif-it leading-snug"
            style={{
              fontSize: 22,
              color: "var(--ink-strong)",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-dm-serif), DM Serif Display, serif",
                fontSize: 56,
                float: "left",
                marginRight: 6,
                marginTop: 4,
                lineHeight: 1,
                color: "var(--gold-c)",
              }}
            >
              {ev.description[0]}
            </span>
            {ev.description.slice(1)}
          </p>
        </section>
      )}

      {/* ── PULL QUOTE ── */}
      {ev.description && ev.description.length > 180 && (
        <aside className="px-5 mt-8 max-w-[68ch]">
          <div style={{ borderLeft: "3px solid var(--gold-c)", paddingLeft: 20, paddingTop: 8, paddingBottom: 8 }}>
            <p
              className="c-serif-it leading-snug"
              style={{ fontSize: 22, color: "var(--ink-strong)" }}
            >
              &ldquo;{ev.title}&rdquo;
            </p>
            <p
              style={{
                marginTop: 8,
                fontFamily: "var(--font-archivo), Archivo, sans-serif",
                fontWeight: 700,
                fontSize: 10,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--gold-c)",
              }}
            >
              {dayName}, {monthName} {dayNum} · {timeLine}
            </p>
          </div>
        </aside>
      )}

      {/* ── SECTION 01 · DETAILS ── */}
      <section className="px-5 mt-10">
        <div className="mb-4 flex items-baseline gap-3">
          <EditorialNumber n={1} size="md" />
          <SectionKicker tone="muted">The Details</SectionKicker>
        </div>
        <div style={{ height: 2, background: "var(--rule-strong-c)", marginBottom: 20 }} />

        <div className="grid grid-cols-3 gap-2.5">
          {/* Date */}
          <DetailCard
            icon="calendar"
            label="Date"
            value={`${monthName.slice(0, 3)} ${dayNum}`}
            sub={dayName}
          />
          {/* Time */}
          <DetailCard
            icon="clock"
            label="Time"
            value={timeLine}
            sub={ev.end_time ? `Until ${formatTime12h(ev.end_time)}` : "Doors open"}
          />
          {/* Attending */}
          <DetailCard
            icon="users"
            label="Going"
            value={ev.rsvp_count.toLocaleString()}
            sub="Attending"
          />
        </div>

        {/* Location */}
        {ev.location_name && (
          <div
            className="mt-2.5 p-4 flex items-center gap-3.5"
            style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)" }}
          >
            <div
              className="w-12 h-12 flex items-center justify-center shrink-0"
              style={{ background: "var(--paper)", border: "2px solid var(--rule-strong-c)" }}
            >
              <Icon name="pin" size={20} style={{ color: "var(--gold-c)" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p
                style={{
                  fontFamily: "var(--font-archivo), Archivo, sans-serif",
                  fontWeight: 700,
                  fontSize: 9,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "var(--ink-strong)",
                  opacity: 0.5,
                }}
              >
                Venue
              </p>
              <p className="c-card-t mt-0.5 truncate" style={{ fontSize: 18 }}>
                {ev.location_name}
              </p>
              {ev.address && (
                <p className="c-body-sm truncate mt-0.5" style={{ opacity: 0.65 }}>{ev.address}</p>
              )}
              {venue && (
                <p style={{
                  fontFamily: "var(--font-archivo), Archivo, sans-serif",
                  fontWeight: 700,
                  fontSize: 10,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "var(--gold-c)",
                  marginTop: 4,
                }}>
                  {venue.name}
                </p>
              )}
            </div>
          </div>
        )}
      </section>

      {/* ── SECTION 02 · TICKETS / ATTEND ── */}
      {ev.is_ticketed ? (
        <section className="px-5 mt-10">
          <div className="mb-4 flex items-baseline gap-3">
            <EditorialNumber n={2} size="md" />
            <SectionKicker tone="muted">Tickets</SectionKicker>
            {allSoldOut && (
              <Tag tone="coral" size="sm" className="ml-auto">Sold Out</Tag>
            )}
          </div>
          <div style={{ height: 2, background: "var(--rule-strong-c)", marginBottom: 20 }} />

          {ticketConfigs.length > 0 && (
            <div className="space-y-2 mb-5">
              {ticketConfigs.map((config) => {
                const section = config.venue_section;
                const isSoldOut = config.available_count <= 0;
                return (
                  <div
                    key={config.id}
                    className="p-4 flex items-center justify-between gap-3"
                    style={{
                      background: "var(--paper)",
                      border: `2px solid ${isSoldOut ? "var(--rule-strong-c)" : "var(--gold-c)"}`,
                      opacity: isSoldOut ? 0.5 : 1,
                    }}
                  >
                    <div className="min-w-0">
                      <p
                        style={{
                          fontFamily: "var(--font-archivo), Archivo, sans-serif",
                          fontWeight: 700,
                          fontSize: 9,
                          letterSpacing: "0.14em",
                          textTransform: "uppercase",
                          color: "var(--ink-strong)",
                          opacity: 0.5,
                        }}
                      >
                        Section
                      </p>
                      <p className="c-card-t mt-0.5 truncate" style={{ fontSize: 20 }}>
                        {section?.name ?? "General Admission"}
                      </p>
                      {section?.description && (
                        <p className="c-body-sm truncate mt-1" style={{ opacity: 0.65 }}>{section.description}</p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="c-hero" style={{ fontSize: 22, color: "var(--gold-c)", lineHeight: 1 }}>
                        {formatCents(config.price)}
                      </p>
                      <div className="mt-2">
                        {isSoldOut ? (
                          <Tag tone="coral" size="xs">Sold Out</Tag>
                        ) : (
                          <Tag tone="gold" size="xs">{config.available_count} left</Tag>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {salesMessage && (
            <p
              style={{
                fontFamily: "var(--font-archivo), Archivo, sans-serif",
                fontWeight: 700,
                fontSize: 11,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--ink-strong)",
                opacity: 0.5,
                textAlign: "center",
                marginBottom: 16,
              }}
            >
              {salesMessage}
            </p>
          )}

          {salesOpen ? (
            <Link
              href={`/events/${ev.id}/tickets`}
              className="c-btn c-btn-primary block w-full text-center press"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-heading font-bold text-base leading-none">GET TICKETS</p>
                  {lowestPrice > 0 && isFinite(lowestPrice) && (
                    <p style={{ fontSize: 11, fontWeight: 600, marginTop: 6, letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.7 }}>
                      From {formatCents(lowestPrice)}
                    </p>
                  )}
                </div>
                <div className="w-10 h-10 flex items-center justify-center" style={{ border: "2px solid currentColor" }}>
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M5 10h10M12 6l4 4-4 4" />
                  </svg>
                </div>
              </div>
            </Link>
          ) : (
            <div
              className="p-4 text-center"
              style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)" }}
            >
              <p className="c-body-sm" style={{ opacity: 0.6 }}>
                {salesMessage ?? "Tickets Unavailable"}
              </p>
            </div>
          )}
        </section>
      ) : (
        <section className="px-5 mt-10">
          <div className="mb-4 flex items-baseline gap-3">
            <EditorialNumber n={2} size="md" />
            <SectionKicker tone="muted">Attend</SectionKicker>
            <Tag tone="gold" size="sm" className="ml-auto">Free</Tag>
          </div>
          <div style={{ height: 2, background: "var(--rule-strong-c)", marginBottom: 20 }} />

          <div
            className="p-4"
            style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)" }}
          >
            {user ? (
              <RSVPButton
                eventId={ev.id}
                initialStatus={userRsvpStatus as "going" | "interested" | "not_going" | null}
                rsvpCount={ev.rsvp_count}
              />
            ) : (
              <Link
                href="/login"
                className="c-btn c-btn-primary block w-full text-center press"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-heading font-bold text-base leading-none">SIGN IN TO RSVP</p>
                    <p style={{ fontSize: 11, fontWeight: 600, marginTop: 6, letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.7 }}>
                      Join the community
                    </p>
                  </div>
                  <div className="w-10 h-10 flex items-center justify-center" style={{ border: "2px solid currentColor" }}>
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M5 10h10M12 6l4 4-4 4" />
                    </svg>
                  </div>
                </div>
              </Link>
            )}
          </div>
        </section>
      )}

      {/* ── SECTION 03 · SHARE ── */}
      <section className="px-5 mt-10">
        <div className="mb-4 flex items-baseline gap-3">
          <EditorialNumber n={3} size="md" />
          <SectionKicker tone="muted">Take it With You</SectionKicker>
        </div>
        <div style={{ height: 2, background: "var(--rule-strong-c)", marginBottom: 20 }} />

        <div className="grid grid-cols-3 gap-2.5">
          <a
            href={`/api/events/${ev.id}/ical`}
            download="event.ics"
            className="press flex flex-col items-center gap-2 py-4"
            style={{
              background: "var(--paper-warm)",
              border: "2px solid var(--rule-strong-c)",
            }}
          >
            <Icon name="calendar" size={18} style={{ color: "var(--gold-c)" }} />
            <span
              style={{
                fontFamily: "var(--font-archivo), Archivo, sans-serif",
                fontWeight: 700,
                fontSize: 10,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--ink-strong)",
                opacity: 0.65,
              }}
            >
              Calendar
            </span>
          </a>
          <button
            className="press flex flex-col items-center gap-2 py-4"
            style={{
              background: "var(--paper-warm)",
              border: "2px solid var(--rule-strong-c)",
            }}
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: "var(--gold-c)" }}>
              <path d="M4 8v5a1 1 0 001 1h6a1 1 0 001-1V8M8 2v8M5 5l3-3 3 3" />
            </svg>
            <span
              style={{
                fontFamily: "var(--font-archivo), Archivo, sans-serif",
                fontWeight: 700,
                fontSize: 10,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--ink-strong)",
                opacity: 0.65,
              }}
            >
              Share
            </span>
          </button>
          <button
            className="press flex flex-col items-center gap-2 py-4"
            style={{
              background: "var(--paper-warm)",
              border: "2px solid var(--rule-strong-c)",
            }}
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: "var(--gold-c)" }}>
              <circle cx="9" cy="9" r="8" /><path d="M9 6v4M9 12h0" />
            </svg>
            <span
              style={{
                fontFamily: "var(--font-archivo), Archivo, sans-serif",
                fontWeight: 700,
                fontSize: 10,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--ink-strong)",
                opacity: 0.65,
              }}
            >
              Report
            </span>
          </button>
        </div>
      </section>

      {/* ── END DIVIDER ── */}
      <IssueDivider label="END" />

      {/* ── RELATED RAIL ── */}
      <SnapCarousel
        number={4}
        kicker="Also in the Issue"
        seeAllHref="/events"
        seeAllLabel="All events →"
        className="pb-10"
      >
        <div className="snap-start shrink-0 w-[220px]">
          <div
            className="p-5 h-[140px] flex flex-col justify-between"
            style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)" }}
          >
            <SectionKicker tone="gold">Browse</SectionKicker>
            <p className="c-card-t" style={{ fontSize: 16, lineHeight: 1.25 }}>
              Explore more {categoryIcons[ev.category] ? ev.category : "events"} happening around the city.
            </p>
          </div>
        </div>
      </SnapCarousel>

    </article>
  );
}

// ── Detail cell card ──────────────────────────────────────────
function DetailCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: IconName;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div
      className="p-4 flex flex-col gap-3"
      style={{ background: "var(--paper)", border: "2px solid var(--rule-strong-c)" }}
    >
      <div
        className="w-9 h-9 flex items-center justify-center"
        style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)" }}
      >
        <Icon name={icon} size={16} style={{ color: "var(--gold-c)" }} />
      </div>
      <div className="min-w-0">
        <p
          style={{
            fontFamily: "var(--font-archivo), Archivo, sans-serif",
            fontWeight: 700,
            fontSize: 9,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--ink-strong)",
            opacity: 0.45,
          }}
        >
          {label}
        </p>
        <p className="c-card-t mt-0.5" style={{ fontSize: 17, lineHeight: 1.1 }}>
          {value}
        </p>
        {sub && (
          <p className="c-body-sm mt-0.5" style={{ opacity: 0.55 }}>{sub}</p>
        )}
      </div>
    </div>
  );
}
