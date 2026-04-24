import Link from "next/link";
import Icon from "@/components/ui/Icon";
import type { VendorStatus, VendorVehicle } from "@/types/database";

// Culture palette only — gold for live/active, paper for warn/closed.
const statusConfig: Record<VendorStatus, { label: string; live: boolean }> = {
  active: { label: "OPEN NOW", live: true },
  open: { label: "OPEN NOW", live: true },
  en_route: { label: "ON THE WAY", live: true },
  inactive: { label: "OFFLINE", live: false },
  closed: { label: "CLOSED", live: false },
  sold_out: { label: "SOLD OUT", live: false },
  cancelled: { label: "CANCELLED", live: false },
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
  const typeLabel = vehicle.vehicle_type === "cart" ? "CART" : "TRUCK";

  return (
    <Link
      href={href}
      className="block p-4 press"
      style={{ background: "var(--paper)", border: "2px solid var(--rule-strong-c)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3
              className="c-card-t truncate"
              style={{ fontSize: 14, color: "var(--ink-strong)" }}
            >
              {biz?.name ?? vehicle.name}
            </h3>
          </div>

          <p className="c-kicker mt-1" style={{ fontSize: 9, opacity: 0.65 }}>
            {typeLabel} · {vehicle.name}
          </p>

          {vehicle.current_location_name && (
            <p
              className="c-body mt-1.5 inline-flex items-center gap-1"
              style={{ fontSize: 12, color: "var(--ink-strong)" }}
            >
              <Icon name="pin" size={12} style={{ color: "var(--gold-c)" }} />
              {vehicle.current_location_name}
            </p>
          )}

          <div className="flex items-center gap-2 mt-2">
            <span
              className="inline-flex items-center gap-1 c-kicker px-2"
              style={{
                background: status.live ? "var(--gold-c)" : "var(--paper)",
                border: "2px solid var(--rule-strong-c)",
                color: "var(--ink-strong)",
                fontSize: 9,
                height: 22,
              }}
            >
              <span
                className={status.live ? "animate-pulse" : ""}
                style={{
                  width: 5,
                  height: 5,
                  background: "var(--ink-strong)",
                  display: "inline-block",
                }}
              />
              {status.label}
            </span>
            {updatedAgo && (
              <p className="c-kicker" style={{ fontSize: 9, opacity: 0.6 }}>
                UPDATED {updatedAgo}
              </p>
            )}
            {typeof distanceMiles === "number" && (
              <p
                className="c-kicker"
                style={{ fontSize: 9, color: "var(--gold-c)" }}
              >
                {distanceMiles.toFixed(1)} MI
              </p>
            )}
          </div>
        </div>

        {biz?.accepts_orders && (
          <span className="c-badge c-badge-gold shrink-0" style={{ fontSize: 9 }}>
            ORDER
          </span>
        )}
      </div>
    </Link>
  );
}
