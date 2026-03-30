import { redirect } from "next/navigation";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/server";
import type { Order, Business } from "@/types/database";

const statusLabels: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  ready: "Ready",
  picked_up: "Picked Up",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const statusVariant: Record<string, "gold" | "emerald" | "coral" | "cyan" | "purple"> = {
  pending: "gold",
  confirmed: "cyan",
  preparing: "purple",
  ready: "emerald",
  picked_up: "emerald",
  delivered: "emerald",
  cancelled: "coral",
};

export default async function MyOrdersPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: orders } = await supabase
    .from("orders")
    .select("*, business:businesses(id, name, slug, category)")
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false });

  const orderList = (orders ?? []) as (Order & { business: Business })[];

  return (
    <div className="animate-fade-in pb-24">
      {/* Header */}
      <div className="px-5 pt-4 mb-4">
        <Link
          href="/profile"
          className="inline-flex items-center gap-1.5 text-gold text-sm font-semibold press"
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
          Back
        </Link>
        <h1 className="font-heading text-2xl font-bold mt-3">My Orders</h1>
      </div>

      <div className="px-5 space-y-3">
        {orderList.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-txt-secondary text-sm mb-4">
              No orders yet.
            </p>
            <Link href="/business">
              <span className="text-gold text-sm font-semibold press">
                Browse Businesses
              </span>
            </Link>
          </div>
        ) : (
          orderList.map((order) => (
            <Link key={order.id} href={`/orders/${order.id}`}>
              <Card hover className="mb-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[13px] font-bold">
                      {order.business?.name ?? "Business"}
                    </h3>
                    <p className="text-[11px] text-txt-secondary mt-0.5">
                      {order.order_number}
                    </p>
                    <p className="text-xs text-txt-secondary mt-1">
                      {new Date(order.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <Badge
                      label={statusLabels[order.status] ?? order.status}
                      variant={statusVariant[order.status] ?? "gold"}
                    />
                    <span className="text-sm font-bold text-gold">
                      ${(order.total / 100).toFixed(2)}
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
