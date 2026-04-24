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
      {/* Back / context bar — printed kicker */}
      <div className="flex items-center gap-3 px-5 pt-4 mb-4">
        <div className="flex-1 min-w-0">
          <p
            className="c-kicker"
            style={{ fontSize: 10, color: "var(--ink-strong)", opacity: 0.7, letterSpacing: "0.14em" }}
          >
            YOUR VIDEO WILL PLAY AFTER THIS AD
          </p>
        </div>
      </div>

      {/* Ad player — hard-corner frame with gold foil bar */}
      <div className="px-5 mb-4">
        <div
          className="relative overflow-hidden"
          style={{ border: "2px solid var(--rule-strong-c)" }}
        >
          {/* Gold foil bar top — "SPONSORED BROADCAST" press banner */}
          <div
            className="flex items-center justify-between px-3 py-1.5"
            style={{
              background: "var(--gold-c)",
              borderBottom: "2px solid var(--rule-strong-c)",
            }}
          >
            <span
              className="c-kicker"
              style={{ fontSize: 10, color: "var(--ink-strong)", letterSpacing: "0.18em" }}
            >
              § AD · SPONSORED BROADCAST
            </span>
            {canSkip ? (
              <button
                onClick={onSkip}
                className="flex items-center gap-1 c-kicker press"
                style={{
                  background: "var(--ink-strong)",
                  color: "var(--gold-c)",
                  border: "2px solid var(--ink-strong)",
                  fontSize: 10,
                  letterSpacing: "0.14em",
                  padding: "3px 8px",
                }}
              >
                SKIP AD
                <svg
                  width="10"
                  height="10"
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
              <span
                className="c-kicker tabular-nums"
                style={{
                  color: "var(--ink-strong)",
                  opacity: 0.7,
                  fontSize: 10,
                  letterSpacing: "0.14em",
                }}
              >
                SKIP IN {skipCountdown}
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

          {/* CTA footer — ink body, gold CTA, hard corners */}
          <div
            className="flex items-center justify-between gap-3 px-4 py-3"
            style={{
              background: "var(--ink-strong)",
              borderTop: "2px solid var(--rule-strong-c)",
            }}
          >
            <div className="min-w-0">
              <p
                className="c-kicker"
                style={{ fontSize: 9, color: "var(--gold-c)", letterSpacing: "0.16em" }}
              >
                SPONSORED
              </p>
              <p
                className="c-card-t truncate"
                style={{ fontSize: 14, color: "var(--paper)", marginTop: 2 }}
              >
                {businessName}
              </p>
            </div>
            <Link
              href={ctaUrl}
              onClick={handleCtaClick}
              className="shrink-0 c-btn c-btn-primary c-btn-sm press"
            >
              {(ctaText || "Shop Now").toUpperCase()}
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ marginLeft: 6 }}
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
