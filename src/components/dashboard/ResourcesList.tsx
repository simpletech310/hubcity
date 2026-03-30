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

export default function ResourcesList({
  resources: initialResources,
  appCounts,
}: {
  resources: Resource[];
  appCounts: Record<string, number>;
}) {
  const [resources, setResources] = useState(initialResources);
  const [toggling, setToggling] = useState<string | null>(null);

  async function togglePublished(id: string, current: boolean) {
    setToggling(id);

    // Optimistic
    setResources((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, is_published: !current } : r
      )
    );

    try {
      const res = await fetch(`/api/resources/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_published: !current }),
      });

      if (!res.ok) {
        // Revert
        setResources((prev) =>
          prev.map((r) =>
            r.id === id ? { ...r, is_published: current } : r
          )
        );
      }
    } catch {
      setResources((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, is_published: current } : r
        )
      );
    } finally {
      setToggling(null);
    }
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

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-3 text-xs text-txt-secondary">
              {resource.accepts_applications && (
                <span>
                  {appCounts[resource.id] || 0} application
                  {(appCounts[resource.id] || 0) !== 1 ? "s" : ""}
                </span>
              )}
              <span
                className={
                  resource.is_published ? "text-emerald" : "text-coral"
                }
              >
                {resource.is_published ? "Published" : "Draft"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Published Toggle */}
              <button
                onClick={() =>
                  togglePublished(resource.id, resource.is_published)
                }
                disabled={toggling === resource.id}
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
