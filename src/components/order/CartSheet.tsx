"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import { useCart } from "@/lib/cart";

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
}

const TAX_RATE = 0.095;

export default function CartSheet({
  open,
  onClose,
  onCheckout,
  loading = false,
}: CartSheetProps) {
  const { state, dispatch, subtotal, itemCount } = useCart();
  const [deliveryAddress, setDeliveryAddress] = useState("");

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
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 max-w-[430px] mx-auto">
        <div className="bg-deep border-t border-border-subtle rounded-t-3xl max-h-[80dvh] flex flex-col">
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 pb-3">
            <h2 className="font-heading text-lg font-bold">
              Your Order ({itemCount})
            </h2>
            <button
              onClick={onClose}
              className="text-txt-secondary hover:text-white transition-colors text-sm"
            >
              Close
            </button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-4">
            {/* Order Type Toggle */}
            <div className="flex gap-2 p-1 bg-white/5 rounded-xl">
              <button
                onClick={() => dispatch({ type: "SET_ORDER_TYPE", payload: "pickup" })}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                  state.orderType === "pickup"
                    ? "bg-gold text-midnight"
                    : "text-txt-secondary"
                }`}
              >
                Pickup
              </button>
              <button
                onClick={() => dispatch({ type: "SET_ORDER_TYPE", payload: "delivery" })}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                  state.orderType === "delivery"
                    ? "bg-gold text-midnight"
                    : "text-txt-secondary"
                }`}
              >
                Delivery
              </button>
            </div>

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
                <p className="text-txt-secondary text-sm">Your cart is empty</p>
              </div>
            ) : (
              <div className="space-y-2">
                {state.items.map((item, idx) => (
                  <Card key={`${item.menu_item_id}-${item.variant_id ?? "base"}-${idx}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[13px] font-bold">{item.name}</h3>
                        {item.variant_name && (
                          <p className="text-[11px] text-gold font-medium mt-0.5">
                            {item.variant_name}
                          </p>
                        )}
                        <p className="text-xs text-txt-secondary mt-0.5">
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
                          className="mt-2 w-full bg-white/5 border border-border-subtle rounded-lg px-3 py-1.5 text-[11px] text-white placeholder:text-txt-secondary focus:outline-none focus:border-gold/40"
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
                          className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-sm font-bold hover:bg-white/20 transition-colors"
                        >
                          -
                        </button>
                        <span className="text-sm font-bold w-5 text-center">
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
                          className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-sm font-bold hover:bg-white/20 transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Coupon Code */}
            {state.items.length > 0 && (
              <div>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-emerald/10 border border-emerald/20 rounded-xl px-3 py-2.5">
                    <div>
                      <p className="text-xs font-semibold text-emerald">
                        {appliedCoupon.title}
                      </p>
                      <p className="text-[10px] text-emerald/70">
                        -${(appliedCoupon.discount_amount / 100).toFixed(2)} off
                      </p>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-xs text-emerald/70 hover:text-emerald press"
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
                        className="flex-1 bg-white/5 border border-border-subtle rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-txt-secondary focus:outline-none focus:border-gold/40"
                      />
                      <Button
                        size="sm"
                        onClick={handleApplyCoupon}
                        loading={couponLoading}
                        disabled={!couponCode.trim()}
                      >
                        Apply
                      </Button>
                    </div>
                    {couponError && (
                      <p className="text-xs text-coral">{couponError}</p>
                    )}
                    <button
                      onClick={() => {
                        setShowCouponInput(false);
                        setCouponCode("");
                        setCouponError("");
                      }}
                      className="text-xs text-txt-secondary press"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowCouponInput(true)}
                    className="text-xs text-gold font-semibold press"
                  >
                    Have a promo code?
                  </button>
                )}
              </div>
            )}

            {/* Price Breakdown */}
            {state.items.length > 0 && (
              <Card>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-txt-secondary">Subtotal</span>
                    <span>${(subtotal / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-txt-secondary">Tax (9.5%)</span>
                    <span>${(tax / 100).toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald">
                      <span>Discount</span>
                      <span>-${(discount / 100).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t border-border-subtle pt-2 flex justify-between font-bold">
                    <span>Total</span>
                    <span className="text-gold">
                      ${(total / 100).toFixed(2)}
                    </span>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Checkout Button */}
          {state.items.length > 0 && (
            <div className="px-5 pb-6 pt-2 border-t border-border-subtle">
              <Button
                fullWidth
                size="lg"
                onClick={() =>
                  onCheckout(
                    appliedCoupon
                      ? { couponId: appliedCoupon.id, discount: appliedCoupon.discount_amount }
                      : undefined
                  )
                }
                loading={loading}
                disabled={
                  state.orderType === "delivery" && !deliveryAddress.trim()
                }
              >
                Checkout - ${(total / 100).toFixed(2)}
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
