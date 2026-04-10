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
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
        Now
      </span>
    );
  }
  if (minutes <= 5) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
        {minutes} min
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/8 text-white/70 border border-white/10">
      {minutes} min
    </span>
  );
}

function StopCard({ stop, arrivalsData, onRefresh }: {
  stop: StopInfo;
  arrivalsData: ArrivalsState[string] | undefined;
  onRefresh: (stop: StopInfo) => void;
}) {
  const route = COMPTON_ROUTES.find(r => r.routeCode === stop.routeCode);
  const isRail = route?.type === "rail";

  return (
    <div className="rounded-2xl bg-white/[0.04] border border-white/[0.07] overflow-hidden">
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
          <p className="text-[13px] font-bold text-white truncate">{stop.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
              style={{ color: route?.color || "#F2A900", background: `${route?.color || "#F2A900"}18` }}
            >
              {route?.label || stop.routeCode}
            </span>
            <span className="text-[10px] text-white/40 truncate">{stop.address}</span>
          </div>
        </div>
        <button
          onClick={() => onRefresh(stop)}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/8 transition-all shrink-0"
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
            <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
            <span className="text-[12px] text-white/40">Loading arrivals...</span>
          </div>
        ) : arrivalsData?.error ? (
          <div className="py-2">
            <p className="text-[12px] text-white/40">{arrivalsData.error}</p>
            <p className="text-[11px] text-white/25 mt-1">Check <a href="https://metro.net" target="_blank" rel="noreferrer" className="text-[#F2A900]/60 underline">metro.net</a> for schedules</p>
          </div>
        ) : arrivalsData?.arrivals.length ? (
          <div className="space-y-2">
            {arrivalsData.arrivals.slice(0, 3).map((a, i) => (
              <div key={`${a.trip_id}-${i}`} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[11px] text-white/40 w-4 shrink-0">{i + 1}</span>
                  <p className="text-[12px] text-white/70 truncate">
                    {a.headsign || route?.direction || "Inbound"}
                  </p>
                </div>
                <MinuteBadge minutes={a.minutes_away} />
              </div>
            ))}
            {arrivalsData.lastFetched && (
              <p className="text-[10px] text-white/20 pt-1">
                Updated {Math.round((Date.now() / 1000 - arrivalsData.lastFetched) / 60) < 1
                  ? "just now"
                  : `${Math.round((Date.now() / 1000 - arrivalsData.lastFetched) / 60)}m ago`}
              </p>
            )}
          </div>
        ) : (
          <p className="text-[12px] text-white/35 py-1">No arrivals found — service may not be running</p>
        )}
      </div>

      {/* Footer actions */}
      <div className="px-4 pb-3 flex gap-2">
        <a
          href={`https://maps.google.com/?q=${stop.lat},${stop.lng}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 text-[11px] text-white/40 hover:text-white/70 transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
          Directions
        </a>
        <span className="text-white/15">·</span>
        <Link
          href={`/map?lat=${stop.lat}&lng=${stop.lng}&zoom=17`}
          className="flex items-center gap-1.5 text-[11px] text-white/40 hover:text-[#F2A900]/70 transition-colors"
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
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h1 className="font-heading font-bold text-xl text-white">Transit Tracker</h1>
            <p className="text-[12px] text-white/40 mt-0.5">LA Metro · Live arrivals · Compton</p>
          </div>
          <button
            onClick={refreshAll}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F2A900]/10 border border-[#F2A900]/20 text-[#F2A900] text-[11px] font-bold press hover:bg-[#F2A900]/15 transition-all"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 4v6h-6" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            Refresh All
          </button>
        </div>

        {/* Live indicator */}
        <div className="flex items-center gap-2 mt-3 mb-4">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] text-white/40">
            Live · Updates every 60s · Powered by{" "}
            <a href="https://api.metro.net" target="_blank" rel="noreferrer" className="text-[#F2A900]/60 hover:text-[#F2A900] transition-colors">
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
              className={`px-4 py-2 rounded-xl text-[12px] font-bold transition-all ${
                activeFilter === f
                  ? "bg-[#F2A900] text-[#0A0A0A]"
                  : "bg-white/[0.05] text-white/50 hover:text-white/80"
              }`}
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
            <div className="w-1 h-5 rounded-full bg-[#0072BC]" />
            <h2 className="font-heading font-bold text-sm text-white">Rail</h2>
            <span className="text-[10px] text-white/30">{railStops.length} stations</span>
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
            <div className="w-1 h-5 rounded-full bg-[#F2A900]" />
            <h2 className="font-heading font-bold text-sm text-white">Bus Routes</h2>
            <span className="text-[10px] text-white/30">{busStops.length} stops</span>
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
          className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-white/[0.04] border border-white/[0.07] text-[12px] text-white/50 hover:text-white/80 hover:border-white/15 transition-all"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          Full schedules & trip planning at metro.net
        </a>
      </div>
    </div>
  );
}
