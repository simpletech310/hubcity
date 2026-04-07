import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// DELETE — soft-delete comment (author or admin/mod)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; postId: string; commentId: string }> }
) {
  try {
    const { id: groupId, postId, commentId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get comment
    const { data: comment } = await supabase
      .from("group_post_comments")
      .select("author_id")
      .eq("id", commentId)
      .eq("group_post_id", postId)
      .single();

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    const isAuthor = comment.author_id === user.id;
    if (!isAuthor) {
      const { data: membership } = await supabase
        .from("group_members")
        .select("role")
        .eq("group_id", groupId)
        .eq("user_id", user.id)
        .single();

      if (!membership || !["admin", "moderator"].includes(membership.role)) {
        return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
      }
    }

    await supabase
      .from("group_post_comments")
      .update({ is_published: false })
      .eq("id", commentId);

    // Decrement comment count
    const { data: currentPost } = await supabase
      .from("group_posts")
      .select("comment_count")
      .eq("id", postId)
      .single();

    if (currentPost) {
      await supabase
        .from("group_posts")
        .update({ comment_count: Math.max(0, (currentPost.comment_count || 0) - 1) })
        .eq("id", postId);
    }

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("Delete comment error:", error);
    return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
  }
}
