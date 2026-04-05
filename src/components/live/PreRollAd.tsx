"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

const MuxPlayer = dynamic(() => import("@mux/mux-player-react"), {
  ssr: false,
});

interface PreRollAdProps {
  playbackId: string;
  ctaText: string;
  ctaUrl: string;
  businessName: string;
  adId: string;
  onComplete: () => void;
  onSkip: () => void;
}

export default function PreRollAd({
  playbackId,
  ctaText,
  ctaUrl,
  businessName,
  adId,
  onComplete,
  onSkip,
}: PreRollAdProps) {
  const [skipCountdown, setSkipCountdown] = useState(3);
  const [canSkip, setCanSkip] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSkipCountdown((prev) => {
        if (prev <= 1) {
          setCanSkip(true);
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleCtaClick = useCallback(() => {
    // Track the click
    fetch(`/api/ads/${adId}/click`, { method: "POST" }).catch(() => {});
  }, [adId]);

  return (
    <div className="animate-fade-in">
      {/* Back / context bar */}
      <div className="flex items-center gap-3 px-5 pt-4 mb-4">
        <div className="flex-1 min-w-0">
          <p className="font-heading font-bold text-sm text-txt-secondary">
            Your video will play after this ad
          </p>
        </div>
      </div>

      {/* Ad player */}
      <div className="px-5 mb-4">
        <div className="relative rounded-2xl overflow-hidden border border-border-subtle shadow-lg shadow-black/40">
          {/* Ad badge */}
          <div className="absolute top-3 left-3 z-20">
            <span className="px-2 py-1 rounded-md bg-black/70 backdrop-blur-sm text-[10px] font-bold text-gold tracking-wider uppercase border border-gold/30">
              Ad
            </span>
          </div>

          {/* Skip button */}
          <div className="absolute top-3 right-3 z-20">
            {canSkip ? (
              <button
                onClick={onSkip}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.15] backdrop-blur-sm border border-white/20 text-white text-[12px] font-semibold hover:bg-white/[0.25] transition-colors press"
              >
                Skip Ad
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 4l10 8-10 8V4z" />
                  <line x1="19" y1="5" x2="19" y2="19" />
                </svg>
              </button>
            ) : (
              <span className="px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10 text-white/70 text-[12px] font-medium">
                Skip in {skipCountdown}...
              </span>
            )}
          </div>

          {/* Mux Player */}
          <MuxPlayer
            playbackId={playbackId}
            streamType="on-demand"
            autoPlay
            accentColor="#F2A900"
            style={{ aspectRatio: "16/9", width: "100%" }}
            metadata={{ video_title: `Ad: ${businessName}` }}
            onEnded={onComplete}
          />

          {/* CTA overlay at bottom */}
          <div className="absolute bottom-0 inset-x-0 z-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-10">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] text-white/60 mb-0.5">Sponsored</p>
                <p className="text-[14px] font-heading font-bold text-white truncate">
                  {businessName}
                </p>
              </div>
              <Link
                href={ctaUrl}
                onClick={handleCtaClick}
                className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gold text-midnight font-heading text-[13px] font-bold press hover:bg-gold-light transition-colors shadow-lg shadow-gold/20"
              >
                {ctaText || "Shop Now"}
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
