"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useCart } from "@/lib/cart";
import type { MenuItem } from "@/types/database";

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

  // Build image list: main image + gallery
  const images: string[] = [];
  if (item?.image_url) images.push(item.image_url);
  if (item?.gallery_urls?.length) {
    for (const url of item.gallery_urls) {
      if (!images.includes(url)) images.push(url);
    }
  }

  // Reset active image when item changes
  useEffect(() => {
    setActiveImage(0);
    if (scrollRef.current) scrollRef.current.scrollLeft = 0;
  }, [item?.id]);

  // Handle scroll snap to track active image
  function handleScroll() {
    if (!scrollRef.current) return;
    const scrollLeft = scrollRef.current.scrollLeft;
    const width = scrollRef.current.clientWidth;
    const idx = Math.round(scrollLeft / width);
    setActiveImage(idx);
  }

  function handleAdd() {
    if (!item) return;
    dispatch({
      type: "ADD_ITEM",
      payload: {
        menu_item_id: item.id,
        name: item.name,
        price: item.price,
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
                  {/* Video play overlay on first image if video exists */}
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

            {/* Dots indicator */}
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
            <span className="text-4xl opacity-30">
              {item.is_digital ? "📱" : "📦"}
            </span>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Name + Price */}
          <div>
            <h2 className="font-heading text-xl font-bold">{item.name}</h2>
            <p className="text-lg font-heading font-bold text-gold mt-1">
              ${(item.price / 100).toFixed(2)}
            </p>
          </div>

          {/* SKU + Stock */}
          {(item.sku || item.stock_count !== null) && (
            <div className="flex items-center gap-3 text-xs text-txt-secondary">
              {item.sku && <span>SKU: {item.sku}</span>}
              {item.stock_count !== null && item.stock_count !== undefined && (
                <span
                  className={
                    item.stock_count > 0
                      ? "text-emerald"
                      : "text-coral"
                  }
                >
                  {item.stock_count > 0
                    ? `${item.stock_count} in stock`
                    : "Out of stock"}
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

          {/* Size/Variant Placeholder */}
          <div>
            <h3 className="text-xs font-bold text-txt-secondary uppercase tracking-wider mb-2">
              Options
            </h3>
            <div className="flex gap-2">
              {["S", "M", "L", "XL"].map((size) => (
                <div
                  key={size}
                  className="w-10 h-10 rounded-lg border border-border-subtle flex items-center justify-center text-xs font-bold text-txt-secondary opacity-50 cursor-not-allowed"
                >
                  {size}
                </div>
              ))}
            </div>
            <p className="text-[10px] text-txt-secondary mt-1.5 italic">
              Size selection coming soon
            </p>
          </div>
        </div>

        {/* Add to Cart fixed bottom */}
        <div className="p-5 pt-3 border-t border-border-subtle bg-deep">
          <button
            onClick={handleAdd}
            disabled={item.stock_count !== null && item.stock_count !== undefined && item.stock_count <= 0}
            className="w-full bg-gradient-to-r from-gold to-gold-light text-midnight font-bold py-3.5 rounded-xl press disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-midnight">
              <path d="M9 3v12M3 9h12" />
            </svg>
            {item.stock_count !== null && item.stock_count !== undefined && item.stock_count <= 0
              ? "Out of Stock"
              : "Add to Cart"}
          </button>
        </div>
      </div>
    </div>
  );
}
