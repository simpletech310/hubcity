import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
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
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (bizError || !business) {
      return NextResponse.json(
        { error: "No business found for this user" },
        { status: 404 }
      );
    }

    // Get stripe account
    const { data: stripeAccount, error: stripeError } = await supabase
      .from("stripe_accounts")
      .select(
        "onboarding_complete, charges_enabled, payouts_enabled, stripe_account_id"
      )
      .eq("business_id", business.id)
      .single();

    if (stripeError || !stripeAccount) {
      return NextResponse.json({
        connected: false,
        onboarding_complete: false,
        charges_enabled: false,
        payouts_enabled: false,
      });
    }

    return NextResponse.json({
      connected: true,
      onboarding_complete: stripeAccount.onboarding_complete,
      charges_enabled: stripeAccount.charges_enabled,
      payouts_enabled: stripeAccount.payouts_enabled,
    });
  } catch (error) {
    console.error("Stripe account status error:", error);
    return NextResponse.json(
      { error: "Failed to get account status" },
      { status: 500 }
    );
  }
}
