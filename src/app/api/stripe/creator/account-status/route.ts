import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/stripe/creator/account-status
// Lightweight read for the dashboard onboarding card.
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: account } = await supabase
      .from("creator_stripe_accounts")
      .select("onboarding_complete, charges_enabled, payouts_enabled, stripe_account_id")
      .eq("creator_id", user.id)
      .maybeSingle();

    if (!account) {
      return NextResponse.json({
        connected: false,
        onboarding_complete: false,
        charges_enabled: false,
        payouts_enabled: false,
      });
    }

    return NextResponse.json({
      connected: true,
      onboarding_complete: account.onboarding_complete,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
    });
  } catch (error) {
    console.error("Creator Stripe status error:", error);
    return NextResponse.json(
      { error: "Failed to fetch account status" },
      { status: 500 }
    );
  }
}
