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
      .from("health_resources")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !resource) {
      return NextResponse.json(
        { error: "Health resource not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ resource });
  } catch (error) {
    console.error("Get health resource error:", error);
    return NextResponse.json(
      { error: "Failed to get health resource" },
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

    if (profile?.role !== "admin" && profile?.role !== "city_official") {
      return NextResponse.json(
        { error: "Only admins and city officials can update health resources" },
        { status: 403 }
      );
    }

    // If city_official, verify ownership
    if (profile.role === "city_official") {
      const { data: existing } = await supabase
        .from("health_resources")
        .select("created_by")
        .eq("id", id)
        .single();

      if (existing?.created_by !== user.id) {
        return NextResponse.json(
          { error: "You can only edit your own health resources" },
          { status: 403 }
        );
      }
    }

    const body = await request.json();

    const allowedFields = [
      "name",
      "organization",
      "category",
      "description",
      "address",
      "phone",
      "website",
      "hours",
      "latitude",
      "longitude",
      "is_emergency",
      "is_free",
      "accepts_medicaid",
      "accepts_uninsured",
      "walk_ins_welcome",
      "languages",
      "is_published",
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
      .from("health_resources")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ resource });
  } catch (error) {
    console.error("Update health resource error:", error);
    return NextResponse.json(
      { error: "Failed to update health resource" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Verify admin role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can delete health resources" },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from("health_resources")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete health resource error:", error);
    return NextResponse.json(
      { error: "Failed to delete health resource" },
      { status: 500 }
    );
  }
}
