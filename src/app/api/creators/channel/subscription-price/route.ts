import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";

// POST /api/creators/channel/subscription-price
// Body: { channel_id: string, price_cents: number, currency?: string }
// Creates (or recreates) the Stripe Product + Price for a channel's monthly
// subscription, then caches the price id on the channel.
//
// Constraints:
//   - Only the channel owner can set this.
//   - Owner must have a connected Stripe account with charges_enabled.
//   - Setting price_cents = 0 (or null) clears the subscription offering.
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      channel_id?: string;
      price_cents?: number | null;
      currency?: string;
    };

    if (!body.channel_id) {
      return NextResponse.json(
        { error: "channel_id is required" },
        { status: 400 }
      );
    }

    const { data: channel } = await supabase
      .from("channels")
      .select("id, name, owner_id, subscription_stripe_product_id")
      .eq("id", body.channel_id)
      .maybeSingle();
    if (!channel || channel.owner_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const admin = createAdminClient();
    const { data: account } = await admin
      .from("creator_stripe_accounts")
      .select("stripe_account_id, charges_enabled")
      .eq("creator_id", user.id)
      .maybeSingle();
    if (!account?.charges_enabled) {
      return NextResponse.json(
        { error: "Finish Stripe onboarding before setting prices" },
        { status: 409 }
      );
    }

    // Clearing the price → wipe cached refs so subscribe blocks until reset.
    if (!body.price_cents || body.price_cents <= 0) {
      await admin
        .from("channels")
        .update({
          subscription_price_cents: null,
          subscription_stripe_price_id: null,
        })
        .eq("id", channel.id);
      return NextResponse.json({ ok: true, cleared: true });
    }

    const currency = (body.currency ?? "usd").toLowerCase();
    const stripe = getStripe();

    // Reuse the product so we don't litter the dashboard. Only the price
    // object is recreated when the amount changes — Stripe prices are
    // immutable, so this is the supported pattern.
    let productId = channel.subscription_stripe_product_id ?? null;
    if (!productId) {
      const product = await stripe.products.create({
        name: `${channel.name} — Channel Subscription`,
        metadata: { channel_id: channel.id, creator_id: user.id },
      });
      productId = product.id;
    }

    const price = await stripe.prices.create({
      product: productId,
      unit_amount: body.price_cents,
      currency,
      recurring: { interval: "month" },
      metadata: { channel_id: channel.id, creator_id: user.id },
    });

    await admin
      .from("channels")
      .update({
        subscription_price_cents: body.price_cents,
        subscription_currency: currency,
        subscription_stripe_price_id: price.id,
        subscription_stripe_product_id: productId,
      })
      .eq("id", channel.id);

    return NextResponse.json({
      ok: true,
      price_id: price.id,
      price_cents: body.price_cents,
      currency,
    });
  } catch (error) {
    console.error("Set channel subscription price error:", error);
    return NextResponse.json(
      { error: "Failed to set subscription price" },
      { status: 500 }
    );
  }
}
