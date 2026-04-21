import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/conversations { other_user_id }
 *   - Atomic find-or-create 1:1 DM via the find_or_create_dm RPC.
 *   - Returns { conversation_id }.
 *
 * GET /api/conversations
 *   - Lists my conversations with the OTHER participant's profile + last message
 *     preview. Newest activity first.
 */

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "auth required" }, { status: 401 });

  let body: { other_user_id?: string } = {};
  try {
    body = await req.json();
  } catch {}
  const other = body.other_user_id;
  if (!other || typeof other !== "string") {
    return NextResponse.json({ error: "other_user_id required" }, { status: 400 });
  }
  if (other === user.id) {
    return NextResponse.json({ error: "cannot DM yourself" }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("find_or_create_dm", {
    other_user_id: other,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ conversation_id: data });
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ conversations: [] });

  // Fetch the conversations I'm in (RLS scopes this).
  const { data: convs } = await supabase
    .from("conversations")
    .select(
      "id, last_message_at, last_message_preview, participants:conversation_participants(user_id, last_read_at, profile:profiles(id, display_name, handle, avatar_url, role, verification_status))",
    )
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .limit(50);

  type Participant = {
    user_id: string;
    last_read_at: string | null;
    profile: {
      id: string;
      display_name: string;
      handle: string | null;
      avatar_url: string | null;
      role: string | null;
      verification_status: string | null;
    } | null;
  };

  // Trim to "the other person + my unread state" so the UI stays simple.
  const out = (convs ?? []).map((c) => {
    const parts = (c.participants as unknown as Participant[]) || [];
    const me = parts.find((p) => p.user_id === user.id);
    const other = parts.find((p) => p.user_id !== user.id);
    return {
      id: c.id,
      last_message_at: c.last_message_at,
      last_message_preview: c.last_message_preview,
      my_last_read_at: me?.last_read_at ?? null,
      other: other?.profile ?? null,
    };
  });

  return NextResponse.json({ conversations: out });
}
