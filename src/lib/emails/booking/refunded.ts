/**
 * Booking refund email template.
 */
import {
  SITE_DOMAIN,
  SUPPORT_EMAIL,
  EMAIL_FROM_NAME,
  SITE_NAME,
} from "@/lib/branding";
import { bookingEmailShell, formatMoney } from "./shell";

export interface BookingRefundedProps {
  customerName: string;
  businessName: string;
  serviceName: string;
  refundAmountCents: number;
  isPartial: boolean;
  bookingId: string;
}

export function bookingRefundedEmail(
  props: BookingRefundedProps
): { subject: string; html: string; text: string } {
  const amount = formatMoney(props.refundAmountCents);
  const kind = props.isPartial ? "Partial refund" : "Refund";
  const subject = `${kind} issued — ${props.serviceName}`;
  const ctaUrl = `${SITE_DOMAIN}/bookings/${props.bookingId}`;

  const html = bookingEmailShell({
    preheader: `${kind} of ${amount} has been processed.`,
    title: `${kind} issued.`,
    lead: `Hi ${escapeHtml(props.customerName)} — a ${kind.toLowerCase()} of <strong>${amount}</strong> has been issued for your booking with ${escapeHtml(props.businessName)}.`,
    body: `
      <p style="margin:12px 0 0;font-size:15px;color:#fff;"><strong>${escapeHtml(props.serviceName)}</strong></p>
      <p style="margin:4px 0 0;font-size:13px;color:#999;">Refund of ${amount} — it may take 5–10 business days to appear on your statement.</p>
      <p style="margin:16px 0 0;font-size:13px;color:#999;">Questions? <a href="mailto:${SUPPORT_EMAIL}" style="color:#F2A900;">${SUPPORT_EMAIL}</a>.</p>
    `,
    ctaText: "View booking",
    ctaUrl,
  });

  const text = [
    `${kind} of ${amount} issued for your ${props.serviceName} booking with ${props.businessName}.`,
    `It may take 5–10 business days to appear on your statement.`,
    ``,
    `View: ${ctaUrl}`,
    `Questions? ${SUPPORT_EMAIL}`,
    ``,
    `— ${EMAIL_FROM_NAME} (${SITE_NAME})`,
  ].join("\n");

  return { subject, html, text };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
