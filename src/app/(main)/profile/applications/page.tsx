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
};

const statusVariant: Record<string, "gold" | "emerald" | "coral" | "cyan" | "purple"> = {
  submitted: "gold",
  under_review: "cyan",
  approved: "emerald",
  denied: "coral",
  waitlisted: "purple",
};

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
          appList.map((app) => (
            <Card key={app.id}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-[13px] font-bold">
                    {app.resource?.name ?? "Resource"}
                  </h3>
                  {app.resource?.organization && (
                    <p className="text-[11px] c-meta mt-0.5">
                      {app.resource.organization}
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
                <Badge
                  label={statusLabels[app.status] ?? app.status}
                  variant={statusVariant[app.status] ?? "gold"}
                />
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
