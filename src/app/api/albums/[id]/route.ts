import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * PATCH /api/albums/[id]
 * Edit an album's metadata. Creator-only (verified via creator_id).
 * Admin role bypasses ownership.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: album } = await supabase
      .from("albums")
      .select("id, creator_id")
      .eq("id", id)
      .single();
    if (!album) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    const isAdmin = profile?.role === "admin";
    const isCreator = album.creator_id === user.id;
    if (!isCreator && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const editable: Record<string, unknown> = {};
    const allowed = [
      "title",
      "description",
      "release_type",
      "cover_art_url",
      "genre_slug",
      "release_date",
      "is_published",
    ];
    for (const k of allowed) {
      if (k in body) editable[k] = body[k];
    }
    if (Object.keys(editable).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }
    editable.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("albums")
      .update(editable)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ album: data });
  } catch (err) {
    console.error("Album PATCH error:", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
