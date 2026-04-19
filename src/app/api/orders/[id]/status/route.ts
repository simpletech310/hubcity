import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTransactionalEmail } from "@/lib/email";
import { readyForPickupEmail } from "@/lib/emails/orders/ready-for-pickup";

const DEFAULT_CANCEL_WINDOW_MINUTES = 5;

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

    // Get the order. Authorization is evaluated per action below — the
    // customer is allowed to cancel their own order (within a time window),
    // while all other transitions require business ownership.
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(
        "id, business_id, customer_id, order_number, status, created_at, cancellation_reason"
      )
      .eq("id", id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const { status, cancellation_reason } = await request.json();

    // Customer-initiated cancel: enforce the cancellation window and allow
    // only the pending/confirmed states. Vendor/admin can cancel anytime via
    // their ownership branch below.
    const isCustomer = order.customer_id === user.id;
    const isCancelRequest = status === "cancelled";
    let actorRole: "customer" | "business" = "business";

    if (isCancelRequest && isCustomer) {
      // Resolve the window: prefer businesses.order_cancel_window_minutes if
      // present, fall back to the hardcoded default.
      let windowMinutes = DEFAULT_CANCEL_WINDOW_MINUTES;
      const { data: biz } = await supabase
        .from("businesses")
        .select("order_cancel_window_minutes")
        .eq("id", order.business_id)
        .maybeSingle();
      if (
        biz &&
        typeof (biz as { order_cancel_window_minutes?: unknown })
          .order_cancel_window_minutes === "number"
      ) {
        windowMinutes = (biz as { order_cancel_window_minutes: number })
          .order_cancel_window_minutes;
      }

      const placedAt = new Date(order.created_at).getTime();
      const ageMinutes = (Date.now() - placedAt) / 60_000;

      if (ageMinutes > windowMinutes) {
        return NextResponse.json(
          {
            error: `Orders can only be cancelled within ${windowMinutes} minutes of placement. Contact the business to request cancellation.`,
            age_minutes: Math.floor(ageMinutes),
            window_minutes: windowMinutes,
          },
          { status: 403 }
        );
      }

      if (!["pending", "confirmed"].includes(order.status)) {
        return NextResponse.json(
          {
            error: `Order is already ${order.status}; customer cancellation no longer available.`,
          },
          { status: 403 }
        );
      }

      actorRole = "customer";
    } else {
      // Non-cancel transitions (or vendor-initiated cancels) require business ownership.
      const { data: business } = await supabase
        .from("businesses")
        .select("id")
        .eq("id", order.business_id)
        .eq("owner_id", user.id)
        .single();

      if (!business) {
        return NextResponse.json(
          { error: "Not authorized to update this order" },
          { status: 403 }
        );
      }
    }

    const updateData: Record<string, unknown> = { status };

    if (status === "ready" || status === "delivered" || status === "picked_up") {
      updateData.completed_at = new Date().toISOString();
    }
    if (status === "ready") {
      updateData.prep_ready_at = new Date().toISOString();
    }
    if (status === "confirmed") {
      updateData.store_accepted_at = new Date().toISOString();
    }
    if (status === "cancelled") {
      updateData.cancelled_at = new Date().toISOString();
      if (typeof cancellation_reason === "string" && cancellation_reason.trim()) {
        updateData.cancellation_reason = cancellation_reason.trim();
      }
    }

    // Track delivery status changes
    if (["out_for_delivery", "delayed", "delivered"].includes(status)) {
      updateData.delivery_status_updated_at = new Date().toISOString();
    }

    const { data: updated, error: updateError } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", id)
      .select("*")
      .single();

    if (updateError) throw updateError;

    // Append audit log (fire-and-forget).
    supabase
      .from("order_audit_log")
      .insert({
        order_id: id,
        actor_id: user.id,
        action: `status:${status}`,
        metadata: {
          actor_role: actorRole,
          previous_status: order.status,
          cancellation_reason:
            status === "cancelled" ? updateData.cancellation_reason ?? null : null,
        },
      })
      .then(({ error: auditErr }) => {
        if (auditErr) console.error("Order audit log insert error:", auditErr);
      });

    // Notify customer of status change (fire-and-forget)
    const statusMessages: Record<string, string> = {
      confirmed: "Your order has been confirmed!",
      preparing: "Your order is being prepared",
      ready: "Your order is ready for pickup!",
      out_for_delivery: "Your order is out for delivery!",
      delayed: "Your order has been delayed",
      delivered: "Your order has been delivered",
      picked_up: "Your order has been picked up",
      cancelled: "Your order has been cancelled",
    };

    if (statusMessages[status] && order.customer_id) {
      supabase
        .from("notifications")
        .insert({
          user_id: order.customer_id,
          type: "order",
          title: statusMessages[status],
          body: `Order ${order.order_number}`,
          link_type: "order",
          link_id: id,
        })
        .then(({ error: notifError }) => {
          if (notifError) console.error("Notification insert error:", notifError);
        });
    }

    // Send ready-for-pickup email when pickup order transitions to `ready`.
    // (Delivery transitions fire via /api/deliveries/[id]/status.)
    if (status === "ready") {
      (async () => {
        try {
          const adminClient = createAdminClient();
          const { data: full } = await adminClient
            .from("orders")
            .select(
              "id, order_number, customer_id, type, business:businesses!orders_business_id_fkey(name, address)"
            )
            .eq("id", id)
            .single();
          if (!full || full.type === "delivery") return;

          const { data: profile } = await adminClient
            .from("profiles")
            .select("display_name")
            .eq("id", full.customer_id)
            .single();
          const { data: authUser } = await adminClient.auth.admin.getUserById(
            full.customer_id
          );
          const customerEmail = authUser?.user?.email ?? null;
          if (!customerEmail) return;

          const biz = (full as unknown as {
            business: { name?: string; address?: string } | null;
          }).business;
          const { subject, html, text } = readyForPickupEmail({
            customerName: profile?.display_name || "there",
            businessName: biz?.name || "your vendor",
            businessAddress: biz?.address ?? null,
            orderNumber: full.order_number,
            orderId: full.id,
          });
          await sendTransactionalEmail({ to: customerEmail, subject, html, text });
        } catch (emailErr) {
          console.error("Ready-for-pickup email error (non-fatal):", emailErr);
        }
      })();
    }

    return NextResponse.json({ order: updated });
  } catch (error) {
    console.error("Update order status error:", error);
    return NextResponse.json(
      { error: "Failed to update order status" },
      { status: 500 }
    );
  }
}
