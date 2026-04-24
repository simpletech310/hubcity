"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useCart } from "@/lib/cart";
import type { MenuItem, ProductVariant } from "@/types/database";
import type { BusinessRef } from "./MenuItemCard";

interface ProductDetailModalProps {
  item: MenuItem | null;
  /** The business this detail modal is scoped to — every add carries
   *  it so multi-business carts stay separated. */
  business: BusinessRef;
  open: boolean;
  onClose: () => void;
}

export default function ProductDetailModal({
  item,
  business,
  open,
  onClose,
}: ProductDetailModalProps) {
  const { dispatch } = useCart();
  const [activeImage, setActiveImage] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Variant state
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [variantsLoading, setVariantsLoading] = useState(false);

  // Build image list: main image + gallery
  const images: string[] = [];
  if (item?.image_url) images.push(item.image_url);
  if (item?.gallery_urls?.length) {
    for (const url of item.gallery_urls) {
      if (!images.includes(url)) images.push(url);
    }
  }

  // Reset state when item changes
  useEffect(() => {
    setActiveImage(0);
    setSelectedVariant(null);
    setVariants([]);
    if (scrollRef.current) scrollRef.current.scrollLeft = 0;

    if (!item?.id) return;

    // Fetch variants
    setVariantsLoading(true);
    fetch(`/api/products/${item.id}/variants`)
      .then((res) => res.json())
      .then((data) => {
        const v = (data.variants ?? []).filter((v: ProductVariant) => v.is_available);
        setVariants(v);
      })
      .catch(() => setVariants([]))
      .finally(() => setVariantsLoading(false));
  }, [item?.id]);

  // Handle scroll snap to track active image
  function handleScroll() {
    if (!scrollRef.current) return;
    const scrollLeft = scrollRef.current.scrollLeft;
    const width = scrollRef.current.clientWidth;
    const idx = Math.round(scrollLeft / width);
    setActiveImage(idx);
  }

  const displayPrice = selectedVariant?.price_override ?? item?.price ?? 0;
  const hasVariants = variants.length > 0;
  const needsVariantSelection = hasVariants && !selectedVariant;

  // Check stock
  const stockCount = selectedVariant
    ? selectedVariant.stock_count
    : item?.stock_count;
  const isOutOfStock = stockCount !== null && stockCount !== undefined && stockCount <= 0;

  function handleAdd() {
    if (!item || needsVariantSelection || isOutOfStock) return;
    dispatch({
      type: "ADD_ITEM",
      payload: {
        business,
        item: {
          menu_item_id: item.id,
          variant_id: selectedVariant?.id,
          variant_name: selectedVariant?.name,
          name: item.name,
          price: displayPrice,
          quantity: 1,
        },
      },
    });
    onClose();
  }

  if (!open || !item) return null;

  const hasVideo = !!item.mux_playback_id || !!item.video_url;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: "rgba(26,21,18,0.72)" }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-[430px] max-h-[90vh] overflow-hidden animate-slide-up flex flex-col"
        style={{
          background: "var(--paper)",
          color: "var(--ink-strong)",
          borderTop: "3px solid var(--rule-strong-c)",
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center press"
          style={{
            background: "var(--ink-strong)",
            border: "2px solid var(--rule-strong-c)",
          }}
        >
          <svg width="16" height="16" fill="none" stroke="var(--paper)" strokeWidth="2" strokeLinecap="round">
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>

        {/* Image Gallery */}
        {images.length > 0 ? (
          <div className="relative" style={{ borderBottom: "2px solid var(--rule-strong-c)" }}>
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
              style={{ scrollBehavior: "smooth" }}
            >
              {images.map((url, i) => (
                <div
                  key={i}
                  className="w-full shrink-0 snap-center aspect-square relative"
                  style={{ background: "var(--paper-soft)" }}
                >
                  <Image
                    src={url}
                    alt={`${item.name} ${i + 1}`}
                    fill
                    className="object-cover"
                  />
                  {i === 0 && hasVideo && (
                    <a
                      href={
                        item.mux_playback_id
                          ? `https://stream.mux.com/${item.mux_playback_id}.m3u8`
                          : item.video_url ?? "#"
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 flex items-center justify-center"
                      style={{ background: "rgba(26,21,18,0.3)" }}
                    >
                      <div
                        className="w-14 h-14 flex items-center justify-center"
                        style={{
                          background: "var(--gold-c)",
                          border: "3px solid var(--rule-strong-c)",
                        }}
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--ink-strong)">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </a>
                  )}
                </div>
              ))}
            </div>

            {images.length > 1 && (
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                {images.map((_, i) => (
                  <div
                    key={i}
                    className="w-2 h-2 transition-colors"
                    style={{
                      background: i === activeImage ? "var(--gold-c)" : "var(--paper)",
                      border: "1.5px solid var(--rule-strong-c)",
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          // Editorial "no photo yet" slab — paper-soft background with a
          // printed plate illustration, gold kicker rule, and a small note
          // so the hero area doesn't feel broken when the business
          // hasn't uploaded product photography yet.
          <div
            className="aspect-[4/3] flex flex-col items-center justify-center gap-3 relative"
            style={{
              background: "var(--paper-soft)",
              borderBottom: "2px solid var(--rule-strong-c)",
            }}
          >
            <div
              className="absolute top-3 left-3"
              style={{ width: 40, height: 2, background: "var(--gold-c)" }}
            />
            <svg
              width="56"
              height="56"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--ink-strong)"
              strokeOpacity="0.45"
              strokeWidth="1.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="9" />
              <circle cx="12" cy="12" r="5" />
              <path d="M12 3v2M12 19v2M3 12h2M19 12h2" />
            </svg>
            <div className="text-center">
              <p
                className="c-kicker"
                style={{ fontSize: 10, color: "var(--ink-strong)", opacity: 0.55, letterSpacing: "0.16em" }}
              >
                PHOTO COMING SOON
              </p>
              <p
                className="c-serif-it mt-1"
                style={{ fontSize: 12, color: "var(--ink-strong)", opacity: 0.6 }}
              >
                Tap through for the full description below.
              </p>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Name + Price */}
          <div>
            <h2 className="c-hero" style={{ fontSize: "24px" }}>{item.name}</h2>
            <p className="c-hero mt-1" style={{ color: "var(--gold-c)", fontSize: "20px" }}>
              ${(displayPrice / 100).toFixed(2)}
            </p>
          </div>

          {/* SKU + Stock */}
          {(item.sku || stockCount !== null) && (
            <div className="flex items-center gap-3 flex-wrap">
              {item.sku && (
                <span className="c-meta">SKU: {selectedVariant?.sku || item.sku}</span>
              )}
              {stockCount !== null && stockCount !== undefined && (
                <span
                  className="c-badge"
                  style={{
                    background: stockCount > 0 ? "var(--green-c, #2d6a4f)" : "var(--red-c, #c0392b)",
                    color: "#fff",
                  }}
                >
                  {stockCount > 0 ? `${stockCount} in stock` : "Out of stock"}
                </span>
              )}
              {item.is_digital && (
                <span className="c-badge c-badge-ink" style={{ fontSize: "10px" }}>
                  Digital
                </span>
              )}
            </div>
          )}

          {/* Description */}
          {item.description && (
            <p className="c-body">{item.description}</p>
          )}

          {/* Video section */}
          {hasVideo && (
            <div>
              <h3 className="c-kicker mb-2">Product Video</h3>
              {item.mux_playback_id ? (
                <div
                  className="relative aspect-video overflow-hidden"
                  style={{
                    background: "var(--paper-soft)",
                    border: "2px solid var(--rule-strong-c)",
                  }}
                >
                  <Image
                    src={`https://image.mux.com/${item.mux_playback_id}/thumbnail.jpg`}
                    alt={`${item.name} video`}
                    fill
                    className="object-cover"
                  />
                  <a
                    href={`https://stream.mux.com/${item.mux_playback_id}.m3u8`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ background: "rgba(26,21,18,0.2)" }}
                  >
                    <div
                      className="w-12 h-12 flex items-center justify-center"
                      style={{
                        background: "var(--gold-c)",
                        border: "2px solid var(--rule-strong-c)",
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--ink-strong)">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </a>
                </div>
              ) : item.video_url ? (
                <a
                  href={item.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 press"
                  style={{
                    background: "var(--paper)",
                    border: "2px solid var(--rule-strong-c)",
                  }}
                >
                  <div
                    className="w-10 h-10 flex items-center justify-center"
                    style={{
                      background: "var(--gold-c)",
                      border: "2px solid var(--rule-strong-c)",
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--ink-strong)" strokeWidth="2">
                      <path d="M8 5v14l11-7z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <p className="c-card-t" style={{ fontSize: "13px" }}>Watch Video</p>
                    <p className="c-meta" style={{ fontSize: "10px" }}>Opens in new tab</p>
                  </div>
                </a>
              ) : null}
            </div>
          )}

          {/* Variant Picker */}
          {variantsLoading ? (
            <div className="py-2">
              <div
                className="w-6 h-6 rounded-full animate-spin mx-auto"
                style={{
                  border: "2px solid var(--ink-strong)",
                  borderTopColor: "transparent",
                }}
              />
            </div>
          ) : hasVariants ? (
            <div>
              <h3 className="c-kicker mb-2">Options</h3>
              <div className="flex flex-wrap gap-2">
                {variants.map((v) => {
                  const isSelected = selectedVariant?.id === v.id;
                  const vOutOfStock = v.stock_count !== null && v.stock_count <= 0;
                  return (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(isSelected ? null : v)}
                      disabled={vOutOfStock}
                      className="px-4 py-2.5 c-card-t press transition-colors"
                      style={{
                        fontSize: "13px",
                        background: isSelected
                          ? "var(--gold-c)"
                          : "var(--paper)",
                        border: "2px solid var(--rule-strong-c)",
                        color: "var(--ink-strong)",
                        opacity: vOutOfStock ? 0.4 : 1,
                        textDecoration: vOutOfStock ? "line-through" : "none",
                        cursor: vOutOfStock ? "not-allowed" : "pointer",
                      }}
                    >
                      {v.name}
                      {v.price_override !== null && v.price_override !== item.price && (
                        <span className="ml-1.5 c-meta" style={{ color: "inherit" }}>
                          ${(v.price_override / 100).toFixed(2)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {needsVariantSelection && (
                <p className="c-meta mt-1.5" style={{ color: "var(--red-c, #c0392b)" }}>
                  Please select an option
                </p>
              )}
            </div>
          ) : null}
        </div>

        {/* Add to Cart fixed bottom */}
        <div
          className="p-5 pt-3"
          style={{
            borderTop: "2px solid var(--rule-strong-c)",
            background: "var(--paper)",
          }}
        >
          <button
            onClick={handleAdd}
            disabled={isOutOfStock || needsVariantSelection}
            className="c-btn c-btn-primary w-full"
            style={{
              opacity: isOutOfStock || needsVariantSelection ? 0.4 : 1,
              cursor: isOutOfStock || needsVariantSelection ? "not-allowed" : "pointer",
            }}
          >
            {isOutOfStock
              ? "Out of Stock"
              : needsVariantSelection
              ? "Select an Option"
              : "Add to Cart"}
          </button>
        </div>
      </div>
    </div>
  );
}
