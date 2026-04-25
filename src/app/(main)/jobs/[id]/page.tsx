import { notFound } from "next/navigation";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/server";
import type { JobListing, JobType } from "@/types/database";
import Icon from "@/components/ui/Icon";

const jobTypeBadge: Record<
  JobType,
  { label: string; variant: "gold" | "emerald" | "cyan" | "coral" | "purple" }
> = {
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

function formatSalary(job: JobListing): string | null {
  if (!job.salary_min && !job.salary_max) return null;
  const periodLabel = job.salary_type
    ? ({ hourly: "/hr", salary: "/yr", commission: "", tips: "" } as Record<string, string>)[
        job.salary_type
      ] ?? ""
    : "";
  const fmt = (n: number) =>
    job.salary_type === "hourly"
      ? `$${n}`
      : `$${n.toLocaleString()}`;

  if (job.salary_min && job.salary_max) {
    return `${fmt(job.salary_min)} - ${fmt(job.salary_max)}${periodLabel}`;
  }
  if (job.salary_min) return `From ${fmt(job.salary_min)}${periodLabel}`;
  if (job.salary_max) return `Up to ${fmt(job.salary_max)}${periodLabel}`;
  return null;
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const selectFields =
    "*, business:businesses(id, name, slug, image_urls, address), poster:profiles!job_listings_posted_by_fkey(id, display_name, avatar_url, role)";

  // Try slug first, then id
  let { data: job } = await supabase
    .from("job_listings")
    .select(selectFields)
    .eq("slug", id)
    .eq("is_active", true)
    .single();

  if (!job) {
    const { data } = await supabase
      .from("job_listings")
      .select(selectFields)
      .eq("id", id)
      .eq("is_active", true)
      .single();
    job = data;
  }

  if (!job) notFound();

  const listing = job as JobListing;
  const business = listing.business as {
    id: string;
    name: string;
    slug: string;
    image_urls?: string[];
    address?: string;
  } | null;
  const poster = listing.poster as {
    id: string;
    display_name: string;
    avatar_url: string | null;
    role: string;
  } | null;

  const isVolunteer = listing.job_type === "volunteer";
  const displayName = listing.organization_name || business?.name || poster?.display_name || "Organization";
  const orgIcon = listing.organization_type ? orgTypeIcon[listing.organization_type] ?? "" : "";
  const businessImage = business?.image_urls?.[0];

  // Check if current user has applied
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let hasApplied = false;
  if (user) {
    const { data: existing } = await supabase
      .from("job_applications")
      .select("id")
      .eq("job_listing_id", listing.id)
      .eq("applicant_id", user.id)
      .single();
    hasApplied = !!existing;
  }

  const badge = jobTypeBadge[listing.job_type] ?? {
    label: listing.job_type,
    variant: "gold" as const,
  };
  const salary = isVolunteer ? null : formatSalary(listing);

  return (
    <div className="culture-surface min-h-dvh animate-fade-in pb-24">
      {/* Masthead */}
      <div className="px-5 pt-5 pb-4" style={{ borderBottom: "3px solid var(--rule-strong-c)" }}>
        <Link
          href="/jobs"
          className="c-kicker inline-flex items-center gap-1.5 press"
          style={{ color: "var(--ink-strong)" }}
        >
          <svg
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M10 12L6 8l4-4" />
          </svg>
          § BACK TO JOBS
        </Link>
        <h1 className="c-hero mt-3" style={{ fontSize: 56, lineHeight: 0.88 }}>
          {listing.title.toUpperCase()}.
        </h1>
        <p className="c-serif-it mt-2">{displayName}</p>
      </div>

      {/* Volunteer banner */}
      {isVolunteer && (
        <div
          className="mx-5 mb-4 px-4 py-3 c-frame"
          style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)" }}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg"><Icon name="handshake" size={20} style={{ color: "var(--ink-strong)" }} /></span>
            <div>
              <p className="c-kicker" style={{ color: "var(--ink-strong)" }}>Volunteer Opportunity</p>
              <p className="c-meta">
                Give back to your community
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Organization / Business Info */}
      <div className="px-5 mb-5">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-14 h-14 overflow-hidden relative flex items-center justify-center shrink-0"
            style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)" }}
          >
            {businessImage ? (
              <img
                src={businessImage}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl">{orgIcon || "\uD83D\uDCBC"}</span>
            )}
          </div>
          <div>
            <p className="text-sm c-meta">
              {orgIcon && <span className="mr-1">{orgIcon}</span>}
              {business?.slug ? (
                <Link
                  href={`/business/${business.slug}`}
                  className="hover:text-gold transition-colors"
                >
                  {displayName}
                </Link>
              ) : (
                displayName
              )}
            </p>
            <h1 className="font-heading text-xl font-bold leading-tight" style={{ color: "var(--ink-strong)" }}>
              {listing.title}
            </h1>
          </div>
        </div>

        {/* Meta chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge label={badge.label} variant={badge.variant} size="md" />
          {listing.is_remote && <Badge label="Remote" variant="cyan" size="md" />}
          {salary && <Badge label={salary} variant="emerald" size="md" />}
          {listing.organization_type && listing.organization_type !== "business" && (
            <Badge
              label={listing.organization_type === "city" ? "City" : "School"}
              variant="purple"
              size="md"
            />
          )}
        </div>

        {/* Details */}
        <div className="space-y-2 mb-5">
          {(listing.location || business?.address) && (
            <div className="flex items-center gap-2 text-sm c-meta">
              <span><Icon name="pin" size={16} /></span>
              <span>{listing.location || business?.address?.split(",")[0]}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm c-meta">
            <span><Icon name="calendar" size={16} /></span>
            <span>
              Posted{" "}
              {new Date(listing.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
          {listing.application_deadline && (
            <div className="flex items-center gap-2 text-sm text-coral">
              <span><Icon name="clock" size={16} /></span>
              <span>
                Deadline:{" "}
                {new Date(listing.application_deadline).toLocaleDateString(
                  "en-US",
                  {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  }
                )}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm c-meta">
            <span><Icon name="document" size={16} /></span>
            <span>{listing.application_count} application{listing.application_count !== 1 ? "s" : ""}</span>
          </div>
          {listing.contact_email && (
            <div className="flex items-center gap-2 text-sm c-meta">
              <span><Icon name="mail" size={16} /></span>
              <span>{listing.contact_email}</span>
            </div>
          )}
          {listing.contact_phone && (
            <div className="flex items-center gap-2 text-sm c-meta">
              <span><Icon name="phone" size={16} /></span>
              <span>{listing.contact_phone}</span>
            </div>
          )}
        </div>

        {/* Posted by */}
        {poster && (
          <div
            className="flex items-center gap-2 mb-4 px-3 py-2 c-frame"
            style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)" }}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center overflow-hidden shrink-0"
              style={{ background: "var(--paper)", border: "2px solid var(--rule-strong-c)" }}
            >
              {poster.avatar_url ? (
                <img src={poster.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[10px] font-bold c-meta">
                  {poster.display_name?.[0]?.toUpperCase() ?? "?"}
                </span>
              )}
            </div>
            <p className="text-[11px] c-meta">
              Posted by <span className="font-medium" style={{ color: "var(--ink-strong)" }}>{poster.display_name}</span>
            </p>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="divider-subtle mx-5 mb-5" />

      {/* Description */}
      <div className="px-5 mb-5">
        <h2 className="font-heading font-bold text-base mb-2" style={{ color: "var(--ink-strong)" }}>Description</h2>
        <div className="text-sm c-meta leading-relaxed whitespace-pre-line">
          {listing.description}
        </div>
      </div>

      {/* Requirements */}
      {listing.requirements && (
        <>
          <div className="divider-subtle mx-5 mb-5" />
          <div className="px-5 mb-5">
            <h2 className="font-heading font-bold text-base mb-2" style={{ color: "var(--ink-strong)" }}>
              Requirements
            </h2>
            <div className="text-sm c-meta leading-relaxed whitespace-pre-line">
              {listing.requirements}
            </div>
          </div>
        </>
      )}

      {/* Apply Button */}
      <div className="px-5 mt-6">
        {hasApplied ? (
          <div className="c-badge-ok inline-flex items-center gap-2 px-4 py-2 w-full justify-center">
            Applied <Icon name="check" size={16} />
          </div>
        ) : user ? (
          <Link
            href={`/jobs/${listing.slug || listing.id}/apply`}
            className="c-btn c-btn-primary block w-full text-center press"
          >
            {isVolunteer ? "Volunteer Now" : "Apply Now"}
          </Link>
        ) : (
          <Link
            href={`/login?redirect=/jobs/${listing.slug || listing.id}/apply`}
            className="c-btn c-btn-primary block w-full text-center press"
          >
            Sign in to {isVolunteer ? "Volunteer" : "Apply"}
          </Link>
        )}
      </div>
    </div>
  );
}
