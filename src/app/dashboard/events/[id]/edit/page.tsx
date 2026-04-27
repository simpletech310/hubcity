"use client";

import { useEffect, useMemo, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/client";
import type { Event, EventCategory } from "@/types/database";

const CATEGORIES: EventCategory[] = [
  "city",
  "sports",
  "culture",
  "community",
  "school",
  "youth",
];

/**
 * Creator-facing event edit form. Edits the non-ticketing fields of
 * an event the signed-in user owns (created_by check on the API).
 * Ticketing setup stays on /admin/events/[id]/edit because it
 * requires picking a venue + tier configuration.
 */
export default function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState("");
  const [savedAt, setSavedAt] = useState<number | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<EventCategory>("community");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [locationName, setLocationName] = useState("");
  const [address, setAddress] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace(`/login?redirect=/dashboard/events/${id}/edit`);
        return;
      }
      const { data, error: evErr } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .single();
      if (evErr || !data) {
        setError("Event not found.");
        setLoading(false);
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      const isAdmin = profile?.role === "admin";
      const isCreator = data.created_by === user.id;
      if (!isCreator && !isAdmin) {
        setError("You don't have permission to edit this event.");
        setLoading(false);
        return;
      }
      const e = data as Event;
      setEvent(e);
      setTitle(e.title);
      setDescription(e.description ?? "");
      setCategory(e.category);
      setStartDate(e.start_date);
      setStartTime(e.start_time ?? "");
      setEndDate(e.end_date ?? "");
      setEndTime(e.end_time ?? "");
      setLocationName(e.location_name ?? "");
      setAddress(e.address ?? "");
      setImageUrl(e.image_url ?? "");
      setIsPublished(e.is_published);
      setIsFeatured(e.is_featured);
      setLoading(false);
    })();
  }, [id, router, supabase]);

  async function handleSave() {
    if (!event) return;
    setSaving(true);
    setError("");
    setSavedAt(null);
    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          category,
          start_date: startDate,
          start_time: startTime || null,
          end_date: endDate || null,
          end_time: endTime || null,
          location_name: locationName.trim() || null,
          address: address.trim() || null,
          image_url: imageUrl.trim() || null,
          is_published: isPublished,
          is_featured: isFeatured,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Save failed");
      } else {
        setSavedAt(Date.now());
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!event) return;
    setDeleting(true);
    setError("");
    try {
      const res = await fetch(`/api/events/${event.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Delete failed");
        setDeleting(false);
        return;
      }
      router.replace("/dashboard/events");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="px-5 py-10 text-center">
        <p className="c-kicker" style={{ color: "var(--ink-mute)" }}>
          LOADING…
        </p>
      </div>
    );
  }
  if (!event) {
    return (
      <div className="px-5 py-10">
        <p className="c-card-t" style={{ color: "var(--ink-strong)" }}>
          {error}
        </p>
        <Link href="/dashboard/events" className="c-kicker mt-3 inline-block">
          ← BACK TO EVENTS
        </Link>
      </div>
    );
  }

  return (
    <div className="px-5 pb-12 pt-6 mx-auto max-w-2xl">
      <div className="mb-5">
        <Link
          href="/dashboard/events"
          className="c-kicker"
          style={{ color: "var(--ink-mute)" }}
        >
          ← MY EVENTS
        </Link>
        <h1
          className="c-hero mt-2"
          style={{ fontSize: 32, color: "var(--ink-strong)" }}
        >
          Edit Event
        </h1>
      </div>

      {event.is_ticketed && (
        <Card className="p-4 mb-4">
          <p
            className="c-kicker mb-1"
            style={{ color: "var(--gold-c)", fontSize: 11 }}
          >
            § TICKETED EVENT
          </p>
          <p
            className="c-serif-it"
            style={{
              fontSize: 13,
              color: "var(--ink-strong)",
              opacity: 0.8,
            }}
          >
            Ticket prices, packages, and capacity are managed by an admin.
            <br />
            Need a change? Contact ops.
          </p>
        </Card>
      )}

      <Card className="p-5 mb-4 space-y-4">
        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div>
          <label
            className="block text-sm font-medium mb-1.5"
            style={{ color: "var(--ink-mute)" }}
          >
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            className="w-full border rounded-xl px-4 py-3 text-sm"
            style={{
              borderColor: "var(--rule-c)",
              background: "var(--paper)",
              color: "var(--ink-strong)",
            }}
            placeholder="What's the event about?"
          />
        </div>

        <div>
          <label
            className="block text-sm font-medium mb-1.5"
            style={{ color: "var(--ink-mute)" }}
          >
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as EventCategory)}
            className="w-full border rounded-xl px-4 py-3 text-sm"
            style={{
              borderColor: "var(--rule-c)",
              background: "var(--paper)",
              color: "var(--ink-strong)",
            }}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Start date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            label="Start time"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
          <Input
            label="End date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <Input
            label="End time"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </div>

        <Input
          label="Location name"
          value={locationName}
          onChange={(e) => setLocationName(e.target.value)}
          placeholder="e.g. Compton Civic Center"
        />
        <Input
          label="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <Input
          label="Cover image URL"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://…/cover.jpg"
        />
      </Card>

      <Card className="p-5 mb-4">
        <p
          className="c-kicker mb-3"
          style={{ color: "var(--ink-mute)", fontSize: 11 }}
        >
          § VISIBILITY
        </p>
        <div className="space-y-2.5">
          <label className="flex items-center justify-between gap-3 py-1.5">
            <span
              className="text-sm"
              style={{ color: "var(--ink-strong)" }}
            >
              Published (visible on /events)
            </span>
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="w-5 h-5"
            />
          </label>
          <label className="flex items-center justify-between gap-3 py-1.5">
            <span
              className="text-sm"
              style={{ color: "var(--ink-strong)" }}
            >
              Featured (surfaces in home slider)
            </span>
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="w-5 h-5"
            />
          </label>
        </div>
      </Card>

      {error && (
        <div
          className="mb-4 px-4 py-3 rounded-lg"
          style={{
            background: "rgba(232,72,85,0.08)",
            color: "var(--red-c, #E84855)",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}
      {savedAt && (
        <div
          className="mb-4 px-4 py-3 rounded-lg"
          style={{
            background: "rgba(34,197,94,0.08)",
            color: "#0e7434",
            fontSize: 13,
          }}
        >
          Saved.
        </div>
      )}

      <div className="flex items-center justify-between gap-3 mb-6">
        <Link
          href={`/events/${event.id}`}
          className="c-kicker"
          style={{ color: "var(--ink-mute)" }}
        >
          VIEW PUBLIC →
        </Link>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "SAVING…" : "SAVE CHANGES"}
        </Button>
      </div>

      {!event.is_ticketed && (
        <div
          className="p-4"
          style={{
            border: "2px dashed var(--rule-strong-c)",
            background: "var(--paper)",
          }}
        >
          <p
            className="c-kicker mb-2"
            style={{ color: "var(--red-c, #E84855)", fontSize: 11 }}
          >
            § DANGER ZONE
          </p>
          {!confirmingDelete ? (
            <button
              onClick={() => setConfirmingDelete(true)}
              className="text-sm underline"
              style={{ color: "var(--red-c, #E84855)" }}
            >
              Delete this event…
            </button>
          ) : (
            <div className="flex items-center gap-3 flex-wrap">
              <span
                className="text-sm"
                style={{ color: "var(--ink-strong)" }}
              >
                This can&apos;t be undone.
              </span>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider"
                style={{
                  background: "var(--red-c, #E84855)",
                  color: "#fff",
                }}
              >
                {deleting ? "DELETING…" : "YES, DELETE"}
              </button>
              <button
                onClick={() => setConfirmingDelete(false)}
                className="text-xs"
                style={{ color: "var(--ink-mute)" }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
