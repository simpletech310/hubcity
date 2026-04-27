import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_ROLES = [
  "business_owner",
  "city_official",
  "admin",
  "content_creator",
  "city_ambassador",
  "chamber_admin",
  "resource_provider",
  "school_trustee",
];

// GET — list events
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = request.nextUrl;
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const upcoming = searchParams.get("upcoming");

    let query = supabase
      .from("events")
      .select("*")
      .eq("is_published", true)
      .order("start_date", { ascending: true });

    if (category && category !== "all") {
      query = query.eq("category", category);
    }

    if (upcoming === "true") {
      query = query.gte("start_date", new Date().toISOString().split("T")[0]);
    }

    if (search) {
      query = query.or(
        `title.ilike.%${search}%,description.ilike.%${search}%,location_name.ilike.%${search}%`
      );
    }

    const { data, error } = await query.limit(50);
    if (error) throw error;

    return NextResponse.json({ events: data ?? [] });
  } catch (error) {
    console.error("Fetch events error:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

// POST — create a new event (non-citizen roles only)
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !ALLOWED_ROLES.includes(profile.role)) {
      return NextResponse.json(
        { error: "Only authorized roles can create events" },
        { status: 403 }
      );
    }

    const body = await request.json();

    if (!body.title?.trim() || !body.start_date) {
      return NextResponse.json(
        { error: "Title and start date are required" },
        { status: 400 }
      );
    }

    // Generate slug
    const slug =
      body.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 60) +
      "-" +
      Date.now().toString(36);

    const { data: event, error } = await supabase
      .from("events")
      .insert({
        title: body.title.trim(),
        slug,
        description: body.description?.trim() || null,
        category: body.category || "community",
        tags: Array.isArray(body.tags) ? body.tags : [],
        start_date: body.start_date,
        start_time: body.start_time || null,
        end_date: body.end_date || null,
        end_time: body.end_time || null,
        location_name: body.location_name?.trim() || null,
        address: body.address?.trim() || null,
        latitude: body.latitude || null,
        longitude: body.longitude || null,
        district: body.district || null,
        image_url: body.image_url || null,
        is_published: body.is_published === false ? false : true,
        is_featured: false,
        is_ticketed: body.is_ticketed || false,
        rsvp_count: 0,
        group_id: body.group_id || null,
        visibility: body.visibility || "public",
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ event });
  } catch (error) {
    console.error("Create event error:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}
