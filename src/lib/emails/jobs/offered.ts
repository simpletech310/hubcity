import { SITE_DOMAIN } from "@/lib/branding";
import { jobEmailShell, htmlToText } from "./_layout";

export function offeredEmail({
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
  const subject = `Offer extended — ${jobTitle}`;
  const html = jobEmailShell({
    title: `Congratulations, ${applicantName}!`,
    intro: `${organizationName} has extended an offer for <strong style="color:#FFFFFF;">${jobTitle}</strong>. Open your application to review details and respond.`,
    body: message
      ? `<p style="margin:0;padding:12px;border-left:3px solid #F2A900;background:rgba(242,169,0,0.05);color:#CCCCCC;">${message}</p>`
      : undefined,
    ctaUrl: `${SITE_DOMAIN}/jobs/applications/${applicationId}`,
    ctaText: "Review offer",
  });

  return { subject, html, text: htmlToText(html) };
}
