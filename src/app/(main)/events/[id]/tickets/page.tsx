"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { getStripeClient } from "@/lib/stripe-client";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import { createClient } from "@/lib/supabase/client";
import type { Event, EventTicketConfig } from "@/types/database";
import type { Stripe } from "@stripe/stripe-js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ConfigWithSection = EventTicketConfig & {
  venue_section: {
    id: string;
    name: string;
    description: string | null;
    color: string | null;
    sort_order: number;
  } | null;
};

interface CheckoutData {
  clientSecret: string;
  orderId: string;
  orderNumber: string;
  total: number;
  subtotal: number;
  fee: number;
  items: {
    sectionName: string;
    quantity: number;
    unitPrice: number;
  }[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatTime12h(time: string): string {
  const [h, m] = time.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${hour12}:${m} ${ampm}`;
}

const categoryColors: Record<string, string> = {
  city: "#F2A900",
  sports: "#22C55E",
  culture: "#FF006E",
  community: "#8B5CF6",
  school: "#3B82F6",
  youth: "#06B6D4",
};

// ---------------------------------------------------------------------------
// Inner payment form (rendered inside <Elements>)
// ---------------------------------------------------------------------------

function PaymentForm({
  checkout,
  eventId,
  eventName,
  eventDate,
}: {
  checkout: CheckoutData;
  eventId: string;
  eventName: string;
  eventDate: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setError(null);
    setSubmitting(true);

    const returnUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/events/${eventId}/tickets/confirmation?order_id=${checkout.orderId}`
        : `/events/${eventId}/tickets/confirmation?order_id=${checkout.orderId}`;

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
    });

    if (stripeError) {
      setError(stripeError.message ?? "Payment failed. Please try again.");
    }
    setSubmitting(false);
  }

  return (
    <form onSubmit={handlePay} className="space-y-5 pb-8">
      {/* Order Summary Card */}
      <div className="c-ink-block overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b-2 border-[color:var(--paper)]/20 flex items-center justify-between">
          <p className="c-kicker">Order Summary</p>
          <p className="text-xs font-mono" style={{ color: "var(--gold-c)" }}>{checkout.orderNumber}</p>
        </div>

        {/* Event info */}
        <div className="px-4 py-3 border-b-2 border-[color:var(--paper)]/20">
          <p className="text-sm font-bold">{eventName}</p>
          <p className="c-meta mt-0.5 opacity-80">{eventDate}</p>
        </div>

        {/* Line items */}
        <div className="px-4 py-3 space-y-2">
          {checkout.items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="opacity-80">
                {item.sectionName} &times; {item.quantity}
              </span>
              <span className="font-medium">{formatCents(item.unitPrice * item.quantity)}</span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="px-4 py-3 border-t-2 border-[color:var(--paper)]/20 space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="opacity-80">Subtotal</span>
            <span>{formatCents(checkout.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="opacity-80">Service fee (5%)</span>
            <span>{formatCents(checkout.fee)}</span>
          </div>
        </div>

        <div className="px-4 py-3 border-t-2 border-[color:var(--paper)]/20">
          <div className="flex justify-between items-center">
            <span className="c-kicker">Total</span>
            <span className="text-lg font-bold" style={{ color: "var(--gold-c)" }}>{formatCents(checkout.total)}</span>
          </div>
        </div>
      </div>

      {/* Payment section header */}
      <div className="flex items-center justify-between border-b-[3px] pb-2" style={{ borderColor: "var(--rule-strong-c)" }}>
        <h2 className="c-kicker">Payment</h2>
        <div className="flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--ink-strong)" }}>
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
          <span className="c-kicker" style={{ fontSize: "10px" }}>Secured by Stripe</span>
        </div>
      </div>

      {/* Stripe Payment Element */}
      <div className="c-frame" style={{ background: "var(--paper)" }}>
        <PaymentElement options={{ layout: "tabs" }} />
      </div>

      {error && (
        <div className="c-frame p-3" style={{ background: "var(--paper-soft)" }}>
          <p className="text-sm" style={{ color: "var(--ink-strong)" }}>{error}</p>
        </div>
      )}

      {/* Pay button */}
      <button
        type="submit"
        disabled={!stripe || !elements || submitting}
        className="c-btn c-btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {submitting ? (
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
            Pay {formatCents(checkout.total)}
          </>
        )}
      </button>

      <p className="c-meta text-center">
        Your payment info is never stored by Culture
      </p>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Skeleton loader
