import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Business } from "@/types/database";
import BusinessForm from "../../BusinessForm";

export default async function EditBusinessPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", id)
    .single();

  if (!data) notFound();

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold mb-1">Edit Business</h1>
        <p className="text-sm text-txt-secondary">
          Update {(data as Business).name}
        </p>
      </div>
      <BusinessForm business={data as Business} />
    </div>
  );
}
