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

  const categoryLabel = (ev.category || "event").toUpperCase();
  const dateLine = `${monthName} ${dayNum}, ${year}`;
  const timeLine = ev.start_time ? formatTime12h(ev.start_time) : "TBA";

  return (
    <article className="culture-surface animate-fade-in pb-safe min-h-dvh">
      {/* ── Cover ── */}
      <div className="relative">
        <HeroBlock image={ev.image_url ?? null} aspect="3/2" alt={ev.title}>
          {/* Floating controls live above the hero chrome */}
          <div className="absolute top-4 left-4 z-20">
            <Link
              href="/events"
              className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center press"
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-ivory">
                <path d="M11 13L7 9l4-4" />
              </svg>
            </Link>
          </div>
          <div className="absolute top-4 right-4 z-20">
            <SaveButton itemType="event" itemId={ev.id} />
          </div>

          {/* Hero bottom — kicker, title, gold rule, meta */}
          <div className="absolute inset-x-0 bottom-0 px-6 pb-7 z-10">
            <div className="flex items-center gap-2 mb-3">
              <SectionKicker tone="gold">{categoryLabel}</SectionKicker>
              {ev.is_featured && <Tag tone="gold" size="sm">Featured</Tag>}
              {isToday && <Tag tone="coral" size="sm">Live Today</Tag>}
              {ev.district && <Tag tone="default" size="sm">District {ev.district}</Tag>}
            </div>

            <h1 className="font-display text-[38px] sm:text-[52px] leading-[0.95] tracking-tight text-ivory max-w-[26ch]">
              {ev.title}
            </h1>

            <div className="mt-5 h-px w-16 bg-gold" />

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[11px] uppercase tracking-editorial-tight text-ivory/70">
              <span className="text-ivory">{dayName}, {monthName} {dayNum}</span>
              <span className="text-ivory/40">·</span>
              <span>{timeLine}</span>
              {ev.location_name && (
                <>
                  <span className="text-ivory/40">·</span>
                  <span className="truncate max-w-[18ch]">{ev.location_name}</span>
                </>
              )}
            </div>
          </div>
        </HeroBlock>
      </div>

      {/* ── Byline Strip ── */}
      <div className="px-5 mt-6 flex items-baseline gap-4">
        <EditorialNumber n={1} size="sm" />
        <SectionKicker tone="gold">Feature · {categoryLabel}</SectionKicker>
        <span className="flex-1 h-px bg-gradient-to-r from-gold/40 via-gold/15 to-transparent" />
        <span className="text-[10px] uppercase tracking-editorial-tight text-ivory/55 whitespace-nowrap">
          {dateLine}
        </span>
      </div>

      {/* ── Body — Magazine Column ── */}
      {ev.description && (
        <section className="px-5 mt-8 max-w-[68ch]">
          <p className="font-display text-[22px] leading-snug text-ivory first-letter:font-display first-letter:text-[56px] first-letter:float-left first-letter:mr-2 first-letter:mt-1 first-letter:text-gold first-letter:leading-none">
            {ev.description}
          </p>
        </section>
      )}

      {/* Pull quote — a highlighted tagline from the event copy */}
      {ev.description && ev.description.length > 180 && (
        <aside className="px-5 mt-8 max-w-[68ch]">
          <div className="border-l-2 border-gold pl-5 py-2">
            <p className="font-display text-[24px] leading-snug text-ivory/90">
              &ldquo;{ev.title}&rdquo;
            </p>
            <p className="mt-2 text-[10px] uppercase tracking-editorial text-gold">
              {dayName}, {monthName} {dayNum} · {timeLine}
            </p>
          </div>
        </aside>
      )}

      {/* ── Section 01 · Details ── */}
      <section className="px-5 mt-10">
        <div className="mb-4 flex items-baseline gap-3">
          <EditorialNumber n={1} size="md" />
          <SectionKicker tone="muted">The Details</SectionKicker>
        </div>
        <div className="rule-hairline mb-5" />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <EditorialCard variant="ink" border="gold" className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                <Icon name="calendar" size={18} className="text-gold" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] uppercase tracking-editorial-tight text-ivory/50">Date</p>
                <p className="font-display text-[18px] text-ivory leading-tight mt-0.5">
                  {monthName.slice(0, 3)} {dayNum}
                </p>
                <p className="text-[11px] text-ivory/70 mt-0.5">{dayName}</p>
              </div>
            </div>
          </EditorialCard>

          <EditorialCard variant="ink" border="gold" className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                <Icon name="clock" size={18} className="text-gold" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] uppercase tracking-editorial-tight text-ivory/50">Time</p>
                <p className="font-display text-[18px] text-ivory leading-tight mt-0.5">
                  {timeLine}
                </p>
                <p className="text-[11px] text-ivory/70 mt-0.5">
                  {ev.end_time ? `Until ${formatTime12h(ev.end_time)}` : "Doors open"}
                </p>
              </div>
            </div>
          </EditorialCard>

          <EditorialCard variant="ink" border="gold" className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                <Icon name="users" size={18} className="text-gold" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] uppercase tracking-editorial-tight text-ivory/50">Attending</p>
                <p className="font-display text-[18px] text-ivory leading-tight mt-0.5">
                  {ev.rsvp_count.toLocaleString()}
                </p>
                <p className="text-[11px] text-ivory/70 mt-0.5">Going</p>
              </div>
            </div>
          </EditorialCard>
        </div>

        {/* Location — full-width editorial card */}
        {ev.location_name && (
          <EditorialCard variant="glass" border="subtle" className="mt-3 p-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                <Icon name="pin" size={20} className="text-gold" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] uppercase tracking-editorial-tight text-ivory/50">Venue</p>
                <p className="font-display text-[18px] text-ivory leading-tight mt-0.5 truncate">
                  {ev.location_name}
                </p>
                {ev.address && (
                  <p className="text-[12px] text-ivory/70 truncate mt-0.5">{ev.address}</p>
                )}
                {venue && (
                  <p className="text-[10px] uppercase tracking-editorial-tight text-gold mt-1">{venue.name}</p>
                )}
              </div>
            </div>
          </EditorialCard>
        )}
      </section>

      {/* ── Section 02 · Tickets / Attend ── */}
      {ev.is_ticketed ? (
        <section className="px-5 mt-10">
          <div className="mb-4 flex items-baseline gap-3">
            <EditorialNumber n={2} size="md" />
            <SectionKicker tone="muted">Tickets</SectionKicker>
            {allSoldOut && (
              <Tag tone="coral" size="sm" className="ml-auto">Sold Out</Tag>
            )}
          </div>
          <div className="rule-hairline mb-5" />

          {ticketConfigs.length > 0 && (
            <div className="space-y-2.5 mb-5">
              {ticketConfigs.map((config) => {
                const section = config.venue_section;
                const isSoldOut = config.available_count <= 0;
                return (
                  <EditorialCard
                    key={config.id}
                    variant="ink"
                    border={isSoldOut ? "subtle" : "gold"}
                    className={`p-4 ${isSoldOut ? "opacity-50" : ""}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[9px] uppercase tracking-editorial-tight text-ivory/50">Section</p>
                        <p className="font-display text-[20px] text-ivory leading-tight mt-0.5 truncate">
                          {section?.name ?? "General Admission"}
                        </p>
                        {section?.description && (
                          <p className="text-[11px] text-ivory/70 truncate mt-1">{section.description}</p>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-display text-[22px] text-gold leading-none">
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
                  </EditorialCard>
                );
              })}
            </div>
          )}

          {salesMessage && (
            <p className="text-[11px] uppercase tracking-editorial-tight text-ivory/55 mb-4 text-center">
              {salesMessage}
            </p>
          )}

          {salesOpen ? (
            <Link
              href={`/events/${ev.id}/tickets`}
              className="block rounded-2xl bg-gold text-midnight p-4 press"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-heading font-bold text-base leading-none">Get Tickets</p>
                  {lowestPrice > 0 && isFinite(lowestPrice) && (
                    <p className="text-midnight/70 text-[11px] font-semibold mt-1.5 uppercase tracking-editorial-tight">
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
            <EditorialCard variant="ink" border="subtle" className="p-4 text-center">
              <p className="text-[12px] text-ivory/70">
                {salesMessage ?? "Tickets Unavailable"}
              </p>
            </EditorialCard>
          )}
        </section>
      ) : (
        <section className="px-5 mt-10">
          <div className="mb-4 flex items-baseline gap-3">
            <EditorialNumber n={2} size="md" />
            <SectionKicker tone="muted">Attend</SectionKicker>
            <Tag tone="gold" size="sm" className="ml-auto">Free</Tag>
          </div>
          <div className="rule-hairline mb-5" />

          {user ? (
            <EditorialCard variant="glass" border="subtle" className="p-4">
              <RSVPButton
                eventId={ev.id}
                initialStatus={userRsvpStatus as "going" | "interested" | "not_going" | null}
                rsvpCount={ev.rsvp_count}
              />
            </EditorialCard>
          ) : (
            <Link
              href="/login"
              className="block rounded-2xl bg-gold text-midnight p-4 press"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-heading font-bold text-base leading-none">Sign In to RSVP</p>
                  <p className="text-midnight/70 text-[11px] font-semibold mt-1.5 uppercase tracking-editorial-tight">
                    Join the community
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-midnight/10 flex items-center justify-center">
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-midnight">
                    <path d="M5 10h10M12 6l4 4-4 4" />
                  </svg>
                </div>
              </div>
            </Link>
          )}
        </section>
      )}

      {/* ── Section 03 · Share / Calendar / Report ── */}
      <section className="px-5 mt-10">
        <div className="mb-4 flex items-baseline gap-3">
          <EditorialNumber n={3} size="md" />
          <SectionKicker tone="muted">Take it With You</SectionKicker>
        </div>
        <div className="rule-hairline mb-5" />

        <div className="grid grid-cols-3 gap-2.5">
          <a
            href={`/api/events/${ev.id}/ical`}
            download="event.ics"
            className="rounded-xl border border-gold/25 bg-transparent px-4 py-3 flex flex-col items-center gap-1.5 press hover:bg-gold/5 transition-colors"
          >
            <Icon name="calendar" size={16} className="text-gold" />
            <span className="text-[10px] uppercase tracking-editorial-tight text-ivory/70">Calendar</span>
          </a>
          <button className="rounded-xl border border-gold/25 bg-transparent px-4 py-3 flex flex-col items-center gap-1.5 press hover:bg-gold/5 transition-colors">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-gold">
              <path d="M4 8v5a1 1 0 001 1h6a1 1 0 001-1V8M8 2v8M5 5l3-3 3 3" />
            </svg>
            <span className="text-[10px] uppercase tracking-editorial-tight text-ivory/70">Share</span>
          </button>
          <button className="rounded-xl border border-gold/25 bg-transparent px-4 py-3 flex flex-col items-center gap-1.5 press hover:bg-gold/5 transition-colors">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-gold">
              <path d="M3 3h10v10H3z" />
              <path d="M8 6v4M8 12h0" />
            </svg>
            <span className="text-[10px] uppercase tracking-editorial-tight text-ivory/70">Report</span>
          </button>
        </div>
      </section>

      {/* ── END divider ── */}
      <IssueDivider label="END" />

      {/* ── Related rail (placeholder — empty rail still renders a proper editorial shell) ── */}
      <SnapCarousel
        number={4}
        kicker="Also in the Issue"
        seeAllHref="/events"
        seeAllLabel="All events →"
        className="pb-10"
      >
        <div className="snap-start shrink-0 w-[220px]">
          <EditorialCard variant="ink" border="subtle" className="p-5 h-[140px] flex flex-col justify-between">
            <SectionKicker tone="gold">Browse</SectionKicker>
            <p className="font-display text-[20px] text-ivory leading-tight">
              Explore more {categoryIcons[ev.category] ? ev.category : "events"} happening around the city.
            </p>
          </EditorialCard>
        </div>
      </SnapCarousel>
    </article>
  );
}
