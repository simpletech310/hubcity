import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: issueId } = await params;

    // Check if already upvoted
    const { data: existing } = await supabase
      .from("city_issue_upvotes")
      .select("issue_id")
      .eq("issue_id", issueId)
      .eq("user_id", user.id)
      .single();

    if (existing) {
      // Remove upvote
      await supabase
        .from("city_issue_upvotes")
        .delete()
        .eq("issue_id", issueId)
        .eq("user_id", user.id);

      // Recalculate count
      const { count } = await supabase
        .from("city_issue_upvotes")
        .select("*", { count: "exact", head: true })
        .eq("issue_id", issueId);

      await supabase
        .from("city_issues")
        .update({ upvote_count: (count ?? 0) + 1 }) // +1 for the original reporter
        .eq("id", issueId);

      return NextResponse.json({ upvoted: false, count: (count ?? 0) + 1 });
    }

    // Add upvote
    const { error } = await supabase
      .from("city_issue_upvotes")
      .insert({ issue_id: issueId, user_id: user.id });

    if (error) throw error;

    // Recalculate count
    const { count } = await supabase
      .from("city_issue_upvotes")
      .select("*", { count: "exact", head: true })
      .eq("issue_id", issueId);

    await supabase
      .from("city_issues")
      .update({ upvote_count: (count ?? 0) + 1 })
      .eq("id", issueId);

    return NextResponse.json({ upvoted: true, count: (count ?? 0) + 1 });
  } catch (error) {
    console.error("Upvote error:", error);
    return NextResponse.json(
      { error: "Failed to toggle upvote" },
      { status: 500 }
    );
  }
}
