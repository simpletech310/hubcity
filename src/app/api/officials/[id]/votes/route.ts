import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const COUNCIL_TYPES = ["mayor", "council_member"];
const SCHOOL_BOARD_TYPES = [
  "school_trustee",
  "board_president",
  "board_vp",
  "board_clerk",
  "board_member",
];

// GET — Voting record for an official
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // First get the official to determine type
    const { data: official, error: officialError } = await supabase
      .from("civic_officials")
      .select("id, official_type, name")
      .eq("id", id)
      .single();

    if (officialError || !official) {
      return NextResponse.json(
        { error: "Official not found" },
        { status: 404 }
      );
    }

    let votes;

    if (COUNCIL_TYPES.includes(official.official_type)) {
      // Council member or mayor — query council_vote_rolls
      const { data, error } = await supabase
        .from("council_vote_rolls")
        .select("*, vote:council_votes(*)")
        .eq("official_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      votes = data;
    } else if (SCHOOL_BOARD_TYPES.includes(official.official_type)) {
      // School board member — query board_action_rolls
      const { data, error } = await supabase
        .from("board_action_rolls")
        .select("*, action:board_actions(*)")
        .eq("official_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      votes = data;
    } else {
      // City manager, superintendent, etc. don't have voting records
      votes = [];
    }

    return NextResponse.json({ votes: votes ?? [] });
  } catch (error) {
    console.error("Official votes fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch voting record" },
      { status: 500 }
    );
  }
}
