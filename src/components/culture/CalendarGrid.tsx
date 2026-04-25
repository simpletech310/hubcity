"use client";

import clsx from "clsx";

type CalendarEvent = {
  date: string;
  title: string;
  color: string;
};

interface CalendarGridProps {
  events: CalendarEvent[];
  month: number; // 0-indexed
  year: number;
  onMonthChange: (month: number, year: number) => void;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function CalendarGrid({
  events,
  month,
  year,
  onMonthChange,
}: CalendarGridProps) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);
  const today = new Date();
  const isCurrentMonth =
    today.getFullYear() === year && today.getMonth() === month;

  const eventsByDay = new Map<number, CalendarEvent[]>();
  for (const evt of events) {
    const d = new Date(evt.date);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      if (!eventsByDay.has(day)) eventsByDay.set(day, []);
      eventsByDay.get(day)!.push(evt);
    }
  }

  function handlePrev() {
    if (month === 0) {
      onMonthChange(11, year - 1);
    } else {
      onMonthChange(month - 1, year);
    }
  }

  function handleNext() {
    if (month === 11) {
      onMonthChange(0, year + 1);
    } else {
      onMonthChange(month + 1, year);
    }
  }

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrev}
          className="p-2 rounded-lg hover:bg-black/[0.06] transition-colors"
          style={{ color: "var(--ink-mute)" }}
          aria-label="Previous month"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M13 5l-5 5 5 5" />
          </svg>
        </button>
        <h3 className="font-heading font-bold text-lg" style={{ color: "var(--ink-strong)" }}>
          {MONTH_NAMES[month]} {year}
        </h3>
        <button
          onClick={handleNext}
          className="p-2 rounded-lg hover:bg-black/[0.06] transition-colors"
          style={{ color: "var(--ink-mute)" }}
          aria-label="Next month"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M7 5l5 5-5 5" />
          </svg>
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map((label) => (
          <div
            key={label}
            className="text-center text-[11px] font-semibold py-2"
            style={{ color: "var(--ink-soft)" }}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-px overflow-hidden" style={{ background: "var(--rule-strong-c)" }}>
        {cells.map((day, i) => {
          const isToday = isCurrentMonth && day === today.getDate();
          const dayEvents = day ? eventsByDay.get(day) : undefined;

          return (
            <div
              key={i}
              className={clsx(
                "min-h-[48px] md:min-h-[64px] p-1.5 relative",
                !day && "opacity-30"
              )}
              style={{ background: "var(--paper)" }}
            >
              {day && (
                <>
                  <span
                    className={clsx(
                      "text-xs font-medium inline-flex items-center justify-center w-6 h-6 rounded-full",
                      isToday
                        ? "ring-2 ring-gold text-gold font-bold"
                        : ""
                    )}
                    style={!isToday ? { color: "var(--ink-mute)" } : undefined}
                  >
                    {day}
                  </span>
                  {dayEvents && dayEvents.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5 flex-wrap">
                      {dayEvents.slice(0, 3).map((evt, j) => (
                        <div
                          key={j}
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: evt.color }}
                          title={evt.title}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export type { CalendarEvent };
