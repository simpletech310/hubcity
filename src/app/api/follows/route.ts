import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/follows  { followed_id }   — start following
 * DELETE /api/follows  { followed_id } — stop following
 * GET /api/follows                    — list profiles I follow
 */

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "auth required" }, { status: 401 });

  let body: { followed_id?: string } = {};
  try {
    body = await req.json();
  } catch {}
  const followed_id = body.followed_id;
  if (!followed_id || typeof followed_id !== "string") {
    return NextResponse.json({ error: "followed_id required" }, { status: 400 });
  }
  if (followed_id === user.id) {
    return NextResponse.json({ error: "cannot follow yourself" }, { status: 400 });
  }

  const { error } = await supabase
    .from("user_follows")
    .insert({ follower_id: user.id, followed_id });

  // 23505 = unique violation; treat as already-following = success
  if (error && error.code !== "23505") {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Best-effort follower notification — fail silently so the follow still succeeds.
  if (!error) {
    const { data: me } = await supabase
      .from("profiles")
      .select("display_name, handle")
      .eq("id", user.id)
      .single();
    const who = me?.display_name || me?.handle || "Someone";
    await supabase.from("notifications").insert({
      user_id: followed_id,
      type: "system",
      title: "New follower",
      body: `${who} started following you.`,
      link_type: "profile",
      link_id: user.id,
    });
  }

  return NextResponse.json({ ok: true, following: true });
}

export async function DELETE(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "auth required" }, { status: 401 });

  let body: { followed_id?: string } = {};
  try {
    body = await req.json();
  } catch {}
  const followed_id = body.followed_id;
  if (!followed_id || typeof followed_id !== "string") {
    return NextResponse.json({ error: "followed_id required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("user_follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("followed_id", followed_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, following: false });
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ followed_ids: [] });

  const { data } = await supabase
    .from("user_follows")
    .select("followed_id")
    .eq("follower_id", user.id);

  return NextResponse.json({
    followed_ids: (data ?? []).map((r) => r.followed_id),
  });
}
