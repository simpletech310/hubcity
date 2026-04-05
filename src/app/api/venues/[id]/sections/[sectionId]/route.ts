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

  if (!profile || !["admin", "city_official", "city_ambassador"].includes(profile.role)) return null;
  return user;
}

async function recalculateVenueCapacity(
  supabase: Awaited<ReturnType<typeof createClient>>,
  venueId: string
) {
  const { data: sections } = await supabase
    .from("venue_sections")
    .select("capacity")
    .eq("venue_id", venueId);

  const total = (sections ?? []).reduce((sum, s) => sum + (s.capacity ?? 0), 0);

  await supabase
    .from("venues")
    .update({ total_capacity: total })
    .eq("id", venueId);
}

// PATCH /api/venues/[id]/sections/[sectionId] — update section fields (admin only)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; sectionId: string }> }
) {
  try {
    const { id, sectionId } = await params;
    const supabase = await createClient();
    const admin = await requireAdmin(supabase);
    if (!admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const allowedFields = [
      "name",
      "description",
      "capacity",
      "default_price",
      "sort_order",
      "color",
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

    const { data: section, error } = await supabase
      .from("venue_sections")
      .update(updates)
      .eq("id", sectionId)
      .eq("venue_id", id)
      .select("*")
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Section not found" }, { status: 404 });
      }
      throw error;
    }

    await recalculateVenueCapacity(supabase, id);

    return NextResponse.json({ section });
  } catch (error) {
    console.error("Update section error:", error);
    return NextResponse.json({ error: "Failed to update section" }, { status: 500 });
  }
}

// DELETE /api/venues/[id]/sections/[sectionId] — delete section (admin only)
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; sectionId: string }> }
) {
  try {
    const { id, sectionId } = await params;
    const supabase = await createClient();
    const admin = await requireAdmin(supabase);
    if (!admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { error } = await supabase
      .from("venue_sections")
      .delete()
      .eq("id", sectionId)
      .eq("venue_id", id);

    if (error) throw error;

    await recalculateVenueCapacity(supabase, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete section error:", error);
    return NextResponse.json({ error: "Failed to delete section" }, { status: 500 });
  }
}
