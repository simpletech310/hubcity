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
      className="flex-shrink-0 flex flex-col press"
      style={{
        width: 162,
        background: "var(--paper-warm)",
        border: "2px solid var(--rule-strong-c)",
        boxShadow: "3px 3px 0 rgba(26,21,18,0.14)",
      }}
    >
      {/* Status bar — gold if live */}
      <div
        style={{
          background: status.live ? "var(--gold-c)" : "var(--paper)",
          borderBottom: "2px solid var(--rule-strong-c)",
          padding: "5px 8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 4,
        }}
      >
        <span className="c-kicker inline-flex items-center gap-1" style={{ fontSize: 8 }}>
          <span
            className={status.live ? "animate-pulse" : ""}
            style={{ width: 5, height: 5, background: "var(--ink-strong)", display: "inline-block", flexShrink: 0 }}
          />
          {status.label}
        </span>
        {biz?.accepts_orders && (
          <span className="c-kicker" style={{ fontSize: 8, color: "var(--ink-strong)" }}>ORDER ↗</span>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: "10px 10px 10px", flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
        {/* Name */}
        <h3
          className="c-card-t"
          style={{ fontSize: 13, color: "var(--ink-strong)", lineHeight: 1.2 }}
        >
          {biz?.name ?? vehicle.name}
        </h3>

        {/* Type label */}
        <p className="c-kicker" style={{ fontSize: 8, opacity: 0.6 }}>
          {typeLabel} · {vehicle.name}
        </p>

        {/* Location */}
        {vehicle.current_location_name && (
          <p
            className="c-body inline-flex items-start gap-1"
            style={{ fontSize: 11, color: "var(--ink-strong)", lineHeight: 1.3 }}
          >
            <Icon name="pin" size={11} style={{ color: "var(--gold-c)", flexShrink: 0, marginTop: 1 }} />
            <span className="line-clamp-2">{vehicle.current_location_name}</span>
          </p>
        )}

        {/* Footer meta */}
        <div style={{ marginTop: "auto", display: "flex", flexWrap: "wrap", gap: "4px 8px", alignItems: "center" }}>
          {updatedAgo && (
            <p className="c-kicker" style={{ fontSize: 8, opacity: 0.55 }}>
              {updatedAgo}
            </p>
          )}
          {typeof distanceMiles === "number" && (
            <p className="c-kicker" style={{ fontSize: 8, color: "var(--gold-c)" }}>
              {distanceMiles.toFixed(1)} mi
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
