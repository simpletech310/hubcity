import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * PATCH /api/events/[id]
 * Edit a non-ticketing field on an event. Allowed for the event's
 * created_by user (any non-citizen role) and admins. Ticketing-related
 * fields (is_ticketed, venue_id, sales window, ticket configs) stay
 * admin-only — those need a venue + section setup that the creator
 * isn't expected to manage from the public dashboard.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
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

    const { data: ev } = await supabase
      .from("events")
      .select("id, created_by")
      .eq("id", id)
      .single();
    if (!ev) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    const isAdmin = profile?.role === "admin";
    const isCreator = ev.created_by === user.id;
    if (!isCreator && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const editable: Record<string, unknown> = {};
    const allowed = [
      "title",
      "description",
      "category",
      "tags",
      "start_date",
      "start_time",
      "end_date",
      "end_time",
      "location_name",
      "address",
      "image_url",
      "is_published",
      "is_featured",
      "visibility",
    ];
    for (const k of allowed) {
      if (k in body) editable[k] = body[k];
    }
    if (Object.keys(editable).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }
    editable.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("events")
      .update(editable)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ event: data });
  } catch (err) {
    console.error("Event PATCH error:", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

/**
 * DELETE /api/events/[id]
 * Hard-delete an event. Allowed for created_by + admin. Cascades
 * (per FK) drop attendees, ticket configs, and order items.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
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

    const { data: ev } = await supabase
      .from("events")
      .select("id, created_by, is_ticketed")
      .eq("id", id)
      .single();
    if (!ev) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    const isAdmin = profile?.role === "admin";
    const isCreator = ev.created_by === user.id;
    if (!isCreator && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    // Don't let creators delete a ticketed event — Stripe orders may
    // already exist. Only admins can clean those up.
    if (ev.is_ticketed && !isAdmin) {
      return NextResponse.json(
        { error: "Ticketed events can only be deleted by an admin" },
        { status: 403 },
      );
    }

    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Event DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
