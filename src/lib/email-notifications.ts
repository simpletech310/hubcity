import {
  sendEmail,
  sendTransactionalEmail,
  notificationEmailTemplate,
} from "@/lib/email";
import { orderConfirmationEmail } from "@/lib/emails/orders/confirmation";
import { bookingConfirmationEmail } from "@/lib/emails/booking/confirmation";
import { createAdminClient } from "@/lib/supabase/admin";

const BASE_URL = "https://knect.app";

/**
 * Welcome email when a user signs up
 */
export async function sendWelcomeEmail(
  email: string,
  displayName: string
): Promise<void> {
  try {
    const html = notificationEmailTemplate(
      `Welcome to Knect, ${displayName}!`,
      "You're now part of your city's digital town hall. Explore local businesses, stay updated on city events, report issues in your neighborhood, and connect with your community.",
      `${BASE_URL}/feed`,
      "Explore Knect"
    );

    await sendEmail({
      to: email,
      subject: `Welcome to Knect, ${displayName}!`,
      html,
    });
  } catch (error) {
    console.error("[EmailNotification] Welcome email failed:", error);
  }
}

/**
 * Broadcast notification email (system or district announcements)
 */
export async function sendBroadcastEmail(
  email: string,
  title: string,
  body: string
): Promise<void> {
  try {
    const html = notificationEmailTemplate(
      title,
      body,
      `${BASE_URL}/notifications`,
      "View Notifications"
    );

    await sendEmail({
      to: email,
      subject: `Knect: ${title}`,
      html,
    });
  } catch (error) {
    console.error("[EmailNotification] Broadcast email failed:", error);
  }
}

/**
 * Issue status update notification
 */
export async function sendIssueStatusEmail(
  email: string,
  issueTitle: string,
  newStatus: string,
  issueId: string
): Promise<void> {
  try {
    const statusLabels: Record<string, string> = {
      reported: "Reported",
      acknowledged: "Acknowledged",
      in_progress: "In Progress",
      resolved: "Resolved",
      closed: "Closed",
    };

    const statusLabel = statusLabels[newStatus] || newStatus;

    const html = notificationEmailTemplate(
      `Issue Update: ${statusLabel}`,
      `Your reported issue "${issueTitle}" has been updated to "${statusLabel}". Thank you for helping improve our community.`,
      `${BASE_URL}/city-hall/issues/${issueId}`,
      "View Issue"
    );

    await sendEmail({
      to: email,
      subject: `Issue Update: ${issueTitle} — ${statusLabel}`,
      html,
    });
  } catch (error) {
    console.error("[EmailNotification] Issue status email failed:", error);
  }
}

/**
 * Event reminder email (sent 24 hours before an event)
 */
export async function sendEventReminderEmail(
  email: string,
  eventTitle: string,
  eventDate: string,
  eventId: string
): Promise<void> {
  try {
    const html = notificationEmailTemplate(
      `Reminder: ${eventTitle}`,
      `Don't forget — "${eventTitle}" is happening tomorrow, ${eventDate}. We hope to see you there!`,
      `${BASE_URL}/events/${eventId}`,
      "View Event Details"
    );

    await sendEmail({
      to: email,
      subject: `Reminder: ${eventTitle} is tomorrow!`,
      html,
    });
  } catch (error) {
    console.error("[EmailNotification] Event reminder email failed:", error);
  }
}

/**
 * Order status update notification
 */
export async function sendOrderStatusEmail(
  email: string,
  orderNumber: string,
  newStatus: string,
  orderId: string
): Promise<void> {
  try {
    const statusLabels: Record<string, string> = {
      pending: "Pending",
      confirmed: "Confirmed",
      preparing: "Being Prepared",
      ready: "Ready for Pickup",
      completed: "Completed",
      cancelled: "Cancelled",
    };

    const statusLabel = statusLabels[newStatus] || newStatus;

    const html = notificationEmailTemplate(
      `Order ${orderNumber}: ${statusLabel}`,
      `Your order #${orderNumber} status has been updated to "${statusLabel}". Check your order details for more information.`,
      `${BASE_URL}/orders/${orderId}`,
      "View Order"
    );

    await sendEmail({
      to: email,
      subject: `Order #${orderNumber} — ${statusLabel}`,
      html,
    });
  } catch (error) {
    console.error("[EmailNotification] Order status email failed:", error);
  }
}

/**
 * Customer order receipt — itemized + vendor info + ETA. Idempotent: stamps
 * `orders.receipt_sent_at` after sending so we never double-send. Safe to
 * call from the Stripe webhook, the manual confirm route, or a backfill job.
 *
 * Returns true if a receipt was sent (or was already sent), false on failure.
 */
