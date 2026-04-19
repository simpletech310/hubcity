/**
 * Booking cancellation email template.
 */
import {
  SITE_DOMAIN,
  SUPPORT_EMAIL,
  EMAIL_FROM_NAME,
  SITE_NAME,
} from "@/lib/branding";
import { bookingEmailShell, formatBookingWhen } from "./shell";

export interface BookingCancelledProps {
  customerName: string;
  businessName: string;
  serviceName: string;
  date: string;
  startTime: string;
  endTime: string;
  timezone?: string;
  bookingId: string;
  reason?: string | null;
  cancelledBy: "customer" | "business" | "system";
}

export function bookingCancelledEmail(
  props: BookingCancelledProps
): { subject: string; html: string; text: string } {
  const when = formatBookingWhen(props.date, props.startTime, props.endTime, props.timezone);
  const subject = `Booking cancelled — ${props.serviceName}`;
  const ctaUrl = `${SITE_DOMAIN}/businesses`;

  const reasonLine = props.reason
    ? `<p style="margin:8px 0 0;font-size:13px;color:#999;">Reason: ${escapeHtml(props.reason)}</p>`
    : "";

  const leadBy =
    props.cancelledBy === "business"
      ? `${escapeHtml(props.businessName)} has cancelled your upcoming appointment.`
      : props.cancelledBy === "customer"
      ? `Your appointment has been cancelled as requested.`
      : `Your appointment has been cancelled.`;

  const html = bookingEmailShell({
    preheader: `Your booking has been cancelled.`,
    title: "Booking cancelled.",
    lead: `Hi ${escapeHtml(props.customerName)} — ${leadBy}`,
    body: `
      <p style="margin:12px 0 0;font-size:15px;color:#fff;"><strong>${escapeHtml(props.serviceName)}</strong></p>
      <p style="margin:4px 0 0;font-size:13px;color:#999;">${escapeHtml(when)}</p>
      ${reasonLine}
      <p style="margin:16px 0 0;font-size:13px;color:#999;">If you were charged, a refund (minus any applicable cancellation fee) will be processed shortly. Questions? <a href="mailto:${SUPPORT_EMAIL}" style="color:#F2A900;">${SUPPORT_EMAIL}</a>.</p>
    `,
    ctaText: "Book again",
    ctaUrl,
  });

  const text = [
    leadBy.replace(/<[^>]*>/g, ""),
    ``,
    `Service: ${props.serviceName}`,
    `When: ${when}`,
    props.reason ? `Reason: ${props.reason}` : null,
    ``,
    `If you were charged, a refund will be processed shortly.`,
    `Questions? ${SUPPORT_EMAIL}`,
    ``,
    `— ${EMAIL_FROM_NAME} (${SITE_NAME})`,
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
