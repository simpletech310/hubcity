"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { useCart } from "@/lib/cart";
import MenuItemCard from "./MenuItemCard";
import CartSheet from "./CartSheet";
import type { Business, MenuItem } from "@/types/database";

interface OrderViewProps {
  business: Business;
  menuItems: MenuItem[];
}

export default function OrderView({ business, menuItems }: OrderViewProps) {
  const router = useRouter();
  const { state, dispatch, subtotal, itemCount } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Set business in cart context on mount
  useEffect(() => {
    dispatch({
      type: "SET_BUSINESS",
      payload: { id: business.id, name: business.name },
    });
  }, [business.id, business.name, dispatch]);

  // Group menu items by category
  const grouped = useMemo(() => {
    const map = new Map<string, MenuItem[]>();
    for (const item of menuItems) {
      const cat = item.category ?? "Menu";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(item);
    }
    return map;
  }, [menuItems]);

  async function handleCheckout() {
    setCheckoutLoading(true);

    try {
      // MVP: Skip Stripe Elements payment form.
      // In production, you would:
      // 1. POST to /api/stripe/create-payment-intent with cart data
      // 2. Use Stripe Elements to collect card details
      // 3. Confirm the payment intent client-side
      // 4. Then create the order after successful payment

      // For MVP, create order directly with pending status (simulated payment)
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_id: business.id,
          type: state.orderType,
          items: state.items.map((item) => ({
            menu_item_id: item.menu_item_id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            special_instructions: item.special_instructions ?? null,
          })),
          delivery_address:
            state.orderType === "delivery" ? "" : null, // TODO: collect delivery address from user input
          tip: state.tip,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create order");
      }

      const order = await res.json();
      dispatch({ type: "CLEAR" });
      router.push(`/orders/${order.id}`);
    } catch (err) {
      console.error("Checkout error:", err);
      alert("Something went wrong placing your order. Please try again.");
    } finally {
      setCheckoutLoading(false);
    }
  }

  return (
    <div className="animate-fade-in pb-32">
      {/* Back Button + Business Name */}
      <div className="px-5 pt-4 mb-4">
        <Link
          href={`/business/${business.slug || business.id}`}
          className="inline-flex items-center gap-1.5 text-gold text-sm font-semibold press"
        >
          <svg
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M10 12L6 8l4-4" />
          </svg>
          Back
        </Link>
        <h1 className="font-heading text-2xl font-bold mt-3">
          {business.name}
        </h1>
        <p className="text-sm text-txt-secondary mt-0.5">Order Menu</p>
      </div>

      {/* Menu Items by Category */}
      <div className="px-5 space-y-6">
        {menuItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-txt-secondary text-sm">
              No menu items available right now.
            </p>
          </div>
        ) : (
          Array.from(grouped.entries()).map(([category, items]) => (
            <div key={category}>
              <h2 className="font-heading font-bold text-base mb-3 capitalize">
                {category}
              </h2>
              <div className="space-y-2">
                {items.map((item) => (
                  <MenuItemCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cart Summary Bar */}
      {itemCount > 0 && (
        <div className="fixed bottom-0 inset-x-0 max-w-[430px] mx-auto z-30">
          <div className="bg-deep border-t border-border-subtle px-5 py-4">
            <button
              onClick={() => setCartOpen(true)}
              className="w-full bg-gradient-to-r from-gold to-gold-light text-midnight font-semibold py-3 rounded-xl press flex items-center justify-between px-5"
            >
              <span className="flex items-center gap-2">
                <span className="bg-midnight/20 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                  {itemCount}
                </span>
                View Cart
              </span>
              <span className="font-bold">
                ${(subtotal / 100).toFixed(2)}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Cart Bottom Sheet */}
      <CartSheet
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onCheckout={handleCheckout}
        loading={checkoutLoading}
      />
    </div>
  );
}
