import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/polls/[id]/vote — cast or change vote
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pollId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { option_id } = await request.json();

    if (!option_id) {
      return NextResponse.json(
        { error: "option_id is required" },
        { status: 400 }
      );
    }

    // Verify poll is active
    const { data: poll } = await supabase
      .from("polls")
      .select("id, status, ends_at")
      .eq("id", pollId)
      .single();

    if (!poll) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    if (poll.status === "closed") {
      return NextResponse.json({ error: "Poll is closed" }, { status: 400 });
    }

    if (poll.ends_at && new Date(poll.ends_at) < new Date()) {
      // Auto-close expired poll
      await supabase
        .from("polls")
        .update({ status: "closed" })
        .eq("id", pollId);
      return NextResponse.json({ error: "Poll has expired" }, { status: 400 });
    }

    // Verify option belongs to this poll
    const { data: option } = await supabase
      .from("poll_options")
      .select("id")
      .eq("id", option_id)
      .eq("poll_id", pollId)
      .single();

    if (!option) {
      return NextResponse.json(
        { error: "Invalid option" },
        { status: 400 }
      );
    }

    // Check existing vote
    const { data: existingVote } = await supabase
      .from("poll_votes")
      .select("option_id")
      .eq("poll_id", pollId)
      .eq("user_id", user.id)
      .single();

    if (existingVote) {
      // If same option, remove vote
      if (existingVote.option_id === option_id) {
        await supabase
          .from("poll_votes")
          .delete()
          .eq("poll_id", pollId)
          .eq("user_id", user.id);

        // Decrement old option count
        await supabase.rpc("decrement_vote_count", {
          p_option_id: existingVote.option_id,
        });
      } else {
        // Change vote: delete old, insert new
        await supabase
          .from("poll_votes")
          .delete()
          .eq("poll_id", pollId)
          .eq("user_id", user.id);

        await supabase.from("poll_votes").insert({
          poll_id: pollId,
          option_id,
          user_id: user.id,
        });

        // Adjust counts
        await supabase.rpc("decrement_vote_count", {
          p_option_id: existingVote.option_id,
        });
        await supabase.rpc("increment_vote_count", {
          p_option_id: option_id,
        });
      }
    } else {
      // New vote
      await supabase.from("poll_votes").insert({
        poll_id: pollId,
        option_id,
        user_id: user.id,
      });

      await supabase.rpc("increment_vote_count", {
        p_option_id: option_id,
      });
    }

    // Recount total votes for poll
    const { count } = await supabase
      .from("poll_votes")
      .select("*", { count: "exact", head: true })
      .eq("poll_id", pollId);

    await supabase
      .from("polls")
      .update({ total_votes: count || 0 })
      .eq("id", pollId);

    // Return updated poll with options
    const { data: updatedPoll } = await supabase
      .from("polls")
      .select("*, options:poll_options(*)")
      .eq("id", pollId)
      .single();

    // Get user's current vote
    const { data: userVote } = await supabase
      .from("poll_votes")
      .select("option_id")
      .eq("poll_id", pollId)
      .eq("user_id", user.id)
      .single();

    return NextResponse.json({
      poll: updatedPoll,
      user_vote: userVote?.option_id || null,
    });
  } catch (error) {
    console.error("Vote error:", error);
    return NextResponse.json(
      { error: "Failed to cast vote" },
      { status: 500 }
    );
  }
}

// DELETE /api/polls/[id]/vote — remove vote (unvote)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pollId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find existing vote
    const { data: existingVote } = await supabase
      .from("poll_votes")
      .select("option_id")
      .eq("poll_id", pollId)
      .eq("user_id", user.id)
      .single();

    if (!existingVote) {
      return NextResponse.json(
        { error: "You have not voted on this poll" },
        { status: 404 }
      );
    }

    // Delete vote
    const { error: deleteError } = await supabase
      .from("poll_votes")
      .delete()
      .eq("poll_id", pollId)
      .eq("user_id", user.id);

    if (deleteError) throw deleteError;

    // Decrement option vote count
    await supabase.rpc("decrement_vote_count", {
      p_option_id: existingVote.option_id,
    });

    // Recount total votes
    const { count } = await supabase
      .from("poll_votes")
      .select("*", { count: "exact", head: true })
      .eq("poll_id", pollId);

    await supabase
      .from("polls")
      .update({ total_votes: count || 0 })
      .eq("id", pollId);

    // Return updated poll
    const { data: updatedPoll } = await supabase
      .from("polls")
      .select("*, options:poll_options(*)")
      .eq("id", pollId)
      .single();

    return NextResponse.json({
      poll: updatedPoll,
      user_vote: null,
    });
  } catch (error) {
    console.error("Unvote error:", error);
    return NextResponse.json(
      { error: "Failed to remove vote" },
      { status: 500 }
    );
  }
}
