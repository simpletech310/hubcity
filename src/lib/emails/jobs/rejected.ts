import { SITE_DOMAIN, SITE_NAME } from "@/lib/branding";
import { jobEmailShell, htmlToText } from "./_layout";

export function rejectedEmail({
  applicantName,
  jobTitle,
  organizationName,
  applicationId,
  message,
}: {
  applicantName: string;
  jobTitle: string;
  organizationName: string;
  applicationId: string;
  message?: string | null;
}): { subject: string; html: string; text: string } {
  const subject = `Update on your application — ${jobTitle}`;
  const html = jobEmailShell({
    title: `Thanks for applying, ${applicantName}`,
    intro: `${organizationName} has decided not to move forward with your application for <strong style="color:#FFFFFF;">${jobTitle}</strong> at this time. We know this isn't the news you hoped for — keep going.`,
    body: message
      ? `<p style="margin:0 0 12px;padding:12px;border-left:3px solid #2A2A2A;background:rgba(255,255,255,0.02);color:#CCCCCC;">${message}</p><p style="margin:0;">New roles are posted on ${SITE_NAME} every day. Set up a job alert to be first to know.</p>`
      : `New roles are posted on ${SITE_NAME} every day. Set up a job alert to be first to know.`,
    ctaUrl: `${SITE_DOMAIN}/jobs`,
    ctaText: "Browse open jobs",
  });

  return { subject, html, text: htmlToText(html) };
}

// Keep a convenience re-export point for the application detail page link
// so callers can still reach the application record if they want to.
export function rejectedEmailWithApplicationLink(
  args: Parameters<typeof rejectedEmail>[0]
): ReturnType<typeof rejectedEmail> {
  const built = rejectedEmail(args);
  // Swap CTA to the application detail page when that's more useful.
  const html = built.html.replace(
    /href="[^"]*\/jobs"/,
    `href="${SITE_DOMAIN}/jobs/applications/${args.applicationId}"`
  );
  return { ...built, html, text: htmlToText(html) };
}
