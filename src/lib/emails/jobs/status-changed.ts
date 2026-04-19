import { SITE_DOMAIN } from "@/lib/branding";
import { jobEmailShell, htmlToText } from "./_layout";

const STATUS_LABELS: Record<string, string> = {
  submitted: "Submitted",
  reviewing: "Under review",
  interview: "Interview stage",
  offered: "Offer extended",
  rejected: "Not moving forward",
  withdrawn: "Withdrawn",
};

const STATUS_COPY: Record<string, string> = {
  reviewing:
    "Your application is being reviewed. We'll email you again when there's an update.",
  interview:
    "Good news — the hiring team wants to move you to the interview stage. Watch for a scheduling message.",
  offered:
    "Congratulations — the employer would like to extend an offer. See your application for details.",
  rejected:
    "Unfortunately the employer is not moving forward with your application this time. Keep searching — new roles are posted every day.",
  withdrawn: "Your application has been withdrawn.",
  submitted: "Your application has been submitted.",
};

export function statusChangedEmail({
  applicantName,
  jobTitle,
  organizationName,
  status,
  applicationId,
}: {
  applicantName: string;
  jobTitle: string;
  organizationName: string;
  status: string;
  applicationId: string;
}): { subject: string; html: string; text: string } {
  const label = STATUS_LABELS[status] || status;
  const message = STATUS_COPY[status] || `Your application status is now "${label}".`;
  const subject = `${jobTitle} — ${label}`;

  const html = jobEmailShell({
    title: `Update on your application`,
    intro: `Hi ${applicantName}, your application for <strong style="color:#FFFFFF;">${jobTitle}</strong> at ${organizationName} is now <strong style="color:#F2A900;">${label}</strong>.`,
    body: message,
    ctaUrl: `${SITE_DOMAIN}/jobs/applications/${applicationId}`,
    ctaText: "View my application",
  });

  return { subject, html, text: htmlToText(html) };
}
