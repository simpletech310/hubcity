import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendTransactionalEmail } from "@/lib/email";
import { applicationReceivedEmail } from "@/lib/emails/jobs/application-received";

type ScreeningAnswer = { question_id: string; answer: string };
type EeoPayload = {
  gender?: string | null;
  race?: string | null;
  veteran_status?: string | null;
  disability?: string | null;
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobListingId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      full_name,
      email,
      phone,
      is_us_citizen,
      is_compton_resident,
      resume_url,
      references_text,
      cover_note,
      answers,
      eeo,
    } = (await request.json()) as {
      full_name?: string;
      email?: string;
      phone?: string;
      is_us_citizen?: boolean;
      is_compton_resident?: boolean;
      resume_url?: string | null;
      references_text?: string | null;
      cover_note?: string | null;
      answers?: ScreeningAnswer[];
      eeo?: EeoPayload;
    };

    if (!full_name || !email) {
      return NextResponse.json(
        { error: "full_name and email are required" },
        { status: 400 }
      );
    }

    // Verify the job listing exists and is active
    const { data: listing } = await supabase
      .from("job_listings")
      .select("id, title, organization_name, application_count")
      .eq("id", jobListingId)
      .eq("is_active", true)
      .single();

    if (!listing) {
      return NextResponse.json(
        { error: "Job listing not found or no longer active" },
        { status: 404 }
      );
    }

    // Check for duplicate application (UNIQUE constraint)
    const { data: existing } = await supabase
      .from("job_applications")
      .select("id")
      .eq("job_listing_id", jobListingId)
      .eq("applicant_id", user.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "You have already applied for this job" },
        { status: 409 }
      );
    }

    const { data: application, error } = await supabase
      .from("job_applications")
      .insert({
        job_listing_id: jobListingId,
        applicant_id: user.id,
        full_name,
        email,
        phone: phone || "",
        is_us_citizen: is_us_citizen ?? false,
        is_compton_resident: is_compton_resident ?? false,
        resume_url: resume_url || null,
        references_text: references_text || null,
        cover_note: cover_note || null,
        status: "submitted",
      })
      .select("*")
      .single();

    if (error) throw error;

    // Attach screening answers (best-effort; duplicates/missing questions are ignored).
    if (Array.isArray(answers) && answers.length > 0) {
      const answerRows = answers
        .filter((a) => a && a.question_id)
        .map((a) => ({
          application_id: application.id,
          question_id: a.question_id,
          answer: a.answer ?? null,
        }));
      if (answerRows.length > 0) {
        const { error: ansErr } = await supabase
          .from("job_application_answers")
          .insert(answerRows);
        if (ansErr) console.error("Screening answer insert failed:", ansErr);
      }
    }

    // Attach EEO response (applicant-only table; never visible to the employer).
    if (eeo && (eeo.gender || eeo.race || eeo.veteran_status || eeo.disability)) {
      const { error: eeoErr } = await supabase.from("job_eeo_responses").insert({
        application_id: application.id,
        gender: eeo.gender ?? null,
        race: eeo.race ?? null,
        veteran_status: eeo.veteran_status ?? null,
        disability: eeo.disability ?? null,
      });
      if (eeoErr) console.error("EEO response insert failed:", eeoErr);
    }

    // Increment application_count on job_listings
    await supabase
      .from("job_listings")
      .update({ application_count: (listing.application_count ?? 0) + 1 })
      .eq("id", jobListingId);

    // Confirmation email to the applicant (best-effort — do not fail the
    // request if SendGrid is down or unconfigured).
    try {
      const mail = applicationReceivedEmail({
        applicantName: full_name,
        jobTitle: listing.title,
        organizationName: listing.organization_name || "the hiring team",
        applicationId: application.id,
      });
      await sendTransactionalEmail({ to: email, ...mail });
    } catch (mailErr) {
      console.error("Application confirmation email failed:", mailErr);
    }

    return NextResponse.json({ application });
  } catch (error) {
    console.error("Job application error:", error);
    return NextResponse.json(
      { error: "Failed to submit application" },
      { status: 500 }
    );
  }
}
