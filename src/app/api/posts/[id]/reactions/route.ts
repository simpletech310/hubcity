import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ReactionEmoji } from "@/types/database";

const VALID_EMOJIS: ReactionEmoji[] = ["heart", "fire", "clap", "hundred", "pray"];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { emoji } = await request.json();

    if (!VALID_EMOJIS.includes(emoji)) {
      return NextResponse.json({ error: "Invalid emoji" }, { status: 400 });
    }

    // Check if reaction exists
    const { data: existing } = await supabase
      .from("post_reactions")
      .select("post_id")
      .match({ post_id: postId, user_id: user.id, emoji })
      .single();

    if (existing) {
      // Remove reaction
      await supabase
        .from("post_reactions")
        .delete()
        .match({ post_id: postId, user_id: user.id, emoji });
    } else {
      // Add reaction
      await supabase
        .from("post_reactions")
        .insert({ post_id: postId, user_id: user.id, emoji });
    }

    // Recount all reactions for this post
    const { data: counts } = await supabase
      .from("post_reactions")
      .select("emoji")
      .eq("post_id", postId);

    const reactionCounts: Partial<Record<ReactionEmoji, number>> = {};
    if (counts) {
      for (const row of counts) {
        const e = row.emoji as ReactionEmoji;
        reactionCounts[e] = (reactionCounts[e] || 0) + 1;
      }
    }

    // Update denormalized counts on post
    await supabase
      .from("posts")
      .update({ reaction_counts: reactionCounts })
      .eq("id", postId);

    return NextResponse.json({
      reaction_counts: reactionCounts,
      user_reacted: !existing,
    });
  } catch (error) {
    console.error("Reaction error:", error);
    return NextResponse.json(
      { error: "Failed to update reaction" },
      { status: 500 }
    );
  }
}
