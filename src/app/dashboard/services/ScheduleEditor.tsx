"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import type { TimeSlot } from "@/types/database";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120];

interface LocalSlot {
  id?: string; // undefined = new
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration: number;
  max_bookings: number;
  is_active: boolean;
  _deleted?: boolean;
  _dirty?: boolean;
}

function slotFromDB(s: TimeSlot): LocalSlot {
  return {
    id: s.id,
    day_of_week: s.day_of_week,
    start_time: s.start_time.slice(0, 5), // "09:00:00" -> "09:00"
    end_time: s.end_time.slice(0, 5),
    slot_duration: s.slot_duration,
    max_bookings: s.max_bookings,
    is_active: s.is_active,
  };
}

export default function ScheduleEditor({
  businessId,
  initialSlots,
}: {
  businessId: string;
  initialSlots: TimeSlot[];
}) {
  const router = useRouter();
  const [slots, setSlots] = useState<LocalSlot[]>(initialSlots.map(slotFromDB));
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function slotsForDay(day: number) {
    return slots.filter((s) => s.day_of_week === day && !s._deleted);
  }

  function addSlot(day: number) {
    setSlots((prev) => [
      ...prev,
      {
        day_of_week: day,
        start_time: "09:00",
        end_time: "17:00",
        slot_duration: 30,
        max_bookings: 1,
        is_active: true,
        _dirty: true,
      },
    ]);
  }

  function updateSlot(index: number, field: keyof LocalSlot, value: string | number | boolean) {
    setSlots((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value, _dirty: true } : s))
    );
  }

  function removeSlot(index: number) {
    setSlots((prev) =>
      prev.map((s, i) => {
        if (i !== index) return s;
        if (s.id) return { ...s, _deleted: true };
        return s; // will be filtered out below
      }).filter((s, i) => i !== index || s.id) // remove unsaved slots immediately
    );
  }

  function copyToWeekdays(day: number) {
    const source = slotsForDay(day);
    if (source.length === 0) return;

    const weekdays = [1, 2, 3, 4, 5]; // Mon-Fri
    setSlots((prev) => {
      // Mark existing weekday slots for deletion
      const updated = prev.map((s) => {
        if (weekdays.includes(s.day_of_week) && s.day_of_week !== day && !s._deleted) {
          return s.id ? { ...s, _deleted: true } : s;
        }
        return s;
      }).filter((s) => !(!s.id && weekdays.includes(s.day_of_week) && s.day_of_week !== day));

      // Add copies for each weekday
      const copies: LocalSlot[] = [];
      for (const wd of weekdays) {
        if (wd === day) continue;
        for (const src of source) {
          copies.push({
            day_of_week: wd,
            start_time: src.start_time,
            end_time: src.end_time,
            slot_duration: src.slot_duration,
            max_bookings: src.max_bookings,
            is_active: true,
            _dirty: true,
          });
        }
      }

      return [...updated, ...copies];
    });
  }

  async function handleSave() {
    setSaving(true);
    setError("");

    try {
      const toDelete = slots.filter((s) => s._deleted && s.id);
      const toCreate = slots.filter((s) => !s.id && !s._deleted);
      const toUpdate = slots.filter((s) => s.id && s._dirty && !s._deleted);

      // Delete
      await Promise.all(
        toDelete.map((s) =>
          fetch(`/api/time-slots/${s.id}`, { method: "DELETE" })
        )
      );

      // Create
      await Promise.all(
        toCreate.map((s) =>
          fetch("/api/time-slots", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              business_id: businessId,
              day_of_week: s.day_of_week,
              start_time: s.start_time,
              end_time: s.end_time,
              slot_duration: s.slot_duration,
              max_bookings: s.max_bookings,
            }),
          })
        )
      );

      // Update
      await Promise.all(
        toUpdate.map((s) =>
          fetch(`/api/time-slots/${s.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              start_time: s.start_time,
              end_time: s.end_time,
              slot_duration: s.slot_duration,
              max_bookings: s.max_bookings,
              is_active: s.is_active,
            }),
          })
        )
      );

      router.refresh();
    } catch {
      setError("Failed to save schedule");
    } finally {
      setSaving(false);
    }
  }

  const hasChanges = slots.some((s) => s._dirty || s._deleted);

  return (
    <div className="space-y-2">
      {[0, 1, 2, 3, 4, 5, 6].map((day) => {
        const daySlots = slotsForDay(day);
        const isExpanded = expandedDay === day;
        const globalIndex = (d: number, localIdx: number) => {
          let count = 0;
          for (let i = 0; i < slots.length; i++) {
            if (slots[i]._deleted) continue;
            if (slots[i].day_of_week === d) {
              if (count === localIdx) return i;
              count++;
            }
          }
          return -1;
        };

        return (
          <Card key={day} className="overflow-hidden">
            <button
              onClick={() => setExpandedDay(isExpanded ? null : day)}
              className="w-full flex items-center justify-between py-1"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold w-[80px] text-left">
                  {DAY_SHORT[day]}
                </span>
                {daySlots.length > 0 ? (
                  <span className="text-xs text-txt-secondary">
                    {daySlots.map((s) => `${s.start_time}-${s.end_time}`).join(", ")}
                  </span>
                ) : (
                  <span className="text-xs text-txt-secondary italic">Closed</span>
                )}
              </div>
              <svg
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className={`text-txt-secondary transition-transform ${isExpanded ? "rotate-180" : ""}`}
              >
                <path d="M4 6l4 4 4-4" />
              </svg>
            </button>

            {isExpanded && (
              <div className="mt-3 space-y-3 border-t border-border-subtle pt-3">
                {daySlots.map((slot, localIdx) => {
                  const idx = globalIndex(day, localIdx);
                  return (
                    <div key={localIdx} className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-txt-secondary font-medium">Start</label>
                          <input
                            type="time"
                            value={slot.start_time}
                            onChange={(e) => updateSlot(idx, "start_time", e.target.value)}
                            className="w-full bg-white/5 border border-border-subtle rounded-lg px-2.5 py-2 text-sm text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-txt-secondary font-medium">End</label>
                          <input
                            type="time"
                            value={slot.end_time}
                            onChange={(e) => updateSlot(idx, "end_time", e.target.value)}
                            className="w-full bg-white/5 border border-border-subtle rounded-lg px-2.5 py-2 text-sm text-white"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-txt-secondary font-medium">Slot Duration</label>
                          <select
                            value={slot.slot_duration}
                            onChange={(e) => updateSlot(idx, "slot_duration", parseInt(e.target.value))}
                            className="w-full bg-white/5 border border-border-subtle rounded-lg px-2.5 py-2 text-sm text-white"
                          >
                            {DURATION_OPTIONS.map((d) => (
                              <option key={d} value={d}>
                                {d} min
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-txt-secondary font-medium">Max Bookings</label>
                          <input
                            type="number"
                            min="1"
                            value={slot.max_bookings}
                            onChange={(e) => updateSlot(idx, "max_bookings", parseInt(e.target.value) || 1)}
                            className="w-full bg-white/5 border border-border-subtle rounded-lg px-2.5 py-2 text-sm text-white"
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={slot.is_active}
                            onChange={(e) => updateSlot(idx, "is_active", e.target.checked)}
                            className="w-3.5 h-3.5 rounded accent-gold"
                          />
                          <span className="text-[11px] text-txt-secondary">Active</span>
                        </label>
                        <button
                          onClick={() => removeSlot(idx)}
                          className="text-xs text-coral hover:text-coral/80 press"
                        >
                          Remove
                        </button>
                      </div>
                      {localIdx < daySlots.length - 1 && (
                        <div className="border-t border-border-subtle" />
                      )}
                    </div>
                  );
                })}

                <div className="flex gap-2">
                  <button
                    onClick={() => addSlot(day)}
                    className="text-xs text-gold font-semibold press"
                  >
                    + Add Time Block
                  </button>
                  {daySlots.length > 0 && (
                    <button
                      onClick={() => copyToWeekdays(day)}
                      className="text-xs text-txt-secondary hover:text-white press ml-auto"
                    >
                      Copy to Mon-Fri
                    </button>
                  )}
                </div>
              </div>
            )}
          </Card>
        );
      })}

      {error && <p className="text-xs text-coral">{error}</p>}

      {hasChanges && (
        <Button fullWidth onClick={handleSave} loading={saving}>
          Save Schedule
        </Button>
      )}
    </div>
  );
}
