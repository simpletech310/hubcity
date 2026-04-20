import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DISTRICT_NAMES } from "@/lib/districts";
import CouncilDashboardClient from "./CouncilDashboardClient";

export const metadata = {
  title: "Council Dashboard | Culture",
  description: "Manage your district — posts, events, programs, issues, and messages.",
};

const DISTRICT_COLORS: Record<number, string> = {
  1: "#3B82F6",
  2: "#8B5CF6",
  3: "#22C55E",
  4: "#F2A900",
};

export default async function CouncilDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth?redirect=/council/dashboard");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, role, district")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "city_official") {
    redirect("/profile");
  }

  const district = profile.district as number;
  if (!district || district < 1 || district > 4) {
    redirect("/profile");
  }

  const districtName = DISTRICT_NAMES[district] ?? `District ${district}`;
  const districtColor = DISTRICT_COLORS[district] ?? "#F2A900";

  return (
    <CouncilDashboardClient
      district={district}
      districtName={districtName}
      districtColor={districtColor}
      userId={user.id}
      userName={profile.display_name ?? "Council Member"}
    />
  );
}
