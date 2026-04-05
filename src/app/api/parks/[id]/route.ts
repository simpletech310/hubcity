import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: park, error: parkError } = await supabase
    .from("parks")
    .select("*")
    .or(`id.eq.${id},slug.eq.${id}`)
    .single();

  if (parkError || !park) {
    return NextResponse.json(
      { error: "Park not found" },
      { status: 404 }
    );
  }

  const { data: programs } = await supabase
    .from("park_programs")
    .select("*")
    .eq("park_id", park.id)
    .order("name");

  return NextResponse.json({
    ...park,
    programs: programs ?? [],
  });
}
