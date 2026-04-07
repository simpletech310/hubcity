import Link from "next/link";
import type { VendorStatus } from "@/types/database";
import Icon from "@/components/ui/Icon";

interface VendorLocationCardProps {
  id: string;
  name: string;
  slug?: string;
  current_location_name: string | null;
  vendor_status: VendorStatus;
  location_updated_at: string | null;
  accepts_orders?: boolean;
}

const statusConfig: Record<
  VendorStatus,
  { label: string; color: string; dot: string }
> = {
  active: { label: "Open Now", color: "text-emerald", dot: "bg-emerald" },
  open: { label: "Open Now", color: "text-emerald", dot: "bg-emerald" },
  en_route: { label: "En Route", color: "text-gold", dot: "bg-gold" },
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

export default function VendorLocationCard({
  id,
  name,
  slug,
  current_location_name,
  vendor_status,
  location_updated_at,
  accepts_orders,
}: VendorLocationCardProps) {
  const status = statusConfig[vendor_status] ?? statusConfig.inactive;
  const updatedAgo = timeAgo(location_updated_at);

  return (
    <Link
      href={`/food/vendor/${slug || id}`}
      className="block bg-card rounded-2xl border border-border-subtle p-4 hover:border-gold/20 transition-all press"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <h3 className="font-heading font-bold text-sm truncate">
              {name}
            </h3>
            <div className="flex items-center gap-1.5 shrink-0">
              <div
                className={`w-2 h-2 rounded-full ${status.dot} ${
                  vendor_status === "active" ? "animate-pulse" : ""
                }`}
              />
              <span className={`text-[10px] font-semibold ${status.color}`}>
                {status.label}
              </span>
            </div>
          </div>

          {current_location_name && (
            <p className="text-[12px] text-txt-secondary mb-1">
              <Icon name="pin" size={16} /> Currently at: {current_location_name}
            </p>
          )}

          {updatedAgo && (
            <p className="text-[10px] text-txt-secondary/70">
              Updated {updatedAgo}
            </p>
          )}
        </div>

        {accepts_orders && (
          <span className="shrink-0 bg-gold/10 text-gold text-[10px] font-semibold px-2.5 py-1 rounded-full">
            Order
          </span>
        )}
      </div>
    </Link>
  );
}
