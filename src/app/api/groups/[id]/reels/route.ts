import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseHashtags } from "@/lib/hashtags";

const MAX_DURATION_SECONDS = 90;

/**
 * GET /api/groups/[id]/reels
 * List reels scoped to this group. Visible to all (members + non-members)
 * for public groups; private groups are gated by client UI.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params;
    const supabase = await createClient();

    const { data: reels, error } = await supabase
      .from("reels")
      .select(
        "*, author:profiles!reels_author_id_fkey(id, display_name, handle, avatar_url, role, verification_status)"
      )
      .eq("group_id", groupId)
      .eq("is_published", true)
      .or("expires_at.is.null,expires_at.gt." + new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    return NextResponse.json({ reels: reels ?? [] });
  } catch (error) {
    console.error("List group reels error:", error);
    return NextResponse.json({ error: "Failed to fetch reels" }, { status: 500 });
  }
}

/**
 * POST /api/groups/[id]/reels
 * Any active group member may post a reel scoped to the group.
 * Body shape mirrors /api/reels POST.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only active members can post
    const { data: membership } = await supabase
      .from("group_members")
      .select("role, status")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .single();

    if (!membership || membership.status !== "active") {
      return NextResponse.json(
        { error: "You must be an approved member of this group to post a reel." },
        { status: 403 }
      );
    }

    const {
      video_url,
      video_path,
      poster_url,
      poster_path,
      caption,
      duration_seconds,
      width,
      height,
    } = await request.json();

    if (!video_url || !video_path) {
      return NextResponse.json(
        { error: "video_url and video_path are required" },
        { status: 400 }
      );
    }

    if (
      typeof duration_seconds === "number" &&
      duration_seconds > MAX_DURATION_SECONDS + 1
    ) {
      return NextResponse.json(
        { error: `Reels must be ${MAX_DURATION_SECONDS}s or shorter` },
        { status: 400 }
      );
    }

    const captionText = typeof caption === "string" ? caption.trim() : null;
    const hashtags =
      captionText != null ? parseHashtags(captionText).map((h) => h.tag) : [];

    const { data: reel, error } = await supabase
      .from("reels")
      .insert({
        author_id: user.id,
        group_id: groupId,
        video_url,
        video_path,
        poster_url: poster_url || null,
        poster_path: poster_path || null,
        caption: captionText,
        duration_seconds:
          typeof duration_seconds === "number" ? duration_seconds : null,
        width: typeof width === "number" ? width : null,
        height: typeof height === "number" ? height : null,
        hashtags,
        is_story: false,
        expires_at: null,
      })
      .select(
        "*, author:profiles!reels_author_id_fkey(id, display_name, handle, avatar_url, role, verification_status)"
      )
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ reel });
  } catch (error) {
    console.error("Create group reel error:", error);
    return NextResponse.json({ error: "Failed to create reel" }, { status: 500 });
  }
}
