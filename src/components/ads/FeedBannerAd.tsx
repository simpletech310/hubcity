"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Card from "@/components/ui/Card";
import type { AdDecision } from "@/lib/ads";
import { fetchAd, fireTracking, recordImpression } from "@/lib/ads";

interface FeedBannerAdProps {
  zone?: string;
  className?: string;
}

export default function FeedBannerAd({
  zone = "feed_banner",
  className = "",
}: FeedBannerAdProps) {
  const [ad, setAd] = useState<AdDecision | null>(null);
  const [visible, setVisible] = useState(false);
  const impressionFired = useRef(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Fetch ad on mount
  useEffect(() => {
    let cancelled = false;
    fetchAd(zone).then((result) => {
      if (cancelled) return;
      setAd(result);
    });
    return () => {
      cancelled = true;
    };
  }, [zone]);

  // Fire impression when card becomes visible
  useEffect(() => {
    if (!ad || !cardRef.current || impressionFired.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (!impressionFired.current) {
            impressionFired.current = true;
            fireTracking(ad.impression_url);
            recordImpression(ad, zone);
          }
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [ad]);

  const handleCtaClick = useCallback(() => {
    if (!ad) return;
    fireTracking(ad.click_url);
    window.open(ad.cta_url, "_blank", "noopener");
  }, [ad]);

  if (!ad) return null;

  return (
    <div
      ref={cardRef}
      className={`animate-fade-in ${className}`}
    >
      <Card className="relative overflow-hidden">
        {/* Gold top accent */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-gold/60 to-gold-light/40" />

        {/* Sponsored label */}
        <div className="flex items-center gap-1.5 mb-3">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-gold">
            <path
              d="M12 2L14.09 8.26L21 9.27L16 14.14L17.18 21.02L12 17.77L6.82 21.02L8 14.14L3 9.27L9.91 8.26L12 2Z"
              fill="currentColor"
              opacity="0.3"
            />
            <path
              d="M12 2L14.09 8.26L21 9.27L16 14.14L17.18 21.02L12 17.77L6.82 21.02L8 14.14L3 9.27L9.91 8.26L12 2Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-[9px] font-bold text-gold uppercase tracking-wider">
            Sponsored
          </span>
        </div>

        {/* Main content row */}
        <div className="flex gap-3">
          {/* Business image */}
          {ad.image_url && (
            <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-border-subtle bg-white/5">
              <img
                src={ad.image_url}
                alt={ad.business_name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Text content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-heading font-bold text-[13px] mb-0.5 truncate">
              {ad.business_name}
            </h3>
            <p className="text-[12px] text-txt-secondary leading-relaxed line-clamp-2 mb-2.5">
              {ad.headline}
            </p>
            {ad.body_text && (
              <p className="text-[11px] text-txt-secondary/70 line-clamp-1 mb-2">
                {ad.body_text}
              </p>
            )}
          </div>
        </div>

        {/* CTA button */}
        <button
          onClick={handleCtaClick}
          className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gold/10 border border-gold/20 text-gold font-bold text-[12px] press hover:bg-gold/15 transition-colors"
        >
          {ad.cta_text || "Learn More"}
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 7h8M8 3l4 4-4 4" />
          </svg>
        </button>

        {/* Subtle "Ad" disclaimer */}
        <p className="text-[8px] text-txt-secondary/40 text-center mt-2">
          Ad &bull; {ad.business_name}
        </p>
      </Card>
    </div>
  );
}
