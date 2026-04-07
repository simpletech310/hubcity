"use client";

import Image from "next/image";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useCart } from "@/lib/cart";
import type { MenuItem } from "@/types/database";

interface MenuItemCardProps {
  item: MenuItem;
  isRetail?: boolean;
  onTap?: (item: MenuItem) => void;
}

export default function MenuItemCard({ item, isRetail, onTap }: MenuItemCardProps) {
  const { dispatch } = useCart();

  function handleAdd(e: React.MouseEvent) {
    e.stopPropagation();
    dispatch({
      type: "ADD_ITEM",
      payload: {
        menu_item_id: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
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
        className="rounded-2xl bg-card border border-border-subtle overflow-hidden press hover:border-gold/20 transition-colors cursor-pointer"
      >
        {/* Product Image */}
        <div className="relative aspect-square bg-midnight/50">
          {item.image_url ? (
            <Image
              src={item.image_url}
              alt={item.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-3xl opacity-20">
                {item.is_digital ? "phone" : "cart"}
              </span>
            </div>
          )}

          {/* Video play overlay */}
          {hasVideo && (
            <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          )}

          {/* Gallery indicator */}
          {hasGallery && (
            <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm flex items-center gap-1">
              <svg width="10" height="10" fill="none" stroke="white" strokeWidth="2">
                <rect x="1" y="1" width="8" height="8" rx="1" />
              </svg>
              <span className="text-[9px] font-bold text-white">
                {(item.gallery_urls?.length ?? 0) + (item.image_url ? 1 : 0)}
              </span>
            </div>
          )}

          {/* Out of stock overlay */}
          {outOfStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-xs font-bold text-white bg-coral/80 px-2 py-1 rounded-lg">
                Sold Out
              </span>
            </div>
          )}

          {/* Digital badge */}
          {item.is_digital && (
            <div className="absolute bottom-2 left-2 bg-blue-500/80 backdrop-blur-sm text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
              Digital
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <h3 className="text-[13px] font-bold truncate">{item.name}</h3>
          {item.description && (
            <p className="text-[10px] text-txt-secondary mt-0.5 line-clamp-1">
              {item.description}
            </p>
          )}
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm font-heading font-bold text-gold">
              ${(item.price / 100).toFixed(2)}
            </span>
            <button
              onClick={handleAdd}
              disabled={outOfStock}
              className="w-7 h-7 rounded-lg bg-gold/10 flex items-center justify-center press disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-gold">
                <path d="M7 2v10M2 7h10" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Standard list layout (restaurant) - enhanced with image support
  return (
    <Card>
      <div
        className={`flex items-start gap-3 ${onTap ? "cursor-pointer" : ""}`}
        onClick={() => onTap?.(item)}
      >
        {/* Product image thumbnail */}
        {item.image_url && (
          <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-card">
            <Image
              src={item.image_url}
              alt={item.name}
              fill
              className="object-cover"
            />
            {hasVideo && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <div className="w-6 h-6 rounded-full bg-white/80 flex items-center justify-center">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="#111">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h3 className="text-[13px] font-bold truncate">{item.name}</h3>
          {item.description && (
            <p className="text-[11px] text-txt-secondary mt-0.5 line-clamp-2">
              {item.description}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1.5">
            <p className="text-sm font-heading font-bold text-gold">
              ${(item.price / 100).toFixed(2)}
            </p>
            {item.is_digital && (
              <span className="bg-blue-500/15 text-blue-400 px-1.5 py-0.5 rounded text-[9px] font-bold">
                Digital
              </span>
            )}
            {outOfStock && (
              <span className="text-[10px] text-coral font-bold">Sold Out</span>
            )}
          </div>
        </div>

        <Button
          size="sm"
          onClick={handleAdd}
          className="shrink-0 mt-1"
          disabled={outOfStock}
        >
          Add
        </Button>
      </div>

      {/* Horizontal image scroller for gallery */}
      {hasGallery && (
        <div className="mt-2.5 -mx-1 flex gap-2 overflow-x-auto scrollbar-hide px-1 pb-1">
          {item.gallery_urls.map((url, i) => (
            <div
              key={i}
              className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-card"
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
    </Card>
  );
}
