import { notFound } from "next/navigation";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/server";
import type { JobListing, JobType } from "@/types/database";

const jobTypeBadge: Record<
  JobType,
  { label: string; variant: "gold" | "emerald" | "cyan" | "coral" | "purple" }
> = {
  full_time: { label: "Full-Time", variant: "emerald" },
  part_time: { label: "Part-Time", variant: "cyan" },
  contract: { label: "Contract", variant: "gold" },
  seasonal: { label: "Seasonal", variant: "coral" },
  internship: { label: "Internship", variant: "purple" },
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

  // Try slug first, then id
  let { data: job } = await supabase
    .from("job_listings")
    .select("*, business:businesses(id, name, slug, image_urls, address)")
    .eq("slug", id)
    .eq("is_active", true)
    .single();

  if (!job) {
    const { data } = await supabase
      .from("job_listings")
      .select("*, business:businesses(id, name, slug, image_urls, address)")
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

  // Increment views (fire-and-forget via API)
  // Server component can't easily do this, handled client-side or via API

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
  const salary = formatSalary(listing);

  return (
    <div className="animate-fade-in pb-24">
      {/* Header */}
      <div className="px-5 pt-4 mb-4">
        <Link
          href="/jobs"
          className="inline-flex items-center gap-1.5 text-gold text-sm font-semibold press"
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
          Back
        </Link>
      </div>

      {/* Business Info */}
      <div className="px-5 mb-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-xl overflow-hidden relative bg-white/5 flex items-center justify-center shrink-0">
            {business?.image_urls?.[0] ? (
              <img
                src={business.image_urls[0]}
                alt={business.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl">💼</span>
            )}
          </div>
          <div>
            <p className="text-sm text-txt-secondary">
              {business?.name ?? "Business"}
            </p>
            <h1 className="font-heading text-xl font-bold leading-tight">
              {listing.title}
            </h1>
          </div>
        </div>

        {/* Meta chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge label={badge.label} variant={badge.variant} size="md" />
          {listing.is_remote && <Badge label="Remote" variant="cyan" size="md" />}
          {salary && <Badge label={salary} variant="emerald" size="md" />}
        </div>

        {/* Details */}
        <div className="space-y-2 mb-5">
          {(listing.location || business?.address) && (
            <div className="flex items-center gap-2 text-sm text-txt-secondary">
              <span>📍</span>
              <span>{listing.location || business?.address?.split(",")[0]}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-txt-secondary">
            <span>📅</span>
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
              <span>⏰</span>
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
          <div className="flex items-center gap-2 text-sm text-txt-secondary">
            <span>📋</span>
            <span>{listing.application_count} application{listing.application_count !== 1 ? "s" : ""}</span>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="divider-subtle mx-5 mb-5" />

      {/* Description */}
      <div className="px-5 mb-5">
        <h2 className="font-heading font-bold text-base mb-2">Description</h2>
        <div className="text-sm text-txt-secondary leading-relaxed whitespace-pre-line">
          {listing.description}
        </div>
      </div>

      {/* Requirements */}
      {listing.requirements && (
        <>
          <div className="divider-subtle mx-5 mb-5" />
          <div className="px-5 mb-5">
            <h2 className="font-heading font-bold text-base mb-2">
              Requirements
            </h2>
            <div className="text-sm text-txt-secondary leading-relaxed whitespace-pre-line">
              {listing.requirements}
            </div>
          </div>
        </>
      )}

      {/* Apply Button */}
      <div className="px-5 mt-6">
        {hasApplied ? (
          <div className="w-full py-3 rounded-xl text-center bg-emerald/20 text-emerald border border-emerald/30 font-semibold text-sm">
            Applied ✓
          </div>
        ) : user ? (
          <Link
            href={`/jobs/${listing.slug || listing.id}/apply`}
            className="block w-full py-3 rounded-xl text-center bg-gradient-to-r from-gold to-gold-light text-midnight font-semibold text-sm press hover:opacity-90 transition-all"
          >
            Apply Now
          </Link>
        ) : (
          <Link
            href={`/login?redirect=/jobs/${listing.slug || listing.id}/apply`}
            className="block w-full py-3 rounded-xl text-center bg-gradient-to-r from-gold to-gold-light text-midnight font-semibold text-sm press hover:opacity-90 transition-all"
          >
            Sign in to Apply
          </Link>
        )}
      </div>
    </div>
  );
}
