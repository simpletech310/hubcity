import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateTicketCode } from "@/lib/tickets";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook signature verification failed:", message);
    return NextResponse.json(
      { error: `Webhook Error: ${message}` },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  try {
    switch (event.type) {
      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        const { error } = await supabase
          .from("stripe_accounts")
          .update({
            charges_enabled: account.charges_enabled ?? false,
            payouts_enabled: account.payouts_enabled ?? false,
            onboarding_complete: account.details_submitted ?? false,
          })
          .eq("stripe_account_id", account.id);

        if (error) {
          console.error("Failed to update stripe account:", error);
        }
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const ticketOrderId = paymentIntent.metadata?.ticket_order_id;

        if (ticketOrderId) {
          // Ticket order — confirm and generate tickets
          const { data: ticketOrder } = await supabase
            .from("ticket_orders")
            .select("*, items:ticket_order_items(*)")
            .eq("id", ticketOrderId)
            .single();

          if (ticketOrder && ticketOrder.status === "pending") {
            await supabase
              .from("ticket_orders")
              .update({ status: "confirmed" })
              .eq("id", ticketOrderId);

            // Generate individual tickets
            const tickets: {
              order_item_id: string;
              order_id: string;
              event_id: string;
              ticket_code: string;
            }[] = [];
            for (const item of ticketOrder.items || []) {
              for (let i = 0; i < item.quantity; i++) {
                tickets.push({
                  order_item_id: item.id,
                  order_id: ticketOrderId,
                  event_id: ticketOrder.event_id,
                  ticket_code: generateTicketCode(),
                });
              }
            }
            if (tickets.length > 0) {
              await supabase.from("tickets").insert(tickets);
            }
          }
        } else {
          // Existing food order flow
          const { error } = await supabase
            .from("orders")
            .update({ status: "confirmed" })
            .eq("stripe_payment_intent_id", paymentIntent.id);

          if (error) {
            console.error("Failed to update order status:", error);
          }
        }
        break;
      }

      default:
        // Unhandled event type
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
