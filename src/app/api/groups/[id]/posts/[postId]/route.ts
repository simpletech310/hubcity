import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// DELETE — soft-delete post (author or admin/mod)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; postId: string }> }
) {
  try {
    const { id: groupId, postId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get post
    const { data: post } = await supabase
      .from("group_posts")
      .select("author_id")
      .eq("id", postId)
      .eq("group_id", groupId)
      .single();

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check permission: author or admin/mod
    const isAuthor = post.author_id === user.id;
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
      .from("group_posts")
      .update({ is_published: false })
      .eq("id", postId);

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("Delete post error:", error);
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
  }
}

// PATCH — pin/unpin post (admin/mod only)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; postId: string }> }
) {
  try {
    const { id: groupId, postId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: membership } = await supabase
      .from("group_members")
      .select("role")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .single();

    if (!membership || !["admin", "moderator"].includes(membership.role)) {
      return NextResponse.json({ error: "Only admins/mods can pin posts" }, { status: 403 });
    }

    const { is_pinned } = await request.json();

    await supabase
      .from("group_posts")
      .update({ is_pinned: !!is_pinned })
      .eq("id", postId)
      .eq("group_id", groupId);

    return NextResponse.json({ is_pinned: !!is_pinned });
  } catch (error) {
    console.error("Pin post error:", error);
    return NextResponse.json({ error: "Failed to update post" }, { status: 500 });
  }
}
