import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ROLE_RANK: Record<string, number> = { admin: 3, moderator: 2, member: 1 };

/**
 * Helper: recompute and persist active-only member count.
 */
async function refreshMemberCount(
  supabase: Awaited<ReturnType<typeof createClient>>,
  groupId: string
) {
  const { count } = await supabase
    .from("group_members")
    .select("user_id", { count: "exact", head: true })
    .eq("group_id", groupId)
    .eq("status", "active");

  await supabase
    .from("community_groups")
    .update({ member_count: count ?? 0 })
    .eq("id", groupId);

  return count ?? 0;
}

/**
 * DELETE /api/groups/[id]/members/[userId]
 * Used for both:
 *   - Rejecting a pending request
 *   - Revoking an existing member's access
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const { id: groupId, userId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Caller must be admin / moderator (and active).
    const { data: callerMembership } = await supabase
      .from("group_members")
      .select("role, status")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .single();

    if (
      !callerMembership ||
      callerMembership.status !== "active" ||
      !["admin", "moderator"].includes(callerMembership.role)
    ) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { data: targetMembership } = await supabase
      .from("group_members")
      .select("role, status")
      .eq("group_id", groupId)
      .eq("user_id", userId)
      .single();

    if (!targetMembership) {
      return NextResponse.json({ error: "User is not a member" }, { status: 404 });
    }

    // Role guard only matters for active members; pending users can be rejected freely.
    if (
      targetMembership.status === "active" &&
      (ROLE_RANK[targetMembership.role] ?? 0) >= (ROLE_RANK[callerMembership.role] ?? 0)
    ) {
      return NextResponse.json(
        { error: "Cannot remove a member with equal or higher role" },
        { status: 403 }
      );
    }

    await supabase
      .from("group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", userId);

    const memberCount = await refreshMemberCount(supabase, groupId);

    return NextResponse.json({ removed: true, member_count: memberCount });
  } catch (error) {
    console.error("Remove member error:", error);
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  }
}

/**
 * PATCH /api/groups/[id]/members/[userId]
 *
 * Body shapes:
 *   { role: 'member' | 'moderator' | 'admin' }   — admin only, target must be active
 *   { status: 'active' }                         — approve a pending request
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const { id: groupId, userId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: callerMembership } = await supabase
      .from("group_members")
      .select("role, status")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .single();

    if (!callerMembership || callerMembership.status !== "active") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const { role, status } = body as {
      role?: string;
      status?: string;
    };

    // ── Approval flow ──────────────────────────────────────
    if (status === "active") {
      // Admins or moderators can approve.
      if (!["admin", "moderator"].includes(callerMembership.role)) {
        return NextResponse.json(
          { error: "Only admins or moderators can approve members" },
          { status: 403 }
        );
      }

      const { data: target } = await supabase
        .from("group_members")
        .select("status")
        .eq("group_id", groupId)
        .eq("user_id", userId)
        .single();

      if (!target) {
        return NextResponse.json({ error: "Pending request not found" }, { status: 404 });
      }

      if (target.status === "active") {
        return NextResponse.json({ updated: true, status: "active" });
      }

      const { error } = await supabase
        .from("group_members")
        .update({ status: "active" })
        .eq("group_id", groupId)
        .eq("user_id", userId);

      if (error) throw error;

      const memberCount = await refreshMemberCount(supabase, groupId);
      return NextResponse.json({
        updated: true,
        status: "active",
        member_count: memberCount,
      });
    }

    // ── Role change ────────────────────────────────────────
    if (role) {
      if (callerMembership.role !== "admin") {
        return NextResponse.json(
          { error: "Only admins can change roles" },
          { status: 403 }
        );
      }

      if (!["member", "moderator", "admin"].includes(role)) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }

      const { error } = await supabase
        .from("group_members")
        .update({ role })
        .eq("group_id", groupId)
        .eq("user_id", userId);

      if (error) throw error;

      return NextResponse.json({ updated: true, role });
    }

    return NextResponse.json(
      { error: "Body must include `role` or `status`" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Update member error:", error);
    return NextResponse.json({ error: "Failed to update member" }, { status: 500 });
  }
}
