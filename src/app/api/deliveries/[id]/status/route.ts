import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendTransactionalEmail } from "@/lib/email";
import { outForDeliveryEmail } from "@/lib/emails/orders/out-for-delivery";
import { deliveredEmail } from "@/lib/emails/orders/delivered";

/**
 * Courier-only delivery status transitions:
 *   assigned -> picked_up -> delivered
 *
 * Side effects:
 *   - Mirrors status into orders.status (out_for_delivery / delivered).
 *   - Stamps the corresponding *_at column on deliveries.
 *   - Appends a delivery_audit_log row.
 *   - When delivered, marks the courier available again.
 *   - Fires transactional emails (fire-and-forget).
 *
 * NO GPS pings — status is the only customer-facing signal. Customers receive
 * live updates via the Supabase Realtime subscription on deliveries.status.
 */

const NEXT_STATUS: Record<string, string[]> = {
  pending: ["assigned", "cancelled"],
  assigned: ["picked_up", "cancelled", "failed"],
  picked_up: ["delivered", "failed"],
  delivered: [],
  cancelled: [],
  failed: [],
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
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

    const {
      status,
      proof_photo_url,
      cancellation_reason,
      pickup_eta,
      dropoff_eta,
    } = await request.json();

    if (!status || typeof status !== "string") {
      return NextResponse.json({ error: "status is required" }, { status: 400 });
    }

    // Load the delivery + related order.
    const { data: delivery, error: delErr } = await supabase
      .from("deliveries")
      .select(
        "id, order_id, courier_id, status, assigned_at, picked_up_at, delivered_at"
      )
      .eq("id", id)
      .single();

    if (delErr || !delivery) {
      return NextResponse.json({ error: "Delivery not found" }, { status: 404 });
    }

    // Authorize: courier (owner) or business owner on the parent order.
    const { data: courier } = await supabase
      .from("couriers")
      .select("id, user_id, display_name")
      .eq("id", delivery.courier_id ?? "00000000-0000-0000-0000-000000000000")
      .maybeSingle();

    const isCourier = courier?.user_id === user.id;

    let isBizOwner = false;
    if (!isCourier) {
      const { data: bizCheck } = await supabase
        .from("orders")
        .select("id, businesses!orders_business_id_fkey(owner_id)")
        .eq("id", delivery.order_id)
        .maybeSingle();
      const ownerId = (
        bizCheck as { businesses?: { owner_id?: string } } | null
      )?.businesses?.owner_id;
      isBizOwner = ownerId === user.id;
    }

    if (!isCourier && !isBizOwner) {
      return NextResponse.json(
        { error: "Not authorized to update this delivery" },
        { status: 403 }
      );
    }

    // Validate transition.
    const allowed = NEXT_STATUS[delivery.status] ?? [];
    if (!allowed.includes(status)) {
      return NextResponse.json(
        {
          error: `Cannot transition from ${delivery.status} to ${status}`,
          allowed,
        },
        { status: 400 }
      );
    }

    const nowIso = new Date().toISOString();
    const delUpdate: Record<string, unknown> = { status, updated_at: nowIso };
    if (status === "picked_up") delUpdate.picked_up_at = nowIso;
    if (status === "delivered") delUpdate.delivered_at = nowIso;
    if (status === "assigned" && !delivery.assigned_at) delUpdate.assigned_at = nowIso;
    if (typeof proof_photo_url === "string") delUpdate.proof_photo_url = proof_photo_url;
    if (typeof cancellation_reason === "string")
      delUpdate.cancellation_reason = cancellation_reason;
    if (typeof pickup_eta === "string") delUpdate.pickup_eta = pickup_eta;
    if (typeof dropoff_eta === "string") delUpdate.dropoff_eta = dropoff_eta;

    const { data: updatedDelivery, error: updErr } = await supabase
      .from("deliveries")
      .update(delUpdate)
      .eq("id", id)
      .select("*")
      .single();
    if (updErr) throw updErr;

    // Mirror to orders.status.
    const orderStatus =
      status === "picked_up"
        ? "out_for_delivery"
        : status === "delivered"
          ? "delivered"
          : status === "cancelled" || status === "failed"
            ? "cancelled"
            : null;

    if (orderStatus) {
      const orderUpdate: Record<string, unknown> = { status: orderStatus };
      if (orderStatus === "delivered") {
        orderUpdate.completed_at = nowIso;
      }
      if (orderStatus === "cancelled") {
        orderUpdate.cancelled_at = nowIso;
        if (typeof cancellation_reason === "string")
          orderUpdate.cancellation_reason = cancellation_reason;
      }
      await supabase.from("orders").update(orderUpdate).eq("id", delivery.order_id);
    }

    // When terminal, release the courier back into the available pool.
    if (
      (status === "delivered" || status === "failed" || status === "cancelled") &&
      delivery.courier_id
    ) {
      await supabase
        .from("couriers")
        .update({ status: "available", updated_at: nowIso })
        .eq("id", delivery.courier_id);
    }

    // Append audit log (fire-and-forget).
    supabase
      .from("delivery_audit_log")
      .insert({
        delivery_id: id,
        actor_id: user.id,
        action: `status:${status}`,
        metadata: {
          previous_status: delivery.status,
          proof_photo_url: proof_photo_url ?? null,
          cancellation_reason: cancellation_reason ?? null,
        },
      })
      .then(({ error: auditErr }) => {
        if (auditErr) console.error("Delivery audit log error:", auditErr);
      });

    // Customer email (fire-and-forget) for out-for-delivery + delivered.
    if (status === "picked_up" || status === "delivered") {
      (async () => {
        try {
          const { data: order } = await supabase
            .from("orders")
            .select(
              "id, order_number, customer_id, business_id, delivery_address"
            )
            .eq("id", delivery.order_id)
            .single();
          if (!order) return;

          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("id", order.customer_id)
            .single();
          const { data: authUser } = await supabase.auth.admin.getUserById(
            order.customer_id
          );
          const customerEmail = authUser?.user?.email ?? null;
          const { data: biz } = await supabase
            .from("businesses")
            .select("name")
            .eq("id", order.business_id)
            .single();

          if (!customerEmail) return;

          if (status === "picked_up") {
            const { subject, html, text } = outForDeliveryEmail({
              customerName: profile?.display_name || "there",
              businessName: biz?.name || "your vendor",
              orderNumber: order.order_number,
              orderId: order.id,
              deliveryAddress: order.delivery_address ?? null,
              courierName: courier?.display_name ?? null,
              dropoffEta: (updatedDelivery as { dropoff_eta?: string | null })
                ?.dropoff_eta ?? null,
            });
            await sendTransactionalEmail({
              to: customerEmail,
              subject,
              html,
              text,
            });
          } else {
            const { subject, html, text } = deliveredEmail({
              customerName: profile?.display_name || "there",
              businessName: biz?.name || "your vendor",
              orderNumber: order.order_number,
              orderId: order.id,
              proofPhotoUrl:
                (updatedDelivery as { proof_photo_url?: string | null })
                  ?.proof_photo_url ?? null,
            });
            await sendTransactionalEmail({
              to: customerEmail,
              subject,
              html,
              text,
            });
          }
        } catch (emailErr) {
          console.error("Delivery email error (non-fatal):", emailErr);
        }
      })();
    }

    return NextResponse.json({ delivery: updatedDelivery });
  } catch (error) {
    console.error("Delivery status update error:", error);
    return NextResponse.json(
      { error: "Failed to update delivery status" },
      { status: 500 }
    );
  }
}
