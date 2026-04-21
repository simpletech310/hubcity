import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/conversations/[id]/messages?before=<iso>
 *   - Paginated message history. Newest first by default; pass `before` for
 *     older pages.
 *   - Also bumps my last_read_at.
 *
 * POST /api/conversations/[id]/messages { body?, gif_url?, image_url? }
 *   - Sends a message into the conversation.
 *   - Inserts a notification for the other participant (best-effort).
 */

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "auth required" }, { status: 401 });

  const url = new URL(req.url);
  const before = url.searchParams.get("before");

  let q = supabase
    .from("messages")
    .select(
      "id, conversation_id, sender_id, body, gif_url, image_url, created_at, read_at, sender:profiles!messages_sender_id_fkey(id, display_name, handle, avatar_url, verification_status)",
    )
    .eq("conversation_id", id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (before) q = q.lt("created_at", before);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Mark this conversation as read for me (best effort)
  await supabase
    .from("conversation_participants")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", id)
    .eq("user_id", user.id);

  return NextResponse.json({ messages: (data ?? []).reverse() });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "auth required" }, { status: 401 });

  let body: { body?: string; gif_url?: string; image_url?: string } = {};
  try {
    body = await req.json();
  } catch {}
  const text = body.body?.trim();
  const gif = body.gif_url?.trim();
  const img = body.image_url?.trim();
  if (!text && !gif && !img) {
    return NextResponse.json({ error: "empty message" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: id,
      sender_id: user.id,
      body: text || null,
      gif_url: gif || null,
      image_url: img || null,
    })
    .select(
      "id, conversation_id, sender_id, body, gif_url, image_url, created_at, sender:profiles!messages_sender_id_fkey(id, display_name, handle, avatar_url, verification_status)",
    )
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Notify the OTHER participant (best-effort).
  const { data: parts } = await supabase
    .from("conversation_participants")
    .select("user_id")
    .eq("conversation_id", id);
  const other = (parts ?? []).find((p) => p.user_id !== user.id);
  if (other) {
    const { data: me } = await supabase
      .from("profiles")
      .select("display_name, handle")
      .eq("id", user.id)
      .single();
    const who = me?.display_name || me?.handle || "Someone";
    const preview =
      text?.slice(0, 80) ?? (gif ? "🎞️ sent a GIF" : "📷 sent an image");
    await supabase.from("notifications").insert({
      user_id: other.user_id,
      type: "system",
      title: `New message from ${who}`,
      body: preview,
      link_type: "conversation",
      link_id: id,
    });
  }

  return NextResponse.json({ message: data });
}
