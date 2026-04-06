import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const selectFields =
      "*, business:businesses(id, name, slug, image_urls, address), poster:profiles!job_listings_posted_by_fkey(id, display_name, avatar_url, role)";

    // Try slug first, then id
    let { data: job } = await supabase
      .from("job_listings")
      .select(selectFields)
      .eq("slug", id)
      .eq("is_active", true)
      .single();

    if (!job) {
      const { data } = await supabase
        .from("job_listings")
        .select(selectFields)
        .eq("id", id)
        .eq("is_active", true)
        .single();
      job = data;
    }

    if (!job) {
      return NextResponse.json(
        { error: "Job listing not found" },
        { status: 404 }
      );
    }

    // Increment views_count (fire-and-forget)
    supabase
      .from("job_listings")
      .update({ views_count: (job.views_count ?? 0) + 1 })
      .eq("id", job.id)
      .then(() => {});

    return NextResponse.json({ job });
  } catch (error) {
    console.error("Get job listing error:", error);
    return NextResponse.json(
      { error: "Failed to get job listing" },
      { status: 500 }
    );
  }
}

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

    // Get listing and verify ownership via posted_by
    const { data: listing } = await supabase
      .from("job_listings")
      .select("id, posted_by")
      .eq("id", id)
      .single();

    if (!listing) {
      return NextResponse.json(
        { error: "Job listing not found" },
        { status: 404 }
      );
    }

    // Check ownership or admin
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

    const body = await request.json();
    const allowedFields = [
      "title",
      "description",
      "requirements",
      "job_type",
      "salary_min",
      "salary_max",
      "salary_type",
      "location",
      "is_remote",
      "is_active",
      "application_deadline",
      "contact_email",
      "contact_phone",
      "organization_name",
    ];
    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    const { data: job, error } = await supabase
      .from("job_listings")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ job });
  } catch (error) {
    console.error("Update job listing error:", error);
    return NextResponse.json(
      { error: "Failed to update job listing" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
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

    // Get listing and verify ownership via posted_by
    const { data: listing } = await supabase
      .from("job_listings")
      .select("id, posted_by")
      .eq("id", id)
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

    // Soft delete — deactivate
    const { error } = await supabase
      .from("job_listings")
      .update({ is_active: false })
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete job listing error:", error);
    return NextResponse.json(
      { error: "Failed to delete job listing" },
      { status: 500 }
    );
  }
}
