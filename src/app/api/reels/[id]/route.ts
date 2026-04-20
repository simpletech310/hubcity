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

  const { data: reel, error: fetchErr } = await supabase
    .from("reels")
    .select("id, author_id, video_path, poster_path")
    .eq("id", id)
    .single();

  if (fetchErr || !reel) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (reel.author_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Best-effort storage cleanup
  const paths = [reel.video_path, reel.poster_path].filter(
    (p): p is string => !!p
  );
  if (paths.length) {
    await supabase.storage.from("reels").remove(paths);
  }

  const { error: delErr } = await supabase.from("reels").delete().eq("id", id);
  if (delErr) {
    return NextResponse.json({ error: delErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
