import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import GrantApplicationForm from "@/components/booking/GrantApplicationForm";
import type { Resource } from "@/types/database";

export default async function GrantApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Try slug first, then id
  let { data: resource } = await supabase
    .from("resources")
    .select("*")
    .eq("slug", id)
    .single();

  if (!resource) {
    const { data } = await supabase
      .from("resources")
      .select("*")
      .eq("id", id)
      .single();
    resource = data;
  }

  if (!resource) notFound();

  const res = resource as Resource;

  if (!res.accepts_applications) {
    notFound();
  }

  return <GrantApplicationForm resource={res} />;
}
