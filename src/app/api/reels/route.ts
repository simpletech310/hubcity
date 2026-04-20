import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseHashtags } from "@/lib/hashtags";

const MAX_DURATION_SECONDS = 90;

/**
 * GET /api/reels — public list of active (non-expired) reels.
 * ?author_id=<uuid>  scope to one creator
 * ?limit=<n>         default 20, max 50
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const url = new URL(request.url);
  const authorId = url.searchParams.get("author_id");
  const limitRaw = url.searchParams.get("limit");
  const limit = Math.min(Math.max(parseInt(limitRaw ?? "20", 10) || 20, 1), 50);

  let query = supabase
    .from("reels")
    .select(
      "*, author:profiles!reels_author_id_fkey(id, display_name, handle, avatar_url, role, verification_status)"
    )
    .eq("is_published", true)
    .or("expires_at.is.null,expires_at.gt." + new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(limit);

  if (authorId) query = query.eq("author_id", authorId);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ reels: data ?? [] });
}

/**
 * POST /api/reels — create a reel record after the client has
 * already uploaded the video + poster to Supabase Storage.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    is_story,
  } = await request.json();

  if (!video_url || !video_path) {
    return NextResponse.json(
      { error: "video_url and video_path are required" },
      { status: 400 }
    );
  }

  if (
    typeof duration_seconds === "number" &&
    duration_seconds > MAX_DURATION_SECONDS + 1 // small tolerance for float rounding
  ) {
    return NextResponse.json(
      { error: `Reels must be ${MAX_DURATION_SECONDS}s or shorter` },
      { status: 400 }
    );
  }

  const captionText = typeof caption === "string" ? caption.trim() : null;
  const hashtags =
    captionText != null
      ? parseHashtags(captionText).map((h) => h.tag)
      : [];

  const isStory = !!is_story;
  const expiresAt = isStory
    ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    : null;

  const { data: reel, error } = await supabase
    .from("reels")
    .insert({
      author_id: user.id,
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
      is_story: isStory,
      expires_at: expiresAt,
    })
    .select(
      "*, author:profiles!reels_author_id_fkey(id, display_name, handle, avatar_url, role, verification_status)"
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ reel });
}
