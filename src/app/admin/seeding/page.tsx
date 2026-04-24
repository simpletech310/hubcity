import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SeedingClient from "./SeedingClient";

export default async function AdminSeedingPage() {
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

  if (
    !profile ||
    !["city_official", "admin", "city_ambassador"].includes(profile.role)
  ) {
    redirect("/");
  }

  const { data: cities } = await supabase
    .from("cities")
    .select("id, name, slug")
    .order("name", { ascending: true });

  return <SeedingClient cities={cities ?? []} />;
}
