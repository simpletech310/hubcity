import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/subscriptions/status?channel_id=...
// Lightweight endpoint the channel page hits to decide which CTA to render.
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get("channel_id");
    if (!channelId) {
      return NextResponse.json({ active: false });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ active: false });
    }

    const { data: sub } = await supabase
      .from("channel_subscriptions")
      .select("status, current_period_end")
      .eq("user_id", user.id)
      .eq("channel_id", channelId)
      .in("status", ["active", "trialing"])
      .maybeSingle();

    const active =
      Boolean(sub) &&
      (!sub?.current_period_end ||
        new Date(sub.current_period_end) > new Date());

    return NextResponse.json({ active });
  } catch (error) {
    console.error("Subscription status error:", error);
    return NextResponse.json({ active: false });
  }
}
