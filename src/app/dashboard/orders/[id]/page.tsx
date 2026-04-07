import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import type { Order, OrderItem } from "@/types/database";
import OrderStatusUpdater from "./OrderStatusUpdater";
import RefundButton from "./RefundButton";

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const statusColors: Record<string, "gold" | "emerald" | "cyan" | "coral" | "purple"> = {
  pending: "gold",
  confirmed: "cyan",
  preparing: "purple",
  ready: "emerald",
  picked_up: "emerald",
  out_for_delivery: "cyan",
  delayed: "coral",
  delivered: "emerald",
  cancelled: "coral",
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: order } = await supabase
    .from("orders")
    .select(
      "*, customer:profiles!orders_customer_id_fkey(display_name), items:order_items(*)"
    )
    .eq("id", id)
    .single();

  if (!order) notFound();

  // Verify ownership
  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("id", order.business_id)
    .eq("owner_id", user.id)
    .single();

  if (!business) notFound();

  const typedOrder = order as Order & {
    customer: { display_name: string } | null;
    items: OrderItem[];
  };

  const canRefund =
    typedOrder.status !== "cancelled" &&
    typedOrder.status !== "pending" &&
    !!typedOrder.stripe_payment_intent_id;

  return (
    <div className="px-4 py-5 space-y-4">
      {/* Back button */}
      <Link
        href="/dashboard/orders"
        className="inline-flex items-center gap-1.5 text-sm text-txt-secondary hover:text-white transition-colors"
      >
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Orders
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-bold">
            Order #{typedOrder.order_number}
          </h1>
          <p className="text-xs text-txt-secondary mt-0.5">
            {formatDate(typedOrder.created_at)}
          </p>
        </div>
        <Badge
          label={typedOrder.status}
          variant={statusColors[typedOrder.status] || "gold"}
          size="md"
        />
      </div>

      {/* Status Updater - prominent card */}
      <div className="rounded-2xl bg-gold/[0.08] border border-gold/20 p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-gold animate-pulse" />
          <h3 className="text-xs font-semibold text-gold uppercase tracking-wider">
            Order Actions
          </h3>
        </div>
        <OrderStatusUpdater
          orderId={typedOrder.id}
          currentStatus={typedOrder.status}
          orderType={typedOrder.type === "delivery" ? "delivery" : "pickup"}
        />
        {canRefund && (
          <RefundButton
            orderId={typedOrder.id}
            total={typedOrder.total}
            paymentIntentId={typedOrder.stripe_payment_intent_id}
          />
        )}
      </div>

      {/* Delivery Info - only for delivery orders */}
      {typedOrder.type === "delivery" && (
        <Card className="glass-card-elevated border-cyan-500/20">
          <div className="flex items-center gap-2 mb-3">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-cyan-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
            </svg>
            <h3 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
              Delivery Info
            </h3>
            {typedOrder.status === "out_for_delivery" && (
              <Badge label="In Transit" variant="cyan" size="sm" />
            )}
            {typedOrder.status === "delayed" && (
              <Badge label="Delayed" variant="coral" size="sm" />
            )}
          </div>
          {typedOrder.delivery_address && (
            <div className="mb-2">
              <p className="text-[10px] text-txt-secondary uppercase tracking-wider mb-0.5">Address</p>
              <p className="text-sm font-medium">{typedOrder.delivery_address}</p>
            </div>
          )}
          {typedOrder.delivery_notes && (
            <div className="mb-2">
              <p className="text-[10px] text-txt-secondary uppercase tracking-wider mb-0.5">Notes</p>
              <p className="text-sm text-txt-secondary italic">{typedOrder.delivery_notes}</p>
            </div>
          )}
          {typedOrder.estimated_delivery_at && (
            <div>
              <p className="text-[10px] text-txt-secondary uppercase tracking-wider mb-0.5">Estimated Delivery</p>
              <p className="text-sm font-medium">{formatDate(typedOrder.estimated_delivery_at)}</p>
            </div>
          )}
          {!typedOrder.delivery_address && !typedOrder.delivery_notes && !typedOrder.estimated_delivery_at && (
            <p className="text-xs text-txt-secondary">No delivery details provided</p>
          )}
        </Card>
      )}

      {/* Customer Info */}
      <Card className="glass-card-elevated">
        <h3 className="text-xs font-semibold text-txt-secondary uppercase tracking-wider mb-2">
          Customer
        </h3>
        <p className="text-sm font-medium">
          {typedOrder.customer?.display_name || "Unknown"}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          <Badge
            label={typedOrder.type}
            variant={typedOrder.type === "delivery" ? "cyan" : "gold"}
            size="sm"
          />
        </div>
      </Card>

      {/* Items */}
      <Card className="glass-card-elevated">
        <h3 className="text-xs font-semibold text-txt-secondary uppercase tracking-wider mb-3">
          Items
        </h3>
        <div className="space-y-2.5">
          {typedOrder.items.map((item) => (
            <div key={item.id} className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium">
                  {item.quantity}x {item.name}
                </p>
                {item.special_instructions && (
                  <p className="text-xs text-txt-secondary italic mt-0.5">
                    {item.special_instructions}
                  </p>
                )}
              </div>
              <span className="text-sm text-txt-secondary">
                {formatCents(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Totals */}
      <Card className="glass-card-elevated">
        <h3 className="text-xs font-semibold text-txt-secondary uppercase tracking-wider mb-3">
          Order Total
        </h3>
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-txt-secondary">Subtotal</span>
            <span>{formatCents(typedOrder.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-txt-secondary">Tax</span>
            <span>{formatCents(typedOrder.tax)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-txt-secondary">Platform Fee</span>
            <span>{formatCents(typedOrder.platform_fee)}</span>
          </div>
          {typedOrder.tip > 0 && (
            <div className="flex justify-between">
              <span className="text-txt-secondary">Tip</span>
              <span>{formatCents(typedOrder.tip)}</span>
            </div>
          )}
          {typedOrder.discount_amount > 0 && (
            <div className="flex justify-between">
              <span className="text-txt-secondary">Discount</span>
              <span className="text-emerald-400">-{formatCents(typedOrder.discount_amount)}</span>
            </div>
          )}
          <div className="border-t border-border-subtle pt-1.5 flex justify-between font-semibold">
            <span>Total</span>
            <span className="text-gold">{formatCents(typedOrder.total)}</span>
          </div>
        </div>
      </Card>

      {/* Payment Info */}
      <Card className="glass-card-elevated">
        <h3 className="text-xs font-semibold text-txt-secondary uppercase tracking-wider mb-2">
          Payment
        </h3>
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-txt-secondary">Method</span>
            <span>{typedOrder.stripe_payment_intent_id ? "Stripe" : "N/A"}</span>
          </div>
          {typedOrder.stripe_payment_intent_id && (
            <div className="flex justify-between">
              <span className="text-txt-secondary">Payment ID</span>
              <span className="text-xs text-txt-secondary font-mono">
                {typedOrder.stripe_payment_intent_id.slice(0, 8)}...{typedOrder.stripe_payment_intent_id.slice(-4)}
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* Order Timeline */}
      <Card className="glass-card-elevated">
        <h3 className="text-xs font-semibold text-txt-secondary uppercase tracking-wider mb-3">
          Timeline
        </h3>
        <div className="relative pl-4 space-y-3">
          {/* Vertical line */}
          <div className="absolute left-[5px] top-1 bottom-1 w-px bg-border-subtle" />

          {/* Created */}
          <div className="relative flex items-start gap-3">
            <div className="absolute -left-4 top-1 w-2.5 h-2.5 rounded-full bg-gold border-2 border-midnight" />
            <div>
              <p className="text-sm font-medium">Order Placed</p>
              <p className="text-xs text-txt-secondary">
                {formatDate(typedOrder.created_at)}
              </p>
            </div>
          </div>

          {/* Completed / Cancelled */}
          {typedOrder.completed_at && (
            <div className="relative flex items-start gap-3">
              <div
                className={`absolute -left-4 top-1 w-2.5 h-2.5 rounded-full border-2 border-midnight ${
                  typedOrder.status === "cancelled" ? "bg-coral" : "bg-emerald-400"
                }`}
              />
              <div>
                <p className="text-sm font-medium">
                  {typedOrder.status === "cancelled"
                    ? "Cancelled / Refunded"
                    : typedOrder.status === "delivered"
                    ? "Delivered"
                    : typedOrder.status === "picked_up"
                    ? "Picked Up"
                    : "Completed"}
                </p>
                <p className="text-xs text-txt-secondary">
                  {formatDate(typedOrder.completed_at)}
                </p>
              </div>
            </div>
          )}

          {/* Current status if still in progress */}
          {!typedOrder.completed_at && typedOrder.status !== "pending" && (
            <div className="relative flex items-start gap-3">
              <div className="absolute -left-4 top-1 w-2.5 h-2.5 rounded-full bg-cyan-400 border-2 border-midnight animate-pulse" />
              <div>
                <p className="text-sm font-medium capitalize">
                  {typedOrder.status.replace(/_/g, " ")}
                </p>
                <p className="text-xs text-txt-secondary">In progress</p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
