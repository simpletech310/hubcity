import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// PATCH /api/creators/videos/[id]/access
// Body: { access_type: "free" | "subscribers" | "ppv", price_cents?: number }
// Channel-owner only. Updates how viewers can access a single video.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      access_type?: "free" | "subscribers" | "ppv";
      price_cents?: number | null;
    };

    if (!body.access_type) {
      return NextResponse.json(
        { error: "access_type is required" },
        { status: 400 }
      );
    }
    if (body.access_type === "ppv" && (!body.price_cents || body.price_cents <= 0)) {
      return NextResponse.json(
        { error: "PPV videos require a price" },
        { status: 400 }
      );
    }

    const { data: video } = await supabase
      .from("channel_videos")
      .select("id, channel_id, channels:channels(owner_id)")
      .eq("id", id)
      .maybeSingle();
    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const channelOwner = Array.isArray(video.channels)
      ? video.channels[0]?.owner_id
      : (video.channels as { owner_id?: string } | null)?.owner_id;
    if (channelOwner !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // For PPV gate, require Connect onboarding so we know we can pay them out.
    if (body.access_type === "ppv") {
      const admin = createAdminClient();
      const { data: account } = await admin
        .from("creator_stripe_accounts")
        .select("charges_enabled")
        .eq("creator_id", user.id)
        .maybeSingle();
      if (!account?.charges_enabled) {
        return NextResponse.json(
          { error: "Finish Stripe onboarding before pricing PPV videos" },
          { status: 409 }
        );
      }
    }

    const update: Record<string, unknown> = {
      access_type: body.access_type,
      is_premium: body.access_type === "ppv",
    };
    if (body.access_type === "ppv") {
      update.price_cents = body.price_cents;
    } else if (body.access_type === "free" || body.access_type === "subscribers") {
      update.price_cents = null;
    }

    const { error } = await supabase
      .from("channel_videos")
      .update(update)
      .eq("id", id);

    if (error) {
      console.error("Failed to update video access:", error);
      return NextResponse.json(
        { error: "Failed to update video" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Update video access error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
