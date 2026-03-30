import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { generateTicketCode } from "@/lib/tickets";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import type { TicketOrder, TicketOrderItem, Event } from "@/types/database";

interface ConfirmationPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ order_id?: string; payment_intent?: string }>;
}

export default async function TicketConfirmationPage({
  params,
  searchParams,
}: ConfirmationPageProps) {
  const { id: eventId } = await params;
  const { order_id, payment_intent } = await searchParams;

  if (!order_id) {
    return (
      <div className="animate-fade-in px-5 pt-12 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-coral/15 flex items-center justify-center mb-5">
          <svg
            className="w-8 h-8 text-coral"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <h1 className="font-heading text-xl font-bold mb-2">Payment Failed</h1>
        <p className="text-txt-secondary text-sm mb-8 max-w-xs">
          Your payment was not completed. No charges have been made.
        </p>
        <Link href={`/events/${eventId}/tickets`}>
          <Button size="lg">Try Again</Button>
        </Link>
        <Link href="/events" className="mt-4 text-sm text-txt-secondary press">
          Back to Events
        </Link>
      </div>
    );
  }

  // Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch the ticket order
  const { data: orderRaw } = await supabase
    .from("ticket_orders")
    .select(
      `
      *,
      event:events(id, title, start_date, start_time, location_name),
      items:ticket_order_items(id, quantity, section_name)
    `
    )
    .eq("id", order_id)
    .eq("customer_id", user.id)
    .single();

  if (!orderRaw) {
    return (
      <div className="animate-fade-in px-5 pt-12 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-coral/15 flex items-center justify-center mb-5">
          <svg
            className="w-8 h-8 text-coral"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            />
          </svg>
        </div>
        <h1 className="font-heading text-xl font-bold mb-2">Order Not Found</h1>
        <p className="text-txt-secondary text-sm mb-8 max-w-xs">
          We could not find this order. Please check your email or contact support.
        </p>
        <Link href="/events">
          <Button size="lg" variant="secondary">Back to Events</Button>
        </Link>
      </div>
    );
  }

  const order = orderRaw as TicketOrder & {
    event: Pick<Event, "id" | "title" | "start_date" | "start_time" | "location_name"> | null;
    items: (TicketOrderItem & { section_name: string })[];
  };

  let confirmError = false;

  // If status is already confirmed, just show success (idempotent)
  if (order.status !== "confirmed") {
    if (order.status === "pending") {
      try {
        // Verify Stripe PaymentIntent
        const stripe = getStripe();
        const piId = payment_intent ?? order.stripe_payment_intent_id;

        if (!piId) {
          confirmError = true;
        } else {
          const pi = await stripe.paymentIntents.retrieve(piId);

          if (pi.status === "succeeded") {
            // Update order to confirmed
            await supabase
              .from("ticket_orders")
              .update({ status: "confirmed", updated_at: new Date().toISOString() })
              .eq("id", order_id);

            // Generate tickets for each order item
            for (const item of order.items ?? []) {
              const ticketsToInsert = [];
              for (let i = 0; i < item.quantity; i++) {
                ticketsToInsert.push({
                  order_item_id: item.id,
                  order_id: order.id,
                  event_id: order.event_id,
                  ticket_code: generateTicketCode(),
                });
              }
              if (ticketsToInsert.length > 0) {
                await supabase.from("tickets").insert(ticketsToInsert);
              }
            }

            order.status = "confirmed";
          } else {
            confirmError = true;
          }
        }
      } catch {
        confirmError = true;
      }
    } else {
      // Order is cancelled or refunded
      confirmError = true;
    }
  }

  if (confirmError) {
    return (
      <div className="animate-fade-in px-5 pt-12 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-coral/15 flex items-center justify-center mb-5">
          <svg
            className="w-8 h-8 text-coral"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            />
          </svg>
        </div>
        <h1 className="font-heading text-xl font-bold mb-2">Something Went Wrong</h1>
        <p className="text-txt-secondary text-sm mb-8 max-w-xs">
          Your payment may have succeeded, but we could not confirm your order.
          Please check your email or contact support.
        </p>
        <Link href="/events">
          <Button size="lg" variant="secondary">Back to Events</Button>
        </Link>
      </div>
    );
  }

  // Compute display values
  const event = order.event;
  const ticketCount = (order.items ?? []).reduce(
    (sum, item) => sum + (item.quantity ?? 0),
    0
  );

  return (
    <div className="animate-fade-in px-5 pt-12 pb-12 flex flex-col items-center text-center">
      {/* Animated success checkmark */}
      <div className="w-20 h-20 rounded-full bg-emerald/15 flex items-center justify-center mb-6 relative">
        <svg
          className="w-10 h-10 text-emerald animate-[checkDraw_0.5s_ease-out_0.2s_both]"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
            style={{
              strokeDasharray: 30,
              strokeDashoffset: 0,
              animation: "checkDraw 0.5s ease-out 0.2s both",
            }}
          />
        </svg>
        {/* Pulse ring */}
        <div className="absolute inset-0 rounded-full bg-emerald/10 animate-ping" style={{ animationDuration: "1.5s", animationIterationCount: "2" }} />
      </div>

      <style>{`
        @keyframes checkDraw {
          from { stroke-dashoffset: 30; }
          to { stroke-dashoffset: 0; }
        }
      `}</style>

      <h1 className="font-heading text-2xl font-bold mb-2">Tickets Confirmed!</h1>
      <p className="text-txt-secondary text-sm mb-6 max-w-xs">
        You&apos;re heading to {event?.title || "the event"}. Check your email for a receipt.
      </p>

      {/* Order details card */}
      <Card className="w-full mb-8 text-left">
        <div className="space-y-3">
          {/* Order number */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-txt-secondary uppercase tracking-wide font-semibold">
              Order Number
            </p>
            <p className="text-sm font-mono font-bold text-gold">
              {order.order_number}
            </p>
          </div>

          {/* Event name */}
          {event?.title && (
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs text-txt-secondary uppercase tracking-wide font-semibold shrink-0">
                Event
              </p>
              <p className="text-sm font-semibold text-right">{event.title}</p>
            </div>
          )}

          {/* Date */}
          {event?.start_date && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-txt-secondary uppercase tracking-wide font-semibold">
                Date
              </p>
              <p className="text-sm">
                {new Date(event.start_date).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
                {event.start_time ? ` at ${event.start_time.slice(0, 5)}` : ""}
              </p>
            </div>
          )}

          {/* Ticket count */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-txt-secondary uppercase tracking-wide font-semibold">
              Tickets
            </p>
            <p className="text-sm font-semibold">
              {ticketCount} ticket{ticketCount !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="pt-2 border-t border-border-subtle">
            <p className="text-xs text-txt-secondary text-center">
              Show your ticket code at the door for entry.
            </p>
          </div>
        </div>
      </Card>

      <div className="w-full space-y-3">
        <Link href={`/tickets/${order_id}`} className="block">
          <Button fullWidth size="lg">View My Tickets</Button>
        </Link>
        <Link href="/events" className="block">
          <Button fullWidth size="lg" variant="secondary">Back to Events</Button>
        </Link>
      </div>
    </div>
  );
}
