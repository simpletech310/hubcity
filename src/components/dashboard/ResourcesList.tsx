"use client";

import { useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import type { Resource } from "@/types/database";

const statusVariants: Record<string, "emerald" | "coral" | "cyan" | "gold"> = {
  open: "emerald",
  closed: "coral",
  upcoming: "cyan",
  limited: "gold",
};

const categoryLabels: Record<string, string> = {
  business: "Business",
  housing: "Housing",
  health: "Health",
  youth: "Youth",
  jobs: "Jobs",
  food: "Food",
  legal: "Legal",
  senior: "Senior",
  education: "Education",
  veterans: "Veterans",
  utilities: "Utilities",
};

type CapacityStats = {
  pending: number;
  approved: number;
  total: number;
  approvalRate: number | null;
};

export default function ResourcesList({
  resources: initialResources,
  appCounts,
  capacityStats = {},
}: {
  resources: Resource[];
  appCounts: Record<string, number>;
  capacityStats?: Record<string, CapacityStats>;
}) {
  const [resources, setResources] = useState(initialResources);
  const [toggling, setToggling] = useState<string | null>(null);

  async function patchResource(id: string, patch: Partial<Resource>) {
    setToggling(id);

    // Optimistic
    setResources((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...patch } : r))
    );

    try {
      const res = await fetch(`/api/resources/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });

      if (!res.ok) {
        // Revert to original values
        setResources(initialResources);
      }
    } catch {
      setResources(initialResources);
    } finally {
      setToggling(null);
    }
  }

  function togglePublished(id: string, current: boolean) {
    patchResource(id, { is_published: !current });
  }

  function toggleAcceptsApplications(id: string, current: boolean) {
    patchResource(id, { accepts_applications: !current });
  }

  if (resources.length === 0) {
    return (
      <Card className="text-center py-10">
        <p className="text-txt-secondary text-sm">No resources yet</p>
        <p className="text-xs text-txt-secondary mt-1">
          Create your first resource to start accepting applications
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {resources.map((resource) => (
        <Card key={resource.id} className="space-y-2">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-semibold truncate">
                  {resource.name}
                </h3>
                <Badge
                  label={resource.status}
                  variant={statusVariants[resource.status] || "gold"}
                  size="sm"
                />
              </div>
              <p className="text-xs text-txt-secondary mt-0.5">
                {categoryLabels[resource.category] || resource.category}
                {resource.organization && ` · ${resource.organization}`}
              </p>
            </div>
          </div>

          {/* Capacity forecasting */}
          {(() => {
            const stats = capacityStats[resource.id];
            const spotsLeft = resource.max_spots != null
              ? Math.max(0, resource.max_spots - (resource.filled_spots ?? 0))
              : null;
            const pending = stats?.pending ?? 0;
            const approvalRate = stats?.approvalRate ?? null;
            const nearCapacity = spotsLeft != null && spotsLeft <= pending && pending > 0;
            return (
              <div className="flex items-center gap-2 flex-wrap mt-1">
                <div className="flex items-center gap-3 text-xs text-white/40">
                  <span>{spotsLeft != null ? spotsLeft : "∞"} spots left</span>
                  <span>·</span>
                  <span>{pending} pending</span>
                  {approvalRate !== null && (
                    <>
                      <span>·</span>
                      <span>{approvalRate}% approval rate</span>
                    </>
                  )}
                </div>
                {nearCapacity && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#f87171]/15 text-[#f87171]">
                    Near capacity
                  </span>
                )}
              </div>
            );
          })()}

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-3 text-xs text-txt-secondary">
              <span>
                {appCounts[resource.id] || 0} app
                {(appCounts[resource.id] || 0) !== 1 ? "s" : ""}
              </span>
              {resource.max_spots != null && (
                <span>
                  {resource.filled_spots ?? 0}/{resource.max_spots} spots
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Accepting Applications Toggle */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-txt-secondary">
                  {resource.accepts_applications ? "Open" : "Closed"}
                </span>
                <button
                  onClick={() =>
                    toggleAcceptsApplications(
                      resource.id,
                      resource.accepts_applications
                    )
                  }
                  disabled={toggling === resource.id}
                  aria-label={
                    resource.accepts_applications
                      ? "Close applications"
                      : "Open applications"
                  }
                  className={`relative w-10 h-5 rounded-full transition-colors ${
                    resource.accepts_applications
                      ? "bg-gold/30"
                      : "bg-card-hover"
                  } ${toggling === resource.id ? "opacity-50" : ""}`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform ${
                      resource.accepts_applications
                        ? "translate-x-5 bg-gold"
                        : "translate-x-0 bg-txt-secondary"
                    }`}
                  />
                </button>
              </div>

              {/* Published Toggle */}
              <button
                onClick={() =>
                  togglePublished(resource.id, resource.is_published)
                }
                disabled={toggling === resource.id}
                aria-label={
                  resource.is_published ? "Unpublish resource" : "Publish resource"
                }
                className={`relative w-10 h-5 rounded-full transition-colors ${
                  resource.is_published ? "bg-emerald/30" : "bg-card-hover"
                } ${toggling === resource.id ? "opacity-50" : ""}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform ${
                    resource.is_published
                      ? "translate-x-5 bg-emerald"
                      : "translate-x-0 bg-txt-secondary"
                  }`}
                />
              </button>

              {/* Edit Link */}
              <Link
                href={`/dashboard/resources/${resource.id}/edit`}
                className="text-xs text-gold font-medium px-2 py-1 hover:bg-gold/10 rounded-lg transition-colors"
              >
                Edit
              </Link>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
