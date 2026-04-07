import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import type { Order, OrderItem } from "@/types/database";
import OrderStatusUpdater from "./OrderStatusUpdater";

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
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
      "*, customer:profiles!orders_customer_id_fkey(display_name, phone), items:order_items(*)"
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
    customer: { display_name: string; phone: string | null } | null;
    items: OrderItem[];
  };

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
            {new Date(typedOrder.created_at).toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
        </div>
        <Badge
          label={typedOrder.status}
          variant={statusColors[typedOrder.status] || "gold"}
          size="md"
        />
      </div>

      {/* Status Updater */}
      <OrderStatusUpdater
        orderId={typedOrder.id}
        currentStatus={typedOrder.status}
        orderType={typedOrder.type === "delivery" ? "delivery" : "pickup"}
      />

      {/* Customer Info */}
      <Card>
        <h3 className="text-xs font-semibold text-txt-secondary uppercase tracking-wider mb-2">
          Customer
        </h3>
        <p className="text-sm font-medium">
          {typedOrder.customer?.display_name || "Unknown"}
        </p>
        {typedOrder.customer?.phone && (
          <p className="text-xs text-txt-secondary mt-0.5">
            {typedOrder.customer.phone}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1.5">
          <Badge
            label={typedOrder.type}
            variant={typedOrder.type === "delivery" ? "cyan" : "gold"}
            size="sm"
          />
        </div>
        {typedOrder.delivery_address && (
          <p className="text-xs text-txt-secondary mt-2">
            Delivery: {typedOrder.delivery_address}
          </p>
        )}
        {typedOrder.delivery_notes && (
          <p className="text-xs text-txt-secondary mt-1 italic">
            Note: {typedOrder.delivery_notes}
          </p>
        )}
      </Card>

      {/* Items */}
      <Card>
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
      <Card>
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
          <div className="border-t border-border-subtle pt-1.5 flex justify-between font-semibold">
            <span>Total</span>
            <span className="text-gold">{formatCents(typedOrder.total)}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
