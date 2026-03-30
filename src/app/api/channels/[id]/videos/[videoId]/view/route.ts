import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// POST /api/channels/[id]/videos/[videoId]/view — increment view count
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; videoId: string }> }
) {
  try {
    const { videoId } = await params;
    const supabase = createAdminClient();

    // Read current count then increment (no RPC needed)
    const { data } = await supabase
      .from("channel_videos")
      .select("view_count")
      .eq("id", videoId)
      .single();

    if (data) {
      await supabase
        .from("channel_videos")
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq("id", videoId);
    }

    return NextResponse.json({ ok: true });
  } catch {
    // View counting is fire-and-forget — never fail the response
    return NextResponse.json({ ok: true });
  }
}
