import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildRelatedForVideo } from "@/lib/live/relatedToLive";

/**
 * GET /api/live/related?video_id=<uuid>
 *
 * Returns the contextual rail (events, resources, businesses, food promos)
 * for the given channel_video's channel.type. Called by the client-side
 * RelatedToLive component whenever LiveSimulatedPlayer advances.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const videoId = url.searchParams.get("video_id");
  if (!videoId) {
    return NextResponse.json({ error: "video_id required" }, { status: 400 });
  }

  const supabase = await createClient();
  const data = await buildRelatedForVideo(supabase, videoId);
  return NextResponse.json({ data });
}
