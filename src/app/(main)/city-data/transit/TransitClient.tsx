"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

// ─── Compton-area routes served by LA Metro ───────────────────────────────
const COMPTON_ROUTES: RouteConfig[] = [
  { routeCode: "A", agencyId: "LACMTA_Rail", label: "A Line (Blue)", type: "rail", color: "#0072BC", direction: "Long Beach ↔ Azusa" },
  { routeCode: "51", agencyId: "LACMTA", label: "Route 51", type: "bus", color: "#E67E22", direction: "Compton Bl" },
  { routeCode: "52", agencyId: "LACMTA", label: "Route 52", type: "bus", color: "#9B59B6", direction: "Rosecrans Av" },
  { routeCode: "53", agencyId: "LACMTA", label: "Route 53", type: "bus", color: "#27AE60", direction: "Compton ↔ Lynwood" },
  { routeCode: "60", agencyId: "LACMTA", label: "Route 60", type: "bus", color: "#E74C3C", direction: "Long Beach Bl" },
  { routeCode: "62", agencyId: "LACMTA", label: "Route 62", type: "bus", color: "#F39C12", direction: "Central Av" },
  { routeCode: "204", agencyId: "LACMTA", label: "Route 204", type: "bus", color: "#1ABC9C", direction: "Vermont Av" },
];

// Well-known Compton-area stops with their GTFS stop IDs
const COMPTON_STOPS: StopInfo[] = [
  { stopId: "80101", name: "Compton Station (A Line)", routeCode: "A", agencyId: "LACMTA_Rail", address: "101 N Willowbrook Ave", lat: 33.8958, lng: -118.2206 },
  { stopId: "80105", name: "Artesia Station (A Line)", routeCode: "A", agencyId: "LACMTA_Rail", address: "Artesia Bl / Wyleta St", lat: 33.8664, lng: -118.1989 },
  { stopId: "3758", name: "Compton Bl / Central Av", routeCode: "51", agencyId: "LACMTA", address: "Compton Blvd & Central Ave", lat: 33.8958, lng: -118.2178 },
  { stopId: "3759", name: "Compton Bl / Alameda St", routeCode: "51", agencyId: "LACMTA", address: "Compton Blvd & Alameda St", lat: 33.8960, lng: -118.2360 },
  { stopId: "3760", name: "Compton Bl / Long Beach Bl", routeCode: "51", agencyId: "LACMTA", address: "Compton Blvd & Long Beach Blvd", lat: 33.8957, lng: -118.1919 },
  { stopId: "5621", name: "Long Beach Bl / Rosecrans Av", routeCode: "60", agencyId: "LACMTA", address: "Long Beach Blvd & Rosecrans Ave", lat: 33.8879, lng: -118.1884 },
  { stopId: "5622", name: "Long Beach Bl / Alondra Bl", routeCode: "60", agencyId: "LACMTA", address: "Long Beach Blvd & Alondra Blvd", lat: 33.8748, lng: -118.1884 },
  { stopId: "4201", name: "Central Av / Rosecrans Av", routeCode: "62", agencyId: "LACMTA", address: "Central Ave & Rosecrans Ave", lat: 33.8878, lng: -118.2190 },
  { stopId: "5910", name: "Rosecrans Av / Willowbrook Av", routeCode: "52", agencyId: "LACMTA", address: "Rosecrans Ave & Willowbrook Ave", lat: 33.8879, lng: -118.2206 },
];

interface RouteConfig {
  routeCode: string;
  agencyId: string;
  label: string;
  type: "bus" | "rail";
  color: string;
  direction: string;
}

interface StopInfo {
  stopId: string;
  name: string;
  routeCode: string;
  agencyId: string;
  address: string;
  lat: number;
  lng: number;
}

interface Arrival {
  trip_id: string;
  route_code: string;
  headsign: string;
  minutes_away: number;
  scheduled_time: number | null;
}

interface ArrivalsState {
  [stopId: string]: {
    arrivals: Arrival[];
    loading: boolean;
    error: string | null;
    lastFetched: number | null;
  };
}

function MinuteBadge({ minutes }: { minutes: number }) {
  if (minutes === 0) {
    return (
      <span className="c-badge-live animate-pulse">
        <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: "#fff" }} />
        Now
      </span>
    );
  }
  if (minutes <= 5) {
    return <span className="c-badge-gold">{minutes} min</span>;
  }
  return <span className="c-badge-ink">{minutes} min</span>;
}

