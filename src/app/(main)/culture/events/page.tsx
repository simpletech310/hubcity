import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import CultureHero from "@/components/culture/CultureHero";
import MuseumNav from "@/components/culture/MuseumNav";
import CultureCalendarClient from "../calendar/CultureCalendarClient";

export const metadata = {
  title: "Cultural Events | Compton Culture | Culture",
  description: "Upcoming cultural events in Compton.",
};

export default async function CultureEventsPage() {
  const supabase = await createClient();
  const now = new Date();

  // Wider window for the calendar (one month back, three forward).
  const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endDate = new Date(now.getFullYear(), now.getMonth() + 3, 0);

  // Calendar feed — wider window so the user can scrub between months.
  const { data: events } = await supabase
    .from("events")
    .select("id, title, start_date, end_date, location_name, category, description")
    .eq("category", "culture")
    .eq("is_published", true)
    .gte("start_date", startDate.toISOString().split("T")[0])
    .lte("start_date", endDate.toISOString().split("T")[0])
    .order("start_date", { ascending: true });

  // Upcoming list — strictly future events for the rail under the calendar
  // (always shows what's next regardless of which month is selected above).
  const { data: upcoming } = await supabase
    .from("events")
    .select(
      "id, slug, title, start_date, start_time, location_name, image_url, description"
    )
    .eq("category", "culture")
    .eq("is_published", true)
    .gte("start_date", now.toISOString().split("T")[0])
    .order("start_date", { ascending: true })
    .limit(6);

  // The calendar component still uses `location` (not `location_name`),
  // remap the field so it doesn't choke.
  const calendarEvents = (events ?? []).map((e) => ({
    id: e.id,
    title: e.title,
    start_date: e.start_date,
    end_date: e.end_date,
    location: e.location_name ?? null,
    category: e.category ?? null,
    description: e.description ?? null,
  }));

  return (
    <div className="space-y-6 pb-20">
      <CultureHero
        title="Cultural Events"
        subtitle="Don't miss what's happening in Compton."
        imageUrl="/images/art/IMG_2787.jpg"
      />

      <div
        className="sticky top-0 z-30"
        style={{
          background: "var(--paper)",
          borderBottom: "2px solid var(--rule-strong-c)",
        }}
      >
        <div className="px-5">
          <MuseumNav />
        </div>
      </div>

      {/* Calendar */}
      <div className="px-5">
        <CultureCalendarClient
          events={calendarEvents}
          initialMonth={now.getMonth()}
          initialYear={now.getFullYear()}
        />
      </div>

      {/* § UPCOMING — always-visible list of the next 6 cultural events */}
      {upcoming && upcoming.length > 0 && (
        <section className="px-5">
          <div
            className="flex items-baseline gap-3 pb-2"
            style={{ borderBottom: "2px solid var(--rule-strong-c)" }}
          >
            <span
              className="c-kicker"
              style={{
                fontSize: 10,
                letterSpacing: "0.18em",
                color: "var(--ink-strong)",
                opacity: 0.7,
              }}
            >
              § UPCOMING
            </span>
            <span
              className="c-badge c-badge-gold tabular-nums ml-auto"
              style={{ fontSize: 9 }}
            >
              {upcoming.length} {upcoming.length === 1 ? "EVENT" : "EVENTS"}
            </span>
          </div>

          <div className="space-y-3 mt-4">
            {upcoming.map((e) => {
              const d = new Date(e.start_date + "T00:00:00");
              const month = d
                .toLocaleDateString("en-US", { month: "short" })
                .toUpperCase();
              const day = d.getDate();
              return (
                <Link
                  key={e.id}
                  href={`/events/${e.id}`}
                  className="block press"
                >
                  <div
                    className="overflow-hidden flex items-stretch"
                    style={{
                      background: "var(--paper-warm)",
                      border: "2px solid var(--rule-strong-c)",
                    }}
                  >
                    {/* Editorial date block */}
                    <div
                      className="shrink-0 w-16 flex flex-col items-center justify-center"
                      style={{
                        background: "var(--ink-strong)",
                        borderRight: "2px solid var(--rule-strong-c)",
                      }}
                    >
                      <span
                        className="c-kicker"
                        style={{
                          fontSize: 9,
                          letterSpacing: "0.18em",
                          color: "var(--gold-c)",
                        }}
                      >
                        {month}
                      </span>
                      <span
                        className="tabular-nums mt-0.5"
                        style={{
                          fontFamily:
                            "var(--font-anton), Anton, sans-serif",
                          fontSize: 26,
                          lineHeight: 1,
                          color: "var(--paper)",
                        }}
                      >
                        {day}
                      </span>
                    </div>

                    {/* Body */}
                    <div className="flex-1 min-w-0 px-3 py-2.5">
                      <h3
                        className="c-card-t line-clamp-2"
                        style={{
                          fontSize: 14,
                          lineHeight: 1.2,
                          color: "var(--ink-strong)",
                        }}
                      >
                        {e.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {e.start_time && (
                          <span
                            className="c-kicker tabular-nums"
                            style={{
                              fontSize: 9,
                              letterSpacing: "0.14em",
                              color: "var(--ink-strong)",
                              opacity: 0.7,
                            }}
                          >
                            {e.start_time.slice(0, 5)}
                          </span>
                        )}
                        {e.location_name && (
                          <span
                            className="c-meta truncate"
                            style={{
                              fontSize: 11,
                              color: "var(--ink-strong)",
                              opacity: 0.75,
                              textTransform: "none",
                            }}
                          >
                            {e.location_name}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Cover thumbnail */}
                    {e.image_url && (
                      <div
                        className="shrink-0 w-20 relative overflow-hidden"
                        style={{
                          borderLeft: "2px solid var(--rule-strong-c)",
                        }}
                      >
                        <Image
                          src={e.image_url}
                          alt={e.title}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
