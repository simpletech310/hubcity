"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { getStripeClient } from "@/lib/stripe-client";
import type { Business, Service, BusinessStaff } from "@/types/database";

interface BookingViewProps {
  business: Business;
  services: Service[];
}

type Step = "service" | "date" | "time" | "confirm" | "payment" | "success";

const STEP_ORDER: Step[] = ["service", "date", "time", "confirm", "payment"];

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

// ── Payment Form (inside Elements) ─────────────────────
function BookingCheckoutForm({
  bookingId,
  chargeAmount,
  serviceName,
  onSuccess,
  onCancel,
}: {
  bookingId: string;
  chargeAmount: number;
  serviceName: string;
  onSuccess: (bookingId: string) => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message || "Payment failed");
      setLoading(false);
      return;
    }

    const { error: confirmError, paymentIntent } =
      await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });

    if (confirmError) {
      setError(confirmError.message || "Payment failed");
      setLoading(false);
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      try {
        const res = await fetch("/api/bookings/confirm-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ booking_id: bookingId }),
        });

        if (!res.ok) throw new Error("Failed to confirm booking");
        onSuccess(bookingId);
      } catch {
        setError("Payment succeeded but booking confirmation failed. Contact support.");
        setLoading(false);
      }
    } else {
      setError("Payment was not completed. Please try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="c-ink-block p-4 flex items-center justify-between">
        <div>
          <p className="c-kicker" style={{ color: "var(--paper)", opacity: 0.7 }}>Service</p>
          <p className="c-card-t mt-1" style={{ color: "var(--paper)", fontSize: "14px" }}>{serviceName}</p>
        </div>
        <div className="text-right">
          <p className="c-kicker" style={{ color: "var(--paper)", opacity: 0.7 }}>Amount Due</p>
          <p className="c-hero mt-1" style={{ color: "var(--gold-c)", fontSize: "22px" }}>
            ${(chargeAmount / 100).toFixed(2)}
          </p>
        </div>
      </div>

      <div className="c-frame p-3" style={{ background: "var(--paper)" }}>
        <PaymentElement options={{ layout: "tabs" }} />
      </div>

      {error && (
        <div
          className="p-3"
          style={{
            background: "var(--paper)",
            border: "2px solid var(--red-c, #c0392b)",
            color: "var(--red-c, #c0392b)",
          }}
        >
          <p className="c-meta" style={{ color: "inherit" }}>{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="c-btn c-btn-outline flex-1"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || loading}
          className="c-btn c-btn-primary flex-1"
          style={{ opacity: loading || !stripe ? 0.6 : 1 }}
        >
          {loading ? "Processing..." : `Pay $${(chargeAmount / 100).toFixed(2)}`}
        </button>
      </div>
    </form>
  );
}

// ── Main BookingView ────────────────────────────────────
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

  // Staff/provider state
  const [staffList, setStaffList] = useState<(BusinessStaff & { staff_services: { service_id: string }[] })[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<BusinessStaff | null>(null);
  const [, setStaffLoaded] = useState(false);

  // Payment state
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [chargeAmount, setChargeAmount] = useState(0);

  const [bookingResult, setBookingResult] = useState<{
    id: string;
    date: string;
    start_time: string;
    service_name: string;
  } | null>(null);

  const dates = getNext14Days();

  // Fetch staff for this business
  useEffect(() => {
    fetch(`/api/staff?business_id=${business.id}`)
      .then((r) => r.json())
      .then((d) => setStaffList((d.staff ?? []).filter((s: { is_active: boolean }) => s.is_active)))
      .catch(() => {})
      .finally(() => setStaffLoaded(true));
  }, [business.id]);

  // Get providers available for selected service
  const serviceProviders = selectedService
    ? staffList.filter((s) =>
        s.staff_services.some((ss) => ss.service_id === selectedService.id)
      )
    : [];

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
        const slots = (data.slots ?? [])
          .filter((s: { available: boolean }) => s.available)
          .map((s: { start_time: string }) => s.start_time);
        setAvailableSlots(slots);
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
      const [startH, startM] = selectedTime.split(":").map(Number);
      const totalMinutes = startH * 60 + startM + selectedService.duration;
      const endH = Math.floor(totalMinutes / 60) % 24;
      const endM = totalMinutes % 60;
      const end_time = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;

      const deposit = selectedService.deposit_amount ?? 0;

      if (deposit > 0) {
        // Create payment intent for deposit
        const res = await fetch("/api/bookings/create-payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            business_id: business.id,
            service_id: selectedService.id,
            date: dateStr,
            start_time: selectedTime,
            end_time,
            notes: notes.trim() || null,
            staff_id: selectedStaff?.id || null,
            staff_name: selectedStaff?.name || null,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to create booking");
        }

        const data = await res.json();
        setClientSecret(data.client_secret);
        setBookingId(data.booking_id);
        setChargeAmount(data.charge_amount);
        setStep("payment");
      } else {
        // No deposit — create booking directly
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
            staff_id: selectedStaff?.id || null,
            staff_name: selectedStaff?.name || null,
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
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handlePaymentSuccess(bId: string) {
    const dateStr = selectedDate!.toISOString().split("T")[0];
    setBookingResult({
      id: bId,
      date: dateStr,
      start_time: selectedTime!,
      service_name: selectedService!.name,
    });
    setStep("success");
  }

  return (
    <div
      className="animate-fade-in pb-24 min-h-screen"
      style={{ background: "var(--paper)", color: "var(--ink-strong)" }}
    >
      {/* Header */}
      <div
        className="px-5 pt-4 pb-4 mb-5"
        style={{ borderBottom: "3px solid var(--rule-strong-c)" }}
      >
        <Link
          href={`/business/${business.slug || business.id}`}
          className="c-kicker inline-flex items-center gap-1.5"
          style={{ color: "var(--ink-strong)" }}
        >
          <svg
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M10 12L6 8l4-4" />
          </svg>
          Back
        </Link>
        <h1 className="c-hero mt-3" style={{ fontSize: "32px" }}>
          {business.name}
        </h1>
        <p className="c-kicker mt-1" style={{ opacity: 0.7 }}>Book Appointment</p>
      </div>

      {/* Step Indicator */}
      {step !== "success" && (
        <div className="px-5 mb-5">
          <div className="flex items-center gap-2">
            {STEP_ORDER.filter((s) => {
              // Hide payment step if no deposit
              if (s === "payment" && !(selectedService?.deposit_amount)) return false;
              return true;
            }).map((s, i, arr) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div
                  className="transition-all"
                  style={{
                    width: s === step ? "14px" : "10px",
                    height: s === step ? "14px" : "10px",
                    background:
                      s === step
                        ? "var(--gold-c)"
                        : STEP_ORDER.indexOf(s) < STEP_ORDER.indexOf(step)
                        ? "var(--ink-strong)"
                        : "var(--paper)",
                    border: "2px solid var(--rule-strong-c)",
                  }}
                />
                {i < arr.length - 1 && (
                  <div
                    className="flex-1"
                    style={{
                      height: "2px",
                      background:
                        STEP_ORDER.indexOf(s) < STEP_ORDER.indexOf(step)
                          ? "var(--ink-strong)"
                          : "var(--rule-strong-c)",
                      opacity:
                        STEP_ORDER.indexOf(s) < STEP_ORDER.indexOf(step) ? 1 : 0.3,
                    }}
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
            <h2 className="c-card-t" style={{ fontSize: "16px" }}>Select a Service</h2>
            {services.length === 0 ? (
              <div className="text-center py-12 c-frame" style={{ background: "var(--paper-soft)" }}>
                <p className="c-meta">
                  No services available right now.
                </p>
              </div>
            ) : (
              services.map((service) => {
                const isSelected = selectedService?.id === service.id;
                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => {
                      setSelectedService(service);
                      setStep("date");
                    }}
                    className="w-full text-left p-4 press transition-colors"
                    style={{
                      background: isSelected ? "var(--gold-c)" : "var(--paper)",
                      border: "2px solid var(--rule-strong-c)",
                      color: "var(--ink-strong)",
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="c-card-t" style={{ fontSize: "14px" }}>{service.name}</h3>
                        {service.description && (
                          <p className="c-body-sm mt-1" style={{ color: "var(--ink-strong)", opacity: 0.75 }}>
                            {service.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className="c-meta">
                            {service.duration} min
                          </span>
                          {(service.deposit_amount ?? 0) > 0 && (
                            <span className="c-badge c-badge-ok">
                              ${((service.deposit_amount ?? 0) / 100).toFixed(2)} deposit
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="c-hero shrink-0" style={{ fontSize: "20px" }}>
                        ${(service.price / 100).toFixed(2)}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}

        {/* Step 2: Select Date */}
        {step === "date" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="c-card-t" style={{ fontSize: "16px" }}>Select Date</h2>
              <button
                onClick={() => setStep("service")}
                className="c-btn c-btn-outline c-btn-sm"
              >
                Change Service
              </button>
            </div>

            {selectedService && (
              <div
                className="p-3 flex items-center justify-between"
                style={{
                  background: "var(--paper-soft)",
                  border: "2px solid var(--rule-strong-c)",
                }}
              >
                <span className="c-card-t" style={{ fontSize: "13px" }}>{selectedService.name}</span>
                <span className="c-meta" style={{ color: "var(--ink-strong)" }}>
                  ${(selectedService.price / 100).toFixed(2)} / {selectedService.duration}min
                </span>
              </div>
            )}

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
                    className="flex flex-col items-center min-w-[64px] py-3 px-3 transition-colors press shrink-0"
                    style={{
                      background: isSelected ? "var(--gold-c)" : "var(--paper)",
                      border: "2px solid var(--rule-strong-c)",
                      color: "var(--ink-strong)",
                    }}
                  >
                    <span className="c-kicker" style={{ fontSize: "10px" }}>
                      {dayAbbrevs[date.getDay()]}
                    </span>
                    <span className="c-hero mt-0.5" style={{ fontSize: "22px" }}>
                      {date.getDate()}
                    </span>
                    <span className="c-meta" style={{ fontSize: "10px" }}>
                      {monthAbbrevs[date.getMonth()]}
                    </span>
                    {isToday && (
                      <span
                        className="c-kicker mt-0.5"
                        style={{ fontSize: "8px" }}
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
              <h2 className="c-card-t" style={{ fontSize: "16px" }}>Select Time</h2>
              <button
                onClick={() => setStep("date")}
                className="c-btn c-btn-outline c-btn-sm"
              >
                Change Date
              </button>
            </div>

            {selectedDate && (
              <p className="c-meta">
                {selectedDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            )}

            {slotsLoading ? (
              <div className="text-center py-12 c-frame" style={{ background: "var(--paper-soft)" }}>
                <div
                  className="w-8 h-8 rounded-full animate-spin mx-auto mb-3"
                  style={{
                    border: "2px solid var(--ink-strong)",
                    borderTopColor: "transparent",
                  }}
                />
                <p className="c-meta">Loading available times...</p>
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="text-center py-12 c-frame" style={{ background: "var(--paper-soft)" }}>
                <p className="c-meta">No available times for this date.</p>
                <button
                  onClick={() => setStep("date")}
                  className="c-btn c-btn-outline c-btn-sm mt-3"
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
                      className="py-3 px-2 c-card-t transition-colors press"
                      style={{
                        fontSize: "13px",
                        background: isSelected ? "var(--gold-c)" : "var(--paper)",
                        border: "2px solid var(--rule-strong-c)",
                        color: "var(--ink-strong)",
                      }}
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
            <h2 className="c-card-t" style={{ fontSize: "16px" }}>
              Confirm Booking
            </h2>

            <div
              className="p-4"
              style={{
                background: "var(--paper)",
                border: "2px solid var(--rule-strong-c)",
              }}
            >
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="c-kicker" style={{ opacity: 0.7 }}>Service</span>
                  <span className="c-card-t" style={{ fontSize: "13px" }}>
                    {selectedService?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="c-kicker" style={{ opacity: 0.7 }}>Date</span>
                  <span className="c-body-sm">
                    {selectedDate?.toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="c-kicker" style={{ opacity: 0.7 }}>Time</span>
                  <span className="c-body-sm">{selectedTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="c-kicker" style={{ opacity: 0.7 }}>Duration</span>
                  <span className="c-body-sm">{selectedService?.duration} min</span>
                </div>
              </div>
            </div>

            {/* Totals block */}
            <div className="c-ink-block p-4 space-y-2">
              <div className="flex justify-between">
                <span style={{ opacity: 0.75 }}>Total Price</span>
                <span className="c-card-t" style={{ color: "var(--gold-c)", fontSize: "16px" }}>
                  ${((selectedService?.price ?? 0) / 100).toFixed(2)}
                </span>
              </div>
              {(selectedService?.deposit_amount ?? 0) > 0 && (
                <>
                  <div
                    className="flex justify-between pt-2"
                    style={{ borderTop: "2px solid var(--paper)" }}
                  >
                    <span style={{ opacity: 0.75 }}>Deposit Due Now</span>
                    <span className="c-card-t" style={{ color: "var(--gold-c)", fontSize: "14px" }}>
                      ${((selectedService?.deposit_amount ?? 0) / 100).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs" style={{ opacity: 0.75 }}>
                    <span>Balance at Appointment</span>
                    <span>
                      ${(((selectedService?.price ?? 0) - (selectedService?.deposit_amount ?? 0)) / 100).toFixed(2)}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Provider Selection */}
            {serviceProviders.length > 0 && (
              <div>
                <label className="c-kicker block mb-2">
                  Preferred Provider (optional)
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedStaff(null)}
                    className="px-3 py-2 c-card-t press transition-colors"
                    style={{
                      fontSize: "11px",
                      background: !selectedStaff ? "var(--gold-c)" : "var(--paper)",
                      border: "2px solid var(--rule-strong-c)",
                      color: "var(--ink-strong)",
                    }}
                  >
                    Any Available
                  </button>
                  {serviceProviders.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedStaff(s)}
                      className="flex items-center gap-2 px-3 py-2 c-card-t press transition-colors"
                      style={{
                        fontSize: "11px",
                        background: selectedStaff?.id === s.id ? "var(--gold-c)" : "var(--paper)",
                        border: "2px solid var(--rule-strong-c)",
                        color: "var(--ink-strong)",
                      }}
                    >
                      <div
                        className="w-6 h-6 flex items-center justify-center c-card-t"
                        style={{
                          fontSize: "10px",
                          background: "var(--paper-soft)",
                          border: "2px solid var(--rule-strong-c)",
                          color: "var(--ink-strong)",
                        }}
                      >
                        {s.name.charAt(0)}
                      </div>
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="c-kicker block mb-2">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special requests..."
                rows={3}
                className="w-full px-4 py-3 text-sm focus:outline-none resize-none"
                style={{
                  background: "var(--paper)",
                  color: "var(--ink-strong)",
                  border: "2px solid var(--rule-strong-c)",
                  borderRadius: 0,
                }}
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep("time")}
                className="c-btn c-btn-outline flex-1"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={loading}
                className="c-btn c-btn-primary flex-1"
                style={{ opacity: loading ? 0.6 : 1 }}
              >
                {loading
                  ? "Processing..."
                  : (selectedService?.deposit_amount ?? 0) > 0
                  ? "Confirm & Pay"
                  : "Confirm Booking"}
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Payment */}
        {step === "payment" && clientSecret && bookingId && (
          <div className="space-y-4">
            <h2 className="c-card-t" style={{ fontSize: "16px" }}>Payment</h2>
            <Elements
              stripe={getStripeClient()}
              options={{
                clientSecret,
                appearance: {
                  theme: "flat",
                  variables: {
                    colorPrimary: "#1A1512",
                    colorBackground: "#EDE6D6",
                    colorText: "#1A1512",
                    borderRadius: "0px",
                  },
                },
              }}
            >
              <BookingCheckoutForm
                bookingId={bookingId}
                chargeAmount={chargeAmount}
                serviceName={selectedService?.name ?? ""}
                onSuccess={handlePaymentSuccess}
                onCancel={() => setStep("confirm")}
              />
            </Elements>
          </div>
        )}

        {/* Success */}
        {step === "success" && bookingResult && (
          <div className="text-center py-8 space-y-5">
            <div
              className="w-16 h-16 flex items-center justify-center mx-auto"
              style={{
                background: "var(--gold-c)",
                border: "3px solid var(--rule-strong-c)",
              }}
            >
              <svg
                width="32"
                height="32"
                fill="none"
                stroke="var(--ink-strong)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div>
              <h2 className="c-hero" style={{ fontSize: "28px" }}>
                Booking Confirmed
              </h2>
              <p className="c-meta mt-2">
                Your appointment has been booked.
              </p>
            </div>

            <div
              className="p-4 text-left"
              style={{
                background: "var(--paper)",
                border: "2px solid var(--rule-strong-c)",
              }}
            >
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="c-kicker" style={{ opacity: 0.7 }}>Service</span>
                  <span className="c-card-t" style={{ fontSize: "13px" }}>
                    {bookingResult.service_name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="c-kicker" style={{ opacity: 0.7 }}>Date</span>
                  <span className="c-body-sm">
                    {new Date(bookingResult.date + "T00:00:00").toLocaleDateString(
                      "en-US",
                      { weekday: "short", month: "short", day: "numeric" }
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="c-kicker" style={{ opacity: 0.7 }}>Time</span>
                  <span className="c-body-sm">{bookingResult.start_time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="c-kicker" style={{ opacity: 0.7 }}>Location</span>
                  <span className="c-body-sm text-right max-w-[60%]">
                    {business.address}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => router.push("/bookings")}
                className="c-btn c-btn-primary w-full"
              >
                View My Bookings
              </button>
              <button
                type="button"
                onClick={() =>
                  router.push(`/business/${business.slug || business.id}`)
                }
                className="c-btn c-btn-outline w-full"
              >
                Back to Business
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
