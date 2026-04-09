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

// GET — List all civic officials with optional type filter
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    let query = supabase
      .from("civic_officials")
      .select("*, flag_count:official_flags(count)");

    if (type === "council") {
      query = query.in("official_type", COUNCIL_TYPES);
    } else if (type === "school_board") {
      query = query.in("official_type", SCHOOL_BOARD_TYPES);
    }

    // Order council members by district, trustees by trustee_area
    query = query
      .order("district", { ascending: true, nullsFirst: false })
      .order("trustee_area", { ascending: true, nullsFirst: true })
      .order("name", { ascending: true });

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ officials: data ?? [] });
  } catch (error) {
    console.error("Officials fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch officials" },
      { status: 500 }
    );
  }
}
