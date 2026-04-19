import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TRUSTEE_AREA_NAMES } from "@/lib/districts";
import type { TrusteeArea } from "@/lib/districts";
import TrusteeDashboardClient from "./trustee-dashboard-client";

export const metadata = {
  title: "Trustee Dashboard | Knect",
  description: "Manage your trustee area — posts, messages, and programs.",
};

const AREA_COLORS: Record<TrusteeArea, string> = {
  A: "#3B82F6",
  B: "#8B5CF6",
  C: "#22C55E",
  D: "#F2A900",
  E: "#EF4444",
  F: "#EC4899",
  G: "#06B6D4",
};

export default async function TrusteeDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth?redirect=/trustee/dashboard");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "school_trustee") {
    redirect("/");
  }

  // Find the trustee's civic_official record to get their trustee_area
  const { data: official } = await supabase
    .from("civic_officials")
    .select("id, trustee_area, name, title")
    .eq("profile_id", user.id)
    .single();

  const trusteeArea = (official?.trustee_area ?? null) as TrusteeArea | null;

  if (!trusteeArea) {
    redirect("/");
  }

  const areaName = TRUSTEE_AREA_NAMES[trusteeArea] ?? `Area ${trusteeArea}`;
  const areaColor = AREA_COLORS[trusteeArea] ?? "#F2A900";

  return (
    <TrusteeDashboardClient
      trusteeArea={trusteeArea}
      areaName={areaName}
      areaColor={areaColor}
      userId={user.id}
      userName={profile.display_name ?? official?.name ?? "Trustee"}
    />
  );
}
