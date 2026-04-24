import { notFound } from "next/navigation";
import Link from "next/link";
import Card from "@/components/ui/Card";
import OrderTracker from "@/components/order/OrderTracker";
import { createClient } from "@/lib/supabase/server";
import type { Order, OrderItem, Business } from "@/types/database";

export default async function OrderTrackingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select("*, business:businesses(*), items:order_items(*)")
    .eq("id", id)
    .single();

  if (!order) notFound();

  const o = order as Order & { business: Business; items: OrderItem[] };

  return (
    <div className="culture-surface min-h-dvh animate-fade-in pb-24">
      {/* Back + Hero */}
      <div
        className="px-[18px] pt-5 pb-4"
        style={{ borderBottom: "3px solid var(--rule-strong-c)" }}
      >
        <Link
          href="/orders"
          className="inline-flex items-center gap-1.5 text-sm font-semibold press mb-3"
          style={{ color: "var(--ink-strong)" }}
        >
          <svg
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M10 12L6 8l4-4" />
          </svg>
          My Orders
        </Link>
        <div className="c-kicker" style={{ opacity: 0.65 }}>§ ORDER · {o.order_number}</div>
        <h1 className="c-hero mt-2" style={{ fontSize: 40, lineHeight: 0.95 }}>{o.business?.name ?? "Order"}</h1>
        <p className="c-serif-it mt-2" style={{ fontSize: 13 }}>
          {o.type === "delivery" ? "Delivery order" : "Pickup order"}.
        </p>
      </div>

      <div className="px-5 pt-5 space-y-5">
        {/* Live Order Header + Status Stepper */}
        <OrderTracker
          orderId={o.id}
          initialStatus={o.status}
          orderNumber={o.order_number}
          businessName={o.business?.name}
        />

        {/* Business Info */}
        <Card>
          <h2 className="text-sm font-bold mb-2">
            {o.type === "delivery" ? "Delivering from" : "Pickup from"}
          </h2>
          <p className="text-sm">{o.business?.name}</p>
          <p className="text-xs text-txt-secondary mt-0.5">
            {o.business?.address}
          </p>
        </Card>

        {/* Items */}
        <Card>
          <h2 className="text-sm font-bold mb-3">Items</h2>
          <div className="space-y-2">
            {o.items?.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="text-txt-secondary">{item.quantity}x</span>
                  <span>{item.name}</span>
                </div>
                <span className="text-txt-secondary">
                  ${((item.price * item.quantity) / 100).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Price Breakdown */}
        <Card>
          <h2 className="text-sm font-bold mb-3">Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-txt-secondary">Subtotal</span>
              <span>${(o.subtotal / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-txt-secondary">Tax</span>
              <span>${(o.tax / 100).toFixed(2)}</span>
            </div>
            {o.tip > 0 && (
              <div className="flex justify-between">
                <span className="text-txt-secondary">Tip</span>
                <span>${(o.tip / 100).toFixed(2)}</span>
              </div>
            )}
            <div className="border-t border-border-subtle pt-2 flex justify-between font-bold">
              <span>Total</span>
              <span className="text-gold">
                ${(o.total / 100).toFixed(2)}
              </span>
            </div>
          </div>
        </Card>

        {/* Time */}
        <Card>
          <div className="flex justify-between text-sm">
            <span className="text-txt-secondary">Order Placed</span>
            <span>
              {new Date(o.created_at).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
}
