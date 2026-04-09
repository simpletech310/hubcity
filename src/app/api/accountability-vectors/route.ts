import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const COUNCIL_TYPES = ["mayor", "council_member", "city_manager"];
const SCHOOL_BOARD_TYPES = [
  "school_trustee",
  "board_president",
  "board_vp",
  "board_clerk",
  "board_member",
  "superintendent",
];

// GET — List all accountability vectors with optional scope filter
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope");

    let query = supabase
      .from("accountability_vectors")
      .select("*")
      .order("sort_order", { ascending: true });

    if (scope === "council") {
      query = query.overlaps("applies_to", COUNCIL_TYPES);
    } else if (scope === "school_board") {
      query = query.overlaps("applies_to", SCHOOL_BOARD_TYPES);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ vectors: data ?? [] });
  } catch (error) {
    console.error("Accountability vectors fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch accountability vectors" },
      { status: 500 }
    );
  }
}
