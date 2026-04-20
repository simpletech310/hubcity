"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import { createClient } from "@/lib/supabase/client";
import { reverseGeocode } from "@/lib/mapbox";
import type {
  VendorStatus,
  VendorRouteStop,
  VendorVehicle,
  VehicleType,
} from "@/types/database";

const STATUS_OPTIONS: { value: VendorStatus; label: string; color: string }[] = [
  { value: "en_route", label: "On the way", color: "bg-gold" },
  { value: "open", label: "Open", color: "bg-emerald" },
  { value: "sold_out", label: "Sold out", color: "bg-coral" },
  { value: "closed", label: "Closed", color: "bg-white/30" },
  { value: "inactive", label: "Offline", color: "bg-white/20" },
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MAX_STOPS_PER_DAY = 6;

export default function FleetDashboardPage() {
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState<string>("");
  const [vehicles, setVehicles] = useState<VendorVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addingType, setAddingType] = useState<VehicleType | null>(null);
  const [newVehicleName, setNewVehicleName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Bootstrap: find the owner's mobile-vendor business ────
  useEffect(() => {
    async function bootstrap() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: biz } = await supabase
        .from("businesses")
        .select("id, name, is_mobile_vendor, business_sub_type")
        .eq("owner_id", user.id)
        .single();

      if (!biz) {
        setLoading(false);
        return;
      }

      setBusinessId(biz.id);
      setBusinessName(biz.name);

      // If they're marked as food_truck / cart sub-type but not flagged mobile yet, flip it
      if (
        !biz.is_mobile_vendor &&
        (biz.business_sub_type === "food_truck" || biz.business_sub_type === "cart")
      ) {
        await supabase
          .from("businesses")
          .update({ is_mobile_vendor: true })
          .eq("id", biz.id);
      }

      await loadVehicles(biz.id);
      setLoading(false);
    }
    bootstrap();
  }, []);

  const loadVehicles = useCallback(async (bizId: string) => {
    const res = await fetch(
      `/api/food/vehicles?owner=1&business_id=${encodeURIComponent(bizId)}`
    );
    if (!res.ok) return;
    const body = (await res.json()) as { vehicles: VendorVehicle[] };
    setVehicles(body.vehicles ?? []);
  }, []);

  // ── Create vehicle ───────────────────────────────────────
  const createVehicle = useCallback(async () => {
    if (!businessId || !addingType || !newVehicleName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/food/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_id: businessId,
          vehicle_type: addingType,
          name: newVehicleName.trim(),
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Failed to add vehicle");
      }
      const { vehicle } = (await res.json()) as { vehicle: VendorVehicle };
      setVehicles((v) => [...v, vehicle]);
      setNewVehicleName("");
      setAddingType(null);
      setExpandedId(vehicle.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setCreating(false);
    }
  }, [businessId, addingType, newVehicleName]);

  const handleVehicleUpdate = useCallback((updated: VendorVehicle) => {
    setVehicles((curr) => curr.map((v) => (v.id === updated.id ? updated : v)));
  }, []);

  const handleVehicleDelete = useCallback((id: string) => {
    setVehicles((curr) => curr.filter((v) => v.id !== id));
    setExpandedId(null);
  }, []);

  if (loading) {
    return (
      <div className="animate-fade-in px-5 pt-4 text-white/40 text-sm">
        Loading your fleet…
      </div>
    );
  }

  if (!businessId) {
    return (
      <div className="animate-fade-in px-5 pt-4">
        <Card>
          <p className="text-sm text-white/60">
            No business found on your account. Create one in Business Settings first.
          </p>
        </Card>
      </div>
    );
  }

  const totalActive = vehicles.filter(
    (v) => v.is_active && (v.vendor_status === "open" || v.vendor_status === "en_route" || v.vendor_status === "active")
  ).length;

  return (
    <div className="animate-fade-in px-5 pt-4 pb-8">
      <h1 className="font-heading text-xl font-bold mb-1">Fleet Manager</h1>
      <p className="text-sm text-txt-secondary mb-5">
        {businessName} &middot; {vehicles.length} vehicle{vehicles.length === 1 ? "" : "s"} &middot;{" "}
        <span className="text-emerald font-semibold">{totalActive} active now</span>
      </p>

      {/* Add-vehicle row */}
      <div className="mb-5">
        {addingType ? (
          <Card>
            <p className="text-[11px] uppercase tracking-wider text-white/40 font-bold mb-2">
              New {addingType === "food_truck" ? "Truck" : "Cart"}
            </p>
            <input
              type="text"
              placeholder={addingType === "food_truck" ? "Truck 2" : "Red Cart"}
              value={newVehicleName}
              onChange={(e) => setNewVehicleName(e.target.value)}
              autoFocus
              className="w-full bg-white/[0.04] border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-gold/40 mb-3"
            />
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setAddingType(null);
                  setNewVehicleName("");
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={createVehicle}
                loading={creating}
                disabled={!newVehicleName.trim()}
              >
                Add {addingType === "food_truck" ? "Truck" : "Cart"}
              </Button>
            </div>
            {error && <p className="text-xs text-coral mt-2">{error}</p>}
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setAddingType("food_truck")}
              className="rounded-2xl border-2 border-dashed border-white/10 bg-white/[0.02] py-4 flex flex-col items-center gap-1 press hover:border-gold/40 hover:bg-gold/[0.04]"
            >
              <Icon name="truck" size={20} className="text-gold" />
              <span className="text-[12px] font-bold text-white">+ Add truck</span>
            </button>
            <button
              onClick={() => setAddingType("cart")}
              className="rounded-2xl border-2 border-dashed border-white/10 bg-white/[0.02] py-4 flex flex-col items-center gap-1 press hover:border-gold/40 hover:bg-gold/[0.04]"
            >
              <Icon name="cart" size={20} className="text-gold" />
              <span className="text-[12px] font-bold text-white">+ Add cart</span>
            </button>
          </div>
        )}
      </div>

      {/* Vehicle list */}
      {vehicles.length === 0 ? (
        <Card>
          <p className="text-sm text-white/60 text-center">
            No vehicles yet. Add your first truck or cart above to start broadcasting your location.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {vehicles.map((v) => (
            <VehicleEditor
              key={v.id}
              vehicle={v}
              expanded={expandedId === v.id}
              onToggle={() => setExpandedId(expandedId === v.id ? null : v.id)}
              onUpdate={handleVehicleUpdate}
              onDelete={handleVehicleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Vehicle editor card
// ─────────────────────────────────────────────────────────────

interface VehicleEditorProps {
  vehicle: VendorVehicle;
  expanded: boolean;
  onToggle: () => void;
  onUpdate: (v: VendorVehicle) => void;
  onDelete: (id: string) => void;
}

function VehicleEditor({
  vehicle,
  expanded,
  onToggle,
  onUpdate,
  onDelete,
}: VehicleEditorProps) {
  const [status, setStatus] = useState<VendorStatus>(vehicle.vendor_status);
  const [locationName, setLocationName] = useState(vehicle.current_location_name ?? "");
  const [lat, setLat] = useState<number | null>(vehicle.current_lat);
  const [lng, setLng] = useState<number | null>(vehicle.current_lng);
  const [stops, setStops] = useState<VendorRouteStop[]>(vehicle.vendor_route ?? []);
  const [saving, setSaving] = useState(false);
  const [geoBusy, setGeoBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync from props if realtime or peer update arrives
  useEffect(() => {
    setStatus(vehicle.vendor_status);
    setLocationName(vehicle.current_location_name ?? "");
    setLat(vehicle.current_lat);
    setLng(vehicle.current_lng);
    setStops(vehicle.vendor_route ?? []);
  }, [vehicle]);

  const today = new Date().getDay();
  const todaysStops = useMemo(
    () => stops.filter((s) => s.day_of_week === today),
    [stops, today]
  );

  const statusMeta = STATUS_OPTIONS.find((s) => s.value === status) ?? STATUS_OPTIONS[4];
  const typeLabel = vehicle.vehicle_type === "cart" ? "Cart" : "Truck";

  // ── Geolocate + reverse-geocode ──────────────────────────
  const useMyLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setError("Geolocation isn't available.");
      return;
    }
    setGeoBusy(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        // Reverse geocode for a friendly location name
        try {
          const hit = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
          if (hit && !locationName) setLocationName(hit);
        } catch {
          // Non-fatal; user can type it themselves
        }
        setGeoBusy(false);
      },
      (err) => {
        setError(err.message || "Couldn't get your location.");
        setGeoBusy(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [locationName]);

  // ── Stops editing ────────────────────────────────────────
  const addTodayStop = () => {
    if (todaysStops.length >= MAX_STOPS_PER_DAY) return;
    setStops((curr) => [
      ...curr,
      {
        name: "",
        lat: 0,
        lng: 0,
        day_of_week: today,
        start_time: "11:00",
        end_time: "14:00",
      },
    ]);
  };

  const updateStop = (idx: number, patch: Partial<VendorRouteStop>) => {
    setStops((curr) => {
      const next = [...curr];
      // Find the idx-th stop within today's subset, map back to full array index
      const todayIndices = curr
        .map((s, i) => ({ s, i }))
        .filter(({ s }) => s.day_of_week === today)
        .map(({ i }) => i);
      const realIdx = todayIndices[idx];
      if (realIdx == null) return curr;
      next[realIdx] = { ...next[realIdx], ...patch };
      return next;
    });
  };

  const removeStop = (idx: number) => {
    setStops((curr) => {
      const todayIndices = curr
        .map((s, i) => ({ s, i }))
        .filter(({ s }) => s.day_of_week === today)
        .map(({ i }) => i);
      const realIdx = todayIndices[idx];
      if (realIdx == null) return curr;
      return curr.filter((_, i) => i !== realIdx);
    });
  };

  const useMyLocationForStop = (idx: number) => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        let name = "";
        try {
          name = (await reverseGeocode(pos.coords.latitude, pos.coords.longitude)) ?? "";
        } catch {}
        updateStop(idx, {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          ...(name ? { name } : {}),
        });
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // ── Save ─────────────────────────────────────────────────
  const save = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/food/vehicles/${vehicle.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor_status: status,
          current_lat: lat,
          current_lng: lng,
          current_location_name: locationName || null,
          vendor_route: stops,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Failed to save");
      }
      const { vehicle: updated } = (await res.json()) as { vehicle: VendorVehicle };
      onUpdate(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }, [vehicle.id, status, lat, lng, locationName, stops, onUpdate]);

  const remove = useCallback(async () => {
    if (!confirm(`Remove "${vehicle.name}" from the fleet?`)) return;
    const res = await fetch(`/api/food/vehicles/${vehicle.id}`, { method: "DELETE" });
    if (res.ok) onDelete(vehicle.id);
  }, [vehicle.id, vehicle.name, onDelete]);

  return (
    <Card padding={false} className="overflow-hidden">
      {/* Header row */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 press"
      >
        <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0">
          <Icon
            name={vehicle.vehicle_type === "cart" ? "cart" : "truck"}
            size={18}
            className="text-gold"
          />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="font-heading font-bold text-[13px] truncate">{vehicle.name}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className={`w-1.5 h-1.5 rounded-full ${statusMeta.color}`} />
            <span className="text-[11px] text-white/60">{statusMeta.label}</span>
            <span className="text-[11px] text-white/30">&middot; {typeLabel}</span>
          </div>
        </div>
        <Icon
          name={expanded ? "chevron-up" : "chevron-down"}
          size={18}
          className="text-white/30"
        />
      </button>

      {expanded && (
        <div className="border-t border-white/[0.06] p-4 space-y-4">
          {/* Status */}
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-white/40 mb-2">
              Status
            </p>
            <div className="grid grid-cols-2 gap-2">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setStatus(opt.value)}
                  className={`flex items-center justify-center gap-2 py-2 rounded-xl text-[12px] font-semibold transition-colors press ${
                    status === opt.value
                      ? "bg-gold/15 text-gold border border-gold/30"
                      : "bg-white/[0.04] text-white/60 border border-border-subtle"
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${opt.color}`} />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Current spot */}
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-white/40 mb-2">
              Current Spot
            </p>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="e.g. Corner of Rosecrans & Central"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="w-full bg-white/[0.04] border border-border-subtle rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-gold/40"
              />
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={useMyLocation}
                  loading={geoBusy}
                >
                  <Icon name="navigation" size={14} /> Use my location
                </Button>
                {lat != null && lng != null && (
                  <span className="text-[10px] text-white/40 font-mono tabular-nums">
                    {lat.toFixed(4)}, {lng.toFixed(4)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Today's stops */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] uppercase tracking-wider font-bold text-white/40">
                Today's Stops ({DAY_NAMES[today]})
              </p>
              {todaysStops.length < MAX_STOPS_PER_DAY && (
                <button
                  onClick={addTodayStop}
                  className="text-[11px] font-semibold text-gold press"
                >
                  + Add stop
                </button>
              )}
            </div>
            {todaysStops.length === 0 ? (
              <p className="text-[11px] text-white/40">
                No stops planned today. Add one so customers know where you&apos;re headed.
              </p>
            ) : (
              <div className="space-y-2">
                {todaysStops.map((stop, i) => (
                  <div
                    key={i}
                    className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-2.5 space-y-1.5"
                  >
                    <input
                      type="text"
                      placeholder="Stop name (e.g. Compton City Hall)"
                      value={stop.name}
                      onChange={(e) => updateStop(i, { name: e.target.value })}
                      className="w-full bg-white/[0.04] border border-border-subtle rounded-lg px-2.5 py-1.5 text-[12px] text-white placeholder:text-white/30 outline-none focus:border-gold/40"
                    />
                    <div className="flex gap-2">
                      <input
                        type="time"
                        value={stop.start_time}
                        onChange={(e) => updateStop(i, { start_time: e.target.value })}
                        className="flex-1 bg-white/[0.04] border border-border-subtle rounded-lg px-2 py-1.5 text-[12px] text-white outline-none focus:border-gold/40"
                      />
                      <span className="self-center text-white/30 text-[10px]">to</span>
                      <input
                        type="time"
                        value={stop.end_time}
                        onChange={(e) => updateStop(i, { end_time: e.target.value })}
                        className="flex-1 bg-white/[0.04] border border-border-subtle rounded-lg px-2 py-1.5 text-[12px] text-white outline-none focus:border-gold/40"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => useMyLocationForStop(i)}
                        className="text-[10px] text-gold font-semibold press"
                      >
                        <Icon name="navigation" size={10} /> Use here
                      </button>
                      {stop.lat !== 0 && stop.lng !== 0 && (
                        <span className="text-[9px] text-white/30 font-mono">
                          {stop.lat.toFixed(3)}, {stop.lng.toFixed(3)}
                        </span>
                      )}
                      <button
                        onClick={() => removeStop(i)}
                        className="ml-auto text-[10px] text-coral font-semibold press"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Save / Remove */}
          <div className="flex items-center gap-2 pt-2 border-t border-white/[0.04]">
            <button
              onClick={remove}
              className="text-[12px] text-coral/80 font-semibold press hover:text-coral"
            >
              Remove vehicle
            </button>
            <div className="ml-auto">
              <Button onClick={save} loading={saving} size="sm">
                Save changes
              </Button>
            </div>
          </div>
          {error && <p className="text-xs text-coral">{error}</p>}
        </div>
      )}
    </Card>
  );
}
