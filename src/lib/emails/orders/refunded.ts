/**
 * Refunded email template.
 * Sent when a refund (full or partial) is issued on an order. Includes the
 * reason text captured at refund time.
 */
import {
  SITE_NAME,
  SITE_DOMAIN,
  SUPPORT_EMAIL,
  EMAIL_FROM_NAME,
} from "@/lib/branding";
import { orderEmailShell, formatMoney, escapeHtml } from "./shell";

export interface RefundedProps {
  customerName: string;
  businessName: string;
  orderNumber: string;
  orderId: string;
  refundAmountCents: number;
  originalTotalCents: number;
  reason: string;
  isPartial: boolean;
}

export function refundedEmail(
  props: RefundedProps
): { subject: string; html: string; text: string } {
  const kind = props.isPartial ? "Partial refund" : "Refund";
  const subject = `${kind} processed — ${props.businessName} (#${props.orderNumber})`;
  const ctaUrl = `${SITE_DOMAIN}/orders/${props.orderId}`;

  const html = orderEmailShell({
    preheader: `A ${kind.toLowerCase()} has been processed for your order at ${props.businessName}.`,
    title: `${kind} processed.`,
    lead: `Hi ${escapeHtml(props.customerName)} — a ${kind.toLowerCase()} has been issued on your order at <strong>${escapeHtml(props.businessName)}</strong>.`,
    body: `
      <table style="width:100%;border-collapse:collapse;margin:8px 0 16px;">
        <tr><td style="padding:4px 0;color:#999;font-size:13px;">Order #</td><td style="padding:4px 0;color:#fff;font-size:13px;text-align:right;">${escapeHtml(props.orderNumber)}</td></tr>
        <tr><td style="padding:4px 0;color:#999;font-size:13px;">Refund amount</td><td style="padding:4px 0;color:#F2A900;font-size:13px;font-weight:700;text-align:right;">${formatMoney(props.refundAmountCents)}</td></tr>
        <tr><td style="padding:4px 0;color:#999;font-size:13px;">Original total</td><td style="padding:4px 0;color:#fff;font-size:13px;text-align:right;">${formatMoney(props.originalTotalCents)}</td></tr>
        <tr><td style="padding:4px 0;color:#999;font-size:13px;vertical-align:top;">Reason</td><td style="padding:4px 0;color:#fff;font-size:13px;text-align:right;">${escapeHtml(props.reason || "Not specified")}</td></tr>
      </table>
      <p style="margin:16px 0 0;font-size:13px;color:#999;">Refunds typically appear on your statement within 5–10 business days. Questions? <a href="mailto:${SUPPORT_EMAIL}" style="color:#F2A900;">${SUPPORT_EMAIL}</a></p>
    `,
    ctaText: "View order",
    ctaUrl,
  });

  const text = [
    `${kind} processed for your order at ${props.businessName}.`,
    ``,
    `Order #${props.orderNumber}`,
    `Refund amount: ${formatMoney(props.refundAmountCents)}`,
    `Original total: ${formatMoney(props.originalTotalCents)}`,
    `Reason: ${props.reason || "Not specified"}`,
    ``,
    `View: ${ctaUrl}`,
    ``,
    `— ${EMAIL_FROM_NAME} (${SITE_NAME})`,
  ].join("\n");

  return { subject, html, text };
}
