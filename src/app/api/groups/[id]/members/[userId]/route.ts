import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ROLE_RANK: Record<string, number> = { admin: 3, moderator: 2, member: 1 };

// DELETE — remove member
export async function DELETE(
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

    // Get caller's role
    const { data: callerMembership } = await supabase
      .from("group_members")
      .select("role")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .single();

    if (!callerMembership || !["admin", "moderator"].includes(callerMembership.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // Get target's role
    const { data: targetMembership } = await supabase
      .from("group_members")
      .select("role")
      .eq("group_id", groupId)
      .eq("user_id", userId)
      .single();

    if (!targetMembership) {
      return NextResponse.json({ error: "User is not a member" }, { status: 404 });
    }

    // Cannot remove someone with equal or higher role
    if ((ROLE_RANK[targetMembership.role] ?? 0) >= (ROLE_RANK[callerMembership.role] ?? 0)) {
      return NextResponse.json({ error: "Cannot remove a member with equal or higher role" }, { status: 403 });
    }

    await supabase
      .from("group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", userId);

    // Update member count
    const { count } = await supabase
      .from("group_members")
      .select("user_id", { count: "exact", head: true })
      .eq("group_id", groupId);

    await supabase
      .from("community_groups")
      .update({ member_count: count ?? 0 })
      .eq("id", groupId);

    return NextResponse.json({ removed: true, member_count: count ?? 0 });
  } catch (error) {
    console.error("Remove member error:", error);
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  }
}

// PATCH — change role
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

    // Only admins can change roles
    const { data: callerMembership } = await supabase
      .from("group_members")
      .select("role")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .single();

    if (!callerMembership || callerMembership.role !== "admin") {
      return NextResponse.json({ error: "Only admins can change roles" }, { status: 403 });
    }

    const { role } = await request.json();

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
  } catch (error) {
    console.error("Change role error:", error);
    return NextResponse.json({ error: "Failed to change role" }, { status: 500 });
  }
}
