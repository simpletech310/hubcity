import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import SaveButton from "@/components/ui/SaveButton";
import RSVPButton from "@/components/events/RSVPButton";
import Icon from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";
import { createClient } from "@/lib/supabase/server";
import { formatCents } from "@/lib/stripe";
import { isTicketSalesOpen, getTicketSalesMessage } from "@/lib/tickets";
import type { Event, EventTicketConfig, Venue } from "@/types/database";

const categoryColors: Record<string, string> = {
  city: "#F2A900",
  sports: "#22C55E",
  culture: "#FF006E",
  community: "#8B5CF6",
  school: "#3B82F6",
  youth: "#06B6D4",
};

const categoryGradients: Record<string, string> = {
  city: "from-gold/30 via-gold/10 to-transparent",
  sports: "from-emerald/30 via-emerald/10 to-transparent",
  culture: "from-pink/30 via-pink/10 to-transparent",
  community: "from-hc-purple/30 via-hc-purple/10 to-transparent",
  school: "from-hc-blue/30 via-hc-blue/10 to-transparent",
  youth: "from-cyan/30 via-cyan/10 to-transparent",
};

const categoryIcons: Record<string, IconName> = {
  city: "landmark",
  sports: "trophy",
  culture: "theater",
  community: "handshake",
  school: "book",
  youth: "sparkle",
};

