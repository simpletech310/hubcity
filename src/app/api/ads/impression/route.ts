import { NextResponse } from "next/server";
import { recordImpression } from "@/lib/kevel";
import { createClient } from "@/lib/supabase/server";

// POST /api/ads/impression — fire and forget impression tracking
export async function POST(request: Request) {
  try {
    let creative_id: string | undefined;
    let campaign_id: string | undefined;
    let zone: string | undefined;
    let content_id: string | undefined;

    try {
      const parsed = await request.json();
      creative_id = parsed.creative_id;
      campaign_id = parsed.campaign_id;
      zone = parsed.zone;
      content_id = parsed.content_id;
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    if (!creative_id || !campaign_id || !zone) {
      return NextResponse.json(
        { error: "creative_id, campaign_id, and zone are required" },
        { status: 400 }
      );
    }

    // Derive user_id from auth (don't trust client-provided user_id)
    let userId: string | undefined;
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id;
    } catch {
      // Anonymous impression — that's OK
    }

    // Fire and forget - don't await
    recordImpression({
      creativeId: creative_id,
      campaignId: campaign_id,
      zone,
      contentId: content_id || undefined,
      userId,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Ad impression error:", error);
    return NextResponse.json(
      { error: "Failed to record impression" },
      { status: 500 }
    );
  }
}
