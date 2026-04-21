import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ReactionEmoji } from "@/types/database";

/**
 * POST /api/reels/[id]/reactions { emoji }
 * - Toggle the signed-in user's emoji reaction on a reel.
 * - Recounts all reactions per emoji and writes the summary onto
 *   `reels.reaction_counts` so list queries don't have to aggregate.
 */

const VALID_EMOJIS: ReactionEmoji[] = ["heart", "fire", "clap", "hundred", "pray"];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: reelId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { emoji } = (await request.json()) as { emoji: ReactionEmoji };
    if (!VALID_EMOJIS.includes(emoji)) {
      return NextResponse.json({ error: "Invalid emoji" }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from("reel_reactions")
      .select("reel_id")
      .match({ reel_id: reelId, user_id: user.id, emoji })
      .maybeSingle();

    if (existing) {
      await supabase
        .from("reel_reactions")
        .delete()
        .match({ reel_id: reelId, user_id: user.id, emoji });
    } else {
      await supabase
        .from("reel_reactions")
        .insert({ reel_id: reelId, user_id: user.id, emoji });
    }

    const { data: counts } = await supabase
      .from("reel_reactions")
      .select("emoji")
      .eq("reel_id", reelId);

    const reactionCounts: Partial<Record<ReactionEmoji, number>> = {};
    for (const row of counts ?? []) {
      const e = row.emoji as ReactionEmoji;
      reactionCounts[e] = (reactionCounts[e] || 0) + 1;
    }

    // Denormalize — reels table may not have reaction_counts yet; try-write
    // and ignore column-missing errors rather than require a migration for
    // a perf-only denormalization.
    await supabase
      .from("reels")
      .update({ reaction_counts: reactionCounts })
      .eq("id", reelId);

    return NextResponse.json({
      reaction_counts: reactionCounts,
      user_reacted: !existing,
    });
  } catch (error) {
    console.error("Reel reaction error:", error);
    return NextResponse.json({ error: "Failed to update reaction" }, { status: 500 });
  }
}
