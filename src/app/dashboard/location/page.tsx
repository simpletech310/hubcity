"use client";

import { useState, useEffect, useCallback } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/client";
import type { VendorStatus } from "@/types/database";
import Icon from "@/components/ui/Icon";

const statusOptions: { value: VendorStatus; label: string; color: string }[] = [
  { value: "active", label: "Active", color: "bg-emerald" },
  { value: "en_route", label: "En Route", color: "bg-gold" },
  { value: "inactive", label: "Inactive", color: "bg-txt-secondary" },
];

const dayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

interface RouteEntry {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  location_name: string;
}

export default function VendorLocationPage() {
  const [vendorStatus, setVendorStatus] = useState<VendorStatus>("inactive");
  const [locationName, setLocationName] = useState("");
  const [currentLat, setCurrentLat] = useState<number | null>(null);
  const [currentLng, setCurrentLng] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);

  // Route schedule
  const [routeSchedule, setRouteSchedule] = useState<RouteEntry[]>([]);
  const [newRoute, setNewRoute] = useState<RouteEntry>({
    day_of_week: 1,
    start_time: "11:00",
    end_time: "14:00",
    location_name: "",
  });
  const [savingRoute, setSavingRoute] = useState(false);

  // Load current state
  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: business } = await supabase
        .from("businesses")
        .select(
          "id, vendor_status, current_lat, current_lng, current_location_name, location_updated_at"
        )
        .eq("owner_id", user.id)
        .eq("is_mobile_vendor", true)
        .single();

      if (business) {
        setBusinessId(business.id);
        setVendorStatus(business.vendor_status ?? "inactive");
        setCurrentLat(business.current_lat);
        setCurrentLng(business.current_lng);
        setLocationName(business.current_location_name ?? "");
        setLastUpdated(business.location_updated_at);

        // Load route schedule
        const { data: routes } = await supabase
          .from("vendor_route_schedules")
          .select("*")
          .eq("business_id", business.id)
          .order("day_of_week")
          .order("start_time");

        if (routes) setRouteSchedule(routes);
      }
    }
    load();
  }, []);

  const updateLocation = useCallback(async () => {
    setUpdating(true);
    try {
      const res = await fetch("/api/food/vendors/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_lat: currentLat,
          current_lng: currentLng,
          current_location_name: locationName,
          vendor_status: vendorStatus,
        }),
      });

      if (!res.ok) throw new Error("Failed to update");

      const data = await res.json();
      setLastUpdated(data.business?.location_updated_at ?? new Date().toISOString());
    } catch {
      alert("Failed to update location. Please try again.");
    } finally {
      setUpdating(false);
    }
  }, [currentLat, currentLng, locationName, vendorStatus]);

  const getGeolocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser");
      return;
    }

    setGeoLoading(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLat(position.coords.latitude);
        setCurrentLng(position.coords.longitude);
        setGeoLoading(false);
      },
      (error) => {
        setGeoError(error.message);
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const addRouteEntry = useCallback(async () => {
    if (!businessId || !newRoute.location_name) return;
    setSavingRoute(true);

    const supabase = createClient();
    const { data, error } = await supabase
      .from("vendor_route_schedules")
      .insert({
        business_id: businessId,
        ...newRoute,
      })
      .select("*")
      .single();

    if (!error && data) {
      setRouteSchedule((prev) => [...prev, data]);
      setNewRoute({
        day_of_week: 1,
        start_time: "11:00",
        end_time: "14:00",
        location_name: "",
      });
    }
    setSavingRoute(false);
  }, [businessId, newRoute]);

  const deleteRouteEntry = useCallback(
    async (id: string) => {
      if (!id) return;
      const supabase = createClient();
      await supabase.from("vendor_route_schedules").delete().eq("id", id);
      setRouteSchedule((prev) => prev.filter((r) => r.id !== id));
    },
    []
  );

  const lastUpdatedStr = lastUpdated
    ? new Date(lastUpdated).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "Never";

  return (
    <div className="animate-fade-in px-5 pt-4">
      <h1 className="font-heading text-xl font-bold mb-1">
        Location Manager
      </h1>
      <p className="text-sm text-txt-secondary mb-5">
        Update your truck&apos;s live location
      </p>

      {/* Status Toggle */}
      <Card className="mb-4">
        <h2 className="font-heading font-bold text-sm mb-3">Current Status</h2>
        <div className="flex gap-2">
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setVendorStatus(opt.value)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all press ${
                vendorStatus === opt.value
                  ? "bg-gold/15 text-gold border border-gold/30"
                  : "bg-white/[0.04] text-txt-secondary border border-border-subtle"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${opt.color} ${
                  vendorStatus === opt.value && opt.value === "active"
                    ? "animate-pulse"
                    : ""
                }`}
              />
              {opt.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Geolocation */}
      <Card className="mb-4">
        <h2 className="font-heading font-bold text-sm mb-3">GPS Location</h2>
        <Button
          onClick={getGeolocation}
          loading={geoLoading}
          variant="secondary"
          fullWidth
          size="sm"
        >
          <Icon name="pin" size={16} /> Update My Location
        </Button>
        {geoError && (
          <p className="text-xs text-coral mt-2">{geoError}</p>
        )}
        {currentLat && currentLng && (
          <p className="text-xs text-txt-secondary mt-2">
            Coords: {currentLat.toFixed(5)}, {currentLng.toFixed(5)}
          </p>
        )}
      </Card>

      {/* Location Name */}
      <Card className="mb-4">
        <h2 className="font-heading font-bold text-sm mb-3">
          Location Description
        </h2>
        <input
          type="text"
          placeholder="e.g., Corner of Rosecrans & Central"
          value={locationName}
          onChange={(e) => setLocationName(e.target.value)}
          className="w-full bg-white/[0.04] border border-border-subtle rounded-xl px-4 py-3 text-sm text-white placeholder:text-txt-secondary/60 outline-none focus:border-gold/30 transition-colors"
        />
      </Card>

      {/* Save Button */}
      <Button
        onClick={updateLocation}
        loading={updating}
        fullWidth
        size="lg"
        className="mb-3"
      >
        Save Location & Status
      </Button>

      <p className="text-[11px] text-txt-secondary text-center mb-8">
        Last updated: {lastUpdatedStr}
      </p>

      {/* Divider */}
      <div className="divider-subtle mb-6" />

      {/* Weekly Route Schedule */}
      <h2 className="font-heading font-bold text-base mb-4">
        Weekly Route Schedule
      </h2>

      {/* Existing entries */}
      {routeSchedule.length > 0 && (
        <div className="space-y-2 mb-4">
          {routeSchedule.map((entry) => (
            <Card key={entry.id}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold">
                    {dayNames[entry.day_of_week]}
                  </p>
                  <p className="text-[11px] text-txt-secondary">
                    {entry.start_time} - {entry.end_time}
                  </p>
                  <p className="text-[11px] text-txt-secondary">
                    <Icon name="pin" size={16} /> {entry.location_name}
                  </p>
                </div>
                <button
                  onClick={() => entry.id && deleteRouteEntry(entry.id)}
                  className="text-coral text-xs press"
                >
                  Remove
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add new route entry */}
      <Card className="mb-8">
        <h3 className="font-heading font-bold text-sm mb-3">Add Route Stop</h3>
        <div className="space-y-3">
          <select
            value={newRoute.day_of_week}
            onChange={(e) =>
              setNewRoute((prev) => ({
                ...prev,
                day_of_week: parseInt(e.target.value),
              }))
            }
            className="w-full bg-white/[0.04] border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-gold/30 transition-colors"
          >
            {dayNames.map((day, i) => (
              <option key={i} value={i} className="bg-midnight">
                {day}
              </option>
            ))}
          </select>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[10px] text-txt-secondary mb-1 block">
                Start
              </label>
              <input
                type="time"
                value={newRoute.start_time}
                onChange={(e) =>
                  setNewRoute((prev) => ({
                    ...prev,
                    start_time: e.target.value,
                  }))
                }
                className="w-full bg-white/[0.04] border border-border-subtle rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-gold/30 transition-colors"
              />
            </div>
            <div className="flex-1">
              <label className="text-[10px] text-txt-secondary mb-1 block">
                End
              </label>
              <input
                type="time"
                value={newRoute.end_time}
                onChange={(e) =>
                  setNewRoute((prev) => ({
                    ...prev,
                    end_time: e.target.value,
                  }))
                }
                className="w-full bg-white/[0.04] border border-border-subtle rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-gold/30 transition-colors"
              />
            </div>
          </div>

          <input
            type="text"
            placeholder="Location name (e.g., MLK & Wilmington)"
            value={newRoute.location_name}
            onChange={(e) =>
              setNewRoute((prev) => ({
                ...prev,
                location_name: e.target.value,
              }))
            }
            className="w-full bg-white/[0.04] border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-txt-secondary/60 outline-none focus:border-gold/30 transition-colors"
          />

          <Button
            onClick={addRouteEntry}
            loading={savingRoute}
            variant="outline"
            fullWidth
            size="sm"
            disabled={!newRoute.location_name}
          >
            Add Route Stop
          </Button>
        </div>
      </Card>
    </div>
  );
}
