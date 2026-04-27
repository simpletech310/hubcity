import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * PATCH /api/tracks/[id]
 * Edit a track's display metadata. Creator-only (creator_id check).
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

    const { data: track } = await supabase
      .from("tracks")
      .select("id, creator_id")
      .eq("id", id)
      .single();
    if (!track) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    const isAdmin = profile?.role === "admin";
    const isCreator = track.creator_id === user.id;
    if (!isCreator && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const editable: Record<string, unknown> = {};
    const allowed = [
      "title",
      "track_number",
      "genre_slug",
      "explicit",
      "features",
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
      .from("tracks")
      .update(editable)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ track: data });
  } catch (err) {
    console.error("Track PATCH error:", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
