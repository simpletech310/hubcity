"use client";

import Link from "next/link";
import Icon from "@/components/ui/Icon";
import type { VendorStatus, VendorVehicle, VendorRouteStop } from "@/types/database";
import { haversineMiles } from "@/lib/geo";

// Culture palette — gold fill when open, paper with ink border otherwise.
const STATUS_BADGE: Record<VendorStatus, { label: string; live: boolean }> = {
  open: { label: "OPEN NOW", live: true },
  active: { label: "OPEN NOW", live: true },
  en_route: { label: "ON THE WAY", live: true },
  sold_out: { label: "SOLD OUT", live: false },
  closed: { label: "CLOSED", live: false },
  inactive: { label: "OFFLINE", live: false },
  cancelled: { label: "CANCELLED", live: false },
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
  const biz = vehicle.business;
  const typeLabel = vehicle.vehicle_type === "cart" ? "CART" : "TRUCK";
  const today = new Date().getDay();

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
    <div
      className="relative p-4 animate-fade-in"
      style={{ background: "var(--paper)", border: "2px solid var(--rule-strong-c)" }}
    >
      {/* Close */}
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute top-2 right-2 flex items-center justify-center press"
        style={{
          width: 28,
          height: 28,
          background: "var(--paper)",
          border: "2px solid var(--rule-strong-c)",
          color: "var(--ink-strong)",
        }}
      >
        <Icon name="close" size={12} />
      </button>

      <div className="flex items-start gap-3 mb-3">
        <div
          className="w-12 h-12 flex items-center justify-center shrink-0 overflow-hidden"
          style={{
            background: "var(--ink-strong)",
            border: "2px solid var(--rule-strong-c)",
          }}
        >
          {biz?.image_urls?.[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={biz.image_urls[0]} alt="" className="w-full h-full object-cover" />
          ) : (
            <Icon
              name={vehicle.vehicle_type === "cart" ? "cart" : "truck"}
              size={22}
              style={{ color: "var(--gold-c)" }}
            />
          )}
        </div>
        <div className="flex-1 min-w-0 pr-8">
          <h3 className="c-card-t truncate" style={{ fontSize: 14, color: "var(--ink-strong)" }}>
            {biz?.name ?? vehicle.name}
          </h3>
          <p className="c-kicker mt-0.5" style={{ fontSize: 9, opacity: 0.65 }}>
            {typeLabel} · {vehicle.name}
          </p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span
              className="inline-flex items-center gap-1 c-kicker px-2"
              style={{
                background: status.live ? "var(--gold-c)" : "var(--paper)",
                border: "2px solid var(--rule-strong-c)",
                color: "var(--ink-strong)",
                fontSize: 9,
                height: 20,
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
            {vehicle.location_updated_at && (
              <span className="c-kicker" style={{ fontSize: 9, opacity: 0.55 }}>
                {timeAgo(vehicle.location_updated_at).toUpperCase()}
              </span>
            )}
          </div>
        </div>
      </div>

      {vehicle.current_location_name && (
        <p
          className="c-body mb-3 inline-flex items-center gap-1.5"
          style={{ fontSize: 12, color: "var(--ink-strong)" }}
        >
          <Icon name="pin" size={12} style={{ color: "var(--gold-c)" }} />
          <span className="truncate">{vehicle.current_location_name}</span>
          {distanceMiles != null && (
            <span className="ml-auto c-kicker shrink-0" style={{ fontSize: 9, color: "var(--gold-c)" }}>
              {distanceMiles.toFixed(1)} MI
            </span>
          )}
        </p>
      )}

      {todaysStops.length > 0 && (
        <div
          className="mb-3 p-2.5"
          style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)" }}
        >
          <p className="c-kicker mb-1.5" style={{ fontSize: 9, opacity: 0.65 }}>
            § NEXT STOPS TODAY
          </p>
          <div className="space-y-1.5">
            {todaysStops.map((stop, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-2"
                style={{ fontSize: 11, color: "var(--ink-strong)" }}
              >
                <span className="c-body truncate">{stop.name}</span>
                <span className="c-kicker shrink-0 tabular-nums" style={{ fontSize: 9, opacity: 0.65 }}>
                  {fmt(stop.start_time)} – {fmt(stop.end_time)}
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
            className="c-btn c-btn-primary inline-flex items-center justify-center gap-1.5"
          >
            <Icon name="cart" size={14} />
            ORDER FOR PICKUP OR DELIVERY
          </Link>
        )}
        <div className="flex gap-2">
          <Link href={vendorHref} className="c-btn c-btn-outline c-btn-sm flex-1 text-center">
            VIEW MENU
          </Link>
          {directionsHref && (
            <a
              href={directionsHref}
              target="_blank"
              rel="noopener noreferrer"
              className="c-btn c-btn-outline c-btn-sm flex-1 text-center"
            >
              DIRECTIONS
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
