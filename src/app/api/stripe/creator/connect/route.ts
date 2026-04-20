import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";

// POST /api/stripe/creator/connect
// Mirrors the business Stripe Connect flow but scopes the Express account to
// the creator persona. Creates (or reuses) a connected account, then returns
// a fresh account-link URL the client can redirect to.
export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only approved creators can onboard.
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_creator, role")
      .eq("id", user.id)
      .single();

    const isCreator =
      profile?.is_creator === true || profile?.role === "content_creator";
    if (!isCreator) {
      return NextResponse.json(
        { error: "Creator role required" },
        { status: 403 }
      );
    }

    const admin = createAdminClient();
    const stripe = getStripe();

    // Reuse account if one already exists.
    const { data: existing } = await admin
      .from("creator_stripe_accounts")
      .select("stripe_account_id, onboarding_complete")
      .eq("creator_id", user.id)
      .maybeSingle();

    let stripeAccountId = existing?.stripe_account_id ?? null;

    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: "express",
        metadata: {
          creator_id: user.id,
          persona: "creator",
        },
      });
      stripeAccountId = account.id;

      await admin.from("creator_stripe_accounts").insert({
        creator_id: user.id,
        stripe_account_id: account.id,
        onboarding_complete: false,
        charges_enabled: false,
        payouts_enabled: false,
      });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const link = await stripe.accountLinks.create({
      account: stripeAccountId,
      return_url: `${baseUrl}/dashboard/creator?stripe=complete`,
      refresh_url: `${baseUrl}/dashboard/creator?stripe=refresh`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: link.url });
  } catch (error) {
    console.error("Creator Stripe connect error:", error);
    return NextResponse.json(
      { error: "Failed to start Stripe onboarding" },
      { status: 500 }
    );
  }
}
