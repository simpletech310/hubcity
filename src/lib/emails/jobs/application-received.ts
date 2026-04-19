import { SITE_NAME, SITE_DOMAIN } from "@/lib/branding";
import { jobEmailShell, htmlToText } from "./_layout";

export function applicationReceivedEmail({
  applicantName,
  jobTitle,
  organizationName,
  applicationId,
}: {
  applicantName: string;
  jobTitle: string;
  organizationName: string;
  applicationId: string;
}): { subject: string; html: string; text: string } {
  const subject = `Application received — ${jobTitle}`;
  const html = jobEmailShell({
    title: `Thanks for applying, ${applicantName}!`,
    intro: `We received your application for <strong style="color:#FFFFFF;">${jobTitle}</strong> at ${organizationName}. ${organizationName} will review your application and reach out if it's a fit.`,
    body: `You can track the status of your application — including messages from the employer and interview invites — inside ${SITE_NAME}.`,
    ctaUrl: `${SITE_DOMAIN}/jobs/applications/${applicationId}`,
    ctaText: "View my application",
  });

  return { subject, html, text: htmlToText(html) };
}
