import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const VALID_EMOJIS = ["heart", "fire", "clap", "hundred", "pray"];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; postId: string }> }
) {
  try {
    const { id: groupId, postId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify membership
    const { data: membership } = await supabase
      .from("group_members")
      .select("role")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: "Must be a member to react" }, { status: 403 });
    }

    const { emoji } = await request.json();

    if (!VALID_EMOJIS.includes(emoji)) {
      return NextResponse.json({ error: "Invalid emoji" }, { status: 400 });
    }

    // Toggle reaction
    const { data: existing } = await supabase
      .from("group_post_reactions")
      .select("group_post_id")
      .match({ group_post_id: postId, user_id: user.id, emoji })
      .single();

    if (existing) {
      await supabase
        .from("group_post_reactions")
        .delete()
        .match({ group_post_id: postId, user_id: user.id, emoji });
    } else {
      await supabase
        .from("group_post_reactions")
        .insert({ group_post_id: postId, user_id: user.id, emoji });
    }

    // Recount
    const { data: counts } = await supabase
      .from("group_post_reactions")
      .select("emoji")
      .eq("group_post_id", postId);

    const reactionCounts: Record<string, number> = {};
    if (counts) {
      for (const row of counts) {
        reactionCounts[row.emoji] = (reactionCounts[row.emoji] || 0) + 1;
      }
    }

    await supabase
      .from("group_posts")
      .update({ reaction_counts: reactionCounts })
      .eq("id", postId);

    return NextResponse.json({
      reaction_counts: reactionCounts,
      user_reacted: !existing,
    });
  } catch (error) {
    console.error("Group reaction error:", error);
    return NextResponse.json({ error: "Failed to update reaction" }, { status: 500 });
  }
}
