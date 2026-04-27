"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import type { EventCategory } from "@/types/database";

const CATEGORIES: EventCategory[] = [
  "city",
  "sports",
  "culture",
  "community",
  "school",
  "youth",
];

/**
 * /dashboard/events/new — creator-facing event creation. Non-ticketed only;
 * ticket pricing + venue + tier configuration stays admin-side.
 *
 * POST /api/events already supports creator/ambassador roles, so we just
 * stage the form here and redirect to the edit page on success.
 */
export default function NewEventPage() {
  const router = useRouter();

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

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate() {
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!startDate) {
      setError("Start date is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/events", {
        method: "POST",
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
          is_ticketed: false,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.event?.id) {
        setError(data.error ?? "Failed to create event");
        setSaving(false);
        return;
      }
      router.replace(`/dashboard/events/${data.event.id}/edit`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create event");
      setSaving(false);
    }
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
          New Event
        </h1>
        <p
          className="c-serif-it mt-1"
          style={{ fontSize: 13, color: "var(--ink-mute)" }}
        >
          Free / RSVP-only events. Ticketed events are still configured by
          ops — ping admin if you need tiers + capacity.
        </p>
      </div>

      <Card className="p-5 mb-4 space-y-4">
        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Westside Block Party"
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
          placeholder="100 W Compton Blvd, Compton CA 90220"
        />
        <Input
          label="Cover image URL"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://…/cover.jpg"
        />

        <label className="flex items-center justify-between gap-3 py-1.5">
          <span
            className="text-sm"
            style={{ color: "var(--ink-strong)" }}
          >
            Publish immediately (visible on /events)
          </span>
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            className="w-5 h-5"
          />
        </label>
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

      <div className="flex items-center justify-end gap-3">
        <Link
          href="/dashboard/events"
          className="c-kicker"
          style={{ color: "var(--ink-mute)" }}
        >
          CANCEL
        </Link>
        <Button onClick={handleCreate} disabled={saving}>
          {saving ? "CREATING…" : "CREATE & EDIT"}
        </Button>
      </div>
    </div>
  );
}
