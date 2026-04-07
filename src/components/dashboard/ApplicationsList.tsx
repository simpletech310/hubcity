"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import type { GrantApplication, Resource, Profile, ApplicationStatus } from "@/types/database";

type AppWithRelations = GrantApplication & {
  applicant: Pick<Profile, "display_name"> | null;
  resource: Pick<Resource, "id" | "name" | "category"> | null;
};

const statusColors: Record<string, "gold" | "emerald" | "cyan" | "coral"> = {
  submitted: "gold",
  under_review: "cyan",
  approved: "emerald",
  denied: "coral",
  waitlisted: "gold",
  referred: "cyan",
  enrolled: "emerald",
  completed: "emerald",
  withdrawn: "coral",
};

const filterOptions: { label: string; value: string }[] = [
  { label: "All", value: "all" },
  { label: "Submitted", value: "submitted" },
  { label: "Under Review", value: "under_review" },
  { label: "Approved", value: "approved" },
  { label: "Enrolled", value: "enrolled" },
  { label: "Waitlisted", value: "waitlisted" },
  { label: "Referred", value: "referred" },
  { label: "Denied", value: "denied" },
  { label: "Completed", value: "completed" },
  { label: "Withdrawn", value: "withdrawn" },
];

function timeAgo(date: string) {
  const seconds = Math.floor(
    (Date.now() - new Date(date).getTime()) / 1000
  );
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function ApplicationsList({
  applications: initialApps,
}: {
  applications: AppWithRelations[];
}) {
  const [applications, setApplications] = useState(initialApps);
  const [filter, setFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [statusNotes, setStatusNotes] = useState<Record<string, string>>({});
  const [internalNotes, setInternalNotes] = useState<Record<string, string>>({});
  const [updating, setUpdating] = useState<string | null>(null);

  const filtered =
    filter === "all"
      ? applications
      : applications.filter((a) => a.status === filter);

  async function updateStatus(id: string, status: ApplicationStatus) {
    setUpdating(id);
    const reviewerNotes = notes[id] || null;
    const statusNote = statusNotes[id] || null;
    const internalNote = internalNotes[id] || null;

    // Optimistic update
    setApplications((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              status,
              reviewer_notes: reviewerNotes ?? a.reviewer_notes,
              status_note: statusNote ?? a.status_note,
              internal_notes: internalNote ?? a.internal_notes,
              reviewed_at: new Date().toISOString(),
            }
          : a
      )
    );

    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          reviewer_notes: reviewerNotes,
          status_note: statusNote,
          internal_notes: internalNote,
        }),
      });

      if (!res.ok) {
        // Revert on failure
        setApplications(initialApps);
      }
    } catch {
      setApplications(initialApps);
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Filter Chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {filterOptions.map((opt) => {
          const count =
            opt.value === "all"
              ? applications.length
              : applications.filter((a) => a.status === opt.value).length;
          return (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                filter === opt.value
                  ? "bg-gold/15 text-gold border-gold/30"
                  : "bg-card text-txt-secondary border-border-subtle hover:text-white"
              }`}
            >
              {opt.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Applications List */}
      {filtered.length === 0 ? (
        <Card className="text-center py-10">
          <p className="text-txt-secondary text-sm">No applications found</p>
          <p className="text-xs text-txt-secondary mt-1">
            {filter === "all"
              ? "Applications will appear when people apply to your resources"
              : `No ${filter.replace("_", " ")} applications`}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((app) => {
            const isExpanded = expandedId === app.id;
            return (
              <Card key={app.id} className="space-y-3">
                {/* Header - clickable to expand */}
                <button
                  onClick={() =>
                    setExpandedId(isExpanded ? null : app.id)
                  }
                  className="w-full text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">
                          {app.applicant?.display_name || "Applicant"}
                        </span>
                        <Badge
                          label={app.status.replace("_", " ")}
                          variant={statusColors[app.status] || "gold"}
                          size="sm"
                        />
                      </div>
                      <p className="text-xs text-txt-secondary mt-0.5">
                        {app.resource?.name || "Resource"} &middot;{" "}
                        {timeAgo(app.created_at)}
                      </p>
                    </div>
                    <svg
                      width="16"
                      height="16"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                      className={`text-txt-secondary transition-transform ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="space-y-3 pt-2 border-t border-border-subtle">
                    {/* Form Data */}
                    {app.form_data &&
                      Object.entries(app.form_data).length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-txt-secondary uppercase tracking-wider">
                            Responses
                          </p>
                          {Object.entries(app.form_data).map(
                            ([key, value]) => (
                              <div key={key}>
                                <p className="text-xs text-txt-secondary">
                                  {key}
                                </p>
                                <p className="text-sm">{value}</p>
                              </div>
                            )
                          )}
                        </div>
                      )}

                    {/* Reviewer Notes */}
                    {app.reviewer_notes && (
                      <div>
                        <p className="text-xs font-semibold text-txt-secondary uppercase tracking-wider mb-1">
                          Reviewer Notes
                        </p>
                        <p className="text-sm text-txt-secondary">
                          {app.reviewer_notes}
                        </p>
                      </div>
                    )}

                    {/* Status Note */}
                    {app.status_note && (
                      <div>
                        <p className="text-xs font-semibold text-txt-secondary uppercase tracking-wider mb-1">
                          Status Note
                        </p>
                        <p className="text-sm text-txt-secondary">
                          {app.status_note}
                        </p>
                      </div>
                    )}

                    {/* Internal Notes */}
                    {app.internal_notes && (
                      <div>
                        <p className="text-xs font-semibold text-txt-secondary uppercase tracking-wider mb-1">
                          Internal Notes
                        </p>
                        <p className="text-sm text-txt-secondary">
                          {app.internal_notes}
                        </p>
                      </div>
                    )}

                    {/* Referred To */}
                    {app.referred_to && (
                      <div>
                        <p className="text-xs font-semibold text-txt-secondary uppercase tracking-wider mb-1">
                          Referred To
                        </p>
                        <p className="text-sm text-txt-secondary">
                          {app.referred_to}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    {app.status !== "completed" && app.status !== "withdrawn" && (
                      <div className="space-y-3">
                        <textarea
                          placeholder="Add reviewer notes..."
                          value={notes[app.id] ?? ""}
                          onChange={(e) =>
                            setNotes((prev) => ({
                              ...prev,
                              [app.id]: e.target.value,
                            }))
                          }
                          className="w-full bg-deep border border-border-subtle rounded-xl px-3 py-2 text-sm text-white placeholder:text-txt-secondary/50 focus:outline-none focus:border-gold/40 resize-none"
                          rows={2}
                        />
                        <textarea
                          placeholder="Status note (visible to applicant)..."
                          value={statusNotes[app.id] ?? ""}
                          onChange={(e) =>
                            setStatusNotes((prev) => ({
                              ...prev,
                              [app.id]: e.target.value,
                            }))
                          }
                          className="w-full bg-deep border border-border-subtle rounded-xl px-3 py-2 text-sm text-white placeholder:text-txt-secondary/50 focus:outline-none focus:border-gold/40 resize-none"
                          rows={2}
                        />
                        <textarea
                          placeholder="Internal notes (not visible to applicant)..."
                          value={internalNotes[app.id] ?? ""}
                          onChange={(e) =>
                            setInternalNotes((prev) => ({
                              ...prev,
                              [app.id]: e.target.value,
                            }))
                          }
                          className="w-full bg-deep border border-border-subtle rounded-xl px-3 py-2 text-sm text-white placeholder:text-txt-secondary/50 focus:outline-none focus:border-gold/40 resize-none"
                          rows={2}
                        />
                        <div className="flex gap-2 flex-wrap">
                          {app.status === "submitted" && (
                            <Button
                              variant="outline"
                              size="sm"
                              loading={updating === app.id}
                              onClick={() =>
                                updateStatus(app.id, "under_review")
                              }
                            >
                              Review
                            </Button>
                          )}
                          {(app.status === "submitted" || app.status === "under_review") && (
                            <>
                              <Button
                                variant="primary"
                                size="sm"
                                loading={updating === app.id}
                                onClick={() =>
                                  updateStatus(app.id, "approved")
                                }
                              >
                                Approve
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                loading={updating === app.id}
                                onClick={() =>
                                  updateStatus(app.id, "denied")
                                }
                              >
                                Deny
                              </Button>
                            </>
                          )}
                          {(app.status === "submitted" || app.status === "under_review" || app.status === "waitlisted") && (
                            <Button
                              variant="outline"
                              size="sm"
                              loading={updating === app.id}
                              onClick={() =>
                                updateStatus(app.id, "waitlisted")
                              }
                            >
                              Waitlist
                            </Button>
                          )}
                          {(app.status !== "enrolled" && app.status !== "denied") && (
                            <Button
                              variant="outline"
                              size="sm"
                              loading={updating === app.id}
                              onClick={() =>
                                updateStatus(app.id, "referred")
                              }
                            >
                              Refer
                            </Button>
                          )}
                          {(app.status === "approved" || app.status === "waitlisted") && (
                            <Button
                              variant="primary"
                              size="sm"
                              loading={updating === app.id}
                              onClick={() =>
                                updateStatus(app.id, "enrolled")
                              }
                            >
                              Enroll
                            </Button>
                          )}
                          {app.status === "enrolled" && (
                            <Button
                              variant="primary"
                              size="sm"
                              loading={updating === app.id}
                              onClick={() =>
                                updateStatus(app.id, "completed")
                              }
                            >
                              Complete
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            loading={updating === app.id}
                            onClick={() =>
                              updateStatus(app.id, "withdrawn")
                            }
                          >
                            Withdraw
                          </Button>
                        </div>
                      </div>
                    )}
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
