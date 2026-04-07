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

    const { id: groupId } = await params;

    // Check if already a member
    const { data: existing } = await supabase
      .from("group_members")
      .select("group_id, role")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .single();

    if (existing) {
      // Prevent admins from leaving (must transfer ownership first)
      if (existing.role === "admin") {
        return NextResponse.json({ joined: true, member_count: 0, error: "Admins cannot leave the group" }, { status: 400 });
      }

      // Leave group
      await supabase
        .from("group_members")
        .delete()
        .eq("group_id", groupId)
        .eq("user_id", user.id);

      // Decrement member count
      const { count } = await supabase
        .from("group_members")
        .select("*", { count: "exact", head: true })
        .eq("group_id", groupId);

      await supabase
        .from("community_groups")
        .update({ member_count: count ?? 0 })
        .eq("id", groupId);

      return NextResponse.json({ joined: false, member_count: count ?? 0 });
    }

    // Check if user is the group creator — assign admin role
    const { data: groupInfo } = await supabase
      .from("community_groups")
      .select("created_by")
      .eq("id", groupId)
      .single();

    const role = groupInfo?.created_by === user.id ? "admin" : "member";

    // Join group
    const { error } = await supabase
      .from("group_members")
      .insert({ group_id: groupId, user_id: user.id, role });

    if (error) throw error;

    const { count } = await supabase
      .from("group_members")
      .select("*", { count: "exact", head: true })
      .eq("group_id", groupId);

    await supabase
      .from("community_groups")
      .update({ member_count: count ?? 0 })
      .eq("id", groupId);

    return NextResponse.json({ joined: true, member_count: count ?? 0 });
  } catch (error) {
    console.error("Join group error:", error);
    return NextResponse.json(
      { error: "Failed to toggle membership" },
      { status: 500 }
    );
  }
}
