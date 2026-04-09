import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET comments for a district post
export async function GET(
  request: Request,
  { params }: { params: Promise<{ district: string; postId: string }> }
) {
  try {
    const { postId } = await params;
    const supabase = await createClient();

    const { data: comments, error } = await supabase
      .from("district_post_comments")
      .select("*, author:profiles!district_post_comments_author_id_fkey(id, display_name, avatar_url, handle, role)")
      .eq("district_post_id", postId)
      .eq("is_published", true)
      .order("created_at", { ascending: true })
      .limit(100);

    if (error) throw error;

    // Nest replies under parents
    const topLevel: Record<string, unknown>[] = [];
    const replyMap = new Map<string, Record<string, unknown>[]>();

    for (const comment of (comments || []) as Record<string, unknown>[]) {
      if (comment.parent_id) {
        const existing = replyMap.get(comment.parent_id as string) || [];
        existing.push(comment);
        replyMap.set(comment.parent_id as string, existing);
      } else {
        topLevel.push(comment);
      }
    }

    // Attach replies
    for (const comment of topLevel) {
      comment.replies = replyMap.get(comment.id as string) || [];
    }

    return NextResponse.json({ comments: topLevel });
  } catch (error) {
    console.error("Fetch district post comments error:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

// POST a comment on a district post (auth required)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ district: string; postId: string }> }
) {
  try {
    const { postId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { body, parent_id } = await request.json();

    if (!body || typeof body !== "string" || !body.trim()) {
      return NextResponse.json(
        { error: "Comment body is required" },
        { status: 400 }
      );
    }

    if (body.trim().length > 1000) {
      return NextResponse.json(
        { error: "Comment must be under 1000 characters" },
        { status: 400 }
      );
    }

    // If replying, validate parent exists and belongs to same post
    if (parent_id) {
      const { data: parent } = await supabase
        .from("district_post_comments")
        .select("id")
        .eq("id", parent_id)
        .eq("district_post_id", postId)
        .single();

      if (!parent) {
        return NextResponse.json(
          { error: "Parent comment not found" },
          { status: 404 }
        );
      }
    }

    // Insert comment
    const { data: comment, error } = await supabase
      .from("district_post_comments")
      .insert({
        district_post_id: postId,
        author_id: user.id,
        body: body.trim(),
        parent_id: parent_id || null,
        is_published: true,
      })
      .select("*, author:profiles!district_post_comments_author_id_fkey(id, display_name, avatar_url, handle, role)")
      .single();

    if (error) throw error;

    // Increment denormalized comment_count on district post
    const { data: currentPost } = await supabase
      .from("district_posts")
      .select("comment_count")
      .eq("id", postId)
      .single();

    if (currentPost) {
      await supabase
        .from("district_posts")
        .update({ comment_count: (currentPost.comment_count || 0) + 1 })
        .eq("id", postId);
    }

    return NextResponse.json({ comment });
  } catch (error) {
    console.error("Create district post comment error:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
