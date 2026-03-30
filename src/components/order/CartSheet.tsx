"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import { useCart } from "@/lib/cart";

interface CartSheetProps {
  open: boolean;
  onClose: () => void;
  onCheckout: () => void;
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

  const tax = Math.round(subtotal * TAX_RATE);
  const total = subtotal + tax + state.tip;

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
                {state.items.map((item) => (
                  <Card key={item.menu_item_id}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[13px] font-bold">{item.name}</h3>
                        <p className="text-xs text-gold mt-0.5">
                          ${(item.price / 100).toFixed(2)} each
                        </p>
                        {/* Special instructions */}
                        <input
                          type="text"
                          placeholder="Special instructions..."
                          value={item.special_instructions ?? ""}
                          onChange={(e) => {
                            const updatedItems = state.items.map((i) =>
                              i.menu_item_id === item.menu_item_id
                                ? { ...i, special_instructions: e.target.value || undefined }
                                : i
                            );
                            // We use LOAD to set the full state with updated instructions
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

            {/* Price Breakdown */}
            {state.items.length > 0 && (
              <Card>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-txt-secondary">Subtotal</span>
                    <span>${(subtotal / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-txt-secondary">
                      Tax (9.5%)
                    </span>
                    <span>${(tax / 100).toFixed(2)}</span>
                  </div>
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
                onClick={onCheckout}
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