// ---------------------------------------------------------------------------

function SkeletonCards() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="c-frame p-4" style={{ background: "var(--paper)", border: "2px solid var(--rule-strong-c)" }}>
          <div className="animate-pulse flex gap-3">
            <div className="w-1 rounded-full bg-white/10 self-stretch" />
            <div className="flex-1 space-y-3">
              <div className="flex justify-between">
                <div className="h-4 bg-white/10 rounded w-28" />
                <div className="h-4 bg-white/10 rounded w-16" />
              </div>
              <div className="h-3 bg-white/10 rounded w-40" />
              <div className="flex justify-between items-center">
                <div className="h-3 bg-white/10 rounded w-20" />
                <div className="h-8 bg-white/10 rounded-full w-24" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export default function TicketSelectionPage() {
  const params = useParams<{ id: string }>();
  const eventId = params.id;
  const router = useRouter();

  // Data state
  const [event, setEvent] = useState<Event | null>(null);
  const [configs, setConfigs] = useState<ConfigWithSection[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkout, setCheckout] = useState<CheckoutData | null>(null);
  const [stripeInstance, setStripeInstance] = useState<Stripe | null>(null);

  // Load Stripe on mount
  useEffect(() => {
    getStripeClient().then(setStripeInstance);
  }, []);

  // Fetch event + configs
  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();

        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.replace(`/login?redirect=/events/${eventId}/tickets`);
          return;
        }

        const { data: ev, error: evErr } = await supabase
          .from("events")
          .select("*")
          .eq("id", eventId)
          .single();

        if (evErr || !ev) {
          router.replace("/events");
          return;
        }
        setEvent(ev as Event);

        const { data: cfgs, error: cfgErr } = await supabase
          .from("event_ticket_config")
          .select("*, venue_section:venue_sections(*)")
          .eq("event_id", eventId)
          .eq("is_active", true)
          .order("venue_section(sort_order)");

        if (cfgErr) {
          setError("Failed to load ticket availability. Please try again.");
          setLoading(false);
          return;
        }

        const typedCfgs = (cfgs ?? []) as ConfigWithSection[];
        setConfigs(typedCfgs);

        const initial: Record<string, number> = {};
        for (const c of typedCfgs) initial[c.id] = 0;
        setQuantities(initial);
      } catch {
        setError("Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [eventId, router]);

  // Quantity helpers
  const setQty = useCallback(
    (configId: string, delta: number) => {
      setQuantities((prev) => {
        const cfg = configs.find((c) => c.id === configId);
        if (!cfg) return prev;
        const max = Math.min(cfg.available_count, cfg.max_per_order);
        const next = Math.max(0, Math.min(max, (prev[configId] ?? 0) + delta));
        return { ...prev, [configId]: next };
      });
    },
    [configs]
  );

  // Derived values
  const selectedItems = configs
    .filter((c) => (quantities[c.id] ?? 0) > 0)
    .map((c) => ({ config_id: c.id, quantity: quantities[c.id] }));

  const ticketCount = selectedItems.reduce((s, i) => s + i.quantity, 0);

  const subtotal = configs.reduce(
    (sum, c) => sum + c.price * (quantities[c.id] ?? 0),
    0
  );

  const hasSelection = selectedItems.length > 0;

  // Checkout handler
  async function handleContinue() {
    setError(null);
    setCheckingOut(true);

    try {
      const res = await fetch("/api/tickets/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: eventId, items: selectedItems }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to start checkout. Please try again.");
        setCheckingOut(false);
        return;
      }

      const lineItems = configs
        .filter((c) => (quantities[c.id] ?? 0) > 0)
        .map((c) => ({
          sectionName: c.venue_section?.name ?? "General Admission",
          quantity: quantities[c.id],
          unitPrice: c.price,
        }));

      const fee = Math.round(subtotal * 0.05);

      setCheckout({
        clientSecret: data.client_secret,
        orderId: data.order_id,
        orderNumber: data.order_number,
        total: data.total ?? subtotal + fee,
        subtotal,
        fee,
        items: lineItems,
      });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setCheckingOut(false);
    }
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  const accentColor = event ? (categoryColors[event.category] || "#F2A900") : "#F2A900";

  const formattedDate = event
    ? new Date(event.start_date).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    : "";

  const formattedTime = event?.start_time ? formatTime12h(event.start_time) : "";

  return (
    <div className="culture-surface min-h-dvh animate-fade-in">
      {/* ── Header ── */}
      <div className="px-5 pt-4 pb-3">
        <Link
          href={`/events/${eventId}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold press"
          style={{ color: "var(--ink-strong)" }}
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M10 12L6 8l4-4" />
          </svg>
          Back
        </Link>
      </div>

      {/* ── Event Summary Banner ── */}
      {event && !checkout && (
        <div className="px-5 mb-5">
          <div
            className="c-frame p-4 relative overflow-hidden"
            style={{ background: "var(--paper)", border: "2px solid var(--rule-strong-c)" }}
          >
            <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: "var(--gold-c)" }} />
            <div className="flex items-start gap-3.5">
              {/* Mini image/gradient */}
              <div
                className="w-14 h-14 overflow-hidden shrink-0 relative"
                style={{ border: "2px solid var(--rule-strong-c)" }}
              >
                {event.image_url ? (
                  <Image src={event.image_url} alt={event.title} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ background: `${accentColor}20` }}>
                    <Icon name="ticket" size={20} />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{event.title}</p>
                <p className="text-xs text-txt-secondary mt-0.5">
                  {formattedDate}{formattedTime ? ` · ${formattedTime}` : ""}
                </p>
                {event.location_name && (
                  <p className="text-[11px] mt-1 truncate" style={{ color: accentColor }}>
                    <Icon name="pin" size={11} className="inline" /> {event.location_name}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Page Title (Culture masthead) ── */}
      <div className="px-5 mb-5 border-b-[3px] pb-4" style={{ borderColor: "var(--rule-strong-c)" }}>
        <p className="c-kicker mb-2">{checkout ? "Checkout" : "Tickets"}</p>
        <h1 className="c-hero" style={{ fontSize: "clamp(44px, 9vw, 56px)" }}>
          {checkout ? "Checkout" : "Select Tickets"}
        </h1>
        {!checkout && (
          <p className="c-serif-it mt-2">
            Choose your section and quantity
          </p>
        )}
      </div>

      <div className="px-5">
        {/* Loading skeleton */}
        {loading && <SkeletonCards />}

        {/* Error state (on initial load) */}
        {!loading && error && !checkout && configs.length === 0 && (
          <div className="c-frame p-4 text-center" style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)" }}>
            <p className="text-sm mb-3" style={{ color: "var(--ink-strong)" }}>{error}</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && configs.length === 0 && (
          <div className="text-center py-12">
            <div
              className="w-16 h-16 mx-auto mb-4 flex items-center justify-center"
              style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)" }}
            >
              <Icon name="ticket" size={30} />
            </div>
            <p className="text-txt-secondary text-sm">No tickets available for this event.</p>
          </div>
        )}

        {/* STEP 2: Checkout with Stripe */}
        {checkout && stripeInstance ? (
          <Elements
            stripe={stripeInstance}
            options={{
              clientSecret: checkout.clientSecret,
              appearance: {
                theme: "stripe",
                variables: {
                  colorPrimary: "#1a1512",
                  colorBackground: "#EDE6D6",
                  colorText: "#1a1512",
                  colorDanger: "#B3261E",
                  borderRadius: "0px",
                  fontFamily: "'Inter', system-ui, sans-serif",
                  spacingUnit: "4px",
                },
                rules: {
                  ".Input": {
                    border: "2px solid #1a1512",
                    boxShadow: "none",
                  },
                  ".Input:focus": {
                    border: "2px solid #1a1512",
                    boxShadow: "0 0 0 1px #F2A900",
                  },
                  ".Tab": {
                    border: "2px solid #1a1512",
                    boxShadow: "none",
                  },
                  ".Tab--selected": {
                    border: "2px solid #1a1512",
                    backgroundColor: "rgba(242,169,0,0.15)",
                  },
                },
              },
            }}
          >
            <PaymentForm
              checkout={checkout}
              eventId={eventId}
              eventName={event?.title ?? ""}
              eventDate={formattedDate + (formattedTime ? ` · ${formattedTime}` : "")}
            />
          </Elements>
        ) : checkout && !stripeInstance ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : null}

        {/* STEP 1: Ticket selection cards */}
        {!loading && !checkout && configs.length > 0 && (
          <div className="space-y-4 pb-36">
            {configs.map((cfg) => {
              const section = cfg.venue_section;
              const isSoldOut = cfg.available_count <= 0;
              const qty = quantities[cfg.id] ?? 0;
              const max = Math.min(cfg.available_count, cfg.max_per_order);
              const sectionColor = section?.color || accentColor;

              return (
                <div
                  key={cfg.id}
                  className={`c-frame relative overflow-hidden transition-all duration-200 ${
                    isSoldOut ? "opacity-40" : ""
                  }`}
                  style={{ background: "var(--paper)", border: "2px solid var(--rule-strong-c)" }}
                >
                  {/* Left accent */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: sectionColor }} />

                  <div className="p-4 pl-5">
                    {/* Name + Price row */}
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: sectionColor }}
                          />
                          <p className="font-bold text-sm truncate">
                            {section?.name ?? "General Admission"}
                          </p>
                        </div>
                        {section?.description && (
                          <p className="text-[11px] text-txt-secondary mt-1 ml-5">
                            {section.description}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-lg font-bold" style={{ color: sectionColor }}>
                          {formatCents(cfg.price)}
                        </p>
                        <p className="text-[10px] text-txt-secondary">per ticket</p>
                      </div>
                    </div>

                    {/* Availability + Quantity row */}
                    <div className="flex items-center justify-between mt-3 ml-5">
                      {isSoldOut ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-coral" />
                          <span className="text-xs text-coral font-semibold">Sold Out</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald" />
                          <span className="text-xs text-emerald font-semibold">
                            {cfg.available_count} available
                          </span>
                        </div>
                      )}

                      {!isSoldOut && (
                        <div className="flex items-center gap-2.5">
                          <button
                            onClick={() => setQty(cfg.id, -1)}
                            disabled={qty === 0}
                            className="w-9 h-9 flex items-center justify-center text-lg font-bold disabled:opacity-20 press transition-colors"
                            style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)", color: "var(--ink-strong)" }}
                            aria-label="Decrease quantity"
                          >
                            &minus;
                          </button>
                          <span className="w-6 text-center text-base font-bold tabular-nums">
                            {qty}
                          </span>
                          <button
                            onClick={() => setQty(cfg.id, 1)}
                            disabled={qty >= max}
                            className="w-9 h-9 flex items-center justify-center text-lg font-bold disabled:opacity-20 press transition-colors"
                            style={{
                              background: "var(--gold-c)",
                              border: "2px solid var(--rule-strong-c)",
                              color: "var(--ink-strong)",
                            }}
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Selected quantity subtotal */}
                    {qty > 0 && (
                      <div className="mt-3 ml-5 pt-2.5 border-t border-border-subtle flex items-center justify-between">
                        <span className="text-xs text-txt-secondary">{qty} {qty === 1 ? "ticket" : "tickets"} selected</span>
                        <span className="text-sm font-bold" style={{ color: sectionColor }}>
                          {formatCents(cfg.price * qty)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Inline error for checkout failures */}
            {error && (
              <div className="p-3 c-frame" style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)" }}>
                <p className="text-coral text-sm">{error}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Sticky Bottom Bar ── */}
      {!loading && !checkout && configs.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40">
          <div className="max-w-[430px] mx-auto">
            <div
              className="border-t-[3px] px-5 py-4"
              style={{ background: "var(--paper)", borderColor: "var(--rule-strong-c)" }}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="c-kicker">
                    {ticketCount} {ticketCount === 1 ? "ticket" : "tickets"}
                  </p>
                  <p className="font-bold text-lg" style={{ color: "var(--ink-strong)" }}>
                    {formatCents(subtotal)}
                  </p>
                </div>
                <button
                  disabled={!hasSelection || checkingOut}
                  onClick={handleContinue}
                  className="c-btn c-btn-primary disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {checkingOut ? (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : null}
                  Continue
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M6 4l4 4-4 4" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
