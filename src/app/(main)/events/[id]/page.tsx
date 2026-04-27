import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import SaveButton from "@/components/ui/SaveButton";
import RSVPButton from "@/components/events/RSVPButton";
import Icon from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";
import { createClient } from "@/lib/supabase/server";
import { formatCents } from "@/lib/stripe";
import { isTicketSalesOpen, getTicketSalesMessage } from "@/lib/tickets";
import { buildOg } from "@/lib/og";
import { SITE_DOMAIN } from "@/lib/branding";
import type { Event, EventTicketConfig, Venue } from "@/types/database";

async function loadEvent(idOrSlug: string): Promise<Event | null> {
  const supabase = await createClient();
  const looksLikeUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      idOrSlug,
    );
  if (looksLikeUuid) {
    const { data } = await supabase
      .from("events")
      .select("*")
      .eq("id", idOrSlug)
      .maybeSingle();
    if (data) return data as Event;
  }
  const { data } = await supabase
    .from("events")
    .select("*")
    .eq("slug", idOrSlug)
    .maybeSingle();
  return (data as Event | null) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const ev = await loadEvent(id);
  if (!ev) return { title: "Event not found" };
  const meta = buildOg({
    title: ev.title,
    description: ev.description ?? `Compton event on ${ev.start_date}.`,
    image: ev.image_url ?? null,
    type: "article",
    path: `/events/${ev.slug || ev.id}`,
  });
  // Layer JSON-LD via `other` for crawlers.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: ev.title,
    startDate: ev.start_time
      ? `${ev.start_date}T${ev.start_time}`
      : ev.start_date,
    endDate: ev.end_date
      ? ev.end_time
        ? `${ev.end_date}T${ev.end_time}`
        : ev.end_date
      : undefined,
    location: ev.location_name
      ? {
          "@type": "Place",
          name: ev.location_name,
          address: ev.address || undefined,
        }
      : undefined,
    image: ev.image_url || undefined,
    description: ev.description || undefined,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    url: `${SITE_DOMAIN}/events/${ev.slug || ev.id}`,
  };
  return {
    ...meta,
    other: { "application/ld+json": JSON.stringify(jsonLd) },
  };
}

