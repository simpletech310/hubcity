import { redirect } from "next/navigation";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/server";
import type { GrantApplication, Resource } from "@/types/database";

const statusLabels: Record<string, string> = {
  submitted: "Submitted",
  under_review: "Under Review",
  approved: "Approved",
  denied: "Denied",
  waitlisted: "Waitlisted",
  referred: "Referred",
  enrolled: "Enrolled",
  completed: "Completed",
  withdrawn: "Withdrawn",
};

const statusVariant: Record<string, "gold" | "emerald" | "coral" | "cyan" | "purple"> = {
  submitted: "gold",
  under_review: "cyan",
  approved: "emerald",
  denied: "coral",
  waitlisted: "purple",
  referred: "purple",
  enrolled: "emerald",
  completed: "emerald",
  withdrawn: "coral",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function MyApplicationsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: applications } = await supabase
    .from("grant_applications")
    .select("*, resource:resources(id, name, slug, organization, category)")
    .eq("applicant_id", user.id)
    .order("created_at", { ascending: false });

  const appList = (applications ?? []) as (GrantApplication & {
    resource: Resource;
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
        <p className="c-kicker">§ PROFILE · APPLICATIONS</p>
        <h1 className="c-hero">My Applications.</h1>
        <p className="c-serif-it">Grants, programs, and requests.</p>
      </div>

      <div className="px-5 space-y-3">
        {appList.length === 0 ? (
          <div className="text-center py-16">
            <p className="c-meta text-sm mb-4">
              No applications yet.
            </p>
            <Link href="/resources">
              <span className="text-gold text-sm font-semibold press">
                Browse Resources
              </span>
            </Link>
          </div>
        ) : (
          appList.map((app) => {
            const resourceHref = app.resource
              ? `/resources/${app.resource.slug || app.resource.id}`
              : null;
            const reviewedDifferent =
              app.reviewed_at && app.reviewed_at !== app.created_at;
            return (
              <Card key={app.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {resourceHref ? (
                      <Link
                        href={resourceHref}
                        className="text-[13px] font-bold hover:underline"
                      >
                        {app.resource?.name ?? "Resource"}
                      </Link>
                    ) : (
                      <h3 className="text-[13px] font-bold">
                        {app.resource?.name ?? "Resource"}
                      </h3>
                    )}
                    {app.resource?.organization && (
                      <p className="text-[11px] c-meta mt-0.5">
                        {app.resource.organization}
                      </p>
                    )}
                    <p className="text-xs c-meta mt-1.5">
                      Applied {formatDate(app.created_at)}
                      {reviewedDifferent && (
                        <> · Updated {formatDate(app.reviewed_at!)}</>
                      )}
                    </p>
                  </div>
                  <Badge
                    label={statusLabels[app.status] ?? app.status}
                    variant={statusVariant[app.status] ?? "gold"}
                  />
                </div>

                {/* Provider message */}
                {app.status_note && (
                  <div
                    className="mt-3 p-3"
                    style={{
                      background: "var(--paper-soft)",
                      border: "2px solid var(--rule-strong-c)",
                    }}
                  >
                    <p className="c-kicker mb-1" style={{ fontSize: 10, opacity: 0.6 }}>
                      § MESSAGE FROM PROVIDER
                    </p>
                    <p className="text-[13px]" style={{ lineHeight: 1.5 }}>
                      {app.status_note}
                    </p>
                  </div>
                )}

                {/* Follow-up date */}
                {app.follow_up_date && (
                  <p className="mt-2 text-xs c-meta">
                    Next step: <span className="font-semibold">{formatDate(app.follow_up_date)}</span>
                  </p>
                )}

                {/* Referred to */}
                {app.referred_to && (
                  <p className="mt-2 text-xs c-meta">
                    Referred to: <span className="font-semibold">{app.referred_to}</span>
                  </p>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
