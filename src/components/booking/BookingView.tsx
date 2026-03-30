"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import type { Business, Service } from "@/types/database";

interface BookingViewProps {
  business: Business;
  services: Service[];
}

type Step = "service" | "date" | "time" | "confirm" | "success";

function getNext14Days(): Date[] {
  const days: Date[] = [];
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
}

const dayAbbrevs = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const monthAbbrevs = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export default function BookingView({ business, services }: BookingViewProps) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState<Step>("service");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [bookingResult, setBookingResult] = useState<{
    id: string;
    date: string;
    start_time: string;
    service_name: string;
  } | null>(null);

  const dates = getNext14Days();

  // Fetch available slots when date changes
  useEffect(() => {
    if (!selectedDate || !selectedService) return;

    const dateStr = selectedDate.toISOString().split("T")[0];

    setSlotsLoading(true);
    setAvailableSlots([]);
    setSelectedTime(null);

    fetch(
      `/api/bookings/available-slots?business_id=${business.id}&service_id=${selectedService.id}&date=${dateStr}`
    )
      .then((res) => res.json())
      .then((data) => {
        setAvailableSlots(data.slots ?? []);
      })
      .catch(() => {
        setAvailableSlots([]);
      })
      .finally(() => {
        setSlotsLoading(false);
      });
  }, [selectedDate, selectedService, business.id]);

  async function handleConfirm() {
    if (!selectedService || !selectedDate || !selectedTime) return;

    setLoading(true);
    try {
      const dateStr = selectedDate.toISOString().split("T")[0];

      // Calculate end_time from start_time + service duration
      const [startH, startM] = selectedTime.split(":").map(Number);
      const totalMinutes = startH * 60 + startM + selectedService.duration;
      const endH = Math.floor(totalMinutes / 60) % 24;
      const endM = totalMinutes % 60;
      const end_time = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_id: business.id,
          service_name: selectedService.name,
          date: dateStr,
          start_time: selectedTime,
          end_time,
          price: selectedService.price,
          notes: notes.trim() || null,
        }),
      });

      if (!res.ok) throw new Error("Failed to create booking");

      const booking = await res.json();
      setBookingResult({
        id: booking.id,
        date: dateStr,
        start_time: selectedTime,
        service_name: selectedService.name,
      });
      setStep("success");
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-fade-in pb-24">
      {/* Header */}
      <div className="px-5 pt-4 mb-4">
        <Link
          href={`/business/${business.slug || business.id}`}
          className="inline-flex items-center gap-1.5 text-gold text-sm font-semibold press"
        >
          <svg
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M10 12L6 8l4-4" />
          </svg>
          Back
        </Link>
        <h1 className="font-heading text-2xl font-bold mt-3">
          {business.name}
        </h1>
        <p className="text-sm text-txt-secondary mt-0.5">Book Appointment</p>
      </div>

      {/* Step Indicator */}
      {step !== "success" && (
        <div className="px-5 mb-5">
          <div className="flex items-center gap-2">
            {(["service", "date", "time", "confirm"] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div
                  className={`w-2 h-2 rounded-full transition-all ${
                    s === step
                      ? "bg-gold w-3 h-3"
                      : (["service", "date", "time", "confirm"].indexOf(s) <
                          ["service", "date", "time", "confirm"].indexOf(step))
                      ? "bg-gold/50"
                      : "bg-white/10"
                  }`}
                />
                {i < 3 && (
                  <div
                    className={`flex-1 h-px ${
                      ["service", "date", "time", "confirm"].indexOf(s) <
                      ["service", "date", "time", "confirm"].indexOf(step)
                        ? "bg-gold/30"
                        : "bg-white/10"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="px-5">
        {/* Step 1: Select Service */}
        {step === "service" && (
          <div className="space-y-3">
            <h2 className="font-heading font-bold text-base">Select a Service</h2>
            {services.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-txt-secondary text-sm">
                  No services available right now.
                </p>
              </div>
            ) : (
              services.map((service) => (
                <Card
                  key={service.id}
                  hover
                  className={
                    selectedService?.id === service.id
                      ? "border-gold/40 glow-gold-sm"
                      : ""
                  }
                  onClick={() => {
                    setSelectedService(service);
                    setStep("date");
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-[13px] font-bold">{service.name}</h3>
                      {service.description && (
                        <p className="text-[11px] text-txt-secondary mt-0.5">
                          {service.description}
                        </p>
                      )}
                      <p className="text-xs text-txt-secondary mt-1">
                        {service.duration} min
                      </p>
                    </div>
                    <span className="font-heading font-bold text-gold text-sm">
                      ${(service.price / 100).toFixed(2)}
                    </span>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Step 2: Select Date */}
        {step === "date" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading font-bold text-base">Select Date</h2>
              <button
                onClick={() => setStep("service")}
                className="text-gold text-xs font-semibold press"
              >
                Change Service
              </button>
            </div>

            {/* Selected service summary */}
            {selectedService && (
              <Card className="bg-white/[0.03]">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">{selectedService.name}</span>
                  <span className="text-gold">
                    ${(selectedService.price / 100).toFixed(2)} / {selectedService.duration}min
                  </span>
                </div>
              </Card>
            )}

            {/* Date pills */}
            <div
              ref={scrollRef}
              className="flex gap-2 overflow-x-auto scrollbar-hide -mx-5 px-5 pb-2"
            >
              {dates.map((date) => {
                const isSelected =
                  selectedDate?.toDateString() === date.toDateString();
                const isToday =
                  date.toDateString() === new Date().toDateString();
                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => {
                      setSelectedDate(date);
                      setStep("time");
                    }}
                    className={`flex flex-col items-center min-w-[60px] py-3 px-3 rounded-xl transition-all press shrink-0 ${
                      isSelected
                        ? "bg-gold text-midnight"
                        : "bg-white/[0.06] border border-border-subtle text-white hover:border-gold/20"
                    }`}
                  >
                    <span className="text-[10px] font-semibold uppercase">
                      {dayAbbrevs[date.getDay()]}
                    </span>
                    <span className="text-lg font-bold mt-0.5">
                      {date.getDate()}
                    </span>
                    <span className="text-[10px]">
                      {monthAbbrevs[date.getMonth()]}
                    </span>
                    {isToday && (
                      <span
                        className={`text-[8px] font-bold mt-0.5 ${
                          isSelected ? "text-midnight/60" : "text-gold"
                        }`}
                      >
                        TODAY
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Select Time */}
        {step === "time" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading font-bold text-base">Select Time</h2>
              <button
                onClick={() => setStep("date")}
                className="text-gold text-xs font-semibold press"
              >
                Change Date
              </button>
            </div>

            {/* Date summary */}
            {selectedDate && (
              <p className="text-sm text-txt-secondary">
                {selectedDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            )}

            {slotsLoading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-txt-secondary">
                  Loading available times...
                </p>
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-txt-secondary text-sm">
                  No available times for this date.
                </p>
                <button
                  onClick={() => setStep("date")}
                  className="text-gold text-sm font-semibold mt-3 press"
                >
                  Try another date
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {availableSlots.map((slot) => {
                  const isSelected = selectedTime === slot;
                  return (
                    <button
                      key={slot}
                      onClick={() => {
                        setSelectedTime(slot);
                        setStep("confirm");
                      }}
                      className={`py-3 px-2 rounded-xl text-sm font-semibold transition-all press ${
                        isSelected
                          ? "bg-gold text-midnight"
                          : "bg-white/[0.06] border border-border-subtle text-white hover:border-gold/20"
                      }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Confirm */}
        {step === "confirm" && (
          <div className="space-y-4">
            <h2 className="font-heading font-bold text-base">
              Confirm Booking
            </h2>

            <Card>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-txt-secondary">Service</span>
                  <span className="font-semibold">
                    {selectedService?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-txt-secondary">Date</span>
                  <span>
                    {selectedDate?.toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-txt-secondary">Time</span>
                  <span>{selectedTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-txt-secondary">Duration</span>
                  <span>{selectedService?.duration} min</span>
                </div>
                <div className="border-t border-border-subtle pt-2 flex justify-between font-bold">
                  <span>Price</span>
                  <span className="text-gold">
                    ${((selectedService?.price ?? 0) / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            </Card>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-txt-secondary mb-1.5">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special requests..."
                rows={3}
                className="w-full bg-white/5 border border-border-subtle rounded-xl px-4 py-3 text-sm text-white placeholder:text-txt-secondary focus:outline-none focus:border-gold/40 focus:ring-1 focus:ring-gold/20 transition-colors resize-none"
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setStep("time")}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleConfirm}
                loading={loading}
                className="flex-1"
              >
                Confirm Booking
              </Button>
            </div>
          </div>
        )}

        {/* Success */}
        {step === "success" && bookingResult && (
          <div className="text-center py-8 space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald/20 flex items-center justify-center mx-auto">
              <svg
                width="32"
                height="32"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-emerald"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div>
              <h2 className="font-heading text-xl font-bold">
                Booking Confirmed!
              </h2>
              <p className="text-sm text-txt-secondary mt-1">
                Your appointment has been booked.
              </p>
            </div>

            <Card>
              <div className="space-y-2 text-sm text-left">
                <div className="flex justify-between">
                  <span className="text-txt-secondary">Service</span>
                  <span className="font-semibold">
                    {bookingResult.service_name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-txt-secondary">Date</span>
                  <span>
                    {new Date(bookingResult.date + "T00:00:00").toLocaleDateString(
                      "en-US",
                      { weekday: "short", month: "short", day: "numeric" }
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-txt-secondary">Time</span>
                  <span>{bookingResult.start_time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-txt-secondary">Location</span>
                  <span className="text-right max-w-[60%]">
                    {business.address}
                  </span>
                </div>
              </div>
            </Card>

            <div className="space-y-3">
              <Button
                fullWidth
                onClick={() => router.push("/bookings")}
              >
                View My Bookings
              </Button>
              <Button
                fullWidth
                variant="secondary"
                onClick={() =>
                  router.push(`/business/${business.slug || business.id}`)
                }
              >
                Back to Business
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
