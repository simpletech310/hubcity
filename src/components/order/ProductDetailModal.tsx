"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useCart } from "@/lib/cart";
import type { MenuItem, ProductVariant } from "@/types/database";

interface ProductDetailModalProps {
  item: MenuItem | null;
  open: boolean;
  onClose: () => void;
}

export default function ProductDetailModal({
  item,
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
        menu_item_id: item.id,
        variant_id: selectedVariant?.id,
        variant_name: selectedVariant?.name,
        name: item.name,
        price: displayPrice,
        quantity: 1,
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
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-[430px] max-h-[90vh] bg-deep rounded-t-3xl overflow-hidden animate-slide-up flex flex-col">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-midnight/70 backdrop-blur-sm flex items-center justify-center press"
        >
          <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>

        {/* Image Gallery */}
        {images.length > 0 ? (
          <div className="relative">
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
              style={{ scrollBehavior: "smooth" }}
            >
              {images.map((url, i) => (
                <div
                  key={i}
                  className="w-full shrink-0 snap-center aspect-square relative bg-card"
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
                      className="absolute inset-0 flex items-center justify-center bg-black/30"
                    >
                      <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="#111">
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
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
                      i === activeImage ? "bg-white" : "bg-white/40"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="aspect-[4/3] bg-card flex items-center justify-center">
            <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1} className="text-white/20">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Name + Price */}
          <div>
            <h2 className="font-heading text-xl font-bold">{item.name}</h2>
            <p className="text-lg font-heading font-bold text-gold mt-1">
              ${(displayPrice / 100).toFixed(2)}
            </p>
          </div>

          {/* SKU + Stock */}
          {(item.sku || stockCount !== null) && (
            <div className="flex items-center gap-3 text-xs text-txt-secondary">
              {item.sku && <span>SKU: {selectedVariant?.sku || item.sku}</span>}
              {stockCount !== null && stockCount !== undefined && (
                <span className={stockCount > 0 ? "text-emerald" : "text-coral"}>
                  {stockCount > 0 ? `${stockCount} in stock` : "Out of stock"}
                </span>
              )}
              {item.is_digital && (
                <span className="bg-blue-500/15 text-blue-400 px-2 py-0.5 rounded-full text-[10px] font-bold">
                  Digital
                </span>
              )}
            </div>
          )}

          {/* Description */}
          {item.description && (
            <p className="text-sm text-txt-secondary leading-relaxed">
              {item.description}
            </p>
          )}

          {/* Video section */}
          {hasVideo && (
            <div>
              <h3 className="text-xs font-bold text-txt-secondary uppercase tracking-wider mb-2">
                Product Video
              </h3>
              {item.mux_playback_id ? (
                <div className="relative aspect-video rounded-xl overflow-hidden bg-card">
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
                    className="absolute inset-0 flex items-center justify-center bg-black/20"
                  >
                    <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="#111">
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
                  className="flex items-center gap-3 rounded-xl bg-card border border-border-subtle p-3 press"
                >
                  <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gold">
                      <path d="M8 5v14l11-7z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold">Watch Video</p>
                    <p className="text-[10px] text-txt-secondary">Opens in new tab</p>
                  </div>
                </a>
              ) : null}
            </div>
          )}

          {/* Variant Picker */}
          {variantsLoading ? (
            <div className="py-2">
              <div className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto" />
            </div>
          ) : hasVariants ? (
            <div>
              <h3 className="text-xs font-bold text-txt-secondary uppercase tracking-wider mb-2">
                Options
              </h3>
              <div className="flex flex-wrap gap-2">
                {variants.map((v) => {
                  const isSelected = selectedVariant?.id === v.id;
                  const vOutOfStock = v.stock_count !== null && v.stock_count <= 0;
                  return (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(isSelected ? null : v)}
                      disabled={vOutOfStock}
                      className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all press ${
                        isSelected
                          ? "bg-gold text-midnight border border-gold"
                          : vOutOfStock
                          ? "bg-white/5 text-txt-secondary/40 border border-border-subtle cursor-not-allowed line-through"
                          : "bg-white/[0.06] text-white border border-border-subtle hover:border-gold/30"
                      }`}
                    >
                      {v.name}
                      {v.price_override !== null && v.price_override !== item.price && (
                        <span className="ml-1.5 text-xs opacity-70">
                          ${(v.price_override / 100).toFixed(2)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {needsVariantSelection && (
                <p className="text-[10px] text-gold/70 mt-1.5">
                  Please select an option
                </p>
              )}
            </div>
          ) : null}
        </div>

        {/* Add to Cart fixed bottom */}
        <div className="p-5 pt-3 border-t border-border-subtle bg-deep">
          <button
            onClick={handleAdd}
            disabled={isOutOfStock || needsVariantSelection}
            className="w-full bg-gradient-to-r from-gold to-gold-light text-midnight font-bold py-3.5 rounded-xl press disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-midnight">
              <path d="M9 3v12M3 9h12" />
            </svg>
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
