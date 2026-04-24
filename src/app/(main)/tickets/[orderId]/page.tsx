"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { formatCents } from "@/lib/stripe";
import type { TicketOrder, TicketOrderItem, Ticket } from "@/types/database";
import QRCode from "qrcode";

type TicketWithQR = Ticket & { qrDataUrl: string };

type ItemWithTickets = TicketOrderItem & {
  section_name: string;
  tickets: Ticket[];
  config?: { name?: string; description?: string };
};

type OrderData = TicketOrder & {
  event: {
    id: string;
    title: string;
    start_date: string;
    start_time?: string | null;
    end_date?: string | null;
    end_time?: string | null;
    location_name?: string | null;
    address?: string | null;
    slug: string;
  } | null;
  items: ItemWithTickets[];
};

function statusLabel(status: TicketOrder["status"]): string {
  return status.toUpperCase();
}

function statusBadgeClass(status: TicketOrder["status"]): string {
  switch (status) {
    case "confirmed": return "c-badge c-badge-ok";
    case "pending": return "c-badge c-badge-gold";
    case "cancelled": return "c-badge c-badge-live";
    case "refunded": return "c-badge c-badge-ink";
    default: return "c-badge c-badge-gold";
  }
}

function formatEventKicker(start: string, startTime?: string | null): string {
  const d = new Date(start);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const dayShort = d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
  let time = "";
  if (startTime) {
    const [h, m] = startTime.split(":");
    const hour = parseInt(h, 10);
    const hr12 = hour % 12 === 0 ? 12 : hour % 12;
    const ampm = hour < 12 ? "AM" : "PM";
    time = ` · ${hr12}${m !== "00" ? `:${m}` : ""}${ampm}`;
  }
  return `§ ${mm}.${dd} · ${dayShort}${time}`;
}

function formatShortDate(start: string): string {
  const d = new Date(start);
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit" }).toUpperCase();
}

function formatDoor(startTime?: string | null): string {
  if (!startTime) return "TBD";
  const [h, m] = startTime.split(":");
  const hour = parseInt(h, 10);
  const hr12 = hour % 12 === 0 ? 12 : hour % 12;
  const ampm = hour < 12 ? "AM" : "PM";
  return `${hr12}:${m}${ampm}`;
}

