import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/push/subscribe — upsert a browser PushSubscription against
 * the signed-in user. The body is the JSON returned from
 * `pushManager.subscribe(...)`.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const endpoint =
      typeof body.endpoint === "string" ? body.endpoint : null;
    const keys = body.keys;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json(
        { error: "Invalid subscription" },
        { status: 400 },
      );
    }

    const ua = request.headers.get("user-agent") ?? null;

    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        user_id: user.id,
        endpoint,
        keys,
        user_agent: ua,
      },
      { onConflict: "endpoint" },
    );
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Push subscribe error:", err);
    return NextResponse.json(
      { error: "Failed to subscribe" },
      { status: 500 },
    );
  }
}
