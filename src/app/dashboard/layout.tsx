import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Business, Resource } from "@/types/database";
import DashboardShell from "./DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const allowedRoles = ["business_owner", "city_official", "city_ambassador", "admin", "chamber_admin", "resource_provider", "school_trustee", "content_creator"];
  if (!profile || !allowedRoles.includes(profile.role)) {
    redirect("/");
  }

  const userRole = profile.role;

  // Fetch business for business_owner
  let business: Business | null = null;
  if (userRole === "business_owner") {
    const { data } = await supabase
      .from("businesses")
      .select("*")
      .eq("owner_id", user.id)
      .single();

    if (data) {
      business = data as Business;
    }
  }

  // Fetch resources for city_official / admin
  let resources: Resource[] = [];
  if (userRole === "admin") {
    const { data } = await supabase
      .from("resources")
      .select("*")
      .order("created_at", { ascending: false });
    resources = (data ?? []) as Resource[];
  } else if (userRole === "city_official" || userRole === "resource_provider") {
    const { data } = await supabase
      .from("resources")
      .select("*")
      .eq("created_by", user.id)
      .order("created_at", { ascending: false });
    resources = (data ?? []) as Resource[];
  }

  return (
    <DashboardShell business={business} resources={resources} userRole={userRole}>
      {children}
    </DashboardShell>
  );
}
