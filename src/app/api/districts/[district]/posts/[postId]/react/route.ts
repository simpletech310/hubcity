import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const VALID_EMOJIS = ["heart", "fire", "clap", "hundred", "pray"];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ district: string; postId: string }> }
) {
  try {
    const { postId } = await params;
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

    // Toggle reaction
    const { data: existing } = await supabase
      .from("district_post_reactions")
      .select("district_post_id")
      .match({ district_post_id: postId, user_id: user.id, emoji })
      .single();

    if (existing) {
      await supabase
        .from("district_post_reactions")
        .delete()
        .match({ district_post_id: postId, user_id: user.id, emoji });
    } else {
      await supabase
        .from("district_post_reactions")
        .insert({ district_post_id: postId, user_id: user.id, emoji });
    }

    // Recount all reactions for this post
    const { data: counts } = await supabase
      .from("district_post_reactions")
      .select("emoji")
      .eq("district_post_id", postId);

    const reactionCounts: Record<string, number> = {};
    if (counts) {
      for (const row of counts) {
        reactionCounts[row.emoji] = (reactionCounts[row.emoji] || 0) + 1;
      }
    }

    // Update denormalized counts on post
    await supabase
      .from("district_posts")
      .update({ reaction_counts: reactionCounts })
      .eq("id", postId);

    return NextResponse.json({
      reacted: !existing,
      reaction_counts: reactionCounts,
    });
  } catch (error) {
    console.error("District post reaction error:", error);
    return NextResponse.json(
      { error: "Failed to update reaction" },
      { status: 500 }
    );
  }
}
