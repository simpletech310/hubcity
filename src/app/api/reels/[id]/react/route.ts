import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ReactionEmoji } from "@/types/database";

const ALLOWED: ReactionEmoji[] = ["heart", "fire", "clap", "hundred", "pray"];

/**
 * POST /api/reels/[id]/react — toggle a reaction.
 * Body: { emoji: 'heart' | 'fire' | 'clap' | 'hundred' | 'pray' }
 * If the reaction already exists for (reel, user, emoji) it is removed,
 * otherwise it is added.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { emoji } = await request.json();
  if (!ALLOWED.includes(emoji)) {
    return NextResponse.json({ error: "Invalid emoji" }, { status: 400 });
  }

  // Toggle
  const { data: existing } = await supabase
    .from("reel_reactions")
    .select("emoji")
    .eq("reel_id", id)
    .eq("user_id", user.id)
    .eq("emoji", emoji)
    .maybeSingle();

  let added: boolean;
  if (existing) {
    await supabase
      .from("reel_reactions")
      .delete()
      .eq("reel_id", id)
      .eq("user_id", user.id)
      .eq("emoji", emoji);
    added = false;
  } else {
    await supabase
      .from("reel_reactions")
      .insert({ reel_id: id, user_id: user.id, emoji });
    added = true;
  }

  // Recompute reaction_counts + like_count (sum across all emojis)
  const { data: rows } = await supabase
    .from("reel_reactions")
    .select("emoji")
    .eq("reel_id", id);

  const counts: Partial<Record<ReactionEmoji, number>> = {};
  for (const row of rows ?? []) {
    const e = row.emoji as ReactionEmoji;
    counts[e] = (counts[e] ?? 0) + 1;
  }
  const likeCount = Object.values(counts).reduce((s, n) => s + (n ?? 0), 0);

  await supabase
    .from("reels")
    .update({ reaction_counts: counts, like_count: likeCount })
    .eq("id", id);

  return NextResponse.json({ ok: true, added, counts, like_count: likeCount });
}
