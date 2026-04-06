import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    let query = supabase
      .from("library_items")
      .select("*")
      .eq("is_published", true)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (type && type !== "all") query = query.eq("item_type", type);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ items: data ?? [] });
  } catch (error) {
    console.error("Library GET error:", error);
    return NextResponse.json({ error: "Failed to fetch library" }, { status: 500 });
  }
}
