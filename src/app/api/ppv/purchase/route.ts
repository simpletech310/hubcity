import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import { calculateCreatorPlatformFee } from "@/lib/creator-access";

// POST /api/ppv/purchase
// Body: { video_id: string }
// Returns: { url: string } — Stripe Checkout URL.
//
// Single-payment Checkout for one video. Webhook (`checkout.session.completed`)
// inserts the video_purchases row + the corresponding creator_earnings entry.
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { video_id } = (await request.json()) as { video_id?: string };
    if (!video_id) {
      return NextResponse.json(
        { error: "video_id is required" },
        { status: 400 }
      );
    }

    const { data: video } = await supabase
      .from("channel_videos")
      .select(
        "id, title, channel_id, access_type, is_premium, price_cents, ppv_stripe_price_id, channel:channels(id, name, owner_id, subscription_currency)"
      )
      .eq("id", video_id)
      .maybeSingle();

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const channel = Array.isArray(video.channel) ? video.channel[0] : video.channel;
    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    const isPpv = video.access_type === "ppv" || video.is_premium === true;
    if (!isPpv || !video.price_cents) {
      return NextResponse.json(
        { error: "This video is not available for purchase" },
        { status: 400 }
      );
    }
    if (channel.owner_id === user.id) {
      return NextResponse.json(
        { error: "You already own this content" },
        { status: 400 }
      );
    }

    // Already purchased? Short-circuit so we don't double-charge.
    const { data: existing } = await supabase
      .from("video_purchases")
      .select("id")
      .eq("user_id", user.id)
      .eq("video_id", video.id)
      .maybeSingle();
    if (existing) {
      return NextResponse.json(
        { error: "You already purchased this video", already_owned: true },
        { status: 409 }
      );
    }

    const admin = createAdminClient();
    const { data: creatorAccount } = await admin
      .from("creator_stripe_accounts")
      .select("stripe_account_id, charges_enabled")
      .eq("creator_id", channel.owner_id)
      .maybeSingle();

    if (!creatorAccount?.stripe_account_id || !creatorAccount.charges_enabled) {
      return NextResponse.json(
        { error: "This creator hasn't finished payment setup yet" },
        { status: 409 }
      );
    }

    const stripe = getStripe();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const currency = channel.subscription_currency ?? "usd";
    const fee = calculateCreatorPlatformFee(video.price_cents);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency,
            unit_amount: video.price_cents,
            product_data: {
              name: video.title,
              description: `Pay-per-view on ${channel.name}`,
            },
          },
        },
      ],
      payment_intent_data: {
        application_fee_amount: fee,
        transfer_data: { destination: creatorAccount.stripe_account_id },
        metadata: {
          video_id: video.id,
          channel_id: channel.id,
          buyer_id: user.id,
          creator_id: channel.owner_id,
          resource_type: "video_purchase",
        },
      },
      customer_email: user.email ?? undefined,
      metadata: {
        video_id: video.id,
        channel_id: channel.id,
        buyer_id: user.id,
        creator_id: channel.owner_id,
        resource_type: "video_purchase",
      },
      success_url: `${baseUrl}/live/watch/${video.id}?purchased=1`,
      cancel_url: `${baseUrl}/live/watch/${video.id}?purchased=0`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("PPV purchase error:", error);
    return NextResponse.json(
      { error: "Failed to start checkout" },
      { status: 500 }
    );
  }
}
