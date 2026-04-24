import Link from "next/link";
import Icon from "@/components/ui/Icon";
import type { Event } from "@/types/database";

interface ProfileEventsRowProps {
  events: Event[];
  accentColor: string;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return {
    month: d.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
    day: d.getDate().toString(),
  };
}

export default function ProfileEventsRow({ events }: ProfileEventsRowProps) {
  if (events.length === 0) return null;

  return (
    <div className="-mx-5 px-5 overflow-x-auto scrollbar-hide">
      <div className="flex gap-3 snap-x snap-mandatory pb-1">
        {events.map((event) => {
          const { month, day } = formatDate(event.start_date);
          return (
            <Link
              key={event.id}
              href={`/events/${event.slug || event.id}`}
              className="snap-start shrink-0 w-[220px] group press block"
            >
              <div
                className="relative aspect-[4/3] c-frame overflow-hidden"
                style={{ background: "var(--paper)" }}
              >
                {event.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={event.image_url}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{
                      background: "var(--ink-strong)",
                      color: "var(--gold-c)",
                    }}
                  >
                    <Icon name="calendar" size={28} />
                  </div>
                )}

                {/* Date block — ink over month, paper over day */}
                <div
                  className="absolute top-2 left-2"
                  style={{ border: "2px solid var(--ink-strong)" }}
                >
                  <div
                    className="c-kicker text-center"
                    style={{
                      background: "var(--ink-strong)",
                      color: "var(--gold-c)",
                      padding: "2px 8px",
                    }}
                  >
                    {month}
                  </div>
                  <div
                    className="c-display c-tabnum text-center"
                    style={{
                      background: "var(--paper)",
                      color: "var(--ink-strong)",
                      padding: "2px 8px",
                      fontSize: 18,
                      lineHeight: 1,
                    }}
                  >
                    {day}
                  </div>
                </div>
              </div>
              <div className="pt-2">
                <p
                  className="c-card-t line-clamp-1"
                  style={{ fontSize: 14 }}
                >
                  {event.title}
                </p>
                {event.location_name && (
                  <p
                    className="c-kicker line-clamp-1 mt-1 flex items-center gap-1"
                    style={{ color: "var(--ink-mute)", fontSize: 9 }}
                  >
                    <Icon name="pin" size={10} /> {event.location_name}
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
