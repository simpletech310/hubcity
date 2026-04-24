import { createClient } from "@/lib/supabase/server";
import CitiesClient from "./CitiesClient";

export default async function AdminCitiesPage() {
  const supabase = await createClient();

  const { data: cities } = await supabase
    .from("cities")
    .select("id, name, slug, state, region, launch_status, tagline, display_order, is_active")
    .order("display_order", { ascending: true });

  return <CitiesClient cities={cities ?? []} />;
}
