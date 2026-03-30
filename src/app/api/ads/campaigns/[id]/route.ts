import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// PATCH /api/ads/campaigns/[id] — update campaign status, budget, targeting
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

    // Check user role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Fetch the campaign
    const { data: campaign, error: fetchError } = await supabase
      .from("ad_campaigns")
      .select("*, businesses:business_id(owner_id)")
      .eq("id", id)
      .single();

    if (fetchError || !campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    // Verify ownership or admin
    const isOwner = campaign.businesses?.owner_id === user.id;
    const isAdmin = profile.role === "admin";

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "Not authorized to update this campaign" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (body.status !== undefined) {
      const validStatuses = ["draft", "pending_review", "active", "paused", "completed"];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
          { status: 400 }
        );
      }
      updates.status = body.status;
    }

    if (body.budget_cents !== undefined) {
      updates.budget_cents = Number(body.budget_cents);
    }

    if (body.targeting !== undefined) {
      updates.targeting = body.targeting;
    }

    if (body.start_date !== undefined) {
      updates.start_date = body.start_date;
    }

    if (body.end_date !== undefined) {
      updates.end_date = body.end_date;
    }

    if (body.name !== undefined) {
      updates.name = body.name.trim();
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No updates provided" },
        { status: 400 }
      );
    }

    updates.updated_at = new Date().toISOString();

    const { data: updated, error: updateError } = await supabase
      .from("ad_campaigns")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({ campaign: updated });
  } catch (error) {
    console.error("Update campaign error:", error);
    return NextResponse.json(
      { error: "Failed to update campaign" },
      { status: 500 }
    );
  }
}
