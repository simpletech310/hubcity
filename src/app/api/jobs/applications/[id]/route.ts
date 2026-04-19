import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendTransactionalEmail } from "@/lib/email";
import { statusChangedEmail } from "@/lib/emails/jobs/status-changed";
import { offeredEmail } from "@/lib/emails/jobs/offered";
import { rejectedEmail } from "@/lib/emails/jobs/rejected";

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
      .select("id, job_listing_id, status, full_name, email")
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
      .select("id, posted_by, title, organization_name")
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

    const { status, reviewer_notes } = (await request.json()) as {
      status?: string;
      reviewer_notes?: string;
    };

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

    // Notify the applicant whenever the stage moves. Best-effort.
    if (status && status !== application.status && application.email) {
      try {
        const ctx = {
          applicantName: application.full_name,
          jobTitle: listing?.title || "your application",
          organizationName: listing?.organization_name || "the hiring team",
          applicationId,
        };
        let mail;
        if (status === "offered") {
          mail = offeredEmail({ ...ctx, message: reviewer_notes ?? null });
        } else if (status === "rejected") {
          mail = rejectedEmail({ ...ctx, message: reviewer_notes ?? null });
        } else {
          mail = statusChangedEmail({ ...ctx, status });
        }
        await sendTransactionalEmail({ to: application.email, ...mail });
      } catch (mailErr) {
        console.error("Status change email failed:", mailErr);
      }
    }

    return NextResponse.json({ application: updated });
  } catch (error) {
    console.error("Update job application error:", error);
    return NextResponse.json(
      { error: "Failed to update application" },
      { status: 500 }
    );
  }
}
