import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import type { Order } from "@/types/database";
import OrderFilters from "./OrderFilters";

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function timeAgo(date: string) {
  const seconds = Math.floor(
    (Date.now() - new Date(date).getTime()) / 1000
  );
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const statusColors: Record<string, "gold" | "emerald" | "cyan" | "coral" | "purple"> = {
  pending: "gold",
  confirmed: "cyan",
  preparing: "purple",
  ready: "emerald",
  picked_up: "emerald",
  delivered: "emerald",
  cancelled: "coral",
};

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

  return (
    <div className="px-4 py-5 space-y-4">
      <h1 className="font-heading text-xl font-bold">Orders</h1>

      <OrderFilters orders={allOrders} />
    </div>
  );
}
