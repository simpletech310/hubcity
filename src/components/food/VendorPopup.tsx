"use client";

import Link from "next/link";
import Icon from "@/components/ui/Icon";
import type { VendorStatus, VendorVehicle, VendorRouteStop } from "@/types/database";
import { haversineMiles } from "@/lib/geo";

const STATUS_BADGE: Record<
  VendorStatus,
  { label: string; color: string; dot: string }
> = {
  open: { label: "Open Now", color: "text-emerald", dot: "bg-emerald" },
  active: { label: "Open Now", color: "text-emerald", dot: "bg-emerald" },
  en_route: { label: "On the way", color: "text-gold", dot: "bg-gold" },
  sold_out: { label: "Sold Out", color: "text-coral", dot: "bg-coral" },
  closed: { label: "Closed", color: "text-white/40", dot: "bg-white/40" },
  inactive: { label: "Offline", color: "text-white/40", dot: "bg-white/40" },
  cancelled: { label: "Cancelled", color: "text-coral", dot: "bg-coral" },
};

function fmt(time: string) {
  const [h, m] = time.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const display = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${display}:${m} ${ampm}`;
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  const diffMin = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

interface VendorPopupProps {
  vehicle: VendorVehicle;
  userCoords: [number, number] | null;
  onClose: () => void;
}

export default function VendorPopup({ vehicle, userCoords, onClose }: VendorPopupProps) {
  const status = STATUS_BADGE[vehicle.vendor_status] ?? STATUS_BADGE.inactive;
  const isLive = vehicle.vendor_status === "open" || vehicle.vendor_status === "active";
  const biz = vehicle.business;
  const typeLabel = vehicle.vehicle_type === "cart" ? "Cart" : "Truck";
  const today = new Date().getDay();

  // Remaining stops today: same day_of_week AND end_time >= now
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
  const toMinutes = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + (m || 0);
  };
  const todaysStops: VendorRouteStop[] = (vehicle.vendor_route ?? [])
    .filter((s) => s.day_of_week === today && toMinutes(s.end_time) >= nowMinutes)
    .sort((a, b) => toMinutes(a.start_time) - toMinutes(b.start_time))
    .slice(0, 3);

  const distanceMiles =
    userCoords && vehicle.current_lat != null && vehicle.current_lng != null
      ? haversineMiles(
          { lat: userCoords[1], lng: userCoords[0] },
          { lat: vehicle.current_lat, lng: vehicle.current_lng }
        )
      : null;

  const directionsHref =
    vehicle.current_lat != null && vehicle.current_lng != null
      ? `https://www.google.com/maps/dir/?api=1&destination=${vehicle.current_lat},${vehicle.current_lng}`
      : null;

  const vendorHref = biz ? `/food/vendor/${biz.slug || biz.id}` : "#";
  const orderHref =
    biz && biz.accepts_orders
      ? `/business/${biz.slug || biz.id}/order?pickup_vehicle=${vehicle.id}`
      : null;

  return (
    <div className="relative rounded-2xl border border-white/[0.08] bg-card p-4 animate-fade-in">
      {/* Close */}
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/[0.06] flex items-center justify-center text-white/60 hover:text-white hover:bg-white/[0.12] transition-colors press"
      >
        <Icon name="close" size={12} />
      </button>

      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0 overflow-hidden">
          {biz?.image_urls?.[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={biz.image_urls[0]} alt="" className="w-full h-full object-cover" />
          ) : (
            <Icon
              name={vehicle.vehicle_type === "cart" ? "cart" : "truck"}
              size={22}
              className="text-gold"
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-heading font-bold text-sm text-white truncate">
            {biz?.name ?? vehicle.name}
          </h3>
          <p className="text-[11px] text-white/50 truncate">
            {typeLabel} &middot; {vehicle.name}
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            <div
              className={`w-2 h-2 rounded-full ${status.dot} ${isLive ? "animate-pulse" : ""}`}
            />
            <span className={`text-[10px] font-semibold ${status.color}`}>{status.label}</span>
            {vehicle.location_updated_at && (
              <span className="text-[10px] text-white/30">
                &middot; {timeAgo(vehicle.location_updated_at)}
              </span>
            )}
          </div>
        </div>
      </div>

      {vehicle.current_location_name && (
        <p className="text-[12px] text-white/80 flex items-center gap-1.5 mb-3">
          <Icon name="pin" size={12} className="text-gold shrink-0" />
          <span className="truncate">{vehicle.current_location_name}</span>
          {distanceMiles != null && (
            <span className="ml-auto text-[10px] text-gold/80 font-semibold shrink-0">
              {distanceMiles.toFixed(1)} mi
            </span>
          )}
        </p>
      )}

      {todaysStops.length > 0 && (
        <div className="mb-3 rounded-xl bg-white/[0.03] border border-white/[0.04] p-2.5">
          <p className="text-[9px] uppercase tracking-wider text-white/40 font-bold mb-1.5">
            Next stops today
          </p>
          <div className="space-y-1.5">
            {todaysStops.map((stop, i) => (
              <div key={i} className="flex items-center justify-between gap-2 text-[11px]">
                <span className="text-white/80 truncate">{stop.name}</span>
                <span className="text-white/50 shrink-0 tabular-nums">
                  {fmt(stop.start_time)} &ndash; {fmt(stop.end_time)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {orderHref && (
          <Link
            href={orderHref}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-gold to-gold-light text-midnight text-center text-[13px] font-bold press hover:brightness-110 flex items-center justify-center gap-1.5"
          >
            <Icon name="cart" size={14} /> Order for pickup or delivery
          </Link>
        )}
        <div className="flex gap-2">
          <Link
            href={vendorHref}
            className="flex-1 py-2 rounded-xl bg-white/[0.06] border border-white/[0.08] text-center text-[12px] font-bold text-white press hover:bg-white/[0.1]"
          >
            View menu
          </Link>
          {directionsHref && (
            <a
              href={directionsHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2 rounded-xl bg-white/[0.06] border border-white/[0.08] text-center text-[12px] font-bold text-white press hover:bg-white/[0.1]"
            >
              Directions
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
