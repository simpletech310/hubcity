"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import Chip from "@/components/ui/Chip";
import { createClient } from "@/lib/supabase/client";
import type { Event, EventCategory, Venue, VenueSection } from "@/types/database";

const categories: EventCategory[] = [
  "city", "sports", "culture", "community", "school", "youth",
];

const districts = [1, 2, 3, 4];

interface TicketConfigDraft {
  venue_section_id: string;
  section_name: string;
  price: string; // dollars string
  capacity: number;
  max_per_order: number;
  is_active: boolean;
}

interface EventFormProps {
  event?: Event;
}

export default function EventForm({ event }: EventFormProps) {
  const router = useRouter();
  const isEdit = !!event;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Core event fields
  const [title, setTitle] = useState(event?.title ?? "");
  const [category, setCategory] = useState<EventCategory>(event?.category ?? "community");
  const [description, setDescription] = useState(event?.description ?? "");
  const [startDate, setStartDate] = useState(event?.start_date ?? "");
  const [startTime, setStartTime] = useState(event?.start_time ?? "");
  const [endDate, setEndDate] = useState(event?.end_date ?? "");
  const [endTime, setEndTime] = useState(event?.end_time ?? "");
  const [locationName, setLocationName] = useState(event?.location_name ?? "");
  const [address, setAddress] = useState(event?.address ?? "");
  const [district, setDistrict] = useState<number | null>(event?.district ?? null);
  const [imageUrl, setImageUrl] = useState(event?.image_url ?? "");
  const [isFeatured, setIsFeatured] = useState(event?.is_featured ?? false);
  const [isPublished, setIsPublished] = useState(event?.is_published ?? false);

  // Ticketing fields
  const [isTicketed, setIsTicketed] = useState(event?.is_ticketed ?? false);
  const [venueId, setVenueId] = useState<string | null>(event?.venue_id ?? null);
  const [ticketSalesStart, setTicketSalesStart] = useState(
    event?.ticket_sales_start ? event.ticket_sales_start.slice(0, 16) : ""
  );
  const [ticketSalesEnd, setTicketSalesEnd] = useState(
    event?.ticket_sales_end ? event.ticket_sales_end.slice(0, 16) : ""
  );
  const [maxTicketsPerPerson, setMaxTicketsPerPerson] = useState(
    event?.max_tickets_per_person ?? 10
  );
  const [venues, setVenues] = useState<Venue[]>([]);
  const [ticketConfigs, setTicketConfigs] = useState<TicketConfigDraft[]>([]);
  const [ticketingOpen, setTicketingOpen] = useState(event?.is_ticketed ?? false);

  // Fetch venues when ticketing is toggled on
  useEffect(() => {
    if (!isTicketed) return;
    fetch("/api/venues")
      .then((res) => res.json())
      .then((data) => {
        if (data.venues) setVenues(data.venues);
      })
      .catch(() => {});
  }, [isTicketed]);

  // When editing a ticketed event, load existing ticket configs on mount
  useEffect(() => {
    if (!isEdit || !event?.is_ticketed || !event?.id) return;
    fetch(`/api/events/${event.id}/ticket-config`)
      .then((res) => res.json())
      .then((data) => {
        if (data.configs && Array.isArray(data.configs)) {
          const drafts: TicketConfigDraft[] = data.configs.map(
            (cfg: {
              venue_section_id: string;
              venue_section?: { name: string };
              price: number;
              capacity: number;
              max_per_order: number;
              is_active: boolean;
            }) => ({
              venue_section_id: cfg.venue_section_id,
              section_name: cfg.venue_section?.name ?? cfg.venue_section_id,
              price: (cfg.price / 100).toFixed(2),
              capacity: cfg.capacity,
              max_per_order: cfg.max_per_order,
              is_active: cfg.is_active,
            })
          );
          setTicketConfigs(drafts);
        }
      })
      .catch(() => {});
  }, [isEdit, event?.id, event?.is_ticketed]);

  // When a venue is selected, populate ticket configs from its sections
  const handleVenueChange = (id: string) => {
    setVenueId(id);
    const selectedVenue = venues.find((v) => v.id === id);
    if (!selectedVenue?.sections) return;
    const sorted = [...selectedVenue.sections].sort(
      (a: VenueSection, b: VenueSection) => a.sort_order - b.sort_order
    );
    setTicketConfigs(
      sorted.map((s: VenueSection) => ({
        venue_section_id: s.id,
        section_name: s.name,
        price: (s.default_price / 100).toFixed(2),
        capacity: s.capacity,
        max_per_order: 10,
        is_active: true,
      }))
    );
  };

  const updateConfig = (index: number, patch: Partial<TicketConfigDraft>) => {
    setTicketConfigs((prev) =>
      prev.map((c, i) => (i === index ? { ...c, ...patch } : c))
    );
  };

  const handleTicketToggle = (checked: boolean) => {
    setIsTicketed(checked);
    setTicketingOpen(checked);
    if (!checked) {
      setVenueId(null);
      setTicketConfigs([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startDate) {
      setError("Title and start date are required.");
      return;
    }

    setLoading(true);
    setError("");

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const payload = {
      title: title.trim(),
      slug,
      category,
      description: description.trim() || null,
      start_date: startDate,
      start_time: startTime || null,
      end_date: endDate || null,
      end_time: endTime || null,
      location_name: locationName.trim() || null,
      address: address.trim() || null,
      district,
      image_url: imageUrl.trim() || null,
      is_featured: isFeatured,
      is_published: isPublished,
      // Ticketing
      is_ticketed: isTicketed,
      venue_id: isTicketed ? venueId : null,
      ticket_sales_start: isTicketed && ticketSalesStart ? ticketSalesStart : null,
      ticket_sales_end: isTicketed && ticketSalesEnd ? ticketSalesEnd : null,
      max_tickets_per_person: isTicketed ? maxTicketsPerPerson : 10,
    };

    try {
      const supabase = createClient();
      let eventId = event?.id;

      if (isEdit) {
        const { error: err } = await supabase
          .from("events")
          .update(payload)
          .eq("id", event.id);
        if (err) throw err;
      } else {
        const { data: created, error: err } = await supabase
          .from("events")
          .insert({ ...payload, rsvp_count: 0 })
          .select("id")
          .single();
        if (err) throw err;
        eventId = created.id;
      }

      // Save ticket configs if ticketed and configs exist
      if (isTicketed && ticketConfigs.length > 0 && eventId) {
        const configs = ticketConfigs.map((cfg) => ({
          venue_section_id: cfg.venue_section_id,
          price: Math.round(parseFloat(cfg.price || "0") * 100),
          capacity: Number(cfg.capacity),
          max_per_order: Number(cfg.max_per_order),
          is_active: cfg.is_active,
        }));
        const res = await fetch(`/api/events/${eventId}/ticket-config`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ configs }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "Failed to save ticket configs");
        }
      }

      router.push("/admin/events");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save event.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card className="space-y-5">
        {error && (
          <div className="bg-coral/10 border border-coral/20 rounded-xl px-4 py-3 text-sm text-coral">
            {error}
          </div>
        )}

        <Input label="Event Title *" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Compton Community Cleanup" />

        <div>
          <label className="block text-sm font-medium text-txt-secondary mb-2">Category *</label>
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <Chip key={cat} label={cat} active={category === cat} onClick={() => setCategory(cat)} />
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-txt-secondary mb-1.5">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-white/5 border border-border-subtle rounded-xl px-4 py-3 text-sm text-white placeholder:text-txt-secondary focus:outline-none focus:border-gold/40 min-h-[80px] resize-none"
            placeholder="Event details..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input label="Start Date *" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <Input label="Start Time" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input label="End Date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          <Input label="End Time" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </div>

        <Input label="Venue / Location Name" value={locationName} onChange={(e) => setLocationName(e.target.value)} placeholder="e.g. MLK Memorial Park" />
        <Input label="Address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Compton Blvd, Compton, CA" />

        <div>
          <label className="block text-sm font-medium text-txt-secondary mb-2">District</label>
          <div className="flex gap-2">
            <Chip label="None" active={district === null} onClick={() => setDistrict(null)} />
            {districts.map((d) => (
              <Chip key={d} label={`District ${d}`} active={district === d} onClick={() => setDistrict(d)} />
            ))}
          </div>
        </div>

        <Input label="Image URL" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />

        {/* ── Ticketing Section ─────────────────────────────── */}
        <div className="border border-gold/20 rounded-xl overflow-hidden">
          {/* Header / Toggle */}
          <button
            type="button"
            onClick={() => setTicketingOpen((o) => !o)}
            className="w-full flex items-center justify-between px-4 py-3 bg-gold/5 hover:bg-gold/10 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-gold font-semibold text-sm">🎟 Ticketing</span>
              {isTicketed && (
                <span className="text-xs bg-gold/20 text-gold px-2 py-0.5 rounded-full font-medium">
                  Enabled
                </span>
              )}
            </div>
            <span className="text-txt-secondary text-xs">
              {ticketingOpen ? "▲" : "▼"}
            </span>
          </button>

          {ticketingOpen && (
            <div className="px-4 py-4 space-y-5">
              {/* Enable toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isTicketed}
                  onChange={(e) => handleTicketToggle(e.target.checked)}
                  className="accent-gold w-4 h-4"
                />
                <span className="text-sm font-medium">Enable ticketing for this event</span>
              </label>

              {isTicketed && (
                <>
                  {/* Sales window */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-txt-secondary mb-1.5">
                        Sales Start
                      </label>
                      <input
                        type="datetime-local"
                        value={ticketSalesStart}
                        onChange={(e) => setTicketSalesStart(e.target.value)}
                        className="w-full bg-white/5 border border-border-subtle rounded-xl px-4 py-3 text-sm text-white placeholder:text-txt-secondary focus:outline-none focus:border-gold/40"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-txt-secondary mb-1.5">
                        Sales End
                      </label>
                      <input
                        type="datetime-local"
                        value={ticketSalesEnd}
                        onChange={(e) => setTicketSalesEnd(e.target.value)}
                        className="w-full bg-white/5 border border-border-subtle rounded-xl px-4 py-3 text-sm text-white placeholder:text-txt-secondary focus:outline-none focus:border-gold/40"
                      />
                    </div>
                  </div>

                  {/* Max tickets per person */}
                  <div>
                    <label className="block text-xs font-medium text-txt-secondary mb-1.5">
                      Max Tickets per Person
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={maxTicketsPerPerson}
                      onChange={(e) =>
                        setMaxTicketsPerPerson(parseInt(e.target.value) || 10)
                      }
                      className="w-full bg-white/5 border border-border-subtle rounded-xl px-4 py-3 text-sm text-white placeholder:text-txt-secondary focus:outline-none focus:border-gold/40"
                    />
                  </div>

                  {/* Venue selector */}
                  <div>
                    <label className="block text-xs font-medium text-txt-secondary mb-1.5">
                      Venue *
                    </label>
                    {venues.length === 0 ? (
                      <p className="text-xs text-txt-secondary py-2">
                        Loading venues...{" "}
                        <a
                          href="/admin/venues/new"
                          target="_blank"
                          className="text-gold underline"
                        >
                          Create a venue
                        </a>
                      </p>
                    ) : (
                      <select
                        value={venueId ?? ""}
                        onChange={(e) => handleVenueChange(e.target.value)}
                        className="w-full bg-white/5 border border-border-subtle rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-gold/40"
                      >
                        <option value="">Select a venue…</option>
                        {venues.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.name}
                            {v.address ? ` — ${v.address}` : ""}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Ticket configs per section */}
                  {ticketConfigs.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-txt-secondary uppercase tracking-wider">
                        Section Pricing & Capacity
                      </p>
                      {ticketConfigs.map((cfg, index) => (
                        <div
                          key={cfg.venue_section_id}
                          className="bg-white/5 border border-border-subtle rounded-xl p-4 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-white">
                              {cfg.section_name}
                            </span>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={cfg.is_active}
                                onChange={(e) =>
                                  updateConfig(index, { is_active: e.target.checked })
                                }
                                className="accent-emerald w-3.5 h-3.5"
                              />
                              <span className="text-xs text-txt-secondary">Active</span>
                            </label>
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs text-txt-secondary mb-1">
                                Price (USD)
                              </label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-txt-secondary text-xs">
                                  $
                                </span>
                                <input
                                  type="number"
                                  min={0}
                                  step={0.01}
                                  value={cfg.price}
                                  onChange={(e) =>
                                    updateConfig(index, { price: e.target.value })
                                  }
                                  className="w-full bg-white/5 border border-border-subtle rounded-lg pl-6 pr-3 py-2 text-sm text-white focus:outline-none focus:border-gold/40"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs text-txt-secondary mb-1">
                                Capacity
                              </label>
                              <input
                                type="number"
                                min={1}
                                value={cfg.capacity}
                                onChange={(e) =>
                                  updateConfig(index, {
                                    capacity: parseInt(e.target.value) || 0,
                                  })
                                }
                                className="w-full bg-white/5 border border-border-subtle rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gold/40"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-txt-secondary mb-1">
                                Max / Order
                              </label>
                              <input
                                type="number"
                                min={1}
                                value={cfg.max_per_order}
                                onChange={(e) =>
                                  updateConfig(index, {
                                    max_per_order: parseInt(e.target.value) || 1,
                                  })
                                }
                                className="w-full bg-white/5 border border-border-subtle rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gold/40"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
        {/* ── End Ticketing Section ─────────────────────────── */}

        <div className="flex gap-6 pt-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} className="accent-gold w-4 h-4" />
            <span className="text-sm">Featured</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} className="accent-emerald w-4 h-4" />
            <span className="text-sm">Published</span>
          </label>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={loading}>
            {isEdit ? "Update Event" : "Create Event"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </Card>
    </form>
  );
}
