import Link from "next/link";
import Icon from "@/components/ui/Icon";
import type { VendorStatus, VendorVehicle } from "@/types/database";

const statusConfig: Record<
  VendorStatus,
  { label: string; color: string; dot: string }
> = {
  active: { label: "Open Now", color: "text-emerald", dot: "bg-emerald" },
  open: { label: "Open Now", color: "text-emerald", dot: "bg-emerald" },
  en_route: { label: "On the way", color: "text-gold", dot: "bg-gold" },
  inactive: { label: "Offline", color: "text-txt-secondary", dot: "bg-txt-secondary" },
  closed: { label: "Closed", color: "text-txt-secondary", dot: "bg-txt-secondary" },
  sold_out: { label: "Sold Out", color: "text-coral", dot: "bg-coral" },
  cancelled: { label: "Cancelled", color: "text-coral", dot: "bg-coral" },
};

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMin = Math.floor((now - then) / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

interface VendorLocationCardProps {
  vehicle: VendorVehicle;
  /** Optional miles-from-user pre-computed for the "Near me" view */
  distanceMiles?: number | null;
}

export default function VendorLocationCard({
  vehicle,
  distanceMiles,
}: VendorLocationCardProps) {
  const status = statusConfig[vehicle.vendor_status] ?? statusConfig.inactive;
  const updatedAgo = timeAgo(vehicle.location_updated_at);
  const biz = vehicle.business;
  const href = biz ? `/food/vendor/${biz.slug || biz.id}` : "#";
  const isLive = vehicle.vendor_status === "open" || vehicle.vendor_status === "active";
  const typeLabel = vehicle.vehicle_type === "cart" ? "Cart" : "Truck";

  return (
    <Link
      href={href}
      className="block bg-card rounded-2xl border border-border-subtle p-4 hover:border-gold/20 transition-all press"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-heading font-bold text-sm truncate">
              {biz?.name ?? vehicle.name}
            </h3>
            <div className="flex items-center gap-1.5 shrink-0">
              <div
                className={`w-2 h-2 rounded-full ${status.dot} ${
                  isLive ? "animate-pulse" : ""
                }`}
              />
              <span className={`text-[10px] font-semibold ${status.color}`}>
                {status.label}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-white/40 mb-1.5 truncate">
            {typeLabel} &middot; {vehicle.name}
          </p>

          {vehicle.current_location_name && (
            <p className="text-[12px] text-txt-secondary mb-1 flex items-center gap-1">
              <Icon name="pin" size={12} /> {vehicle.current_location_name}
            </p>
          )}

          <div className="flex items-center gap-2">
            {updatedAgo && (
              <p className="text-[10px] text-txt-secondary/70">
                Updated {updatedAgo}
              </p>
            )}
            {typeof distanceMiles === "number" && (
              <p className="text-[10px] text-gold/80 font-semibold">
                {distanceMiles.toFixed(1)} mi away
              </p>
            )}
          </div>
        </div>

        {biz?.accepts_orders && (
          <span className="shrink-0 bg-gold/10 text-gold text-[10px] font-semibold px-2.5 py-1 rounded-full">
            Order
          </span>
        )}
      </div>
    </Link>
  );
}
