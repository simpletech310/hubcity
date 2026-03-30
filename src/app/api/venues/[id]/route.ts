import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "city_official"].includes(profile.role)) return null;
  return user;
}

// GET /api/venues/[id] — single venue with sections (public)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: venue, error } = await supabase
      .from("venues")
      .select("*, sections:venue_sections(*)")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Venue not found" }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json({ venue });
  } catch (error) {
    console.error("Get venue error:", error);
    return NextResponse.json({ error: "Failed to fetch venue" }, { status: 500 });
  }
}

// PATCH /api/venues/[id] — update venue fields (admin only)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const admin = await requireAdmin(supabase);
    if (!admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const allowedFields = [
      "name",
      "slug",
      "address",
      "latitude",
      "longitude",
      "image_url",
      "total_capacity",
      "is_active",
    ];

    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const { data: venue, error } = await supabase
      .from("venues")
      .update(updates)
      .eq("id", id)
      .select("*, sections:venue_sections(*)")
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Venue not found" }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json({ venue });
  } catch (error) {
    console.error("Update venue error:", error);
    return NextResponse.json({ error: "Failed to update venue" }, { status: 500 });
  }
}

// DELETE /api/venues/[id] — soft-delete (set is_active = false, admin only)
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const admin = await requireAdmin(supabase);
    if (!admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { error } = await supabase
      .from("venues")
      .update({ is_active: false })
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete venue error:", error);
    return NextResponse.json({ error: "Failed to delete venue" }, { status: 500 });
  }
}
