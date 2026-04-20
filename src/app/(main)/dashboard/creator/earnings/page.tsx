import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EarningsClient from "./EarningsClient";

export default async function CreatorEarningsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/dashboard/creator/earnings");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_creator, role")
    .eq("id", user.id)
    .maybeSingle();
  const isCreator =
    profile?.is_creator === true || profile?.role === "content_creator";
  if (!isCreator) redirect("/creators/apply");

  return <EarningsClient />;
}
