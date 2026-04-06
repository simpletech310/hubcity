import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/polls — list polls (active by default, or all for officials with ?all=true)
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const showAll = searchParams.get("all") === "true";

    let query = supabase
      .from("polls")
      .select(
        "*, options:poll_options(*), author:profiles!polls_author_id_fkey(id, display_name, avatar_url, role, verification_status)"
      )
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (!showAll) {
      query = query.eq("status", "active");
    }

    const { data: polls, error } = await query.limit(50);

    if (error) throw error;

    return NextResponse.json({ polls: polls || [] });
  } catch (error) {
    console.error("Polls fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch polls" },
      { status: 500 }
    );
  }
}

// POST /api/polls — create a poll (city_official/admin only)
export async function POST(request: Request) {
  try {
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
      return NextResponse.json(
        { error: "Only city officials and admins can create polls" },
        { status: 403 }
      );
    }

    const { question, poll_type, options, ends_at, is_anonymous } =
      await request.json();

    if (
      !question ||
      typeof question !== "string" ||
      !question.trim()
    ) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    if (
      !options ||
      !Array.isArray(options) ||
      options.length < 2 ||
      options.length > 6
    ) {
      return NextResponse.json(
        { error: "Provide 2–6 options" },
        { status: 400 }
      );
    }

    // Create poll
    const { data: poll, error: pollError } = await supabase
      .from("polls")
      .insert({
        author_id: user.id,
        question: question.trim(),
        poll_type: poll_type || "multiple_choice",
        ends_at: ends_at || null,
        is_anonymous: is_anonymous || false,
        is_published: true,
      })
      .select("*")
      .single();

    if (pollError) throw pollError;

    // Create options
    const optionRows = options.map(
      (opt: { label: string; emoji?: string }, idx: number) => ({
        poll_id: poll.id,
        label: opt.label.trim(),
        emoji: opt.emoji || null,
        sort_order: idx,
      })
    );

    const { error: optError } = await supabase
      .from("poll_options")
      .insert(optionRows);

    if (optError) throw optError;

    // Fetch complete poll with options
    const { data: completePoll } = await supabase
      .from("polls")
      .select(
        "*, options:poll_options(*), author:profiles!polls_author_id_fkey(id, display_name, avatar_url, role, verification_status)"
      )
      .eq("id", poll.id)
      .single();

    return NextResponse.json({ poll: completePoll });
  } catch (error) {
    console.error("Poll creation error:", error);
    return NextResponse.json(
      { error: "Failed to create poll" },
      { status: 500 }
    );
  }
}
