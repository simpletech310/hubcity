import { createClient } from "@/lib/supabase/server";
import type { Order } from "@/types/database";
import OrderTabs from "./OrderTabs";

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default async function DashboardOrdersPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!business) return null;

  const { data: orders } = await supabase
    .from("orders")
    .select(
      "*, customer:profiles!orders_customer_id_fkey(display_name), items:order_items(id, name, quantity)"
    )
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });

  const allOrders = (orders ?? []) as (Order & {
    customer: { display_name: string } | null;
    items: { id: string; name: string; quantity: number }[];
  })[];

  // Compute stats
  const totalCount = allOrders.length;
  const pendingCount = allOrders.filter((o) => o.status === "pending").length;
  const activeDeliveryCount = allOrders.filter(
    (o) =>
      o.type === "delivery" &&
      ["pending", "confirmed", "preparing", "ready", "out_for_delivery", "delayed"].includes(o.status)
  ).length;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayRevenue = allOrders
    .filter(
      (o) =>
        ["picked_up", "delivered"].includes(o.status) &&
        new Date(o.completed_at || o.created_at) >= todayStart
    )
    .reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="px-4 py-5 space-y-4">
      <h1 className="font-heading text-xl font-bold">Orders</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="glass-card-elevated rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-gold">{totalCount}</p>
          <p className="text-[10px] text-txt-secondary uppercase tracking-wider">
            Total
          </p>
        </div>
        <div className="glass-card-elevated rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-gold">{pendingCount}</p>
          <p className="text-[10px] text-txt-secondary uppercase tracking-wider">
            Pending
          </p>
        </div>
        <div className="glass-card-elevated rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-gold">
            {formatCents(todayRevenue)}
          </p>
          <p className="text-[10px] text-txt-secondary uppercase tracking-wider">
            Today
          </p>
        </div>
      </div>

      <OrderTabs orders={allOrders} activeDeliveryCount={activeDeliveryCount} />
    </div>
  );
}
