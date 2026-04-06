import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Try slug first, then id
    let { data: exhibit } = await supabase
      .from("museum_exhibits")
      .select("*")
      .eq("slug", id)
      .eq("is_published", true)
      .single();

    if (!exhibit) {
      const { data } = await supabase
        .from("museum_exhibits")
        .select("*")
        .eq("id", id)
        .eq("is_published", true)
        .single();
      exhibit = data;
    }

    if (!exhibit) {
      return NextResponse.json({ error: "Exhibit not found" }, { status: 404 });
    }

    // Fetch related items
    const [galleryRes, peopleRes, libraryRes] = await Promise.all([
      supabase
        .from("gallery_items")
        .select("*")
        .eq("exhibit_id", exhibit.id)
        .eq("is_published", true)
        .order("display_order"),
      supabase
        .from("notable_people")
        .select("*")
        .eq("exhibit_id", exhibit.id)
        .eq("is_published", true)
        .order("display_order"),
      supabase
        .from("library_items")
        .select("*")
        .eq("exhibit_id", exhibit.id)
        .eq("is_published", true)
        .order("display_order"),
    ]);

    return NextResponse.json({
      exhibit,
      gallery_items: galleryRes.data ?? [],
      notable_people: peopleRes.data ?? [],
      library_items: libraryRes.data ?? [],
    });
  } catch (error) {
    console.error("Exhibit GET error:", error);
    return NextResponse.json({ error: "Failed to fetch exhibit" }, { status: 500 });
  }
}
