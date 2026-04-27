"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "knect_cart_v2";

interface CartItem {
  quantity: number;
}

interface CartBag {
  items: CartItem[];
}

interface CartState {
  bags: CartBag[];
}

/**
 * Top-nav cart icon. Reads the cart bags out of localStorage directly
 * so it doesn't need the React `CartProvider` mounted globally — the
 * provider only wraps `/business/[id]/order` + `/cart`. Refreshes on
 * the `storage` event (cross-tab) and on a custom `cart-changed` event
 * the cart reducer dispatches when the same tab mutates state.
 */
export default function CartIconButton({
  paper = false,
}: {
  paper?: boolean;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    function read() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
          setCount(0);
          return;
        }
        const state = JSON.parse(raw) as CartState;
        let total = 0;
        for (const bag of state.bags ?? []) {
          for (const item of bag.items ?? []) {
            total += item.quantity || 0;
          }
        }
        setCount(total);
      } catch {
        setCount(0);
      }
    }
    read();
    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) read();
    }
    function onLocal() {
      read();
    }
    window.addEventListener("storage", onStorage);
    window.addEventListener("cart-changed", onLocal);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("cart-changed", onLocal);
    };
  }, []);

  return (
    <Link
      href="/cart"
      aria-label="Cart"
      className="press"
      style={{
        position: "relative",
        width: 34,
        height: 34,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        border: "2px solid var(--gold-c)",
        background: "transparent",
        color: paper ? "var(--ink-strong)" : "var(--paper)",
      }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 4h2l1.6 9.5a1 1 0 001 .8h7.6a1 1 0 001-.8L17.5 7H6" />
        <circle cx="8" cy="17" r="1" />
        <circle cx="15" cy="17" r="1" />
      </svg>
      {count > 0 && (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            top: -4,
            right: -4,
            minWidth: 16,
            height: 16,
            padding: "0 4px",
            background: "var(--gold-c)",
            color: "var(--ink-strong)",
            border: "2px solid var(--rule-strong-c)",
            fontSize: 9,
            fontWeight: 800,
            lineHeight: 1,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
