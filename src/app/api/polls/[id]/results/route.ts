import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/polls/[id]/results — get detailed poll results (officials/admins only)
export async function GET(
  _request: Request,
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

    // Check role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["city_official", "admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Fetch poll with options
    const { data: poll } = await supabase
      .from("polls")
      .select("*, options:poll_options(*), author:profiles!posts_author_id_fkey(id, display_name)")
      .eq("id", pollId)
      .single();

    if (!poll) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    // Fetch votes with voter info (unless anonymous)
    let voters: Array<{
      option_id: string;
      created_at: string;
      voter?: { display_name: string; avatar_url: string | null };
    }> = [];

    if (!poll.is_anonymous) {
      const { data: votes } = await supabase
        .from("poll_votes")
        .select("option_id, created_at, voter:profiles!poll_votes_user_id_fkey(display_name, avatar_url)")
        .eq("poll_id", pollId)
        .order("created_at", { ascending: false });

      if (votes) {
        voters = votes.map((v) => ({
          option_id: v.option_id,
          created_at: v.created_at,
          voter: Array.isArray(v.voter) ? v.voter[0] : v.voter,
        }));
      }
    }

    // Build vote timeline (votes per hour for the last 48 hours)
    const { data: allVotes } = await supabase
      .from("poll_votes")
      .select("created_at")
      .eq("poll_id", pollId)
      .order("created_at");

    const timeline: { hour: string; count: number }[] = [];
    if (allVotes && allVotes.length > 0) {
      const hourMap = new Map<string, number>();
      for (const v of allVotes) {
        const d = new Date(v.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:00`;
        hourMap.set(key, (hourMap.get(key) || 0) + 1);
      }
      for (const [hour, count] of hourMap) {
        timeline.push({ hour, count });
      }
    }

    const options = ((poll.options || []) as Array<{
      id: string;
      label: string;
      emoji: string | null;
      vote_count: number;
      sort_order: number;
    }>).sort((a, b) => a.sort_order - b.sort_order);

    return NextResponse.json({
      poll: {
        id: poll.id,
        question: poll.question,
        poll_type: poll.poll_type,
        status: poll.status,
        total_votes: poll.total_votes,
        is_anonymous: poll.is_anonymous,
        ends_at: poll.ends_at,
        created_at: poll.created_at,
        author: poll.author,
      },
      options: options.map((o) => ({
        id: o.id,
        label: o.label,
        emoji: o.emoji,
        vote_count: o.vote_count,
        percentage: poll.total_votes > 0
          ? Math.round((o.vote_count / poll.total_votes) * 1000) / 10
          : 0,
      })),
      voters,
      timeline,
      total_votes: poll.total_votes,
    });
  } catch (error) {
    console.error("Poll results error:", error);
    return NextResponse.json(
      { error: "Failed to fetch results" },
      { status: 500 }
    );
  }
}
