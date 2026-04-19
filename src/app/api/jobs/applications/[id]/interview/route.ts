import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendTransactionalEmail } from "@/lib/email";
import { interviewScheduledEmail } from "@/lib/emails/jobs/interview-scheduled";
import { statusChangedEmail } from "@/lib/emails/jobs/status-changed";

type ApplicationContext = {
  id: string;
  applicant_id: string;
  job_listing_id: string;
  full_name: string;
  email: string;
};

/**
 * Verifies caller is the job poster (employer) or admin for this application.
 * Returns the application + listing context, or a short-circuit Response.
 */
async function authorizeEmployer(
  supabase: Awaited<ReturnType<typeof createClient>>,
  applicationId: string,
  userId: string
): Promise<
  | {
      application: ApplicationContext;
      listing: { id: string; posted_by: string; title: string; organization_name: string | null };
    }
  | Response
> {
  const { data: application } = await supabase
    .from("job_applications")
    .select("id, applicant_id, job_listing_id, full_name, email")
    .eq("id", applicationId)
    .single();

  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  const { data: listing } = await supabase
    .from("job_listings")
    .select("id, posted_by, title, organization_name")
    .eq("id", application.job_listing_id)
    .single();

  if (!listing) {
    return NextResponse.json({ error: "Job listing missing" }, { status: 404 });
  }

  if (listing.posted_by !== userId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();
    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  return { application, listing };
}

/**
 * POST /api/jobs/applications/[id]/interview
 * Employer schedules a new interview. Emails the applicant.
 * Body: { scheduled_at, location?, meeting_url?, interviewer_note? }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: applicationId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const auth = await authorizeEmployer(supabase, applicationId, user.id);
    if (auth instanceof Response) return auth;
    const { application, listing } = auth;

    const { scheduled_at, location, meeting_url, interviewer_note } =
      (await request.json()) as {
        scheduled_at?: string;
        location?: string | null;
        meeting_url?: string | null;
        interviewer_note?: string | null;
      };

    if (!scheduled_at || Number.isNaN(Date.parse(scheduled_at))) {
      return NextResponse.json(
        { error: "scheduled_at must be an ISO timestamp" },
        { status: 400 }
      );
    }

    const { data: interview, error } = await supabase
      .from("job_interviews")
      .insert({
        application_id: applicationId,
        scheduled_at,
        location: location || null,
        meeting_url: meeting_url || null,
        interviewer_note: interviewer_note || null,
        status: "scheduled",
      })
      .select("*")
      .single();

    if (error) throw error;

    // Move the application into "interview" stage if it isn't already.
    await supabase
      .from("job_applications")
      .update({ status: "interview", reviewed_at: new Date().toISOString() })
      .eq("id", applicationId);

    // Notify the applicant.
    try {
      const mail = interviewScheduledEmail({
        applicantName: application.full_name,
        jobTitle: listing.title,
        organizationName: listing.organization_name || "the hiring team",
        scheduledAt: scheduled_at,
        location: location ?? null,
        meetingUrl: meeting_url ?? null,
        interviewerNote: interviewer_note ?? null,
        applicationId,
      });
      await sendTransactionalEmail({ to: application.email, ...mail });
    } catch (mailErr) {
      console.error("Interview email failed:", mailErr);
    }

    return NextResponse.json({ interview });
  } catch (error) {
    console.error("Schedule interview error:", error);
    return NextResponse.json(
      { error: "Failed to schedule interview" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/jobs/applications/[id]/interview
 * Body: { interview_id, status?, scheduled_at?, location?, meeting_url?, interviewer_note? }
 * Updates an existing interview. Sends a status-change email when status moves.
 */
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

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const auth = await authorizeEmployer(supabase, applicationId, user.id);
    if (auth instanceof Response) return auth;
    const { application, listing } = auth;

    const body = (await request.json()) as {
      interview_id?: string;
      status?: "scheduled" | "completed" | "cancelled" | "no_show";
      scheduled_at?: string;
      location?: string | null;
      meeting_url?: string | null;
      interviewer_note?: string | null;
    };

    if (!body.interview_id) {
      return NextResponse.json(
        { error: "interview_id is required" },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.status) updates.status = body.status;
    if (body.scheduled_at) {
      if (Number.isNaN(Date.parse(body.scheduled_at))) {
        return NextResponse.json(
          { error: "scheduled_at must be an ISO timestamp" },
          { status: 400 }
        );
      }
      updates.scheduled_at = body.scheduled_at;
    }
    if (body.location !== undefined) updates.location = body.location;
    if (body.meeting_url !== undefined) updates.meeting_url = body.meeting_url;
    if (body.interviewer_note !== undefined) updates.interviewer_note = body.interviewer_note;

    const { data: interview, error } = await supabase
      .from("job_interviews")
      .update(updates)
      .eq("id", body.interview_id)
      .eq("application_id", applicationId)
      .select("*")
      .single();

    if (error) throw error;

    // If cancelled or completed, ping the applicant with a status note.
    if (body.status === "cancelled" || body.status === "completed" || body.status === "no_show") {
      try {
        const mail = statusChangedEmail({
          applicantName: application.full_name,
          jobTitle: listing.title,
          organizationName: listing.organization_name || "the hiring team",
          status: body.status === "cancelled" ? "reviewing" : "interview",
          applicationId,
        });
        await sendTransactionalEmail({ to: application.email, ...mail });
      } catch (mailErr) {
        console.error("Interview update email failed:", mailErr);
      }
    }

    return NextResponse.json({ interview });
  } catch (error) {
    console.error("Update interview error:", error);
    return NextResponse.json(
      { error: "Failed to update interview" },
      { status: 500 }
    );
  }
}
