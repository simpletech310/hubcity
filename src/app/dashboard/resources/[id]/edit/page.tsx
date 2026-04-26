import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ResourceEditor from "@/components/dashboard/ResourceEditor";
import type { Resource } from "@/types/database";

export default async function EditResourcePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/dashboard/resources/${id}/edit`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const { data: resource } = await supabase
    .from("resources")
    .select("*")
    .eq("id", id)
    .maybeSingle<Resource>();

  if (!resource) notFound();

  const isOwner = resource.created_by === user.id;
  const isAdmin = profile?.role === "admin" || profile?.role === "city_ambassador";
  if (!isOwner && !isAdmin) {
    redirect("/dashboard/resources");
  }

  return <ResourceEditor initialResource={resource} />;
}
