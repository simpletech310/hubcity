import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { VendorStatus, VehicleType } from "@/types/database";

const ALL_STATUS: VendorStatus[] = [
  "active", "inactive", "en_route", "open", "sold_out", "closed", "cancelled",
];
const VISIBLE_STATUS: VendorStatus[] = ["active", "open", "en_route", "sold_out"];
const VEHICLE_TYPES: VehicleType[] = ["food_truck", "cart"];

/**
 * GET /api/food/vehicles
 *   ?status=active|open|en_route|sold_out|closed|inactive|cancelled (repeatable via "status=a,b")
 *   ?type=food_truck|cart
 *   ?include_offline=1           include closed/inactive/cancelled in default fetches
 *   ?business_id=<uuid>          scope to one business (owner dashboard)
 *   ?owner=1                     scope to the caller's owned vehicles (full set, any status)
 *
 * Publicly readable per RLS (only active vehicles on published businesses).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const supabase = await createClient();

  const statusParam = url.searchParams.get("status");
  const typeParam = url.searchParams.get("type");
  const includeOffline = url.searchParams.get("include_offline") === "1";
  const businessId = url.searchParams.get("business_id");
  const ownerScope = url.searchParams.get("owner") === "1";

  let query = supabase
    .from("vendor_vehicles")
    .select(
      "*, business:businesses!vendor_vehicles_business_id_fkey(id, name, slug, image_urls, accepts_orders, rating_avg, rating_count, owner_id, is_published)"
    )
    .eq("is_active", true);

  if (ownerScope) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // RLS already scopes owner rows, but we also surface inactive + all statuses
    query = supabase
      .from("vendor_vehicles")
      .select(
        "*, business:businesses!vendor_vehicles_business_id_fkey(id, name, slug, image_urls, accepts_orders, rating_avg, rating_count, owner_id, is_published)"
      );
  }

  if (businessId) query = query.eq("business_id", businessId);
  if (typeParam && VEHICLE_TYPES.includes(typeParam as VehicleType)) {
    query = query.eq("vehicle_type", typeParam);
  }

  if (statusParam) {
    const picked = statusParam
      .split(",")
      .map((s) => s.trim())
      .filter((s): s is VendorStatus => ALL_STATUS.includes(s as VendorStatus));
    if (picked.length > 0) query = query.in("vendor_status", picked);
  } else if (!includeOffline && !ownerScope) {
    // Default public view: only show vehicles that are actively "doing something"
    query = query.in("vendor_status", VISIBLE_STATUS);
  }

  query = query
    .order("location_updated_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Filter out vehicles whose business isn't published (RLS already enforces on public read,
  // but the owner-scope branch skips that policy via auth.uid()).
  const vehicles = ownerScope
    ? data ?? []
    : (data ?? []).filter(
        (v: { business?: { is_published?: boolean } }) =>
          v.business?.is_published !== false
      );

  return NextResponse.json({ vehicles });
}

/**
 * POST /api/food/vehicles
 * Owner creates a new vehicle on their mobile-vendor business.
 * Body: { business_id, vehicle_type, name, image_url? }
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { business_id, vehicle_type, name, image_url } = body;

  if (!business_id || !vehicle_type || !name) {
    return NextResponse.json(
      { error: "business_id, vehicle_type, and name are required" },
      { status: 400 }
    );
  }
  if (!VEHICLE_TYPES.includes(vehicle_type)) {
    return NextResponse.json({ error: "Invalid vehicle_type" }, { status: 400 });
  }

  // Ownership check (RLS would also block, but we want a clean error)
  const { data: biz } = await supabase
    .from("businesses")
    .select("id, owner_id, is_mobile_vendor")
    .eq("id", business_id)
    .single();
  if (!biz || biz.owner_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: vehicle, error } = await supabase
    .from("vendor_vehicles")
    .insert({
      business_id,
      vehicle_type,
      name: String(name).slice(0, 80),
      image_url: image_url || null,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Also flip the business's is_mobile_vendor flag on if it wasn't already
  if (!biz.is_mobile_vendor) {
    await supabase
      .from("businesses")
      .update({ is_mobile_vendor: true })
      .eq("id", business_id);
  }

  return NextResponse.json({ vehicle });
}
