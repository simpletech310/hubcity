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

// GET /api/venues/[id]/sections — list sections ordered by sort_order (public)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: sections, error } = await supabase
      .from("venue_sections")
      .select("*")
      .eq("venue_id", id)
      .order("sort_order");

    if (error) throw error;

    return NextResponse.json({ sections });
  } catch (error) {
    console.error("List sections error:", error);
    return NextResponse.json({ error: "Failed to fetch sections" }, { status: 500 });
  }
}

// POST /api/venues/[id]/sections — create a section (admin only)
export async function POST(
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
    const { name, description, capacity, default_price, sort_order, color } = body;

    if (!name || capacity === undefined || default_price === undefined) {
      return NextResponse.json(
        { error: "name, capacity, and default_price are required" },
        { status: 400 }
      );
    }

    const { data: section, error } = await supabase
      .from("venue_sections")
      .insert({
        venue_id: id,
        name,
        description: description ?? null,
        capacity,
        default_price,
        sort_order: sort_order ?? 0,
        color: color ?? null,
      })
      .select("*")
      .single();

    if (error) throw error;

    await recalculateVenueCapacity(supabase, id);

    return NextResponse.json({ section }, { status: 201 });
  } catch (error) {
    console.error("Create section error:", error);
    return NextResponse.json({ error: "Failed to create section" }, { status: 500 });
  }
}
