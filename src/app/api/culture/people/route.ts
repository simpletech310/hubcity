import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    let query = supabase
      .from("notable_people")
      .select("*")
      .eq("is_published", true)
      .order("display_order", { ascending: true })
      .order("name", { ascending: true });

    if (category && category !== "all") query = query.eq("category", category);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ people: data ?? [] });
  } catch (error) {
    console.error("People GET error:", error);
    return NextResponse.json({ error: "Failed to fetch people" }, { status: 500 });
  }
}