export async function sendOrderReceiptEmail(orderId: string): Promise<boolean> {
  try {
    const supabase = createAdminClient();

    const { data: order } = await supabase
      .from("orders")
      .select(
        "id, order_number, customer_id, business_id, total, subtotal, tax, tip, platform_fee, type, status, delivery_address, estimated_ready_at, estimated_delivery_at, receipt_url, receipt_sent_at"
      )
      .eq("id", orderId)
      .single();

    if (!order) {
      console.warn(`[OrderReceipt] Order not found: ${orderId}`);
      return false;
    }

    if (order.receipt_sent_at) {
      // Already sent — short-circuit (this is the idempotency guard).
      return true;
    }

    const [{ data: profile }, { data: authUser }, { data: biz }, { data: items }] = await Promise.all([
      supabase
        .from("profiles")
        .select("display_name")
        .eq("id", order.customer_id)
        .single(),
      supabase.auth.admin.getUserById(order.customer_id),
      supabase
        .from("businesses")
        .select("name, address, phone")
        .eq("id", order.business_id)
        .single(),
      supabase
        .from("order_items")
        .select("name, quantity, price")
        .eq("order_id", order.id),
    ]);

    const customerEmail = authUser?.user?.email ?? null;
    if (!customerEmail) {
      console.warn(`[OrderReceipt] No email for customer ${order.customer_id}`);
      return false;
    }

    const { subject, html, text } = orderConfirmationEmail({
      customerName: profile?.display_name || "there",
      businessName: biz?.name || "your vendor",
      businessAddress: biz?.address ?? null,
      businessPhone: biz?.phone ?? null,
      orderNumber: order.order_number,
      orderId: order.id,
      subtotalCents: order.subtotal,
      taxCents: order.tax,
      tipCents: order.tip,
      platformFeeCents: order.platform_fee,
      totalCents: order.total,
      type: order.type === "delivery" ? "delivery" : "pickup",
      estimatedReadyAt: order.estimated_ready_at,
      estimatedDeliveryAt: order.estimated_delivery_at,
      deliveryAddress: order.delivery_address,
      items: (items || []).map((it) => ({
        name: it.name,
        quantity: it.quantity,
        price: it.price,
      })),
      receiptUrl: order.receipt_url,
    });

    const sent = await sendTransactionalEmail({
      to: customerEmail,
      subject,
      html,
      text,
    });

    if (sent) {
      // Stamp idempotency marker. Best-effort: if this update fails the
      // user just gets a duplicate next time the webhook fires, which is
      // recoverable. Don't fail the call over it.
      const { error: updateErr } = await supabase
        .from("orders")
        .update({ receipt_sent_at: new Date().toISOString() })
        .eq("id", order.id)
        .is("receipt_sent_at", null);
      if (updateErr) {
        console.error("[OrderReceipt] Failed to stamp receipt_sent_at:", updateErr);
      }
    }

    return sent;
  } catch (err) {
    console.error("[OrderReceipt] Send failed:", err);
    return false;
  }
}

/**
 * Customer booking receipt. Idempotent via `bookings.receipt_sent_at`.
 */
export async function sendBookingReceiptEmail(bookingId: string): Promise<boolean> {
  try {
    const supabase = createAdminClient();

    const { data: booking } = await supabase
      .from("bookings")
      .select(
        "id, customer_id, business_id, status, service_name, date, start_time, end_time, staff_name, price, receipt_sent_at"
      )
      .eq("id", bookingId)
      .single();

    if (!booking) {
      console.warn(`[BookingReceipt] Booking not found: ${bookingId}`);
      return false;
    }

    if (booking.receipt_sent_at) {
      return true;
    }

    const [{ data: profile }, { data: authUser }, { data: biz }, { data: svc }] = await Promise.all([
      supabase
        .from("profiles")
        .select("display_name")
        .eq("id", booking.customer_id)
        .single(),
      supabase.auth.admin.getUserById(booking.customer_id),
      supabase
        .from("businesses")
        .select("name, address, phone")
        .eq("id", booking.business_id)
        .single(),
      supabase
        .from("services")
        .select("timezone")
        .eq("business_id", booking.business_id)
        .eq("name", booking.service_name)
        .maybeSingle(),
    ]);

    const customerEmail = authUser?.user?.email ?? null;
    if (!customerEmail) {
      console.warn(`[BookingReceipt] No email for customer ${booking.customer_id}`);
      return false;
    }

    const { subject, html, text } = bookingConfirmationEmail({
      customerName: profile?.display_name || "there",
      businessName: biz?.name || "your provider",
      businessAddress: biz?.address ?? null,
      businessPhone: biz?.phone ?? null,
      serviceName: booking.service_name,
      date: booking.date,
      startTime: booking.start_time,
      endTime: booking.end_time,
      timezone: svc?.timezone ?? undefined,
      staffName: booking.staff_name ?? null,
      priceCents: booking.price ?? null,
      bookingId: booking.id,
    });

    const sent = await sendTransactionalEmail({
      to: customerEmail,
      subject,
      html,
      text,
    });

    if (sent) {
      const { error: updateErr } = await supabase
        .from("bookings")
        .update({ receipt_sent_at: new Date().toISOString() })
        .eq("id", booking.id)
        .is("receipt_sent_at", null);
      if (updateErr) {
        console.error("[BookingReceipt] Failed to stamp receipt_sent_at:", updateErr);
      }
    }

    return sent;
  } catch (err) {
    console.error("[BookingReceipt] Send failed:", err);
    return false;
  }
}

/**
 * Badge earned notification
 */
export async function sendBadgeEarnedEmail(
  email: string,
  badgeName: string,
  badgeIcon: string
): Promise<void> {
  try {
    const html = notificationEmailTemplate(
      `${badgeIcon} Badge Earned: ${badgeName}`,
      `Congratulations! You've earned the "${badgeName}" badge on Knect. Keep engaging with your community to unlock more achievements!`,
      `${BASE_URL}/profile`,
      "View Your Badges"
    );

    await sendEmail({
      to: email,
      subject: `You earned the ${badgeName} badge!`,
      html,
    });
  } catch (error) {
    console.error("[EmailNotification] Badge earned email failed:", error);
  }
}
