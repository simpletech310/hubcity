import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/polls/[id] — Get single poll with options and author
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: poll, error } = await supabase
      .from("polls")
      .select(
        "*, options:poll_options(*), author:profiles(id, display_name, avatar_url, role, verification_status)"
      )
      .eq("id", id)
      .single();

    if (error || !poll) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    return NextResponse.json({ poll });
  } catch (error) {
    console.error("Poll fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch poll" },
      { status: 500 }
    );
  }
}

// PATCH /api/polls/[id] — Update poll status (close). Author only.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check auth
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify author
    const { data: poll } = await supabase
      .from("polls")
      .select("author_id")
      .eq("id", id)
      .single();

    if (!poll) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    if (poll.author_id !== user.id) {
      return NextResponse.json(
        { error: "Only the author can update this poll" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { status } = body;

    if (status && !["active", "closed"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const { data: updated, error } = await supabase
      .from("polls")
      .update({ status })
      .eq("id", id)
      .select(
        "*, options:poll_options(*), author:profiles(id, display_name, avatar_url, role, verification_status)"
      )
      .single();

    if (error) throw error;

    return NextResponse.json({ poll: updated });
  } catch (error) {
    console.error("Poll update error:", error);
    return NextResponse.json(
      { error: "Failed to update poll" },
      { status: 500 }
    );
  }
}
