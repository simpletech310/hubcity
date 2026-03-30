import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { GrantApplication, Resource, Profile } from "@/types/database";
import ApplicationsList from "@/components/dashboard/ApplicationsList";

export default async function ApplicationsPage() {
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
  if (userRole !== "admin" && userRole !== "city_official") {
    redirect("/dashboard");
  }

  // Get resource IDs for this manager
  let resourceQuery = supabase.from("resources").select("id");
  if (userRole === "city_official") {
    resourceQuery = resourceQuery.eq("created_by", user.id);
  }
  const { data: resourceRows } = await resourceQuery;
  const resourceIds = (resourceRows ?? []).map((r: { id: string }) => r.id);

  let applications: (GrantApplication & {
    applicant: Pick<Profile, "display_name"> | null;
    resource: Pick<Resource, "id" | "name" | "category"> | null;
  })[] = [];

  if (resourceIds.length > 0) {
    const { data } = await supabase
      .from("grant_applications")
      .select(
        "*, applicant:profiles(display_name), resource:resources(id, name, category)"
      )
      .in("resource_id", resourceIds)
      .order("created_at", { ascending: false });

    applications = (data ?? []) as typeof applications;
  }

  return (
    <div className="px-4 py-5">
      <h2 className="text-lg font-heading font-bold mb-4">Applications</h2>
      <ApplicationsList applications={applications} />
    </div>
  );
}
