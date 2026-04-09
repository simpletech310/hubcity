import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET — List all council votes with optional filters
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const impact = searchParams.get("impact");

    let query = supabase.from("council_votes").select("*", { count: "exact" });

    if (category) {
      query = query.eq("category", category);
    }

    if (impact) {
      query = query.eq("impact", impact);
    }

    query = query.order("created_at", { ascending: false });

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({ votes: data ?? [], total: count ?? 0 });
  } catch (error) {
    console.error("Council votes fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch council votes" },
      { status: 500 }
    );
  }
}
