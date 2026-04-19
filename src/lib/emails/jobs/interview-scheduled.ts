import { SITE_DOMAIN } from "@/lib/branding";
import { jobEmailShell, htmlToText } from "./_layout";

export function interviewScheduledEmail({
  applicantName,
  jobTitle,
  organizationName,
  scheduledAt,
  location,
  meetingUrl,
  interviewerNote,
  applicationId,
}: {
  applicantName: string;
  jobTitle: string;
  organizationName: string;
  scheduledAt: string;
  location?: string | null;
  meetingUrl?: string | null;
  interviewerNote?: string | null;
  applicationId: string;
}): { subject: string; html: string; text: string } {
  const when = new Date(scheduledAt).toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });

  const subject = `Interview scheduled — ${jobTitle}`;
  const details: string[] = [`<p style="margin:0 0 8px;"><strong style="color:#FFFFFF;">When:</strong> ${when}</p>`];
  if (location) {
    details.push(`<p style="margin:0 0 8px;"><strong style="color:#FFFFFF;">Where:</strong> ${location}</p>`);
  }
  if (meetingUrl) {
    details.push(
      `<p style="margin:0 0 8px;"><strong style="color:#FFFFFF;">Meeting link:</strong> <a href="${meetingUrl}" style="color:#F2A900;">${meetingUrl}</a></p>`
    );
  }
  if (interviewerNote) {
    details.push(
      `<p style="margin:12px 0 0;padding:12px;border-left:3px solid #F2A900;background:rgba(242,169,0,0.05);color:#CCCCCC;">${interviewerNote}</p>`
    );
  }

  const html = jobEmailShell({
    title: `You have an interview!`,
    intro: `${organizationName} scheduled an interview with you for <strong style="color:#FFFFFF;">${jobTitle}</strong>, ${applicantName}.`,
    body: details.join(""),
    ctaUrl: `${SITE_DOMAIN}/jobs/applications/${applicationId}`,
    ctaText: "View interview details",
  });

  return { subject, html, text: htmlToText(html) };
}
