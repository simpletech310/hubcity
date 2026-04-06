"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
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
  volunteer: { label: "Volunteer", variant: "gold" },
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

export default function DashboardJobsPage() {
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchJobs() {
      const res = await fetch("/api/dashboard/jobs");
      const data = await res.json();
      setJobs(data.jobs ?? []);
      setLoading(false);
    }
    fetchJobs();
  }, []);

  const activeJobs = jobs.filter((j) => j.is_active);
  const inactiveJobs = jobs.filter((j) => !j.is_active);

  async function toggleActive(jobId: string, currentActive: boolean) {
    await fetch(`/api/jobs/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !currentActive }),
    });
    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobId ? { ...j, is_active: !currentActive } : j
      )
    );
  }

  return (
    <div className="px-4 py-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-heading text-lg font-bold">Job Listings</h1>
          <p className="text-xs text-txt-secondary">
            {activeJobs.length} active listing{activeJobs.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/dashboard/jobs/new"
          className="px-4 py-2 bg-gradient-to-r from-gold to-gold-light text-midnight rounded-xl text-xs font-bold press hover:opacity-90 transition-all"
        >
          + Post Job
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-24 rounded-2xl" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16">
          <span className="text-5xl block mb-3">💼</span>
          <p className="text-sm font-medium mb-1">No job listings yet</p>
          <p className="text-xs text-txt-secondary mb-4">
            Post your first job or volunteer opportunity
          </p>
          <Link
            href="/dashboard/jobs/new"
            className="inline-block px-5 py-2.5 bg-gradient-to-r from-gold to-gold-light text-midnight rounded-xl text-xs font-bold press"
          >
            Post a Job
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Active Jobs */}
          {activeJobs.map((job) => {
            const badge = jobTypeBadge[job.job_type] ?? {
              label: job.job_type,
              variant: "gold" as const,
            };
            return (
              <Card key={job.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-heading font-bold text-[13px] mb-0.5 truncate">
                      {job.title}
                    </h3>
                    <p className="text-[11px] text-txt-secondary mb-1.5">
                      {job.organization_name ?? "Your listing"} · {timeAgo(job.created_at)}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge label={badge.label} variant={badge.variant} />
                      <span className="text-[10px] text-txt-secondary">
                        {job.application_count} application{job.application_count !== 1 ? "s" : ""}
                      </span>
                      <span className="text-[10px] text-txt-secondary">
                        {job.views_count} view{job.views_count !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Link
                      href={`/dashboard/jobs/${job.id}/applications`}
                      className="px-2.5 py-1.5 rounded-lg bg-white/5 text-[10px] font-semibold text-txt-secondary hover:text-white hover:bg-white/10 transition-colors"
                    >
                      Apps
                    </Link>
                    <Link
                      href={`/dashboard/jobs/${job.id}`}
                      className="px-2.5 py-1.5 rounded-lg bg-white/5 text-[10px] font-semibold text-txt-secondary hover:text-white hover:bg-white/10 transition-colors"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => toggleActive(job.id, job.is_active)}
                      className="px-2.5 py-1.5 rounded-lg bg-coral/10 text-[10px] font-semibold text-coral hover:bg-coral/20 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}

          {/* Inactive Jobs */}
          {inactiveJobs.length > 0 && (
            <>
              <p className="text-xs text-txt-secondary font-semibold mt-6 mb-2 px-1">
                Closed Listings
              </p>
              {inactiveJobs.map((job) => {
                const badge = jobTypeBadge[job.job_type] ?? {
                  label: job.job_type,
                  variant: "gold" as const,
                };
                return (
                  <Card key={job.id} className="opacity-60">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-heading font-bold text-[13px] mb-0.5 truncate">
                          {job.title}
                        </h3>
                        <p className="text-[11px] text-txt-secondary mb-1.5">
                          {job.organization_name ?? "Your listing"} · {timeAgo(job.created_at)}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge label={badge.label} variant={badge.variant} />
                          <Badge label="Closed" variant="coral" />
                        </div>
                      </div>
                      <button
                        onClick={() => toggleActive(job.id, job.is_active)}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald/10 text-[10px] font-semibold text-emerald hover:bg-emerald/20 transition-colors shrink-0"
                      >
                        Reopen
                      </button>
                    </div>
                  </Card>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}
