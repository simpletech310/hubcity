"use client";

import Image from "next/image";
import { useCart } from "@/lib/cart";
import type { MenuItem } from "@/types/database";

/**
 * Lightweight business descriptor every menu card carries so adds can
 * be routed into the right per-business bag in the cart.
 */
export interface BusinessRef {
  id: string;
  name: string;
  slug: string | null;
  logoUrl: string | null;
  category: string | null;
}

interface MenuItemCardProps {
  item: MenuItem;
  business: BusinessRef;
  isRetail?: boolean;
  onTap?: (item: MenuItem) => void;
}

export default function MenuItemCard({ item, business, isRetail, onTap }: MenuItemCardProps) {
  const { dispatch } = useCart();

  function handleAdd(e: React.MouseEvent) {
    e.stopPropagation();
    dispatch({
      type: "ADD_ITEM",
      payload: {
        business,
        item: {
          menu_item_id: item.id,
          name: item.name,
          price: item.price,
          quantity: 1,
        },
      },
    });
  }

  const hasVideo = !!item.mux_playback_id || !!item.video_url;
  const hasGallery = item.gallery_urls && item.gallery_urls.length > 0;
  const outOfStock = item.stock_count !== null && item.stock_count !== undefined && item.stock_count <= 0;

  // Retail grid card layout
  if (isRetail) {
    return (
      <div
        onClick={() => onTap?.(item)}
        className="overflow-hidden press cursor-pointer transition-colors"
        style={{
          background: "var(--paper)",
          border: "2px solid var(--rule-strong-c)",
          color: "var(--ink-strong)",
        }}
      >
        {/* Product Image */}
        <div
          className="relative aspect-square"
          style={{
            background: "var(--paper-soft)",
            borderBottom: "2px solid var(--rule-strong-c)",
          }}
        >
          {item.image_url ? (
            <Image
              src={item.image_url}
              alt={item.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="c-meta" style={{ opacity: 0.4 }}>
                {item.is_digital ? "DIGITAL" : "NO IMAGE"}
              </span>
            </div>
          )}

          {/* Video play overlay */}
          {hasVideo && (
            <div
              className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center"
              style={{
                background: "var(--ink-strong)",
                border: "2px solid var(--rule-strong-c)",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--gold-c)">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          )}

          {/* Gallery indicator */}
          {hasGallery && (
            <div
              className="absolute top-2 left-2 px-1.5 py-0.5 flex items-center gap-1 c-kicker"
              style={{
                background: "var(--ink-strong)",
                color: "var(--paper)",
                fontSize: "9px",
              }}
            >
              {(item.gallery_urls?.length ?? 0) + (item.image_url ? 1 : 0)}
            </div>
          )}

          {/* Out of stock overlay */}
          {outOfStock && (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: "rgba(26,21,18,0.6)" }}
            >
              <span
                className="c-badge c-badge-live"
                style={{ fontSize: "11px" }}
              >
                Sold Out
              </span>
            </div>
          )}

          {/* Digital badge */}
          {item.is_digital && (
            <div
              className="absolute bottom-2 left-2 c-badge c-badge-ink"
              style={{ fontSize: "9px" }}
            >
              Digital
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <h3 className="c-card-t truncate" style={{ fontSize: "13px" }}>{item.name}</h3>
          {item.description && (
            <p className="c-body-sm mt-0.5 truncate" style={{ fontSize: "11px", opacity: 0.75 }}>
              {item.description}
            </p>
          )}
          <div className="flex items-center justify-between mt-2">
            <span className="c-hero" style={{ fontSize: "18px" }}>
              ${(item.price / 100).toFixed(2)}
            </span>
            <button
              onClick={handleAdd}
              disabled={outOfStock}
              className="w-7 h-7 flex items-center justify-center press"
              style={{
                background: "var(--gold-c)",
                border: "2px solid var(--rule-strong-c)",
                opacity: outOfStock ? 0.3 : 1,
                cursor: outOfStock ? "not-allowed" : "pointer",
              }}
            >
              <svg width="14" height="14" fill="none" stroke="var(--ink-strong)" strokeWidth="2.5" strokeLinecap="round">
                <path d="M7 2v10M2 7h10" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Standard list layout (restaurant)
  return (
    <div
      className="p-3"
      style={{
        background: "var(--paper)",
        border: "2px solid var(--rule-strong-c)",
        color: "var(--ink-strong)",
      }}
    >
      <div
        className={`flex items-start gap-3 ${onTap ? "cursor-pointer" : ""}`}
        onClick={() => onTap?.(item)}
      >
        {/* Product image thumbnail — always render a 64×64 tile so the
            row has a consistent grid, even when no photo is uploaded. A
            knife-and-fork icon stands in as the "no image" placeholder
            (Culture treatment: ink on paper-soft, 2px ink frame). */}
        <div
          className="relative w-16 h-16 overflow-hidden shrink-0"
          style={{
            background: "var(--paper-soft)",
            border: "2px solid var(--rule-strong-c)",
          }}
        >
          {item.image_url ? (
            <Image
              src={item.image_url}
              alt={item.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--ink-strong)"
                strokeOpacity="0.35"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 2v7a2 2 0 002 2 2 2 0 002-2V2M5 2v20M16 2v13h4.5M16 15v7" />
              </svg>
            </div>
          )}
          {hasVideo && item.image_url && (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: "rgba(26,21,18,0.3)" }}
            >
              <div
                className="w-6 h-6 flex items-center justify-center"
                style={{
                  background: "var(--gold-c)",
                  border: "2px solid var(--rule-strong-c)",
                }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="var(--ink-strong)">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="c-card-t truncate" style={{ fontSize: "13px" }}>{item.name}</h3>
          {item.description && (
            <p className="c-body-sm mt-0.5 line-clamp-2" style={{ fontSize: "11px", opacity: 0.75 }}>
              {item.description}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <p className="c-hero" style={{ fontSize: "16px" }}>
              ${(item.price / 100).toFixed(2)}
            </p>
            {item.is_digital && (
              <span className="c-badge c-badge-ink" style={{ fontSize: "9px" }}>
                Digital
              </span>
            )}
            {outOfStock && (
              <span className="c-badge c-badge-live" style={{ fontSize: "9px" }}>
                Sold Out
              </span>
            )}
          </div>
        </div>

        <button
          onClick={handleAdd}
          disabled={outOfStock}
          className="c-btn c-btn-accent c-btn-sm shrink-0 mt-1"
          style={{ opacity: outOfStock ? 0.3 : 1 }}
        >
          Add
        </button>
      </div>

      {/* Horizontal image scroller for gallery */}
      {hasGallery && (
        <div className="mt-2.5 -mx-1 flex gap-2 overflow-x-auto scrollbar-hide px-1 pb-1">
          {item.gallery_urls.map((url, i) => (
            <div
              key={i}
              className="relative w-20 h-20 overflow-hidden shrink-0"
              style={{
                background: "var(--paper-soft)",
                border: "2px solid var(--rule-strong-c)",
              }}
            >
              <Image
                src={url}
                alt={`${item.name} ${i + 1}`}
                fill
                className="object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
