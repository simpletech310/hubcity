"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import MapView from "@/components/ui/MapView";
import VendorLocationCard from "./VendorLocationCard";
import VendorPopup from "./VendorPopup";
import Chip from "@/components/ui/Chip";
import { createClient } from "@/lib/supabase/client";
import { haversineMiles } from "@/lib/geo";
import type {
  VendorVehicle,
  VendorStatus,
  VehicleType,
} from "@/types/database";
import type { MapPoint } from "@/types/map";

// Compton center — fallback when no geolocation
const COMPTON: [number, number] = [-118.2201, 33.8958];

type StatusFilter = "all" | "open" | "en_route" | "sold_out" | "offline";
type TypeFilter = "all" | "food_truck" | "cart";

const STATUS_COLORS: Partial<Record<VendorStatus, string>> = {
  open: "#22C55E",
  active: "#22C55E",
  en_route: "#F2A900",
  sold_out: "#FF6B6B",
  closed: "#6B7280",
  inactive: "#6B7280",
  cancelled: "#6B7280",
};

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "en_route", label: "On the way" },
  { key: "sold_out", label: "Sold out" },
  { key: "offline", label: "Offline" },
];

const TYPE_FILTERS: { key: TypeFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "food_truck", label: "Trucks" },
  { key: "cart", label: "Carts" },
];

function matchStatus(filter: StatusFilter, s: VendorStatus): boolean {
  if (filter === "all") return true;
  if (filter === "open") return s === "open" || s === "active";
  if (filter === "en_route") return s === "en_route";
  if (filter === "sold_out") return s === "sold_out";
  if (filter === "offline")
    return s === "closed" || s === "inactive" || s === "cancelled";
  return true;
}

interface FoodTruckTrackerProps {
  initialVehicles?: VendorVehicle[];
}

