import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import {
  CREATOR_PLATFORM_FEE_PERCENT,
} from "@/lib/creator-access";

// POST /api/subscriptions/subscribe
// Body: { channel_id: string }
// Returns: { url: string } — the Stripe Checkout URL.
//
// Flow:
//   1. Validate channel + creator Connect account is live.
//   2. Ensure a Stripe Customer exists for the buyer.
//   3. Create a Checkout Session in subscription mode that splits the recurring
//      payment via application_fee_percent on the platform.
//   4. Webhook (`checkout.session.completed` + `customer.subscription.*`) writes
//      the channel_subscriptions row.
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { channel_id } = (await request.json()) as { channel_id?: string };
    if (!channel_id) {
      return NextResponse.json(
        { error: "channel_id is required" },
        { status: 400 }
      );
    }

    const { data: channel } = await supabase
      .from("channels")
      .select(
        "id, name, owner_id, subscription_price_cents, subscription_currency, subscription_stripe_price_id"
      )
      .eq("id", channel_id)
      .maybeSingle();

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }
    if (!channel.subscription_price_cents || !channel.subscription_stripe_price_id) {
      return NextResponse.json(
        { error: "This channel does not offer subscriptions yet" },
        { status: 400 }
      );
    }
    if (channel.owner_id === user.id) {
      return NextResponse.json(
        { error: "You cannot subscribe to your own channel" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Creator's Connect account must be ready to receive payouts.
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

    // Reuse / create Stripe Customer for the buyer.
    const { data: profile } = await admin
      .from("profiles")
      .select("stripe_customer_id, display_name")
      .eq("id", user.id)
      .maybeSingle();

    let customerId = profile?.stripe_customer_id ?? null;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        name: profile?.display_name ?? undefined,
        metadata: { user_id: user.id },
      });
      customerId = customer.id;
      await admin
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [
        {
          price: channel.subscription_stripe_price_id,
          quantity: 1,
        },
      ],
      subscription_data: {
        application_fee_percent: CREATOR_PLATFORM_FEE_PERCENT,
        transfer_data: { destination: creatorAccount.stripe_account_id },
        metadata: {
          channel_id: channel.id,
          buyer_id: user.id,
          creator_id: channel.owner_id,
          resource_type: "channel_subscription",
        },
      },
      metadata: {
        channel_id: channel.id,
        buyer_id: user.id,
        creator_id: channel.owner_id,
        resource_type: "channel_subscription",
      },
      success_url: `${baseUrl}/live/channel/${channel.id}?subscribed=1`,
      cancel_url: `${baseUrl}/live/channel/${channel.id}?subscribed=0`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Subscribe error:", error);
    return NextResponse.json(
      { error: "Failed to start subscription checkout" },
      { status: 500 }
    );
  }
}
