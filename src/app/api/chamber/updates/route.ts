import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/chamber/updates — list chamber updates
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    let query = supabase
      .from("chamber_updates")
      .select("*, author:profiles!chamber_updates_author_id_fkey(display_name, avatar_url)")
      .eq("is_published", true)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });

    if (category) {
      query = query.eq("category", category);
    }

    const { data: updates, error } = await query.limit(50);
    if (error) throw error;

    return NextResponse.json({ updates: updates || [] });
  } catch (error) {
    console.error("Chamber updates fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch updates" }, { status: 500 });
  }
}

// POST /api/chamber/updates — create an update (chamber_admin/admin only)
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["chamber_admin", "admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const body = await request.json();
    const { title, body: updateBody, category, image_url, target_business_types, is_pinned } = body;

    if (!title?.trim() || !updateBody?.trim()) {
      return NextResponse.json({ error: "Title and body required" }, { status: 400 });
    }

    const { data: update, error } = await supabase
      .from("chamber_updates")
      .insert({
        author_id: user.id,
        title: title.trim(),
        body: updateBody.trim(),
        category: category || "general",
        image_url: image_url || null,
        target_business_types: target_business_types || null,
        is_pinned: is_pinned || false,
        is_published: true,
      })
      .select("*, author:profiles!chamber_updates_author_id_fkey(display_name, avatar_url)")
      .single();

    if (error) throw error;

    return NextResponse.json({ update });
  } catch (error) {
    console.error("Chamber update create error:", error);
    return NextResponse.json({ error: "Failed to create update" }, { status: 500 });
  }
}
