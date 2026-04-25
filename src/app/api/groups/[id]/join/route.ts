import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/groups/[id]/join
 *
 * Toggles membership.
 *  - If not a member of a public group → joined ('active')
 *  - If not a member of a private group → joined ('pending') awaiting admin
 *  - If already pending → cancel request
 *  - If already active member → leave (admins cannot leave)
 *  - If creator joining their own group → admin role, active status
 */
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

    const { id: groupId } = await params;

    // Existing membership row?
    const { data: existing } = await supabase
      .from("group_members")
      .select("group_id, role, status")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .single();

    if (existing) {
      // Admins must transfer ownership before leaving.
      if (existing.role === "admin") {
        return NextResponse.json(
          {
            joined: true,
            status: existing.status,
            member_count: 0,
            error: "Admins cannot leave the group",
          },
          { status: 400 }
        );
      }

      // Leave / cancel pending request.
      await supabase
        .from("group_members")
        .delete()
        .eq("group_id", groupId)
        .eq("user_id", user.id);

      // Recount only ACTIVE members.
      const { count } = await supabase
        .from("group_members")
        .select("*", { count: "exact", head: true })
        .eq("group_id", groupId)
        .eq("status", "active");

      await supabase
        .from("community_groups")
        .update({ member_count: count ?? 0 })
        .eq("id", groupId);

      return NextResponse.json({
        joined: false,
        status: null,
        member_count: count ?? 0,
      });
    }

    // No row yet → decide initial role + status.
    const { data: groupInfo } = await supabase
      .from("community_groups")
      .select("created_by, is_public")
      .eq("id", groupId)
      .single();

    if (!groupInfo) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    const isCreator = groupInfo.created_by === user.id;
    const role = isCreator ? "admin" : "member";
    // Creator always lands as active. Otherwise: public = active, private = pending.
    const status = isCreator || groupInfo.is_public ? "active" : "pending";

    const { error } = await supabase
      .from("group_members")
      .insert({ group_id: groupId, user_id: user.id, role, status });

    if (error) throw error;

    // Only count active members
    const { count } = await supabase
      .from("group_members")
      .select("*", { count: "exact", head: true })
      .eq("group_id", groupId)
      .eq("status", "active");

    await supabase
      .from("community_groups")
      .update({ member_count: count ?? 0 })
      .eq("id", groupId);

    return NextResponse.json({
      joined: true,
      status,
      role,
      member_count: count ?? 0,
    });
  } catch (error) {
    console.error("Join group error:", error);
    return NextResponse.json(
      { error: "Failed to toggle membership" },
      { status: 500 }
    );
  }
}
