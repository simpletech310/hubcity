import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import type { JobListing, JobType } from "@/types/database";

const jobTypeBadge: Record<JobType, { label: string; variant: "gold" | "emerald" | "cyan" | "coral" | "purple" }> = {
  full_time: { label: "Full-Time", variant: "emerald" },
  part_time: { label: "Part-Time", variant: "cyan" },
  contract: { label: "Contract", variant: "gold" },
  seasonal: { label: "Seasonal", variant: "coral" },
  internship: { label: "Internship", variant: "purple" },
  volunteer: { label: "Volunteer", variant: "gold" },
};

const orgTypeIcon: Record<string, string> = {
  business: "\uD83D\uDCBC",
  school: "\uD83C\uDF93",
  city: "\uD83C\uDFDB\uFE0F",
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

  if (job.salary_min && job.salary_max) {
    return `${fmt(job.salary_min)} - ${fmt(job.salary_max)}${job.salary_type ? `/${job.salary_type === "hourly" ? "hr" : job.salary_type === "salary" ? "yr" : job.salary_type === "commission" ? "comm" : "tips"}` : ""}`;
  }
  if (job.salary_min) {
    return `From ${fmt(job.salary_min)}${job.salary_type ? `/${job.salary_type === "hourly" ? "hr" : job.salary_type === "salary" ? "yr" : job.salary_type === "commission" ? "comm" : "tips"}` : ""}`;
  }
  if (job.salary_max) {
    return `Up to ${fmt(job.salary_max)}${job.salary_type ? `/${job.salary_type === "hourly" ? "hr" : job.salary_type === "salary" ? "yr" : job.salary_type === "commission" ? "comm" : "tips"}` : ""}`;
  }
  return null;
}

interface JobCardProps {
  job: JobListing;
}

export default function JobCard({ job }: JobCardProps) {
  const badge = jobTypeBadge[job.job_type] ?? { label: job.job_type, variant: "gold" as const };
  const salary = job.job_type !== "volunteer" ? formatSalary(job) : null;
  const business = job.business as { id: string; name: string; slug: string; image_urls?: string[] } | null;

  // Organization display: prefer organization_name, fall back to business name
  const displayName = job.organization_name || business?.name || "Organization";
  const orgIcon = job.organization_type ? orgTypeIcon[job.organization_type] ?? "" : "";
  const businessImage = business?.image_urls?.[0];

  return (
    <Link href={`/jobs/${job.slug || job.id}`}>
      <Card hover>
        <div className="flex gap-3">
          {/* Logo / Icon */}
          <div className="w-12 h-12 rounded-xl shrink-0 overflow-hidden relative bg-white/5 flex items-center justify-center">
            {businessImage ? (
              <img
                src={businessImage}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-lg">
                {orgIcon || "\uD83D\uDCBC"}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-heading font-bold text-[13px] mb-0.5 truncate">
              {job.title}
            </h3>
            <p className="text-[11px] text-txt-secondary mb-1.5 truncate">
              {orgIcon && <span className="mr-1">{orgIcon}</span>}
              {displayName}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge label={badge.label} variant={badge.variant} />
              {salary && (
                <span className="text-[10px] text-emerald font-semibold">
                  {salary}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1.5">
              {job.location && (
                <span className="text-[10px] text-txt-secondary truncate">
                  📍 {job.location}
                </span>
              )}
              <span className="text-[10px] text-txt-secondary">
                {timeAgo(job.created_at)}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
