import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if bookmark exists
    const { data: existing } = await supabase
      .from("post_bookmarks")
      .select("post_id")
      .match({ post_id: postId, user_id: user.id })
      .single();

    if (existing) {
      await supabase
        .from("post_bookmarks")
        .delete()
        .match({ post_id: postId, user_id: user.id });

      return NextResponse.json({ bookmarked: false });
    } else {
      await supabase
        .from("post_bookmarks")
        .insert({ post_id: postId, user_id: user.id });

      return NextResponse.json({ bookmarked: true });
    }
  } catch (error) {
    console.error("Bookmark error:", error);
    return NextResponse.json(
      { error: "Failed to update bookmark" },
      { status: 500 }
    );
  }
}
