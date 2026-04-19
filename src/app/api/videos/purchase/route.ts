import { NextResponse } from "next/server";

// Pay-per-view purchase stub — wiring to Stripe Connect for creator payouts
// is a follow-up (see plan: Section 8 / Stripe Connect for creator payouts).
// This route exists so the paywall overlay in KnectTV has a well-defined endpoint
// to call, and so the feature flag `NEXT_PUBLIC_FEATURE_PPV` can be flipped on
// without rewriting the client.
//
// When implemented it should:
//   1. Resolve the channel_video and its creator/channel owner.
//   2. Look up the owner's creator_stripe_accounts row.
//   3. Create a Stripe PaymentIntent with transfer_data.destination = creator account.
//   4. Record to payment_intents (resource_type='video_purchase').
//   5. On webhook success, insert into video_purchases.
export async function POST() {
  return NextResponse.json(
    {
      error: "not_implemented",
      message:
        "Pay-per-view purchasing is coming soon. This route is a stub until Stripe Connect is wired up.",
    },
    { status: 501 }
  );
}
