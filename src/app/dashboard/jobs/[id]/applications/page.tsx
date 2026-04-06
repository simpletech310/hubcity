"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import type { JobApplication, JobApplicationStatus } from "@/types/database";

const statusConfig: Record<
  JobApplicationStatus,
  { label: string; variant: "gold" | "emerald" | "cyan" | "coral" | "purple" }
> = {
  submitted: { label: "Submitted", variant: "gold" },
  reviewing: { label: "Reviewing", variant: "cyan" },
  interview: { label: "Interview", variant: "purple" },
  offered: { label: "Offered", variant: "emerald" },
  rejected: { label: "Rejected", variant: "coral" },
  withdrawn: { label: "Withdrawn", variant: "coral" },
};

const statusOptions: { value: JobApplicationStatus; label: string }[] = [
  { value: "submitted", label: "Submitted" },
  { value: "reviewing", label: "Reviewing" },
  { value: "interview", label: "Interview" },
  { value: "offered", label: "Offered" },
  { value: "rejected", label: "Rejected" },
];

interface ApplicationWithApplicant extends Omit<JobApplication, 'applicant'> {
  applicant?: {
    id: string;
    display_name: string;
    avatar_url: string | null;
    email?: string;
  };
}

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

export default function JobApplicationsPage() {
  const params = useParams();
  const jobId = params.id as string;

  const [applications, setApplications] = useState<ApplicationWithApplicant[]>(
    []
  );
  const [jobTitle, setJobTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      // Get job title
      const jobRes = await fetch(`/api/jobs/${jobId}`);
      if (jobRes.ok) {
        const jobData = await jobRes.json();
        setJobTitle(jobData.job?.title ?? "");
      }

      // Get applications
      const res = await fetch(`/api/jobs/${jobId}/applications`);
      if (res.ok) {
        const data = await res.json();
        setApplications(data.applications ?? []);
      }
      setLoading(false);
    }
    load();
  }, [jobId]);

  async function updateStatus(
    applicationId: string,
    newStatus: JobApplicationStatus
  ) {
    setUpdating(applicationId);
    try {
      const res = await fetch(`/api/jobs/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setApplications((prev) =>
          prev.map((a) =>
            a.id === applicationId ? { ...a, status: newStatus } : a
          )
        );
      }
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div className="px-4 py-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <Link
          href="/dashboard/jobs"
          className="text-gold text-sm font-semibold press"
        >
          <svg
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            className="inline mr-1"
          >
            <path d="M10 12L6 8l4-4" />
          </svg>
          Back
        </Link>
      </div>

      <h1 className="font-heading text-lg font-bold mb-0.5">Applications</h1>
      <p className="text-xs text-txt-secondary mb-5">
        {jobTitle && (
          <>
            For <span className="text-white font-medium">{jobTitle}</span> ·{" "}
          </>
        )}
        {applications.length} application{applications.length !== 1 ? "s" : ""}
      </p>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-24 rounded-2xl" />
          ))}
        </div>
      ) : applications.length === 0 ? (
        <div className="text-center py-16">
          <span className="text-5xl block mb-3">📋</span>
          <p className="text-sm font-medium mb-1">No applications yet</p>
          <p className="text-xs text-txt-secondary">
            Applications will appear here when residents apply
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => {
            const config = statusConfig[app.status] ?? {
              label: app.status,
              variant: "gold" as const,
            };
            const isExpanded = expandedId === app.id;

            return (
              <Card key={app.id}>
                <button
                  onClick={() =>
                    setExpandedId(isExpanded ? null : app.id)
                  }
                  className="w-full text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0 overflow-hidden">
                        {app.applicant?.avatar_url ? (
                          <img
                            src={app.applicant.avatar_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-bold text-txt-secondary">
                            {app.full_name?.[0]?.toUpperCase() ?? "?"}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-heading font-bold text-[13px]">
                          {app.full_name}
                        </p>
                        <p className="text-[11px] text-txt-secondary">
                          {timeAgo(app.created_at)}
                          {app.is_compton_resident && " · Compton resident"}
                        </p>
                      </div>
                    </div>
                    <Badge label={config.label} variant={config.variant} />
                  </div>
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-border-subtle space-y-3">
                    {/* Contact info */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-[10px] text-txt-secondary font-semibold uppercase mb-0.5">
                          Email
                        </p>
                        <p className="text-xs text-white">{app.email}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-txt-secondary font-semibold uppercase mb-0.5">
                          Phone
                        </p>
                        <p className="text-xs text-white">{app.phone}</p>
                      </div>
                    </div>

                    {/* Flags */}
                    <div className="flex gap-2">
                      {app.is_compton_resident && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald/10 text-emerald text-[10px] font-semibold">
                          Compton Resident
                        </span>
                      )}
                      {app.is_us_citizen && (
                        <span className="px-2 py-0.5 rounded-full bg-cyan/10 text-cyan text-[10px] font-semibold">
                          US Citizen
                        </span>
                      )}
                    </div>

                    {/* Cover note */}
                    {app.cover_note && (
                      <div>
                        <p className="text-[10px] text-txt-secondary font-semibold uppercase mb-0.5">
                          Cover Note
                        </p>
                        <p className="text-xs text-txt-secondary leading-relaxed whitespace-pre-line">
                          {app.cover_note}
                        </p>
                      </div>
                    )}

                    {/* References */}
                    {app.references_text && (
                      <div>
                        <p className="text-[10px] text-txt-secondary font-semibold uppercase mb-0.5">
                          References
                        </p>
                        <p className="text-xs text-txt-secondary leading-relaxed whitespace-pre-line">
                          {app.references_text}
                        </p>
                      </div>
                    )}

                    {/* Resume link */}
                    {app.resume_url && (
                      <a
                        href={app.resume_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-xs font-semibold text-gold hover:bg-white/10 transition-colors"
                      >
                        <svg
                          width="14"
                          height="14"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M7 2v8M4 7l3 3 3-3" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M2 11v1a1 1 0 001 1h8a1 1 0 001-1v-1" strokeLinecap="round" />
                        </svg>
                        View Resume
                      </a>
                    )}

                    {/* Status update */}
                    <div className="pt-2">
                      <p className="text-[10px] text-txt-secondary font-semibold uppercase mb-1.5">
                        Update Status
                      </p>
                      <div className="flex gap-1.5 flex-wrap">
                        {statusOptions.map((opt) => (
                          <button
                            key={opt.value}
                            disabled={
                              updating === app.id || app.status === opt.value
                            }
                            onClick={() => updateStatus(app.id, opt.value)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-colors ${
                              app.status === opt.value
                                ? "bg-gold/20 text-gold"
                                : "bg-white/5 text-txt-secondary hover:bg-white/10 hover:text-white"
                            } disabled:opacity-50`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
