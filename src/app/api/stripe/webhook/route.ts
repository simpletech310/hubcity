import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateTicketCode } from "@/lib/tickets";
import { bookingConfirmationEmail } from "@/lib/emails/booking/confirmation";
import { orderConfirmationEmail } from "@/lib/emails/orders/confirmation";
import { sendTransactionalEmail } from "@/lib/email";

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
        } else if (paymentIntent.metadata?.booking_id) {
          // Booking flow — confirm booking after payment
          const bookingId = paymentIntent.metadata.booking_id;
          const { data: booking } = await supabase
            .from("bookings")
            .select(
              "id, customer_id, business_id, status, service_name, date, start_time, end_time, staff_name, price"
            )
            .eq("id", bookingId)
            .single();

          if (booking && booking.status === "pending") {
            await supabase
              .from("bookings")
              .update({ status: "confirmed" })
              .eq("id", booking.id);

            // Append audit log (fire-and-forget).
            supabase
              .from("booking_audit_log")
              .insert({
                booking_id: booking.id,
                actor_id: booking.customer_id,
                action: "confirmed",
                metadata: {
                  stripe_payment_intent_id: paymentIntent.id,
                  amount: paymentIntent.amount,
                },
              })
              .then(({ error: auditErr }) => {
                if (auditErr)
                  console.error("Booking audit log insert error (non-fatal):", auditErr);
              });

            // Send confirmation email (fire-and-forget, non-blocking).
            (async () => {
              try {
                const { data: profile } = await supabase
                  .from("profiles")
                  .select("display_name")
                  .eq("id", booking.customer_id)
                  .single();
                const { data: authUser } = await supabase.auth.admin.getUserById(
                  booking.customer_id
                );
                const customerEmail = authUser?.user?.email ?? null;
                const { data: biz } = await supabase
                  .from("businesses")
                  .select("name")
                  .eq("id", booking.business_id)
                  .single();
                // Look up timezone from the service (best-effort name match).
                let tz: string | undefined = undefined;
                const { data: svc } = await supabase
                  .from("services")
                  .select("timezone")
                  .eq("business_id", booking.business_id)
                  .eq("name", booking.service_name)
                  .maybeSingle();
                if (svc?.timezone) tz = svc.timezone;

                if (customerEmail) {
                  const { subject, html, text } = bookingConfirmationEmail({
                    customerName: profile?.display_name || "there",
                    businessName: biz?.name || "your provider",
                    serviceName: booking.service_name,
                    date: booking.date,
                    startTime: booking.start_time,
                    endTime: booking.end_time,
                    timezone: tz,
                    staffName: booking.staff_name ?? null,
                    priceCents: booking.price ?? null,
                    bookingId: booking.id,
                  });
                  await sendTransactionalEmail({
                    to: customerEmail,
                    subject,
                    html,
                    text,
                  });
                }
              } catch (emailErr) {
                console.error("Booking confirmation email error (non-fatal):", emailErr);
              }
            })();

            // Update business_customers tracking (fire-and-forget)
            try {
              const { data: existing } = await supabase
                .from("business_customers")
                .select("id, total_bookings, total_spent")
                .eq("business_id", booking.business_id)
                .eq("customer_id", booking.customer_id)
                .single();

              if (existing) {
                await supabase
                  .from("business_customers")
                  .update({
                    total_bookings: existing.total_bookings + 1,
                    total_spent: existing.total_spent + (paymentIntent.amount || 0),
                    last_visit: new Date().toISOString(),
                  })
                  .eq("id", existing.id);
              } else {
                await supabase.from("business_customers").insert({
                  business_id: booking.business_id,
                  customer_id: booking.customer_id,
                  total_orders: 0,
                  total_bookings: 1,
                  total_spent: paymentIntent.amount || 0,
                  first_visit: new Date().toISOString(),
                  last_visit: new Date().toISOString(),
                  tags: [],
                });
              }
            } catch (custErr) {
              console.error("Business customer update error (non-fatal):", custErr);
            }

            // Notify business owner (fire-and-forget)
            try {
              const { data: biz } = await supabase
                .from("businesses")
                .select("owner_id")
                .eq("id", booking.business_id)
                .single();

              if (biz?.owner_id) {
                await supabase.from("notifications").insert({
                  user_id: biz.owner_id,
                  type: "booking",
                  title: "Booking payment confirmed",
                  body: `Payment received for ${paymentIntent.metadata.service_name || "booking"}`,
                  link_type: "booking",
                  link_id: booking.id,
                });
              }
            } catch (notifErr) {
              console.error("Booking notification error (non-fatal):", notifErr);
            }
          }
        } else {
          // Regular order flow — confirm, pull receipt URL, send email,
          // append audit log, and earn loyalty points.
          const { data: order } = await supabase
            .from("orders")
            .select(
              "id, order_number, customer_id, business_id, total, type, status"
            )
            .eq("stripe_payment_intent_id", paymentIntent.id)
            .single();

          if (order) {
            // Pull Stripe-hosted receipt URL from the latest charge (no PDF
            // generation on our side). Expanding charges makes the URL
            // available directly on the webhook payload object.
            let receiptUrl: string | null = null;
            try {
              const stripe = getStripe();
              const full = await stripe.paymentIntents.retrieve(paymentIntent.id, {
                expand: ["latest_charge"],
              });
              const latest = full.latest_charge as Stripe.Charge | null;
              receiptUrl = latest?.receipt_url ?? null;
            } catch (recErr) {
              console.error("Receipt URL lookup error (non-fatal):", recErr);
            }

            await supabase
              .from("orders")
              .update({
                status: "confirmed",
                store_accepted_at: new Date().toISOString(),
                ...(receiptUrl ? { receipt_url: receiptUrl } : {}),
              })
              .eq("id", order.id);

            // Append audit log (fire-and-forget).
            supabase
              .from("order_audit_log")
              .insert({
                order_id: order.id,
                actor_id: order.customer_id,
                action: "confirmed",
                metadata: {
                  stripe_payment_intent_id: paymentIntent.id,
                  amount: paymentIntent.amount,
                  receipt_url: receiptUrl,
                },
              })
              .then(({ error: auditErr }) => {
                if (auditErr)
                  console.error("Order audit log insert error (non-fatal):", auditErr);
              });

            // Send confirmation email (fire-and-forget).
            (async () => {
              try {
                const { data: profile } = await supabase
                  .from("profiles")
                  .select("display_name")
                  .eq("id", order.customer_id)
                  .single();
                const { data: authUser } = await supabase.auth.admin.getUserById(
                  order.customer_id
                );
                const customerEmail = authUser?.user?.email ?? null;
                const { data: biz } = await supabase
                  .from("businesses")
                  .select("name")
                  .eq("id", order.business_id)
                  .single();
                const { data: items } = await supabase
                  .from("order_items")
                  .select("name, quantity, price")
                  .eq("order_id", order.id);

                if (customerEmail) {
                  const { subject, html, text } = orderConfirmationEmail({
                    customerName: profile?.display_name || "there",
                    businessName: biz?.name || "your vendor",
                    orderNumber: order.order_number,
                    orderId: order.id,
                    totalCents: order.total,
                    type: order.type === "delivery" ? "delivery" : "pickup",
                    items: (items || []).map((it) => ({
                      name: it.name,
                      quantity: it.quantity,
                      price: it.price,
                    })),
                    receiptUrl,
                  });
                  await sendTransactionalEmail({
                    to: customerEmail,
                    subject,
                    html,
                    text,
                  });
                }
              } catch (emailErr) {
                console.error("Order confirmation email error (non-fatal):", emailErr);
              }
            })();

            // Award loyalty points (fire-and-forget)
            try {
              const { data: config } = await supabase
                .from("loyalty_config")
                .select("points_per_dollar, max_daily_earn")
                .eq("id", 1)
                .single();

              const pointsPerDollar = config?.points_per_dollar || 10;
              const maxDailyEarn = config?.max_daily_earn || 500;
              const orderDollars = order.total / 100;
              let pointsToEarn = Math.floor(orderDollars * pointsPerDollar);

              // Check daily cap
              const todayStart = new Date();
              todayStart.setHours(0, 0, 0, 0);

              const { data: todayTx } = await supabase
                .from("loyalty_transactions")
                .select("points")
                .eq("user_id", order.customer_id)
                .eq("type", "earn")
                .gte("created_at", todayStart.toISOString());

              const earnedToday = (todayTx || []).reduce((s, t) => s + t.points, 0);
              const remaining = Math.max(0, maxDailyEarn - earnedToday);
              pointsToEarn = Math.min(pointsToEarn, remaining);

              if (pointsToEarn > 0) {
                // Insert transaction
                await supabase.from("loyalty_transactions").insert({
                  user_id: order.customer_id,
                  business_id: order.business_id,
                  order_id: order.id,
                  type: "earn",
                  points: pointsToEarn,
                  description: `Earned from order`,
                });

                // Upsert balance
                const { data: existing } = await supabase
                  .from("loyalty_balances")
                  .select("points, lifetime_points")
                  .eq("user_id", order.customer_id)
                  .single();

                if (existing) {
                  await supabase
                    .from("loyalty_balances")
                    .update({
                      points: existing.points + pointsToEarn,
                      lifetime_points: existing.lifetime_points + pointsToEarn,
                      updated_at: new Date().toISOString(),
                    })
                    .eq("user_id", order.customer_id);
                } else {
                  await supabase.from("loyalty_balances").insert({
                    user_id: order.customer_id,
                    points: pointsToEarn,
                    lifetime_points: pointsToEarn,
                  });
                }

                // Update order with points earned
                await supabase
                  .from("orders")
                  .update({ loyalty_points_earned: pointsToEarn })
                  .eq("id", order.id);
              }
            } catch (loyaltyErr) {
              console.error("Loyalty points error (non-fatal):", loyaltyErr);
            }
          } else {
            // Fallback: try by payment intent ID
            const { error } = await supabase
              .from("orders")
              .update({ status: "confirmed" })
              .eq("stripe_payment_intent_id", paymentIntent.id);

            if (error) {
              console.error("Failed to update order status:", error);
            }
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
