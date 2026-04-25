import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * DELETE /api/groups/[id]/gallery/[itemId]
 * Admins / moderators (or the original uploader) may delete a curated
 * gallery item. Also removes the underlying Storage object.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id: groupId, itemId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch the item to find storage paths and verify ownership
    const { data: item } = await supabase
      .from("group_gallery_items")
      .select("uploaded_by, media_path, poster_path")
      .eq("id", itemId)
      .eq("group_id", groupId)
      .single();

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Permission: uploader OR group admin
    const { data: membership } = await supabase
      .from("group_members")
      .select("role, status")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .single();

    const isAdmin =
      membership?.status === "active" &&
      ["admin", "moderator"].includes(membership.role);

    if (item.uploaded_by !== user.id && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Best-effort storage cleanup. Path layout: "{userId}/{file}" — we read
    // off whichever bucket they were uploaded to.
    const storagePaths: string[] = [];
    if (item.media_path) storagePaths.push(item.media_path);
    if (item.poster_path) storagePaths.push(item.poster_path);

    if (storagePaths.length > 0) {
      // Try common buckets; ignore errors so DB delete still proceeds.
      await supabase.storage.from("group-media").remove(storagePaths).catch(() => {});
    }

    const { error } = await supabase
      .from("group_gallery_items")
      .delete()
      .eq("id", itemId)
      .eq("group_id", groupId);

    if (error) throw error;

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("Delete gallery item error:", error);
    return NextResponse.json(
      { error: "Failed to delete gallery item" },
      { status: 500 }
    );
  }
}
