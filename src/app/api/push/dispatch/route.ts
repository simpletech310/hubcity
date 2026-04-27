import { NextResponse } from "next/server";
import { dispatchPush } from "@/lib/web-push";

/**
 * POST /api/push/dispatch
 *
 * Internal webhook used to fan out a Web Push notification to every
 * device a user has subscribed. Two ways to wire it up:
 *
 *  1. Direct call from server code that has just inserted into
 *     `notifications` (preferred — keeps everything in JS).
 *  2. Postgres `AFTER INSERT` trigger that POSTs here via pg_net (set
 *     up server-side; not included in this migration to keep the
 *     deploy story simple).
 *
 * Auth: this endpoint is gated by the `PUSH_DISPATCH_SECRET` env. The
 * caller must include `Authorization: Bearer <secret>`.
 *
 * Body: { user_id, channel, payload: { title, body, url? } }
 */
export async function POST(request: Request) {
  const secret = process.env.PUSH_DISPATCH_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Push dispatch disabled (no secret configured)" },
      { status: 503 },
    );
  }
  const auth = request.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    if (
      typeof body.user_id !== "string" ||
      typeof body.channel !== "string" ||
      typeof body.payload?.title !== "string" ||
      typeof body.payload?.body !== "string"
    ) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    await dispatchPush({
      userId: body.user_id,
      channel: body.channel,
      payload: body.payload,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Push dispatch error:", err);
    return NextResponse.json({ error: "Dispatch failed" }, { status: 500 });
  }
}
