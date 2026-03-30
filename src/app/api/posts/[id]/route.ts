import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseHashtags } from "@/lib/hashtags";
import { parseMentions } from "@/lib/mentions";

const EDIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export async function PATCH(
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

    // Fetch the post
    const { data: post, error: fetchError } = await supabase
      .from("posts")
      .select("*")
      .eq("id", postId)
      .single();

    if (fetchError || !post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Must be the author
    if (post.author_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check 15-minute edit window
    const elapsed = Date.now() - new Date(post.created_at).getTime();
    if (elapsed > EDIT_WINDOW_MS) {
      return NextResponse.json(
        { error: "Edit window expired. Posts can only be edited within 15 minutes of creation." },
        { status: 403 }
      );
    }

    const { body } = await request.json();

    if (!body || typeof body !== "string" || !body.trim()) {
      return NextResponse.json(
        { error: "Post body is required" },
        { status: 400 }
      );
    }

    // Re-parse hashtags
    const hashtags = parseHashtags(body);
    const hashtagStrings = hashtags.map((h) => h.tag);

    // Update the post
    const { data: updatedPost, error: updateError } = await supabase
      .from("posts")
      .update({
        body: body.trim(),
        hashtags: hashtagStrings,
        edited_at: new Date().toISOString(),
      })
      .eq("id", postId)
      .select("*")
      .single();

    if (updateError) throw updateError;

    // Re-parse mentions and notify new ones
    const mentionedHandles = parseMentions(body);
    if (mentionedHandles.length > 0 && updatedPost) {
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
            title: `${authorName} mentioned you`,
            body: updatedPost.body.slice(0, 100),
            link_type: "post",
            link_id: postId,
          });
        }
      }
    }

    return NextResponse.json({ post: updatedPost });
  } catch (error) {
    console.error("Post edit error:", error);
    return NextResponse.json(
      { error: "Failed to edit post" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Fetch the post
    const { data: post, error: fetchError } = await supabase
      .from("posts")
      .select("author_id")
      .eq("id", postId)
      .single();

    if (fetchError || !post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check if user is author or admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isAuthor = post.author_id === user.id;
    const isAdmin = profile?.role === "admin";

    if (!isAuthor && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Soft delete: set is_published = false
    const { error: deleteError } = await supabase
      .from("posts")
      .update({ is_published: false })
      .eq("id", postId);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Post delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    );
  }
}
