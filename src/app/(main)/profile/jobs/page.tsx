import { redirect } from "next/navigation";
import Link from "next/link";
import Card from "@/components/ui/Card";
import ApplicationStatusBadge from "@/components/jobs/ApplicationStatusBadge";
import { createClient } from "@/lib/supabase/server";
import type { JobApplication, JobListing, Business } from "@/types/database";
import Icon from "@/components/ui/Icon";

export default async function MyJobApplicationsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: applications } = await supabase
    .from("job_applications")
    .select(
      "*, job_listing:job_listings(id, title, slug, job_type, business:businesses(id, name, slug))"
    )
    .eq("applicant_id", user.id)
    .order("created_at", { ascending: false });

  const appList = (applications ?? []) as (JobApplication & {
    job_listing: JobListing & { business: Business };
  })[];

  return (
    <div className="culture-surface min-h-dvh animate-fade-in pb-24">
      {/* Header */}
      <div className="px-5 pt-6 pb-4 mb-4" style={{ borderBottom: "3px solid var(--rule-strong-c)" }}>
        <Link
          href="/profile"
          className="inline-flex items-center gap-1.5 text-sm font-semibold press mb-3"
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
          Back
        </Link>
        <p className="c-kicker">§ PROFILE · JOBS</p>
        <h1 className="c-hero">Your Jobs.</h1>
        <p className="c-serif-it">Applications you&apos;ve sent out.</p>
      </div>

      <div className="px-5 space-y-3">
        {appList.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-5xl block mb-3"><Icon name="briefcase" size={28} /></span>
            <p className="text-sm font-medium mb-1">No applications yet</p>
            <p className="text-xs c-meta mb-4">
              Browse the job board to find opportunities.
            </p>
            <Link href="/jobs">
              <span className="text-gold text-sm font-semibold press">
                Browse Jobs
              </span>
            </Link>
          </div>
        ) : (
          appList.map((app) => (
            <Link
              key={app.id}
              href={`/jobs/${app.job_listing?.slug || app.job_listing_id}`}
            >
              <Card hover>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[13px] font-bold truncate">
                      {app.job_listing?.title ?? "Job"}
                    </h3>
                    {app.job_listing?.business?.name && (
                      <p className="text-[11px] c-meta mt-0.5">
                        {app.job_listing.business.name}
                      </p>
                    )}
                    <p className="text-xs c-meta mt-1.5">
                      Applied{" "}
                      {new Date(app.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <ApplicationStatusBadge status={app.status} />
                </div>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
