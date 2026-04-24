import { redirect } from "next/navigation";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "My RSVPs | Culture",
  description: "Events you've RSVP'd to.",
};

interface RsvpEvent {
  id: string;
  title: string;
  slug: string | null;
  start_date: string;
  start_time: string | null;
  location_name: string | null;
  category: string | null;
  image_url: string | null;
}

export default async function MyRsvpsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth?redirect=/profile/rsvps");
  }

  const today = new Date().toISOString().split("T")[0];

  // Fetch all RSVPs with event details
  const { data: rsvps } = await supabase
    .from("event_rsvps")
    .select("id, status, created_at, event:events(id, title, slug, start_date, start_time, location_name, category, image_url)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const allRsvps = (rsvps ?? []).filter(
    (r) => r.event && typeof r.event === "object"
  );

  // Split into upcoming and past
  const upcoming = allRsvps.filter((r) => {
    const event = r.event as unknown as RsvpEvent;
    return event.start_date >= today;
  });

  const past = allRsvps.filter((r) => {
    const event = r.event as unknown as RsvpEvent;
    return event.start_date < today;
  });

  const statusColors: Record<string, { text: string; bg: string; label: string }> = {
    going: { text: "text-emerald", bg: "bg-emerald/10", label: "Going" },
    interested: { text: "text-gold", bg: "bg-gold/10", label: "Interested" },
    not_going: { text: "", bg: "", label: "Not Going" },
  };

  return (
    <div className="culture-surface min-h-dvh pb-28 animate-fade-in">
      {/* Header */}
      <div className="px-5 pt-6 pb-4" style={{ borderBottom: "3px solid var(--rule-strong-c)" }}>
        <Link href="/profile" className="press inline-flex items-center gap-1.5 mb-3" style={{ color: "var(--ink-strong)" }}>
          <Icon name="back" size={16} />
          <span className="text-sm font-semibold">Profile</span>
        </Link>
        <p className="c-kicker">§ PROFILE · RSVPS</p>
        <h1 className="c-hero">My RSVPs.</h1>
        <p className="c-serif-it">{allRsvps.length} total</p>
      </div>

      <div className="px-5 mt-4 space-y-6">
        {/* Upcoming */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald" />
            <p className="c-kicker">
              Upcoming ({upcoming.length})
            </p>
          </div>
          {upcoming.length > 0 ? (
            <div className="space-y-2">
              {upcoming.map((rsvp) => {
                const event = rsvp.event as unknown as RsvpEvent;
                const date = new Date(event.start_date);
                const status = statusColors[rsvp.status] ?? statusColors.going;
                return (
                  <Link
                    key={rsvp.id}
                    href={`/profile/rsvps/${rsvp.id}`}
                    className="block c-frame p-3.5 press hover:border-emerald/40 transition-colors"
                    style={{ background: "var(--paper-soft)" }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-14 bg-gradient-to-br from-emerald/15 to-emerald/5 border border-emerald/10 flex flex-col items-center justify-center shrink-0">
                        <p className="text-[9px] text-emerald font-bold uppercase leading-none">
                          {date.toLocaleDateString("en-US", { month: "short" })}
                        </p>
                        <p className="text-[18px] font-heading font-bold leading-none mt-0.5" style={{ color: "var(--ink-strong)" }}>
                          {date.getDate()}
                        </p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="c-card-t truncate">
                          {event.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {event.start_time && (
                            <span className="c-meta flex items-center gap-0.5">
                              <Icon name="clock" size={10} />
                              {event.start_time}
                            </span>
                          )}
                          {event.location_name && (
                            <span className="c-meta truncate flex items-center gap-0.5">
                              <Icon name="map-pin" size={10} />
                              {event.location_name}
                            </span>
                          )}
                        </div>
                        {event.category && (
                          <span className="inline-block mt-1.5 text-[9px] font-semibold text-gold bg-hc-purple/10 rounded-full px-2 py-0.5 capitalize">
                            {event.category}
                          </span>
                        )}
                      </div>
                      <div className={`shrink-0 px-2 py-1 ${status.bg} border border-black/10`}>
                        <span className={`text-[9px] font-bold ${status.text}`}>{status.label}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 c-frame" style={{ background: "var(--paper-soft)" }}>
              <Icon name="calendar" size={28} className="mx-auto mb-2" style={{ color: "var(--ink-strong)", opacity: 0.3 }} />
              <p className="c-body font-medium">No upcoming RSVPs</p>
              <Link
                href="/events"
                className="inline-block mt-3 text-[12px] text-gold font-semibold press"
              >
                Browse Events
              </Link>
            </div>
          )}
        </div>

        {/* Past */}
        {past.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--ink-strong)", opacity: 0.3 }} />
              <p className="c-kicker">
                Past ({past.length})
              </p>
            </div>
            <div className="space-y-2">
              {past.map((rsvp) => {
                const event = rsvp.event as unknown as RsvpEvent;
                const date = new Date(event.start_date);
                return (
                  <Link
                    key={rsvp.id}
                    href={`/profile/rsvps/${rsvp.id}`}
                    className="block c-frame p-3.5 press opacity-60 hover:opacity-80 transition-opacity"
                    style={{ background: "var(--paper-soft)" }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-14 border border-black/10 flex flex-col items-center justify-center shrink-0" style={{ background: "var(--paper-warm)" }}>
                        <p className="c-meta font-bold uppercase leading-none">
                          {date.toLocaleDateString("en-US", { month: "short" })}
                        </p>
                        <p className="text-[18px] font-heading font-bold leading-none mt-0.5" style={{ color: "var(--ink-strong)" }}>
                          {date.getDate()}
                        </p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="c-card-t truncate">
                          {event.title}
                        </p>
                        {event.location_name && (
                          <span className="c-meta truncate flex items-center gap-0.5 mt-0.5">
                            <Icon name="map-pin" size={10} />
                            {event.location_name}
                          </span>
                        )}
                      </div>
                      <span className="c-meta font-medium shrink-0">Attended</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
