"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import MenuItemCard, { type BusinessRef } from "./MenuItemCard";
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
  const { state, dispatch, subtotal, itemCount, totalItemCount, bags } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // How many other businesses this shopper has open bags at — used to
  // flag the multi-business cart header so people know their food and
  // clothing orders are staying separated.
  const otherBagCount = bags.filter((b) => b.businessId !== business.id).length;

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

  // Lightweight descriptor shared with MenuItemCard, ProductDetailModal,
  // and the cart so every add is stamped with the right business.
  const businessRef = useMemo<BusinessRef>(
    () => ({
      id: business.id,
      name: business.name,
      slug: business.slug ?? null,
      logoUrl: business.image_urls?.[0] ?? null,
      category: business.category ?? null,
    }),
    [business.id, business.name, business.slug, business.image_urls, business.category]
  );

  // Mark this business as the active bag-in-progress. Items added from
  // the menu below land here. Other bags (food at a different vendor,
  // clothes, etc.) stay untouched.
  useEffect(() => {
    dispatch({ type: "SET_ACTIVE_BUSINESS", payload: businessRef });
  }, [businessRef, dispatch]);

  // Pre-seed pickup location if navigated here from a food-truck pin
  useEffect(() => {
    if (!preselectedVehicleId) return;
    const v = vehicles.find((x) => x.id === preselectedVehicleId);
    if (!v) return;
    dispatch({
      type: "SET_ORDER_TYPE",
      payload: { businessId: business.id, orderType: "pickup" },
    });
    dispatch({
      type: "SET_PICKUP_LOCATION",
      payload: {
        businessId: business.id,
        location: {
          kind: "vehicle",
          vehicleId: v.id,
          name: `${v.name}${v.current_location_name ? ` — ${v.current_location_name}` : ""}`,
        },
      },
    });
  }, [preselectedVehicleId, vehicles, business.id, dispatch]);

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
    // Only the ACTIVE business's bag checks out — other bags (food at
    // another vendor, clothing, etc.) are left in the cart for later.
    const activeBag = state.bags.find((b) => b.businessId === business.id);
    if (!activeBag || activeBag.items.length === 0) return;

    setCheckoutLoading(true);

    try {
      // Create payment intent and pending order
      const res = await fetch("/api/orders/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_id: business.id,
          type: activeBag.orderType,
          items: activeBag.items.map((item) => ({
            menu_item_id: item.menu_item_id,
            variant_id: item.variant_id ?? null,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            special_instructions: item.special_instructions ?? null,
          })),
          delivery_address:
            activeBag.orderType === "delivery" ? "" : null,
          pickup_location_name:
            activeBag.orderType === "pickup" && activeBag.pickupLocation
              ? activeBag.pickupLocation.name
              : null,
          pickup_vehicle_id:
            activeBag.orderType === "pickup" &&
            activeBag.pickupLocation?.kind === "vehicle"
              ? activeBag.pickupLocation.vehicleId ?? null
              : null,
          tip: activeBag.tip,
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
    // Only clear the bag for the business we just checked out — other
    // bags (food at a different vendor, clothing, etc.) remain so the
    // user can finish those whenever they're ready.
    dispatch({ type: "CLEAR_BAG", payload: { businessId: business.id } });
    setPaymentOpen(false);
    router.push(`/orders/${confirmedOrderId}`);
  }

  function handlePaymentClose() {
    setPaymentOpen(false);
    // Order stays pending — they can retry from cart
  }

  return (
    <div
      className="animate-fade-in pb-32 min-h-screen"
      style={{ background: "var(--paper)", color: "var(--ink-strong)" }}
    >
      {/* ── Sticky Cart Header ── */}
      {(itemCount > 0 || totalItemCount > 0) && !paymentOpen && (
        <div className="sticky top-0 z-30">
          <div
            style={{
              background: "var(--paper)",
              borderBottom: "3px solid var(--rule-strong-c)",
            }}
          >
            <div className="px-5 py-3 flex items-center gap-3">
              {/* Cart icon + count */}
              <button
                onClick={() => setCartOpen(true)}
                className="relative press"
                aria-label="Open cart"
              >
                <div
                  className="w-10 h-10 flex items-center justify-center"
                  style={{
                    background: "var(--gold-c)",
                    border: "2px solid var(--rule-strong-c)",
                  }}
                >
                  <svg width="20" height="20" fill="none" stroke="var(--ink-strong)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
                    <circle cx="9" cy="21" r="1" />
                    <circle cx="20" cy="21" r="1" />
                  </svg>
                </div>
                <span
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 c-card-t flex items-center justify-center"
                  style={{
                    fontSize: "10px",
                    background: "var(--ink-strong)",
                    color: "var(--gold-c)",
                    border: "2px solid var(--rule-strong-c)",
                  }}
                >
                  {totalItemCount}
                </span>
              </button>

              {/* Business name + subtotal + multi-bag note */}
              <div className="flex-1 min-w-0">
                <p
                  className="c-kicker truncate"
                  style={{ opacity: 0.7, fontSize: "10px" }}
                >
                  {itemCount > 0 ? business.name : "TAP TO VIEW CART"}
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="c-card-t" style={{ fontSize: "14px" }}>
                    ${(subtotal / 100).toFixed(2)}
                  </p>
                  {otherBagCount > 0 && (
                    <span
                      className="c-kicker"
                      style={{
                        fontSize: 9,
                        color: "var(--ink-strong)",
                        opacity: 0.7,
                        letterSpacing: "0.14em",
                      }}
                    >
                      +{otherBagCount} OTHER BAG{otherBagCount === 1 ? "" : "S"}
                    </span>
                  )}
                </div>
              </div>

              {/* View Cart button */}
              <button
                onClick={() => setCartOpen(true)}
                className="c-btn c-btn-primary c-btn-sm"
              >
                View Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Back Button + Business Name */}
      <div
        className="px-5 pt-4 pb-4 mb-5"
        style={{ borderBottom: "3px solid var(--rule-strong-c)" }}
      >
        <Link
          href={`/business/${business.slug || business.id}`}
          className="c-kicker inline-flex items-center gap-1.5"
          style={{ color: "var(--ink-strong)" }}
        >
          <svg
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M10 12L6 8l4-4" />
          </svg>
          Back
        </Link>
        <h1 className="c-hero mt-3" style={{ fontSize: "32px" }}>
          {business.name}
        </h1>
        <p className="c-kicker mt-1" style={{ opacity: 0.7 }}>
          {isRetail ? "Shop Products" : "Order Menu"}
        </p>
      </div>

      {/* Menu Items by Category */}
      <div className="px-5 space-y-6">
        {menuItems.length === 0 ? (
          <div
            className="text-center py-12"
            style={{
              background: "var(--paper-soft)",
              border: "2px solid var(--rule-strong-c)",
            }}
          >
            <p className="c-meta">
              {isRetail
                ? "No products available right now."
                : "No menu items available right now."}
            </p>
          </div>
        ) : (
          Array.from(grouped.entries()).map(([category, items]) => (
            <div key={category}>
              <h2
                className="c-card-t mb-3 capitalize pb-2"
                style={{
                  fontSize: "18px",
                  borderBottom: "2px solid var(--rule-strong-c)",
                }}
              >
                {category}
              </h2>
              {isRetail ? (
                // Grid layout for retail products
                <div className="grid grid-cols-2 gap-3">
                  {items.map((item) => (
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      business={businessRef}
                      isRetail
                      onTap={handleProductTap}
                    />
                  ))}
                </div>
              ) : (
                // List layout for restaurant menu — every item is tappable
                // so users can read full description, variants, and dietary
                // info even when the business hasn't uploaded a photo yet.
                <div className="space-y-2">
                  {items.map((item) => (
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      business={businessRef}
                      onTap={handleProductTap}
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
          <div
            className="px-5 py-4"
            style={{
              background: "var(--paper)",
              borderTop: "3px solid var(--rule-strong-c)",
            }}
          >
            <button
              onClick={() => setCartOpen(true)}
              className="c-btn c-btn-primary w-full flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <span
                  className="w-6 h-6 flex items-center justify-center c-card-t"
                  style={{
                    fontSize: "11px",
                    background: "var(--gold-c)",
                    color: "var(--ink-strong)",
                  }}
                >
                  {itemCount}
                </span>
                Checkout
              </span>
              <span>${(subtotal / 100).toFixed(2)}</span>
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
        business={businessRef}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
