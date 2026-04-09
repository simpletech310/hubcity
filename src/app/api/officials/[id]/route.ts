import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET — Single official by ID with full details and flags
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: official, error: officialError } = await supabase
      .from("civic_officials")
      .select("*")
      .eq("id", id)
      .single();

    if (officialError || !official) {
      return NextResponse.json(
        { error: "Official not found" },
        { status: 404 }
      );
    }

    const { data: flags, error: flagsError } = await supabase
      .from("official_flags")
      .select("*")
      .eq("official_id", id)
      .order("created_at", { ascending: false });

    if (flagsError) throw flagsError;

    return NextResponse.json({ official, flags: flags ?? [] });
  } catch (error) {
    console.error("Official fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch official" },
      { status: 500 }
    );
  }
}
