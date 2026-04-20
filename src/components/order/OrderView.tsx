"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import MenuItemCard from "./MenuItemCard";
import CartSheet from "./CartSheet";
import PaymentSheet from "./PaymentSheet";
import ProductDetailModal from "./ProductDetailModal";
import type { Business, MenuItem, VendorVehicle } from "@/types/database";

interface OrderViewProps {
  business: Business;
  menuItems: MenuItem[];
  vehicles?: VendorVehicle[];
  /** When the user clicked a pin on /food, this is the vehicle id to pre-select as pickup. */
  preselectedVehicleId?: string | null;
}

export default function OrderView({
  business,
  menuItems,
  vehicles = [],
  preselectedVehicleId = null,
}: OrderViewProps) {
  const router = useRouter();
  const { state, dispatch, subtotal, itemCount } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Payment state
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string>("");
  const [paymentTotal, setPaymentTotal] = useState(0);

  // Product detail modal state
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const isRetail = business.category === "retail";

  // Set business in cart context on mount
  useEffect(() => {
    dispatch({
      type: "SET_BUSINESS",
      payload: { id: business.id, name: business.name },
    });
  }, [business.id, business.name, dispatch]);

  // Pre-seed pickup location if navigated here from a food-truck pin
  useEffect(() => {
    if (!preselectedVehicleId) return;
    const v = vehicles.find((x) => x.id === preselectedVehicleId);
    if (!v) return;
    dispatch({ type: "SET_ORDER_TYPE", payload: "pickup" });
    dispatch({
      type: "SET_PICKUP_LOCATION",
      payload: {
        kind: "vehicle",
        vehicleId: v.id,
        name: `${v.name}${v.current_location_name ? ` — ${v.current_location_name}` : ""}`,
      },
    });
  }, [preselectedVehicleId, vehicles, dispatch]);

  // Group menu items by category
  const grouped = useMemo(() => {
    const map = new Map<string, MenuItem[]>();
    for (const item of menuItems) {
      const cat = item.category ?? (isRetail ? "Products" : "Menu");
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(item);
    }
    return map;
  }, [menuItems, isRetail]);

  function handleProductTap(item: MenuItem) {
    setSelectedItem(item);
    setModalOpen(true);
  }

  async function handleCheckout(opts?: { couponId?: string; discount?: number }) {
    setCheckoutLoading(true);

    try {
      // Create payment intent and pending order
      const res = await fetch("/api/orders/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_id: business.id,
          type: state.orderType,
          items: state.items.map((item) => ({
            menu_item_id: item.menu_item_id,
            variant_id: item.variant_id ?? null,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            special_instructions: item.special_instructions ?? null,
          })),
          delivery_address:
            state.orderType === "delivery" ? "" : null,
          pickup_location_name:
            state.orderType === "pickup" && state.pickupLocation
              ? state.pickupLocation.name
              : null,
          pickup_vehicle_id:
            state.orderType === "pickup" &&
            state.pickupLocation?.kind === "vehicle"
              ? state.pickupLocation.vehicleId ?? null
              : null,
          tip: state.tip,
          coupon_id: opts?.couponId ?? null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to start checkout");
      }

      const data = await res.json();
      setClientSecret(data.client_secret);
      setOrderId(data.order_id);
      setOrderNumber(data.order_number);
      setPaymentTotal(data.total);

      // Close cart, open payment
      setCartOpen(false);
      setPaymentOpen(true);
    } catch (err) {
      console.error("Checkout error:", err);
      alert("Something went wrong starting checkout. Please try again.");
    } finally {
      setCheckoutLoading(false);
    }
  }

  function handlePaymentSuccess(confirmedOrderId: string) {
    dispatch({ type: "CLEAR" });
    setPaymentOpen(false);
    router.push(`/orders/${confirmedOrderId}`);
  }

  function handlePaymentClose() {
    setPaymentOpen(false);
    // Order stays pending — they can retry from cart
  }

  return (
    <div className="animate-fade-in pb-32">
      {/* ── Sticky Cart Header ── */}
      {itemCount > 0 && !paymentOpen && (
        <div className="sticky top-0 z-30">
          <div className="bg-deep/95 backdrop-blur-md border-b border-gold/15 shadow-lg shadow-black/20">
            <div className="px-5 py-3 flex items-center gap-3">
              {/* Cart icon + count */}
              <button
                onClick={() => setCartOpen(true)}
                className="relative press"
                aria-label="Open cart"
              >
                <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center">
                  <svg width="20" height="20" fill="none" stroke="#F2A900" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
                    <circle cx="9" cy="21" r="1" />
                    <circle cx="20" cy="21" r="1" />
                  </svg>
                </div>
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gold text-midnight text-[10px] font-bold flex items-center justify-center shadow-lg">
                  {itemCount}
                </span>
              </button>

              {/* Business name + subtotal */}
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-white/40 font-medium truncate">{business.name}</p>
                <p className="text-sm font-bold text-gold">${(subtotal / 100).toFixed(2)}</p>
              </div>

              {/* View Cart button */}
              <button
                onClick={() => setCartOpen(true)}
                className="bg-gradient-to-r from-gold to-gold-light text-midnight font-bold text-[13px] px-5 py-2.5 rounded-xl press flex items-center gap-2 shadow-lg shadow-gold/10"
              >
                <span>View Cart</span>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M5 2l5 5-5 5" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

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
        <p className="text-sm text-txt-secondary mt-0.5">
          {isRetail ? "Shop Products" : "Order Menu"}
        </p>
      </div>

      {/* Menu Items by Category */}
      <div className="px-5 space-y-6">
        {menuItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-txt-secondary text-sm">
              {isRetail
                ? "No products available right now."
                : "No menu items available right now."}
            </p>
          </div>
        ) : (
          Array.from(grouped.entries()).map(([category, items]) => (
            <div key={category}>
              <h2 className="font-heading font-bold text-base mb-3 capitalize">
                {category}
              </h2>
              {isRetail ? (
                // Grid layout for retail products
                <div className="grid grid-cols-2 gap-3">
                  {items.map((item) => (
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      isRetail
                      onTap={handleProductTap}
                    />
                  ))}
                </div>
              ) : (
                // List layout for restaurant menu
                <div className="space-y-2">
                  {items.map((item) => (
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      onTap={
                        item.image_url || item.gallery_urls?.length
                          ? handleProductTap
                          : undefined
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* ── Bottom Cart Summary Bar (secondary CTA) ── */}
      {itemCount > 0 && !paymentOpen && (
        <div className="fixed bottom-0 inset-x-0 max-w-[430px] mx-auto z-30">
          <div className="bg-deep/95 backdrop-blur-md border-t border-gold/15 px-5 py-4">
            <button
              onClick={() => setCartOpen(true)}
              className="w-full bg-gradient-to-r from-gold to-gold-light text-midnight font-semibold py-3 rounded-xl press flex items-center justify-between px-5"
            >
              <span className="flex items-center gap-2">
                <span className="bg-midnight/20 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                  {itemCount}
                </span>
                Checkout
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
        business={business}
        vehicles={vehicles}
      />

      {/* Payment Sheet */}
      {clientSecret && orderId && (
        <PaymentSheet
          open={paymentOpen}
          onClose={handlePaymentClose}
          clientSecret={clientSecret}
          orderId={orderId}
          orderNumber={orderNumber}
          total={paymentTotal}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {/* Product Detail Modal */}
      <ProductDetailModal
        item={selectedItem}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
