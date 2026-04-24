"use client";

import { useEffect, useMemo, useState } from "react";
import Input from "@/components/ui/Input";
import Icon from "@/components/ui/Icon";
import { useCart, type PickupLocation } from "@/lib/cart";
import type { Business, VendorVehicle } from "@/types/database";

interface AppliedCoupon {
  id: string;
  title: string;
  discount_amount: number; // cents
}

interface CartSheetProps {
  open: boolean;
  onClose: () => void;
  onCheckout: (opts?: { couponId?: string; discount?: number }) => void;
  loading?: boolean;
  business?: Business;
  vehicles?: VendorVehicle[];
}

const TAX_RATE = 0.095;

export default function CartSheet({
  open,
  onClose,
  onCheckout,
  loading = false,
  business,
  vehicles = [],
}: CartSheetProps) {
  const { state, dispatch, subtotal, itemCount } = useCart();
  const [deliveryAddress, setDeliveryAddress] = useState("");

  // Build the list of pickup options (store + each active, non-offline vehicle)
  const pickupOptions: PickupLocation[] = useMemo(() => {
    const opts: PickupLocation[] = [];
    // A storefront option shows whenever the business has a physical
    // address — even if it also runs mobile vehicles (mixed model).
    if (business?.address) {
      opts.push({
        kind: "store",
        name: `${business.name} — ${business.address.split(",")[0]}`,
      });
    }
    for (const v of vehicles) {
      if (!v.is_active) continue;
      if (v.vendor_status === "closed" || v.vendor_status === "inactive" || v.vendor_status === "cancelled") {
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

  // Default-select first pickup option if none chosen yet and we're on pickup
  useEffect(() => {
    if (state.orderType !== "pickup") return;
    if (state.pickupLocation) return;
    if (pickupOptions.length === 0) return;
    dispatch({ type: "SET_PICKUP_LOCATION", payload: pickupOptions[0] });
  }, [state.orderType, state.pickupLocation, pickupOptions, dispatch]);

  // Coupon state
  const [showCouponInput, setShowCouponInput] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  const discount = appliedCoupon?.discount_amount ?? 0;
  const tax = Math.round(subtotal * TAX_RATE);
  const total = Math.max(subtotal + tax + state.tip - discount, 0);

  async function handleApplyCoupon() {
    if (!couponCode.trim() || !state.businessId) return;
    setCouponLoading(true);
    setCouponError("");

    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponCode.trim(),
          business_id: state.businessId,
          subtotal,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setCouponError(data.error || "Invalid coupon code");
        return;
      }

      setAppliedCoupon({
        id: data.coupon.id,
        title: data.coupon.title || couponCode.trim().toUpperCase(),
        discount_amount: data.discount_amount,
      });
      setCouponCode("");
      setShowCouponInput(false);
    } catch {
      setCouponError("Failed to validate coupon");
    } finally {
      setCouponLoading(false);
    }
  }

  function removeCoupon() {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
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
          className="max-h-[80dvh] flex flex-col"
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
            <h2 className="c-hero" style={{ fontSize: "24px" }}>
              Your Order ({itemCount})
            </h2>
            <button
              onClick={onClose}
              className="c-btn c-btn-outline c-btn-sm"
            >
              Close
            </button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-4 pt-4">
            {/* Order Type Toggle */}
            <div
              className="flex gap-0"
              style={{ border: "2px solid var(--rule-strong-c)" }}
            >
              <button
                onClick={() => dispatch({ type: "SET_ORDER_TYPE", payload: "pickup" })}
                className="flex-1 py-2.5 c-ui text-[11px] transition-all"
                style={
                  state.orderType === "pickup"
                    ? { background: "var(--gold-c)", color: "var(--ink-strong)" }
                    : { background: "var(--paper)", color: "var(--ink-strong)", opacity: 0.7 }
                }
              >
                Pickup
              </button>
              <button
                onClick={() => dispatch({ type: "SET_ORDER_TYPE", payload: "delivery" })}
                className="flex-1 py-2.5 c-ui text-[11px] transition-all"
                style={
                  state.orderType === "delivery"
                    ? { background: "var(--gold-c)", color: "var(--ink-strong)" }
                    : { background: "var(--paper)", color: "var(--ink-strong)", opacity: 0.7 }
                }
              >
                Delivery
              </button>
            </div>

            {/* Pickup Location Picker */}
            {state.orderType === "pickup" && pickupOptions.length > 0 && (
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
                      state.pickupLocation?.kind === opt.kind &&
                      (opt.kind === "store"
                        ? state.pickupLocation?.kind === "store"
                        : state.pickupLocation?.vehicleId === opt.vehicleId);
                    return (
                      <button
                        key={opt.kind === "store" ? "store" : opt.vehicleId}
                        onClick={() =>
                          dispatch({ type: "SET_PICKUP_LOCATION", payload: opt })
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
            {state.orderType === "delivery" && (
              <Input
                label="Delivery Address"
                placeholder="Enter your delivery address"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
              />
            )}

            {/* Cart Items */}
            {state.items.length === 0 ? (
              <div className="text-center py-8">
                <p className="c-meta">Your cart is empty</p>
              </div>
            ) : (
              <div>
                {state.items.map((item, idx) => (
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
                          ${(item.price / 100).toFixed(2)} each
                        </p>
                        <input
                          type="text"
                          placeholder="Special instructions..."
                          value={item.special_instructions ?? ""}
                          onChange={(e) => {
                            const updatedItems = state.items.map((i, j) =>
                              j === idx
                                ? { ...i, special_instructions: e.target.value || undefined }
                                : i
                            );
                            dispatch({
                              type: "LOAD",
                              payload: { ...state, items: updatedItems },
                            });
                          }}
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
            )}

            {/* Coupon Code */}
            {state.items.length > 0 && (
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
                        -${(appliedCoupon.discount_amount / 100).toFixed(2)} off
                      </p>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="c-btn c-btn-outline c-btn-sm press"
                    >
                      Remove
                    </button>
                  </div>
                ) : showCouponInput ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter promo code"
                        value={couponCode}
                        onChange={(e) => {
                          setCouponCode(e.target.value);
                          setCouponError("");
                        }}
                        className="flex-1 px-3 py-2.5 text-sm focus:outline-none"
                        style={{
                          background: "var(--paper)",
                          color: "var(--ink-strong)",
                          border: "2px solid var(--rule-strong-c)",
                          borderRadius: 0,
                        }}
                      />
                      <button
                        onClick={handleApplyCoupon}
                        disabled={!couponCode.trim() || couponLoading}
                        className="c-btn c-btn-accent c-btn-sm"
                      >
                        {couponLoading ? "..." : "Apply"}
                      </button>
                    </div>
                    {couponError && (
                      <p
                        className="c-meta"
                        style={{ color: "var(--red-c)" }}
                      >
                        {couponError}
                      </p>
                    )}
                    <button
                      onClick={() => {
                        setShowCouponInput(false);
                        setCouponCode("");
                        setCouponError("");
                      }}
                      className="c-meta press"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowCouponInput(true)}
                    className="c-ui text-[11px] press"
                    style={{ color: "var(--ink-strong)" }}
                  >
                    Have a promo code?
                  </button>
                )}
              </div>
            )}

            {/* Price Breakdown */}
            {state.items.length > 0 && (
              <div className="c-ink-block p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span style={{ opacity: 0.75 }}>Subtotal</span>
                    <span>${(subtotal / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ opacity: 0.75 }}>Tax (9.5%)</span>
                    <span>${(tax / 100).toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between">
                      <span style={{ opacity: 0.75 }}>Discount</span>
                      <span>-${(discount / 100).toFixed(2)}</span>
                    </div>
                  )}
                  <div
                    className="pt-2 flex justify-between c-card-t"
                    style={{
                      borderTop: "2px solid var(--paper)",
                      fontSize: "16px",
                    }}
                  >
                    <span>Total</span>
                    <span style={{ color: "var(--gold-c)" }}>
                      ${(total / 100).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Checkout Button */}
          {state.items.length > 0 && (
            <div
              className="px-5 pb-6 pt-3"
              style={{ borderTop: "2px solid var(--rule-strong-c)" }}
            >
              <button
                onClick={() =>
                  onCheckout(
                    appliedCoupon
                      ? { couponId: appliedCoupon.id, discount: appliedCoupon.discount_amount }
                      : undefined
                  )
                }
                disabled={
                  loading ||
                  (state.orderType === "delivery" && !deliveryAddress.trim()) ||
                  (state.orderType === "pickup" &&
                    pickupOptions.length > 0 &&
                    !state.pickupLocation)
                }
                className="c-btn c-btn-primary w-full"
                style={{ opacity: loading ? 0.6 : 1 }}
              >
                {loading ? "Processing..." : `Checkout — $${(total / 100).toFixed(2)}`}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
