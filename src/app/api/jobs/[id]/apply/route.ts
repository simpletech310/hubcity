import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
    } = await request.json();

    if (!full_name || !email) {
      return NextResponse.json(
        { error: "full_name and email are required" },
        { status: 400 }
      );
    }

    // Verify the job listing exists and is active
    const { data: listing } = await supabase
      .from("job_listings")
      .select("id, application_count")
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
      .single();

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
        phone: phone || null,
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

    // Increment application_count on job_listings
    await supabase
      .from("job_listings")
      .update({ application_count: (listing.application_count ?? 0) + 1 })
      .eq("id", jobListingId);

    return NextResponse.json({ application });
  } catch (error) {
    console.error("Job application error:", error);
    return NextResponse.json(
      { error: "Failed to submit application" },
      { status: 500 }
    );
  }
}
