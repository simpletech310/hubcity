import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    const { data: issue, error } = await supabase
      .from("city_issues")
      .select(
        "*, reporter:profiles!reported_by(id, display_name, avatar_url, district)"
      )
      .eq("id", id)
      .single();

    if (error || !issue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    // Get upvote count and check if current user has upvoted
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let userUpvoted = false;
    if (user) {
      const { data: upvote } = await supabase
        .from("city_issue_upvotes")
        .select("issue_id")
        .eq("issue_id", id)
        .eq("user_id", user.id)
        .single();
      userUpvoted = !!upvote;
    }

    return NextResponse.json({ issue, user_upvoted: userUpvoted });
  } catch (error) {
    console.error("Fetch issue error:", error);
    return NextResponse.json(
      { error: "Failed to fetch issue" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["admin", "city_official", "city_ambassador"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.status) {
      updates.status = body.status;
      if (body.status === "acknowledged") {
        updates.acknowledged_at = new Date().toISOString();
      }
      if (body.status === "resolved") {
        updates.resolved_at = new Date().toISOString();
        updates.resolved_by = user.id;
      }
    }
    if (body.priority) updates.priority = body.priority;
    if (body.resolution_notes !== undefined)
      updates.resolution_notes = body.resolution_notes;
    if (body.assigned_department !== undefined)
      updates.assigned_department = body.assigned_department;

    const { data: issue, error } = await supabase
      .from("city_issues")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;

    // Audit log
    await supabase.from("audit_log").insert({
      actor_id: user.id,
      action: "update_issue",
      target_type: "issue",
      target_id: id,
      details: updates,
    });

    return NextResponse.json({ issue });
  } catch (error) {
    console.error("Update issue error:", error);
    return NextResponse.json(
      { error: "Failed to update issue" },
      { status: 500 }
    );
  }
}
