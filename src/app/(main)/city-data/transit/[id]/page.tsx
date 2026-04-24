import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: stop } = await supabase
    .from("transit_stops")
    .select("name, route_name")
    .eq("id", id)
    .single();

  return {
    title: stop
      ? `${stop.name}${stop.route_name ? ` - ${stop.route_name}` : ""} | Transit | Culture`
      : "Transit Stop | Culture",
  };
}

// Hardcoded schedule data for common Compton routes
const ROUTE_SCHEDULES: Record<
  string,
  { weekday: string; saturday: string; sunday: string; frequency: string }
> = {
  "A Line (Blue)": {
    weekday: "4:30 AM - 12:30 AM",
    saturday: "4:30 AM - 12:30 AM",
    sunday: "5:00 AM - 12:00 AM",
    frequency: "Every 8-12 min (peak), 12-20 min (off-peak)",
  },
};

export default async function TransitStopDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: stop } = await supabase
    .from("transit_stops")
    .select("*")
    .eq("id", id)
    .single();

  if (!stop) notFound();

  const mapsUrl =
    stop.latitude && stop.longitude
      ? `https://maps.google.com/?q=${stop.latitude},${stop.longitude}`
      : null;

  const schedule = stop.route_name
    ? ROUTE_SCHEDULES[stop.route_name]
    : null;

  // Fetch other stops on same route
  let routeStops: { id: string; name: string }[] = [];
  if (stop.route_name) {
    const { data } = await supabase
      .from("transit_stops")
      .select("id, name")
      .eq("route_name", stop.route_name)
      .neq("id", stop.id)
      .order("name");
    routeStops = data ?? [];
  }

  const isRail = stop.route_type === "rail";

  return (
    <div className="culture-surface min-h-dvh animate-fade-in pb-24">
      {/* Back + Hero */}
      <div
        className="px-[18px] pt-5 pb-4"
        style={{ borderBottom: "3px solid var(--rule-strong-c)" }}
      >
        <Link
          href="/city-data/transit"
          className="inline-flex items-center gap-1.5 text-sm font-semibold press mb-3"
          style={{ color: "var(--ink-strong)" }}
        >
          <svg
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M10 12L6 8l4-4" />
          </svg>
          Transit
        </Link>
        <div className="c-kicker" style={{ opacity: 0.65 }}>§ TRANSIT · {isRail ? "RAIL" : "BUS"}{stop.route_name ? ` · ${stop.route_name.toUpperCase()}` : ""}</div>
        <h1 className="c-hero mt-2" style={{ fontSize: 40, lineHeight: 0.95 }}>{stop.name}</h1>
        {stop.route_name && (
          <p className="c-serif-it mt-2" style={{ fontSize: 13 }}>{stop.route_name}</p>
        )}
      </div>

      {/* Hero */}
      <div className="mx-5 mb-6 c-frame overflow-hidden">
        <div className="relative p-6" style={{ background: "var(--paper-warm)" }}>
          <div className="flex items-start gap-4">
            <div
              className="w-14 h-14 flex items-center justify-center text-2xl"
              style={{ background: "var(--paper)", border: "2px solid var(--rule-strong-c)" }}
            >
              {isRail ? "🚊" : "🚌"}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="c-card-t text-2xl leading-tight">
                {stop.name}
              </h1>
              {stop.route_name && (
                <p className="c-body text-sm mt-1">
                  {stop.route_name}
                </p>
              )}
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="c-badge-ink">
                  {isRail ? "Rail" : "Bus"}
                </span>
                {stop.is_active !== false && (
                  <span className="c-badge-ok">Active</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5">
        {/* Schedule */}
        {schedule && (
          <Card className="mb-5">
            <h3 className="c-card-t mb-3">Schedule</h3>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="c-meta" style={{ fontSize: 11 }}>Weekdays</span>
                <span className="text-sm font-medium" style={{ color: "var(--ink-strong)" }}>{schedule.weekday}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="c-meta" style={{ fontSize: 11 }}>Saturday</span>
                <span className="text-sm font-medium" style={{ color: "var(--ink-strong)" }}>
                  {schedule.saturday}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="c-meta" style={{ fontSize: 11 }}>Sunday</span>
                <span className="text-sm font-medium" style={{ color: "var(--ink-strong)" }}>{schedule.sunday}</span>
              </div>
              <div className="pt-2" style={{ borderTop: "1.5px solid var(--rule-strong-c)" }}>
                <div className="flex items-center gap-2">
                  <span className="text-lg"><Icon name="clock" size={20} /></span>
                  <p className="c-meta" style={{ fontSize: 11 }}>
                    {schedule.frequency}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Location */}
        <Card className="mb-5">
          <h3 className="c-card-t mb-3">Location</h3>
          <div className="space-y-3">
            {stop.latitude && stop.longitude && (
              <div className="flex items-center gap-3">
                <span className="text-lg"><Icon name="globe" size={20} /></span>
                <Link
                  href={`/map?lat=${stop.latitude}&lng=${stop.longitude}&zoom=16`}
                  className="text-sm font-medium hover:underline"
                  style={{ color: "var(--gold-c)" }}
                >
                  View on Culture Map
                </Link>
              </div>
            )}
            {stop.gtfs_stop_id && (
              <div className="flex items-center gap-3">
                <span className="text-lg"><Icon name="tag" size={20} /></span>
                <p className="c-meta" style={{ fontSize: 11 }}>
                  GTFS ID: <span className="font-mono">{stop.gtfs_stop_id}</span>
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Actions */}
        <div className="flex flex-col gap-3 mb-8">
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="c-btn c-btn-primary"
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 18 18">
                <path
                  d="M9 1C5.69 1 3 3.69 3 7c0 5.25 6 10 6 10s6-4.75 6-10c0-3.31-2.69-6-6-6z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <circle cx="9" cy="7" r="2" fill="currentColor" />
              </svg>
              Get Directions
            </a>
          )}
          <a
            href="https://www.metro.net/riding/nextrip/"
            target="_blank"
            rel="noopener noreferrer"
            className="c-btn c-btn-outline"
          >
            <Icon name="clock" size={16} /> Real-Time Arrivals on Metro.net
          </a>
        </div>

        {/* Other Stops on Route */}
        {routeStops.length > 0 && (
          <div>
            <h2 className="c-card-t text-lg mb-3">
              Other Stops on {stop.route_name}
            </h2>
            <div className="space-y-1.5">
              {routeStops.map((s) => (
                <Link
                  key={s.id}
                  href={`/city-data/transit/${s.id}`}
                  className="flex items-center gap-3 p-3 c-frame transition-colors"
                  style={{ background: "var(--paper)" }}
                >
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ background: isRail ? "var(--ink-strong)" : "var(--gold-c)" }}
                  />
                  <span className="text-sm font-medium" style={{ color: "var(--ink-strong)" }}>
                    {s.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Info */}
        <div className="mt-8 c-frame p-4 text-center" style={{ background: "var(--paper-warm)" }}>
          <p className="c-meta" style={{ fontSize: 11 }}>
            For the most up-to-date schedule and real-time arrivals, visit{" "}
            <a
              href="https://www.metro.net"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
              style={{ color: "var(--gold-c)" }}
            >
              metro.net
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
