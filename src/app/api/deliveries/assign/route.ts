import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Vendor-initiated courier assignment. Creates the deliveries row, links it to
 * the selected courier, and flips the courier to on_delivery.
 *
 * Idempotency: deliveries.order_id is unique, so repeat POSTs for the same
 * order return the existing row instead of creating a duplicate.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { order_id, courier_id, pickup_eta, dropoff_eta } = await request.json();
    if (!order_id || !courier_id) {
      return NextResponse.json(
        { error: "order_id and courier_id are required" },
        { status: 400 }
      );
    }

    // Verify the caller owns the business on this order.
    const { data: order } = await supabase
      .from("orders")
      .select("id, business_id, city_id, type, status")
      .eq("id", order_id)
      .single();

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (order.type !== "delivery") {
      return NextResponse.json(
        { error: "Only delivery orders can be assigned a courier" },
        { status: 400 }
      );
    }

    const { data: biz } = await supabase
      .from("businesses")
      .select("id")
      .eq("id", order.business_id)
      .eq("owner_id", user.id)
      .single();
    if (!biz) {
      return NextResponse.json(
        { error: "Not authorized to assign a courier for this order" },
        { status: 403 }
      );
    }

    // Verify the courier is active and in the same city.
    const { data: courier } = await supabase
      .from("couriers")
      .select("id, city_id, status, active")
      .eq("id", courier_id)
      .maybeSingle();
    if (!courier || !courier.active) {
      return NextResponse.json(
        { error: "Courier not found or inactive" },
        { status: 404 }
      );
    }
    if (order.city_id && courier.city_id && order.city_id !== courier.city_id) {
      return NextResponse.json(
        { error: "Courier is not in this order's city" },
        { status: 400 }
      );
    }
    if (courier.status !== "available") {
      return NextResponse.json(
        { error: `Courier is ${courier.status}, not available` },
        { status: 400 }
      );
    }

    const nowIso = new Date().toISOString();

    // Insert (or return the existing) delivery row.
    const { data: existing } = await supabase
      .from("deliveries")
      .select("*")
      .eq("order_id", order_id)
      .maybeSingle();

    let delivery = existing;
    if (!delivery) {
      const { data: inserted, error: insErr } = await supabase
        .from("deliveries")
        .insert({
          order_id,
          courier_id,
          status: "assigned",
          assigned_at: nowIso,
          pickup_eta: pickup_eta ?? null,
          dropoff_eta: dropoff_eta ?? null,
        })
        .select("*")
        .single();
      if (insErr) throw insErr;
      delivery = inserted;
    } else if (delivery.courier_id !== courier_id) {
      const { data: updated, error: updErr } = await supabase
        .from("deliveries")
        .update({
          courier_id,
          status: "assigned",
          assigned_at: nowIso,
          pickup_eta: pickup_eta ?? delivery.pickup_eta,
          dropoff_eta: dropoff_eta ?? delivery.dropoff_eta,
        })
        .eq("id", delivery.id)
        .select("*")
        .single();
      if (updErr) throw updErr;
      delivery = updated;
    }

    // Flip the courier to on_delivery.
    await supabase
      .from("couriers")
      .update({ status: "on_delivery", updated_at: nowIso })
      .eq("id", courier_id);

    // Audit log.
    await supabase.from("delivery_audit_log").insert({
      delivery_id: delivery!.id,
      actor_id: user.id,
      action: "assigned",
      metadata: { courier_id, order_id },
    });

    return NextResponse.json({ delivery });
  } catch (error) {
    console.error("Courier assignment error:", error);
    return NextResponse.json(
      { error: "Failed to assign courier" },
      { status: 500 }
    );
  }
}
