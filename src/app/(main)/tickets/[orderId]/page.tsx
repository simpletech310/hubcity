"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { formatCents } from "@/lib/stripe";
import type { TicketOrder, TicketOrderItem, Ticket } from "@/types/database";
import QRCode from "qrcode";
import Icon from "@/components/ui/Icon";

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

function statusVariant(status: TicketOrder["status"]) {
  switch (status) {
    case "confirmed": return "emerald" as const;
    case "pending": return "gold" as const;
    case "cancelled": return "coral" as const;
    case "refunded": return "cyan" as const;
    default: return "gold" as const;
  }
}

function formatEventDate(start: string) {
  const startDate = new Date(start);
  return startDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
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

        // Flatten all tickets across items
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-txt-secondary">Loading tickets...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5 text-center">
        <p className="text-coral font-semibold mb-2">Error</p>
        <p className="text-sm text-txt-secondary mb-6">{error ?? "Order not found"}</p>
        <Button variant="secondary" size="sm" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  const event = order.event;
  const isCancellable = order.status === "confirmed";
  const isInactive = order.status === "cancelled" || order.status === "refunded";

  // Flatten tickets with their section info
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

  return (
    <div className="animate-fade-in pb-24 max-w-[430px] mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-midnight/95 backdrop-blur-sm border-b border-border-subtle px-5 py-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="press">
          <svg
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="text-txt-secondary"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-heading font-bold text-base leading-tight">My Tickets</h1>
          <p className="text-[11px] text-txt-secondary truncate">
            Order #{order.order_number}
          </p>
        </div>
        <Badge label={order.status} variant={statusVariant(order.status)} />
      </div>

      {/* Event Info Card */}
      <div className="px-5 pt-5">
        <Card className="mb-5">
          <h2 className="font-heading font-bold text-lg leading-snug mb-2">
            {event?.title ?? "Event"}
          </h2>
          <div className="space-y-2">
            {event?.start_date && (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center shrink-0">
                  <span className="text-sm"><Icon name="calendar" size={14} /></span>
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {formatEventDate(event.start_date)}
                  </p>
                  {event.start_time && (
                    <p className="text-xs text-txt-secondary">
                      {event.start_time.slice(0, 5)}
                      {event.end_time ? ` — ${event.end_time.slice(0, 5)}` : ""}
                    </p>
                  )}
                </div>
              </div>
            )}
            {(event?.location_name || event?.address) && (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-coral/10 flex items-center justify-center shrink-0">
                  <span className="text-sm"><Icon name="pin" size={14} /></span>
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {event.location_name || event.address}
                  </p>
                  {event.location_name && event.address && (
                    <p className="text-xs text-txt-secondary">{event.address}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Cancelled/Refunded Banner */}
      {isInactive && (
        <div className="mx-5 mb-4 px-4 py-3 rounded-xl bg-coral/10 border border-coral/20 flex items-center gap-2">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" className="text-coral shrink-0" strokeLinecap="round">
            <circle cx="8" cy="8" r="7" />
            <path d="M8 5v3M8 11h.01" />
          </svg>
          <p className="text-xs text-coral font-medium">
            This order has been {order.status}. Tickets are no longer valid.
          </p>
        </div>
      )}

      {/* Cancel Success Banner */}
      {cancelSuccess && (
        <div className="mx-5 mb-4 px-4 py-3 rounded-xl bg-emerald/10 border border-emerald/20 flex items-center gap-2">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald shrink-0" strokeLinecap="round">
            <path d="M2.5 8l3.5 3.5 7-7" />
          </svg>
          <p className="text-xs text-emerald font-medium">
            Order cancelled. A refund has been issued.
          </p>
        </div>
      )}

      {/* Ticket Cards */}
      <div className="px-5 space-y-5">
        {ticketItems.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-txt-secondary">No tickets found for this order.</p>
          </div>
        ) : (
          ticketItems.map(({ ticket, sectionName, index, total }) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              sectionName={sectionName}
              index={index}
              total={total}
              isInactive={isInactive}
            />
          ))
        )}
      </div>

      {/* Order Summary */}
      <div className="px-5 mt-6">
        <Card>
          <h3 className="text-sm font-bold mb-3">Order Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-txt-secondary">Subtotal</span>
              <span>{formatCents(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-txt-secondary">Service Fee</span>
              <span>{formatCents(order.platform_fee)}</span>
            </div>
            <div className="border-t border-border-subtle pt-2 flex justify-between font-bold">
              <span>Total</span>
              <span className="text-gold">{formatCents(order.total)}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Cancel Button */}
      {isCancellable && !cancelSuccess && (
        <div className="px-5 mt-6">
          <div className="rounded-xl border border-border-subtle bg-card p-4">
            <p className="text-xs text-txt-secondary mb-3 text-center">
              Need to cancel? A full refund will be issued to your original payment method.
            </p>
            <Button
              variant="danger"
              fullWidth
              loading={cancelling}
              onClick={handleCancel}
            >
              Cancel Order
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function TicketCard({
  ticket,
  sectionName,
  index,
  total,
  isInactive,
}: {
  ticket: TicketWithQR;
  sectionName: string;
  index: number;
  total: number;
  isInactive: boolean;
}) {
  const isCheckedIn = !!ticket.checked_in_at;

  return (
    <Card className={`relative ${isInactive ? "opacity-50" : ""}`}>
      {/* Ticket header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Badge label={sectionName} variant="gold" size="md" />
        </div>
        <div className="flex items-center gap-2">
          {isCheckedIn && (
            <Badge label="Checked In" variant="emerald" />
          )}
          <span className="text-[10px] text-txt-secondary font-medium">
            {index} of {total}
          </span>
        </div>
      </div>

      {/* Ticket Code (large, mono) */}
      <div className="flex flex-col items-center mb-4">
        <p className="font-mono text-2xl font-bold tracking-[0.15em] text-gold">
          {formatTicketCode(ticket.ticket_code)}
        </p>
      </div>

      {/* QR Code */}
      <div className="flex justify-center mb-4">
        <div className="relative">
          {isInactive && (
            <div className="absolute inset-0 z-10 flex items-center justify-center">
              <div className="bg-midnight/80 rounded-xl px-3 py-1.5">
                <p className="text-xs text-coral font-semibold uppercase tracking-wider">Void</p>
              </div>
            </div>
          )}
          {isCheckedIn && !isInactive && (
            <div className="absolute inset-0 z-10 flex items-center justify-center">
              <div className="bg-midnight/80 rounded-xl px-3 py-1.5 flex items-center gap-1.5">
                <svg width="14" height="14" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M2.5 7l3 3 6-6" />
                </svg>
                <p className="text-xs text-emerald font-semibold">Checked In</p>
              </div>
            </div>
          )}
          <img
            src={ticket.qrDataUrl}
            alt={`QR code for ticket ${ticket.ticket_code}`}
            width={200}
            height={200}
            className="rounded-xl"
            style={{ imageRendering: "pixelated" }}
          />
        </div>
      </div>

      <p className="text-[10px] text-txt-secondary text-center mb-3">
        Scan QR or enter code at venue
      </p>

      {/* Perforated line */}
      <div className="border-t border-dashed border-border-subtle my-3" />

      {/* Holder */}
      {ticket.holder_name && (
        <p className="text-xs text-txt-secondary text-center">
          Holder: <span className="text-white font-medium">{ticket.holder_name}</span>
        </p>
      )}
    </Card>
  );
}
