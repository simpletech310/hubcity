import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: applicationId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the application and verify ownership via posted_by
    const { data: application } = await supabase
      .from("job_applications")
      .select("id, job_listing_id")
      .eq("id", applicationId)
      .single();

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    // Check if user is the poster of the parent job listing
    const { data: listing } = await supabase
      .from("job_listings")
      .select("id, posted_by")
      .eq("id", application.job_listing_id)
      .single();

    const isOwner = listing?.posted_by === user.id;
    if (!isOwner) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const { status, reviewer_notes } = await request.json();

    const updates: Record<string, unknown> = {};
    if (status) {
      updates.status = status;
      updates.reviewed_at = new Date().toISOString();
    }
    if (reviewer_notes !== undefined) updates.reviewer_notes = reviewer_notes;

    const { data: updated, error } = await supabase
      .from("job_applications")
      .update(updates)
      .eq("id", applicationId)
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ application: updated });
  } catch (error) {
    console.error("Update job application error:", error);
    return NextResponse.json(
      { error: "Failed to update application" },
      { status: 500 }
    );
  }
}
