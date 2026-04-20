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

export default function ProfileEventsRow({ events, accentColor }: ProfileEventsRowProps) {
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
              className="snap-start shrink-0 w-[220px] group press"
            >
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-white/5">
                {event.image_url ? (
                  <img
                    src={event.image_url}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${accentColor}30, transparent)`,
                    }}
                  >
                    <Icon name="calendar" size={28} className="text-white/30" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                {/* Date pill */}
                <div
                  className="absolute top-2 left-2 rounded-lg overflow-hidden backdrop-blur-md"
                  style={{ background: "rgba(10,10,10,0.75)" }}
                >
                  <div
                    className="px-2 py-0.5 text-[9px] font-bold text-center uppercase tracking-wider"
                    style={{ background: `${accentColor}80`, color: "#0A0A0A" }}
                  >
                    {month}
                  </div>
                  <div className="px-2 py-0.5 text-center">
                    <p className="text-[14px] font-heading font-bold leading-none">{day}</p>
                  </div>
                </div>
              </div>
              <div className="pt-2 px-0.5">
                <p className="text-[13px] font-semibold text-white line-clamp-1">
                  {event.title}
                </p>
                {event.location_name && (
                  <p className="text-[11px] text-white/50 line-clamp-1 mt-0.5 flex items-center gap-1">
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
