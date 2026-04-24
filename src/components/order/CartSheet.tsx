"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import Input from "@/components/ui/Input";
import Icon from "@/components/ui/Icon";
import {
  useCart,
  bagItemCount,
  bagSubtotal,
  type CartBag,
  type PickupLocation,
} from "@/lib/cart";
import type { Business, VendorVehicle } from "@/types/database";

interface AppliedCoupon {
  id: string;
  title: string;
  discount_amount: number; // cents
}

interface CartSheetProps {
  open: boolean;
  onClose: () => void;
  /**
   * Fires when the user taps "Checkout" on the bag for the business
   * that's currently loaded in OrderView. Other bags render with a
   * "GO TO SHOP" link instead of a checkout button, because pickup
   * options, tax, and delivery addressing are resolved on the
   * business's own order page.
   */
  onCheckout: (opts?: { couponId?: string; discount?: number }) => void;
  loading?: boolean;
  business?: Business;
  vehicles?: VendorVehicle[];
}

const TAX_RATE = 0.095;

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * Inline logo slab with fallback initials. Keeps the same Culture
 * press-pass treatment used across business surfaces so every bag
 * header reads as a newsprint byline.
 */
function BagLogo({ bag }: { bag: CartBag }) {
  if (bag.businessLogoUrl) {
    return (
      <div
        className="relative w-10 h-10 overflow-hidden shrink-0"
        style={{ border: "2px solid var(--rule-strong-c)" }}
      >
        <Image
          src={bag.businessLogoUrl}
          alt={bag.businessName}
          fill
          className="object-cover"
        />
      </div>
    );
  }
  const initials = bag.businessName
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      className="w-10 h-10 flex items-center justify-center shrink-0 c-hero"
      style={{
        background: "var(--gold-c)",
        color: "var(--ink-strong)",
        border: "2px solid var(--rule-strong-c)",
        fontSize: 14,
        lineHeight: 1,
      }}
    >
      {initials || "HC"}
    </div>
  );
}

