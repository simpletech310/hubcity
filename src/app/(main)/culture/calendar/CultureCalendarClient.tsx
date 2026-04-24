"use client";

import { useState } from "react";
import CalendarGrid from "@/components/culture/CalendarGrid";
import type { CalendarEvent } from "@/components/culture/CalendarGrid";

type EventData = {
  id: string;
  title: string;
  start_date: string;
  end_date?: string | null;
  location?: string | null;
  category?: string | null;
  description?: string | null;
};

const EVENT_COLORS: Record<string, string> = {
  culture: "#C5A04E",
  music: "#7C3AED",
  art: "#EF4444",
  community: "#10B981",
  default: "#C5A04E",
};

interface CultureCalendarClientProps {
  events: EventData[];
  initialMonth: number;
  initialYear: number;
}

export default function CultureCalendarClient({
  events,
  initialMonth,
  initialYear,
}: CultureCalendarClientProps) {
  const [month, setMonth] = useState(initialMonth);
  const [year, setYear] = useState(initialYear);

  const calendarEvents: CalendarEvent[] = events.map((e) => ({
    date: e.start_date,
    title: e.title,
    color: EVENT_COLORS[e.category || "default"] || EVENT_COLORS.default,
  }));

  const monthEvents = events.filter((e) => {
    const d = new Date(e.start_date);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  function handleMonthChange(newMonth: number, newYear: number) {
    setMonth(newMonth);
    setYear(newYear);
  }

  return (
    <div className="space-y-6">
      <CalendarGrid
        events={calendarEvents}
        month={month}
        year={year}
        onMonthChange={handleMonthChange}
      />

      {/* Event List for current month */}
      <div className="space-y-3">
        <h3 className="c-card-t" style={{ color: "var(--ink-strong)" }}>
          Events This Month
        </h3>
        {monthEvents.length > 0 ? (
          <div className="space-y-2">
            {monthEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-start gap-3 p-4"
                style={{
                  background: "var(--paper)",
                  border: "2px solid var(--rule-strong-c)",
                }}
              >
                <div
                  className="shrink-0 w-10 h-10 flex flex-col items-center justify-center"
                  style={{
                    background: "var(--gold-c)",
                    border: "2px solid var(--rule-strong-c)",
                  }}
                >
                  <span
                    className="text-xs"
                    style={{
                      color: "var(--ink-strong)",
                      fontFamily: "var(--font-archivo), sans-serif",
                      fontWeight: 800,
                    }}
                  >
                    {new Date(event.start_date).getDate()}
                  </span>
                </div>
                <div className="min-w-0">
                  <h4 className="c-card-t" style={{ fontSize: 14, color: "var(--ink-strong)" }}>
                    {event.title}
                  </h4>
                  {event.location && (
                    <p className="c-meta mt-0.5" style={{ fontSize: 11 }}>
                      {event.location}
                    </p>
                  )}
                  {event.description && (
                    <p className="c-body mt-1 line-clamp-2" style={{ fontSize: 12, color: "var(--ink-strong)" }}>
                      {event.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="c-body py-4" style={{ fontSize: 13, color: "var(--ink-strong)", opacity: 0.7 }}>
            No cultural events this month.
          </p>
        )}
      </div>
    </div>
  );
}
