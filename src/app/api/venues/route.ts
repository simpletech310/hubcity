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

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// GET /api/venues — list all active venues with sections
export async function GET() {
  try {
    const supabase = await createClient();

    const { data: venues, error } = await supabase
      .from("venues")
      .select("*, sections:venue_sections(*)")
      .eq("is_active", true)
      .order("name");

    if (error) throw error;

    return NextResponse.json({ venues });
  } catch (error) {
    console.error("List venues error:", error);
    return NextResponse.json({ error: "Failed to fetch venues" }, { status: 500 });
  }
}

// POST /api/venues — create a venue (admin only)
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const admin = await requireAdmin(supabase);
    if (!admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { name, address, latitude, longitude, image_url, total_capacity } = body;

    if (!name || total_capacity === undefined) {
      return NextResponse.json(
        { error: "name and total_capacity are required" },
        { status: 400 }
      );
    }

    const slug = slugify(name);

    const { data: venue, error } = await supabase
      .from("venues")
      .insert({
        name,
        slug,
        address: address ?? null,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        image_url: image_url ?? null,
        total_capacity,
        is_active: true,
        created_by: admin.id,
      })
      .select("*, sections:venue_sections(*)")
      .single();

    if (error) throw error;

    return NextResponse.json({ venue }, { status: 201 });
  } catch (error) {
    console.error("Create venue error:", error);
    return NextResponse.json({ error: "Failed to create venue" }, { status: 500 });
  }
}
