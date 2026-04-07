import { createClient } from "@/lib/supabase/server";
import PeopleClient from "./people-client";

export const metadata = {
  title: "People | Hub City",
  description: "Community directory for Compton, CA",
};

/** Role priority for display ordering: officials first */
const ROLE_PRIORITY: Record<string, number> = {
  city_official: 0,
  city_ambassador: 1,
  admin: 2,
  business_owner: 3,
  content_creator: 4,
  creator: 4,
  resource_provider: 5,
  chamber_admin: 6,
  school: 7,
};

export default async function PeoplePage() {
  const supabase = await createClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select(
      "id, display_name, handle, avatar_url, role, verification_status, bio"
    )
    .order("created_at", { ascending: true })
    .limit(100);

  // Filter out citizens — only showcase notable roles
  const notable = (profiles ?? []).filter((p) => p.role !== "citizen");

  // Sort by role priority
  const sorted = notable.sort((a, b) => {
    const pa = ROLE_PRIORITY[a.role] ?? 99;
    const pb = ROLE_PRIORITY[b.role] ?? 99;
    return pa - pb;
  });

  return <PeopleClient profiles={sorted} />;
}
