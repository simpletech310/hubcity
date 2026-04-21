import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseMentions } from "@/lib/mentions";

/**
 * GET  /api/reels/[id]/comments            — nested (parent + replies) top-level list
 * POST /api/reels/[id]/comments { body, parent_id? } — create comment / reply
 *
 * Mirrors /api/posts/[id]/comments but scoped to reel_comments.
 */

type ReelComment = {
  id: string;
  reel_id: string;
  author_id: string;
  body: string;
  parent_id: string | null;
  is_published: boolean;
  created_at: string;
  author?: unknown;
  replies?: ReelComment[];
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: reelId } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("reel_comments")
      .select(
        "*, author:profiles!reel_comments_author_id_fkey(id, display_name, handle, avatar_url, role, verification_status)",
      )
      .eq("reel_id", reelId)
      .eq("is_published", true)
      .order("created_at", { ascending: true });

    if (error) throw error;

    const topLevel: ReelComment[] = [];
    const replyMap = new Map<string, ReelComment[]>();
    for (const c of (data || []) as ReelComment[]) {
      if (c.parent_id) {
        const arr = replyMap.get(c.parent_id) ?? [];
        arr.push(c);
        replyMap.set(c.parent_id, arr);
      } else {
        topLevel.push(c);
      }
    }
    for (const t of topLevel) t.replies = replyMap.get(t.id) || [];

    return NextResponse.json({ comments: topLevel });
  } catch (error) {
    console.error("Fetch reel comments error:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: reelId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { body, parent_id } = (await request.json()) as {
      body?: string;
      parent_id?: string | null;
    };

    if (!body || typeof body !== "string" || !body.trim()) {
      return NextResponse.json({ error: "Comment body is required" }, { status: 400 });
    }
    if (body.trim().length > 1000) {
      return NextResponse.json(
        { error: "Comment must be under 1000 characters" },
        { status: 400 },
      );
    }

    if (parent_id) {
      const { data: parent } = await supabase
        .from("reel_comments")
        .select("id")
        .eq("id", parent_id)
        .eq("reel_id", reelId)
        .single();
      if (!parent) {
        return NextResponse.json(
          { error: "Parent comment not found" },
          { status: 404 },
        );
      }
    }

    const { data: comment, error } = await supabase
      .from("reel_comments")
      .insert({
        reel_id: reelId,
        author_id: user.id,
        body: body.trim(),
        parent_id: parent_id || null,
        is_published: true,
      })
      .select(
        "*, author:profiles!reel_comments_author_id_fkey(id, display_name, handle, avatar_url, role, verification_status)",
      )
      .single();

    if (error) throw error;

    // Notify mentions
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
            title: `${authorName} mentioned you in a reel`,
            body: body.trim().slice(0, 100),
            link_type: "reel",
            link_id: reelId,
          });
        }
      }
    }

    return NextResponse.json({ comment });
  } catch (error) {
    console.error("Create reel comment error:", error);
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }
}
