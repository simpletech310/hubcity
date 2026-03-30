import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe, calculatePlatformFee } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { business_id, amount, tip = 0, order_type } = await request.json();

    if (!business_id || !amount) {
      return NextResponse.json(
        { error: "business_id and amount are required" },
        { status: 400 }
      );
    }

    // Get stripe account for the business
    const { data: stripeAccount, error: stripeError } = await supabase
      .from("stripe_accounts")
      .select("stripe_account_id, charges_enabled")
      .eq("business_id", business_id)
      .single();

    if (stripeError || !stripeAccount) {
      return NextResponse.json(
        { error: "Business has no connected Stripe account" },
        { status: 400 }
      );
    }

    if (!stripeAccount.charges_enabled) {
      return NextResponse.json(
        { error: "Business Stripe account is not yet enabled for charges" },
        { status: 400 }
      );
    }

    const totalAmount = amount + tip;
    const platformFee = calculatePlatformFee(amount);
    const stripe = getStripe();

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: "usd",
      application_fee_amount: platformFee,
      transfer_data: {
        destination: stripeAccount.stripe_account_id,
      },
      metadata: {
        business_id,
        user_id: user.id,
        order_type: order_type || "pickup",
        tip: String(tip),
      },
    });

    return NextResponse.json({ client_secret: paymentIntent.client_secret });
  } catch (error) {
    console.error("Create payment intent error:", error);
    return NextResponse.json(
      { error: "Failed to create payment intent" },
      { status: 500 }
    );
  }
}
