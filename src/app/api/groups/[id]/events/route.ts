import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET — list events for this group
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: events, error } = await supabase
      .from("events")
      .select("*")
      .eq("group_id", id)
      .eq("is_published", true)
      .order("start_date", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ events: events ?? [] });
  } catch (error) {
    console.error("Fetch group events error:", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

// POST — create event for this group (admin/mod only)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin/mod role in group
    const { data: membership } = await supabase
      .from("group_members")
      .select("role")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .single();

    if (!membership || !["admin", "moderator"].includes(membership.role)) {
      return NextResponse.json({ error: "Only admins/mods can create events" }, { status: 403 });
    }

    const body = await request.json();

    if (!body.title?.trim() || !body.start_date) {
      return NextResponse.json({ error: "Title and start date are required" }, { status: 400 });
    }

    // Generate slug
    const slug = body.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) + "-" + Date.now().toString(36);

    const { data: event, error } = await supabase
      .from("events")
      .insert({
        title: body.title.trim(),
        slug,
        description: body.description?.trim() || null,
        category: body.category || "community",
        start_date: body.start_date,
        start_time: body.start_time || null,
        end_date: body.end_date || null,
        end_time: body.end_time || null,
        location_name: body.location_name?.trim() || null,
        address: body.address?.trim() || null,
        is_published: true,
        is_featured: false,
        is_ticketed: false,
        rsvp_count: 0,
        group_id: groupId,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ event });
  } catch (error) {
    console.error("Create group event error:", error);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}
