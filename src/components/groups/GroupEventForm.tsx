"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

interface GroupEventFormProps {
  groupId: string;
  isOpen: boolean;
  onClose: () => void;
  onCreated: (event: Record<string, unknown>) => void;
}

const EVENT_CATEGORIES = [
  { value: "community", label: "Community" },
  { value: "sports", label: "Sports" },
  { value: "business", label: "Business" },
  { value: "networking", label: "Networking" },
  { value: "culture", label: "Culture" },
  { value: "youth", label: "Youth" },
];

export default function GroupEventForm({ groupId, isOpen, onClose, onCreated }: GroupEventFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("community");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [locationName, setLocationName] = useState("");
  const [visibility, setVisibility] = useState<"public" | "group">("public");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!title.trim() || !startDate) return;
    setCreating(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          category,
          start_date: startDate,
          start_time: startTime || null,
          location_name: locationName.trim() || null,
          visibility,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        onCreated(data.event);
        // Reset
        setTitle("");
        setDescription("");
        setCategory("community");
        setStartDate("");
        setStartTime("");
        setLocationName("");
        setVisibility("public");
        onClose();
      }
    } catch {}
    setCreating(false);
  };

  if (!isOpen) return null;

  return (
    <Card>
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">New Event</h3>

        <input type="text" placeholder="Event title" value={title} onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-white/5 border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-txt-secondary focus:outline-none focus:border-gold/40"
        />

        <textarea placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
          className="w-full bg-white/5 border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-txt-secondary focus:outline-none focus:border-gold/40 resize-none"
        />

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-txt-secondary uppercase tracking-wider font-semibold">Date</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
              className="w-full mt-1 bg-white/5 border border-border-subtle rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-gold/40"
            />
          </div>
          <div>
            <label className="text-[10px] text-txt-secondary uppercase tracking-wider font-semibold">Time</label>
            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)}
              className="w-full mt-1 bg-white/5 border border-border-subtle rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-gold/40"
            />
          </div>
        </div>

        <input type="text" placeholder="Location (optional)" value={locationName} onChange={(e) => setLocationName(e.target.value)}
          className="w-full bg-white/5 border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-txt-secondary focus:outline-none focus:border-gold/40"
        />

        <select value={category} onChange={(e) => setCategory(e.target.value)}
          className="w-full bg-white/5 border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-gold/40"
        >
          {EVENT_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>

        {/* Visibility picker */}
        <div>
          <label className="text-[10px] text-txt-secondary uppercase tracking-wider font-semibold">Visibility</label>
          <div className="flex gap-2 mt-1.5">
            <button
              onClick={() => setVisibility("public")}
              className={`flex-1 px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
                visibility === "public"
                  ? "border-gold/30 bg-gold/10 text-gold"
                  : "border-border-subtle bg-white/5 text-txt-secondary"
              }`}
            >
              Public — shows in Events
            </button>
            <button
              onClick={() => setVisibility("group")}
              className={`flex-1 px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
                visibility === "group"
                  ? "border-gold/30 bg-hc-purple/10 text-gold"
                  : "border-border-subtle bg-white/5 text-txt-secondary"
              }`}
            >
              Group Only
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleCreate} loading={creating} disabled={!title.trim() || !startDate}>
            Create Event
          </Button>
          <button onClick={onClose} className="px-4 py-2 text-xs text-txt-secondary hover:text-white transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </Card>
  );
}
