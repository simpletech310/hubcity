import Link from "next/link";
import Icon from "@/components/ui/Icon";
import Tag from "@/components/ui/editorial/Tag";
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
        className="group block shrink-0 w-[280px] snap-start rounded-2xl panel-editorial p-4 press hover:border-gold/30 transition-colors"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="w-12 h-12 rounded-xl border border-gold/20 bg-ink flex items-center justify-center shrink-0 overflow-hidden">
            {businessImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={businessImage} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <Icon name={orgIconName} size={20} className="text-gold" />
            )}
          </div>
          <Tag tone="gold" size="xs">
            <Icon name="sparkle" size={9} />
            Featured
          </Tag>
        </div>
        <h3 className="font-display text-[17px] leading-tight text-white line-clamp-2 group-hover:text-gold transition-colors">
          {job.title}
        </h3>
        <p className="text-[11px] text-ivory/55 mt-1 truncate">
          {displayName}
        </p>
        {job.location && (
          <p className="text-[10px] text-ivory/40 mt-0.5 truncate uppercase tracking-editorial-tight">
            {job.location}
          </p>
        )}
        <div className="flex items-center gap-1.5 flex-wrap mt-3">
          <Tag tone="default" size="xs">
            <Icon name={meta.iconName} size={9} />
            {meta.label}
          </Tag>
          {salary && (
            <Tag tone="gold" size="xs">
              {salary}
            </Tag>
          )}
          {daysUntilDeadline !== null && daysUntilDeadline > 0 && daysUntilDeadline <= 14 && (
            <Tag tone={daysUntilDeadline <= 7 ? "coral" : "gold"} size="xs">
              <Icon name="clock" size={9} />
              {daysUntilDeadline <= 1 ? "1d" : `${daysUntilDeadline}d`}
            </Tag>
          )}
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/jobs/${job.slug || job.id}`}
      className="group block rounded-2xl panel-editorial press hover:border-gold/30 transition-colors overflow-hidden"
    >
      <div className="p-3.5 flex items-start gap-3">
        {/* Gold icon well */}
        <div className="w-12 h-12 rounded-xl border border-gold/20 bg-ink flex items-center justify-center shrink-0 overflow-hidden">
          {businessImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={businessImage} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            <Icon name={orgIconName} size={20} className="text-gold" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-display text-[17px] leading-tight text-white line-clamp-1 group-hover:text-gold transition-colors">
            {job.title}
          </h3>
          <p className="text-[11px] text-ivory/55 mt-0.5 truncate">
            {displayName}
            {job.location && (
              <>
                <span className="mx-1.5 text-ivory/25">·</span>
                {job.location}
              </>
            )}
          </p>

          <div className="flex items-center gap-1.5 flex-wrap mt-2">
            <Tag tone="default" size="xs">
              <Icon name={meta.iconName} size={9} />
              {meta.label}
            </Tag>
            {salary && (
              <Tag tone="gold" size="xs">
                {salary}
              </Tag>
            )}
            {job.job_type === "volunteer" && (
              <Tag tone="emerald" size="xs">Open</Tag>
            )}
            {daysUntilDeadline !== null && daysUntilDeadline > 0 && daysUntilDeadline <= 14 && (
              <Tag tone={daysUntilDeadline <= 7 ? "coral" : "gold"} size="xs">
                <Icon name="clock" size={9} />
                {daysUntilDeadline}d
              </Tag>
            )}
            <span className="text-[9px] text-ivory/35 uppercase tracking-editorial-tight font-semibold ml-auto">
              {timeAgo(job.created_at)}
            </span>
          </div>
        </div>

        {/* Apply CTA */}
        <div className="shrink-0 self-center flex flex-col items-end gap-0.5">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-editorial-tight text-gold group-hover:text-gold transition-colors">
            Apply
            <Icon name="arrow-right-thin" size={11} />
          </span>
        </div>
      </div>
    </Link>
  );
}
