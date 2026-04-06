import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
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

    // Verify the user is the poster of this job listing (or admin)
    const { data: listing } = await supabase
      .from("job_listings")
      .select("id, posted_by")
      .eq("id", jobListingId)
      .single();

    if (!listing) {
      return NextResponse.json(
        { error: "Job listing not found" },
        { status: 404 }
      );
    }

    const isOwner = listing.posted_by === user.id;
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

    const { data: applications, error } = await supabase
      .from("job_applications")
      .select(
        "*, applicant:profiles(id, display_name, avatar_url, email:handle)"
      )
      .eq("job_listing_id", jobListingId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ applications: applications ?? [] });
  } catch (error) {
    console.error("Get job applications error:", error);
    return NextResponse.json(
      { error: "Failed to get applications" },
      { status: 500 }
    );
  }
}
