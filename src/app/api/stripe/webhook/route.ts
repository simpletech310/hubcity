import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateTicketCode } from "@/lib/tickets";
import {
  sendOrderReceiptEmail,
  sendBookingReceiptEmail,
} from "@/lib/email-notifications";
import { calculateCreatorPlatformFee } from "@/lib/creator-access";
import {
  notifyCreatorOfNewSubscriber,
  notifyCreatorOfPpvPurchase,
  notifySubscriberOfRenewal,
} from "@/lib/creator-emails";

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
        // Update both possible Connect-account tables; whichever row owns this
        // stripe_account_id will get the new flags. Saves us from sniffing
        // metadata to figure out persona.
        const updates = {
          charges_enabled: account.charges_enabled ?? false,
          payouts_enabled: account.payouts_enabled ?? false,
          onboarding_complete: account.details_submitted ?? false,
        };

        const [{ error: bizErr }, { error: creatorErr }] = await Promise.all([
          supabase
            .from("stripe_accounts")
            .update(updates)
            .eq("stripe_account_id", account.id),
          supabase
            .from("creator_stripe_accounts")
            .update(updates)
            .eq("stripe_account_id", account.id),
        ]);

        if (bizErr) console.error("Failed to update stripe_accounts:", bizErr);
        if (creatorErr)
          console.error("Failed to update creator_stripe_accounts:", creatorErr);
        break;
      }

      // ── Creator monetization: subscriptions & PPV ──────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const resourceType = session.metadata?.resource_type;

        if (resourceType === "channel_subscription" && session.subscription) {
          // First-time subscription. Subsequent renewals come through
          // `customer.subscription.updated` + `invoice.paid`.
          const channelId = session.metadata?.channel_id;
          const buyerId = session.metadata?.buyer_id;
          const creatorId = session.metadata?.creator_id;

          if (channelId && buyerId) {
            const subId =
              typeof session.subscription === "string"
                ? session.subscription
                : session.subscription.id;
            const customerId =
              typeof session.customer === "string"
                ? session.customer
                : session.customer?.id ?? null;

            // Pull the live subscription so we have the period end + price.
            let amountCents: number | null = null;
            let periodEnd: string | null = null;
            let currency = "usd";
            try {
              const stripe = getStripe();
              const sub = await stripe.subscriptions.retrieve(subId);
              const item = sub.items.data[0];
              amountCents = item?.price.unit_amount ?? null;
              currency = item?.price.currency ?? "usd";
              const subWithPeriod = sub as Stripe.Subscription & {
                current_period_end?: number;
              };
              periodEnd = subWithPeriod.current_period_end
                ? new Date(subWithPeriod.current_period_end * 1000).toISOString()
                : null;
            } catch (e) {
              console.error("Sub retrieve failed (non-fatal):", e);
            }

            await supabase.from("channel_subscriptions").upsert(
              {
                user_id: buyerId,
                channel_id: channelId,
                status: "active",
                stripe_subscription_id: subId,
                stripe_customer_id: customerId,
                current_period_end: periodEnd,
                amount_cents: amountCents,
                currency,
              },
              { onConflict: "user_id,channel_id" }
            );

            // Record creator earnings.
            if (creatorId && amountCents) {
              const fee = calculateCreatorPlatformFee(amountCents);
              await supabase.from("creator_earnings").insert({
                creator_id: creatorId,
                source: "subscription",
                amount_cents: amountCents - fee,
                gross_cents: amountCents,
                platform_fee_cents: fee,
                description: "New channel subscription",
                resource_type: "channel_subscription",
                resource_id: channelId,
                status: "pending",
              });
            }

            // Notify creator + subscriber (fire-and-forget).
            notifyCreatorOfNewSubscriber({
              creatorId: creatorId ?? "",
              channelId,
              subscriberId: buyerId,
              amountCents: amountCents ?? 0,
            }).catch((e) =>
              console.error("Creator new-sub email error (non-fatal):", e)
            );
            notifySubscriberOfRenewal({
              subscriberId: buyerId,
              channelId,
              amountCents: amountCents ?? 0,
              isFirst: true,
            }).catch((e) =>
              console.error("Subscriber confirmation email error (non-fatal):", e)
            );

            // In-app notification for the creator.
            if (creatorId) {
              await supabase.from("notifications").insert({
                user_id: creatorId,
                type: "creator_subscription",
                title: "New subscriber!",
                body: "Someone just subscribed to your channel.",
                link_type: "channel",
                link_id: channelId,
              });
            }
          }
        }

        if (resourceType === "video_purchase" && session.payment_intent) {
          const videoId = session.metadata?.video_id;
          const buyerId = session.metadata?.buyer_id;
          const creatorId = session.metadata?.creator_id;
          const channelId = session.metadata?.channel_id;
          const piId =
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : session.payment_intent.id;
          const amountCents = session.amount_total ?? 0;

          if (videoId && buyerId) {
            await supabase
              .from("video_purchases")
              .upsert(
                {
                  user_id: buyerId,
                  video_id: videoId,
                  stripe_payment_intent_id: piId,
                  amount_cents: amountCents,
                },
                { onConflict: "user_id,video_id" }
              );

            if (creatorId && amountCents) {
              const fee = calculateCreatorPlatformFee(amountCents);
              await supabase.from("creator_earnings").insert({
                creator_id: creatorId,
                source: "ppv",
                amount_cents: amountCents - fee,
                gross_cents: amountCents,
                platform_fee_cents: fee,
                description: "Pay-per-view purchase",
                resource_type: "video_purchase",
                resource_id: videoId,
                stripe_payment_intent_id: piId,
                status: "pending",
              });

              notifyCreatorOfPpvPurchase({
                creatorId,
                videoId,
                buyerId,
                amountCents,
              }).catch((e) =>
                console.error("Creator PPV email error (non-fatal):", e)
              );

              await supabase.from("notifications").insert({
                user_id: creatorId,
                type: "creator_ppv",
                title: "Video purchased",
                body: "Someone just bought one of your videos.",
                link_type: "video",
                link_id: videoId,
              });
            }
          }

          // Avoid unused-warning when channelId is metadata-only.
          if (channelId) void channelId;
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const subWithPeriod = sub as Stripe.Subscription & {
          current_period_end?: number;
        };
        const periodEnd = subWithPeriod.current_period_end
          ? new Date(subWithPeriod.current_period_end * 1000).toISOString()
          : null;

        await supabase
          .from("channel_subscriptions")
          .update({
            status: sub.status,
            current_period_end: periodEnd,
            cancel_at_period_end: sub.cancel_at_period_end ?? false,
          })
          .eq("stripe_subscription_id", sub.id);
        break;
      }

      case "invoice.paid": {
        // Renewal payments — credit the creator their cut and notify the
        // subscriber. First-payment is handled via checkout.session.completed.
        const invoice = event.data.object as Stripe.Invoice & {
          subscription?: string | Stripe.Subscription | null;
        };
        const subId =
          typeof invoice.subscription === "string"
            ? invoice.subscription
            : invoice.subscription?.id ?? null;
        if (!subId || invoice.billing_reason !== "subscription_cycle") break;

        const { data: row } = await supabase
          .from("channel_subscriptions")
          .select("user_id, channel_id, channels:channels(owner_id)")
          .eq("stripe_subscription_id", subId)
          .maybeSingle();

        const channelOwner = Array.isArray(row?.channels)
          ? row?.channels[0]?.owner_id
          : (row?.channels as unknown as { owner_id?: string } | null)?.owner_id;

        if (row?.user_id && channelOwner && invoice.amount_paid) {
          const fee = calculateCreatorPlatformFee(invoice.amount_paid);
          await supabase.from("creator_earnings").insert({
            creator_id: channelOwner,
            source: "subscription",
            amount_cents: invoice.amount_paid - fee,
            gross_cents: invoice.amount_paid,
            platform_fee_cents: fee,
            description: "Subscription renewal",
            resource_type: "channel_subscription",
            resource_id: row.channel_id,
            status: "pending",
          });

          notifySubscriberOfRenewal({
            subscriberId: row.user_id,
            channelId: row.channel_id,
            amountCents: invoice.amount_paid,
            isFirst: false,
          }).catch((e) =>
            console.error("Renewal email error (non-fatal):", e)
          );
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

            // Send confirmation email (fire-and-forget, idempotent).
            sendBookingReceiptEmail(booking.id).catch((emailErr) => {
              console.error("Booking confirmation email error (non-fatal):", emailErr);
            });

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

            // Send confirmation email (fire-and-forget, idempotent).
            sendOrderReceiptEmail(order.id).catch((emailErr) => {
              console.error("Order confirmation email error (non-fatal):", emailErr);
            });

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
