/**
 * Order ready-for-pickup email template.
 * Sent when a pickup order status transitions to `ready`.
 */
import {
  SITE_NAME,
  SITE_DOMAIN,
  SUPPORT_EMAIL,
  EMAIL_FROM_NAME,
} from "@/lib/branding";
import { orderEmailShell, escapeHtml } from "./shell";

export interface ReadyForPickupProps {
  customerName: string;
  businessName: string;
  businessAddress?: string | null;
  orderNumber: string;
  orderId: string;
}

export function readyForPickupEmail(
  props: ReadyForPickupProps
): { subject: string; html: string; text: string } {
  const subject = `Your order is ready — ${props.businessName} (#${props.orderNumber})`;
  const ctaUrl = `${SITE_DOMAIN}/orders/${props.orderId}`;

  const addressLine = props.businessAddress
    ? `<tr><td style="padding:4px 0;color:#999;font-size:13px;">Pickup at</td><td style="padding:4px 0;color:#fff;font-size:13px;text-align:right;">${escapeHtml(props.businessAddress)}</td></tr>`
    : "";

  const html = orderEmailShell({
    preheader: `Your order at ${props.businessName} is ready for pickup.`,
    title: "Ready for pickup.",
    lead: `Hi ${escapeHtml(props.customerName)} — your order at <strong>${escapeHtml(props.businessName)}</strong> is ready to collect.`,
    body: `
      <table style="width:100%;border-collapse:collapse;margin:8px 0 16px;">
        <tr><td style="padding:4px 0;color:#999;font-size:13px;">Order #</td><td style="padding:4px 0;color:#fff;font-size:13px;text-align:right;">${escapeHtml(props.orderNumber)}</td></tr>
        ${addressLine}
      </table>
      <p style="margin:16px 0 0;font-size:13px;color:#999;">Questions? <a href="mailto:${SUPPORT_EMAIL}" style="color:#F2A900;">${SUPPORT_EMAIL}</a></p>
    `,
    ctaText: "View order",
    ctaUrl,
  });

  const text = [
    `Your order at ${props.businessName} is ready for pickup.`,
    ``,
    `Order #${props.orderNumber}`,
    props.businessAddress ? `Pickup at: ${props.businessAddress}` : null,
    ``,
    `View: ${ctaUrl}`,
    ``,
    `— ${EMAIL_FROM_NAME} (${SITE_NAME})`,
  ]
    .filter(Boolean)
    .join("\n");

  return { subject, html, text };
}
