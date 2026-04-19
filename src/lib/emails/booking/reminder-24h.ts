/**
 * 24-hour reminder email template. Fired by the scheduled Supabase
 * function in `supabase/functions/booking-reminders`.
 */
import {
  SITE_DOMAIN,
  SUPPORT_EMAIL,
  EMAIL_FROM_NAME,
  SITE_NAME,
} from "@/lib/branding";
import { bookingEmailShell, formatBookingWhen } from "./shell";

export interface BookingReminder24hProps {
  customerName: string;
  businessName: string;
  serviceName: string;
  date: string;
  startTime: string;
  endTime: string;
  timezone?: string;
  bookingId: string;
  cancellationWindowHours?: number;
}

export function bookingReminder24hEmail(
  props: BookingReminder24hProps
): { subject: string; html: string; text: string } {
  const when = formatBookingWhen(props.date, props.startTime, props.endTime, props.timezone);
  const subject = `Tomorrow: ${props.serviceName} at ${props.businessName}`;
  const ctaUrl = `${SITE_DOMAIN}/bookings/${props.bookingId}`;

  const cancelCopy = props.cancellationWindowHours
    ? `Need to reschedule? You can cancel up to ${props.cancellationWindowHours}h before your appointment.`
    : `Need to reschedule? Reply to this email and we'll help sort it.`;

  const html = bookingEmailShell({
    preheader: `Reminder: your appointment is tomorrow.`,
    title: "See you tomorrow.",
    lead: `Hi ${escapeHtml(props.customerName)} — just a heads-up that your appointment with <strong>${escapeHtml(props.businessName)}</strong> is tomorrow.`,
    body: `
      <p style="margin:12px 0 0;font-size:15px;color:#fff;"><strong>${escapeHtml(props.serviceName)}</strong></p>
      <p style="margin:4px 0 16px;font-size:13px;color:#999;">${escapeHtml(when)}</p>
      <p style="margin:16px 0 0;font-size:13px;color:#999;">${escapeHtml(cancelCopy)} Questions? <a href="mailto:${SUPPORT_EMAIL}" style="color:#F2A900;">${SUPPORT_EMAIL}</a>.</p>
    `,
    ctaText: "View booking",
    ctaUrl,
  });

  const text = [
    `Reminder: your ${props.serviceName} with ${props.businessName} is tomorrow.`,
    `When: ${when}`,
    ``,
    cancelCopy,
    ``,
    `View: ${ctaUrl}`,
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
