import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// PATCH /api/chamber/businesses/[id] — pause/remove/reactivate a business
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["chamber_admin", "admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const body = await request.json();
    const { chamber_status, chamber_notes } = body;

    const updateData: Record<string, unknown> = {};

    if (chamber_status) {
      updateData.chamber_status = chamber_status;
      if (chamber_status === "paused") {
        updateData.chamber_paused_at = new Date().toISOString();
      } else if (chamber_status === "active") {
        updateData.chamber_paused_at = null;
      }
    }

    if (chamber_notes !== undefined) {
      updateData.chamber_notes = chamber_notes;
    }

    const { data: updated, error } = await supabase
      .from("businesses")
      .update(updateData)
      .eq("id", id)
      .select("id, name, chamber_status, chamber_notes, chamber_paused_at")
      .single();

    if (error) throw error;

    return NextResponse.json({ business: updated });
  } catch (error) {
    console.error("Chamber business update error:", error);
    return NextResponse.json({ error: "Failed to update business" }, { status: 500 });
  }
}
