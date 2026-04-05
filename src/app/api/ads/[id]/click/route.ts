import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/ads/:id/click — increment click_count on a video ad
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Fetch current click_count then increment
    const { data: ad } = await supabase
      .from("video_ads")
      .select("click_count")
      .eq("id", id)
      .single();

    if (!ad) {
      return NextResponse.json({ error: "Ad not found" }, { status: 404 });
    }

    await supabase
      .from("video_ads")
      .update({ click_count: (ad.click_count || 0) + 1 })
      .eq("id", id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ad click tracking error:", error);
    return NextResponse.json(
      { error: "Failed to track click" },
      { status: 500 }
    );
  }
}
