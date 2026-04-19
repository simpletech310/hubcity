/**
 * Order confirmation email template.
 * Sent when an order transitions from `pending` to `confirmed` (after
 * Stripe payment_intent.succeeded).
 */
import {
  SITE_NAME,
  SITE_DOMAIN,
  SUPPORT_EMAIL,
  EMAIL_FROM_NAME,
} from "@/lib/branding";
import {
  orderEmailShell,
  formatMoney,
  escapeHtml,
  renderItemTable,
  type OrderItemSummary,
} from "./shell";

export interface OrderConfirmationProps {
  customerName: string;
  businessName: string;
  orderNumber: string;
  orderId: string;
  totalCents: number;
  type: "pickup" | "delivery";
  items: OrderItemSummary[];
  receiptUrl?: string | null;
}

export function orderConfirmationEmail(
  props: OrderConfirmationProps
): { subject: string; html: string; text: string } {
  const subject = `Order confirmed — ${props.businessName} (#${props.orderNumber})`;
  const ctaUrl = `${SITE_DOMAIN}/orders/${props.orderId}`;

  const typeLabel = props.type === "delivery" ? "Delivery" : "Pickup";
  const receiptLine = props.receiptUrl
    ? `<p style="margin:12px 0 0;font-size:13px;color:#999;"><a href="${props.receiptUrl}" style="color:#F2A900;">View Stripe receipt</a></p>`
    : "";

  const html = orderEmailShell({
    preheader: `Your order from ${props.businessName} is confirmed.`,
    title: "Order confirmed.",
    lead: `Hi ${escapeHtml(props.customerName)} — we received your ${typeLabel.toLowerCase()} order from <strong>${escapeHtml(props.businessName)}</strong>.`,
    body: `
      <table style="width:100%;border-collapse:collapse;margin:8px 0 16px;">
        <tr><td style="padding:4px 0;color:#999;font-size:13px;">Order #</td><td style="padding:4px 0;color:#fff;font-size:13px;text-align:right;">${escapeHtml(props.orderNumber)}</td></tr>
        <tr><td style="padding:4px 0;color:#999;font-size:13px;">Type</td><td style="padding:4px 0;color:#fff;font-size:13px;text-align:right;">${typeLabel}</td></tr>
        <tr><td style="padding:4px 0;color:#999;font-size:13px;">Total</td><td style="padding:4px 0;color:#F2A900;font-size:13px;font-weight:700;text-align:right;">${formatMoney(props.totalCents)}</td></tr>
      </table>
      ${renderItemTable(props.items)}
      ${receiptLine}
      <p style="margin:16px 0 0;font-size:13px;color:#999;">Questions? Reply to this email or contact <a href="mailto:${SUPPORT_EMAIL}" style="color:#F2A900;">${SUPPORT_EMAIL}</a>.</p>
    `,
    ctaText: "View order",
    ctaUrl,
  });

  const text = [
    `Your order from ${props.businessName} is confirmed.`,
    ``,
    `Order #${props.orderNumber}`,
    `Type: ${typeLabel}`,
    `Total: ${formatMoney(props.totalCents)}`,
    ``,
    ...props.items.map((i) => `  ${i.quantity}x ${i.name} — ${formatMoney(i.price * i.quantity)}`),
    ``,
    `View: ${ctaUrl}`,
    props.receiptUrl ? `Receipt: ${props.receiptUrl}` : null,
    ``,
    `— ${EMAIL_FROM_NAME} (${SITE_NAME})`,
    `Need help? ${SUPPORT_EMAIL}`,
  ]
    .filter(Boolean)
    .join("\n");

  return { subject, html, text };
}
