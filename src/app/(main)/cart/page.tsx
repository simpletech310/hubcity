"use client";

import Link from "next/link";
import Image from "next/image";
import { CartProvider, useCart, bagSubtotal, bagItemCount } from "@/lib/cart";

/**
 * /cart — multi-business cart aggregator. Surfaces every "bag" the
 * shopper has open across the marketplace (food, retail, services).
 *
 * Each bag links back to its own `/business/[slug]/order` page where
 * the existing OrderView + CartSheet handle pickup/delivery selection,
 * tax, tips, and Stripe checkout — those live on the business page
 * because pickup options + delivery zones depend on the merchant.
 */
export default function CartPage() {
  return (
    <CartProvider>
      <CartInner />
    </CartProvider>
  );
}

function CartInner() {
  const { bags, totalItemCount, totalSubtotal, dispatch } = useCart();

  return (
    <div className="px-5 pt-6 pb-24 mx-auto max-w-2xl">
      <header
        className="mb-5 pb-4"
        style={{ borderBottom: "3px solid var(--rule-strong-c)" }}
      >
        <p className="c-kicker" style={{ color: "var(--ink-mute)" }}>
          § YOUR CART
        </p>
        <h1
          className="c-hero mt-1"
          style={{ fontSize: 36, color: "var(--ink-strong)" }}
        >
          {totalItemCount === 0
            ? "Empty bag."
            : totalItemCount === 1
              ? "1 item."
              : `${totalItemCount} items.`}
        </h1>
        {bags.length > 1 && (
          <p
            className="c-serif-it mt-1"
            style={{ fontSize: 13, color: "var(--ink-mute)" }}
          >
            {bags.length} shops · each bag checks out separately so every
            merchant only sees their own order.
          </p>
        )}
      </header>

      {bags.length === 0 ? (
        <div
          className="p-6 text-center"
          style={{
            background: "var(--paper-warm)",
            border: "2px solid var(--rule-strong-c)",
          }}
        >
          <p className="c-card-t" style={{ color: "var(--ink-strong)" }}>
            Your cart is empty.
          </p>
          <p
            className="c-serif-it mt-1"
            style={{ fontSize: 13, color: "var(--ink-mute)" }}
          >
            Add items from any local business or food truck to get started.
          </p>
          <Link
            href="/eat"
            className="c-kicker inline-block mt-4 px-4 py-2"
            style={{
              background: "var(--ink-strong)",
              color: "var(--gold-c)",
              border: "2px solid var(--rule-strong-c)",
            }}
          >
            BROWSE FOOD →
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {bags.map((bag) => {
              const subtotal = bagSubtotal(bag);
              const count = bagItemCount(bag);
              const shopHref = bag.businessSlug
                ? `/business/${bag.businessSlug}/order`
                : `/business/${bag.businessId}/order`;
              return (
                <section
                  key={bag.businessId}
                  className="p-4"
                  style={{
                    background: "var(--paper)",
                    border: "2px solid var(--rule-strong-c)",
                  }}
                >
                  {/* Bag header */}
                  <Link
                    href={shopHref}
                    className="flex items-center gap-3 press"
                  >
                    <div
                      className="w-12 h-12 shrink-0 overflow-hidden"
                      style={{
                        border: "2px solid var(--rule-strong-c)",
                        background: "var(--ink-strong)",
                      }}
                    >
                      {bag.businessLogoUrl ? (
                        <Image
                          src={bag.businessLogoUrl}
                          alt={bag.businessName}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center c-hero"
                          style={{
                            color: "var(--gold-c)",
                            fontSize: 18,
                            lineHeight: 1,
                          }}
                        >
                          {bag.businessName.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="c-card-t line-clamp-1"
                        style={{ fontSize: 16, color: "var(--ink-strong)" }}
                      >
                        {bag.businessName}
                      </p>
                      <p
                        className="c-meta"
                        style={{ color: "var(--ink-mute)" }}
                      >
                        {(bag.businessCategory || "SHOP").toUpperCase()} ·{" "}
                        {count} {count === 1 ? "item" : "items"}
                      </p>
                    </div>
                  </Link>

                  {/* Items */}
                  <div className="mt-3 space-y-1.5">
                    {bag.items.map((it) => (
                      <div
                        key={`${it.menu_item_id}-${it.variant_id ?? "v"}`}
                        className="flex items-center gap-2 text-sm"
                        style={{ color: "var(--ink-strong)" }}
                      >
                        <span
                          className="c-kicker"
                          style={{
                            background: "var(--gold-c)",
                            color: "var(--ink-strong)",
                            padding: "1px 6px",
                            fontSize: 10,
                          }}
                        >
                          {it.quantity}×
                        </span>
                        <span className="flex-1 truncate">{it.name}</span>
                        <span style={{ color: "var(--ink-mute)" }}>
                          ${((it.price * it.quantity) / 100).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Bag footer */}
                  <div
                    className="mt-3 pt-3 flex items-center justify-between gap-3"
                    style={{ borderTop: "1px solid var(--rule-c)" }}
                  >
                    <div>
                      <p
                        className="c-kicker"
                        style={{ color: "var(--ink-mute)", fontSize: 11 }}
                      >
                        SUBTOTAL
                      </p>
                      <p
                        className="c-card-t"
                        style={{ fontSize: 18, color: "var(--ink-strong)" }}
                      >
                        ${(subtotal / 100).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          dispatch({
                            type: "CLEAR_BAG",
                            payload: { businessId: bag.businessId },
                          })
                        }
                        className="text-xs underline"
                        style={{ color: "var(--ink-mute)" }}
                      >
                        Clear
                      </button>
                      <Link
                        href={shopHref}
                        className="press px-4 py-2"
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          letterSpacing: "0.12em",
                          textTransform: "uppercase",
                          background: "var(--ink-strong)",
                          color: "var(--gold-c)",
                          border: "2px solid var(--rule-strong-c)",
                        }}
                      >
                        CHECK OUT →
                      </Link>
                    </div>
                  </div>
                </section>
              );
            })}
          </div>

          {/* Total */}
          <div
            className="mt-5 p-4 flex items-center justify-between"
            style={{
              background: "var(--paper-warm)",
              border: "2px solid var(--rule-strong-c)",
            }}
          >
            <div>
              <p
                className="c-kicker"
                style={{ color: "var(--ink-mute)", fontSize: 11 }}
              >
                CART TOTAL
              </p>
              <p
                className="c-hero"
                style={{ fontSize: 28, color: "var(--ink-strong)" }}
              >
                ${(totalSubtotal / 100).toFixed(2)}
              </p>
            </div>
            <p
              className="c-serif-it text-right"
              style={{ fontSize: 11, color: "var(--ink-mute)", maxWidth: 180 }}
            >
              Tax + tips + delivery resolve on each shop&rsquo;s checkout
              page.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
