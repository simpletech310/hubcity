import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import OrderTracker from "@/components/order/OrderTracker";
import { createClient } from "@/lib/supabase/server";
import type { Order, OrderItem, Business } from "@/types/database";

const STATUS_LABEL: Record<string, string> = {
  pending: "PENDING",
  confirmed: "CONFIRMED",
  preparing: "PREPARING",
  ready: "READY FOR PICKUP",
  picked_up: "PICKED UP",
  delivered: "DELIVERED",
  cancelled: "CANCELLED",
};

const STATUS_TONE: Record<string, { bg: string; fg: string; dot: string }> = {
  pending: { bg: "var(--paper-soft, #DCD3BF)", fg: "var(--ink-strong)", dot: "var(--gold-c)" },
  confirmed: { bg: "var(--gold-c)", fg: "var(--ink-strong)", dot: "var(--ink-strong)" },
  preparing: { bg: "var(--gold-c)", fg: "var(--ink-strong)", dot: "var(--ink-strong)" },
  ready: { bg: "var(--gold-c)", fg: "var(--ink-strong)", dot: "var(--ink-strong)" },
  picked_up: { bg: "var(--ink-strong)", fg: "var(--paper)", dot: "var(--gold-c)" },
  delivered: { bg: "var(--ink-strong)", fg: "var(--paper)", dot: "var(--gold-c)" },
  cancelled: { bg: "var(--paper)", fg: "var(--ink-mute)", dot: "var(--ink-mute)" },
};

