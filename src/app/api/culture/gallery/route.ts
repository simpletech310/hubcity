import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const exhibit_id = searchParams.get("exhibit_id");

    let query = supabase
      .from("gallery_items")
      .select("*, exhibit:museum_exhibits(id, title, slug)")
      .eq("is_published", true)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (type) query = query.eq("item_type", type);
    if (exhibit_id) query = query.eq("exhibit_id", exhibit_id);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ items: data ?? [] });
  } catch (error) {
    console.error("Gallery GET error:", error);
    return NextResponse.json({ error: "Failed to fetch gallery" }, { status: 500 });
  }
}