function StopCard({ stop, arrivalsData, onRefresh }: {
  stop: StopInfo;
  arrivalsData: ArrivalsState[string] | undefined;
  onRefresh: (stop: StopInfo) => void;
}) {
  const route = COMPTON_ROUTES.find(r => r.routeCode === stop.routeCode);
  const isRail = route?.type === "rail";

  return (
    <div className="c-frame overflow-hidden" style={{ background: "var(--paper)" }}>
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center gap-3"
        style={{ borderBottom: `2px solid ${route?.color || "#F2A900"}20` }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${route?.color || "#F2A900"}18` }}
        >
          {isRail ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={route?.color || "#F2A900"} strokeWidth="2">
              <rect x="3" y="2" width="18" height="14" rx="3" />
              <path d="M3 10h18M8 21l1-5M16 21l-1-5M7 21h10" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={route?.color || "#F2A900"} strokeWidth="2">
              <rect x="1" y="7" width="20" height="12" rx="2" />
              <path d="M16 21l-1-2M8 21l1-2M3 7V5a2 2 0 012-2h14a2 2 0 012 2v2" />
              <circle cx="6" cy="17" r="1" fill={route?.color || "#F2A900"} />
              <circle cx="18" cy="17" r="1" fill={route?.color || "#F2A900"} />
            </svg>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="c-card-t text-[13px] truncate">{stop.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="c-badge-ink">
              {route?.label || stop.routeCode}
            </span>
            <span className="c-meta truncate" style={{ fontSize: 10 }}>{stop.address}</span>
          </div>
        </div>
        <button
          onClick={() => onRefresh(stop)}
          className="w-7 h-7 flex items-center justify-center transition-all shrink-0"
          style={{ color: "var(--ink-strong)", opacity: 0.6 }}
          aria-label="Refresh arrivals"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            className={arrivalsData?.loading ? "animate-spin" : ""}>
            <path d="M23 4v6h-6" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
        </button>
      </div>

      {/* Arrivals */}
      <div className="px-4 py-3">
        {arrivalsData?.loading && !arrivalsData.arrivals.length ? (
          <div className="flex items-center gap-2 py-2">
            <div
              className="w-4 h-4 border-2 rounded-full animate-spin"
              style={{ borderColor: "var(--rule-strong-c)", borderTopColor: "transparent" }}
            />
            <span className="c-meta" style={{ fontSize: 12 }}>Loading arrivals...</span>
          </div>
        ) : arrivalsData?.error ? (
          <div className="py-2">
            <p className="c-meta" style={{ fontSize: 12 }}>{arrivalsData.error}</p>
            <p className="c-meta mt-1" style={{ fontSize: 11, opacity: 0.6 }}>
              Check <a href="https://metro.net" target="_blank" rel="noreferrer" className="underline" style={{ color: "var(--gold-c)" }}>metro.net</a> for schedules
            </p>
          </div>
        ) : arrivalsData?.arrivals.length ? (
          <div className="space-y-2">
            {arrivalsData.arrivals.slice(0, 3).map((a, i) => (
              <div key={`${a.trip_id}-${i}`} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="c-meta w-4 shrink-0" style={{ fontSize: 11 }}>{i + 1}</span>
                  <p className="c-body truncate" style={{ fontSize: 12 }}>
                    {a.headsign || route?.direction || "Inbound"}
                  </p>
                </div>
                <MinuteBadge minutes={a.minutes_away} />
              </div>
            ))}
            {arrivalsData.lastFetched && (
              <p className="c-meta pt-1" style={{ fontSize: 10, opacity: 0.5 }}>
                Updated {Math.round((Date.now() / 1000 - arrivalsData.lastFetched) / 60) < 1
                  ? "just now"
                  : `${Math.round((Date.now() / 1000 - arrivalsData.lastFetched) / 60)}m ago`}
              </p>
            )}
          </div>
        ) : (
          <p className="c-meta py-1" style={{ fontSize: 12 }}>No arrivals found — service may not be running</p>
        )}
      </div>

      {/* Footer actions */}
      <div className="px-4 pb-3 flex gap-2">
        <a
          href={`https://maps.google.com/?q=${stop.lat},${stop.lng}`}
          target="_blank"
          rel="noreferrer"
          className="c-meta flex items-center gap-1.5 transition-colors"
          style={{ fontSize: 11 }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
          Directions
        </a>
        <span style={{ color: "var(--ink-strong)", opacity: 0.3 }}>·</span>
        <Link
          href={`/map?lat=${stop.lat}&lng=${stop.lng}&zoom=17`}
          className="c-meta flex items-center gap-1.5 transition-colors"
          style={{ fontSize: 11 }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" /><line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" /></svg>
          Map
        </Link>
      </div>
    </div>
  );
}

export default function TransitClient() {
  const [arrivalsState, setArrivalsState] = useState<ArrivalsState>({});
  const [activeFilter, setActiveFilter] = useState<"all" | "bus" | "rail">("all");
  const [lastGlobalRefresh, setLastGlobalRefresh] = useState<number>(0);

  const fetchArrivals = useCallback(async (stop: StopInfo) => {
    setArrivalsState(prev => ({
      ...prev,
      [stop.stopId]: {
        arrivals: prev[stop.stopId]?.arrivals ?? [],
        loading: true,
        error: null,
        lastFetched: prev[stop.stopId]?.lastFetched ?? null,
      },
    }));

    try {
      const res = await fetch(
        `/api/transit/arrivals?stop_id=${stop.stopId}&route_code=${stop.routeCode}&agency_id=${stop.agencyId}`
      );
      const data = await res.json();

      setArrivalsState(prev => ({
        ...prev,
        [stop.stopId]: {
          arrivals: data.arrivals ?? [],
          loading: false,
          error: data.error || (data.arrivals?.length === 0 ? null : null),
          lastFetched: data.fetched_at ?? Math.floor(Date.now() / 1000),
        },
      }));
    } catch {
      setArrivalsState(prev => ({
        ...prev,
        [stop.stopId]: {
          arrivals: prev[stop.stopId]?.arrivals ?? [],
          loading: false,
          error: "Could not reach Metro API",
          lastFetched: prev[stop.stopId]?.lastFetched ?? null,
        },
      }));
    }
  }, []);

  // Initial load — fetch all stops
  useEffect(() => {
    COMPTON_STOPS.forEach(stop => fetchArrivals(stop));
    setLastGlobalRefresh(Date.now());
  }, [fetchArrivals]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      COMPTON_STOPS.forEach(stop => fetchArrivals(stop));
      setLastGlobalRefresh(Date.now());
    }, 60_000);
    return () => clearInterval(interval);
  }, [fetchArrivals]);

  const filtered = COMPTON_STOPS.filter(stop => {
    if (activeFilter === "all") return true;
    const route = COMPTON_ROUTES.find(r => r.routeCode === stop.routeCode);
    return route?.type === activeFilter;
  });

  const railStops = filtered.filter(s => COMPTON_ROUTES.find(r => r.routeCode === s.routeCode)?.type === "rail");
  const busStops = filtered.filter(s => COMPTON_ROUTES.find(r => r.routeCode === s.routeCode)?.type === "bus");

  const refreshAll = () => {
    COMPTON_STOPS.forEach(stop => fetchArrivals(stop));
    setLastGlobalRefresh(Date.now());
  };

  return (
    <div className="animate-fade-in pb-28">
      {/* Header */}
      <div
        className="px-[18px] pt-5 pb-4"
        style={{ borderBottom: "3px solid var(--rule-strong-c)" }}
      >
        <div className="c-kicker" style={{ opacity: 0.65 }}>§ CITY DATA · LA METRO</div>
        <h1 className="c-hero mt-2" style={{ fontSize: 46, lineHeight: 0.92 }}>Transit Tracker.</h1>
        <p className="c-serif-it mt-2 mb-4" style={{ fontSize: 13 }}>
          LA Metro · Live arrivals · Compton.
        </p>
        <div className="flex items-center justify-between mb-1">
          <div className="hidden">
            <h1 className="font-heading font-bold text-xl">Transit Tracker</h1>
            <p className="text-[12px] mt-0.5">LA Metro · Live arrivals · Compton</p>
          </div>
          <button onClick={refreshAll} className="c-btn c-btn-primary c-btn-sm">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 4v6h-6" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            Refresh All
          </button>
        </div>

        {/* Live indicator */}
        <div className="flex items-center gap-2 mt-3 mb-4">
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--gold-c)" }} />
          <span className="c-meta" style={{ fontSize: 11 }}>
            Live · Updates every 60s · Powered by{" "}
            <a href="https://api.metro.net" target="_blank" rel="noreferrer" className="transition-colors" style={{ color: "var(--gold-c)" }}>
              LA Metro API
            </a>
          </span>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2">
          {(["all", "rail", "bus"] as const).map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`c-btn c-btn-sm ${activeFilter === f ? "c-btn-primary" : "c-btn-outline"}`}
            >
              {f === "all" ? "All Stops" : f === "rail" ? "🚊 Rail" : "🚌 Bus"}
            </button>
          ))}
        </div>
      </div>

      {/* Rail stops */}
      {railStops.length > 0 && (
        <section className="px-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-5" style={{ background: "var(--ink-strong)" }} />
            <h2 className="c-card-t text-sm">Rail</h2>
            <span className="c-meta" style={{ fontSize: 10 }}>{railStops.length} stations</span>
          </div>
          <div className="space-y-3">
            {railStops.map(stop => (
              <StopCard
                key={stop.stopId}
                stop={stop}
                arrivalsData={arrivalsState[stop.stopId]}
                onRefresh={fetchArrivals}
              />
            ))}
          </div>
        </section>
      )}

      {/* Bus stops */}
      {busStops.length > 0 && (
        <section className="px-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-5" style={{ background: "var(--gold-c)" }} />
            <h2 className="c-card-t text-sm">Bus Routes</h2>
            <span className="c-meta" style={{ fontSize: 10 }}>{busStops.length} stops</span>
          </div>
          <div className="space-y-3">
            {busStops.map(stop => (
              <StopCard
                key={stop.stopId}
                stop={stop}
                arrivalsData={arrivalsState[stop.stopId]}
                onRefresh={fetchArrivals}
              />
            ))}
          </div>
        </section>
      )}

      {/* Metro link */}
      <div className="px-5 mt-2">
        <a
          href="https://www.metro.net/riding/nextrip/"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 c-frame transition-all"
          style={{ background: "var(--paper-warm)", color: "var(--ink-strong)", fontSize: 12 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          Full schedules & trip planning at metro.net
        </a>
      </div>
    </div>
  );
}
