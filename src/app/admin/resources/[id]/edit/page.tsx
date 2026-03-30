import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Resource } from "@/types/database";
import ResourceForm from "../../ResourceForm";

export default async function EditResourcePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("resources")
    .select("*")
    .eq("id", id)
    .single();

  if (!data) notFound();

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold mb-1">Edit Resource</h1>
        <p className="text-sm text-txt-secondary">
          Update {(data as Resource).name}
        </p>
      </div>
      <ResourceForm resource={data as Resource} />
    </div>
  );
}
