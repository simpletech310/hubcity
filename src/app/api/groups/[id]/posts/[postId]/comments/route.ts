import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET comments for a group post
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; postId: string }> }
) {
  try {
    const { postId } = await params;
    const supabase = await createClient();

    const { data: comments, error } = await supabase
      .from("group_post_comments")
      .select("*, author:profiles!group_post_comments_author_id_fkey(id, display_name, avatar_url, handle)")
      .eq("group_post_id", postId)
      .eq("is_published", true)
      .order("created_at", { ascending: true })
      .limit(100);

    if (error) throw error;

    return NextResponse.json({ comments: comments || [] });
  } catch (error) {
    console.error("Fetch group comments error:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

// POST a comment on a group post (members only)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; postId: string }> }
) {
  try {
    const { id, postId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify membership
    const { data: membership } = await supabase
      .from("group_members")
      .select("role")
      .eq("group_id", id)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: "You must be a member to comment" },
        { status: 403 }
      );
    }

    const { body } = await request.json();

    if (!body || typeof body !== "string" || !body.trim()) {
      return NextResponse.json(
        { error: "Comment body is required" },
        { status: 400 }
      );
    }

    const { data: comment, error } = await supabase
      .from("group_post_comments")
      .insert({
        group_post_id: postId,
        author_id: user.id,
        body: body.trim(),
        is_published: true,
      })
      .select("*, author:profiles!group_post_comments_author_id_fkey(id, display_name, avatar_url, handle)")
      .single();

    if (error) throw error;

    // Update comment count
    const { data: currentPost } = await supabase
      .from("group_posts")
      .select("comment_count")
      .eq("id", postId)
      .single();

    if (currentPost) {
      await supabase
        .from("group_posts")
        .update({ comment_count: (currentPost.comment_count || 0) + 1 })
        .eq("id", postId);
    }

    return NextResponse.json({ comment });
  } catch (error) {
    console.error("Create group comment error:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
