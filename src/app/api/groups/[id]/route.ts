import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET single group details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: group, error } = await supabase
      .from("community_groups")
      .select("*, creator:profiles!community_groups_created_by_fkey(display_name, avatar_url)")
      .eq("id", id)
      .eq("is_active", true)
      .single();

    if (error || !group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Check current user's role
    let myRole: string | null = null;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: membership } = await supabase
        .from("group_members")
        .select("role")
        .eq("group_id", id)
        .eq("user_id", user.id)
        .single();

      myRole = membership?.role ?? null;
    }

    return NextResponse.json({ group, my_role: myRole });
  } catch (error) {
    console.error("Get group error:", error);
    return NextResponse.json({ error: "Failed to fetch group" }, { status: 500 });
  }
}

// PATCH edit group (admin only)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin role
    const { data: membership } = await supabase
      .from("group_members")
      .select("role")
      .eq("group_id", id)
      .eq("user_id", user.id)
      .single();

    if (!membership || membership.role !== "admin") {
      return NextResponse.json({ error: "Only admins can edit groups" }, { status: 403 });
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (body.name !== undefined) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.image_url !== undefined) updates.image_url = body.image_url;
    if (body.category !== undefined) updates.category = body.category;
    if (body.is_public !== undefined) updates.is_public = body.is_public;
    updates.updated_at = new Date().toISOString();

    const { data: group, error } = await supabase
      .from("community_groups")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ group });
  } catch (error) {
    console.error("Edit group error:", error);
    return NextResponse.json({ error: "Failed to edit group" }, { status: 500 });
  }
}
