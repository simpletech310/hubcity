import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { channelId, channelName, amountCents, message, stripeAccountId } =
      body as {
        channelId: string;
        channelName: string;
        amountCents: number;
        message?: string;
        stripeAccountId: string;
      };

    // Validate required fields
    if (!channelId || !stripeAccountId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Minimum $1.00
    if (!amountCents || amountCents < 100) {
      return NextResponse.json(
        { error: "Minimum tip amount is $1.00" },
        { status: 400 }
      );
    }

    const stripe = getStripe();
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const platformFee = Math.floor(amountCents * 0.05);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Tip for ${channelName || "Creator"}`,
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: platformFee,
        transfer_data: {
          destination: stripeAccountId,
        },
      },
      metadata: {
        channelId,
        ...(message ? { message } : {}),
        resource_type: "tip",
      },
      success_url: `${baseUrl}/live/channel/${channelId}?tipped=1`,
      cancel_url: `${baseUrl}/live/channel/${channelId}`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Tip session error:", error);
    return NextResponse.json(
      { error: "Failed to create tip session" },
      { status: 500 }
    );
  }
}
