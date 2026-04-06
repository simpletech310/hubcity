import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    let { data: item } = await supabase
      .from("library_items")
      .select("*, exhibit:museum_exhibits(id, title, slug)")
      .eq("slug", id)
      .eq("is_published", true)
      .single();

    if (!item) {
      const { data } = await supabase
        .from("library_items")
        .select("*, exhibit:museum_exhibits(id, title, slug)")
        .eq("id", id)
        .eq("is_published", true)
        .single();
      item = data;
    }

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({ item });
  } catch (error) {
    console.error("Library item GET error:", error);
    return NextResponse.json({ error: "Failed to fetch item" }, { status: 500 });
  }
}
