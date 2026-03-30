import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Event } from "@/types/database";
import EventForm from "../../EventForm";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .single();

  if (!data) notFound();

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold mb-1">Edit Event</h1>
        <p className="text-sm text-txt-secondary">
          Update {(data as Event).title}
        </p>
      </div>
      <EventForm event={data as Event} />
    </div>
  );
}
