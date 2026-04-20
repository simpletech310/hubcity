/**
 * Booking confirmation / customer receipt email.
 * Sent when a booking transitions from `pending` to `confirmed` (after
 * Stripe payment_intent.succeeded). The booking's `receipt_sent_at` column
 * is stamped after a successful send so we never double-send.
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
  businessAddress?: string | null;
  businessPhone?: string | null;
  serviceName: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  timezone?: string;
  staffName?: string | null;
  partySize?: number | null;
  priceCents?: number | null;
  bookingId: string;
  confirmationCode?: string | null;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function bookingConfirmationEmail(
  props: BookingConfirmationProps
): { subject: string; html: string; text: string } {
  const when = formatBookingWhen(props.date, props.startTime, props.endTime, props.timezone);
  const subject = `Booking confirmed — ${props.serviceName} at ${props.businessName}`;

  const ctaUrl = `${SITE_DOMAIN}/bookings/${props.bookingId}`;
  const modifyUrl = `${SITE_DOMAIN}/bookings/${props.bookingId}?action=modify`;
  const cancelUrl = `${SITE_DOMAIN}/bookings/${props.bookingId}?action=cancel`;
  const directionsUrl = props.businessAddress
    ? `https://maps.google.com/?q=${encodeURIComponent(props.businessAddress)}`
    : null;
  const code = props.confirmationCode ?? props.bookingId.slice(0, 8).toUpperCase();

  const detailRows = [
    `<tr><td style="padding:4px 0;color:#999;font-size:13px;">Service</td><td style="padding:4px 0;color:#fff;font-size:13px;text-align:right;">${escapeHtml(props.serviceName)}</td></tr>`,
    `<tr><td style="padding:4px 0;color:#999;font-size:13px;">When</td><td style="padding:4px 0;color:#fff;font-size:13px;text-align:right;">${escapeHtml(when)}</td></tr>`,
    props.staffName
      ? `<tr><td style="padding:4px 0;color:#999;font-size:13px;">With</td><td style="padding:4px 0;color:#fff;font-size:13px;text-align:right;">${escapeHtml(props.staffName)}</td></tr>`
      : "",
    props.partySize && props.partySize > 1
      ? `<tr><td style="padding:4px 0;color:#999;font-size:13px;">Party size</td><td style="padding:4px 0;color:#fff;font-size:13px;text-align:right;">${props.partySize}</td></tr>`
      : "",
    `<tr><td style="padding:4px 0;color:#999;font-size:13px;">Confirmation code</td><td style="padding:4px 0;color:#F2A900;font-size:13px;text-align:right;font-family:monospace;letter-spacing:0.05em;">${escapeHtml(code)}</td></tr>`,
    props.priceCents && props.priceCents > 0
      ? `<tr><td style="padding:4px 0;color:#999;font-size:13px;">Total</td><td style="padding:4px 0;color:#F2A900;font-size:13px;text-align:right;font-weight:700;">${formatMoney(props.priceCents)}</td></tr>`
      : "",
  ]
    .filter(Boolean)
    .join("");

  const vendorBlock = `
    <div style="margin-top:18px;padding:14px;border:1px solid #2A2A2A;border-radius:12px;background:#0F0F0F;">
      <p style="margin:0;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;color:#666;font-weight:600;">Where</p>
      <p style="margin:6px 0 0;font-size:14px;color:#fff;font-weight:600;">${escapeHtml(props.businessName)}</p>
      ${props.businessAddress ? `<p style="margin:2px 0 0;font-size:12px;color:#999;">${escapeHtml(props.businessAddress)}</p>` : ""}
      ${props.businessPhone ? `<p style="margin:2px 0 0;font-size:12px;color:#F2A900;"><a href="tel:${escapeHtml(props.businessPhone)}" style="color:#F2A900;text-decoration:none;">${escapeHtml(props.businessPhone)}</a></p>` : ""}
      ${directionsUrl ? `<p style="margin:8px 0 0;font-size:12px;"><a href="${directionsUrl}" style="color:#F2A900;">Get directions →</a></p>` : ""}
    </div>
  `;

  const manageBlock = `
    <p style="margin:14px 0 0;font-size:12px;color:#999;">
      Need to make a change?
      <a href="${modifyUrl}" style="color:#F2A900;margin-left:4px;">Modify</a>
      <span style="color:#444;">·</span>
      <a href="${cancelUrl}" style="color:#F2A900;">Cancel</a>
    </p>
  `;

  const html = bookingEmailShell({
    preheader: `Your booking with ${props.businessName} is confirmed.`,
    title: "You're booked.",
    lead: `Hi ${escapeHtml(props.customerName)} — your appointment with <strong>${escapeHtml(props.businessName)}</strong> is locked in.`,
    body: `
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">${detailRows}</table>
      ${vendorBlock}
      ${manageBlock}
      <p style="margin:14px 0 0;font-size:13px;color:#999;">Questions? Reply to this email or contact <a href="mailto:${SUPPORT_EMAIL}" style="color:#F2A900;">${SUPPORT_EMAIL}</a>.</p>
    `,
    ctaText: "View booking",
    ctaUrl,
  });

  const textLines: (string | null)[] = [
    `Your booking with ${props.businessName} is confirmed.`,
    ``,
    `Service: ${props.serviceName}`,
    `When: ${when}`,
    props.staffName ? `With: ${props.staffName}` : null,
    props.partySize && props.partySize > 1 ? `Party size: ${props.partySize}` : null,
    `Confirmation code: ${code}`,
    props.priceCents ? `Total: ${formatMoney(props.priceCents)}` : null,
    ``,
    `Where: ${props.businessName}`,
    props.businessAddress ? props.businessAddress : null,
    props.businessPhone ? `Phone: ${props.businessPhone}` : null,
    directionsUrl ? `Directions: ${directionsUrl}` : null,
    ``,
    `View: ${ctaUrl}`,
    `Modify: ${modifyUrl}`,
    `Cancel: ${cancelUrl}`,
    ``,
    `— ${EMAIL_FROM_NAME} (${SITE_NAME})`,
    `Need help? ${SUPPORT_EMAIL}`,
  ];

  const text = textLines.filter((l): l is string => l != null).join("\n");

  return { subject, html, text };
}