export default function CartSheet({
  open,
  onClose,
  onCheckout,
  loading = false,
  business,
  vehicles = [],
}: CartSheetProps) {
  const { state, dispatch, bags, totalItemCount, totalSubtotal } = useCart();
  const [deliveryAddress, setDeliveryAddress] = useState("");

  // Per-bag coupon state — indexed by businessId. Each bag is an
  // independent order, so each one carries its own promo code and
  // discount.
  const [appliedCoupons, setAppliedCoupons] = useState<
    Record<string, AppliedCoupon | null>
  >({});
  const [showCouponInput, setShowCouponInput] = useState<
    Record<string, boolean>
  >({});
  const [couponCodes, setCouponCodes] = useState<Record<string, string>>({});
  const [couponErrors, setCouponErrors] = useState<Record<string, string>>({});
  const [couponLoadingBiz, setCouponLoadingBiz] = useState<string | null>(null);

  // The bag for the business whose /order page we're currently on. Only
  // this bag gets the full checkout flow (order type, pickup picker,
  // coupon, tip, Checkout button). Other bags are shown in compact
  // "go to shop" rows.
  const activeBag = useMemo(
    () => (business ? bags.find((b) => b.businessId === business.id) : undefined),
    [bags, business]
  );

  const otherBags = useMemo(
    () => (business ? bags.filter((b) => b.businessId !== business.id) : bags),
    [bags, business]
  );

  // Build the list of pickup options for the active business.
  const pickupOptions: PickupLocation[] = useMemo(() => {
    const opts: PickupLocation[] = [];
    if (business?.address) {
      opts.push({
        kind: "store",
        name: `${business.name} — ${business.address.split(",")[0]}`,
      });
    }
    for (const v of vehicles) {
      if (!v.is_active) continue;
      if (
        v.vendor_status === "closed" ||
        v.vendor_status === "inactive" ||
        v.vendor_status === "cancelled"
      ) {
        continue;
      }
      const typeLabel = v.vehicle_type === "cart" ? "Cart" : "Truck";
      const spot = v.current_location_name ? ` — ${v.current_location_name}` : "";
      opts.push({
        kind: "vehicle",
        vehicleId: v.id,
        name: `${typeLabel}: ${v.name}${spot}`,
      });
    }
    return opts;
  }, [business, vehicles]);

  // Default-select first pickup option for the active bag if none chosen
  useEffect(() => {
    if (!activeBag) return;
    if (activeBag.orderType !== "pickup") return;
    if (activeBag.pickupLocation) return;
    if (pickupOptions.length === 0) return;
    dispatch({
      type: "SET_PICKUP_LOCATION",
      payload: { businessId: activeBag.businessId, location: pickupOptions[0] },
    });
  }, [activeBag, pickupOptions, dispatch]);

  async function handleApplyCoupon(bag: CartBag) {
    const code = (couponCodes[bag.businessId] ?? "").trim();
    if (!code) return;

    setCouponLoadingBiz(bag.businessId);
    setCouponErrors((prev) => ({ ...prev, [bag.businessId]: "" }));

    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          business_id: bag.businessId,
          subtotal: bagSubtotal(bag),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setCouponErrors((prev) => ({
          ...prev,
          [bag.businessId]: data.error || "Invalid coupon code",
        }));
        return;
      }

      setAppliedCoupons((prev) => ({
        ...prev,
        [bag.businessId]: {
          id: data.coupon.id,
          title: data.coupon.title || code.toUpperCase(),
          discount_amount: data.discount_amount,
        },
      }));
      setCouponCodes((prev) => ({ ...prev, [bag.businessId]: "" }));
      setShowCouponInput((prev) => ({ ...prev, [bag.businessId]: false }));
    } catch {
      setCouponErrors((prev) => ({
        ...prev,
        [bag.businessId]: "Failed to validate coupon",
      }));
    } finally {
      setCouponLoadingBiz(null);
    }
  }

  function removeCoupon(businessId: string) {
    setAppliedCoupons((prev) => ({ ...prev, [businessId]: null }));
    setCouponCodes((prev) => ({ ...prev, [businessId]: "" }));
    setCouponErrors((prev) => ({ ...prev, [businessId]: "" }));
  }

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: "rgba(26,21,18,0.72)" }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 max-w-[430px] mx-auto">
        <div
          className="max-h-[88dvh] flex flex-col"
          style={{
            background: "var(--paper)",
            color: "var(--ink-strong)",
            borderTop: "3px solid var(--rule-strong-c)",
          }}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div
              className="w-10 h-1 rounded-full"
              style={{ background: "var(--ink-strong)", opacity: 0.4 }}
            />
          </div>

          {/* Header */}
          <div
            className="flex items-center justify-between px-5 pb-3"
            style={{ borderBottom: "2px solid var(--rule-strong-c)" }}
          >
            <div>
              <h2 className="c-hero" style={{ fontSize: "24px", lineHeight: 1 }}>
                Your Cart
              </h2>
              <p
                className="c-kicker mt-1"
                style={{
                  fontSize: 10,
                  color: "var(--ink-strong)",
                  opacity: 0.7,
                  letterSpacing: "0.14em",
                }}
              >
                {totalItemCount} ITEM{totalItemCount === 1 ? "" : "S"}
                {bags.length > 1 && ` · ${bags.length} BUSINESSES`}
              </p>
            </div>
            <button onClick={onClose} className="c-btn c-btn-outline c-btn-sm">
              Close
            </button>
          </div>

          {/* Multi-business notice */}
          {bags.length > 1 && (
            <div
              className="mx-5 mt-4 px-4 py-2.5 flex items-start gap-2"
              style={{
                background: "var(--ink-strong)",
                border: "2px solid var(--rule-strong-c)",
                color: "var(--gold-c)",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0 mt-0.5"
              >
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
              <div>
                <p
                  className="c-kicker"
                  style={{ fontSize: 10, letterSpacing: "0.14em" }}
                >
                  ONE CART · SEPARATE BAGS
                </p>
                <p
                  className="c-serif-it mt-0.5"
                  style={{ fontSize: 11, color: "var(--paper)", opacity: 0.85 }}
                >
                  Each business gets their own order. Check out one bag
                  today, come back for the rest tomorrow.
                </p>
              </div>
            </div>
          )}

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-5 pb-4 pt-4 space-y-6">
            {bags.length === 0 ? (
              <div className="text-center py-8">
                <p className="c-meta">Your cart is empty</p>
              </div>
            ) : (
              <>
                {/* ── ACTIVE BAG — full checkout UI ── */}
                {activeBag && (
                  <ActiveBagSection
                    bag={activeBag}
                    business={business!}
                    vehicles={vehicles}
                    pickupOptions={pickupOptions}
                    deliveryAddress={deliveryAddress}
                    setDeliveryAddress={setDeliveryAddress}
                    appliedCoupon={appliedCoupons[activeBag.businessId] ?? null}
                    showCouponInputFlag={!!showCouponInput[activeBag.businessId]}
                    couponCode={couponCodes[activeBag.businessId] ?? ""}
                    couponError={couponErrors[activeBag.businessId] ?? ""}
                    couponLoading={couponLoadingBiz === activeBag.businessId}
                    loading={loading}
                    onApplyCoupon={() => handleApplyCoupon(activeBag)}
                    onRemoveCoupon={() => removeCoupon(activeBag.businessId)}
                    onToggleCouponInput={(show) =>
                      setShowCouponInput((prev) => ({
                        ...prev,
                        [activeBag.businessId]: show,
                      }))
                    }
                    onChangeCouponCode={(code) => {
                      setCouponCodes((prev) => ({
                        ...prev,
                        [activeBag.businessId]: code,
                      }));
                      setCouponErrors((prev) => ({
                        ...prev,
                        [activeBag.businessId]: "",
                      }));
                    }}
                    onCheckout={() => {
                      const coupon = appliedCoupons[activeBag.businessId];
                      onCheckout(
                        coupon
                          ? {
                              couponId: coupon.id,
                              discount: coupon.discount_amount,
                            }
                          : undefined
                      );
                    }}
                  />
                )}

                {/* ── OTHER BAGS — compact, linked to their shop ── */}
                {otherBags.length > 0 && (
                  <div className="space-y-4">
                    {activeBag && (
                      <div
                        className="flex items-center gap-3"
                        aria-hidden="true"
                      >
                        <div
                          className="flex-1"
                          style={{
                            height: 2,
                            background: "var(--rule-strong-c)",
                          }}
                        />
                        <span
                          className="c-kicker"
                          style={{
                            fontSize: 10,
                            color: "var(--ink-strong)",
                            opacity: 0.7,
                            letterSpacing: "0.14em",
                          }}
                        >
                          ALSO IN YOUR CART
                        </span>
                        <div
                          className="flex-1"
                          style={{
                            height: 2,
                            background: "var(--rule-strong-c)",
                          }}
                        />
                      </div>
                    )}
                    {otherBags.map((bag) => (
                      <OtherBagSection key={bag.businessId} bag={bag} />
                    ))}
                  </div>
                )}

                {/* ── GRAND TOTAL if multi-bag ── */}
                {bags.length > 1 && (
                  <div
                    className="px-4 py-3"
                    style={{
                      background: "var(--gold-c)",
                      border: "2px solid var(--rule-strong-c)",
                      color: "var(--ink-strong)",
                    }}
                  >
                    <div className="flex items-baseline justify-between">
                      <span
                        className="c-kicker"
                        style={{
                          fontSize: 10,
                          letterSpacing: "0.16em",
                        }}
                      >
                        CART TOTAL · ALL BAGS
                      </span>
                      <span className="c-hero" style={{ fontSize: 22 }}>
                        {formatCurrency(totalSubtotal)}
                      </span>
                    </div>
                    <p
                      className="c-serif-it mt-1"
                      style={{ fontSize: 11, opacity: 0.75 }}
                    >
                      Subtotal across every business · tax &amp; tip added at
                      checkout.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────
// ACTIVE BAG — full checkout UI
// ─────────────────────────────────────────────────────────────────────

interface ActiveBagSectionProps {
  bag: CartBag;
  business: Business;
  vehicles: VendorVehicle[];
  pickupOptions: PickupLocation[];
  deliveryAddress: string;
  setDeliveryAddress: (value: string) => void;
  appliedCoupon: AppliedCoupon | null;
  showCouponInputFlag: boolean;
  couponCode: string;
  couponError: string;
  couponLoading: boolean;
  loading: boolean;
  onApplyCoupon: () => void;
  onRemoveCoupon: () => void;
  onToggleCouponInput: (show: boolean) => void;
  onChangeCouponCode: (code: string) => void;
  onCheckout: () => void;
}

function ActiveBagSection({
  bag,
  business,
  pickupOptions,
  deliveryAddress,
  setDeliveryAddress,
  appliedCoupon,
  showCouponInputFlag,
  couponCode,
  couponError,
  couponLoading,
  loading,
  onApplyCoupon,
  onRemoveCoupon,
  onToggleCouponInput,
  onChangeCouponCode,
  onCheckout,
}: ActiveBagSectionProps) {
  const { dispatch } = useCart();
  const subtotal = bagSubtotal(bag);
  const discount = appliedCoupon?.discount_amount ?? 0;
  const tax = Math.round(subtotal * TAX_RATE);
  const total = Math.max(subtotal + tax + bag.tip - discount, 0);

  return (
    <div className="space-y-4">
      {/* Bag header — gold foil bar across top with business byline */}
      <div>
        <div
          style={{
            height: 4,
            background: "var(--gold-c)",
            borderTop: "2px solid var(--rule-strong-c)",
            borderLeft: "2px solid var(--rule-strong-c)",
            borderRight: "2px solid var(--rule-strong-c)",
          }}
        />
        <div
          className="flex items-center gap-3 px-3 py-2.5"
          style={{
            background: "var(--ink-strong)",
            border: "2px solid var(--rule-strong-c)",
            color: "var(--paper)",
          }}
        >
          <BagLogo bag={bag} />
          <div className="flex-1 min-w-0">
            <p
              className="c-kicker truncate"
              style={{
                fontSize: 9,
                color: "var(--gold-c)",
                letterSpacing: "0.18em",
              }}
            >
              CHECKING OUT NEXT
            </p>
            <p
              className="c-card-t truncate"
              style={{ fontSize: 14, color: "var(--paper)", marginTop: 2 }}
            >
              {bag.businessName}
            </p>
          </div>
          <span
            className="c-kicker tabular-nums shrink-0"
            style={{
              fontSize: 10,
              color: "var(--gold-c)",
              letterSpacing: "0.12em",
            }}
          >
            {bagItemCount(bag)} × {formatCurrency(subtotal)}
          </span>
        </div>
      </div>

      {/* Order Type Toggle */}
      <div className="flex gap-0" style={{ border: "2px solid var(--rule-strong-c)" }}>
        <button
          onClick={() =>
            dispatch({
              type: "SET_ORDER_TYPE",
              payload: { businessId: bag.businessId, orderType: "pickup" },
            })
          }
          className="flex-1 py-2.5 c-ui text-[11px] transition-all"
          style={
            bag.orderType === "pickup"
              ? { background: "var(--gold-c)", color: "var(--ink-strong)" }
              : {
                  background: "var(--paper)",
                  color: "var(--ink-strong)",
                  opacity: 0.7,
                }
          }
        >
          Pickup
        </button>
        <button
          onClick={() =>
            dispatch({
              type: "SET_ORDER_TYPE",
              payload: { businessId: bag.businessId, orderType: "delivery" },
            })
          }
          className="flex-1 py-2.5 c-ui text-[11px] transition-all"
          style={
            bag.orderType === "delivery"
              ? { background: "var(--gold-c)", color: "var(--ink-strong)" }
              : {
                  background: "var(--paper)",
                  color: "var(--ink-strong)",
                  opacity: 0.7,
                }
          }
        >
          Delivery
        </button>
      </div>

      {/* Pickup Location Picker */}
      {bag.orderType === "pickup" && pickupOptions.length > 0 && (
        <div className="space-y-2">
          <p
            className="c-kicker"
            style={{ color: "var(--ink-strong)", opacity: 0.7 }}
          >
            Pick up from
          </p>
          <div className="space-y-1.5">
            {pickupOptions.map((opt) => {
              const selected =
                bag.pickupLocation?.kind === opt.kind &&
                (opt.kind === "store"
                  ? bag.pickupLocation?.kind === "store"
                  : bag.pickupLocation?.vehicleId === opt.vehicleId);
              return (
                <button
                  key={opt.kind === "store" ? "store" : opt.vehicleId}
                  onClick={() =>
                    dispatch({
                      type: "SET_PICKUP_LOCATION",
                      payload: { businessId: bag.businessId, location: opt },
                    })
                  }
                  className="w-full flex items-center gap-3 p-3 text-left transition-colors press"
                  style={
                    selected
                      ? {
                          background: "var(--gold-c)",
                          border: "2px solid var(--rule-strong-c)",
                          color: "var(--ink-strong)",
                        }
                      : {
                          background: "var(--paper)",
                          border: "2px solid var(--rule-strong-c)",
                          color: "var(--ink-strong)",
                        }
                  }
                >
                  <div
                    className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center"
                    style={{ border: "2px solid var(--rule-strong-c)" }}
                  >
                    {selected && (
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ background: "var(--ink-strong)" }}
                      />
                    )}
                  </div>
                  <div
                    className="w-8 h-8 flex items-center justify-center shrink-0 c-frame"
                    style={{ background: "var(--paper-soft)" }}
                  >
                    <Icon
                      name={
                        opt.kind === "store"
                          ? "store"
                          : opt.name.startsWith("Cart")
                            ? "cart"
                            : "truck"
                      }
                      size={16}
                      style={{ color: "var(--ink-strong)" }}
                    />
                  </div>
                  <span
                    className="c-card-t truncate flex-1"
                    style={{ fontSize: "13px" }}
                  >
                    {opt.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Delivery Address */}
      {bag.orderType === "delivery" && (
        <Input
          label="Delivery Address"
          placeholder="Enter your delivery address"
          value={deliveryAddress}
          onChange={(e) => setDeliveryAddress(e.target.value)}
        />
      )}

      {/* Cart Items */}
      <div>
        {bag.items.map((item, idx) => (
          <div
            key={`${item.menu_item_id}-${item.variant_id ?? "base"}-${idx}`}
            className="p-3"
            style={{
              background: "var(--paper)",
              borderBottom: "2px solid var(--rule-strong-c)",
              color: "var(--ink-strong)",
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="c-card-t" style={{ fontSize: "14px" }}>
                  {item.name}
                </h3>
                {item.variant_name && (
                  <p
                    className="c-meta mt-0.5"
                    style={{ color: "var(--gold-deep-c)" }}
                  >
                    {item.variant_name}
                  </p>
                )}
                <p className="c-meta mt-0.5">
                  {formatCurrency(item.price)} each
                </p>
                <input
                  type="text"
                  placeholder="Special instructions..."
                  value={item.special_instructions ?? ""}
                  onChange={(e) =>
                    dispatch({
                      type: "UPDATE_INSTRUCTIONS",
                      payload: {
                        businessId: bag.businessId,
                        menuItemId: item.menu_item_id,
                        variantId: item.variant_id,
                        instructions: e.target.value || undefined,
                      },
                    })
                  }
                  className="mt-2 w-full px-3 py-1.5 text-[11px] focus:outline-none"
                  style={{
                    background: "var(--paper)",
                    color: "var(--ink-strong)",
                    border: "2px solid var(--rule-strong-c)",
                    borderRadius: 0,
                  }}
                />
              </div>
              {/* Quantity controls */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() =>
                    dispatch({
                      type: "UPDATE_QUANTITY",
                      payload: {
                        businessId: bag.businessId,
                        menuItemId: item.menu_item_id,
                        variantId: item.variant_id,
                        quantity: item.quantity - 1,
                      },
                    })
                  }
                  className="w-7 h-7 flex items-center justify-center text-sm font-bold transition-colors"
                  style={{
                    background: "var(--paper)",
                    color: "var(--ink-strong)",
                    border: "2px solid var(--rule-strong-c)",
                  }}
                >
                  -
                </button>
                <span
                  className="c-card-t w-5 text-center"
                  style={{ fontSize: "14px" }}
                >
                  {item.quantity}
                </span>
                <button
                  onClick={() =>
                    dispatch({
                      type: "UPDATE_QUANTITY",
                      payload: {
                        businessId: bag.businessId,
                        menuItemId: item.menu_item_id,
                        variantId: item.variant_id,
                        quantity: item.quantity + 1,
                      },
                    })
                  }
                  className="w-7 h-7 flex items-center justify-center text-sm font-bold transition-colors"
                  style={{
                    background: "var(--paper)",
                    color: "var(--ink-strong)",
                    border: "2px solid var(--rule-strong-c)",
                  }}
                >
                  +
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Coupon */}
      <div>
        {appliedCoupon ? (
          <div
            className="flex items-center justify-between px-3 py-2.5"
            style={{
              background: "var(--paper)",
              border: "2px solid var(--rule-strong-c)",
              color: "var(--ink-strong)",
            }}
          >
            <div>
              <p className="c-badge-ok c-badge" style={{ display: "inline-block" }}>
                {appliedCoupon.title}
              </p>
              <p className="c-meta mt-1">
                -{formatCurrency(appliedCoupon.discount_amount)} off
              </p>
            </div>
            <button
              onClick={onRemoveCoupon}
              className="c-btn c-btn-outline c-btn-sm press"
            >
              Remove
            </button>
          </div>
        ) : showCouponInputFlag ? (
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter promo code"
                value={couponCode}
                onChange={(e) => onChangeCouponCode(e.target.value)}
                className="flex-1 px-3 py-2.5 text-sm focus:outline-none"
                style={{
                  background: "var(--paper)",
                  color: "var(--ink-strong)",
                  border: "2px solid var(--rule-strong-c)",
                  borderRadius: 0,
                }}
              />
              <button
                onClick={onApplyCoupon}
                disabled={!couponCode.trim() || couponLoading}
                className="c-btn c-btn-accent c-btn-sm"
              >
                {couponLoading ? "..." : "Apply"}
              </button>
            </div>
            {couponError && (
              <p className="c-meta" style={{ color: "var(--red-c)" }}>
                {couponError}
              </p>
            )}
            <button
              onClick={() => onToggleCouponInput(false)}
              className="c-meta press"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => onToggleCouponInput(true)}
            className="c-ui text-[11px] press"
            style={{ color: "var(--ink-strong)" }}
          >
            Have a promo code?
          </button>
        )}
      </div>

      {/* Price Breakdown */}
      <div className="c-ink-block p-4">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span style={{ opacity: 0.75 }}>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ opacity: 0.75 }}>Tax (9.5%)</span>
            <span>{formatCurrency(tax)}</span>
          </div>
          {bag.tip > 0 && (
            <div className="flex justify-between">
              <span style={{ opacity: 0.75 }}>Tip</span>
              <span>{formatCurrency(bag.tip)}</span>
            </div>
          )}
          {discount > 0 && (
            <div className="flex justify-between">
              <span style={{ opacity: 0.75 }}>Discount</span>
              <span>-{formatCurrency(discount)}</span>
            </div>
          )}
          <div
            className="pt-2 flex justify-between c-card-t"
            style={{
              borderTop: "2px solid var(--paper)",
              fontSize: "16px",
            }}
          >
            <span>Bag total</span>
            <span style={{ color: "var(--gold-c)" }}>
              {formatCurrency(total)}
            </span>
          </div>
        </div>
      </div>

      {/* Checkout */}
      <button
        onClick={onCheckout}
        disabled={
          loading ||
          (bag.orderType === "delivery" && !deliveryAddress.trim()) ||
          (bag.orderType === "pickup" &&
            pickupOptions.length > 0 &&
            !bag.pickupLocation)
        }
        className="c-btn c-btn-primary w-full"
        style={{ opacity: loading ? 0.6 : 1 }}
      >
        {loading
          ? "Processing..."
          : `Checkout ${business.name} — ${formatCurrency(total)}`}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// OTHER BAG — compact, deep-link to their shop for checkout
// ─────────────────────────────────────────────────────────────────────

function OtherBagSection({ bag }: { bag: CartBag }) {
  const { dispatch } = useCart();
  const subtotal = bagSubtotal(bag);
  const count = bagItemCount(bag);
  const shopHref = bag.businessSlug
    ? `/business/${bag.businessSlug}/order`
    : `/business/${bag.businessId}/order`;

  return (
    <div
      style={{
        background: "var(--paper)",
        border: "2px solid var(--rule-strong-c)",
        color: "var(--ink-strong)",
      }}
    >
      {/* Bag header */}
      <div
        className="flex items-center gap-3 px-3 py-2.5"
        style={{ borderBottom: "2px solid var(--rule-strong-c)" }}
      >
        <BagLogo bag={bag} />
        <div className="flex-1 min-w-0">
          <p
            className="c-kicker truncate"
            style={{
              fontSize: 9,
              color: "var(--ink-strong)",
              opacity: 0.6,
              letterSpacing: "0.14em",
            }}
          >
            {bag.businessCategory
              ? bag.businessCategory.replace(/_/g, " ").toUpperCase()
              : "SAVED FOR LATER"}
          </p>
          <p
            className="c-card-t truncate"
            style={{ fontSize: 14, marginTop: 2 }}
          >
            {bag.businessName}
          </p>
        </div>
        <button
          onClick={() =>
            dispatch({ type: "CLEAR_BAG", payload: { businessId: bag.businessId } })
          }
          aria-label={`Remove ${bag.businessName} bag`}
          className="press c-kicker shrink-0"
          style={{
            fontSize: 10,
            color: "var(--ink-strong)",
            opacity: 0.55,
            letterSpacing: "0.12em",
            background: "var(--paper)",
            border: "2px solid var(--rule-strong-c)",
            padding: "4px 8px",
          }}
        >
          REMOVE
        </button>
      </div>

      {/* Items (compact) */}
      <div style={{ borderBottom: "2px solid var(--rule-strong-c)" }}>
        {bag.items.slice(0, 3).map((item, idx) => (
          <div
            key={`${item.menu_item_id}-${item.variant_id ?? "base"}-${idx}`}
            className="flex items-center justify-between px-3 py-2"
            style={{
              borderBottom:
                idx < Math.min(bag.items.length, 3) - 1
                  ? "1px dashed var(--rule-strong-c)"
                  : undefined,
            }}
          >
            <div className="flex-1 min-w-0">
              <p className="c-card-t truncate" style={{ fontSize: 12 }}>
                {item.quantity}× {item.name}
              </p>
              {item.variant_name && (
                <p
                  className="c-meta truncate"
                  style={{ fontSize: 10, opacity: 0.65 }}
                >
                  {item.variant_name}
                </p>
              )}
            </div>
            <span
              className="c-card-t tabular-nums shrink-0 ml-2"
              style={{ fontSize: 12 }}
            >
              {formatCurrency(item.price * item.quantity)}
            </span>
          </div>
        ))}
        {bag.items.length > 3 && (
          <div
            className="px-3 py-2 c-kicker text-center"
            style={{
              fontSize: 10,
              color: "var(--ink-strong)",
              opacity: 0.6,
              letterSpacing: "0.12em",
            }}
          >
            +{bag.items.length - 3} MORE ITEM{bag.items.length - 3 === 1 ? "" : "S"}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <div>
          <p
            className="c-kicker"
            style={{
              fontSize: 9,
              opacity: 0.6,
              letterSpacing: "0.14em",
            }}
          >
            {count} ITEM{count === 1 ? "" : "S"} · SUBTOTAL
          </p>
          <p className="c-hero" style={{ fontSize: 16, marginTop: 2 }}>
            {formatCurrency(subtotal)}
          </p>
        </div>
        <Link
          href={shopHref}
          className="c-btn c-btn-outline c-btn-sm press inline-flex items-center gap-1"
        >
          GO TO SHOP
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
