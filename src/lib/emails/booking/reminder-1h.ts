/**
 * 1-hour reminder email template.
 */
import { SITE_DOMAIN, EMAIL_FROM_NAME, SITE_NAME } from "@/lib/branding";
import { bookingEmailShell, formatBookingWhen } from "./shell";

export interface BookingReminder1hProps {
  customerName: string;
  businessName: string;
  serviceName: string;
  date: string;
  startTime: string;
  endTime: string;
  timezone?: string;
  bookingId: string;
  businessAddress?: string | null;
}

export function bookingReminder1hEmail(
  props: BookingReminder1hProps
): { subject: string; html: string; text: string } {
  const when = formatBookingWhen(props.date, props.startTime, props.endTime, props.timezone);
  const subject = `Starting soon: ${props.serviceName}`;
  const ctaUrl = `${SITE_DOMAIN}/bookings/${props.bookingId}`;

  const addressLine = props.businessAddress
    ? `<p style="margin:8px 0 0;font-size:13px;color:#999;">${escapeHtml(props.businessAddress)}</p>`
    : "";

  const html = bookingEmailShell({
    preheader: `Your appointment starts in about an hour.`,
    title: "Heads up — starting soon.",
    lead: `Hi ${escapeHtml(props.customerName)} — your appointment with <strong>${escapeHtml(props.businessName)}</strong> starts in about an hour.`,
    body: `
      <p style="margin:12px 0 0;font-size:15px;color:#fff;"><strong>${escapeHtml(props.serviceName)}</strong></p>
      <p style="margin:4px 0 0;font-size:13px;color:#999;">${escapeHtml(when)}</p>
      ${addressLine}
    `,
    ctaText: "View booking",
    ctaUrl,
  });

  const text = [
    `Starting soon: your ${props.serviceName} with ${props.businessName}.`,
    `When: ${when}`,
    props.businessAddress ? `Where: ${props.businessAddress}` : null,
    ``,
    `View: ${ctaUrl}`,
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
