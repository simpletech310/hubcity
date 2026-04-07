"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

interface CalendarBooking {
  id: string;
  service_name: string;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  price: number | null;
  staff_name: string | null;
  customer_name: string;
}

interface BookingCalendarProps {
  bookings: CalendarBooking[];
}

const statusColors: Record<string, "gold" | "emerald" | "cyan" | "coral"> = {
  pending: "gold",
  confirmed: "emerald",
  completed: "cyan",
  cancelled: "coral",
  no_show: "coral",
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function BookingCalendar({ bookings }: BookingCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const today = new Date().toISOString().split("T")[0];

  // Group bookings by date
  const bookingsByDate = useMemo(() => {
    const map = new Map<string, CalendarBooking[]>();
    for (const b of bookings) {
      if (!map.has(b.date)) map.set(b.date, []);
      map.get(b.date)!.push(b);
    }
    return map;
  }, [bookings]);

  // Calendar grid
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  }, [currentMonth]);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const selectedBookings = selectedDate ? bookingsByDate.get(selectedDate) ?? [] : [];

  function prevMonth() {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    setSelectedDate(null);
  }

  function nextMonth() {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    setSelectedDate(null);
  }

  function dateStr(day: number) {
    const m = String(currentMonth.getMonth() + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${currentMonth.getFullYear()}-${m}-${d}`;
  }

  return (
    <div className="space-y-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-white/10 transition-colors press">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M10 12L6 8l4-4" />
          </svg>
        </button>
        <h3 className="font-heading font-bold text-sm">
          {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </h3>
        <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-white/10 transition-colors press">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M6 4l4 4-4 4" />
          </svg>
        </button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-1">
        {DAY_NAMES.map((d) => (
          <div key={d} className="text-center text-[10px] text-txt-secondary font-semibold py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} />;

          const ds = dateStr(day);
          const dayBookings = bookingsByDate.get(ds) ?? [];
          const isToday = ds === today;
          const isSelected = ds === selectedDate;
          const hasPending = dayBookings.some((b) => b.status === "pending");
          const hasConfirmed = dayBookings.some((b) => b.status === "confirmed");

          return (
            <button
              key={ds}
              onClick={() => setSelectedDate(isSelected ? null : ds)}
              className={`relative aspect-square rounded-lg flex flex-col items-center justify-center transition-all press text-xs ${
                isSelected
                  ? "bg-gold/20 border border-gold/40"
                  : isToday
                  ? "bg-white/10 border border-gold/20"
                  : "hover:bg-white/5"
              }`}
            >
              <span className={`font-semibold ${isToday ? "text-gold" : ""}`}>
                {day}
              </span>
              {dayBookings.length > 0 && (
                <div className="flex gap-0.5 mt-0.5">
                  {hasPending && <div className="w-1.5 h-1.5 rounded-full bg-gold" />}
                  {hasConfirmed && <div className="w-1.5 h-1.5 rounded-full bg-emerald" />}
                  {!hasPending && !hasConfirmed && dayBookings.length > 0 && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Day Bookings */}
      {selectedDate && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-txt-secondary uppercase tracking-wider">
            {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
            {" · "}
            {selectedBookings.length} booking{selectedBookings.length !== 1 ? "s" : ""}
          </h4>

          {selectedBookings.length === 0 ? (
            <p className="text-sm text-txt-secondary py-4 text-center">
              No bookings on this day.
            </p>
          ) : (
            selectedBookings
              .sort((a, b) => a.start_time.localeCompare(b.start_time))
              .map((b) => (
                <Link key={b.id} href={`/dashboard/bookings/${b.id}`}>
                  <Card hover className="flex items-center gap-3">
                    <div className="text-center shrink-0 w-12">
                      <p className="text-xs font-bold text-gold">{b.start_time.slice(0, 5)}</p>
                      <p className="text-[9px] text-txt-secondary">{b.end_time.slice(0, 5)}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold truncate">{b.service_name}</p>
                        <Badge
                          label={b.status.replace("_", " ")}
                          variant={statusColors[b.status] || "gold"}
                          size="sm"
                        />
                      </div>
                      <p className="text-xs text-txt-secondary truncate">
                        {b.customer_name}
                        {b.staff_name ? ` · ${b.staff_name}` : ""}
                      </p>
                    </div>
                    {b.price !== null && (
                      <span className="text-xs font-semibold text-gold shrink-0">
                        ${(b.price / 100).toFixed(2)}
                      </span>
                    )}
                  </Card>
                </Link>
              ))
          )}
        </div>
      )}
    </div>
  );
}
