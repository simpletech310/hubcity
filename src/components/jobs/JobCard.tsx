import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Icon from "@/components/ui/Icon";
import type { JobListing, JobType } from "@/types/database";
import type { IconName } from "@/components/ui/Icon";

const jobTypeBadge: Record<JobType, { label: string; variant: "gold" | "emerald" | "cyan" | "coral" | "purple"; iconName: IconName }> = {
  full_time: { label: "Full-Time", variant: "emerald", iconName: "building" },
  part_time: { label: "Part-Time", variant: "cyan", iconName: "clock" },
  contract: { label: "Contract", variant: "gold", iconName: "document" },
  seasonal: { label: "Seasonal", variant: "coral", iconName: "palm" },
  internship: { label: "Internship", variant: "purple", iconName: "graduation" },
  volunteer: { label: "Volunteer", variant: "gold", iconName: "handshake" },
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
  const badge = jobTypeBadge[job.job_type] ?? { label: job.job_type, variant: "gold" as const, iconName: "briefcase" as IconName };
  const salary = job.job_type !== "volunteer" ? formatSalary(job) : null;
  const business = job.business as { id: string; name: string; slug: string; image_urls?: string[] } | null;
  const displayName = job.organization_name || business?.name || "Organization";
  const orgIconName = job.organization_type ? orgTypeIconMap[job.organization_type] ?? "briefcase" : "briefcase";
  const businessImage = business?.image_urls?.[0];

  if (featured) {
    return (
      <Link href={`/jobs/${job.slug || job.id}`} className="block">
        <div className="glass-neon rounded-2xl p-5 glass-inner-light hover:border-gold/30 transition-all duration-300 press">
          <div className="flex items-start justify-between mb-3">
            <div className="w-14 h-14 rounded-xl shrink-0 overflow-hidden relative bg-white/5 flex items-center justify-center">
              {businessImage ? (
                <img src={businessImage} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <Icon name={orgIconName} size={24} className="text-gold" />
              )}
            </div>
            <Badge label="Featured" variant="gold" iconName="sparkle" shine />
          </div>
          <h3 className="font-display text-lg text-white mb-1">{job.title}</h3>
          <p className="text-xs text-txt-secondary mb-3 flex items-center gap-1.5">
            <Icon name={orgIconName} size={12} className="text-txt-secondary" />
            {displayName}
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <Badge label={badge.label} variant={badge.variant} iconName={badge.iconName} />
            {salary && (
              <span className="text-sm text-gold font-bold flex items-center gap-1">
                <Icon name="dollar" size={14} />
                {salary}
              </span>
            )}
          </div>
          {job.location && (
            <div className="flex items-center gap-1.5 mt-3 text-[11px] text-txt-secondary">
              <Icon name="pin" size={12} />
              {job.location}
            </div>
          )}
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/jobs/${job.slug || job.id}`}>
      <Card variant="glass" hover>
        <div className="flex gap-3">
          <div className="w-12 h-12 rounded-xl shrink-0 overflow-hidden relative bg-white/5 flex items-center justify-center">
            {businessImage ? (
              <img src={businessImage} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <Icon name={orgIconName} size={20} className="text-txt-secondary" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-heading font-bold text-[13px] mb-0.5 truncate">
              {job.title}
            </h3>
            <p className="text-[11px] text-txt-secondary mb-1.5 truncate flex items-center gap-1">
              <Icon name={orgIconName} size={10} className="shrink-0" />
              {displayName}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge label={badge.label} variant={badge.variant} iconName={badge.iconName} />
              {salary && (
                <span className="text-[10px] text-gold font-semibold flex items-center gap-0.5">
                  <Icon name="dollar" size={10} />
                  {salary}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1.5">
              {job.location && (
                <span className="text-[10px] text-txt-secondary truncate flex items-center gap-0.5">
                  <Icon name="pin" size={10} className="shrink-0" />
                  {job.location}
                </span>
              )}
              <span className="text-[10px] text-txt-secondary flex items-center gap-0.5">
                <Icon name="clock" size={10} className="shrink-0" />
                {timeAgo(job.created_at)}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
