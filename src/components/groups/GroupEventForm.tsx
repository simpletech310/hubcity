"use client";

import { useState } from "react";

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

const INPUT_STYLE: React.CSSProperties = {
  background: "var(--paper-warm)",
  border: "2px solid var(--rule-strong-c)",
  color: "var(--ink-strong)",
  fontFamily: "var(--font-body), Inter, sans-serif",
  fontSize: 14,
};

const LABEL_STYLE: React.CSSProperties = {
  color: "var(--ink-strong)",
};

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
    <div
      className="p-4"
      style={{
        background: "var(--paper)",
        border: "2px solid var(--rule-strong-c)",
      }}
    >
      <div className="space-y-3">
        <h3 className="c-card-t" style={{ fontSize: 13, color: "var(--ink-strong)" }}>
          NEW EVENT
        </h3>

        <input
          type="text"
          placeholder="Event title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-2.5 focus:outline-none"
          style={INPUT_STYLE}
        />

        <textarea
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full px-4 py-2.5 focus:outline-none resize-none"
          style={INPUT_STYLE}
        />

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="c-kicker" style={{ fontSize: 10, ...LABEL_STYLE }}>
              DATE
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full mt-1 px-3 py-2 focus:outline-none"
              style={INPUT_STYLE}
            />
          </div>
          <div>
            <label className="c-kicker" style={{ fontSize: 10, ...LABEL_STYLE }}>
              TIME
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full mt-1 px-3 py-2 focus:outline-none"
              style={INPUT_STYLE}
            />
          </div>
        </div>

        <input
          type="text"
          placeholder="Location (optional)"
          value={locationName}
          onChange={(e) => setLocationName(e.target.value)}
          className="w-full px-4 py-2.5 focus:outline-none"
          style={INPUT_STYLE}
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-4 py-2.5 focus:outline-none"
          style={INPUT_STYLE}
        >
          {EVENT_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>

        {/* Visibility picker */}
        <div>
          <label className="c-kicker" style={{ fontSize: 10, ...LABEL_STYLE }}>
            VISIBILITY
          </label>
          <div className="flex gap-2 mt-1.5">
            <button
              onClick={() => setVisibility("public")}
              className={`flex-1 px-3 py-2 c-kicker press ${
                visibility === "public" ? "c-btn-accent" : ""
              }`}
              style={{
                fontSize: 10,
                background: visibility === "public" ? "var(--gold-c)" : "var(--paper-warm)",
                color: "var(--ink-strong)",
                border: "2px solid var(--rule-strong-c)",
              }}
            >
              PUBLIC · SHOWS IN EVENTS
            </button>
            <button
              onClick={() => setVisibility("group")}
              className="flex-1 px-3 py-2 c-kicker press"
              style={{
                fontSize: 10,
                background: visibility === "group" ? "var(--ink-strong)" : "var(--paper-warm)",
                color: visibility === "group" ? "var(--gold-c)" : "var(--ink-strong)",
                border: "2px solid var(--rule-strong-c)",
              }}
            >
              GROUP ONLY
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleCreate}
            disabled={!title.trim() || !startDate || creating}
            className="c-btn c-btn-primary c-btn-sm press disabled:opacity-40"
          >
            {creating ? "CREATING…" : "CREATE EVENT"}
          </button>
          <button
            onClick={onClose}
            className="c-btn c-btn-outline c-btn-sm press"
          >
            CANCEL
          </button>
        </div>
      </div>
    </div>
  );
}
