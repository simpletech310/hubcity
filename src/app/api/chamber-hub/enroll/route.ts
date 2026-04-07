import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const CHAMBER_SLUG = "compton-chamber-of-commerce";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify business owner role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "business_owner") {
      return NextResponse.json(
        { error: "Only business owners can join the chamber" },
        { status: 403 }
      );
    }

    // Find or create the chamber group
    let { data: group } = await supabase
      .from("community_groups")
      .select("id, member_count")
      .eq("slug", CHAMBER_SLUG)
      .single();

    if (!group) {
      const { data: newGroup, error: createError } = await supabase
        .from("community_groups")
        .insert({
          name: "Compton Chamber of Commerce",
          slug: CHAMBER_SLUG,
          description:
            "The official Compton Chamber of Commerce community for local business owners. Share updates, network, and grow together.",
          category: "business",
          is_public: false,
          member_count: 0,
          created_by: user.id,
          is_active: true,
        })
        .select("id, member_count")
        .single();

      if (createError) {
        // Race condition: another request created it first
        const { data: existing } = await supabase
          .from("community_groups")
          .select("id, member_count")
          .eq("slug", CHAMBER_SLUG)
          .single();

        if (!existing) throw createError;
        group = existing;
      } else {
        group = newGroup;
      }
    }

    // Check if already a member
    const { data: membership } = await supabase
      .from("group_members")
      .select("user_id")
      .eq("group_id", group.id)
      .eq("user_id", user.id)
      .single();

    if (membership) {
      return NextResponse.json({
        group_id: group.id,
        already_member: true,
      });
    }

    // Join the group
    const { error: joinError } = await supabase
      .from("group_members")
      .insert({
        group_id: group.id,
        user_id: user.id,
        role: "member",
      });

    if (joinError) throw joinError;

    // Increment member count
    await supabase
      .from("community_groups")
      .update({ member_count: (group.member_count ?? 0) + 1 })
      .eq("id", group.id);

    return NextResponse.json({
      group_id: group.id,
      already_member: false,
    });
  } catch (error) {
    console.error("Chamber enroll error:", error);
    return NextResponse.json(
      { error: "Failed to enroll in chamber" },
      { status: 500 }
    );
  }
}
