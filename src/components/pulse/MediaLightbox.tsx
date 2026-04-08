"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface MediaLightboxProps {
  type: "image" | "video";
  src: string;
  alt?: string;
  onClose: () => void;
}

export default function MediaLightbox({ type, src, alt, onClose }: MediaLightboxProps) {
  const [dims, setDims] = useState<{ width: number; height: number } | null>(null);
  const touchStartY = useRef(0);
  const [translateY, setTranslateY] = useState(0);

  const getViewport = useCallback(() => ({
    w: Math.min(window.innerWidth, 430),
    h: window.innerHeight - 60,
  }), []);

  const calculateFit = useCallback(
    (mediaW: number, mediaH: number) => {
      const vp = getViewport();
      const scale = Math.min(vp.w / mediaW, vp.h / mediaH);
      setDims({
        width: Math.round(mediaW * scale),
        height: Math.round(mediaH * scale),
      });
    },
    [getViewport]
  );

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const dy = e.touches[0].clientY - touchStartY.current;
    if (dy > 0) setTranslateY(dy);
  };

  const handleTouchEnd = () => {
    if (translateY > 120) {
      onClose();
    } else {
      setTranslateY(0);
    }
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    calculateFit(e.currentTarget.naturalWidth, e.currentTarget.naturalHeight);
  };

  const handleVideoMeta = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    calculateFit(e.currentTarget.videoWidth, e.currentTarget.videoHeight);
  };

  const mediaStyle: React.CSSProperties = dims
    ? { width: `${dims.width}px`, height: `${dims.height}px` }
    : { maxWidth: "100vw", maxHeight: "100vh", width: "auto", height: "auto" };

  const opacity = Math.max(0, 1 - translateY / 300);

  return (
    <div
      className="fixed inset-0 z-[200] bg-black flex items-center justify-center"
      style={{ opacity }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-[env(safe-area-inset-top,12px)] right-4 z-20 w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white press mt-2"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>

      {/* Media container */}
      <div
        className="flex items-center justify-center"
        style={{ transform: `translateY(${translateY}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {type === "image" ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={src}
            alt={alt || "Post media"}
            onLoad={handleImageLoad}
            style={mediaStyle}
          />
        ) : (
          <video
            src={src}
            controls
            playsInline
            autoPlay
            onLoadedMetadata={handleVideoMeta}
            style={mediaStyle}
          />
        )}
      </div>
    </div>
  );
}
