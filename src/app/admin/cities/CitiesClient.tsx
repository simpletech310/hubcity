"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type City = {
  id: string;
  name: string;
  slug: string;
  state: string | null;
  region: string | null;
  launch_status: string;
  tagline: string | null;
  display_order: number | null;
  is_active: boolean | null;
};

type FormState = {
  name: string;
  slug: string;
  state: string;
  region: string;
  tagline: string;
  launch_status: string;
};

const defaultForm: FormState = {
  name: "",
  slug: "",
  state: "",
  region: "",
  tagline: "",
  launch_status: "coming_soon",
};

export default function CitiesClient({ cities: initialCities }: { cities: City[] }) {
  const [cities, setCities] = useState<City[]>(initialCities);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [slugTouched, setSlugTouched] = useState(false);

  const liveCount = cities.filter((c) => c.launch_status === "live").length;
  const comingSoonCount = cities.filter((c) => c.launch_status === "coming_soon").length;

  function handleNameChange(value: string) {
    const autoSlug = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    setForm((prev) => ({
      ...prev,
      name: value,
      slug: slugTouched ? prev.slug : autoSlug,
    }));
  }

  function handleSlugChange(value: string) {
    setSlugTouched(true);
    setForm((prev) => ({ ...prev, slug: value }));
  }

  function openEdit(city: City) {
    setEditId(city.id);
    setSlugTouched(true); // prevent auto-overwrite when editing
    setForm({
      name: city.name,
      slug: city.slug,
      state: city.state ?? "",
      region: city.region ?? "",
      tagline: city.tagline ?? "",
      launch_status: city.launch_status,
    });
    setShowAdd(false);
  }

  function openAdd() {
    setEditId(null);
    setSlugTouched(false);
    setForm(defaultForm);
    setShowAdd(true);
  }

  function closeForm() {
    setShowAdd(false);
    setEditId(null);
    setForm(defaultForm);
    setSlugTouched(false);
  }

  async function toggleStatus(city: City) {
    const next = city.launch_status === "live" ? "coming_soon" : "live";
    if (next === "live" && !confirm(`Activate ${city.name}? It will be visible to all users.`)) return;
    const supabase = createClient();
    await supabase.from("cities").update({ launch_status: next }).eq("id", city.id);
    setCities((prev) =>
      prev.map((c) => (c.id === city.id ? { ...c, launch_status: next } : c))
    );
  }

  async function handleSave() {
    const supabase = createClient();

    if (editId) {
      const { data } = await supabase
        .from("cities")
        .update(form)
        .eq("id", editId)
        .select("id, name, slug, state, region, launch_status, tagline, display_order, is_active")
        .single();
      if (data) {
        setCities((prev) => prev.map((c) => (c.id === editId ? data : c)));
      } else {
        // Optimistic update if select fails
        setCities((prev) =>
          prev.map((c) =>
            c.id === editId
              ? { ...c, ...form, state: form.state || null, region: form.region || null, tagline: form.tagline || null }
              : c
          )
        );
      }
    } else {
      const { data } = await supabase
        .from("cities")
        .insert({ ...form, is_active: true })
        .select("id, name, slug, state, region, launch_status, tagline, display_order, is_active")
        .single();
      if (data) {
        setCities((prev) => [...prev, data]);
      }
    }

    closeForm();
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold mb-1">Cities</h1>
          <p className="text-sm text-white/40">
            {cities.length} total &middot; {liveCount} live &middot; {comingSoonCount} coming soon
          </p>
        </div>
        <button
          onClick={openAdd}
          className="px-4 py-2 rounded-lg bg-gold text-midnight text-sm font-bold hover:bg-gold/90 transition-colors"
        >
          + Add City
        </button>
      </div>

      {/* Add/Edit Form */}
      {(showAdd || editId !== null) && (
        <div className="rounded-2xl border border-gold/20 bg-gold/5 p-4 space-y-3 mb-4">
          <p className="font-semibold text-white text-sm">{editId ? "Edit City" : "Add City"}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Name */}
            <div className="space-y-1">
              <label className="text-xs text-white/40">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="City name"
                className="w-full px-3 py-2 rounded-lg bg-white/[0.06] border border-white/[0.1] text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-gold/40"
              />
            </div>

            {/* Slug */}
            <div className="space-y-1">
              <label className="text-xs text-white/40">Slug</label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="city-slug"
                className="w-full px-3 py-2 rounded-lg bg-white/[0.06] border border-white/[0.1] text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-gold/40"
              />
            </div>

            {/* State */}
            <div className="space-y-1">
              <label className="text-xs text-white/40">State</label>
              <input
                type="text"
                value={form.state}
                onChange={(e) => setForm((prev) => ({ ...prev, state: e.target.value }))}
                placeholder="CA"
                className="w-full px-3 py-2 rounded-lg bg-white/[0.06] border border-white/[0.1] text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-gold/40"
              />
            </div>

            {/* Region */}
            <div className="space-y-1">
              <label className="text-xs text-white/40">Region</label>
              <input
                type="text"
                value={form.region}
                onChange={(e) => setForm((prev) => ({ ...prev, region: e.target.value }))}
                placeholder="SoCal"
                className="w-full px-3 py-2 rounded-lg bg-white/[0.06] border border-white/[0.1] text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-gold/40"
              />
            </div>

            {/* Tagline */}
            <div className="space-y-1">
              <label className="text-xs text-white/40">Tagline</label>
              <input
                type="text"
                value={form.tagline}
                onChange={(e) => setForm((prev) => ({ ...prev, tagline: e.target.value }))}
                placeholder="The Hub City"
                className="w-full px-3 py-2 rounded-lg bg-white/[0.06] border border-white/[0.1] text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-gold/40"
              />
            </div>

            {/* Launch Status */}
            <div className="space-y-1">
              <label className="text-xs text-white/40">Launch Status</label>
              <select
                value={form.launch_status}
                onChange={(e) => setForm((prev) => ({ ...prev, launch_status: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-white/[0.06] border border-white/[0.1] text-white text-sm focus:outline-none focus:border-gold/40"
              >
                <option value="coming_soon">Coming Soon</option>
                <option value="live">Live</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSave}
              className="flex-1 py-2 rounded-lg bg-gold text-midnight text-sm font-bold hover:bg-gold/90 transition-colors"
            >
              Save
            </button>
            <button
              onClick={closeForm}
              className="px-4 py-2 rounded-lg bg-white/5 text-white/60 text-sm hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* City List */}
      <div className="space-y-2">
        {cities.map((city) => (
          <div
            key={city.id}
            className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 flex items-center justify-between gap-3"
          >
            <div className="min-w-0">
              <p className="font-semibold text-white text-sm">
                {city.name}{" "}
                <span className="text-white/40 font-normal">· {city.state}</span>
              </p>
              <p className="text-xs text-white/40 mt-0.5">
                {city.region}
                {city.tagline ? ` · ${city.tagline}` : ""}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Status badge */}
              <span
                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                  city.launch_status === "live"
                    ? "text-emerald-400 border-emerald-400/30 bg-emerald-400/10"
                    : "text-gold/70 border-gold/20 bg-gold/5"
                }`}
              >
                {city.launch_status === "live" ? "Live" : "Soon"}
              </span>

              {/* Toggle live/soon */}
              <button
                onClick={() => toggleStatus(city)}
                className="text-xs text-gold/60 hover:text-gold transition-colors active:scale-95"
              >
                {city.launch_status === "live" ? "Deactivate" : "Go Live"}
              </button>

              {/* Edit */}
              <button
                onClick={() => openEdit(city)}
                className="text-xs text-white/40 hover:text-white transition-colors active:scale-95"
              >
                Edit
              </button>
            </div>
          </div>
        ))}

        {cities.length === 0 && (
          <p className="text-sm text-white/30 text-center py-8">No cities yet. Add one above.</p>
        )}
      </div>
    </div>
  );
}
