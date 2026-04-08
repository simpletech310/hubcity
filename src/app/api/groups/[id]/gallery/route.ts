import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: media, error } = await supabase
      .from("group_posts")
      .select("id, image_url, video_url, media_type, created_at, author:profiles!group_posts_author_id_fkey(id, display_name, avatar_url)")
      .eq("group_id", id)
      .eq("is_published", true)
      .or("image_url.neq.,video_url.neq.")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    return NextResponse.json({ media: media ?? [] });
  } catch (error) {
    console.error("Fetch group gallery error:", error);
    return NextResponse.json({ error: "Failed to fetch gallery" }, { status: 500 });
  }
}
