import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveVideoAccess } from "@/lib/creator-access";

// GET /api/videos/[id]/playback
// Returns the Mux playback id (or signed token, when we move to signed URLs)
// IF the viewer has access. Otherwise returns 402 with the paywall payload
// so the client can render the right offer (subscribe / buy).
//
// Today our Mux assets use playback_policy: "public", so this route is
// effectively the policy enforcement layer. When we flip to "signed", swap
// the response to issue a Mux JWT here.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: video, error } = await supabase
      .from("channel_videos")
      .select(
        "id, channel_id, mux_playback_id, status, access_type, is_premium, price_cents, ppv_stripe_price_id, preview_seconds, channel:channels(id, owner_id, subscription_price_cents, subscription_currency)"
      )
      .eq("id", id)
      .single();

    if (error || !video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    if (video.status !== "ready") {
      return NextResponse.json(
        { error: "Video is still processing" },
        { status: 425 }
      );
    }

    // Supabase's typed embed gives us an array OR object depending on the rel
    // shape; normalise so downstream code is straightforward.
    const channelEmbed = Array.isArray(video.channel)
      ? video.channel[0]
      : video.channel;
    if (!channelEmbed) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    const decision = await resolveVideoAccess(
      supabase,
      {
        id: video.id,
        channel_id: video.channel_id,
        access_type: video.access_type as "free" | "subscribers" | "ppv" | null,
        is_premium: video.is_premium,
        price_cents: video.price_cents,
      },
      {
        id: channelEmbed.id,
        owner_id: channelEmbed.owner_id,
        subscription_price_cents: channelEmbed.subscription_price_cents,
        subscription_currency: channelEmbed.subscription_currency,
      },
      user?.id ?? null
    );

    if (!decision.allowed) {
      return NextResponse.json(
        {
          error: "payment_required",
          reason: decision.reason,
          paywall: {
            channel_id: decision.channel_id,
            ppv_price_cents: decision.ppv_price_cents ?? null,
            subscription_price_cents: decision.subscription_price_cents ?? null,
            currency: decision.currency ?? "usd",
            preview_seconds: video.preview_seconds ?? null,
          },
        },
        { status: 402 }
      );
    }

    return NextResponse.json({
      playback_id: video.mux_playback_id,
      // Today Mux is on public playback_policy. When we flip to signed,
      // generate a Mux-signed JWT here and return it as `token`.
      token: null,
    });
  } catch (err) {
    console.error("Video playback gate error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
