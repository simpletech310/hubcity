import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const { id: postId, commentId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify comment belongs to user
    const { data: comment } = await supabase
      .from("comments")
      .select("id, author_id:user_id")
      .eq("id", commentId)
      .single();

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Allow author or admin to delete
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isAdmin = profile?.role === "admin";
    const isAuthor = (comment as Record<string, unknown>).author_id === user.id;

    if (!isAuthor && !isAdmin) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Soft delete
    await supabase
      .from("comments")
      .update({ is_published: false })
      .eq("id", commentId);

    // Decrement comment count
    const { data: post } = await supabase
      .from("posts")
      .select("comment_count")
      .eq("id", postId)
      .single();

    if (post) {
      await supabase
        .from("posts")
        .update({ comment_count: Math.max(0, (post.comment_count || 1) - 1) })
        .eq("id", postId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Comment delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 }
    );
  }
}
