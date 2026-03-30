import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

    // Require admin or city_official role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["admin", "city_official"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { status, action_taken } = body;

    if (!status || !["reviewed", "dismissed"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be 'reviewed' or 'dismissed'" },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // Get current report for audit
    const { data: existing } = await adminClient
      .from("content_reports")
      .select("*")
      .eq("id", id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const previousStatus = existing.status;

    // Update the report
    const updates: Record<string, unknown> = {
      status,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    };

    if (action_taken !== undefined) {
      updates.action_taken = action_taken;
    }

    const { data: updated, error: updateError } = await adminClient
      .from("content_reports")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (updateError) throw updateError;

    // Audit log
    await adminClient.from("audit_log").insert({
      admin_id: user.id,
      action: "report_" + status,
      target_type: "content_report",
      target_id: id,
      details: {
        previous_status: previousStatus,
        new_status: status,
        content_type: existing.content_type,
        content_id: existing.content_id,
        action_taken: action_taken || null,
      },
    });

    return NextResponse.json({ report: updated });
  } catch (error) {
    console.error("Update report error:", error);
    return NextResponse.json(
      { error: "Failed to update report" },
      { status: 500 }
    );
  }
}
