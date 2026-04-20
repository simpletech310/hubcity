/**
 * Order confirmation / customer receipt email.
 * Sent when an order transitions from `pending` to `confirmed` (after
 * Stripe payment_intent.succeeded). The order's `receipt_sent_at` column
 * is stamped after a successful send so we never double-send.
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
  businessAddress?: string | null;
  businessPhone?: string | null;
  orderNumber: string;
  orderId: string;
  subtotalCents?: number | null;
  taxCents?: number | null;
  tipCents?: number | null;
  platformFeeCents?: number | null;
  totalCents: number;
  type: "pickup" | "delivery";
  estimatedReadyAt?: string | null; // ISO timestamp
  estimatedDeliveryAt?: string | null; // ISO timestamp
  deliveryAddress?: string | null;
  items: OrderItemSummary[];
  receiptUrl?: string | null;
}

function formatEstimate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function moneyRow(label: string, cents: number | null | undefined, opts?: { bold?: boolean; muted?: boolean }): string {
  if (cents == null) return "";
  const valueColor = opts?.bold ? "#F2A900" : opts?.muted ? "#999" : "#fff";
  const labelColor = opts?.muted ? "#666" : "#999";
  const weight = opts?.bold ? "700" : "400";
  return `<tr><td style="padding:3px 0;color:${labelColor};font-size:13px;">${label}</td><td style="padding:3px 0;color:${valueColor};font-size:13px;text-align:right;font-weight:${weight};">${formatMoney(cents)}</td></tr>`;
}

export function orderConfirmationEmail(
  props: OrderConfirmationProps
): { subject: string; html: string; text: string } {
  const subject = `Receipt — ${props.businessName} (Order #${props.orderNumber})`;
  const ctaUrl = `${SITE_DOMAIN}/orders/${props.orderId}`;

  const typeLabel = props.type === "delivery" ? "Delivery" : "Pickup";
  const eta =
    props.type === "delivery"
      ? formatEstimate(props.estimatedDeliveryAt)
      : formatEstimate(props.estimatedReadyAt);

  const detailsRows = [
    `<tr><td style="padding:4px 0;color:#999;font-size:13px;">Order #</td><td style="padding:4px 0;color:#fff;font-size:13px;text-align:right;">${escapeHtml(props.orderNumber)}</td></tr>`,
    `<tr><td style="padding:4px 0;color:#999;font-size:13px;">Type</td><td style="padding:4px 0;color:#fff;font-size:13px;text-align:right;">${typeLabel}</td></tr>`,
    eta
      ? `<tr><td style="padding:4px 0;color:#999;font-size:13px;">${props.type === "delivery" ? "Estimated arrival" : "Ready for pickup"}</td><td style="padding:4px 0;color:#fff;font-size:13px;text-align:right;">${escapeHtml(eta)}</td></tr>`
      : "",
  ]
    .filter(Boolean)
    .join("");

  const totalsRows = [
    moneyRow("Subtotal", props.subtotalCents),
    moneyRow("Tax", props.taxCents),
    moneyRow("Tip", props.tipCents && props.tipCents > 0 ? props.tipCents : null),
    moneyRow("Platform fee", props.platformFeeCents, { muted: true }),
    moneyRow("Total", props.totalCents, { bold: true }),
  ].join("");

  const vendorBlock = `
    <div style="margin-top:18px;padding:14px;border:1px solid #2A2A2A;border-radius:12px;background:#0F0F0F;">
      <p style="margin:0;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;color:#666;font-weight:600;">${typeLabel === "Delivery" ? "Delivering from" : "Pickup at"}</p>
      <p style="margin:6px 0 0;font-size:14px;color:#fff;font-weight:600;">${escapeHtml(props.businessName)}</p>
      ${props.businessAddress ? `<p style="margin:2px 0 0;font-size:12px;color:#999;">${escapeHtml(props.businessAddress)}</p>` : ""}
      ${props.businessPhone ? `<p style="margin:2px 0 0;font-size:12px;color:#F2A900;"><a href="tel:${escapeHtml(props.businessPhone)}" style="color:#F2A900;text-decoration:none;">${escapeHtml(props.businessPhone)}</a></p>` : ""}
      ${props.type === "delivery" && props.deliveryAddress ? `<p style="margin:8px 0 0;padding-top:8px;border-top:1px solid #2A2A2A;font-size:12px;color:#999;">Delivering to: <span style="color:#fff;">${escapeHtml(props.deliveryAddress)}</span></p>` : ""}
    </div>
  `;

  const receiptLine = props.receiptUrl
    ? `<p style="margin:12px 0 0;font-size:13px;color:#999;"><a href="${props.receiptUrl}" style="color:#F2A900;">View Stripe receipt</a></p>`
    : "";

  const html = orderEmailShell({
    preheader: `Your order from ${props.businessName} is confirmed.`,
    title: "Order confirmed.",
    lead: `Hi ${escapeHtml(props.customerName)} — we received your ${typeLabel.toLowerCase()} order from <strong>${escapeHtml(props.businessName)}</strong>.`,
    body: `
      <table style="width:100%;border-collapse:collapse;margin:8px 0 4px;">${detailsRows}</table>
      ${renderItemTable(props.items)}
      <table style="width:100%;border-collapse:collapse;margin:0 0 8px;border-top:1px solid #2A2A2A;padding-top:8px;">${totalsRows}</table>
      ${vendorBlock}
      ${receiptLine}
      <p style="margin:16px 0 0;font-size:13px;color:#999;">Track your order anytime — questions? Reply to this email or contact <a href="mailto:${SUPPORT_EMAIL}" style="color:#F2A900;">${SUPPORT_EMAIL}</a>.</p>
    `,
    ctaText: "Track order",
    ctaUrl,
  });

  const textLines: (string | null)[] = [
    `Your order from ${props.businessName} is confirmed.`,
    ``,
    `Order #${props.orderNumber}`,
    `Type: ${typeLabel}`,
    eta ? `${props.type === "delivery" ? "Estimated arrival" : "Ready"}: ${eta}` : null,
    ``,
    `Items:`,
    ...props.items.map((i) => `  ${i.quantity}x ${i.name} — ${formatMoney(i.price * i.quantity)}`),
    ``,
    props.subtotalCents != null ? `Subtotal: ${formatMoney(props.subtotalCents)}` : null,
    props.taxCents != null ? `Tax: ${formatMoney(props.taxCents)}` : null,
    props.tipCents != null && props.tipCents > 0 ? `Tip: ${formatMoney(props.tipCents)}` : null,
    props.platformFeeCents != null ? `Platform fee: ${formatMoney(props.platformFeeCents)}` : null,
    `Total: ${formatMoney(props.totalCents)}`,
    ``,
    `${typeLabel === "Delivery" ? "Delivering from" : "Pickup at"}: ${props.businessName}`,
    props.businessAddress ? props.businessAddress : null,
    props.businessPhone ? `Phone: ${props.businessPhone}` : null,
    props.type === "delivery" && props.deliveryAddress ? `Delivering to: ${props.deliveryAddress}` : null,
    ``,
    `Track: ${ctaUrl}`,
    props.receiptUrl ? `Stripe receipt: ${props.receiptUrl}` : null,
    ``,
    `— ${EMAIL_FROM_NAME} (${SITE_NAME})`,
    `Need help? ${SUPPORT_EMAIL}`,
  ];

  const text = textLines.filter((l): l is string => l != null).join("\n");

  return { subject, html, text };
}
