import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import VenueForm from "../../VenueForm";
import type { Venue } from "@/types/database";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditVenuePage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: venue } = await supabase
    .from("venues")
    .select("*, sections:venue_sections(*)")
    .eq("id", id)
    .single();

  if (!venue) notFound();

  return (
    <div>
      <h1 className="text-2xl font-heading font-bold mb-6">Edit Venue</h1>
      <VenueForm venue={venue as Venue} />
    </div>
  );
}
