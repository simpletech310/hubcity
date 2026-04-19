import sgMail from "@sendgrid/mail";

const apiKey = process.env.SENDGRID_API_KEY;
if (apiKey) {
  sgMail.setApiKey(apiKey);
}

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || "noreply@knect.app";
const FROM_NAME = process.env.SENDGRID_FROM_NAME || "Knect";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  if (!apiKey) {
    console.warn("[Email] No SENDGRID_API_KEY — skipping email send");
    return false;
  }

  try {
    await sgMail.send({
      to: options.to,
      from: { email: FROM_EMAIL, name: FROM_NAME },
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ""),
    });
    return true;
  } catch (error) {
    console.error("[Email] Send failed:", error);
    return false;
  }
}

/**
 * Transactional-email wrapper used by templated flows (jobs, bookings, etc.).
 * Thin alias over sendEmail that keeps the call site explicit about intent
 * and lets us route transactional mail through a dedicated IP pool later
 * without changing callers.
 */
export async function sendTransactionalEmail(options: EmailOptions): Promise<boolean> {
  return sendEmail(options);
}

export async function sendBulkEmail(
  recipients: string[],
  subject: string,
  html: string
): Promise<{ sent: number; failed: number }> {
  if (!apiKey) {
    console.warn("[Email] No SENDGRID_API_KEY — skipping bulk send");
    return { sent: 0, failed: recipients.length };
  }

  let sent = 0;
  let failed = 0;

  // SendGrid supports up to 1000 personalizations per request
  const batchSize = 1000;
  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);
    try {
      await sgMail.send({
        personalizations: batch.map((email) => ({ to: [{ email }] })),
        from: { email: FROM_EMAIL, name: FROM_NAME },
        subject,
        html,
        text: html.replace(/<[^>]*>/g, ""),
      });
      sent += batch.length;
    } catch (error) {
      console.error(`[Email] Bulk batch failed:`, error);
      failed += batch.length;
    }
  }

  return { sent, failed };
}

// ── Email Templates ──

export function notificationEmailTemplate(
  title: string,
  body: string,
  ctaUrl?: string,
  ctaText?: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#0A0A0A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <!-- Logo -->
    <div style="text-align:center;margin-bottom:32px;">
      <div style="display:inline-block;width:48px;height:48px;background:linear-gradient(135deg,#F2A900,#FFD666);border-radius:12px;line-height:48px;font-weight:900;font-size:18px;color:#0A0A0A;">HC</div>
    </div>

    <!-- Card -->
    <div style="background-color:#141414;border:1px solid #2A2A2A;border-radius:16px;padding:32px;margin-bottom:24px;">
      <h1 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#FFFFFF;">${title}</h1>
      <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#999999;">${body}</p>
      ${
        ctaUrl
          ? `<a href="${ctaUrl}" style="display:inline-block;background:linear-gradient(135deg,#F2A900,#FFD666);color:#0A0A0A;font-weight:700;font-size:14px;padding:12px 24px;border-radius:10px;text-decoration:none;">${ctaText || "View in Knect"}</a>`
          : ""
      }
    </div>

    <!-- Footer -->
    <div style="text-align:center;">
      <p style="margin:0;font-size:11px;color:#666666;">Knect — Compton's Digital Town Hall</p>
      <p style="margin:4px 0 0;font-size:11px;color:#444444;">You received this because you're a Knect member.</p>
    </div>
  </div>
</body>
</html>`;
}

export function issueDigestEmailTemplate(
  issues: Array<{ type: string; title: string; location: string; count: number; url: string }>
): string {
  const issueRows = issues
    .map(
      (i) =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #2A2A2A;color:#FFFFFF;font-size:13px;">${i.type}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #2A2A2A;color:#999999;font-size:13px;">${i.title}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #2A2A2A;color:#999999;font-size:13px;">${i.location}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #2A2A2A;color:#F2A900;font-size:13px;text-align:center;">${i.count}</td>
        </tr>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#0A0A0A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <div style="display:inline-block;width:48px;height:48px;background:linear-gradient(135deg,#F2A900,#FFD666);border-radius:12px;line-height:48px;font-weight:900;font-size:18px;color:#0A0A0A;">HC</div>
    </div>
    <div style="background-color:#141414;border:1px solid #2A2A2A;border-radius:16px;padding:32px;">
      <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#FFFFFF;">Daily Issue Digest</h1>
      <p style="margin:0 0 24px;font-size:13px;color:#999999;">New city issues reported by Knect residents</p>
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="border-bottom:2px solid #F2A900;">
            <th style="padding:8px 12px;text-align:left;font-size:11px;color:#F2A900;text-transform:uppercase;">Type</th>
            <th style="padding:8px 12px;text-align:left;font-size:11px;color:#F2A900;text-transform:uppercase;">Title</th>
            <th style="padding:8px 12px;text-align:left;font-size:11px;color:#F2A900;text-transform:uppercase;">Location</th>
            <th style="padding:8px 12px;text-align:center;font-size:11px;color:#F2A900;text-transform:uppercase;">Upvotes</th>
          </tr>
        </thead>
        <tbody>${issueRows}</tbody>
      </table>
    </div>
    <div style="text-align:center;margin-top:24px;">
      <p style="margin:0;font-size:11px;color:#666666;">Knect — Compton's Digital Town Hall</p>
    </div>
  </div>
</body>
</html>`;
}
