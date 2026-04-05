import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import Card from "@/components/ui/Card";

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
      ? `${stop.name}${stop.route_name ? ` - ${stop.route_name}` : ""} | Transit | Hub City`
      : "Transit Stop | Hub City",
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
    <div className="animate-fade-in pb-24">
      {/* Back */}
      <div className="px-5 pt-4 mb-3">
        <Link
          href="/city-data/transit"
          className="inline-flex items-center gap-1.5 text-gold text-sm font-semibold press"
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
      </div>

      {/* Hero */}
      <div className="mx-5 mb-6 rounded-2xl overflow-hidden">
        <div
          className={`relative p-6 ${
            isRail
              ? "bg-gradient-to-br from-blue-900/60 via-purple-900/30 to-blue-600/10"
              : "bg-gradient-to-br from-purple-900/40 via-indigo-900/30 to-purple-600/10"
          }`}
        >
          <div className="flex items-start gap-4">
            <div
              className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${
                isRail
                  ? "bg-blue-500/20 border border-blue-500/30"
                  : "bg-purple-500/20 border border-purple-500/30"
              }`}
            >
              {isRail ? "🚇" : "🚌"}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-2xl font-bold text-text-primary leading-tight">
                {stop.name}
              </h1>
              {stop.route_name && (
                <p className="text-text-secondary text-sm mt-1">
                  {stop.route_name}
                </p>
              )}
              <div className="flex flex-wrap gap-2 mt-3">
                <span
                  className={`px-3 py-1 text-[11px] font-semibold rounded-full uppercase ${
                    isRail
                      ? "bg-blue-500/15 text-blue-400 border border-blue-500/20"
                      : "bg-purple-500/15 text-purple-400 border border-purple-500/20"
                  }`}
                >
                  {isRail ? "Rail" : "Bus"}
                </span>
                {stop.is_active !== false && (
                  <span className="px-3 py-1 text-[11px] font-semibold rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                    Active
                  </span>
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
            <h3 className="font-heading font-bold text-sm mb-3">Schedule</h3>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-secondary">Weekdays</span>
                <span className="text-sm font-medium">{schedule.weekday}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-secondary">Saturday</span>
                <span className="text-sm font-medium">
                  {schedule.saturday}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-secondary">Sunday</span>
                <span className="text-sm font-medium">{schedule.sunday}</span>
              </div>
              <div className="pt-2 border-t border-border-subtle">
                <div className="flex items-center gap-2">
                  <span className="text-lg">⏱️</span>
                  <p className="text-xs text-text-secondary">
                    {schedule.frequency}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Location */}
        <Card className="mb-5">
          <h3 className="font-heading font-bold text-sm mb-3">Location</h3>
          <div className="space-y-3">
            {stop.latitude && stop.longitude && (
              <div className="flex items-center gap-3">
                <span className="text-lg">🗺️</span>
                <Link
                  href={`/map?lat=${stop.latitude}&lng=${stop.longitude}&zoom=16`}
                  className="text-sm text-gold font-medium hover:underline"
                >
                  View on Hub City Map
                </Link>
              </div>
            )}
            {stop.gtfs_stop_id && (
              <div className="flex items-center gap-3">
                <span className="text-lg">🏷️</span>
                <p className="text-sm text-text-secondary">
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
              className="flex items-center justify-center gap-2 bg-gold text-midnight px-5 py-3 rounded-full text-sm font-bold press hover:bg-gold-light transition-colors"
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 18 18">
                <path
                  d="M9 1C5.69 1 3 3.69 3 7c0 5.25 6 10 6 10s6-4.75 6-10c0-3.31-2.69-6-6-6z"
                  fill="currentColor"
                  opacity="0.2"
                />
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
            className="flex items-center justify-center gap-2 bg-white/10 text-white px-5 py-3 rounded-full text-sm font-medium press hover:bg-white/15 transition-colors border border-white/10"
          >
            🕐 Real-Time Arrivals on Metro.net
          </a>
        </div>

        {/* Other Stops on Route */}
        {routeStops.length > 0 && (
          <div>
            <h2 className="font-heading font-bold text-lg text-text-primary mb-3">
              Other Stops on {stop.route_name}
            </h2>
            <div className="space-y-1.5">
              {routeStops.map((s) => (
                <Link
                  key={s.id}
                  href={`/city-data/transit/${s.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border-subtle hover:border-gold/20 transition-colors"
                >
                  <span
                    className={`w-3 h-3 rounded-full ${
                      isRail ? "bg-blue-500" : "bg-purple-500"
                    }`}
                  />
                  <span className="text-sm text-text-primary font-medium">
                    {s.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Info */}
        <div className="mt-8 rounded-2xl bg-white/[0.03] border border-border-subtle p-4 text-center">
          <p className="text-xs text-text-secondary">
            For the most up-to-date schedule and real-time arrivals, visit{" "}
            <a
              href="https://www.metro.net"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold hover:underline"
            >
              metro.net
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
