/**
 * Booking confirmation email template.
 * Sent when a booking transitions from `pending` to `confirmed` (after
 * Stripe payment_intent.succeeded).
 */
import {
  SITE_NAME,
  SITE_DOMAIN,
  SUPPORT_EMAIL,
  EMAIL_FROM_NAME,
} from "@/lib/branding";
import { bookingEmailShell, formatBookingWhen, formatMoney } from "./shell";

export interface BookingConfirmationProps {
  customerName: string;
  businessName: string;
  serviceName: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  timezone?: string;
  staffName?: string | null;
  priceCents?: number | null;
  bookingId: string;
}

export function bookingConfirmationEmail(
  props: BookingConfirmationProps
): { subject: string; html: string; text: string } {
  const when = formatBookingWhen(props.date, props.startTime, props.endTime, props.timezone);
  const subject = `Booking confirmed — ${props.serviceName} at ${props.businessName}`;

  const ctaUrl = `${SITE_DOMAIN}/bookings/${props.bookingId}`;

  const priceLine = props.priceCents && props.priceCents > 0
    ? `<tr><td style="padding:4px 0;color:#999;font-size:13px;">Total</td><td style="padding:4px 0;color:#fff;font-size:13px;text-align:right;">${formatMoney(props.priceCents)}</td></tr>`
    : "";
  const staffLine = props.staffName
    ? `<tr><td style="padding:4px 0;color:#999;font-size:13px;">With</td><td style="padding:4px 0;color:#fff;font-size:13px;text-align:right;">${escapeHtml(props.staffName)}</td></tr>`
    : "";

  const html = bookingEmailShell({
    preheader: `Your booking with ${props.businessName} is confirmed.`,
    title: "You're booked.",
    lead: `Hi ${escapeHtml(props.customerName)} — your appointment with <strong>${escapeHtml(props.businessName)}</strong> is locked in.`,
    body: `
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td style="padding:4px 0;color:#999;font-size:13px;">Service</td><td style="padding:4px 0;color:#fff;font-size:13px;text-align:right;">${escapeHtml(props.serviceName)}</td></tr>
        <tr><td style="padding:4px 0;color:#999;font-size:13px;">When</td><td style="padding:4px 0;color:#fff;font-size:13px;text-align:right;">${escapeHtml(when)}</td></tr>
        ${staffLine}
        ${priceLine}
      </table>
      <p style="margin:16px 0 0;font-size:13px;color:#999;">Questions? Reply to this email or contact <a href="mailto:${SUPPORT_EMAIL}" style="color:#F2A900;">${SUPPORT_EMAIL}</a>.</p>
    `,
    ctaText: "View booking",
    ctaUrl,
  });

  const text = [
    `Your booking with ${props.businessName} is confirmed.`,
    ``,
    `Service: ${props.serviceName}`,
    `When: ${when}`,
    props.staffName ? `With: ${props.staffName}` : null,
    props.priceCents ? `Total: ${formatMoney(props.priceCents)}` : null,
    ``,
    `View: ${ctaUrl}`,
    ``,
    `— ${EMAIL_FROM_NAME} (${SITE_NAME})`,
    `Need help? ${SUPPORT_EMAIL}`,
  ]
    .filter(Boolean)
    .join("\n");

  return { subject, html, text };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
