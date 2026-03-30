import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

    // Only admin can change roles
    const { data: actor } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!actor || actor.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: targetUserId } = await params;
    const { role } = await request.json();

    const validRoles = ["citizen", "business_owner", "city_official", "admin"];
    if (!role || !validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be one of: " + validRoles.join(", ") },
        { status: 400 }
      );
    }

    // Cannot change own role
    if (targetUserId === user.id) {
      return NextResponse.json(
        { error: "Cannot change your own role" },
        { status: 400 }
      );
    }

    // Use admin client to bypass RLS
    const adminClient = createAdminClient();

    // Get current role for audit
    const { data: target } = await adminClient
      .from("profiles")
      .select("role, display_name")
      .eq("id", targetUserId)
      .single();

    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const previousRole = target.role;

    // Update role
    const { error: updateError } = await adminClient
      .from("profiles")
      .update({ role, updated_at: new Date().toISOString() })
      .eq("id", targetUserId);

    if (updateError) throw updateError;

    // Audit log
    await adminClient.from("audit_log").insert({
      actor_id: user.id,
      action: "role_change",
      target_type: "user",
      target_id: targetUserId,
      details: {
        previous_role: previousRole,
        new_role: role,
        target_name: target.display_name,
      },
    });

    return NextResponse.json({
      success: true,
      previous_role: previousRole,
      new_role: role,
    });
  } catch (error) {
    console.error("Role change error:", error);
    return NextResponse.json(
      { error: "Failed to change role" },
      { status: 500 }
    );
  }
}
