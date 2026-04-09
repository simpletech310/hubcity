"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

interface CouncilEventFormProps {
  district: number;
  isOpen: boolean;
  onClose: () => void;
  onCreated: (event: Record<string, unknown>) => void;
}

const EVENT_CATEGORIES = [
  { value: "city", label: "City" },
  { value: "sports", label: "Sports" },
  { value: "culture", label: "Culture" },
  { value: "community", label: "Community" },
  { value: "school", label: "School" },
  { value: "youth", label: "Youth" },
  { value: "business", label: "Business" },
  { value: "networking", label: "Networking" },
];

export default function CouncilEventForm({ district, isOpen, onClose, onCreated }: CouncilEventFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("city");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [locationName, setLocationName] = useState("");
  const [address, setAddress] = useState("");
  const [creating, setCreating] = useState(false);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory("city");
    setStartDate("");
    setStartTime("");
    setLocationName("");
    setAddress("");
  };

  const handleCreate = async () => {
    if (!title.trim() || !startDate) return;
    setCreating(true);
    try {
      const res = await fetch(`/api/districts/${district}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          category,
          start_date: startDate,
          start_time: startTime || null,
          location_name: locationName.trim() || null,
          address: address.trim() || null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        resetForm();
        onCreated(data.event);
        onClose();
      }
    } catch {
      // silent
    }
    setCreating(false);
  };

  if (!isOpen) return null;

  return (
    <Card variant="glass-elevated">
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-white">New District Event</h3>

        <p className="text-[11px] text-txt-secondary">
          This event will be created for District {district}
        </p>

        <input
          type="text"
          placeholder="Event title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-white/5 border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-txt-secondary focus:outline-none focus:border-gold/40"
        />

        <textarea
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full bg-white/5 border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-txt-secondary focus:outline-none focus:border-gold/40 resize-none"
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full bg-white/5 border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-gold/40"
        >
          {EVENT_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-txt-secondary uppercase tracking-wider font-semibold">
              Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full mt-1 bg-white/5 border border-border-subtle rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-gold/40"
            />
          </div>
          <div>
            <label className="text-[10px] text-txt-secondary uppercase tracking-wider font-semibold">
              Time
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full mt-1 bg-white/5 border border-border-subtle rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-gold/40"
            />
          </div>
        </div>

        <input
          type="text"
          placeholder="Location name (optional)"
          value={locationName}
          onChange={(e) => setLocationName(e.target.value)}
          className="w-full bg-white/5 border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-txt-secondary focus:outline-none focus:border-gold/40"
        />

        <input
          type="text"
          placeholder="Address (optional)"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-full bg-white/5 border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-txt-secondary focus:outline-none focus:border-gold/40"
        />

        <div className="flex gap-2">
          <Button onClick={handleCreate} loading={creating} disabled={!title.trim() || !startDate}>
            Create Event
          </Button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs text-txt-secondary hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </Card>
  );
}