function dollars(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default async function OrderTrackingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/orders/${id}`);

  const { data: order } = await supabase
    .from("orders")
    .select("*, business:businesses(*), items:order_items(*)")
    .eq("id", id)
    .eq("customer_id", user.id)
    .maybeSingle();

  if (!order) notFound();

  // Several columns the page renders aren't yet typed on Order (loyalty /
  // discounts / lifecycle timestamps). Cast a narrow shim so the receipt +
  // timeline panels can read them when present without dropping into `any`.
  const o = order as Order & {
    business: Business;
    items: OrderItem[];
    loyalty_discount?: number | null;
    loyalty_points_redeemed?: number | null;
    verified_resident_discount?: number | null;
    store_accepted_at?: string | null;
    prep_ready_at?: string | null;
    cancelled_at?: string | null;
    cancellation_reason?: string | null;
  };
  const tone = STATUS_TONE[o.status] ?? STATUS_TONE.pending;

  // Payment status. The Stripe payment intent is captured at checkout, so
  // an order with a `stripe_payment_intent_id` AND a status that isn't
  // "pending" or "cancelled" is paid in full.
  const isPaid =
    !!o.stripe_payment_intent_id &&
    o.status !== "pending" &&
    o.status !== "cancelled";
  const isCancelled = o.status === "cancelled";
  const stripeRcpt = o.stripe_payment_intent_id
    ? o.stripe_payment_intent_id.slice(-6).toUpperCase()
    : null;

  const placed = new Date(o.created_at);
  const itemCount = (o.items ?? []).reduce(
    (sum, it) => sum + (it.quantity ?? 1),
    0,
  );

  return (
    <div className="culture-surface min-h-dvh animate-fade-in pb-24">
      {/* Masthead */}
      <header
        className="px-[18px] pt-4 pb-4"
        style={{ borderBottom: "3px solid var(--rule-strong-c)" }}
      >
        <Link
          href="/orders"
          className="press inline-flex items-center gap-1 mb-3"
          style={{
            fontFamily: "var(--font-archivo), Archivo, sans-serif",
            fontWeight: 800,
            fontSize: 11,
            letterSpacing: "0.16em",
            color: "var(--ink-strong)",
            textTransform: "uppercase",
          }}
        >
          ← My Orders
        </Link>
        <div className="c-kicker" style={{ opacity: 0.65 }}>
          § COMMERCE · ORDER #{o.order_number}
        </div>
        <h1
          className="c-hero mt-2"
          style={{ fontSize: 44, lineHeight: 0.92, letterSpacing: "-0.02em" }}
        >
          {o.business?.name ?? "Order"}
        </h1>
        <p
          className="c-serif-it mt-2"
          style={{ fontSize: 14, color: "var(--ink-strong)", opacity: 0.85 }}
        >
          {o.type === "delivery" ? "Delivery" : "Pickup"} order ·{" "}
          {itemCount} {itemCount === 1 ? "item" : "items"}
        </p>
      </header>

      {/* Status pills row — order status + paid status */}
      <div className="px-[18px] pt-5 flex items-center gap-2 flex-wrap">
        <span
          className="inline-flex items-center gap-2"
          style={{
            background: tone.bg,
            color: tone.fg,
            border: "2px solid var(--rule-strong-c)",
            padding: "6px 12px",
            fontFamily: "var(--font-archivo), Archivo, sans-serif",
            fontWeight: 800,
            fontSize: 11,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
          }}
        >
          <span
            aria-hidden
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: tone.dot,
              display: "inline-block",
            }}
          />
          {STATUS_LABEL[o.status] ?? o.status.toUpperCase()}
        </span>
        <span
          className="inline-flex items-center gap-2"
          style={{
            background: isPaid ? "var(--gold-c)" : isCancelled ? "var(--paper)" : "var(--paper-soft, #DCD3BF)",
            color: isCancelled ? "var(--ink-mute)" : "var(--ink-strong)",
            border: "2px solid var(--rule-strong-c)",
            padding: "6px 12px",
            fontFamily: "var(--font-archivo), Archivo, sans-serif",
            fontWeight: 800,
            fontSize: 11,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
          }}
        >
          {isPaid ? "✓ PAID" : isCancelled ? "VOIDED" : "PAYMENT PENDING"}
        </span>
      </div>

      {/* Status stepper — ink slab so it doesn't fight the paper */}
      <div className="px-[18px] pt-5">
        <OrderTracker
          orderId={o.id}
          initialStatus={o.status}
          orderNumber={o.order_number}
          businessName={o.business?.name}
        />
      </div>

      {/* PICKUP / DELIVERY block */}
      <section className="px-[18px] pt-6">
        <div className="c-kicker mb-2">
          § {o.type === "delivery" ? "DELIVERY TO" : "PICKUP FROM"}
        </div>
        <div className="c-rule mb-3" />
        <div className="c-frame" style={{ padding: 16, background: "var(--paper)" }}>
          <Link
            href={`/business/${o.business?.slug ?? o.business?.id ?? ""}`}
            className="press"
            style={{
              display: "block",
              fontFamily: "var(--font-anton), Anton, sans-serif",
              fontSize: 22,
              color: "var(--ink-strong)",
              lineHeight: 1.0,
            }}
          >
            {o.business?.name}
          </Link>
          {o.type === "delivery" && o.delivery_address ? (
            <p
              className="c-meta mt-2"
              style={{ fontSize: 13, color: "var(--ink-strong)", opacity: 0.85 }}
            >
              {o.delivery_address}
            </p>
          ) : o.business?.address ? (
            <p
              className="c-meta mt-2"
              style={{ fontSize: 13, color: "var(--ink-strong)", opacity: 0.85 }}
            >
              {o.business.address}
            </p>
          ) : null}
          {o.delivery_notes && (
            <p
              className="c-serif-it mt-2"
              style={{ fontSize: 13, color: "var(--ink-strong)", opacity: 0.8 }}
            >
              Note: {o.delivery_notes}
            </p>
          )}
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            {o.business?.phone && (
              <a
                href={`tel:${o.business.phone}`}
                className="press inline-flex items-center gap-1.5"
                style={{
                  fontFamily: "var(--font-archivo), Archivo, sans-serif",
                  fontWeight: 800,
                  fontSize: 11,
                  letterSpacing: "0.14em",
                  color: "var(--gold-c)",
                  textTransform: "uppercase",
                }}
              >
                <Icon name="phone" size={13} />
                {o.business.phone}
              </a>
            )}
            {(o.delivery_address || o.business?.address) && (
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(
                  o.type === "delivery" && o.delivery_address
                    ? o.delivery_address
                    : o.business!.address!,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="press inline-flex items-center gap-1.5"
                style={{
                  fontFamily: "var(--font-archivo), Archivo, sans-serif",
                  fontWeight: 800,
                  fontSize: 11,
                  letterSpacing: "0.14em",
                  color: "var(--gold-c)",
                  textTransform: "uppercase",
                }}
              >
                <Icon name="pin" size={13} />
                Directions
              </a>
            )}
          </div>
        </div>
      </section>

      {/* ITEMS */}
      <section className="px-[18px] pt-6">
        <div className="c-kicker mb-2">§ ITEMS</div>
        <div className="c-rule mb-3" />
        <div
          className="c-frame"
          style={{ padding: 0, background: "var(--paper)", overflow: "hidden" }}
        >
          {(o.items ?? []).map((item, i) => (
            <div
              key={item.id}
              style={{
                padding: "12px 16px",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 12,
                borderBottom:
                  i < (o.items?.length ?? 0) - 1
                    ? "1px solid var(--rule-c)"
                    : "none",
              }}
            >
              <div style={{ display: "flex", gap: 10, minWidth: 0, flex: 1 }}>
                <span
                  style={{
                    fontFamily: "var(--font-anton), Anton, sans-serif",
                    fontSize: 18,
                    color: "var(--gold-c)",
                    minWidth: 28,
                    lineHeight: 1.1,
                  }}
                >
                  {item.quantity}×
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    className="c-card-t"
                    style={{
                      fontSize: 14,
                      color: "var(--ink-strong)",
                      lineHeight: 1.25,
                    }}
                  >
                    {item.name}
                  </p>
                  {item.special_instructions && (
                    <p
                      className="c-serif-it"
                      style={{
                        fontSize: 12,
                        marginTop: 4,
                        color: "var(--ink-strong)",
                        opacity: 0.7,
                      }}
                    >
                      “{item.special_instructions}”
                    </p>
                  )}
                </div>
              </div>
              <span
                style={{
                  fontFamily: "var(--font-archivo), Archivo, sans-serif",
                  fontWeight: 800,
                  fontSize: 14,
                  fontVariantNumeric: "tabular-nums",
                  color: "var(--ink-strong)",
                  whiteSpace: "nowrap",
                }}
              >
                {dollars(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* PAYMENT (receipt) */}
      <section className="px-[18px] pt-6">
        <div className="c-kicker mb-2">§ RECEIPT</div>
        <div className="c-rule mb-3" />
        <div
          className="c-frame"
          style={{ padding: 0, background: "var(--paper)", overflow: "hidden" }}
        >
          <ReceiptRow label="Subtotal" value={dollars(o.subtotal)} />
          {o.tax > 0 && <ReceiptRow label="Tax" value={dollars(o.tax)} />}
          {o.tip > 0 && <ReceiptRow label="Tip" value={dollars(o.tip)} />}
          {o.platform_fee > 0 && (
            <ReceiptRow label="Service fee" value={dollars(o.platform_fee)} />
          )}
          {(o.discount_amount ?? 0) > 0 && (
            <ReceiptRow
              label="Discount"
              value={`− ${dollars(o.discount_amount ?? 0)}`}
              tone="credit"
            />
          )}
          {(o.loyalty_discount ?? 0) > 0 && (
            <ReceiptRow
              label={`Loyalty (${o.loyalty_points_redeemed ?? 0} pts)`}
              value={`− ${dollars(o.loyalty_discount ?? 0)}`}
              tone="credit"
            />
          )}
          {(o.verified_resident_discount ?? 0) > 0 && (
            <ReceiptRow
              label="Verified resident"
              value={`− ${dollars(o.verified_resident_discount ?? 0)}`}
              tone="credit"
            />
          )}
          <div
            style={{
              borderTop: "2px solid var(--rule-strong-c)",
              padding: "16px",
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              background: "var(--ink-strong)",
              color: "var(--paper)",
            }}
          >
            <div>
              <p
                className="c-kicker"
                style={{
                  fontSize: 10,
                  color: "var(--gold-c)",
                  letterSpacing: "0.18em",
                }}
              >
                {isPaid ? "PAID IN FULL" : isCancelled ? "VOIDED" : "AMOUNT DUE"}
              </p>
              <p
                style={{
                  fontFamily: "var(--font-anton), Anton, sans-serif",
                  fontSize: 32,
                  marginTop: 4,
                  lineHeight: 1,
                }}
              >
                {dollars(o.total)}
              </p>
            </div>
            <p
              className="c-serif-it"
              style={{
                fontSize: 12,
                color: "rgba(243,238,220,0.7)",
                maxWidth: 160,
                textAlign: "right",
              }}
            >
              {isPaid
                ? "Show this confirmation when picking up your order."
                : isCancelled
                  ? "This order was cancelled. Any charge is being refunded."
                  : "Awaiting business confirmation."}
            </p>
          </div>
          {stripeRcpt && (
            <div
              style={{
                padding: "10px 16px",
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                background: "var(--paper-soft, #DCD3BF)",
                fontFamily: "var(--font-dm-mono), monospace",
                fontSize: 11,
                letterSpacing: "0.08em",
                color: "var(--ink-strong)",
              }}
            >
              <span>STRIPE RECEIPT</span>
              <span>#{stripeRcpt}</span>
            </div>
          )}
        </div>
      </section>

      {/* TIMELINE */}
      <section className="px-[18px] pt-6">
        <div className="c-kicker mb-2">§ TIMELINE</div>
        <div className="c-rule mb-3" />
        <div
          className="c-frame"
          style={{ padding: 0, background: "var(--paper)", overflow: "hidden" }}
        >
          <TimelineRow
            label="Order placed"
            time={placed.toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          />
          {o.store_accepted_at && (
            <TimelineRow
              label="Confirmed by business"
              time={new Date(o.store_accepted_at).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            />
          )}
          {o.prep_ready_at && (
            <TimelineRow
              label="Ready"
              time={new Date(o.prep_ready_at).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            />
          )}
          {o.completed_at && (
            <TimelineRow
              label={
                o.type === "delivery" ? "Delivered" : "Picked up"
              }
              time={new Date(o.completed_at).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
              last
            />
          )}
          {o.cancelled_at && (
            <TimelineRow
              label="Cancelled"
              time={new Date(o.cancelled_at).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
              last
            />
          )}
        </div>
        {o.cancellation_reason && (
          <p
            className="c-serif-it mt-2"
            style={{ fontSize: 13, color: "var(--ink-mute)" }}
          >
            Reason: {o.cancellation_reason}
          </p>
        )}
      </section>

      {/* Receipt URL (printable) */}
      {o.receipt_url && (
        <section className="px-[18px] pt-6">
          <a
            href={o.receipt_url}
            target="_blank"
            rel="noopener noreferrer"
            className="press inline-flex items-center justify-center w-full"
            style={{
              padding: "12px 16px",
              border: "2px solid var(--rule-strong-c)",
              background: "var(--paper)",
              color: "var(--ink-strong)",
              fontFamily: "var(--font-archivo), Archivo, sans-serif",
              fontWeight: 800,
              fontSize: 12,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            View Stripe Receipt ↗
          </a>
        </section>
      )}
    </div>
  );
}

function ReceiptRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "credit";
}) {
  return (
    <div
      style={{
        padding: "12px 16px",
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        borderBottom: "1px solid var(--rule-c)",
      }}
    >
      <span
        className="c-kicker"
        style={{ fontSize: 11, color: "var(--ink-strong)", opacity: 0.85 }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "var(--font-archivo), Archivo, sans-serif",
          fontWeight: 800,
          fontSize: 15,
          fontVariantNumeric: "tabular-nums",
          color: tone === "credit" ? "var(--gold-c)" : "var(--ink-strong)",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function TimelineRow({
  label,
  time,
  last,
}: {
  label: string;
  time: string;
  last?: boolean;
}) {
  return (
    <div
      style={{
        padding: "12px 16px",
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        gap: 12,
        borderBottom: last ? "none" : "1px solid var(--rule-c)",
      }}
    >
      <span
        className="c-kicker"
        style={{ fontSize: 11, color: "var(--ink-strong)", opacity: 0.9 }}
      >
        {label}
      </span>
      <span
        className="c-meta"
        style={{
          fontSize: 11,
          color: "var(--ink-mute)",
          fontVariantNumeric: "tabular-nums",
          textAlign: "right",
        }}
      >
        {time.toUpperCase()}
      </span>
    </div>
  );
}
