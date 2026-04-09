import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET — Single board action with full roll call
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: action, error: actionError } = await supabase
      .from("board_actions")
      .select("*")
      .eq("id", id)
      .single();

    if (actionError || !action) {
      return NextResponse.json(
        { error: "Board action not found" },
        { status: 404 }
      );
    }

    const { data: rolls, error: rollsError } = await supabase
      .from("board_action_rolls")
      .select(
        "*, official:civic_officials(name, title, trustee_area, photo_url)"
      )
      .eq("action_id", id);

    if (rollsError) throw rollsError;

    return NextResponse.json({ action, rolls: rolls ?? [] });
  } catch (error) {
    console.error("Board action fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch board action" },
      { status: 500 }
    );
  }
}
