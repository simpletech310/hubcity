/**
 * Delivered email template.
 * Sent when a delivery is marked `delivered` by the courier.
 */
import {
  SITE_NAME,
  SITE_DOMAIN,
  SUPPORT_EMAIL,
  EMAIL_FROM_NAME,
} from "@/lib/branding";
import { orderEmailShell, escapeHtml } from "./shell";

export interface DeliveredProps {
  customerName: string;
  businessName: string;
  orderNumber: string;
  orderId: string;
  proofPhotoUrl?: string | null;
}

export function deliveredEmail(
  props: DeliveredProps
): { subject: string; html: string; text: string } {
  const subject = `Delivered — order from ${props.businessName} (#${props.orderNumber})`;
  const ctaUrl = `${SITE_DOMAIN}/orders/${props.orderId}`;

  const proofLine = props.proofPhotoUrl
    ? `<p style="margin:12px 0 0;font-size:13px;color:#999;"><a href="${props.proofPhotoUrl}" style="color:#F2A900;">View delivery photo</a></p>`
    : "";

  const html = orderEmailShell({
    preheader: `Your order from ${props.businessName} has arrived.`,
    title: "Delivered.",
    lead: `Hi ${escapeHtml(props.customerName)} — your order from <strong>${escapeHtml(props.businessName)}</strong> has been delivered. Enjoy!`,
    body: `
      <table style="width:100%;border-collapse:collapse;margin:8px 0 16px;">
        <tr><td style="padding:4px 0;color:#999;font-size:13px;">Order #</td><td style="padding:4px 0;color:#fff;font-size:13px;text-align:right;">${escapeHtml(props.orderNumber)}</td></tr>
      </table>
      ${proofLine}
      <p style="margin:16px 0 0;font-size:13px;color:#999;">Issue with your delivery? Reply to this email or reach <a href="mailto:${SUPPORT_EMAIL}" style="color:#F2A900;">${SUPPORT_EMAIL}</a>.</p>
    `,
    ctaText: "Rate your order",
    ctaUrl,
  });

  const text = [
    `Your order from ${props.businessName} has been delivered.`,
    ``,
    `Order #${props.orderNumber}`,
    props.proofPhotoUrl ? `Delivery photo: ${props.proofPhotoUrl}` : null,
    ``,
    `View: ${ctaUrl}`,
    ``,
    `— ${EMAIL_FROM_NAME} (${SITE_NAME})`,
  ]
    .filter(Boolean)
    .join("\n");

  return { subject, html, text };
}
