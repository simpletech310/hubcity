"use client";

import { useEffect, useState } from "react";

interface AdData {
  title?: string;
  imageUrl?: string;
  clickUrl: string;
  impressionUrl: string;
  ctaText?: string;
}

interface AdZoneProps {
  zone: string;
  className?: string;
}

export default function AdZone({ zone, className }: AdZoneProps) {
  const [ad, setAd] = useState<AdData | null>(null);

  useEffect(() => {
    async function fetchAd() {
      try {
        const res = await fetch(`/api/ads/decision?zone=${zone}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.ad) {
          setAd(data.ad);
          // Fire impression pixel
          if (data.ad.impressionUrl) {
            const img = new Image();
            img.src = data.ad.impressionUrl;
          }
        }
      } catch {
        // Silently fail — no ad to show
      }
    }
    fetchAd();
  }, [zone]);

  if (!ad) return null;

  return (
    <a
      href={ad.clickUrl}
      target="_blank"
      rel="noopener noreferrer sponsored"
      onClick={() => {
        fetch(`/api/ads/click`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ zone }),
        }).catch(() => {});
      }}
      className={`block overflow-hidden glass-card hover:border-gold/20 transition-all duration-300 ${className || ""}`}
      style={{ border: "2px solid var(--rule-strong-c)" }}
    >
      {ad.imageUrl && (
        <div className="aspect-[3/1]" style={{ background: "var(--paper)" }}>
          <img src={ad.imageUrl} alt={ad.title || "Sponsored"} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-heading font-semibold uppercase tracking-wider mb-0.5" style={{ color: "var(--ink-mute)" }}>Sponsored</p>
          {ad.title && (
            <p className="text-sm font-semibold truncate" style={{ color: "var(--ink-strong)" }}>{ad.title}</p>
          )}
        </div>
        <span className="text-xs font-semibold text-gold shrink-0 ml-3">
          {ad.ctaText || "Learn More"} →
        </span>
      </div>
    </a>
  );
}
