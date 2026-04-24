"use client";

import { useCallback, useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

// ── Types ────────────────────────────────────────────────────────────────────

interface City {
  id: string;
  name: string;
  slug: string;
}

interface BusinessLocation {
  id: string;
  business_id: string;
  owner_id: string;
  name: string;
  address: string | null;
  city_id: string | null;
  phone: string | null;
  hours: Record<string, { open: string; close: string }>;
  is_primary: boolean;
  is_active: boolean;
  created_at: string;
  city?: { name: string; slug: string } | null;
}

// ── Hours helpers ─────────────────────────────────────────────────────────────

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
type Day = (typeof DAYS)[number];
const DAY_LABELS: Record<Day, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

type HoursMap = Partial<Record<Day, { open: string; close: string }>>;

function emptyHours(): HoursMap {
  return {};
}

// ── Form state ────────────────────────────────────────────────────────────────

interface LocationForm {
  id?: string;
  name: string;
  city_id: string;
  address: string;
  phone: string;
  is_primary: boolean;
  hours: HoursMap;
}

function emptyForm(): LocationForm {
  return {
    name: "",
    city_id: "",
    address: "",
    phone: "",
    is_primary: false,
    hours: emptyHours(),
  };
}

function formFromLocation(loc: BusinessLocation): LocationForm {
  return {
    id: loc.id,
    name: loc.name,
    city_id: loc.city_id ?? "",
    address: loc.address ?? "",
    phone: loc.phone ?? "",
    is_primary: loc.is_primary,
    hours: (loc.hours ?? {}) as HoursMap,
  };
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function LocationsPage() {
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState("");
  const [locations, setLocations] = useState<BusinessLocation[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<LocationForm>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Bootstrap ──────────────────────────────────────────────────────────────
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

      const [bizRes, citiesRes] = await Promise.all([
        supabase
          .from("businesses")
          .select("id, name, city_id")
          .eq("owner_id", user.id)
          .single(),
        supabase
          .from("cities")
          .select("id, name, slug")
          .eq("launch_status", "live"),
      ]);

      const biz = bizRes.data;
      if (!biz) {
        setLoading(false);
        return;
      }

      setBusinessId(biz.id);
      setBusinessName(biz.name);
      setCities((citiesRes.data ?? []) as City[]);

      const { data: locs } = await supabase
        .from("business_locations")
        .select("*, city:cities(name, slug)")
        .eq("business_id", biz.id)
        .eq("is_active", true)
        .order("is_primary", { ascending: false });

      setLocations((locs ?? []) as BusinessLocation[]);
      setLoading(false);
    }
    bootstrap();
  }, []);

  // ── Refresh locations ──────────────────────────────────────────────────────
  const refreshLocations = useCallback(async (bizId: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from("business_locations")
      .select("*, city:cities(name, slug)")
      .eq("business_id", bizId)
      .eq("is_active", true)
      .order("is_primary", { ascending: false });
    setLocations((data ?? []) as BusinessLocation[]);
  }, []);

  // ── Open form for add / edit ───────────────────────────────────────────────
  const openAddForm = () => {
    setForm(emptyForm());
    setError(null);
    setShowForm(true);
  };

  const openEditForm = (loc: BusinessLocation) => {
    setForm(formFromLocation(loc));
    setError(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setForm(emptyForm());
    setError(null);
  };

  // ── Save (insert or update) ────────────────────────────────────────────────
  const save = useCallback(async () => {
    if (!businessId) return;
    if (!form.name.trim()) {
      setError("Location name is required.");
      return;
    }
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Not signed in.");
      setSaving(false);
      return;
    }

    // If setting as primary, clear primary on others first
    if (form.is_primary) {
      await supabase
        .from("business_locations")
        .update({ is_primary: false })
        .eq("business_id", businessId);
    }

    const payload = {
      business_id: businessId,
      owner_id: user.id,
      name: form.name.trim(),
      city_id: form.city_id || null,
      address: form.address.trim() || null,
      phone: form.phone.trim() || null,
      is_primary: form.is_primary,
      hours: form.hours,
    };

    let err: { message: string } | null = null;
    if (form.id) {
      // Update
      const res = await supabase
        .from("business_locations")
        .update(payload)
        .eq("id", form.id);
      err = res.error;
    } else {
      // Insert
      const res = await supabase.from("business_locations").insert(payload);
      err = res.error;
    }

    if (err) {
      setError(err.message);
      setSaving(false);
      return;
    }

    await refreshLocations(businessId);
    closeForm();
    setSaving(false);
  }, [businessId, form, refreshLocations]);

  // ── Set as primary ────────────────────────────────────────────────────────
  const setAsPrimary = useCallback(
    async (locId: string) => {
      if (!businessId) return;
      const supabase = createClient();
      // Clear all primaries first
      await supabase
        .from("business_locations")
        .update({ is_primary: false })
        .eq("business_id", businessId);
      // Set new primary
      await supabase
        .from("business_locations")
        .update({ is_primary: true })
        .eq("id", locId);
      await refreshLocations(businessId);
    },
    [businessId, refreshLocations]
  );

  // ── Deactivate ────────────────────────────────────────────────────────────
  const deactivate = useCallback(
    async (loc: BusinessLocation) => {
      if (!businessId) return;
      if (
        !confirm(
          `Remove "${loc.name}" from your active locations? This can't be undone here.`
        )
      )
        return;
      const supabase = createClient();
      await supabase
        .from("business_locations")
        .update({ is_active: false })
        .eq("id", loc.id);
      await refreshLocations(businessId);
    },
    [businessId, refreshLocations]
  );

  // ── Hours helpers ──────────────────────────────────────────────────────────
  const setHourField = (
    day: Day,
    field: "open" | "close",
    value: string
  ) => {
    setForm((prev) => {
      const existing = prev.hours[day] ?? { open: "", close: "" };
      return {
        ...prev,
        hours: {
          ...prev.hours,
          [day]: { ...existing, [field]: value },
        },
      };
    });
  };

  const toggleDay = (day: Day) => {
    setForm((prev) => {
      const next = { ...prev.hours };
      if (next[day]) {
        delete next[day];
      } else {
        next[day] = { open: "09:00", close: "17:00" };
      }
      return { ...prev, hours: next };
    });
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="animate-fade-in px-5 pt-4 text-white/40 text-sm">
        Loading locations…
      </div>
    );
  }

  if (!businessId) {
    return (
      <div className="animate-fade-in px-5 pt-4">
        <Card>
          <p className="text-sm text-white/60">
            No business found on your account. Create one in Business Settings
            first.
          </p>
        </Card>
      </div>
    );
  }

  const primaryLoc = locations.find((l) => l.is_primary);
  const otherLocs = locations.filter((l) => !l.is_primary);

  return (
    <div className="animate-fade-in px-5 pt-4 pb-10">
      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-1">
        <div>
          <h1 className="font-heading text-xl font-bold">Locations</h1>
          <p className="text-sm text-white/50 mt-0.5">{businessName}</p>
        </div>
        {!showForm && (
          <button
            onClick={openAddForm}
            className="px-4 py-2 rounded-xl bg-gold text-midnight text-xs font-bold press hover:opacity-90 transition-opacity"
          >
            + Add Location
          </button>
        )}
      </div>

      {/* ── Location cards ─────────────────────────────────── */}
      {locations.length === 0 && !showForm && (
        <Card className="mt-5 text-center">
          <p className="text-sm text-white/60">
            You only have one location. Add another to expand your reach across
            cities.
          </p>
        </Card>
      )}

      <div className="mt-5 space-y-3">
        {/* Primary card */}
        {primaryLoc && (
          <LocationCard
            loc={primaryLoc}
            cities={cities}
            onEdit={() => openEditForm(primaryLoc)}
            onSetPrimary={() => setAsPrimary(primaryLoc.id)}
            onDeactivate={() => deactivate(primaryLoc)}
          />
        )}

        {/* Additional cards */}
        {otherLocs.map((loc) => (
          <LocationCard
            key={loc.id}
            loc={loc}
            cities={cities}
            onEdit={() => openEditForm(loc)}
            onSetPrimary={() => setAsPrimary(loc.id)}
            onDeactivate={() => deactivate(loc)}
          />
        ))}
      </div>

      {/* ── Add / Edit form ─────────────────────────────────── */}
      {showForm && (
        <div className="mt-5">
          <Card>
            <h2 className="font-heading font-bold text-base mb-4">
              {form.id ? "Edit Location" : "New Location"}
            </h2>

            {/* Name */}
            <FieldLabel>Location Name</FieldLabel>
            <input
              type="text"
              placeholder='e.g. "Downtown" or "Compton"'
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className={INPUT_CLS}
            />

            {/* City */}
            {cities.length > 0 && (
              <>
                <FieldLabel>City</FieldLabel>
                <select
                  value={form.city_id}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, city_id: e.target.value }))
                  }
                  className={INPUT_CLS}
                >
                  <option value="">Select a city…</option>
                  {cities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </>
            )}

            {/* Address */}
            <FieldLabel>Address</FieldLabel>
            <input
              type="text"
              placeholder="123 Main St"
              value={form.address}
              onChange={(e) =>
                setForm((p) => ({ ...p, address: e.target.value }))
              }
              className={INPUT_CLS}
            />

            {/* Phone */}
            <FieldLabel>Phone</FieldLabel>
            <input
              type="tel"
              placeholder="(310) 555-0100"
              value={form.phone}
              onChange={(e) =>
                setForm((p) => ({ ...p, phone: e.target.value }))
              }
              className={INPUT_CLS}
            />

            {/* Set as primary */}
            <label className="flex items-center gap-2.5 mt-4 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_primary}
                onChange={(e) =>
                  setForm((p) => ({ ...p, is_primary: e.target.checked }))
                }
                className="w-4 h-4 accent-gold"
              />
              <span className="text-sm text-white/80">
                Set as primary location
              </span>
            </label>

            {/* Hours */}
            <div className="mt-5">
              <p className="text-[10px] uppercase tracking-wider font-bold text-white/40 mb-3">
                Hours
              </p>
              <div className="space-y-2">
                {DAYS.map((day) => {
                  const active = !!form.hours[day];
                  const hours = form.hours[day];
                  return (
                    <div
                      key={day}
                      className="flex items-center gap-2.5"
                    >
                      <button
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`w-10 text-[11px] font-bold uppercase shrink-0 rounded-lg py-1 text-center transition-colors press ${
                          active
                            ? "bg-gold/20 text-gold border border-gold/30"
                            : "bg-white/[0.04] text-white/30 border border-white/[0.06]"
                        }`}
                      >
                        {DAY_LABELS[day]}
                      </button>
                      {active ? (
                        <div className="flex items-center gap-1.5 flex-1">
                          <input
                            type="time"
                            value={hours?.open ?? "09:00"}
                            onChange={(e) =>
                              setHourField(day, "open", e.target.value)
                            }
                            className="flex-1 bg-white/[0.04] border border-border-subtle rounded-lg px-2 py-1.5 text-[12px] text-white outline-none focus:border-gold/40"
                          />
                          <span className="text-white/30 text-[10px]">–</span>
                          <input
                            type="time"
                            value={hours?.close ?? "17:00"}
                            onChange={(e) =>
                              setHourField(day, "close", e.target.value)
                            }
                            className="flex-1 bg-white/[0.04] border border-border-subtle rounded-lg px-2 py-1.5 text-[12px] text-white outline-none focus:border-gold/40"
                          />
                        </div>
                      ) : (
                        <span className="text-[11px] text-white/20">
                          Closed
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-white/30 mt-2">
                Tap a day to toggle it open or closed.
              </p>
            </div>

            {error && (
              <p className="text-xs text-coral mt-3">{error}</p>
            )}

            <div className="flex gap-2 mt-5">
              <Button variant="secondary" size="sm" onClick={closeForm}>
                Cancel
              </Button>
              <Button size="sm" onClick={save} loading={saving}>
                {form.id ? "Save Changes" : "Add Location"}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ── Info note ── */}
      {!showForm && (
        <p className="mt-6 text-[11px] text-white/35 text-center">
          Each location appears in city search results when residents browse their
          city.
        </p>
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

const INPUT_CLS =
  "w-full bg-white/[0.04] border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-gold/40 mt-1.5 mb-3";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] uppercase tracking-wider font-bold text-white/40 mt-4 first:mt-0">
      {children}
    </p>
  );
}

function LocationCard({
  loc,
  cities,
  onEdit,
  onSetPrimary,
  onDeactivate,
}: {
  loc: BusinessLocation;
  cities: City[];
  onEdit: () => void;
  onSetPrimary: () => void;
  onDeactivate: () => void;
}) {
  const cityName =
    loc.city?.name ??
    cities.find((c) => c.id === loc.city_id)?.name ??
    null;

  return (
    <Card padding={false} className="overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-heading font-bold text-[15px] text-white">
              {loc.name}
            </p>
            {loc.is_primary && (
              <span className="px-2 py-0.5 rounded-full bg-gold/15 border border-gold/30 text-gold text-[10px] font-bold uppercase tracking-wider">
                Primary
              </span>
            )}
          </div>
          <button
            onClick={onEdit}
            className="shrink-0 text-[12px] text-gold font-semibold press"
          >
            Edit
          </button>
        </div>

        {/* Meta */}
        <div className="mt-2 space-y-1">
          {cityName && (
            <p className="text-[12px] text-white/60 flex items-center gap-1.5">
              <svg
                width="12"
                height="12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                className="text-gold/60 shrink-0"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              {cityName}
            </p>
          )}
          {loc.address && (
            <p className="text-[12px] text-white/60">{loc.address}</p>
          )}
          {loc.phone && (
            <p className="text-[12px] text-white/60">{loc.phone}</p>
          )}
        </div>

        {/* Actions for non-primary locations */}
        {!loc.is_primary && (
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/[0.05]">
            <button
              onClick={onSetPrimary}
              className="text-[11px] text-gold font-semibold press"
            >
              Set as Primary
            </button>
            <span className="text-white/20">·</span>
            <button
              onClick={onDeactivate}
              className="text-[11px] text-coral/70 font-semibold press hover:text-coral"
            >
              Deactivate
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}
