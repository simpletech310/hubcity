/**
 * Shared visual shell + formatters for order / delivery emails. Mirrors
 * booking/shell.ts so the brand chrome stays consistent across transactional
 * flows.
 */
import { SITE_NAME, EMAIL_FROM_NAME } from "@/lib/branding";

export interface OrderEmailShellOpts {
  preheader: string;
  title: string;
  lead: string; // HTML string — caller is responsible for escaping
  body: string; // HTML string
  ctaText?: string;
  ctaUrl?: string;
}

export function orderEmailShell(opts: OrderEmailShellOpts): string {
  const cta =
    opts.ctaUrl && opts.ctaText
      ? `<p style="margin:20px 0 0;"><a href="${opts.ctaUrl}" style="display:inline-block;background:linear-gradient(135deg,#F2A900,#FFD666);color:#0A0A0A;font-weight:700;font-size:14px;padding:12px 24px;border-radius:10px;text-decoration:none;">${opts.ctaText}</a></p>`
      : "";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${opts.title}</title>
</head>
<body style="margin:0;padding:0;background-color:#0A0A0A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <span style="display:none!important;visibility:hidden;opacity:0;height:0;width:0;overflow:hidden;">${opts.preheader}</span>
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:24px;">
      <div style="display:inline-block;width:44px;height:44px;background:linear-gradient(135deg,#F2A900,#FFD666);border-radius:10px;line-height:44px;font-weight:900;font-size:16px;color:#0A0A0A;">K</div>
    </div>
    <div style="background-color:#141414;border:1px solid #2A2A2A;border-radius:16px;padding:32px;">
      <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#FFFFFF;">${opts.title}</h1>
      <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#CCCCCC;">${opts.lead}</p>
      ${opts.body}
      ${cta}
    </div>
    <div style="text-align:center;margin-top:20px;">
      <p style="margin:0;font-size:11px;color:#666666;">${EMAIL_FROM_NAME} · ${SITE_NAME}</p>
    </div>
  </div>
</body>
</html>`;
}

export function formatMoney(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export interface OrderItemSummary {
  name: string;
  quantity: number;
  price: number; // cents
}

export function renderItemTable(items: OrderItemSummary[]): string {
  if (!items.length) return "";
  const rows = items
    .map(
      (i) =>
        `<tr><td style="padding:4px 0;color:#999;font-size:13px;">${escapeHtml(i.name)} × ${i.quantity}</td><td style="padding:4px 0;color:#fff;font-size:13px;text-align:right;">${formatMoney(i.price * i.quantity)}</td></tr>`
    )
    .join("");
  return `<table style="width:100%;border-collapse:collapse;margin:16px 0;">${rows}</table>`;
}
