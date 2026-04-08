import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const { commentId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if like exists
    const { data: existing } = await supabase
      .from("comment_likes")
      .select("comment_id")
      .match({ comment_id: commentId, user_id: user.id })
      .single();

    if (existing) {
      await supabase
        .from("comment_likes")
        .delete()
        .match({ comment_id: commentId, user_id: user.id });
    } else {
      await supabase
        .from("comment_likes")
        .insert({ comment_id: commentId, user_id: user.id });
    }

    // Get count
    const { count } = await supabase
      .from("comment_likes")
      .select("*", { count: "exact", head: true })
      .eq("comment_id", commentId);

    return NextResponse.json({
      liked: !existing,
      like_count: count || 0,
    });
  } catch (error) {
    console.error("Comment like error:", error);
    return NextResponse.json(
      { error: "Failed to update like" },
      { status: 500 }
    );
  }
}
