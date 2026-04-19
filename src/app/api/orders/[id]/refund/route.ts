import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import { sendTransactionalEmail } from "@/lib/email";
import { refundedEmail } from "@/lib/emails/orders/refunded";

export async function POST(
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

    // Get the order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, business_id, customer_id, order_number, status, total, stripe_payment_intent_id")
      .eq("id", id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Verify business ownership
    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("id", order.business_id)
      .eq("owner_id", user.id)
      .single();

    if (!business) {
      return NextResponse.json(
        { error: "Not authorized to refund this order" },
        { status: 403 }
      );
    }

    // Can't refund already cancelled orders
    if (order.status === "cancelled") {
      return NextResponse.json(
        { error: "Order is already cancelled" },
        { status: 400 }
      );
    }

    // Must have a Stripe payment intent
    if (!order.stripe_payment_intent_id) {
      return NextResponse.json(
        { error: "No payment found for this order" },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const refundAmount: number | undefined = body.amount;
    const refundReason: string =
      typeof body.reason === "string" ? body.reason.trim() : "";

    // Validate partial refund amount
    if (refundAmount !== undefined) {
      if (typeof refundAmount !== "number" || refundAmount <= 0) {
        return NextResponse.json(
          { error: "Invalid refund amount" },
          { status: 400 }
        );
      }
      if (refundAmount > order.total) {
        return NextResponse.json(
          { error: "Refund amount exceeds order total" },
          { status: 400 }
        );
      }
    }

    // Create Stripe refund
    const stripe = getStripe();
    const refundParams: { payment_intent: string; amount?: number } = {
      payment_intent: order.stripe_payment_intent_id,
    };

    if (refundAmount) {
      refundParams.amount = refundAmount;
    }

    const refund = await stripe.refunds.create(refundParams);

    const isPartial = !!refundAmount && refundAmount < order.total;

    // Update order status + capture reason. Partial refunds keep the order
    // active (status not forced to cancelled); full refunds cancel it.
    const orderUpdate: Record<string, unknown> = {
      completed_at: new Date().toISOString(),
    };
    if (isPartial) {
      if (refundReason) orderUpdate.partial_refund_reason = refundReason;
    } else {
      orderUpdate.status = "cancelled";
      orderUpdate.cancelled_at = new Date().toISOString();
      if (refundReason) orderUpdate.cancellation_reason = refundReason;
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update(orderUpdate)
      .eq("id", id);

    if (updateError) {
      console.error("Failed to update order status after refund:", updateError);
    }

    // Audit log (fire-and-forget).
    supabase
      .from("order_audit_log")
      .insert({
        order_id: id,
        actor_id: user.id,
        action: isPartial ? "partial_refund" : "refund",
        metadata: {
          stripe_refund_id: refund.id,
          amount: refund.amount,
          reason: refundReason || null,
        },
      })
      .then(({ error: auditErr }) => {
        if (auditErr) console.error("Order audit log insert error:", auditErr);
      });

    // Send refunded email (fire-and-forget).
    (async () => {
      try {
        const adminClient = createAdminClient();
        const { data: authUser } = await adminClient.auth.admin.getUserById(
          order.customer_id
        );
        const customerEmail = authUser?.user?.email ?? null;
        if (!customerEmail) return;
        const { data: profile } = await adminClient
          .from("profiles")
          .select("display_name")
          .eq("id", order.customer_id)
          .single();
        const { data: biz } = await adminClient
          .from("businesses")
          .select("name")
          .eq("id", order.business_id)
          .single();
        const { subject, html, text } = refundedEmail({
          customerName: profile?.display_name || "there",
          businessName: biz?.name || "your vendor",
          orderNumber: order.order_number,
          orderId: order.id,
          refundAmountCents: refund.amount ?? order.total,
          originalTotalCents: order.total,
          reason: refundReason,
          isPartial,
        });
        await sendTransactionalEmail({ to: customerEmail, subject, html, text });
      } catch (emailErr) {
        console.error("Refund email error (non-fatal):", emailErr);
      }
    })();

    // Notify customer
    if (order.customer_id) {
      const refundLabel = refundAmount
        ? `$${(refundAmount / 100).toFixed(2)} partial refund`
        : "full refund";

      supabase
        .from("notifications")
        .insert({
          user_id: order.customer_id,
          type: "order",
          title: `Refund processed for Order ${order.order_number}`,
          body: `A ${refundLabel} has been issued.`,
          link_type: "order",
          link_id: id,
        })
        .then(({ error: notifError }) => {
          if (notifError) console.error("Notification insert error:", notifError);
        });
    }

    return NextResponse.json({
      success: true,
      refund: {
        id: refund.id,
        amount: refund.amount,
        status: refund.status,
        currency: refund.currency,
      },
    });
  } catch (error) {
    console.error("Refund error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to process refund";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
