/**
 * Out-for-delivery email template.
 * Sent when a delivery order transitions to `out_for_delivery` (courier has
 * picked up the order from the vendor).
 */
import {
  SITE_NAME,
  SITE_DOMAIN,
  SUPPORT_EMAIL,
  EMAIL_FROM_NAME,
} from "@/lib/branding";
import { orderEmailShell, escapeHtml } from "./shell";

export interface OutForDeliveryProps {
  customerName: string;
  businessName: string;
  orderNumber: string;
  orderId: string;
  deliveryAddress?: string | null;
  courierName?: string | null;
  dropoffEta?: string | null; // ISO datetime
}

export function outForDeliveryEmail(
  props: OutForDeliveryProps
): { subject: string; html: string; text: string } {
  const subject = `On the way — order from ${props.businessName} (#${props.orderNumber})`;
  const ctaUrl = `${SITE_DOMAIN}/orders/${props.orderId}`;

  const addressLine = props.deliveryAddress
    ? `<tr><td style="padding:4px 0;color:#999;font-size:13px;">Dropping at</td><td style="padding:4px 0;color:#fff;font-size:13px;text-align:right;">${escapeHtml(props.deliveryAddress)}</td></tr>`
    : "";
  const courierLine = props.courierName
    ? `<tr><td style="padding:4px 0;color:#999;font-size:13px;">Courier</td><td style="padding:4px 0;color:#fff;font-size:13px;text-align:right;">${escapeHtml(props.courierName)}</td></tr>`
    : "";
  const etaLine = props.dropoffEta
    ? `<tr><td style="padding:4px 0;color:#999;font-size:13px;">Estimated arrival</td><td style="padding:4px 0;color:#fff;font-size:13px;text-align:right;">${escapeHtml(
        new Date(props.dropoffEta).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        })
      )}</td></tr>`
    : "";

  const html = orderEmailShell({
    preheader: `Your order from ${props.businessName} is out for delivery.`,
    title: "On the way.",
    lead: `Hi ${escapeHtml(props.customerName)} — your order from <strong>${escapeHtml(props.businessName)}</strong> is out for delivery.`,
    body: `
      <table style="width:100%;border-collapse:collapse;margin:8px 0 16px;">
        <tr><td style="padding:4px 0;color:#999;font-size:13px;">Order #</td><td style="padding:4px 0;color:#fff;font-size:13px;text-align:right;">${escapeHtml(props.orderNumber)}</td></tr>
        ${courierLine}
        ${addressLine}
        ${etaLine}
      </table>
      <p style="margin:16px 0 0;font-size:13px;color:#999;">Track status updates in the app. Questions? <a href="mailto:${SUPPORT_EMAIL}" style="color:#F2A900;">${SUPPORT_EMAIL}</a></p>
    `,
    ctaText: "Track order",
    ctaUrl,
  });

  const text = [
    `Your order from ${props.businessName} is out for delivery.`,
    ``,
    `Order #${props.orderNumber}`,
    props.courierName ? `Courier: ${props.courierName}` : null,
    props.deliveryAddress ? `Dropping at: ${props.deliveryAddress}` : null,
    ``,
    `Track: ${ctaUrl}`,
    ``,
    `— ${EMAIL_FROM_NAME} (${SITE_NAME})`,
  ]
    .filter(Boolean)
    .join("\n");

  return { subject, html, text };
}