function formatTicketCode(code: string): string {
  if (code.length <= 4) return code;
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

export default function ETicketPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.orderId as string;

  const [order, setOrder] = useState<OrderData | null>(null);
  const [ticketsWithQR, setTicketsWithQR] = useState<TicketWithQR[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);

  const generateQRCodes = useCallback(async (tickets: Ticket[]) => {
    const results: TicketWithQR[] = await Promise.all(
      tickets.map(async (ticket) => {
        const qrDataUrl = await QRCode.toDataURL(ticket.ticket_code, {
          width: 200,
          margin: 2,
          color: {
            dark: "#D4A843",
            light: "#0A0F1C",
          },
        });
        return { ...ticket, qrDataUrl };
      })
    );
    setTicketsWithQR(results);
  }, []);

  useEffect(() => {
    if (!orderId) return;

    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/tickets/orders/${orderId}`);
        if (!res.ok) {
          if (res.status === 401) {
            router.push("/login");
            return;
          }
          const data = await res.json();
          setError(data.error ?? "Failed to load order");
          return;
        }
        const data = await res.json();
        const fetchedOrder: OrderData = data.order;
        setOrder(fetchedOrder);

        const allTickets: Ticket[] = [];
        for (const item of fetchedOrder.items ?? []) {
          for (const ticket of item.tickets ?? []) {
            allTickets.push(ticket);
          }
        }
        await generateQRCodes(allTickets);
      } catch {
        setError("Failed to load ticket order");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, generateQRCodes, router]);

  const handleCancel = async () => {
    if (!order || cancelling) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/tickets/orders/${orderId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "Failed to cancel order");
        return;
      }
      setCancelSuccess(true);
      setOrder((prev) => prev ? { ...prev, status: "refunded" } : null);
    } catch {
      alert("Failed to cancel order. Please try again.");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="culture-surface min-h-dvh flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 animate-spin" style={{ borderColor: "var(--ink-strong)", borderTopColor: "transparent" }} />
          <p className="c-kicker">§ LOADING TICKETS</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="culture-surface min-h-dvh flex flex-col items-center justify-center px-5 text-center">
        <p className="c-kicker" style={{ color: "var(--red-c)" }}>§ ERROR</p>
        <p className="c-body mt-2 mb-6">{error ?? "Order not found"}</p>
        <button onClick={() => router.back()} className="c-btn-outline">
          GO BACK
        </button>
      </div>
    );
  }

  const event = order.event;
  const isCancellable = order.status === "confirmed";
  const isInactive = order.status === "cancelled" || order.status === "refunded";

  const ticketItems: Array<{
    ticket: TicketWithQR;
    sectionName: string;
    index: number;
    total: number;
  }> = [];
  let globalIndex = 0;

  for (const item of order.items ?? []) {
    const sectionName = item.section_name || item.config?.name || "General";
    for (const ticket of item.tickets ?? []) {
      const withQR = ticketsWithQR.find((t) => t.id === ticket.id);
      if (withQR) {
        ticketItems.push({
          ticket: withQR,
          sectionName,
          index: globalIndex + 1,
          total: ticketsWithQR.length,
        });
      }
      globalIndex++;
    }
  }

  const orderShort = (order.order_number ?? order.id).toString().slice(-6).toUpperCase();
  const primaryTicket = ticketItems[0];
  const restTickets = ticketItems.slice(1);

  return (
    <div className="culture-surface animate-fade-in pb-24 max-w-[430px] mx-auto min-h-dvh">
      {/* Sticky top bar */}
      <div
        className="sticky top-0 z-10 px-4 py-3 flex items-center gap-3"
        style={{ background: "var(--paper)", borderBottom: "2px solid var(--ink-strong)" }}
      >
        <button
          onClick={() => router.back()}
          className="c-btn-outline"
          style={{ width: 36, height: 36, padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
          aria-label="Back"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M11 14L5 8l6-6" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <p className="c-kicker truncate">§ MY TICKETS</p>
        </div>
        <span className={statusBadgeClass(order.status)}>{statusLabel(order.status)}</span>
      </div>

      {/* Masthead */}
      <div className="px-5 pt-4 pb-4" style={{ borderBottom: "3px solid var(--rule-strong-c)" }}>
        <div className="c-kicker">§ YOUR WALLET · ORDER #{orderShort}</div>
        <div className="c-hero" style={{ fontSize: 56, marginTop: 8, lineHeight: 0.88 }}>TICKETS.</div>
      </div>

      {/* Tab strip */}
      <div style={{ display: "flex", borderBottom: "2px solid var(--rule-strong-c)" }}>
        {[
          { label: "UPCOMING", active: !isInactive },
          { label: "PAST", active: false },
          { label: isInactive ? statusLabel(order.status) : "BOOKED", active: isInactive },
        ].map((t, i) => (
          <div
            key={i}
            className="c-ui"
            style={{
              flex: 1,
              padding: "12px 0",
              textAlign: "center",
              fontSize: 11,
              letterSpacing: "0.14em",
              background: t.active ? "var(--ink-strong)" : "transparent",
              color: t.active ? "var(--paper)" : "var(--ink-strong)",
            }}
          >
            {t.label}
          </div>
        ))}
      </div>

      {/* Banners */}
      {isInactive && (
        <div className="mx-5 mt-4 p-3 c-ui" style={{ border: "2px solid var(--red-c)", color: "var(--red-c)", fontSize: 11, letterSpacing: "0.1em" }}>
          § ORDER {statusLabel(order.status)} · TICKETS NO LONGER VALID
        </div>
      )}
      {cancelSuccess && (
        <div className="mx-5 mt-4 p-3 c-ui" style={{ border: "2px solid var(--green-c)", color: "var(--green-c)", fontSize: 11, letterSpacing: "0.1em" }}>
          § ORDER CANCELLED · REFUND ISSUED
        </div>
      )}

      {/* Primary ticket card */}
      <div className="px-5 pt-5 pb-6">
        {primaryTicket ? (
          <TicketStub
            ticket={primaryTicket.ticket}
            sectionName={primaryTicket.sectionName}
            index={primaryTicket.index}
            total={primaryTicket.total}
            event={event}
            status={order.status}
            isInactive={isInactive}
          />
        ) : (
          <div className="p-8 text-center" style={{ border: "2px solid var(--rule-strong-c)" }}>
            <p className="c-kicker">§ NO TICKETS FOUND</p>
          </div>
        )}
      </div>

      {/* Additional tickets list */}
      {restTickets.length > 0 && (
        <div className="px-5 pb-6">
          <div className="c-kicker">§ ALSO IN THIS ORDER</div>
          <div className="c-hero" style={{ marginTop: 6 }}>MORE SEATS.</div>
          {restTickets.map(({ ticket, sectionName, index, total }) => (
            <div
              key={ticket.id}
              style={{
                display: "flex",
                gap: 12,
                padding: "14px 0",
                borderTop: "2px solid var(--rule-strong-c)",
                alignItems: "center",
                opacity: isInactive ? 0.5 : 1,
              }}
            >
              <div
                style={{
                  width: 68,
                  height: 82,
                  flexShrink: 0,
                  border: "2px solid var(--rule-strong-c)",
                  padding: 4,
                  background: "var(--ink-strong)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={ticket.qrDataUrl}
                  alt={`QR for ${ticket.ticket_code}`}
                  style={{ width: "100%", height: "100%", imageRendering: "pixelated" }}
                />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="c-kicker" style={{ fontSize: 9 }}>
                  {index} / {total} · {sectionName.toUpperCase()}
                </div>
                <div className="c-card-t" style={{ fontSize: 17, marginTop: 4 }}>
                  {formatTicketCode(ticket.ticket_code)}
                </div>
                <div
                  className="c-kicker"
                  style={{ fontSize: 9, marginTop: 6, color: "var(--ink-mute)" }}
                >
                  {ticket.holder_name ? ticket.holder_name.toUpperCase() : "GUEST"}
                  {ticket.checked_in_at ? " · CHECKED IN" : ""}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Order summary */}
      <div className="px-5 pb-6">
        <div className="c-kicker">§ THE TAB</div>
        <div className="c-hero" style={{ marginTop: 6 }}>RECEIPT.</div>
        <div style={{ borderTop: "2px solid var(--rule-strong-c)", marginTop: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "2px solid var(--rule-strong-c)" }}>
            <span className="c-ui" style={{ fontSize: 11 }}>SUBTOTAL</span>
            <span className="c-tabnum">{formatCents(order.subtotal)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "2px solid var(--rule-strong-c)" }}>
            <span className="c-ui" style={{ fontSize: 11 }}>SERVICE FEE</span>
            <span className="c-tabnum">{formatCents(order.platform_fee)}</span>
          </div>
          <div
            className="c-ink-block"
            style={{ display: "flex", justifyContent: "space-between", padding: "14px 16px", marginTop: 0, alignItems: "center" }}
          >
            <span className="c-ui" style={{ fontSize: 12, color: "var(--gold-c)" }}>TOTAL</span>
            <span className="c-tabnum" style={{ fontSize: 22, color: "var(--paper)" }}>{formatCents(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Cancel action */}
      {isCancellable && !cancelSuccess && (
        <div className="px-5 pb-6">
          <div style={{ border: "2px solid var(--rule-strong-c)", padding: 16 }}>
            <p className="c-serif-it" style={{ fontSize: 13, lineHeight: 1.5, marginBottom: 12 }}>
              Need to cancel? A full refund will be issued to your original payment method.
            </p>
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="c-ui w-full"
              style={{
                padding: "14px 0",
                background: "var(--red-c)",
                color: "var(--paper)",
                fontSize: 12,
                letterSpacing: "0.14em",
                border: "2px solid var(--red-c)",
                cursor: cancelling ? "wait" : "pointer",
                opacity: cancelling ? 0.6 : 1,
              }}
            >
              {cancelling ? "CANCELLING…" : "CANCEL ORDER"}
            </button>
          </div>
        </div>
      )}

      {/* Colophon */}
      <div className="px-5 pt-4 pb-8" style={{ borderTop: "2px solid var(--rule-strong-c)" }}>
        <p className="c-kicker" style={{ fontSize: 9, color: "var(--ink-mute)" }}>
          § HUB CITY · COMPTON CA · ORDER #{orderShort}
        </p>
        <p className="c-kicker" style={{ fontSize: 9, color: "var(--ink-mute)", marginTop: 4 }}>
          PRESENT QR AT DOOR · NON-TRANSFERABLE
        </p>
      </div>
    </div>
  );
}

function TicketStub({
  ticket,
  sectionName,
  index,
  total,
  event,
  status,
  isInactive,
}: {
  ticket: TicketWithQR;
  sectionName: string;
  index: number;
  total: number;
  event: OrderData["event"];
  status: TicketOrder["status"];
  isInactive: boolean;
}) {
  const isCheckedIn = !!ticket.checked_in_at;
  const kicker = event?.start_date ? formatEventKicker(event.start_date, event.start_time) : "§ EVENT";
  const title = event?.title ?? "EVENT";
  const venue = event?.location_name || "VENUE TBD";
  const address = event?.address || "";
  const door = formatDoor(event?.start_time);

  return (
    <div
      style={{
        background: "var(--ink-strong)",
        color: "var(--paper)",
        border: "3px solid var(--ink-strong)",
        overflow: "hidden",
        position: "relative",
        opacity: isInactive ? 0.6 : 1,
      }}
    >
      {/* Top half: event hero */}
      <div style={{ position: "relative", aspectRatio: "16/10", background: "var(--ink-strong)" }}>
        {/* Decorative pattern so the block isn't empty if no image */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "repeating-linear-gradient(135deg, rgba(243,238,220,0.04) 0 1px, transparent 1px 14px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(10,15,28,0.15) 0%, rgba(10,15,28,0.92) 100%)",
          }}
        />
        <span
          className={statusBadgeClass(status)}
          style={{ position: "absolute", top: 10, right: 10, transform: "rotate(2deg)" }}
        >
          {statusLabel(status)}
        </span>
        {isCheckedIn && !isInactive && (
          <span
            className="c-badge c-badge-ok"
            style={{ position: "absolute", top: 10, left: 10, transform: "rotate(-2deg)" }}
          >
            CHECKED IN
          </span>
        )}
        <div style={{ position: "absolute", left: 16, right: 16, bottom: 14 }}>
          <div className="c-kicker" style={{ color: "var(--gold-c)" }}>
            {kicker} · {sectionName.toUpperCase()}
          </div>
          <div
            style={{
              fontFamily: "Anton, sans-serif",
              fontSize: 34,
              color: "var(--paper)",
              marginTop: 8,
              lineHeight: 0.88,
              textTransform: "uppercase",
              wordBreak: "break-word",
            }}
          >
            {title}.
          </div>
          <div className="c-serif-it" style={{ fontSize: 13, color: "var(--paper)", marginTop: 8, opacity: 0.85 }}>
            {venue}
            {address ? ` · ${address}` : ""}
          </div>
        </div>
      </div>

      {/* Perforation */}
      <div className="c-perf" style={{ background: "var(--paper)" }}>
        <div className="c-perf-line" />
      </div>

      {/* Bottom half: stats + QR */}
      <div className="c-ink-block" style={{ padding: 16, display: "flex", gap: 14, alignItems: "center", marginTop: 0 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="c-kicker" style={{ color: "var(--gold-c)" }}>
            {index} OF {total} · {formatTicketCode(ticket.ticket_code)}
          </div>
          <div style={{ marginTop: 10, display: "flex", gap: 18, flexWrap: "wrap" }}>
            {[
              ["ADMIT", String(index).padStart(2, "0")],
              ["DOOR", door],
              ["SEC", sectionName.slice(0, 4).toUpperCase() || "GEN"],
            ].map(([l, v]) => (
              <div key={l}>
                <div
                  className="c-kicker"
                  style={{ fontSize: 9, color: "rgba(243,238,220,0.55)" }}
                >
                  {l}
                </div>
                <div
                  style={{
                    fontFamily: "Anton, sans-serif",
                    fontSize: 22,
                    color: "var(--paper)",
                    marginTop: 2,
                    letterSpacing: "0.02em",
                  }}
                >
                  {v}
                </div>
              </div>
            ))}
          </div>
          {ticket.holder_name && (
            <div className="c-kicker" style={{ fontSize: 9, marginTop: 12, color: "rgba(243,238,220,0.55)" }}>
              HOLDER · <span style={{ color: "var(--paper)" }}>{ticket.holder_name.toUpperCase()}</span>
            </div>
          )}
        </div>
        <div
          style={{
            width: 76,
            height: 76,
            background: "var(--paper)",
            padding: 4,
            border: "3px solid var(--paper)",
            flexShrink: 0,
            position: "relative",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ticket.qrDataUrl}
            alt={`QR code for ticket ${ticket.ticket_code}`}
            width={200}
            height={200}
            style={{ width: "100%", height: "100%", imageRendering: "pixelated", display: "block" }}
          />
          {isInactive && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(10,15,28,0.78)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span className="c-ui" style={{ fontSize: 10, color: "var(--red-c)", letterSpacing: "0.14em" }}>
                VOID
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
