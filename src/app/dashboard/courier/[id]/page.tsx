import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import DeliveryActions from "./DeliveryActions";

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(date: string | null | undefined) {
  if (!date) return "—";
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const statusColors: Record<string, "gold" | "emerald" | "cyan" | "coral" | "purple"> = {
  assigned: "cyan",
  picked_up: "purple",
  delivered: "emerald",
  cancelled: "coral",
  failed: "coral",
};

export default async function CourierDeliveryDetailPage({
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

  const { data: courier } = await supabase
    .from("couriers")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!courier) notFound();

  const { data: delivery } = await supabase
    .from("deliveries")
    .select(
      "id, status, assigned_at, picked_up_at, delivered_at, pickup_eta, dropoff_eta, proof_photo_url, cancellation_reason, tip_cents, order:orders(id, order_number, total, delivery_address, delivery_notes, business_id, customer:profiles!orders_customer_id_fkey(display_name), items:order_items(id, name, quantity), businesses:businesses!orders_business_id_fkey(name, address, phone))"
    )
    .eq("id", id)
    .eq("courier_id", courier.id)
    .maybeSingle();

  if (!delivery) notFound();

  type DeliveryDetail = {
    id: string;
    status: string;
    assigned_at: string | null;
    picked_up_at: string | null;
    delivered_at: string | null;
    proof_photo_url: string | null;
    tip_cents: number;
    order: {
      id: string;
      order_number: string;
      total: number;
      delivery_address: string | null;
      delivery_notes: string | null;
      customer: { display_name: string } | null;
      items: { id: string; name: string; quantity: number }[];
      businesses: { name: string; address: string; phone: string | null } | null;
    } | null;
  };

  const d = delivery as unknown as DeliveryDetail;

  return (
    <div className="px-4 py-5 space-y-4">
      <Link
        href="/dashboard/courier"
        className="inline-flex items-center gap-1.5 text-sm text-txt-secondary hover:text-white"
      >
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-bold">
            #{d.order?.order_number ?? "—"}
          </h1>
          <p className="text-xs text-txt-secondary mt-0.5">
            {d.order?.businesses?.name ?? "Unknown vendor"}
          </p>
        </div>
        <Badge label={d.status} variant={statusColors[d.status] ?? "gold"} size="md" />
      </div>

      <DeliveryActions
        deliveryId={d.id}
        status={d.status}
        proofPhotoUrl={d.proof_photo_url}
        userId={user.id}
      />

      <Card className="glass-card-elevated">
        <h3 className="text-xs font-semibold text-txt-secondary uppercase tracking-wider mb-2">
          Pickup from
        </h3>
        <p className="text-sm font-medium">{d.order?.businesses?.name ?? "—"}</p>
        <p className="text-xs text-txt-secondary">
          {d.order?.businesses?.address ?? ""}
        </p>
        {d.order?.businesses?.phone && (
          <a
            href={`tel:${d.order.businesses.phone}`}
            className="text-xs text-gold mt-1 inline-block"
          >
            {d.order.businesses.phone}
          </a>
        )}
      </Card>

      <Card className="glass-card-elevated">
        <h3 className="text-xs font-semibold text-txt-secondary uppercase tracking-wider mb-2">
          Deliver to
        </h3>
        <p className="text-sm font-medium">
          {d.order?.customer?.display_name ?? "Customer"}
        </p>
        {d.order?.delivery_address && (
          <p className="text-sm mt-1">{d.order.delivery_address}</p>
        )}
        {d.order?.delivery_notes && (
          <p className="text-xs italic text-txt-secondary mt-1">
            Note: {d.order.delivery_notes}
          </p>
        )}
      </Card>

      <Card className="glass-card-elevated">
        <h3 className="text-xs font-semibold text-txt-secondary uppercase tracking-wider mb-2">
          Items
        </h3>
        <div className="space-y-1">
          {d.order?.items?.map((it) => (
            <div key={it.id} className="text-sm">
              {it.quantity}× {it.name}
            </div>
          ))}
        </div>
      </Card>

      <Card className="glass-card-elevated">
        <div className="flex items-center justify-between">
          <span className="text-xs text-txt-secondary uppercase tracking-wider">
            Order total
          </span>
          <span className="text-sm font-bold text-gold">
            {formatCents(d.order?.total ?? 0)}
          </span>
        </div>
        {d.tip_cents > 0 && (
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-txt-secondary uppercase tracking-wider">
              Tip
            </span>
            <span className="text-sm text-gold">{formatCents(d.tip_cents)}</span>
          </div>
        )}
      </Card>

      <Card className="glass-card-elevated">
        <h3 className="text-xs font-semibold text-txt-secondary uppercase tracking-wider mb-2">
          Timeline
        </h3>
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-txt-secondary">Assigned</span>
            <span>{formatDate(d.assigned_at)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-txt-secondary">Picked up</span>
            <span>{formatDate(d.picked_up_at)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-txt-secondary">Delivered</span>
            <span>{formatDate(d.delivered_at)}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
