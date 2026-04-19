import { SITE_NAME, SUPPORT_EMAIL, SITE_DOMAIN } from "@/lib/branding";

/**
 * Shared HTML shell for job-flow transactional emails. Keeps the brand
 * styling in one place so templates can focus on copy.
 */
export function jobEmailShell({
  title,
  intro,
  body,
  ctaUrl,
  ctaText,
}: {
  title: string;
  intro: string;
  body?: string;
  ctaUrl?: string;
  ctaText?: string;
}): string {
  const cta = ctaUrl
    ? `<a href="${ctaUrl}" style="display:inline-block;background:linear-gradient(135deg,#F2A900,#FFD666);color:#0A0A0A;font-weight:700;font-size:14px;padding:12px 24px;border-radius:10px;text-decoration:none;">${ctaText || "View in " + SITE_NAME}</a>`
    : "";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#0A0A0A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <div style="display:inline-block;padding:12px 20px;background:linear-gradient(135deg,#F2A900,#FFD666);border-radius:12px;font-weight:900;font-size:18px;color:#0A0A0A;">${SITE_NAME}</div>
    </div>
    <div style="background-color:#141414;border:1px solid #2A2A2A;border-radius:16px;padding:32px;margin-bottom:24px;">
      <h1 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#FFFFFF;">${title}</h1>
      <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#CCCCCC;">${intro}</p>
      ${body ? `<div style="margin:0 0 24px;font-size:13px;line-height:1.6;color:#999999;">${body}</div>` : ""}
      ${cta}
    </div>
    <div style="text-align:center;">
      <p style="margin:0;font-size:11px;color:#666666;">${SITE_NAME} — <a href="${SITE_DOMAIN}" style="color:#666;text-decoration:none;">${SITE_DOMAIN.replace(/^https?:\/\//, "")}</a></p>
      <p style="margin:4px 0 0;font-size:11px;color:#444444;">Need help? Contact <a href="mailto:${SUPPORT_EMAIL}" style="color:#F2A900;text-decoration:none;">${SUPPORT_EMAIL}</a></p>
    </div>
  </div>
</body>
</html>`;
}

export function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
