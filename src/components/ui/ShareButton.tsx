"use client";

import { useState, useCallback } from "react";
import clsx from "clsx";

interface ShareButtonProps {
  url?: string;
  title?: string;
  text?: string;
  className?: string;
}

export default function ShareButton({
  url,
  title,
  text,
  className,
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");

  const handleShare = useCallback(async () => {
    // Try native share first (mobile)
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: title || document.title,
          text,
          url: shareUrl,
        });
        return;
      } catch {
        // User cancelled or share failed, fall through to clipboard
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Last resort fallback
      const textarea = document.createElement("textarea");
      textarea.value = shareUrl;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [shareUrl, title, text]);

  return (
    <div className="relative inline-flex">
      <button
        onClick={handleShare}
        className={clsx(
          "inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm",
          "text-txt-secondary hover:text-txt-primary hover:bg-white/5",
          "transition-colors press cursor-pointer",
          className
        )}
        aria-label="Share"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
          <polyline points="16 6 12 2 8 6" />
          <line x1="12" y1="2" x2="12" y2="15" />
        </svg>
        Share
      </button>

      {/* Copied tooltip */}
      {copied && (
        <span className="absolute -top-9 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg bg-deep border border-border-subtle text-xs text-gold font-medium whitespace-nowrap shadow-lg animate-in fade-in slide-in-from-bottom-1">
          Link copied!
        </span>
      )}
    </div>
  );
}
