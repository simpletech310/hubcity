import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import CourierStatusToggle from "./CourierStatusToggle";

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const statusColors: Record<string, "gold" | "emerald" | "cyan" | "coral" | "purple"> = {
  pending: "gold",
  assigned: "cyan",
  picked_up: "purple",
  delivered: "emerald",
  cancelled: "coral",
  failed: "coral",
};

/**
 * Courier inbox — shows active + recent deliveries for the signed-in courier.
 *
 * Expects the user to have a matching row in couriers.user_id. If not found
 * (role hasn't been provisioned yet), render a friendly empty state rather
 * than 404 so admins can still see what the role looks like.
 */
export default async function CourierDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: courier } = await supabase
    .from("couriers")
    .select("id, display_name, status, active, vehicle_type")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!courier) {
    return (
      <div className="px-4 py-5">
        <Card>
          <h1 className="font-heading text-xl font-bold mb-2">Courier dashboard</h1>
          <p className="text-sm text-txt-secondary">
            Your account isn&apos;t registered as a courier yet. Contact an admin
            to get set up.
          </p>
        </Card>
      </div>
    );
  }

  const { data: deliveries } = await supabase
    .from("deliveries")
    .select(
      "id, status, created_at, assigned_at, picked_up_at, delivered_at, tip_cents, order:orders(id, order_number, total, delivery_address, business_id, businesses:businesses!orders_business_id_fkey(name))"
    )
    .eq("courier_id", courier.id)
    .order("created_at", { ascending: false })
    .limit(50);

  type DeliveryRow = {
    id: string;
    status: string;
    created_at: string;
    tip_cents: number;
    order: {
      id: string;
      order_number: string;
      total: number;
      delivery_address: string | null;
      businesses: { name: string } | null;
    } | null;
  };

  const list = (deliveries ?? []) as unknown as DeliveryRow[];
  const active = list.filter((d) =>
    ["assigned", "picked_up"].includes(d.status)
  );
  const recent = list.filter((d) => !["assigned", "picked_up"].includes(d.status));

  return (
    <div className="px-4 py-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-bold">
            {courier.display_name || "Courier"}
          </h1>
          <p className="text-xs text-txt-secondary mt-0.5">
            {courier.vehicle_type || "Delivery"}
          </p>
        </div>
        <CourierStatusToggle courierId={courier.id} initialStatus={courier.status} />
      </div>

      <div className="space-y-2">
        <h2 className="text-xs font-semibold text-txt-secondary uppercase tracking-wider">
          Active ({active.length})
        </h2>
        {active.length === 0 ? (
          <Card>
            <p className="text-sm text-txt-secondary">
              No active deliveries. When a vendor assigns you one, it&apos;ll show up here.
            </p>
          </Card>
        ) : (
          active.map((d) => (
            <Link
              key={d.id}
              href={`/dashboard/courier/${d.id}`}
              className="block"
            >
              <Card className="glass-card-elevated">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-bold">
                    #{d.order?.order_number ?? "—"}
                  </p>
                  <Badge
                    label={d.status}
                    variant={statusColors[d.status] ?? "gold"}
                    size="sm"
                  />
                </div>
                <p className="text-xs text-txt-secondary">
                  {d.order?.businesses?.name ?? "Unknown vendor"}
                </p>
                {d.order?.delivery_address && (
                  <p className="text-xs text-txt-secondary mt-0.5 truncate">
                    {d.order.delivery_address}
                  </p>
                )}
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] text-txt-secondary">
                    {timeAgo(d.created_at)}
                  </span>
                  <span className="text-xs text-gold">
                    {formatCents(d.order?.total ?? 0)}
                  </span>
                </div>
              </Card>
            </Link>
          ))
        )}
      </div>

      <div className="space-y-2">
        <h2 className="text-xs font-semibold text-txt-secondary uppercase tracking-wider">
          Recent
        </h2>
        {recent.length === 0 ? (
          <Card>
            <p className="text-sm text-txt-secondary">No recent deliveries.</p>
          </Card>
        ) : (
          recent.slice(0, 10).map((d) => (
            <Link
              key={d.id}
              href={`/dashboard/courier/${d.id}`}
              className="block"
            >
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      #{d.order?.order_number ?? "—"} ·{" "}
                      {d.order?.businesses?.name ?? ""}
                    </p>
                    <p className="text-[10px] text-txt-secondary">
                      {timeAgo(d.created_at)}
                    </p>
                  </div>
                  <Badge
                    label={d.status}
                    variant={statusColors[d.status] ?? "gold"}
                    size="sm"
                  />
                </div>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
