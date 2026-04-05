import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: resource, error } = await supabase
      .from("resources")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !resource) {
      return NextResponse.json(
        { error: "Resource not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ resource });
  } catch (error) {
    console.error("Get resource error:", error);
    return NextResponse.json(
      { error: "Failed to get resource" },
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

    // Verify role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin" && profile?.role !== "city_official" && profile?.role !== "city_ambassador") {
      return NextResponse.json(
        { error: "Only admins and city officials can update resources" },
        { status: 403 }
      );
    }

    // If city_official, verify ownership
    if (profile.role === "city_official") {
      const { data: existing } = await supabase
        .from("resources")
        .select("created_by")
        .eq("id", id)
        .single();

      if (existing?.created_by !== user.id) {
        return NextResponse.json(
          { error: "You can only edit your own resources" },
          { status: 403 }
        );
      }
    }

    const body = await request.json();

    // Only allow updating specific fields
    const allowedFields = [
      "name",
      "organization",
      "category",
      "description",
      "eligibility",
      "status",
      "deadline",
      "is_free",
      "address",
      "phone",
      "website",
      "hours",
      "district",
      "is_published",
      "accepts_applications",
      "application_fields",
    ];

    const updates: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in body) {
        updates[key] = body[key];
      }
    }

    // Regenerate slug if name changed
    if (updates.name) {
      updates.slug = (updates.name as string)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    }

    const { data: resource, error } = await supabase
      .from("resources")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ resource });
  } catch (error) {
    console.error("Update resource error:", error);
    return NextResponse.json(
      { error: "Failed to update resource" },
      { status: 500 }
    );
  }
}