const categoryIcons: Record<string, IconName> = {
  city: "landmark",
  sports: "trophy",
  culture: "theater",
  community: "handshake",
  school: "book",
  youth: "sparkle",
  business: "briefcase",
  networking: "handshake",
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
  const ev = eventRow as Event;

  const { data: { user } } = await supabase.auth.getUser();

  let userRsvpStatus: string | null = null;
  if (user) {
    const { data: rsvp } = await supabase
      .from("event_rsvps")
      .select("status")
      .match({ event_id: ev.id, user_id: user.id })
      .maybeSingle();
    userRsvpStatus = rsvp?.status ?? null;
  }

  let ticketConfigs: (EventTicketConfig & {
    venue_section: { name: string; description: string | null; color: string | null } | null;
  })[] = [];
  let venue: Venue | null = null;

  if (ev.is_ticketed) {
    const { data: configs } = await supabase
      .from("event_ticket_config")
      .select("*, venue_section:venue_sections(*)")
      .eq("event_id", ev.id)
      .eq("is_active", true)
      .order("venue_section(sort_order)");
    ticketConfigs = (configs ?? []) as typeof ticketConfigs;

    if (ev.venue_id) {
      const { data: venueData } = await supabase
        .from("venues")
        .select("*")
        .eq("id", ev.venue_id)
        .maybeSingle();
      venue = (venueData as Venue | null) ?? null;
    }
  }

  const salesOpen = ev.is_ticketed ? isTicketSalesOpen(ev) : false;
  const salesMessage = ev.is_ticketed ? getTicketSalesMessage(ev) : null;
  const startDate = new Date(ev.start_date);
  const dayName = startDate.toLocaleDateString("en-US", { weekday: "long" });
  const monthName = startDate.toLocaleDateString("en-US", { month: "long" });
  const dayNum = startDate.getDate();
  const isToday = new Date().toDateString() === startDate.toDateString();

  const lowestPrice = ticketConfigs.length > 0
    ? Math.min(...ticketConfigs.filter((c) => c.available_count > 0).map((c) => c.price))
    : 0;
  const allSoldOut =
    ticketConfigs.length > 0 && ticketConfigs.every((c) => c.available_count <= 0);

  const categoryLabel = (ev.category || "event").toUpperCase();
  const timeLine = ev.start_time ? formatTime12h(ev.start_time) : "TBA";
  const categoryIcon = (categoryIcons[ev.category] ?? "calendar") as IconName;

  return (
    <article className="culture-surface min-h-dvh animate-fade-in pb-24">
      {/* Hero with overlaid back / save */}
      {ev.image_url ? (
        <div
          className="relative w-full aspect-[16/10] overflow-hidden"
          style={{ borderBottom: "2px solid var(--rule-strong-c)" }}
        >
          <Image
            src={ev.image_url}
            alt={ev.title}
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
            priority
          />
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/55 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 top-0 px-4 pt-4 flex items-center justify-between z-10">
            <Link
              href="/events"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.14em] press"
              style={{
                background: "rgba(0,0,0,0.55)",
                color: "#fff",
                border: "2px solid rgba(255,255,255,0.2)",
              }}
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M10 12L6 8l4-4" />
              </svg>
              Back
            </Link>
            <SaveButton itemType="event" itemId={ev.id} />
          </div>
        </div>
      ) : (
        <div className="px-5 pt-4 pb-3 flex items-center justify-between">
          <Link
            href="/events"
            className="c-kicker inline-flex items-center gap-1.5 press"
            style={{ color: "var(--ink-strong)" }}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M10 12L6 8l4-4" />
            </svg>
            Back
          </Link>
          <SaveButton itemType="event" itemId={ev.id} />
        </div>
      )}

      {/* Title block */}
      <div className="px-5 pt-5">
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <span className="c-kicker inline-flex items-center gap-1.5" style={{ color: "var(--ink-strong)", opacity: 0.7 }}>
            <Icon name={categoryIcon} size={11} style={{ color: "var(--ink-strong)" }} />
            § {categoryLabel}
          </span>
          {isToday && (
            <span className="c-badge c-badge-live" style={{ padding: "3px 7px", fontSize: 9 }}>
              LIVE TODAY
            </span>
          )}
          {ev.is_featured && (
            <span className="c-badge c-badge-gold" style={{ padding: "3px 7px", fontSize: 9 }}>
              FEATURED
            </span>
          )}
          {!ev.is_ticketed && (
            <span className="c-badge c-badge-ok" style={{ padding: "3px 7px", fontSize: 9 }}>
              FREE
            </span>
          )}
          {Array.isArray(ev.tags) &&
            ev.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="c-meta px-2 py-0.5"
                style={{
                  fontSize: 10,
                  color: "var(--ink-strong)",
                  background: "var(--paper-warm)",
                  border: "2px solid var(--rule-strong-c)",
                }}
              >
                {tag}
              </span>
            ))}
        </div>

        <h1 className="c-hero" style={{ fontSize: 32, lineHeight: 1.02, color: "var(--ink-strong)" }}>
          {ev.title}
        </h1>
      </div>

      {/* Description */}
      {ev.description && (
        <section className="px-5 mt-5">
          <p className="c-body" style={{ color: "var(--ink-strong)" }}>
            {ev.description}
          </p>
        </section>
      )}

      {/* Detail grid */}
      <section className="px-5 mt-6 grid grid-cols-3 gap-2.5">
        <DetailCard
          icon="calendar"
          label="Date"
          value={`${monthName.slice(0, 3)} ${dayNum}`}
          sub={dayName}
        />
        <DetailCard
          icon="clock"
          label="Time"
          value={timeLine}
          sub={ev.end_time ? `Until ${formatTime12h(ev.end_time)}` : "Doors open"}
        />
        <DetailCard
          icon="users"
          label="Going"
          value={ev.rsvp_count.toLocaleString()}
          sub="Attending"
        />
      </section>

      {/* Venue */}
      {(ev.location_name || ev.address || venue) && (
        <section className="px-5 mt-3">
          <div
            className="c-frame p-4 flex items-start gap-3"
            style={{ background: "var(--paper-warm)" }}
          >
            <Icon name="pin" size={18} style={{ color: "var(--ink-strong)", marginTop: 2 }} />
            <div className="flex-1 min-w-0">
              {ev.location_name && (
                <p className="c-card-t" style={{ fontSize: 14, color: "var(--ink-strong)" }}>
                  {ev.location_name}
                </p>
              )}
              {venue?.name && venue.name !== ev.location_name && (
                <p className="c-meta mt-0.5" style={{ fontSize: 11 }}>
                  {venue.name}
                </p>
              )}
              {ev.address && (
                <p className="c-meta mt-1" style={{ fontSize: 11 }}>
                  {ev.address}
                </p>
              )}
              {ev.address && (
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(ev.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="c-kicker inline-block mt-1"
                  style={{ fontSize: 9, color: "var(--ink-strong)" }}
                >
                  Open in Maps →
                </a>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Tickets / RSVP */}
      {ev.is_ticketed ? (
        <section className="px-5 mt-6">
          <div className="flex items-center justify-between mb-2">
            <p className="c-kicker" style={{ fontSize: 10, opacity: 0.7 }}>§ TICKETS</p>
            {allSoldOut && (
              <span className="c-badge c-badge-live" style={{ padding: "3px 7px", fontSize: 9 }}>
                SOLD OUT
              </span>
            )}
          </div>

          {ticketConfigs.length > 0 && (
            <div className="space-y-2 mb-4">
              {ticketConfigs.map((config) => {
                const section = config.venue_section;
                const isSoldOut = config.available_count <= 0;
                return (
                  <div
                    key={config.id}
                    className="p-3.5 flex items-center justify-between gap-3"
                    style={{
                      background: "var(--paper-warm)",
                      border: `2px solid ${isSoldOut ? "var(--rule-strong-c)" : "var(--gold-c)"}`,
                      opacity: isSoldOut ? 0.55 : 1,
                    }}
                  >
                    <div className="min-w-0">
                      <p className="c-card-t" style={{ fontSize: 14, color: "var(--ink-strong)" }}>
                        {section?.name ?? "General Admission"}
                      </p>
                      {section?.description && (
                        <p className="c-meta mt-0.5" style={{ fontSize: 11 }}>
                          {section.description}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="c-hero" style={{ fontSize: 18, lineHeight: 1, color: "var(--ink-strong)" }}>
                        {formatCents(config.price)}
                      </p>
                      <p className="c-meta mt-1" style={{ fontSize: 10 }}>
                        {isSoldOut ? "Sold out" : `${config.available_count} left`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {salesMessage && (
            <p className="c-meta text-center mb-3" style={{ fontSize: 11 }}>
              {salesMessage}
            </p>
          )}

          {salesOpen ? (
            <Link href={`/events/${ev.id}/tickets`} className="c-btn c-btn-primary press w-full block text-center">
              GET TICKETS{lowestPrice > 0 && isFinite(lowestPrice) ? ` — FROM ${formatCents(lowestPrice)}` : ""}
            </Link>
          ) : (
            <div
              className="p-3 text-center"
              style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)" }}
            >
              <p className="c-meta" style={{ fontSize: 12 }}>
                {salesMessage ?? "Tickets unavailable"}
              </p>
            </div>
          )}
        </section>
      ) : (
        <section className="px-5 mt-6">
          <p className="c-kicker mb-2" style={{ fontSize: 10, opacity: 0.7 }}>§ ATTEND</p>
          {user ? (
            <RSVPButton
              eventId={ev.id}
              initialStatus={userRsvpStatus as "going" | "interested" | "not_going" | null}
              rsvpCount={ev.rsvp_count}
            />
          ) : (
            <Link href={`/login?next=/events/${ev.id}`} className="c-btn c-btn-primary press w-full block text-center">
              SIGN IN TO RSVP
            </Link>
          )}
        </section>
      )}

      {/* Take it with you */}
      <section className="px-5 mt-6">
        <p className="c-kicker mb-2" style={{ fontSize: 10, opacity: 0.7 }}>§ TAKE IT WITH YOU</p>
        <div className="grid grid-cols-3 gap-2.5">
          <a
            href={`/api/events/${ev.id}/ical`}
            download="event.ics"
            className="press flex flex-col items-center gap-1.5 py-3"
            style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)" }}
          >
            <Icon name="calendar" size={16} style={{ color: "var(--ink-strong)" }} />
            <span className="c-kicker" style={{ fontSize: 9, color: "var(--ink-strong)" }}>
              CALENDAR
            </span>
          </a>
          <Link
            href={`/events/${ev.id}/share`}
            className="press flex flex-col items-center gap-1.5 py-3"
            style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)" }}
          >
            <Icon name="share" size={16} style={{ color: "var(--ink-strong)" }} />
            <span className="c-kicker" style={{ fontSize: 9, color: "var(--ink-strong)" }}>
              SHARE
            </span>
          </Link>
          <Link
            href="#"
            className="press flex flex-col items-center gap-1.5 py-3"
            style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)" }}
          >
            <Icon name="warning" size={16} style={{ color: "var(--ink-strong)" }} />
            <span className="c-kicker" style={{ fontSize: 9, color: "var(--ink-strong)" }}>
              REPORT
            </span>
          </Link>
        </div>
      </section>

      {/* Browse more */}
      <section className="px-5 mt-8">
        <Link
          href="/events"
          className="c-frame press block p-4"
          style={{ background: "var(--paper-warm)" }}
        >
          <p className="c-kicker" style={{ fontSize: 10, color: "var(--ink-strong)", opacity: 0.7 }}>§ BROWSE</p>
          <p className="c-card-t mt-1" style={{ fontSize: 14, color: "var(--ink-strong)" }}>
            Explore more {ev.category ?? "events"} happening around the city.
          </p>
          <p className="c-kicker mt-2" style={{ fontSize: 10, color: "var(--ink-strong)" }}>
            ALL EVENTS →
          </p>
        </Link>
      </section>
    </article>
  );
}

// ── Detail card ──────────────────────────────────────────────
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
      className="p-3 c-frame text-center"
      style={{ background: "var(--paper-warm)" }}
    >
      <div
        className="w-7 h-7 mx-auto mb-2 flex items-center justify-center"
        style={{ background: "var(--paper)", border: "2px solid var(--rule-strong-c)" }}
      >
        <Icon name={icon} size={13} style={{ color: "var(--ink-strong)" }} />
      </div>
      <p className="c-kicker" style={{ fontSize: 9, opacity: 0.7 }}>
        {label.toUpperCase()}
      </p>
      <p className="c-card-t mt-1" style={{ fontSize: 14, color: "var(--ink-strong)" }}>
        {value}
      </p>
      {sub && (
        <p className="c-meta mt-0.5" style={{ fontSize: 10 }}>
          {sub}
        </p>
      )}
    </div>
  );
}
