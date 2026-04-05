import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseMentions } from "@/lib/mentions";
import type { Comment } from "@/types/database";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;
    const supabase = await createClient();

    const { data: comments, error } = await supabase
      .from("comments")
      .select("*, author:profiles!comments_user_id_fkey(*)")
      .eq("post_id", postId)
      .eq("is_published", true)
      .order("created_at", { ascending: true });

    if (error) throw error;

    // Nest replies under parents
    const topLevel: Comment[] = [];
    const replyMap = new Map<string, Comment[]>();

    for (const comment of (comments || []) as Comment[]) {
      if (comment.parent_id) {
        const existing = replyMap.get(comment.parent_id) || [];
        existing.push(comment);
        replyMap.set(comment.parent_id, existing);
      } else {
        topLevel.push(comment);
      }
    }

    // Attach replies
    for (const comment of topLevel) {
      comment.replies = replyMap.get(comment.id) || [];
    }

    return NextResponse.json({ comments: topLevel });
  } catch (error) {
    console.error("Fetch comments error:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
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
        .from("comments")
        .select("id")
        .eq("id", parent_id)
        .eq("post_id", postId)
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
      .from("comments")
      .insert({
        post_id: postId,
        author_id: user.id,
        body: body.trim(),
        parent_id: parent_id || null,
        is_published: true,
      })
      .select("*, author:profiles!comments_user_id_fkey(*)")
      .single();

    if (error) throw error;

    // Increment denormalized comment_count on post
    const { data: post } = await supabase
      .from("posts")
      .select("comment_count")
      .eq("id", postId)
      .single();

    if (post) {
      await supabase
        .from("posts")
        .update({ comment_count: (post.comment_count || 0) + 1 })
        .eq("id", postId);
    }

    // Parse @mentions and create notifications
    const mentionedHandles = parseMentions(body);
    if (mentionedHandles.length > 0 && comment) {
      const { data: authorProfile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .single();

      const authorName = authorProfile?.display_name || "Someone";

      for (const handle of mentionedHandles) {
        const { data: mentioned } = await supabase
          .from("profiles")
          .select("id")
          .ilike("handle", handle)
          .single();

        if (mentioned && mentioned.id !== user.id) {
          await supabase.from("notifications").insert({
            user_id: mentioned.id,
            type: "mention",
            title: `${authorName} mentioned you in a comment`,
            body: body.trim().slice(0, 100),
            link_type: "post",
            link_id: postId,
          });
        }
      }
    }

    return NextResponse.json({ comment });
  } catch (error) {
    console.error("Create comment error:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
