import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's business
    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .select("id, name")
      .eq("owner_id", user.id)
      .single();

    if (bizError || !business) {
      return NextResponse.json(
        { error: "No business found for this user" },
        { status: 404 }
      );
    }

    const stripe = getStripe();

    // Create Stripe Express account
    const account = await stripe.accounts.create({
      type: "express",
      metadata: {
        business_id: business.id,
        user_id: user.id,
      },
    });

    // Save to stripe_accounts table
    const { error: insertError } = await supabase
      .from("stripe_accounts")
      .insert({
        business_id: business.id,
        stripe_account_id: account.id,
        onboarding_complete: false,
        charges_enabled: false,
        payouts_enabled: false,
      });

    if (insertError) throw insertError;

    // Create account link for onboarding
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      return_url: `${baseUrl}/dashboard/settings?setup=complete`,
      refresh_url: `${baseUrl}/dashboard/settings?setup=refresh`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error) {
    console.error("Stripe connect error:", error);
    return NextResponse.json(
      { error: "Failed to create Stripe account" },
      { status: 500 }
    );
  }
}
