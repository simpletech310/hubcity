"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { AdDecision } from "@/lib/ads";
import { fetchAd, fireTracking, recordImpression } from "@/lib/ads";

interface VideoAdOverlayProps {
  contentId: string;
  onAdComplete: () => void;
  zone?: string;
}

export default function VideoAdOverlay({
  contentId,
  onAdComplete,
  zone = "video_preroll",
}: VideoAdOverlayProps) {
  const [ad, setAd] = useState<AdDecision | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(0);
  const [canSkip, setCanSkip] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const impressionFired = useRef(false);

  // Fetch ad on mount
  useEffect(() => {
    let cancelled = false;
    fetchAd(zone, contentId).then((result) => {
      if (cancelled) return;
      if (!result) {
        onAdComplete();
        return;
      }
      setAd(result);
      setCountdown(result.duration || 15);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fire impression once ad is displayed
  useEffect(() => {
    if (ad && !impressionFired.current) {
      impressionFired.current = true;
      fireTracking(ad.impression_url);
      recordImpression(ad, zone, contentId);
    }
  }, [ad, zone, contentId]);

  // Countdown timer
  useEffect(() => {
    if (!ad || loading) return;

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          onAdComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Enable skip after 5 seconds
    const skipTimer = setTimeout(() => setCanSkip(true), 5000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      clearTimeout(skipTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ad, loading]);

  const handleSkip = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    onAdComplete();
  }, [onAdComplete]);

  const handleCtaClick = useCallback(() => {
    if (!ad) return;
    fireTracking(ad.click_url);
    window.open(ad.cta_url, "_blank", "noopener");
  }, [ad]);

  if (loading) {
    return (
      <div className="absolute inset-0 z-20 bg-midnight flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
      </div>
    );
  }

  if (!ad) return null;

  return (
    <div className="absolute inset-0 z-20 bg-midnight flex flex-col">
      {/* Ad label */}
      <div className="absolute top-3 left-3 z-30 flex items-center gap-2">
        <span className="text-[10px] font-bold text-gold uppercase tracking-wider bg-black/60 px-2 py-1 rounded">
          Ad &bull; {countdown}s
        </span>
      </div>

      {/* Skip button */}
      <div className="absolute top-3 right-3 z-30">
        {canSkip ? (
          <button
            onClick={handleSkip}
            className="text-[11px] font-bold text-white bg-white/20 hover:bg-white/30 backdrop-blur-sm px-3 py-1.5 rounded transition-colors press"
          >
            Skip Ad &raquo;
          </button>
        ) : (
          <span className="text-[10px] text-white/50 bg-black/40 px-2 py-1 rounded">
            Skip in {Math.max(0, 5 - ((ad.duration || 15) - countdown))}s
          </span>
        )}
      </div>

      {/* Ad content */}
      <div className="flex-1 flex items-center justify-center">
        {ad.video_url ? (
          <video
            ref={videoRef}
            src={ad.video_url}
            autoPlay
            playsInline
            className="w-full h-full object-contain"
            onEnded={handleSkip}
            onError={handleSkip}
          />
        ) : (
          /* Image / text card fallback */
          <div className="max-w-md mx-auto px-6 text-center">
            {ad.image_url && (
              <div className="w-full aspect-video rounded-2xl overflow-hidden mb-5 border border-border-subtle">
                <img
                  src={ad.image_url}
                  alt={ad.business_name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <p className="text-gold text-[10px] font-bold uppercase tracking-wider mb-2">
              Sponsored
            </p>
            <h3 className="font-heading font-bold text-lg text-white mb-2">
              {ad.business_name}
            </h3>
            <p className="text-sm text-txt-secondary mb-4">{ad.headline}</p>
            {ad.body_text && (
              <p className="text-xs text-txt-secondary/70 mb-4">{ad.body_text}</p>
            )}
            <button
              onClick={handleCtaClick}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-gold to-gold-light text-midnight font-bold text-sm shadow-lg shadow-gold/20 press hover:opacity-90 transition-opacity"
            >
              {ad.cta_text || "Learn More"}
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M3 7h8M8 3l4 4-4 4" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Bottom progress */}
      <div className="h-1 bg-white/10">
        <div
          className="h-full bg-gold transition-all duration-1000 ease-linear"
          style={{
            width: `${ad.duration > 0 ? ((ad.duration - countdown) / ad.duration) * 100 : 0}%`,
          }}
        />
      </div>
    </div>
  );
}
