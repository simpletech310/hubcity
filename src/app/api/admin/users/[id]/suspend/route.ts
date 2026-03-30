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

    const { data: actor } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!actor || actor.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: targetUserId } = await params;
    const { suspended, reason } = await request.json();

    if (targetUserId === user.id) {
      return NextResponse.json(
        { error: "Cannot suspend yourself" },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    const { data: target } = await adminClient
      .from("profiles")
      .select("display_name, is_suspended")
      .eq("id", targetUserId)
      .single();

    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updates: Record<string, unknown> = {
      is_suspended: !!suspended,
      updated_at: new Date().toISOString(),
    };

    if (suspended) {
      updates.suspended_at = new Date().toISOString();
      updates.suspended_reason = reason || null;
    } else {
      updates.suspended_at = null;
      updates.suspended_reason = null;
    }

    const { error: updateError } = await adminClient
      .from("profiles")
      .update(updates)
      .eq("id", targetUserId);

    if (updateError) throw updateError;

    // Audit log
    await adminClient.from("audit_log").insert({
      actor_id: user.id,
      action: suspended ? "suspend_user" : "unsuspend_user",
      target_type: "user",
      target_id: targetUserId,
      details: {
        target_name: target.display_name,
        reason: reason || null,
      },
    });

    return NextResponse.json({
      success: true,
      suspended: !!suspended,
    });
  } catch (error) {
    console.error("Suspend error:", error);
    return NextResponse.json(
      { error: "Failed to update suspension" },
      { status: 500 }
    );
  }
}
