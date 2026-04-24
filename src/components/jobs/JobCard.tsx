import Link from "next/link";
import Icon from "@/components/ui/Icon";
import type { JobListing, JobType } from "@/types/database";
import type { IconName } from "@/components/ui/Icon";

const jobTypeMeta: Record<JobType, { label: string; iconName: IconName }> = {
  full_time: { label: "Full-Time", iconName: "building" },
  part_time: { label: "Part-Time", iconName: "clock" },
  contract: { label: "Contract", iconName: "document" },
  seasonal: { label: "Seasonal", iconName: "palm" },
  internship: { label: "Internship", iconName: "graduation" },
  volunteer: { label: "Volunteer", iconName: "handshake" },
};

const orgTypeIconMap: Record<string, IconName> = {
  business: "briefcase",
  school: "graduation",
  city: "landmark",
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatSalary(job: JobListing): string | null {
  if (!job.salary_min && !job.salary_max) return null;
  const fmt = (n: number) =>
    job.salary_type === "hourly"
      ? `$${n}`
      : `$${(n / 1000).toFixed(0)}k`;

  const suffix = job.salary_type
    ? `/${job.salary_type === "hourly" ? "hr" : job.salary_type === "salary" ? "yr" : job.salary_type === "commission" ? "comm" : "tips"}`
    : "";

  if (job.salary_min && job.salary_max) return `${fmt(job.salary_min)} - ${fmt(job.salary_max)}${suffix}`;
  if (job.salary_min) return `From ${fmt(job.salary_min)}${suffix}`;
  if (job.salary_max) return `Up to ${fmt(job.salary_max)}${suffix}`;
  return null;
}

interface JobCardProps {
  job: JobListing;
  featured?: boolean;
}

export default function JobCard({ job, featured = false }: JobCardProps) {
  const meta = jobTypeMeta[job.job_type] ?? { label: job.job_type, iconName: "briefcase" as IconName };
  const salary = job.job_type !== "volunteer" ? formatSalary(job) : null;
  const business = job.business as { id: string; name: string; slug: string; image_urls?: string[] } | null;
  const displayName = job.organization_name || business?.name || "Organization";
  const orgIconName = job.organization_type ? orgTypeIconMap[job.organization_type] ?? "briefcase" : "briefcase";
  const businessImage = business?.image_urls?.[0];

  // Deadline urgency
  const daysUntilDeadline = job.application_deadline
    ? Math.ceil((new Date(job.application_deadline).getTime() - Date.now()) / 86400000)
    : null;

  if (featured) {
    return (
      <Link
        href={`/jobs/${job.slug || job.id}`}
        className="group block shrink-0 w-[280px] snap-start press"
        style={{ border: "2px solid var(--rule-strong-c)", background: "var(--paper)", padding: 16 }}
      >
        <div className="flex items-start justify-between mb-3">
          <div
            className="w-12 h-12 flex items-center justify-center shrink-0 overflow-hidden"
            style={{ background: "var(--ink-strong)", border: "2px solid var(--rule-strong-c)" }}
          >
            {businessImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={businessImage} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <Icon name={orgIconName} size={20} style={{ color: "var(--gold-c)" }} />
            )}
          </div>
          <span className="c-badge c-badge-gold inline-flex items-center gap-1">
            <Icon name="sparkle" size={9} />
            FEATURED
          </span>
        </div>
        <h3
          className="c-card-t line-clamp-2"
          style={{ fontSize: 17, color: "var(--ink-strong)" }}
        >
          {job.title}
        </h3>
        <p
          className="c-meta mt-1 truncate"
          style={{ color: "var(--ink-mute)", textTransform: "none", fontSize: 11 }}
        >
          {displayName}
        </p>
        {job.location && (
          <p
            className="c-kicker mt-0.5 truncate"
            style={{ color: "var(--ink-mute)", fontSize: 9 }}
          >
            {job.location}
          </p>
        )}
        <div className="flex items-center gap-1.5 flex-wrap mt-3">
          <span className="c-badge c-badge-ink inline-flex items-center gap-1">
            <Icon name={meta.iconName} size={9} />
            {meta.label.toUpperCase()}
          </span>
          {salary && (
            <span className="c-badge c-badge-gold">{salary}</span>
          )}
          {daysUntilDeadline !== null && daysUntilDeadline > 0 && daysUntilDeadline <= 14 && (
            <span className={`c-badge ${daysUntilDeadline <= 7 ? "c-badge-live" : "c-badge-gold"} inline-flex items-center gap-1`}>
              <Icon name="clock" size={9} />
              {daysUntilDeadline <= 1 ? "1D" : `${daysUntilDeadline}D`}
            </span>
          )}
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/jobs/${job.slug || job.id}`}
      className="group block press overflow-hidden"
      style={{ border: "2px solid var(--rule-strong-c)", background: "var(--paper)" }}
    >
      <div className="p-3.5 flex items-start gap-3">
        {/* Gold icon well */}
        <div
          className="w-12 h-12 flex items-center justify-center shrink-0 overflow-hidden"
          style={{ background: "var(--ink-strong)", border: "2px solid var(--rule-strong-c)" }}
        >
          {businessImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={businessImage} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            <Icon name={orgIconName} size={20} style={{ color: "var(--gold-c)" }} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3
            className="c-card-t line-clamp-1"
            style={{ fontSize: 17, color: "var(--ink-strong)" }}
          >
            {job.title}
          </h3>
          <p
            className="c-meta mt-0.5 truncate"
            style={{ color: "var(--ink-mute)", textTransform: "none", fontSize: 11 }}
          >
            {displayName}
            {job.location && (
              <>
                <span className="mx-1.5" style={{ color: "var(--ink-faint)" }}>·</span>
                {job.location}
              </>
            )}
          </p>

          <div className="flex items-center gap-1.5 flex-wrap mt-2">
            <span className="c-badge c-badge-ink inline-flex items-center gap-1">
              <Icon name={meta.iconName} size={9} />
              {meta.label.toUpperCase()}
            </span>
            {salary && (
              <span className="c-badge c-badge-gold">{salary}</span>
            )}
            {job.job_type === "volunteer" && (
              <span className="c-badge c-badge-ok">OPEN</span>
            )}
            {daysUntilDeadline !== null && daysUntilDeadline > 0 && daysUntilDeadline <= 14 && (
              <span className={`c-badge ${daysUntilDeadline <= 7 ? "c-badge-live" : "c-badge-gold"} inline-flex items-center gap-1`}>
                <Icon name="clock" size={9} />
                {daysUntilDeadline}D
              </span>
            )}
            <span
              className="c-kicker ml-auto"
              style={{ color: "var(--ink-faint)", fontSize: 9 }}
            >
              {timeAgo(job.created_at).toUpperCase()}
            </span>
          </div>
        </div>

        {/* Apply CTA */}
        <div className="shrink-0 self-center flex flex-col items-end gap-0.5">
          <span
            className="inline-flex items-center gap-1 c-kicker"
            style={{
              background: "var(--ink-strong)",
              color: "var(--gold-c)",
              padding: "5px 10px",
              fontSize: 10,
            }}
          >
            APPLY
            <Icon name="arrow-right-thin" size={11} />
          </span>
        </div>
      </div>
    </Link>
  );
}
