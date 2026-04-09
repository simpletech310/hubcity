import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET — Single council vote with full roll call
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: vote, error: voteError } = await supabase
      .from("council_votes")
      .select("*")
      .eq("id", id)
      .single();

    if (voteError || !vote) {
      return NextResponse.json(
        { error: "Council vote not found" },
        { status: 404 }
      );
    }

    const { data: rolls, error: rollsError } = await supabase
      .from("council_vote_rolls")
      .select(
        "*, official:civic_officials(name, title, district, photo_url)"
      )
      .eq("vote_id", id);

    if (rollsError) throw rollsError;

    return NextResponse.json({ vote, rolls: rolls ?? [] });
  } catch (error) {
    console.error("Council vote fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch council vote" },
      { status: 500 }
    );
  }
}