const categoryBadgeVariant: Record<string, "purple" | "coral" | "cyan" | "gold" | "emerald" | "blue" | "pink"> = {
  city: "gold",
  sports: "emerald",
  culture: "pink",
  community: "purple",
  school: "blue",
  youth: "cyan",
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

  // Accept either a slug or a UUID. UUIDs match /^[0-9a-f-]{36}$/; anything
  // else tries the slug column first.
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

  // Fetch user's existing RSVP status (if logged in)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userRsvpStatus: string | null = null;
  if (user) {
    const { data: rsvp } = await supabase
      .from("event_rsvps")
      .select("status")
      .match({ event_id: event.id, user_id: user.id })
      .single();
    userRsvpStatus = rsvp?.status ?? null;
  }

  // Fetch ticket configs if ticketed
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
  const accentColor = categoryColors[ev.category] || "#F2A900";
  const startDate = new Date(ev.start_date);
  const dayName = startDate.toLocaleDateString("en-US", { weekday: "long" });
  const monthName = startDate.toLocaleDateString("en-US", { month: "long" });
  const dayNum = startDate.getDate();
  const year = startDate.getFullYear();
  const isToday = new Date().toDateString() === startDate.toDateString();

  // Lowest price for ticket CTA
  const lowestPrice = ticketConfigs.length > 0
    ? Math.min(...ticketConfigs.filter(c => c.available_count > 0).map(c => c.price))
    : 0;
  const allSoldOut = ticketConfigs.length > 0 && ticketConfigs.every(c => c.available_count <= 0);

  return (
    <div className="animate-fade-in pb-safe">
      {/* ── Cinematic Hero ── */}
      <div className="relative h-72 overflow-hidden">
        {ev.image_url ? (
          <Image src={ev.image_url} alt={ev.title} fill className="object-cover" />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${categoryGradients[ev.category] || "from-gold/20 to-deep"} pattern-dots`}>
            <div className="absolute inset-0 flex items-center justify-center">
              <Icon name={categoryIcons[ev.category] || "calendar"} size={72} className="opacity-30" />
            </div>
          </div>
        )}

        {/* Multi-layer gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-midnight/40 to-transparent" />

        {/* Back button - floating glass */}
        <div className="absolute top-4 left-4 z-10">
          <Link
            href="/events"
            className="w-9 h-9 rounded-full glass flex items-center justify-center press"
          >
            <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
              <path d="M11 13L7 9l4-4" />
            </svg>
          </Link>
        </div>

        {/* Save button - floating glass */}
        <div className="absolute top-4 right-4 z-10">
          <SaveButton itemType="event" itemId={ev.id} />
        </div>

        {/* Featured badge */}
        {ev.is_featured && (
          <div className="absolute top-4 left-16 z-10">
            <Badge label="Featured" variant="gold" size="md" shine />
          </div>
        )}

        {/* Hero bottom content */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-5 z-10">
          {/* Category + Live badge */}
          <div className="flex items-center gap-2 mb-2.5">
            <Badge
              label={ev.category}
              variant={categoryBadgeVariant[ev.category] ?? "gold"}
              size="md"
            />
            {isToday && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-compton-red/20 border border-compton-red/30">
                <div className="w-1.5 h-1.5 rounded-full bg-compton-red pulse-glow" />
                <span className="text-[10px] font-bold text-compton-red uppercase tracking-wide">Today</span>
              </div>
            )}
            {ev.district && (
              <Badge label={`District ${ev.district}`} variant="cyan" size="sm" />
            )}
          </div>

          {/* Title */}
          <h1 className="font-heading text-2xl font-bold leading-tight drop-shadow-lg">
            {ev.title}
          </h1>
        </div>
      </div>

      {/* ── Quick Info Strip ── */}
      <div className="px-5 -mt-1">
        <div
          className="rounded-2xl p-4 border border-border-subtle relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${accentColor}08, ${accentColor}03)` }}
        >
          {/* Accent top bar */}
          <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: accentColor }} />

          <div className="grid grid-cols-3 gap-3">
            {/* Date */}
            <div className="text-center">
              <div className="w-10 h-10 rounded-xl mx-auto mb-1.5 flex items-center justify-center" style={{ background: `${accentColor}15` }}>
                <Icon name="calendar" size={18} style={{ color: accentColor }} />
              </div>
              <p className="text-[11px] font-bold" style={{ color: accentColor }}>
                {monthName.slice(0, 3).toUpperCase()} {dayNum}
              </p>
              <p className="text-[10px] text-txt-secondary">{dayName}</p>
            </div>

            {/* Time */}
            <div className="text-center">
              <div className="w-10 h-10 rounded-xl mx-auto mb-1.5 flex items-center justify-center" style={{ background: `${accentColor}15` }}>
                <Icon name="clock" size={18} style={{ color: accentColor }} />
              </div>
              <p className="text-[11px] font-bold" style={{ color: accentColor }}>
                {ev.start_time ? formatTime12h(ev.start_time) : "TBA"}
              </p>
              <p className="text-[10px] text-txt-secondary">
                {ev.end_time ? `Until ${formatTime12h(ev.end_time)}` : "Start time"}
              </p>
            </div>

            {/* Attendees */}
            <div className="text-center">
              <div className="w-10 h-10 rounded-xl mx-auto mb-1.5 flex items-center justify-center" style={{ background: `${accentColor}15` }}>
                <Icon name="users" size={18} style={{ color: accentColor }} />
              </div>
              <p className="text-[11px] font-bold" style={{ color: accentColor }}>
                {ev.rsvp_count.toLocaleString()}
              </p>
              <p className="text-[10px] text-txt-secondary">Going</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Location Card ── */}
      {ev.location_name && (
        <div className="px-5 mt-4">
          <div className="rounded-2xl bg-card border border-border-subtle p-4 flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-compton-red/10 flex items-center justify-center shrink-0">
              <Icon name="pin" size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{ev.location_name}</p>
              {ev.address && (
                <p className="text-xs text-txt-secondary truncate mt-0.5">{ev.address}</p>
              )}
              {venue && (
                <p className="text-[10px] text-gold mt-1 font-semibold">{venue.name}</p>
              )}
            </div>
            <div className="shrink-0">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-txt-secondary">
                  <path d="M5 2l5 5-5 5" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── About Section ── */}
      {ev.description && (
        <div className="px-5 mt-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-5 rounded-full" style={{ background: accentColor }} />
            <h2 className="font-heading font-bold text-base">About This Event</h2>
          </div>
          <p className="text-[13px] text-txt-secondary leading-relaxed">
            {ev.description}
          </p>
        </div>
      )}

      {/* ── Divider ── */}
      <div className="px-5 mt-6 mb-5">
        <div className="divider-subtle" />
      </div>

      {/* ── Ticketed Events ── */}
      {ev.is_ticketed ? (
        <div className="px-5 mb-8">
          {/* Section header */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 rounded-full bg-gold" />
            <h2 className="font-heading font-bold text-base">Tickets</h2>
            {allSoldOut && (
              <span className="ml-auto text-xs text-coral font-semibold">Sold Out</span>
            )}
          </div>

          {/* Ticket Section Cards */}
          {ticketConfigs.length > 0 && (
            <div className="space-y-3 mb-5">
              {ticketConfigs.map((config) => {
                const section = config.venue_section;
                const isSoldOut = config.available_count <= 0;
                const sectionColor = section?.color || accentColor;
                return (
                  <div
                    key={config.id}
                    className={`rounded-2xl bg-card border border-border-subtle p-4 relative overflow-hidden ${isSoldOut ? "opacity-50" : ""}`}
                  >
                    {/* Left accent */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: sectionColor }} />

                    <div className="flex items-center justify-between gap-3 pl-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: sectionColor, boxShadow: `0 0 0 2px var(--color-card), 0 0 0 3px ${sectionColor}40` }}
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-bold truncate">
                            {section?.name ?? "General Admission"}
                          </p>
                          {section?.description && (
                            <p className="text-[11px] text-txt-secondary truncate mt-0.5">{section.description}</p>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-base font-bold" style={{ color: sectionColor }}>
                          {formatCents(config.price)}
                        </p>
                        {isSoldOut ? (
                          <span className="text-[10px] text-coral font-semibold">Sold Out</span>
                        ) : (
                          <span className="text-[10px] text-emerald font-semibold">
                            {config.available_count} left
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {salesMessage && (
            <p className="text-xs text-txt-secondary mb-4 text-center">{salesMessage}</p>
          )}

          {/* CTA Button */}
          {salesOpen ? (
            <Link href={`/events/${ev.id}/tickets`}>
              <div className="rounded-2xl bg-gradient-to-r from-gold to-gold-light p-4 flex items-center justify-between press">
                <div>
                  <p className="text-midnight font-bold text-base">Get Tickets</p>
                  {lowestPrice > 0 && isFinite(lowestPrice) && (
                    <p className="text-midnight/70 text-xs font-medium">
                      From {formatCents(lowestPrice)}
                    </p>
                  )}
                </div>
                <div className="w-10 h-10 rounded-xl bg-midnight/10 flex items-center justify-center">
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-midnight">
                    <path d="M5 10h10M12 6l4 4-4 4" />
                  </svg>
                </div>
              </div>
            </Link>
          ) : (
            <div className="rounded-2xl bg-card border border-border-subtle p-4 text-center">
              <p className="text-txt-secondary text-sm font-medium">
                {salesMessage ?? "Tickets Unavailable"}
              </p>
            </div>
          )}
        </div>
      ) : (
        /* ── Free / RSVP Events ── */
        <div className="px-5 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 rounded-full bg-emerald" />
            <h2 className="font-heading font-bold text-base">Attend</h2>
            <span className="ml-auto text-xs text-emerald font-bold px-2.5 py-0.5 rounded-full bg-emerald/10">FREE</span>
          </div>

          {user ? (
            <div className="rounded-2xl bg-card border border-border-subtle p-4">
              <RSVPButton
                eventId={ev.id}
                initialStatus={userRsvpStatus as "going" | "interested" | "not_going" | null}
                rsvpCount={ev.rsvp_count}
              />
            </div>
          ) : (
            <Link href="/login">
              <div className="rounded-2xl bg-gradient-to-r from-gold to-gold-light p-4 flex items-center justify-between press">
                <div>
                  <p className="text-midnight font-bold text-base">Sign In to RSVP</p>
                  <p className="text-midnight/70 text-xs font-medium">Join the community</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-midnight/10 flex items-center justify-center">
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-midnight">
                    <path d="M5 10h10M12 6l4 4-4 4" />
                  </svg>
                </div>
              </div>
            </Link>
          )}
        </div>
      )}

      {/* ── Share / Calendar / Report Strip ── */}
      <div className="px-5 mb-8">
        <div className="flex items-center gap-3">
          <a
            href={`/api/events/${ev.id}/ical`}
            download="event.ics"
            className="flex-1 bg-white/5 border border-border-subtle rounded-xl px-4 py-2.5 flex items-center justify-center gap-2 press"
          >
            <Icon name="calendar" size={14} />
            <span className="text-xs font-semibold text-txt-secondary">Add to Calendar</span>
          </a>
          <button className="flex-1 rounded-xl bg-card border border-border-subtle py-3 flex items-center justify-center gap-2 press">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-txt-secondary">
              <path d="M4 8v5a1 1 0 001 1h6a1 1 0 001-1V8M8 2v8M5 5l3-3 3 3" />
            </svg>
            <span className="text-xs font-semibold text-txt-secondary">Share</span>
          </button>
          <button className="flex-1 rounded-xl bg-card border border-border-subtle py-3 flex items-center justify-center gap-2 press">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-txt-secondary">
              <path d="M3 3h10v10H3z" />
              <path d="M8 6v4M8 12h0" />
            </svg>
            <span className="text-xs font-semibold text-txt-secondary">Report</span>
          </button>
        </div>
      </div>
    </div>
  );
}
