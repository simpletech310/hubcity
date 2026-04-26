import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { JobListing, JobType } from "@/types/database";
import Icon from "@/components/ui/Icon";

const jobTypeLabel: Record<JobType, string> = {
  full_time: "Full-Time",
  part_time: "Part-Time",
  contract: "Contract",
  seasonal: "Seasonal",
  internship: "Internship",
  volunteer: "Volunteer",
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

  const typeLabel = jobTypeLabel[listing.job_type] ?? listing.job_type;
  const salary = isVolunteer ? null : formatSalary(listing);

  // Parse requirements as a bulleted list when each line starts with `- `.
  const reqText = listing.requirements?.trim() ?? "";
  const reqLines = reqText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const isBulleted = reqLines.length > 0 && reqLines.every((l) => l.startsWith("- "));
  const reqBullets = isBulleted ? reqLines.map((l) => l.replace(/^-\s+/, "")) : null;

  return (
    <div className="culture-surface min-h-dvh animate-fade-in pb-24">
      {/* Masthead */}
      <div
        className="px-5 pt-5 pb-5"
        style={{ borderBottom: "3px solid var(--rule-strong-c)" }}
      >
        <Link
          href="/jobs"
          className="c-kicker inline-flex items-center gap-1.5 press"
          style={{ color: "var(--ink-strong)", letterSpacing: "0.14em", fontSize: 11 }}
        >
          <svg
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M10 12L6 8l4-4" />
          </svg>
          § BACK TO JOBS
        </Link>

        <p
          className="c-kicker mt-4"
          style={{
            color: "var(--ink-strong)",
            opacity: 0.65,
            fontSize: 10,
            letterSpacing: "0.18em",
          }}
        >
          § JOB POSTING
        </p>
        <h1
          className="c-hero mt-1"
          style={{ fontSize: 44, lineHeight: 0.92, letterSpacing: "-0.012em" }}
        >
          {listing.title.toUpperCase()}.
        </h1>
        <p
          className="c-serif-it mt-2"
          style={{ fontSize: 16, color: "var(--ink-strong)", opacity: 0.85 }}
        >
          {displayName}
        </p>

        {/* Hub City badges */}
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <span className="c-badge c-badge-ink">{typeLabel}</span>
          {salary && <span className="c-badge c-badge-gold">{salary}</span>}
          {listing.is_remote && <span className="c-badge c-badge-gold">Remote</span>}
          {isVolunteer && <span className="c-badge c-badge-ok">Volunteer</span>}
        </div>
      </div>

      {/* Org card */}
      <div className="px-5 pt-5">
        <div
          className="flex items-center gap-3 px-3 py-3 c-frame"
          style={{ background: "var(--paper-warm)" }}
        >
          <div
            className="w-12 h-12 overflow-hidden flex items-center justify-center shrink-0"
            style={{
              background: "var(--paper)",
              border: "2px solid var(--rule-strong-c)",
            }}
          >
            {businessImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={businessImage}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xl">{orgIcon || "\uD83D\uDCBC"}</span>
            )}
          </div>
          <div className="min-w-0">
            <p
              className="c-kicker"
              style={{ fontSize: 9, letterSpacing: "0.16em", opacity: 0.65 }}
            >
              POSTED BY
            </p>
            {business?.slug ? (
              <Link
                href={`/business/${business.slug}`}
                className="c-card-t truncate block"
                style={{ color: "var(--ink-strong)", fontSize: 14 }}
              >
                {displayName}
              </Link>
            ) : (
              <p
                className="c-card-t truncate"
                style={{ color: "var(--ink-strong)", fontSize: 14 }}
              >
                {displayName}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Detail rows */}
      <div className="px-5 pt-4">
        <ul
          className="space-y-2"
          style={{ color: "var(--ink-strong)", fontFamily: "var(--font-body), Inter, sans-serif" }}
        >
          {(listing.location || business?.address) && (
            <li className="flex items-center gap-2 text-[14px]">
              <Icon name="pin" size={15} />
              <span>{listing.location || business?.address?.split(",")[0]}</span>
            </li>
          )}
          <li className="flex items-center gap-2 text-[14px]">
            <Icon name="calendar" size={15} />
            <span>
              Posted{" "}
              {new Date(listing.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </li>
          {listing.application_deadline && (
            <li
              className="flex items-center gap-2 text-[14px]"
              style={{ color: "var(--red-c, #c0392b)" }}
            >
              <Icon name="clock" size={15} />
              <span>
                Deadline{" "}
                {new Date(listing.application_deadline).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </li>
          )}
          <li className="flex items-center gap-2 text-[14px]">
            <Icon name="document" size={15} />
            <span>
              {listing.application_count} application
              {listing.application_count !== 1 ? "s" : ""}
            </span>
          </li>
          {listing.contact_email && (
            <li className="flex items-center gap-2 text-[14px]">
              <Icon name="mail" size={15} />
              <span>{listing.contact_email}</span>
            </li>
          )}
          {listing.contact_phone && (
            <li className="flex items-center gap-2 text-[14px]">
              <Icon name="phone" size={15} />
              <span>{listing.contact_phone}</span>
            </li>
          )}
        </ul>
      </div>

      {/* Description */}
      <div className="px-5 pt-7">
        <p
          className="c-kicker mb-2"
          style={{ fontSize: 10, letterSpacing: "0.18em", color: "var(--ink-strong)", opacity: 0.65 }}
        >
          § DESCRIPTION
        </p>
        <div className="c-rule-hair mb-3" />
        <p
          className="c-body whitespace-pre-line"
          style={{ fontSize: 15, lineHeight: 1.55 }}
        >
          {listing.description}
        </p>
      </div>

      {/* Requirements */}
      {listing.requirements && (
        <div className="px-5 pt-7">
          <p
            className="c-kicker mb-2"
            style={{ fontSize: 10, letterSpacing: "0.18em", color: "var(--ink-strong)", opacity: 0.65 }}
          >
            § REQUIREMENTS
          </p>
          <div className="c-rule-hair mb-3" />
          {reqBullets ? (
            <ul className="space-y-2">
              {reqBullets.map((b, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 c-body"
                  style={{ fontSize: 15, lineHeight: 1.5 }}
                >
                  <span
                    className="shrink-0"
                    style={{
                      color: "var(--gold-c)",
                      marginTop: 8,
                      width: 6,
                      height: 6,
                      background: "var(--gold-c)",
                      border: "1px solid var(--ink-strong)",
                      display: "inline-block",
                    }}
                  />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p
              className="c-body whitespace-pre-line"
              style={{ fontSize: 15, lineHeight: 1.55 }}
            >
              {listing.requirements}
            </p>
          )}
        </div>
      )}

      {/* Posted-by attribution (compact) */}
      {poster && poster.display_name && (
        <div className="px-5 pt-6">
          <div
            className="flex items-center gap-2 px-3 py-2"
            style={{
              background: "var(--paper-warm)",
              border: "2px solid var(--rule-strong-c)",
            }}
          >
            <div
              className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center shrink-0"
              style={{ background: "var(--paper)", border: "2px solid var(--rule-strong-c)" }}
            >
              {poster.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={poster.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span
                  className="c-card-t"
                  style={{ fontSize: 10, color: "var(--ink-strong)" }}
                >
                  {poster.display_name?.[0]?.toUpperCase() ?? "?"}
                </span>
              )}
            </div>
            <p
              className="c-meta"
              style={{ fontSize: 11, color: "var(--ink-strong)", opacity: 0.85 }}
            >
              Posted by{" "}
              <span style={{ fontWeight: 700, opacity: 1 }}>{poster.display_name}</span>
            </p>
          </div>
        </div>
      )}

      {/* Apply Button */}
      <div className="px-5 mt-7">
        {hasApplied ? (
          <div className="c-badge-ok inline-flex items-center gap-2 px-4 py-3 w-full justify-center">
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
