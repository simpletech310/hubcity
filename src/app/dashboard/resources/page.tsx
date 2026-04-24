import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Resource } from "@/types/database";
import Button from "@/components/ui/Button";
import ResourcesList from "@/components/dashboard/ResourcesList";

export default async function ResourcesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const userRole = profile?.role;
  if (userRole !== "admin" && userRole !== "city_official" && userRole !== "resource_provider") {
    redirect("/dashboard");
  }

  // Fetch resources
  let query = supabase
    .from("resources")
    .select("*")
    .order("created_at", { ascending: false });

  if (userRole === "city_official" || userRole === "resource_provider") {
    query = query.eq("created_by", user.id);
  }

  const { data } = await query;
  const resources = (data ?? []) as Resource[];

  // Get application counts and status breakdown per resource
  const resourceIds = resources.map((r) => r.id);
  let appCounts: Record<string, number> = {};

  type CapacityStats = {
    pending: number;
    approved: number;
    total: number;
    approvalRate: number | null;
  };
  let capacityStats: Record<string, CapacityStats> = {};

  if (resourceIds.length > 0) {
    const { data: apps } = await supabase
      .from("grant_applications")
      .select("resource_id, status")
      .in("resource_id", resourceIds);

    if (apps) {
      for (const a of apps) {
        appCounts[a.resource_id] = (appCounts[a.resource_id] || 0) + 1;
      }

      // Build per-resource capacity stats
      for (const rid of resourceIds) {
        const appCounts_ = apps.filter((a) => a.resource_id === rid);
        const pending = appCounts_.filter((a) =>
          ["submitted", "under_review"].includes(a.status)
        ).length;
        const approved = appCounts_.filter((a) => a.status === "approved").length;
        const total = appCounts_.length;
        const approvalRate = total > 0 ? Math.round((approved / total) * 100) : null;
        capacityStats[rid] = { pending, approved, total, approvalRate };
      }
    }
  }

  return (
    <div className="px-4 py-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-heading font-bold">Resources</h2>
        <Link href="/dashboard/resources/new">
          <Button size="sm">+ New</Button>
        </Link>
      </div>
      <ResourcesList resources={resources} appCounts={appCounts} capacityStats={capacityStats} />
    </div>
  );
}
