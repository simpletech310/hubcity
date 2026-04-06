import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const era = searchParams.get("era");
    const featured = searchParams.get("featured");

    let query = supabase
      .from("museum_exhibits")
      .select("*")
      .eq("is_published", true)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (era) query = query.eq("era", era);
    if (featured === "true") query = query.eq("is_featured", true);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ exhibits: data ?? [] });
  } catch (error) {
    console.error("Exhibits GET error:", error);
    return NextResponse.json({ error: "Failed to fetch exhibits" }, { status: 500 });
  }
}
