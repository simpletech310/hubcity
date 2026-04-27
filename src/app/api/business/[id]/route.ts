import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * PATCH /api/business/[id]
 * Edit fields on a business. Owner-only (verified via owner_id).
 * Admin role bypasses ownership.
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

    const { data: biz } = await supabase
      .from("businesses")
      .select("id, owner_id")
      .eq("id", id)
      .single();
    if (!biz) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    const isAdmin = profile?.role === "admin";
    const isOwner = biz.owner_id === user.id;
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    // Whitelist editable fields so a malicious client can't repoint
    // owner_id or flip is_featured.
    const editable: Record<string, unknown> = {};
    const allowed = [
      "name",
      "description",
      "category",
      "address",
      "latitude",
      "longitude",
      "phone",
      "website",
      "hours",
      "image_urls",
      "accepts_orders",
      "accepts_bookings",
      "delivery_enabled",
      "delivery_radius",
      "is_open",
      "is_published",
    ];
    for (const k of allowed) {
      if (k in body) editable[k] = body[k];
    }
    if (Object.keys(editable).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }
    editable.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("businesses")
      .update(editable)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ business: data });
  } catch (err) {
    console.error("Business PATCH error:", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