export default function FoodTruckTracker({ initialVehicles = [] }: FoodTruckTrackerProps) {
  const [vehicles, setVehicles] = useState<VendorVehicle[]>(initialVehicles);
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(COMPTON);
  const [mapZoom, setMapZoom] = useState(12);
  const [selected, setSelected] = useState<VendorVehicle | null>(null);
  const lastRefetchedAt = useRef(0);

  // ── Refetch helper ───────────────────────────────────────
  const refetch = useCallback(async () => {
    // Soft throttle — realtime can fire a burst, we only need one refresh
    const now = Date.now();
    if (now - lastRefetchedAt.current < 400) return;
    lastRefetchedAt.current = now;

    try {
      const res = await fetch("/api/food/vehicles?include_offline=1");
      if (!res.ok) return;
      const body = (await res.json()) as { vehicles: VendorVehicle[] };
      setVehicles(body.vehicles ?? []);
    } catch {
      // Silent — the next event or heartbeat will try again
    }
  }, []);

  // ── Initial fetch on mount (if server didn't preload) ────
  useEffect(() => {
    if (vehicles.length === 0) refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Supabase Realtime subscription ───────────────────────
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("food-truck-tracker")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "vendor_vehicles" },
        () => {
          refetch();
        }
      )
      .subscribe();

    // Heartbeat safety net if the socket ever drops silently
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") refetch();
    }, 120_000);

    const onVisible = () => {
      if (document.visibilityState === "visible") refetch();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refetch]);

  // ── Filtered list ────────────────────────────────────────
  const filtered = useMemo(() => {
    return vehicles.filter((v) => {
      if (!v.is_active) return false;
      if (typeFilter !== "all" && v.vehicle_type !== typeFilter) return false;
      if (!matchStatus(statusFilter, v.vendor_status)) return false;
      return true;
    });
  }, [vehicles, statusFilter, typeFilter]);

  // Only vehicles with coords can appear on the map
  const mappable = useMemo(
    () =>
      filtered.filter(
        (v): v is VendorVehicle & { current_lat: number; current_lng: number } =>
          typeof v.current_lat === "number" && typeof v.current_lng === "number"
      ),
    [filtered]
  );

  // Sorted list for cards (distance if geolocated, else recency)
  const sorted = useMemo(() => {
    if (userCoords) {
      return [...filtered]
        .map((v) => {
          const dist =
            v.current_lat != null && v.current_lng != null
              ? haversineMiles(
                  { lat: userCoords[1], lng: userCoords[0] },
                  { lat: v.current_lat, lng: v.current_lng }
                )
              : Number.POSITIVE_INFINITY;
          return { v, dist };
        })
        .sort((a, b) => a.dist - b.dist);
    }
    return [...filtered]
      .map((v) => ({ v, dist: null as number | null }))
      .sort((a, b) => {
        const ta = a.v.location_updated_at ? new Date(a.v.location_updated_at).getTime() : 0;
        const tb = b.v.location_updated_at ? new Date(b.v.location_updated_at).getTime() : 0;
        return tb - ta;
      });
  }, [filtered, userCoords]);

  // ── Map points ───────────────────────────────────────────
  const mapPoints: MapPoint[] = useMemo(
    () =>
      mappable.map((v) => ({
        id: v.id,
        type: "business",
        name: v.business?.name ?? v.name,
        latitude: v.current_lat,
        longitude: v.current_lng,
        color: STATUS_COLORS[v.vendor_status] ?? "#F2A900",
        metadata: {
          vehicle_id: v.id,
          vehicle_name: v.name,
          vehicle_type: v.vehicle_type,
          vendor_status: v.vendor_status,
        },
      })),
    [mappable]
  );

  const handlePointClick = useCallback(
    (point: MapPoint) => {
      const v = vehicles.find((x) => x.id === point.id);
      if (v) setSelected(v);
    },
    [vehicles]
  );

  // ── Near-me geolocation ──────────────────────────────────
  const findNearMe = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation isn't available on this device.");
      return;
    }
    setGeoLoading(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [
          pos.coords.longitude,
          pos.coords.latitude,
        ];
        setUserCoords(coords);
        setMapCenter(coords);
        setMapZoom(13.5);
        setGeoLoading(false);
      },
      (err) => {
        setGeoError(err.message || "Couldn't read your location.");
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  const activeCount = vehicles.filter(
    (v) =>
      v.is_active &&
      (v.vendor_status === "open" ||
        v.vendor_status === "active" ||
        v.vendor_status === "en_route")
  ).length;

  return (
    <section className="mb-8">
      {/* Header */}
      <div className="px-5 mb-3 flex items-start justify-between">
        <div>
          <h2
            className="c-card-t inline-flex items-center gap-2"
            style={{ fontSize: 16, color: "var(--ink-strong)" }}
          >
            <Icon name="truck" size={18} style={{ color: "var(--ink-strong)" }} />
            Food Truck Tracker
          </h2>
          <p className="c-kicker mt-1" style={{ fontSize: 9, opacity: 0.6 }}>
            § REAL-TIME · UPDATED AS VENDORS MOVE
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span
            className="inline-flex items-center gap-1 c-kicker px-2"
            style={{
              background: "var(--gold-c)",
              border: "2px solid var(--rule-strong-c)",
              color: "var(--ink-strong)",
              fontSize: 9,
              height: 22,
            }}
          >
            <span
              className="animate-pulse"
              style={{
                width: 5,
                height: 5,
                background: "var(--ink-strong)",
                display: "inline-block",
              }}
            />
            {activeCount} ROLLING
          </span>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="c-kicker inline-flex items-center gap-1 press"
            style={{ fontSize: 10, color: "var(--ink-strong)", opacity: 0.65 }}
          >
            <Icon name="filter" size={10} />
            {showFilters ? "HIDE" : "FILTER"}
            {(statusFilter !== "all" || typeFilter !== "all") && !showFilters && (
              <span
                style={{
                  width: 5,
                  height: 5,
                  background: "var(--gold-c)",
                  display: "inline-block",
                  marginLeft: 2,
                }}
              />
            )}
          </button>
        </div>
      </div>

      {/* Filter chips (Collapsible) */}
      {showFilters && (
        <div className="px-5 mb-3 animate-fade-in">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 mb-1.5">
            {TYPE_FILTERS.map((f) => (
              <Chip
                key={f.key}
                label={f.label}
                active={typeFilter === f.key}
                onClick={() => setTypeFilter(f.key)}
              />
            ))}
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {STATUS_FILTERS.map((f) => (
              <Chip
                key={f.key}
                label={f.label}
                active={statusFilter === f.key}
                onClick={() => setStatusFilter(f.key)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Map + Near me */}
      <div className="px-5 mb-3">
        <div
          className="relative overflow-hidden"
          style={{ border: "2px solid var(--rule-strong-c)" }}
        >
          <MapView
            points={mapPoints}
            center={mapCenter}
            zoom={mapZoom}
            height="320px"
            showUserLocation
            onPointClick={handlePointClick}
          />

          {/* Near-me button overlay — paper chip with ink border */}
          <button
            onClick={findNearMe}
            disabled={geoLoading}
            className="absolute top-3 right-3 inline-flex items-center gap-1.5 c-kicker press"
            style={{
              background: "var(--paper)",
              border: "2px solid var(--rule-strong-c)",
              color: "var(--ink-strong)",
              padding: "6px 10px",
              fontSize: 10,
              opacity: geoLoading ? 0.5 : 1,
            }}
          >
            <Icon name="navigation" size={12} style={{ color: "var(--gold-c)" }} />
            {geoLoading ? "LOCATING…" : userCoords ? "RE-CENTER" : "NEAR ME"}
          </button>
        </div>
        {geoError && (
          <p
            className="c-serif-it mt-2 text-center"
            style={{ fontSize: 11, color: "var(--ink-strong)", opacity: 0.7 }}
          >
            {geoError}
          </p>
        )}
      </div>

      {/* Selected vehicle popup (inline beneath the map) */}
      {selected && (
        <div className="px-5 mb-4">
          <VendorPopup
            vehicle={selected}
            userCoords={userCoords}
            onClose={() => setSelected(null)}
          />
        </div>
      )}

      {/* Vehicle list — horizontal scroll strip */}
      {sorted.length === 0 ? (
        <div
          className="c-serif-it text-center py-8 px-5"
          style={{ fontSize: 13, color: "var(--ink-strong)", opacity: 0.65 }}
        >
          No vehicles match those filters.
        </div>
      ) : (
        <div
          className="flex overflow-x-auto scrollbar-hide gap-3"
          style={{ padding: "0 20px 12px" }}
        >
          {sorted.map(({ v, dist }) => (
            <VendorLocationCard
              key={v.id}
              vehicle={v}
              distanceMiles={dist}
            />
          ))}
        </div>
      )}

      {/* Owner CTA */}
      <div className="px-5 mt-4">
        <Link
          href="/dashboard/location"
          className="block text-center c-kicker press"
          style={{ fontSize: 10, color: "var(--ink-strong)", opacity: 0.6 }}
        >
          RUN A FOOD TRUCK OR CART? MANAGE YOUR FLEET ↗
        </Link>
      </div>
    </section>
  );
}
