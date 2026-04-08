import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ReactionEmoji } from "@/types/database";

const VALID_EMOJIS: ReactionEmoji[] = ["heart", "fire", "clap", "hundred", "pray"];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: highlightId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { emoji } = await request.json();

    if (!VALID_EMOJIS.includes(emoji)) {
      return NextResponse.json({ error: "Invalid emoji" }, { status: 400 });
    }

    // Check if reaction exists
    const { data: existing } = await supabase
      .from("highlight_reactions")
      .select("highlight_id")
      .match({ highlight_id: highlightId, user_id: user.id, emoji })
      .single();

    if (existing) {
      await supabase
        .from("highlight_reactions")
        .delete()
        .match({ highlight_id: highlightId, user_id: user.id, emoji });
    } else {
      await supabase
        .from("highlight_reactions")
        .insert({ highlight_id: highlightId, user_id: user.id, emoji });
    }

    // Recount all reactions
    const { data: counts } = await supabase
      .from("highlight_reactions")
      .select("emoji")
      .eq("highlight_id", highlightId);

    const reactionCounts: Partial<Record<ReactionEmoji, number>> = {};
    if (counts) {
      for (const row of counts) {
        const e = row.emoji as ReactionEmoji;
        reactionCounts[e] = (reactionCounts[e] || 0) + 1;
      }
    }

    // Update denormalized counts
    await supabase
      .from("city_highlights")
      .update({ reaction_counts: reactionCounts })
      .eq("id", highlightId);

    return NextResponse.json({
      reaction_counts: reactionCounts,
      user_reacted: !existing,
    });
  } catch (error) {
    console.error("Highlight reaction error:", error);
    return NextResponse.json(
      { error: "Failed to update reaction" },
      { status: 500 }
    );
  }
}
