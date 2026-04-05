import Link from "next/link";
import SectionHeader from "@/components/layout/SectionHeader";
import { TransitCard } from "@/components/city-data/TransitCard";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Transit - Hub City",
  description: "LA Metro routes and transit information serving Compton, CA.",
};

// Fallback routes in case DB is empty
const FALLBACK_ROUTES = [
  {
    routeName: "A Line (Blue)",
    routeType: "rail" as const,
    color: "#0072BC",
    stops: ["Compton Station", "Artesia Station"],
  },
  {
    routeName: "Route 51",
    routeType: "bus" as const,
    stops: ["Compton Bl/Central Av", "Compton Bl/Alameda St", "Compton Bl/Long Beach Bl"],
  },
];

export default async function TransitPage() {
  const supabase = await createClient();

  const { data: stops } = await supabase
    .from("transit_stops")
    .select("id, name, route_name, route_type, latitude, longitude, gtfs_stop_id")
    .eq("is_active", true)
    .order("route_name")
    .order("name");

  // Group stops by route
  const routeMap = new Map<string, {
    routeName: string;
    routeType: "bus" | "rail";
    color?: string;
    stops: { id: string; name: string }[];
  }>();

  if (stops && stops.length > 0) {
    for (const stop of stops) {
      const key = stop.route_name || "Unknown";
      if (!routeMap.has(key)) {
        routeMap.set(key, {
          routeName: key,
          routeType: (stop.route_type as "bus" | "rail") || "bus",
          color: stop.route_type === "rail" ? "#0072BC" : undefined,
          stops: [],
        });
      }
      routeMap.get(key)!.stops.push({ id: stop.id, name: stop.name });
    }
  }

  const routes = routeMap.size > 0
    ? Array.from(routeMap.values())
    : FALLBACK_ROUTES.map(r => ({
        ...r,
        stops: r.stops.map(name => ({ id: name, name })),
      }));

  const railRoutes = routes.filter(r => r.routeType === "rail");
  const busRoutes = routes.filter(r => r.routeType === "bus");

  return (
    <div className="min-h-screen bg-midnight text-white">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <SectionHeader
          title="Transit"
          subtitle="LA Metro routes serving Compton"
        />

        <div className="mb-6 rounded-2xl bg-royal/50 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center shrink-0">
              <span className="text-lg">🚇</span>
            </div>
            <div>
              <p className="text-sm font-medium text-white/90 mb-0.5">
                {stops?.length ?? 0} transit stops across {routes.length} routes
              </p>
              <p className="text-xs text-white/50">
                For real-time arrivals, visit{" "}
                <a
                  href="https://www.metro.net"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gold underline hover:text-gold/80"
                >
                  metro.net
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Rail */}
        {railRoutes.length > 0 && (
          <>
            <h2 className="mb-4 text-xl font-semibold text-gold flex items-center gap-2">
              <span className="text-lg">🚆</span> Rail
            </h2>
            <div className="mb-8 grid gap-4">
              {railRoutes.map((route) => (
                <TransitCard
                  key={route.routeName}
                  routeName={route.routeName}
                  routeType={route.routeType}
                  stops={route.stops.map(s => s.name)}
                  color={route.color}
                />
              ))}
            </div>
          </>
        )}

        {/* Bus */}
        {busRoutes.length > 0 && (
          <>
            <h2 className="mb-4 text-xl font-semibold text-gold flex items-center gap-2">
              <span className="text-lg">🚌</span> Bus Routes
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {busRoutes.map((route) => (
                <TransitCard
                  key={route.routeName}
                  routeName={route.routeName}
                  routeType={route.routeType}
                  stops={route.stops.map(s => s.name)}
                  color={route.color}
                />
              ))}
            </div>
          </>
        )}

        {/* Map link */}
        <div className="mt-8 flex flex-col items-center gap-3">
          <Link
            href="/map"
            className="inline-flex items-center gap-2 bg-gold/15 text-gold border border-gold/20 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-gold/25 transition-colors"
          >
            <span>🗺️</span> View All Stops on Map
          </Link>
          <p className="text-center text-sm text-white/30">
            Route data based on LA Metro service. Real-time GTFS integration coming soon.
          </p>
        </div>
      </div>
    </div>
  );
}
