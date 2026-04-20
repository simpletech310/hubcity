import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch row first to confirm ownership + derive storage path
  const { data: row, error: selectError } = await supabase
    .from("profile_gallery_images")
    .select("id, owner_id, image_url")
    .eq("id", id)
    .single();

  if (selectError || !row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (row.owner_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Best-effort storage cleanup: parse path segment after "/post-images/"
  try {
    const marker = "/post-images/";
    const idx = row.image_url.indexOf(marker);
    if (idx >= 0) {
      const path = row.image_url.slice(idx + marker.length);
      await supabase.storage.from("post-images").remove([path]);
    }
  } catch {
    // Non-fatal — continue to delete the DB row
  }

  const { error: deleteError } = await supabase
    .from("profile_gallery_images")
    .delete()
    .eq("id", id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
