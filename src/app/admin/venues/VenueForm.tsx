"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import type { Venue, VenueSection } from "@/types/database";

interface SectionDraft {
  id?: string; // existing section id, undefined for new
  name: string;
  capacity: number;
  price: string; // dollars string, converted to cents on submit
  color: string;
  description: string;
  sort_order: number;
  _deleted?: boolean;
}

interface VenueFormProps {
  venue?: Venue;
}

function sectionFromExisting(s: VenueSection): SectionDraft {
  return {
    id: s.id,
    name: s.name,
    capacity: s.capacity,
    price: (s.default_price / 100).toFixed(2),
    color: s.color ?? "",
    description: s.description ?? "",
    sort_order: s.sort_order,
  };
}

const COLOR_PRESETS = [
  { label: "Gold", value: "#F5A623" },
  { label: "Cyan", value: "#06B6D4" },
  { label: "Emerald", value: "#10B981" },
  { label: "Coral", value: "#F87171" },
  { label: "Purple", value: "#A78BFA" },
  { label: "Sky", value: "#38BDF8" },
];

export default function VenueForm({ venue }: VenueFormProps) {
  const router = useRouter();
  const isEdit = !!venue;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState(venue?.name ?? "");
  const [address, setAddress] = useState(venue?.address ?? "");
  const [imageUrl, setImageUrl] = useState(venue?.image_url ?? "");
  const [isActive, setIsActive] = useState(venue?.is_active ?? true);

  const existingSections = (venue?.sections ?? []) as VenueSection[];
  const [sections, setSections] = useState<SectionDraft[]>(
    existingSections.length > 0
      ? existingSections
          .slice()
          .sort((a, b) => a.sort_order - b.sort_order)
          .map(sectionFromExisting)
      : []
  );

  const addSection = () => {
    setSections((prev) => [
      ...prev,
      {
        name: "",
        capacity: 100,
        price: "0.00",
        color: "",
        description: "",
        sort_order: prev.length,
      },
    ]);
  };

  const updateSection = (index: number, patch: Partial<SectionDraft>) => {
    setSections((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...patch } : s))
    );
  };

  const removeSection = (index: number) => {
    setSections((prev) => {
      const s = prev[index];
      if (s.id) {
        // existing — mark deleted
        return prev.map((item, i) =>
          i === index ? { ...item, _deleted: true } : item
        );
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const visibleSections = sections.filter((s) => !s._deleted);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Venue name is required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (isEdit && venue) {
        // PATCH venue
        const venueRes = await fetch(`/api/venues/${venue.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            address: address.trim() || null,
            image_url: imageUrl.trim() || null,
            is_active: isActive,
          }),
        });
        if (!venueRes.ok) {
          const data = await venueRes.json();
          throw new Error(data.error ?? "Failed to update venue");
        }

        // Handle sections: delete, update, create
        for (const section of sections) {
          if (section._deleted && section.id) {
            await fetch(`/api/venues/${venue.id}/sections/${section.id}`, {
              method: "DELETE",
            });
          } else if (!section._deleted && section.id) {
            await fetch(`/api/venues/${venue.id}/sections/${section.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: section.name.trim(),
                capacity: Number(section.capacity),
                default_price: Math.round(
                  parseFloat(section.price || "0") * 100
                ),
                color: section.color.trim() || null,
                description: section.description.trim() || null,
                sort_order: section.sort_order,
              }),
            });
          } else if (!section._deleted && !section.id) {
            await fetch(`/api/venues/${venue.id}/sections`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: section.name.trim(),
                capacity: Number(section.capacity),
                default_price: Math.round(
                  parseFloat(section.price || "0") * 100
                ),
                color: section.color.trim() || null,
                description: section.description.trim() || null,
                sort_order: section.sort_order,
              }),
            });
          }
        }
      } else {
        // POST new venue
        const venueRes = await fetch("/api/venues", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            address: address.trim() || null,
            image_url: imageUrl.trim() || null,
            is_active: isActive,
            total_capacity: 0,
          }),
        });
        if (!venueRes.ok) {
          const data = await venueRes.json();
          throw new Error(data.error ?? "Failed to create venue");
        }
        const { venue: newVenue } = await venueRes.json();

        // POST each section
        for (const section of sections.filter((s) => !s._deleted)) {
          await fetch(`/api/venues/${newVenue.id}/sections`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: section.name.trim(),
              capacity: Number(section.capacity),
              default_price: Math.round(
                parseFloat(section.price || "0") * 100
              ),
              color: section.color.trim() || null,
              description: section.description.trim() || null,
              sort_order: section.sort_order,
            }),
          });
        }
      }

      router.push("/admin/venues");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save venue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Venue Details */}
      <Card className="space-y-5">
        <h2 className="font-semibold text-white">Venue Details</h2>

        {error && (
          <div className="bg-coral/10 border border-coral/20 rounded-xl px-4 py-3 text-sm text-coral">
            {error}
          </div>
        )}

        <Input
          label="Venue Name *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Compton Civic Center"
        />
        <Input
          label="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="600 N Alameda St, Compton, CA 90220"
        />
        <Input
          label="Image URL"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://..."
        />

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="accent-emerald w-4 h-4"
          />
          <span className="text-sm">Active</span>
        </label>
      </Card>

      {/* Sections Editor */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-white">
            Seating Sections
            <span className="ml-2 text-xs text-txt-secondary font-normal">
              ({visibleSections.length})
            </span>
          </h2>
          <Button type="button" variant="outline" size="sm" onClick={addSection}>
            + Add Section
          </Button>
        </div>

        {visibleSections.length === 0 && (
          <p className="text-sm text-txt-secondary text-center py-4">
            No sections yet. Add sections to define ticket types.
          </p>
        )}

        {sections.map((section, index) => {
          if (section._deleted) return null;
          return (
            <div
              key={index}
              className="bg-white/5 border border-border-subtle rounded-xl p-4 space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gold uppercase tracking-wider">
                  Section {visibleSections.indexOf(section) + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeSection(index)}
                  className="text-xs text-coral hover:text-coral/80 transition-colors"
                >
                  Remove
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-txt-secondary mb-1.5">
                    Section Name *
                  </label>
                  <input
                    type="text"
                    value={section.name}
                    onChange={(e) =>
                      updateSection(index, { name: e.target.value })
                    }
                    placeholder="e.g. General Admission"
                    className="w-full bg-white/5 border border-border-subtle rounded-xl px-4 py-3 text-sm text-white placeholder:text-txt-secondary focus:outline-none focus:border-gold/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-txt-secondary mb-1.5">
                    Capacity *
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={section.capacity}
                    onChange={(e) =>
                      updateSection(index, {
                        capacity: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-white/5 border border-border-subtle rounded-xl px-4 py-3 text-sm text-white placeholder:text-txt-secondary focus:outline-none focus:border-gold/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-txt-secondary mb-1.5">
                    Default Price (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-txt-secondary text-sm">
                      $
                    </span>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={section.price}
                      onChange={(e) =>
                        updateSection(index, { price: e.target.value })
                      }
                      className="w-full bg-white/5 border border-border-subtle rounded-xl pl-8 pr-4 py-3 text-sm text-white placeholder:text-txt-secondary focus:outline-none focus:border-gold/40"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-txt-secondary mb-1.5">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={section.sort_order}
                    onChange={(e) =>
                      updateSection(index, {
                        sort_order: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-white/5 border border-border-subtle rounded-xl px-4 py-3 text-sm text-white placeholder:text-txt-secondary focus:outline-none focus:border-gold/40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-txt-secondary mb-1.5">
                  Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={section.color}
                    onChange={(e) =>
                      updateSection(index, { color: e.target.value })
                    }
                    placeholder="#F5A623"
                    className="flex-1 bg-white/5 border border-border-subtle rounded-xl px-4 py-3 text-sm text-white placeholder:text-txt-secondary focus:outline-none focus:border-gold/40"
                  />
                  <div className="flex gap-1.5">
                    {COLOR_PRESETS.map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        title={preset.label}
                        onClick={() =>
                          updateSection(index, { color: preset.value })
                        }
                        className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
                        style={{
                          backgroundColor: preset.value,
                          borderColor:
                            section.color === preset.value
                              ? "white"
                              : "transparent",
                        }}
                      />
                    ))}
                  </div>
                  {section.color && (
                    <div
                      className="w-8 h-8 rounded-lg border border-border-subtle shrink-0"
                      style={{ backgroundColor: section.color }}
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-txt-secondary mb-1.5">
                  Description
                </label>
                <textarea
                  value={section.description}
                  onChange={(e) =>
                    updateSection(index, { description: e.target.value })
                  }
                  placeholder="Optional section details..."
                  rows={2}
                  className="w-full bg-white/5 border border-border-subtle rounded-xl px-4 py-3 text-sm text-white placeholder:text-txt-secondary focus:outline-none focus:border-gold/40 resize-none"
                />
              </div>
            </div>
          );
        })}

        {visibleSections.length > 0 && (
          <Button type="button" variant="ghost" size="sm" onClick={addSection}>
            + Add Another Section
          </Button>
        )}
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button type="submit" loading={loading}>
          {isEdit ? "Update Venue" : "Create Venue"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
