import SectionHeader from "@/components/layout/SectionHeader";
import { TransitCard } from "@/components/city-data/TransitCard";

export const metadata = {
  title: "Transit - Hub City",
  description: "LA Metro routes and transit information serving Compton, CA.",
};

const TRANSIT_ROUTES = [
  {
    routeName: "A Line (Blue)",
    routeType: "rail" as const,
    color: "#0072BC",
    stops: [
      "Compton Station",
      "Artesia Station",
      "Del Amo Station",
      "Wardlow Station",
      "7th St/Metro Center (DTLA)",
      "Long Beach Transit Mall",
    ],
  },
  {
    routeName: "Route 51",
    routeType: "bus" as const,
    stops: ["Compton Bl/Central Av", "Compton Bl/Alameda St", "Compton Bl/Long Beach Bl"],
  },
  {
    routeName: "Route 52",
    routeType: "bus" as const,
    stops: ["Compton Av/Rosecrans", "Compton Av/Alondra", "Compton Av/Artesia"],
  },
  {
    routeName: "Route 53",
    routeType: "bus" as const,
    stops: ["Central Av/Compton Bl", "Central Av/Rosecrans", "Central Av/Imperial Hwy"],
  },
  {
    routeName: "Route 54",
    routeType: "bus" as const,
    stops: ["Wilmington Av/Compton Bl", "Wilmington Av/Rosecrans", "Wilmington Av/Artesia"],
  },
  {
    routeName: "Route 55",
    routeType: "bus" as const,
    stops: ["Alameda St/Compton Bl", "Alameda St/Rosecrans", "Alameda St/Artesia"],
  },
  {
    routeName: "Route 60",
    routeType: "bus" as const,
    stops: ["Long Beach Bl/Compton Bl", "Long Beach Bl/Artesia", "Long Beach Bl/Del Amo"],
  },
  {
    routeName: "Route 125",
    routeType: "bus" as const,
    stops: ["Rosecrans Av/Central", "Rosecrans Av/Compton", "Rosecrans Av/Alameda"],
  },
  {
    routeName: "Route 128",
    routeType: "bus" as const,
    stops: ["Artesia Bl/Central", "Artesia Bl/Compton", "Artesia Bl/Pioneer"],
  },
];

export default function TransitPage() {
  return (
    <div className="min-h-screen bg-midnight text-white">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <SectionHeader
          title="Transit"
          subtitle="LA Metro routes serving Compton"
        />

        <div className="mb-6 rounded-2xl bg-royal/50 p-4">
          <p className="text-sm text-white/70">
            Compton is served by the LA Metro A Line (Blue) and several bus routes.
            For real-time arrival information, visit{" "}
            <a
              href="https://www.metro.net"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold underline hover:text-gold/80"
            >
              metro.net
            </a>
            .
          </p>
        </div>

        {/* Rail */}
        <h2 className="mb-4 text-xl font-semibold text-gold">Rail</h2>
        <div className="mb-8 grid gap-4">
          {TRANSIT_ROUTES.filter((r) => r.routeType === "rail").map((route) => (
            <TransitCard key={route.routeName} {...route} />
          ))}
        </div>

        {/* Bus */}
        <h2 className="mb-4 text-xl font-semibold text-gold">Bus Routes</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {TRANSIT_ROUTES.filter((r) => r.routeType === "bus").map((route) => (
            <TransitCard key={route.routeName} {...route} />
          ))}
        </div>

        <div className="mt-8 rounded-2xl bg-royal/30 p-4 text-center text-sm text-white/50">
          Route data is based on known Metro service. Real-time GTFS integration coming soon.
        </div>
      </div>
    </div>
  );
}
