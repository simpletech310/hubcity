import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { VendorStatus, VendorRouteStop } from "@/types/database";

const ALLOWED_STATUS: VendorStatus[] = [
  "active", "inactive", "en_route", "open", "sold_out", "closed", "cancelled",
];

interface UpdateBody {
  name?: string;
  vehicle_type?: "food_truck" | "cart";
  image_url?: string | null;
  vendor_status?: VendorStatus;
  current_lat?: number | null;
  current_lng?: number | null;
  current_location_name?: string | null;
  vendor_route?: VendorRouteStop[];
  is_active?: boolean;
}

/**
 * PATCH /api/food/vehicles/[id]
 * Owner updates any subset of fields on one of their vehicles.
 * When lat/lng/status changes we bump location_updated_at so the public
 * list + realtime subscribers see a fresh timestamp.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as UpdateBody;

  // Confirm caller owns the vehicle's business
  const { data: vehicle } = await supabase
    .from("vendor_vehicles")
    .select("id, business_id, business:businesses!vendor_vehicles_business_id_fkey(owner_id)")
    .eq("id", id)
    .single();

  const ownerId = (vehicle?.business as unknown as { owner_id: string } | null)?.owner_id;
  if (!vehicle || ownerId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const update: Record<string, unknown> = {};
  if (typeof body.name === "string") update.name = body.name.slice(0, 80);
  if (body.vehicle_type === "food_truck" || body.vehicle_type === "cart") {
    update.vehicle_type = body.vehicle_type;
  }
  if (body.image_url !== undefined) update.image_url = body.image_url;
  if (body.vendor_status && ALLOWED_STATUS.includes(body.vendor_status)) {
    update.vendor_status = body.vendor_status;
  }
  if (body.current_lat !== undefined) update.current_lat = body.current_lat;
  if (body.current_lng !== undefined) update.current_lng = body.current_lng;
  if (body.current_location_name !== undefined) {
    update.current_location_name = body.current_location_name;
  }
  if (Array.isArray(body.vendor_route)) update.vendor_route = body.vendor_route;
  if (typeof body.is_active === "boolean") update.is_active = body.is_active;

  // Bump location_updated_at whenever the "live" fields change
  if (
    "current_lat" in update ||
    "current_lng" in update ||
    "current_location_name" in update ||
    "vendor_status" in update
  ) {
    update.location_updated_at = new Date().toISOString();
  }

  const { data: updated, error } = await supabase
    .from("vendor_vehicles")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ vehicle: updated });
}

/**
 * DELETE /api/food/vehicles/[id]
 * Soft-delete (is_active=false) so history is preserved and a later
 * restore is trivial. RLS still enforces ownership.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: vehicle } = await supabase
    .from("vendor_vehicles")
    .select("id, business:businesses!vendor_vehicles_business_id_fkey(owner_id)")
    .eq("id", id)
    .single();

  const ownerId = (vehicle?.business as unknown as { owner_id: string } | null)?.owner_id;
  if (!vehicle || ownerId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabase
    .from("vendor_vehicles")
    .update({ is_active: false, vendor_status: "inactive" })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
